import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const { getVisibleStats } = loadRoute('lib/svg/stats-fields.ts');
const base = {
  username: 'octocat', name: 'Octo', avatarUrl: '', bio: null, totalStars: 4, totalCommits: 10, totalPRs: 1, totalIssues: 9,
  estimatedCodingHours: 10, currentStreak: 18, longestStreak: 30, commitsThisWeek: 1, commitsLastWeek: 1, weeklyTrend: 0,
  avgCommitsPerDay: 1, mostActiveDay: 'Monday', publicRepos: 28, followers: 20, contributionsThisYear: 4000, activityLevel: 70, grade: 'A',
  languages: [], contributionDays: [],
};
const value = (stats, key) => getVisibleStats(stats, [], undefined).find((item) => item.short === key)?.value;

test('a one-day streak and a one-commit week use the singular unit', () => {
  assert.equal(value({ ...base, currentStreak: 1 }, 'Streak'), '1 day');
  assert.equal(value({ ...base, commitsThisWeek: 1 }, 'Trend'), '1 commit');
});
test('other counts keep the plural unit', () => {
  for (const n of [0, 2, 18]) {
    assert.equal(value({ ...base, currentStreak: n }, 'Streak'), `${n} days`);
    assert.equal(value({ ...base, commitsThisWeek: n }, 'Trend'), `${n} commits`);
  }
});
