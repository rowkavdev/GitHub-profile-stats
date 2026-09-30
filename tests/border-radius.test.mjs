import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
for (const route of ['card', 'langs', 'sparkline']) {
  test(`${route} preserves zero radius, defaults invalid input and clamps extremes`, async () => {
    let radius;
    const render = (...args) => { radius = args.at(-1).border_radius; return '<svg/>'; };
    const { GET } = loadRoute(`app/api/${route}/route.ts`, {
      '@/lib/github': { fetchGitHubStats: async () => ({}), fetchLanguageStats: async () => [], parseExtraOwners: () => [] },
      '@/lib/tracking': { trackUser: async () => {} },
      '@/lib/svg': { renderCard: render, renderLanguageChart: render, renderSparkline: render, renderErrorCard: () => '<svg/>' },
    });
    for (const [value, expected] of [['0', 0], ['', route === 'sparkline' ? 6 : 4.5], ['bad', route === 'sparkline' ? 6 : 4.5], ['-3', 0], ['999', 50], ['2.5', 2.5]]) {
      const response = await GET({ nextUrl: new URL(`http://local?username=octocat&border_radius=${value}`) });
      assert.equal(response.status, 200);
      assert.equal(radius, expected, value);
    }
  });
}

test('all three real SVG renderers receive sharp corners', async () => {
  const stats = { username: 'octocat', name: 'Octocat', totalStars: 1, totalCommits: 2, totalPRs: 3, totalIssues: 4, estimatedCodingHours: 5, currentStreak: 1, longestStreak: 1, commitsThisWeek: 2, commitsLastWeek: 1, weeklyTrend: 100, avgCommitsPerDay: 1, mostActiveDay: 'Monday', publicRepos: 1, followers: 1, contributionsThisYear: 2, activityLevel: 30, grade: 'B', languages: [], contributionDays: [{ date: '2026-09-30', contributionCount: 3 }] };
  for (const route of ['card', 'langs', 'sparkline']) {
    const { GET } = loadRoute(`app/api/${route}/route.ts`, {
      '@/lib/github': { fetchGitHubStats: async () => stats, fetchLanguageStats: async () => [{ name: 'JavaScript', size: 100, color: '#f7df1e', percentage: 100 }], parseExtraOwners: () => [] },
      '@/lib/tracking': { trackUser: async () => {} },
    });
    const response = await GET({ nextUrl: new URL('http://local?username=octocat&border_radius=0') });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<rect[^>]*rx="0"/, route);
  }
});
