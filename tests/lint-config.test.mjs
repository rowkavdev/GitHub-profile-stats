import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
test('real lint catches unused variables and does not merely run TypeScript', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
  assert.match(pkg.scripts.lint, /eslint/);
  const result = spawnSync('node_modules/.bin/eslint', ['--stdin', '--stdin-filename', 'src/lib/lint-probe.ts'], { input: 'const unused = 1;\nexport {};\n', encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /no-unused-vars/);
});
