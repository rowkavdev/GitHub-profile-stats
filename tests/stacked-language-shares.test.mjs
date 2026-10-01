import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
import { readFileSync } from 'node:fs';
test('stacked bars compute widths without carrying an unused share value into rendering', () => {
  const source = readFileSync('src/lib/svg/languages/renderers/stacked.ts', 'utf8');
  assert.doesNotMatch(source, /segments\.map\(\(\{ lang, pct, w \}/);
  assert.match(source, /Math\.round\(\(pct \/ 100\) \* BAR_W\)/);
  const module = loadRoute('lib/svg/languages/renderers/stacked.ts');
  assert.ok(Object.values(module).some(value => typeof value === 'function'));
});
