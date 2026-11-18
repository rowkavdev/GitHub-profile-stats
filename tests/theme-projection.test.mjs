import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
import { readFileSync } from 'node:fs';
test('resolved themes strip builder metadata without discarding an unused binding', () => {
  assert.doesNotMatch(readFileSync('src/lib/themes/configs/registry.ts', 'utf8'), /\(\{ key, showIn,/);
  const { themes } = loadRoute('lib/themes/configs/registry.ts');
  for (const theme of Object.values(themes)) {
    assert.equal('showIn' in theme, false);
    assert.equal('key' in theme, false);
    assert.equal(typeof theme.bg, 'string');
  }
});
