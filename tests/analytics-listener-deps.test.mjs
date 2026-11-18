import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('cross-tab analytics listener depends on a stable withdrawal callback', () => {
  const source=readFileSync('src/components/GoogleAnalyticsConsent.tsx','utf8');
  assert.match(source,/applyChoice=useCallback\(/);
  assert.match(source,/\},\[applyChoice\]\)/);
  assert.ok(source.indexOf('applyChoice=useCallback')<source.indexOf("window.addEventListener('storage'"));
});
