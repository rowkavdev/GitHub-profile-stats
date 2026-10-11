import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const theme = { bg: '#1a1b27', border: '#414868', text: '#7aa2f7', title: '#bb9af7' };
const options = { max_langs: 12, hide_title: false, hide_border: false, border_radius: 4.5 };
for (const renderer of ['default', 'horizontal-list', 'vertical-list']) {
  test(`${renderer} leaves visible space for tiny nonzero languages`, () => {
    const render = loadRoute(`lib/svg/languages/renderers/${renderer}.ts`).default;
    const languages = Array.from({ length: 12 }, (_, i) => ({ name: `Language ${i}`, color: '#3178c6', size: i === 0 ? 1000000 : 1 }));
    const svg = render(languages, 1000011, theme, options);
    const segments = [...svg.matchAll(/<rect x="([\d.]+)" y="(?:40|42)" width="([\d.]+)" height="10" fill=/g)].map(m => ({ x: Number(m[1]), width: Number(m[2]) }));
    assert.equal(segments.length, 12);
    assert.ok(segments.every(s => s.x + s.width <= 470));
    assert.ok(segments.every(s => s.width >= 2));
  });
}
