import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { GET } = loadRoute('app/api/mini/route.ts', { '@/lib/github': { parseExtraOwners: () => [], fetchGitHubStats: async () => ({ totalPRs: 9, followers: 7 }) } });
const badge = async (label) => (await GET({ nextUrl: new URL('http://local/api/mini?username=octocat&metric=prs&label=' + encodeURIComponent(label)) })).text();

test('a label cut at 32 never splits an emoji', async () => {
  assert.match(await badge('a'.repeat(31) + '😀'), /😀/);
});

test('a label is still capped at 32 code points', async () => {
  const svg = await badge('a'.repeat(31) + '😀😀😀');
  assert.equal((svg.match(/😀/g) ?? []).length > 0, true);
  assert.doesNotMatch(svg, /😀😀/);
  assert.doesNotMatch(await badge('b'.repeat(40)), /b{33}/);
});
