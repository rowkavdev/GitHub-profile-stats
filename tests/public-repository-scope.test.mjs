import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubStats, fetchLanguageStats } from '../src/lib/github.ts';

test('public cards exclude token-visible private repositories from stats and languages', async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'test-only';
  const repo = (stars, name) => ({ stargazerCount: stars, languages: { edges: [{ size: 100, node: { name, color: '#123456' } }] } });
  globalThis.fetch = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    const nodes = [repo(2, 'JavaScript')];
    if (!/privacy:\s*PUBLIC/.test(query)) nodes.push(repo(90, 'PrivateFixtureLanguage'));
    return Response.json({ data: { user: {
      login: 'fixture', followers: { totalCount: 0 }, repositories: { totalCount: nodes.length, nodes },
      contributionsCollection: { totalCommitContributions: 0, totalPullRequestContributions: 0, totalIssueContributions: 0,
        contributionCalendar: { totalContributions: 0, weeks: [] } },
    } } });
  };
  try {
    const stats = await fetchGitHubStats('fixture');
    assert.equal(stats.publicRepos, 1);
    assert.equal(stats.totalStars, 2);
    assert.deepEqual(stats.languages.map(x => x.name), ['JavaScript']);
    assert.deepEqual((await fetchLanguageStats('fixture')).map(x => x.name), ['JavaScript']);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = originalToken;
  }
});
