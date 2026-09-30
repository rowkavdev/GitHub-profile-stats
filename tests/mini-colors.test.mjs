import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { GET } = loadRoute('app/api/mini/route.ts', { '@/lib/github': { parseExtraOwners: () => [], fetchGitHubStats: async () => ({ totalPRs: 9, followers: 7 }) } });
async function badge(query) { return (await GET({ nextUrl: new URL('http://local/api/mini?username=octocat&' + query) })).text(); }
test('mini metrics default to distinct declared colors', async () => {
  assert.match(await badge('metric=prs'), /#8b5cf6/i);
  assert.match(await badge('metric=followers'), /#22c55e/i);
});
test('explicit color wins; invalid color falls back to metric', async () => {
  assert.match(await badge('metric=prs&color=abcdef'), /#abcdef/i);
  assert.match(await badge('metric=prs&color=bad-input'), /#8b5cf6/i);
});
test('named theme still styles badge but preserves the metric accent', async () => {
  assert.match(await badge('metric=followers&theme=light'), /#22c55e/i);
});
