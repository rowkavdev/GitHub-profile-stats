import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
process.env.UPSTASH_REDIS_REST_URL = 'https://example.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
const calls = [];
class Redis {
  async eval(...args) { calls.push(args); return 1762; }
  async get(key) { calls.push(['get', key]); return 1761; }
}
const tracking = loadRoute('lib/tracking.ts', { '@upstash/redis': { Redis } });
test('every novel counter is atomically incremented and given finite retention', async () => {
  calls.length = 0;
  for (let i = 0; i < 200; i++) assert.equal(await tracking.trackView(`nonexistent${i}`, `repo${i}`), 1762);
  assert.equal(calls.length, 200);
  for (const [script, keys, args] of calls) {
    assert.match(script, /INCR/);
    assert.match(script, /EXPIRE/);
    assert.equal(keys.length, 1);
    assert.deepEqual(args, [90 * 24 * 60 * 60]);
    assert.doesNotMatch(script, /DEL|SET|HLEN/);
  }
});
test('existing counter names and totals survive without a new namespace or refusal', async () => {
  calls.length = 0;
  assert.equal(await tracking.trackView('OctoCat', 'Hello-World'), 1762);
  assert.deepEqual(calls[0][1], ['views:octocat/hello-world']);
  calls.length = 0;
  assert.equal(await tracking.getViewCount('OctoCat', 'Hello-World'), 1761);
  assert.deepEqual(calls, [['get', 'views:octocat/hello-world']]);
});
