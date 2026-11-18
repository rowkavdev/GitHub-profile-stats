import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { renderBadge } = loadRoute('lib/svg/badge/index.ts');
const { STYLE_CONFIGS } = loadRoute('lib/svg/badge/configs/registry.ts');

test('uppercase styles preserve valid XML entities in custom labels and values', () => {
  for (const [style, config] of Object.entries(STYLE_CONFIGS)) {
    if (!config.uppercase) continue;
    const svg = renderBadge('A & B <C>', '"quoted"', '4c8eda', style);
    assert.doesNotMatch(svg, /&(?:AMP|LT|GT|QUOT|APOS);/);
    assert.match(svg, /A &amp; B &lt;C&gt;/);
    assert.match(svg, /&quot;QUOTED&quot;/);
  }
});
test('XML escaping does not inflate badge width beyond its visible text', () => {
  const width = svg => Number(svg.match(/width="(\d+)"/)[1]);
  assert.equal(width(renderBadge('A&B', '1')), width(renderBadge('AXB', '1')));
  assert.match(renderBadge('A & B', '1'), /A &amp; B/);
});
