import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { getCacheHeaders, getMiniMetricCacheProfile } from '../src/lib/cache.ts';

const path = join(process.cwd(), 'src/app/api/mini/route.ts');
const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(path);
loaded.filename = path;
loaded.paths = Module._nodeModulePaths(dirname(path));
const nativeRequire = createRequire(path);
loaded.require = (id) => {
  if (id === '@/lib/github') return { fetchGitHubStats: async () => ({ totalStars: 42 }), parseExtraOwners: () => [] };
  if (id === '@/lib/svg/badge' || id === '../../../lib/svg/badge') return { renderBadge: (label, value) => `<svg>${label}:${value}</svg>`, resolveBadgeStyle: () => 'flat' };
  if (id === '@/lib/svg') return { renderErrorCard: () => '<svg>error</svg>' };
  if (id === '@/lib/themes/themes') return { resolveTheme: () => ({ title: '#abc', text: '#abc', border: '#abc' }) };
  if (id === '@/lib/sanitize') return { sanitizeUsername: (v) => v, sanitizeHexParam: () => undefined, formatNumber: String };
  if (id === '@/lib/cache') return { getCacheHeaders, getMiniMetricCacheProfile };
  return nativeRequire(id);
};
loaded._compile(code, path);

for (const metric of ['__proto__', 'constructor', 'toString']) {
  test(`invalid inherited metric ${metric} falls back without crashing`, async () => {
    const request = { nextUrl: new URL(`https://ghstats.dev/api/mini?username=octocat&metric=${metric}`) };
    const response = await loaded.exports.GET(request);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Stars:42/);
    assert.match(response.headers.get('Cache-Control') ?? '', /s-maxage=1800/);
  });
}
