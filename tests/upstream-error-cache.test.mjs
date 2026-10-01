import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
for (const route of ['card', 'mini', 'langs', 'sparkline']) {
  test(`${route} upstream failures are not cached as a successful badge`, async () => {
    const { GET } = loadRoute(`app/api/${route}/route.ts`, {
      '@/lib/github': { fetchGitHubStats: async () => { throw new Error('temporary upstream failure'); }, parseExtraOwners: () => [] },
      '@/lib/tracking': { trackUser: async () => {} },
    });
    const response = await GET({ nextUrl: new URL(`https://ghstats.dev/api/${route}?username=octocat`) });
    assert.equal(response.status, 500);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('vercel-cdn-cache-control'), 'no-store');
  });
}
