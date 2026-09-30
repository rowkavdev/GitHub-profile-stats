import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
let calls = [];
const { GET } = loadRoute('app/api/visits/route.ts', { '@/lib/tracking': { trackVisit: async () => { calls.push('global'); return 1; }, trackView: async (...args) => { calls.push(args); return 1; } } });
test('repo-only and malformed visits requests never mutate counters', async () => {
  for (const query of ['repo=valid-repo', 'repo=valid-repo&username=', 'username=%3Cbad%3E', 'username=octocat&repo=%3Cbad%3E']) {
    calls = [];
    assert.equal((await GET({ nextUrl: new URL('http://local/api/visits?' + query) })).status, 400, query);
    assert.deepEqual(calls, []);
  }
});
test('legacy global, profile and owner/repo paths stay valid', async () => {
  for (const [query, expected] of [['', 'global'], ['username=octocat', ['octocat', undefined]], ['username=octocat&repo=valid-repo', ['octocat', 'valid-repo']]]) {
    calls = [];
    assert.equal((await GET({ nextUrl: new URL('http://local/api/visits?' + query) })).status, 200);
    assert.deepEqual(calls, [expected]);
  }
});
