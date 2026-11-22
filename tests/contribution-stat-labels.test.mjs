import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const stats = {
  username: 'octocat', name: 'Octocat', avatarUrl: '', avatarDataUri: '', bio: null,
  totalStars: 0, totalCommits: 15, totalPRs: 2, totalIssues: 3,
  estimatedCodingHours: 10, currentStreak: 1, longestStreak: 3, commitsThisWeek: 5,
  commitsLastWeek: 1, weeklyTrend: 400, avgCommitsPerDay: 2.5, mostActiveDay: 'Monday',
  publicRepos: 0, followers: 0, contributionsThisYear: 20, activityLevel: 10,
  grade: 'D', languages: [], contributionDays: [
    { date: '2025-12-31', contributionCount: 15 },
    { date: '2026-01-01', contributionCount: 5 },
  ],
};

const github = { fetchGitHubStats: async () => stats, parseExtraOwners: () => [] };

test('standard and compact cards distinguish rolling and all-time commit totals', async () => {
  const { GET } = loadRoute('app/api/card/route.ts', {
    '@/lib/github': github,
    '@/lib/tracking': { trackUser: async () => {} },
  });
  for (const compact of ['', '&size=compact&order=commits,contributions']) {
    const url = 'https://local.test/api/card?username=octocat' + compact;
    const request = (url) => ({ nextUrl: new URL(url) });
    assert.match(await (await GET(request(url))).text(), /Commits \(Past Year\)/);
    assert.match(await (await GET(request(url + '&alltime=true'))).text(), /Commits \(All Time\)/);
    assert.match(await (await GET(request(url))).text(), /Contributions \(Past Year\)/);
  }
});

test('mini and social card label a cross-year calendar as the past year', async () => {
  const { GET } = loadRoute('app/api/mini/route.ts', { '@/lib/github': github });
  const response = await GET({ nextUrl: new URL('https://local.test/api/mini?username=octocat&metric=contributions') });
  assert.match(await response.text(), /Past Year Contributions: 20/);
  const { renderProfileCard, resolveProfileCardOptions } = loadRoute('lib/profile-card.ts');
  const svg = renderProfileCard(stats, resolveProfileCardOptions(new URLSearchParams('type=contributions')));
  assert.match(svg, />contributions in the past year</);
  assert.match(svg, />Commits \(past year\)</);
});

test('calendar weekly and daily aggregates use contribution labels and counts', () => {
  const { getVisibleStats } = loadRoute('lib/svg/stats-fields.ts');
  const [week, trend, average] = getVisibleStats(stats, [], ['week', 'trend', 'avg']);
  assert.equal(week.label, 'Contributions This Week');
  assert.equal(week.value, '5');
  assert.equal(trend.label, 'Weekly Contribution Trend');
  assert.equal(trend.value, '5');
  assert.equal(average.label, 'Avg Contributions / Day');
  assert.equal(average.value, '2.5');
});
