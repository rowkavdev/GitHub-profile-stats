import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubStats } from '../src/lib/github.ts';

async function streaks(days, now) {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'test-only';
  const realNow = Date.now;
  Date.now = () => Date.parse(now);
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [Date.parse(now)])); }
  };
  globalThis.fetch = async () => Response.json({ data: { user: {
    login: 'fixture', followers: { totalCount: 0 }, repositories: { totalCount: 0, nodes: [] },
    contributionsCollection: { totalCommitContributions: 0, totalPullRequestContributions: 0, totalIssueContributions: 0,
      contributionCalendar: { totalContributions: days.length, weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })) }] } },
  } } });
  try {
    const stats = await fetchGitHubStats('fixture');
    return { current: stats.currentStreak, longest: stats.longestStreak };
  } finally {
    globalThis.Date = RealDate;
    Date.now = realNow;
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = originalToken;
  }
}

test('missing calendar dates break a streak', async () => {
  const result = await streaks([['2026-09-28', 1], ['2026-09-30', 1]], '2026-10-02T12:00:00Z');
  assert.deepEqual(result, { current: 0, longest: 1 });
});

test('a last active day older than yesterday is not a current streak', async () => {
  const result = await streaks([['2026-09-29', 1], ['2026-09-30', 1]], '2026-10-02T12:00:00Z');
  assert.deepEqual(result, { current: 0, longest: 2 });
});

test('an empty today keeps the streak that ran through yesterday', async () => {
  const result = await streaks([['2026-09-30', 1], ['2026-10-01', 1], ['2026-10-02', 0]], '2026-10-02T12:00:00Z');
  assert.deepEqual(result, { current: 2, longest: 2 });
});

test('a complete calendar still counts consecutive days', async () => {
  const result = await streaks([['2026-09-29', 0], ['2026-09-30', 1], ['2026-10-01', 1], ['2026-10-02', 1]], '2026-10-02T12:00:00Z');
  assert.deepEqual(result, { current: 3, longest: 3 });
});
