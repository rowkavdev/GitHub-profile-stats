import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { dirname, join } from 'node:path';
import ts from 'typescript';

// Load the REAL src/lib/sanitize.ts (no mocks) so this exercises production logic.
const file = join(process.cwd(), 'src/lib/sanitize.ts');
const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(file);
loaded.filename = file;
loaded.paths = Module._nodeModulePaths(dirname(file));
loaded.require = createRequire(file);
loaded._compile(code, file);
const { sanitizeUsername } = loaded.exports;

test('accepts legacy GitHub usernames ending in a hyphen (issue #196: Nek- is a real account)', () => {
  assert.equal(sanitizeUsername('Nek-'), 'Nek-');
});

test('trailing hyphens are permitted generally, not only a single one (legacy accounts are not enumerable)', () => {
  assert.equal(sanitizeUsername('nek--'), 'nek--');
});

test('preserves the existing internal-hyphen contract, including consecutive hyphens', () => {
  assert.equal(sanitizeUsername('a-b'), 'a-b');
  assert.equal(sanitizeUsername('a--b'), 'a--b');
});

test('accepts single-character and maximum-length usernames', () => {
  assert.equal(sanitizeUsername('a'), 'a');
  assert.equal(sanitizeUsername('a'.repeat(39)), 'a'.repeat(39));
  assert.equal(sanitizeUsername('a'.repeat(38) + '-'), 'a'.repeat(38) + '-');
});

test('still rejects leading hyphens, overlength, empty and non-ASCII input', () => {
  assert.equal(sanitizeUsername('-nek'), null);
  assert.equal(sanitizeUsername('-'), null);
  assert.equal(sanitizeUsername(''), null);
  assert.equal(sanitizeUsername('   '), null);
  assert.equal(sanitizeUsername('a'.repeat(40)), null);
  assert.equal(sanitizeUsername('ne k'), null);
  assert.equal(sanitizeUsername('nék'), null);
  assert.equal(sanitizeUsername('<script>'), null);
});

test('trims surrounding whitespace before validating', () => {
  assert.equal(sanitizeUsername('  octocat  '), 'octocat');
  assert.equal(sanitizeUsername('  Nek-  '), 'Nek-');
});
