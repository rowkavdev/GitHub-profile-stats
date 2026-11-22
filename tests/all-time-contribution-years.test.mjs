import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubStats } from '../src/lib/github.ts';

test('all-time stats count January 1 once across adjacent years', async (t) => {
  const previousToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'fixture';
  t.after(() => {
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
  });

  t.mock.method(globalThis, 'fetch', async (_url, { body }) => {
    const { query } = JSON.parse(body);
    const ranges = [...query.matchAll(/(y\d+): contributionsCollection\(from: "([^"]+)", to: "([^"]+)"\)/g)];
    if (ranges.length === 0) return Response.json({ data: { user: {
      login: 'sample',
      followers: { totalCount: 0 },
      repositories: { nodes: [], totalCount: 0 },
      contributionsCollection: {
        contributionYears: [2025, 2024],
        contributionCalendar: { weeks: [], totalContributions: 2 },
      },
    } } });

    assert.equal(ranges.length, 2);
    const events = [
      { at: '2024-12-31T23:59:59Z', commits: 1, prs: 0, issues: 1 },
      { at: '2025-01-01T00:00:00Z', commits: 3, prs: 2, issues: 1 },
    ];
    return Response.json({ data: { user: Object.fromEntries(ranges.map(([, year, from, to]) => {
      const included = events.filter(({ at }) => at >= from && at <= to);
      return [year, {
        totalCommitContributions: included.reduce((sum, event) => sum + event.commits, 0),
        totalPullRequestContributions: included.reduce((sum, event) => sum + event.prs, 0),
        totalIssueContributions: included.reduce((sum, event) => sum + event.issues, 0),
      }];
    })) } });
  });

  const result = await fetchGitHubStats('sample', true);
  assert.equal(result.totalCommits, 4);
  assert.equal(result.totalPRs, 2);
  assert.equal(result.totalIssues, 2);
  assert.equal(result.estimatedCodingHours, 5.8);
  assert.equal(result.contributionsThisYear, 2);
});
