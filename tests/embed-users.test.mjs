import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { dirname, join } from 'node:path';
import ts from 'typescript';

function load(file, stubs) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = new Module(file);
  loaded.filename = file;
  loaded.paths = Module._nodeModulePaths(dirname(file));
  const nativeRequire = createRequire(file);
  loaded.require = (id) => stubs[id] ?? nativeRequire(id);
  loaded._compile(code, file);
  return loaded.exports;
}
const recorded = [];
const middleware = load(join(process.cwd(), 'src/middleware.ts'), {
  'next/server': { NextResponse: { next: () => ({ status: 200 }) } },
  '@upstash/redis': { Redis: class { sadd(key, value) { recorded.push(value); return Promise.resolve(); } } },
  // The tested URLs carry only known parameters, so nothing redirects.
  '@/lib/card-query': { canonicalCardUrl: () => null },
});
const route = load(join(process.cwd(), 'src/app/api/card/route.ts'), {
  '@/lib/github': { fetchGitHubStats: async (name) => { if(name === 'missing') throw new Error('not found'); return {username:name}; }, parseExtraOwners: () => [] },
  '@/lib/svg': { renderCard: () => '<svg/>', renderErrorCard: () => '<svg>error</svg>' },
  '@/lib/themes/themes': { resolveTheme: () => ({}) },
  '@/lib/sanitize': { sanitizeUsername: (name) => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(name.trim()) ? name.trim() : null, sanitizeHexParam: () => undefined },
  '@/lib/cache': { getCacheHeaders: () => ({}) },
  '@/lib/tracking': { trackUser: async (name) => { recorded.push(name.toLowerCase()); } },
});

function req(name) { return { nextUrl: new URL('https://ghstats.dev/api/card?username=' + encodeURIComponent(name)) }; }

test('the adoption counter ignores invalid and failed card requests', async () => {
  await middleware.middleware(req('<bad>'));
  assert.equal((await route.GET(req('<bad>'))).status, 400);
  await middleware.middleware(req('missing'));
  assert.equal((await route.GET(req('missing'))).status, 500);
  assert.deepEqual(recorded, []);
});

test('a successfully generated card records one normalized username', async () => {
  await middleware.middleware(req('OctoCat'));
  assert.equal((await route.GET(req('OctoCat'))).status, 200);
  assert.deepEqual(recorded, ['octocat']);
});
