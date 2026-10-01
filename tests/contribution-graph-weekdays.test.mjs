import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const cards = loadRoute('lib/profile-card.ts');
const profile = { username:'rowkav09', name:'Rowan', bio:'', avatarDataUri:'', followers:1, publicRepos:1, totalStars:1, contributionsThisYear:3, totalPRs:0, languages:[], currentStreak:0, longestStreak:0, totalCommits:3 };
const cellPositions = svg => Object.fromEntries([...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="16" height="16" rx="3"[^>]*stroke-width="0.5"><title>(\d{4}-\d{2}-\d{2}):/g)].map(m => [m[3], { x:+m[1], y:+m[2] }]));
const render = days => cards.renderProfileCard({ ...profile, contributionDays: days.map(date => ({ date, contributionCount: 1 })) }, cards.resolveProfileCardOptions(new URLSearchParams('type=contributions')));

test('#164 a partial first week places days on their real weekday rows', () => {
  const pos = cellPositions(render(['2025-01-01', '2025-01-05', '2025-01-06']));
  const rowOf = date => (pos[date].y - pos['2025-01-05'].y) / 20;
  assert.equal(rowOf('2025-01-01'), 3, 'Wednesday sits on row 3');
  assert.equal(rowOf('2025-01-05'), 0, 'Sunday sits on row 0');
  assert.equal(rowOf('2025-01-06'), 1);
  assert.equal(pos['2025-01-05'].x - pos['2025-01-01'].x, 20, 'Sunday starts the next column');
  assert.equal(pos['2025-01-06'].x, pos['2025-01-05'].x);
});

test('#164 missing calendar dates leave a gap instead of shifting later days', () => {
  const pos = cellPositions(render(['2025-01-05', '2025-01-08']));
  assert.equal((pos['2025-01-08'].y - pos['2025-01-05'].y) / 20, 3);
  assert.equal(pos['2025-01-08'].x, pos['2025-01-05'].x);
});
