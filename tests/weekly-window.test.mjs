import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubStats } from '../src/lib/github.ts';
const RealDate = Date;
const today = '2026-03-30';
async function stats(days) {
  return fetchGitHubStats('octocat');
}
test('equal seven-day UTC windows yield zero trend and ignore future dates', async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.GITHUB_TOKEN;
  globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : ['2026-03-30T00:30:00Z'])); } };
  process.env.GITHUB_TOKEN = 'test-only';
  let days = Array.from({ length: 15 }, (_, i) => ({ date: new RealDate(RealDate.parse(today+'T00:00:00Z') - i * 86400000).toISOString().slice(0,10), contributionCount: 1 }));
  globalThis.fetch = async () => Response.json({ data: { user: {
    login: 'octocat', followers: { totalCount: 0 }, repositories: { totalCount: 0, nodes: [] },
    contributionsCollection: { totalCommitContributions: 15, totalPullRequestContributions: 0, totalIssueContributions: 0, contributionCalendar: { totalContributions: 15, weeks: [{ contributionDays: days }] } },
  } } });
  try {
    const flat = await stats();
    assert.equal(flat.commitsThisWeek, 7);
    assert.equal(flat.commitsLastWeek, 7);
    assert.equal(flat.weeklyTrend, 0);
    days = days.map(day => ({ ...day, contributionCount: day.date === '2026-03-23' ? 1 : 0 })).concat([{ date: '2026-03-31', contributionCount: 100 }]);
    const boundary = await stats();
    assert.equal(boundary.commitsThisWeek, 0);
    assert.equal(boundary.commitsLastWeek, 1);
    assert.equal(boundary.activityLevel, 0);
  } finally { globalThis.Date = RealDate; globalThis.fetch = originalFetch; if (originalToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = originalToken; }
});
