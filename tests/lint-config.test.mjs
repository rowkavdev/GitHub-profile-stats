import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
test('real lint catches unused variables and does not merely run TypeScript', () => {
  const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
  assert.match(pkg.scripts.lint, /eslint/);
  const eslint = `${root}node_modules/eslint/bin/eslint.js`;
  assert.ok(existsSync(eslint), 'eslint is not installed in this checkout; run npm ci first');
  const result = spawnSync(process.execPath, [eslint, '--stdin', '--stdin-filename', 'src/lib/lint-probe.ts'], { cwd: root, input: 'const unused = 1;\nexport {};\n', encoding: 'utf8' });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /no-unused-vars/);
});
