import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { fetchRepositoryCardData } = loadRoute('lib/profile-card.ts');
test('repository open issue count excludes PRs rather than trusting combined REST total', async () => {
  const original = globalThis.fetch; let query;
  globalThis.fetch = async url => {
    if (url.includes('/search/issues')) { query = new URL(url).searchParams.get('q'); return Response.json({ total_count: 1, incomplete_results: false, items: [{ id: 1 }] }); }
    if (url.includes('/contributors')) return Response.json([]);
    if (url.includes('/commits')) return Response.json([]);
    return Response.json({ owner: { login: 'owner' }, name: 'repo', open_issues_count: 16, contributors_url: 'https://api.github.com/repos/owner/repo/contributors', commits_url: 'https://api.github.com/repos/owner/repo/commits{/sha}', stargazers_count: 0, forks_count: 0 });
  };
  try { assert.equal((await fetchRepositoryCardData('owner', 'repo')).openIssues, 1); assert.equal(query, 'repo:owner/repo is:issue is:open'); }
  finally { globalThis.fetch = original; }
});
test('failed issue-only query cannot silently fall back to inflated total', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => url.includes('/search/issues') ? new Response('{}', { status: 403 }) : Response.json({ owner: { login: 'owner' }, name: 'repo', open_issues_count: 16 });
  try { await assert.rejects(fetchRepositoryCardData('owner', 'repo')); } finally { globalThis.fetch = original; }
});
