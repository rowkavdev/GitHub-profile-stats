import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const { renderSparkline } = loadRoute('lib/svg/sparkline/index.ts');
const { estimateTextWidth } = loadRoute('lib/svg/text-metrics.ts');
const theme = { bg: '#1a1b27', border: '#414868', text: '#7aa2f7', title: '#bb9af7' };
const days = [{ date: '2026-10-01', contributionCount: 12345 }];
const options = { days: 30, width: 180, height: 80, hide_border: false, border_radius: 6 };

test('sparkline title reserves space for the latest count at minimum width', () => {
  const svg = renderSparkline(days, theme, { ...options, custom_title: 'Very long contribution history title that overlaps' });
  const label = svg.match(/class="sl-title">([^<]*)<\/text>/)[1];
  const available = 180 - 28 - estimateTextWidth('Today: 12345', 11) - 12;
  assert.ok(estimateTextWidth(label, 12) <= available);
  assert.match(label, /…$/);
  assert.match(svg, /<title>Very long contribution history title that overlaps<\/title>/);
  assert.match(svg, /Today: 12345/);
});
test('sparkline default title stays unchanged when it fits', () => {
  assert.match(renderSparkline(days, theme, { ...options, width: 320 }), /class="sl-title">Last 1 day<\/text>/);
});
test('sparkline default title keeps the plural for more than one day', () => {
  const two = [...days, { date: '2026-10-02', contributionCount: 1 }];
  assert.match(renderSparkline(two, theme, { ...options, width: 320 }), /class="sl-title">Last 2 days<\/text>/);
});
