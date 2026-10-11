import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const theme = { bg: '#1a1b27', border: '#414868', text: '#7aa2f7', title: '#bb9af7' };
const options = { max_langs: 12, hide_title: false, hide_border: false, border_radius: 4.5 };
for (const renderer of ['donut', 'donut-vertical']) {
  test(`${renderer} full-circle shortcut has the same outer/inner bounds as slices`, () => {
    const render = loadRoute(`lib/svg/languages/renderers/${renderer}.ts`).default;
    const svg = render([{ name: 'TypeScript', color: '#3178c6', size: 100 }], 100, theme, options);
    const circle = svg.match(/<circle cx="[\d.]+" cy="[\d.]+" r="([\d.]+)" fill="none" stroke="#3178c6" stroke-width="([\d.]+)"/);
    assert.ok(circle);
    const radius = Number(circle[1]);
    const stroke = Number(circle[2]);
    assert.ok(Math.abs(radius + stroke / 2 - 72) < 0.0001);
    assert.ok(Math.abs(radius - stroke / 2 - 72 * 0.62) < 0.0001);
  });
}
