import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);

test('Vercel analytics v2 keeps the Next.js component entry point', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.dependencies['@vercel/analytics'], '^2.0.1');
  const analytics = require('@vercel/analytics/next');
  assert.equal(typeof analytics.Analytics, 'function');
  assert.match(readFileSync('src/app/layout.tsx', 'utf8'), /import \{ Analytics \} from "@vercel\/analytics\/next"/);
});
