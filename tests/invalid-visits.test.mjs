import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { dirname, join } from 'node:path';
import ts from 'typescript';

const file = join(process.cwd(), 'src/app/api/visits/route.ts');
const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(file);
loaded.filename = file;
loaded.paths = Module._nodeModulePaths(dirname(file));
const nativeRequire = createRequire(file);
const writes = [];
loaded.require = (id) => {
  if (id === '@/lib/tracking') return { trackView: async (...args) => { writes.push(['view',...args]); return 1; }, trackVisit: async () => { writes.push(['global']); return 1; } };
  if (id === '../../../lib/svg/badge') return { renderBadge: (label, value) => `<svg>${label}:${value}</svg>`, resolveBadgeStyle: () => 'flat' };
  if (id === '@/lib/sanitize') return { sanitizeUsername: (v) => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(v.trim()) ? v.trim() : null };
  if (id === '@/lib/svg') return { renderErrorCard: () => '<svg>error</svg>' };
  if (id === '@/lib/themes/themes') return { resolveTheme: () => ({}) };
  if (id === '@/lib/cache') return { getCacheHeaders: () => ({}) };
  return nativeRequire(id);
};
loaded._compile(compiled, file);
const GET = loaded.exports.GET;
const req = (query) => ({nextUrl:new URL(`https://ghstats.dev/api/visits?${query}`)});

test('invalid supplied username and repo return 400 without changing any counter', async () => {
  assert.equal((await GET(req('username=%3Cbad%3E'))).status, 400);
  assert.equal((await GET(req('username=octocat&repo=%3Cbad%3E'))).status, 400);
  assert.deepEqual(writes, []);
});

test('omitted values still use the intended legacy/profile and repo counters', async () => {
  assert.equal((await GET(req('style=flat'))).status, 200);
  assert.equal((await GET(req('username=octocat'))).status, 200);
  assert.equal((await GET(req('username=octocat&repo=Hello-World'))).status, 200);
  assert.deepEqual(writes, [['global'],['view','octocat',undefined],['view','octocat','Hello-World']]);
});
