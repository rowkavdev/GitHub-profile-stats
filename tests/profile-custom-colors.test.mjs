import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const cards = loadRoute('lib/profile-card.ts');
const keys = ['bg', 'panel', 'text', 'muted', 'accent', 'border'];
const repo = { owner: 'sample', name: 'repo', description: 'Color control', avatarDataUri: '', contributors: 1, commits: 1, openIssues: 0, stars: 1, forks: 0, languages: [] };
const profile = { username: 'sample', name: 'Sample', bio: 'Color control', avatarDataUri: '', followers: 1, publicRepos: 1, totalStars: 1, contributionsThisYear: 1, contributionDays: [{ date: '2026-01-01', contributionCount: 1 }], currentStreak: 1, longestStreak: 1, totalCommits: 1, languages: [] };

for (const key of keys) {
  for (const value of ['abc', 'abcd', 'abcdef', 'abcdef12', 'ABCDEF', '#abcdef']) {
    test(`profile override ${key}=${value} produces a CSS hex color`, () => {
      const options = cards.resolveProfileCardOptions(new URLSearchParams({ [key]: value }));
      assert.equal(options.theme[key], '#' + value.replace(/^#/, ''));
      for (const other of keys.filter(name => name !== key)) assert.equal(options.theme[other], cards.PROFILE_THEMES.github[other]);
    });
  }
}

for (const theme of Object.keys(cards.PROFILE_THEMES)) {
  test(`preset ${theme} and invalid overrides remain unchanged`, () => {
    const original = cards.resolveProfileCardOptions(new URLSearchParams({ theme }));
    assert.deepEqual(original.theme, cards.PROFILE_THEMES[theme]);
    for (const value of ['', 'ab', 'abcde', 'abcdefg', '##abcdef', 'red', '<svg>']) {
      const options = cards.resolveProfileCardOptions(new URLSearchParams({ theme, ...Object.fromEntries(keys.map(key => [key, value])) }));
      assert.deepEqual(options, original);
      assert.equal(cards.renderRepositoryCard(repo, options), cards.renderRepositoryCard(repo, original));
      assert.equal(cards.renderProfileCard(profile, options), cards.renderProfileCard(profile, original));
    }
  });
}

for (const style of cards.PROFILE_CARD_STYLES) {
  test(`custom colors reach repository and profile SVG attributes in ${style}`, () => {
    const options = cards.resolveProfileCardOptions(new URLSearchParams({ style, bg: 'fedcba', text: '123456', muted: 'abcdef', border: '654321' }));
    for (const [render, data] of [[cards.renderRepositoryCard, repo], [cards.renderProfileCard, profile]]) {
      const svg = render(data, options);
      for (const value of ['fedcba', '123456', 'abcdef', '654321']) assert.match(svg, new RegExp(`(?:fill|stroke)="#${value}"`));
      assert.doesNotMatch(svg, /(?:fill|stroke)="(?:fedcba|123456|abcdef|654321)"/);
    }
  });
}

test('contribution layout uses all custom theme colors with prefixes', () => {
  const options = cards.resolveProfileCardOptions(new URLSearchParams({ type: 'contributions', ...Object.fromEntries(keys.map((key, i) => [key, ['fedcba','234567','345678','456789','56789a','6789ab'][i]])) }));
  const svg = cards.renderProfileCard(profile, options);
  for (const value of Object.values(options.theme)) {
    assert.match(value, /^#[a-f0-9]{6}$/);
    assert.ok(svg.includes(`"${value}"`), value);
  }
});
