import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const render = loadRoute('lib/svg/languages/renderers/stacked.ts').default;
const theme = { bg: '#1a1b27', border: '#414868', text: '#7aa2f7', title: '#bb9af7' };
const options = { max_langs: 12, hide_title: false, hide_border: false, border_radius: 4.5, layout: 'stacked' };

test('dominant-language bar stays inside the card with many tiny languages', () => {
  const languages = Array.from({ length: 12 }, (_, i) => ({ name: `Language ${i}`, color: '#3178c6', size: i === 0 ? 1000000 : 1 }));
  const svg = render(languages, 1000011, theme, options);
  const segments = [...svg.matchAll(/<rect x="([\d.]+)" y="38" width="([\d.]+)" height="16"/g)].map(m => ({ x: Number(m[1]), width: Number(m[2]) }));
  assert.equal(segments.length, 12);
  assert.ok(segments.every(s => s.x + s.width <= 473));
  assert.equal(segments.reduce((sum, s) => sum + s.width, 0), 451);
  assert.ok(segments.every(s => s.width >= 3));
});
test('ordinary equal language proportions stay unchanged', () => {
  const svg = render([{ name: 'A', size: 1 }, { name: 'B', size: 1 }], 2, theme, options);
  assert.match(svg, /x="22" y="38" width="226"/);
  assert.match(svg, /x="248" y="38" width="225"/);
});
