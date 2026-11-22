import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
process.env.UPSTASH_REDIS_REST_URL = 'https://example.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
let reads = 0, writes = 0, fetches = 0;
const snapshot = { checkedAt: new Date().toISOString(), overall: { status: 'operational', healthyCount: 8, totalCount: 8 }, endpoints: [] };
class Redis {
  async get() { reads++; return snapshot; }
  async set() { writes++; return 'OK'; }
  async lrange() { return []; }
  multi() { return { lpush() { writes++; return this; }, ltrim() { return this; }, expire() { return this; }, async exec() {} }; }
}
const { GET } = loadRoute('app/api/status/route.ts', { '@upstash/redis': { Redis } });
test('two public reads do not probe or write history', async () => {
  const original = global.fetch;
  global.fetch = async () => { fetches++; return new Response('ok'); };
  try {
    await GET(); await GET();
    assert.equal(fetches, 0);
    assert.equal(writes, 0);
    assert.equal(reads, 2);
  } finally { global.fetch = original; }
});
test('missing stored report is explicitly unavailable', async () => {
  const { GET } = loadRoute('app/api/status/route.ts', { '@/lib/status': { readStatusReport: async () => null } });
  assert.equal((await GET()).status, 503);
});
test('collector rejects absent, wrong and unicode credentials without collecting', async () => {
  let collections = 0;
  process.env.CRON_SECRET = 'secret';
  const { POST } = loadRoute('app/api/status/collect/route.ts', { '@/lib/status': { collectScheduledStatusReport: async () => { collections++; return snapshot; } } });
  for (const token of ['', 'Bearer wrong', 'Bearer sécret']) {
    assert.equal((await POST(new Request('https://local', { method: 'POST', headers: { authorization: token } }))).status, 401);
  }
  assert.equal(collections, 0);
  assert.equal((await POST(new Request('https://local', { method: 'POST', headers: { authorization: 'Bearer secret' } }))).status, 200);
  assert.equal(collections, 1);
  delete process.env.CRON_SECRET;
  assert.equal((await POST(new Request('https://local', { method: 'POST', headers: { authorization: 'Bearer secret' } }))).status, 401);
});
test('two overlapping scheduled collectors probe and write history only once', async () => {
  let locked = false, probes = 0, historyWrites = 0, stored = null;
  class Redis {
    async set(key, value, options) {
      if (key.startsWith('status:collection-lock:')) {
        assert.deepEqual(options, { nx: true, ex: 7200 });
        if (locked) return null;
        locked = true; return 'OK';
      }
      stored = value; return 'OK';
    }
    async get() { return stored; }
    async lrange() { return []; }
    multi() { return { lpush() { historyWrites++; return this; }, ltrim() { return this; }, expire() { return this; }, async exec() {} }; }
  }
  const { collectScheduledStatusReport } = loadRoute('lib/status.ts', { '@upstash/redis': { Redis } });
  const original = global.fetch;
  global.fetch = async () => { probes++; return new Response('ok'); };
  try {
    await Promise.all([collectScheduledStatusReport(), collectScheduledStatusReport()]);
    await collectScheduledStatusReport();
    assert.equal(probes, 8);
    assert.equal(historyWrites, 8);
    assert.equal(stored.overall.status, 'operational');
  } finally { global.fetch = original; }
});
test('stopped scheduling cannot publish an old operational snapshot', async () => {
  for (const checkedAt of [new Date(Date.now()- 2*3600000-1).toISOString(), 'bad-date', new Date(Date.now()+3600000).toISOString()]) {
    const { readStatusReport } = loadRoute('lib/status.ts', { '@upstash/redis': { Redis: class { async get() { return {...snapshot,checkedAt}; } } } });
    assert.equal(await readStatusReport(),null);
  }
});

test('a Redis read failure sends the public route to unavailable', async () => {
  class Redis {
    async get() { throw new Error('temporary Redis outage'); }
  }
  const { GET } = loadRoute('app/api/status/route.ts', { '@upstash/redis': { Redis } });
  assert.equal((await GET()).status, 503);
});

test('status badge reads the stored report and bounds caching by report age', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected self-fetch'); });
  let report = {
    ...snapshot,
    checkedAt: new Date(Date.now() - 2 * 3600000 + 30000).toISOString(),
    overall: { ...snapshot.overall, uptime24h: 99 },
  };
  class Redis {
    async get() { return report; }
  }
  const { GET } = loadRoute('app/api/status/badge/route.ts', { '@upstash/redis': { Redis } });
  const request = new Request('https://local.test/api/status/badge');
  const fresh = await GET(request);
  assert.equal(fresh.status, 200);
  assert.match(await fresh.text(), /99\.00%/);
  const age = Number(fresh.headers.get('CDN-Cache-Control').match(/s-maxage=(\d+)/)[1]);
  assert.ok(age > 0 && age <= 30);
  assert.equal(fetchMock.mock.callCount(), 0);
  report = { ...report, checkedAt: new Date(Date.now() - 2 * 3600000 - 1).toISOString() };
  const stale = await GET(request);
  assert.equal(stale.status, 503);
  assert.match(await stale.text(), /unknown/);
  assert.match(stale.headers.get('Cache-Control'), /no-store/);
});
