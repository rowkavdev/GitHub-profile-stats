import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('CI runs the real ESLint command before the production build', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.lint, 'eslint src tests --max-warnings 0');
  assert.match(workflow, /- name: Lint source and tests\s+run: bun run lint/);
  assert.ok(workflow.indexOf('run: bun run lint') < workflow.indexOf('run: bun run build'));
});
