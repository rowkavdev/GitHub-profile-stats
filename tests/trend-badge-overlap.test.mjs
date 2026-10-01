import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const { renderCard } = loadRoute('lib/svg/stats-card.ts');
const { resolveTheme } = loadRoute('lib/themes/themes.ts');
const theme = resolveTheme('tokyonight', {});
const base = {
  username: 'octocat', name: 'Octo', avatarUrl: '', bio: null, totalStars: 4, totalCommits: 4394, totalPRs: 1316, totalIssues: 9,
  estimatedCodingHours: 10, currentStreak: 18, longestStreak: 30, commitsThisWeek: 1761, commitsLastWeek: 1815, weeklyTrend: -3,
  avgCommitsPerDay: 251, mostActiveDay: 'Monday', publicRepos: 28, followers: 20, contributionsThisYear: 4000, activityLevel: 70, grade: 'A',
  languages: [], contributionDays: [],
};
const options = { theme: 'tokyonight', hide_border: false, hide_title: false, hide: [], show_icons: true, show_ring: true, border_radius: 4, size: 'default', compact_count: 4, show_emoji: false };

function trendRow(svg) {
  const row = svg.split('<g class="row"').find((chunk) => chunk.includes('Weekly Trend:'));
  const badge = /translate\(([\d.]+), [\d.]+\)">\s*<path[^>]*\/>\s*<text x="12"[^>]*>([^<]+)</.exec(row);
  const value = /<text x="([\d.]+)"[^>]*class="value" text-anchor="end">([^<]+)</.exec(row);
  const label = /<text x="([\d.]+)"[^>]*class="label">Weekly Trend:</.exec(row);
  return { badgeX: Number(badge[1]), badgeText: badge[2], valueRight: Number(value[1]), value: value[2], labelX: Number(label[1]) };
}

// Generous real-font widths: bold 14px digits are about 8px, 10px badge text about 6.5px.
const valueWidth = (text) => text.length * 8;
const badgeRight = (row) => row.badgeX + 12 + row.badgeText.length * 6.5;

test('the weekly trend badge never overlaps the right-aligned commits value', () => {
  for (const [commits, trend] of [[1761, -3], [5, 0], [12, 100], [99999, -100], [1815, 250]]) {
    for (const show_ring of [true, false]) {
      for (const show_icons of [true, false]) {
        const row = trendRow(renderCard({ ...base, commitsThisWeek: commits, weeklyTrend: trend }, theme, { ...options, show_ring, show_icons }));
        const valueLeft = row.valueRight - valueWidth(row.value);
        assert.ok(badgeRight(row) <= valueLeft - 4, `badge ends at ${badgeRight(row)} but value starts at ${valueLeft} (${commits}, ${trend}%, ring ${show_ring}, icons ${show_icons})`);
      }
    }
  }
});

test('the badge stays to the right of its label', () => {
  const row = trendRow(renderCard(base, theme, options));
  assert.ok(row.badgeX > row.labelX + 'Weekly Trend:'.length * 6);
});
