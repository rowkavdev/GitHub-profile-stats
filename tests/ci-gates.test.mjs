import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('CI runs the regression suite and type check before building', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(workflow, /run: bun run test/);
  assert.match(workflow, /run: bun x tsc --noEmit/);
  assert.ok(workflow.indexOf('run: bun run test') < workflow.indexOf('run: bun run build'));
});
