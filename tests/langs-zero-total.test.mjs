import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { renderLanguageChart } = loadRoute('lib/svg/languages/index.ts');
const theme = { bg: '#1a1b27', border: '#414868', text: '#7aa2f7', title: '#bb9af7' };
const base = { max_langs: 12, hide_title: false, hide_border: false, border_radius: 4.5 };

const layouts = ['bar', 'grid', 'stacked', 'donut', 'donut_vertical', 'compact', 'horizontal_list', 'vertical_list'];

for (const layout of layouts) {
  test(`${layout} layout renders the empty-data card when sizes total zero`, () => {
    const langs = [{ name: 'A', color: '#111111', size: 0 }, { name: 'B', color: '#222222', size: 0 }];
    const svg = renderLanguageChart(langs, theme, { ...base, layout });
    assert.ok(svg.includes('No language data'), `${layout} should render the empty-data card`);
    assert.ok(!svg.includes('NaN') && !svg.includes('Infinity'), `${layout} must not emit invalid geometry`);
  });
}

test('a positive total still renders the chart', () => {
  const langs = [{ name: 'A', color: '#111111', size: 0 }, { name: 'B', color: '#222222', size: 10 }];
  const svg = renderLanguageChart(langs, theme, { ...base, layout: 'bar' });
  assert.ok(!svg.includes('No language data'));
  assert.ok(svg.includes('<rect'));
});
