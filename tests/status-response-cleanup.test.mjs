import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

for (const status of [200, 503]) {
  for (const mode of ['settled', 'pending', 'rejecting', 'throwing']) {
    test(`status probes discard ${status} bodies without waiting (${mode})`, async () => {
      const originalFetch = globalThis.fetch;
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      let cancels = 0, reads = 0, timer;
      const bodies = [];
      globalThis.fetch = async () => {
        const body = new ReadableStream({
          pull() { reads++; },
          cancel() {
            cancels++;
            if (mode === 'pending') return new Promise(() => {});
            if (mode === 'rejecting') return Promise.reject(new Error('cleanup rejected'));
            if (mode === 'throwing') throw new Error('cleanup threw');
          },
        }, { highWaterMark: 0 });
        bodies.push(body);
        return new Response(body, { status });
      };
      try {
        const { collectStatusReport } = loadRoute('lib/status.ts', { '@upstash/redis': { Redis: class {} } });
        const report = await Promise.race([
          collectStatusReport(),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('cleanup blocked')), 300); }),
        ]);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(report.overall.status, status === 200 ? 'operational' : 'down');
        assert.equal(report.overall.healthyCount, status === 200 ? 8 : 0);
        assert.equal(report.endpoints.length, 8);
        for (const endpoint of report.endpoints) {
          assert.equal(endpoint.status, status);
          assert.equal(endpoint.ok, status === 200);
          assert.equal(endpoint.error, undefined);
          assert.ok(Number.isInteger(endpoint.responseTimeMs) && endpoint.responseTimeMs >= 0);
        }
        assert.equal(cancels, 8);
        assert.equal(reads, 0);
        assert.ok(bodies.every(body => !body.locked));
      } finally {
        clearTimeout(timer);
        globalThis.fetch = originalFetch;
        if (url === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = url;
        if (token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = token;
      }
    });
  }
}

test('adapter cancel throws and bodyless replies retain probe results', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0, cancels = 0;
  globalThis.fetch = async () => {
    requests++;
    return { status: 204, ok: true, ...(requests % 2 ? { body: { cancel() { cancels++; throw new Error('adapter cleanup'); } } } : {}) };
  };
  try {
    const { collectStatusReport } = loadRoute('lib/status.ts', { '@upstash/redis': { Redis: class {} } });
    const report = await collectStatusReport();
    assert.equal(report.overall.healthyCount, 8);
    assert.ok(report.endpoints.every(endpoint => endpoint.status === 204 && endpoint.error === undefined));
    assert.equal(cancels, 4);
  } finally { globalThis.fetch = originalFetch; }
});
