import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('status badge imports only used site metadata and avoids an unused error binding', () => {
  const source = readFileSync('src/app/api/status/badge/route.ts', 'utf8');
  assert.doesNotMatch(source, /import \{ SITE, SITE_ROUTES \}/);
  assert.doesNotMatch(source, /catch \(error\)/);
});
