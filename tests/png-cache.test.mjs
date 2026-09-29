import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { join } from 'node:path';
import ts from 'typescript';

const routePath = join(process.cwd(), 'src/app/api/profile/png/route.tsx');
const requireFromRoute = createRequire(routePath);

function loadRoute() {
  const source = readFileSync(routePath, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = new Module(routePath);
  module.filename = routePath;
  module.paths = Module._nodeModulePaths(join(process.cwd(), 'src/app/api/profile/png'));
  module.require = (id) => {
    if (id === 'next/og') return { ImageResponse: class extends Response { constructor() { super('png', { headers: { 'Content-Type': 'image/png' } }); } } };
    if (id === '@/lib/profile-card') return {
      parseRepository: (value) => value === 'octocat/Hello-World' ? { owner: 'octocat', repo: 'Hello-World' } : null,
      resolveProfileCardOptions: () => ({ width: 1200, height: 627 }),
      fetchRepositoryCardData: async () => ({ owner: 'octocat', name: 'Hello-World', ownerAvatarUrl: '' }),
      renderRepositoryCard: () => '<svg xmlns="http://www.w3.org/2000/svg"/>',
    };
    if (id === '@/lib/sanitize') return { sanitizeUsername: () => null };
    if (id === '@/lib/github') return {};
    if (id === '@/lib/cache') return requireFromRoute(join(process.cwd(), 'src/lib/cache.ts'));
    return requireFromRoute(id);
  };
  module._compile(compiled, routePath);
  return module.exports;
}

test('successful PNG card sets edge cache headers, matching the SVG default profile', async () => {
  const { GET } = loadRoute();
  const url = 'https://ghstats.dev/api/profile/png?repo=octocat%2FHello-World';
  const response = await GET({ nextUrl: new URL(url) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control') ?? '', /s-maxage=1800/);
  assert.match(response.headers.get('CDN-Cache-Control') ?? '', /s-maxage=1800/);
  assert.match(response.headers.get('Vercel-CDN-Cache-Control') ?? '', /s-maxage=1800/);
});
