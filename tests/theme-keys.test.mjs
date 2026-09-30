import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { join, dirname } from 'node:path';
import ts from 'typescript';

function load(relative, stubs) {
  const file = join(process.cwd(), relative);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = new Module(file);
  loaded.filename = file;
  loaded.paths = Module._nodeModulePaths(dirname(file));
  const nativeRequire = createRequire(file);
  loaded.require = (id) => stubs[id] ?? nativeRequire(id);
  loaded._compile(code, file);
  return loaded.exports;
}
const themes = {default:{bg:'#000',text:'#fff',title:'#eee',icon:'#bbb',border:'#ccc'}, dark:{bg:'#111',text:'#eee',title:'#fff',icon:'#ddd',border:'#aaa'}};
const {resolveTheme} = load('src/lib/themes/themes.ts', {'./configs/registry':{themes}});
// Profile options are parsed from the same source via a transpiled module, with unrelated imports stubbed.
const {resolveProfileCardOptions} = load('src/lib/profile-card.ts', {'@/lib/sanitize':{sanitizeHexParam:()=>undefined}, '@/lib/types':{}, '@/lib/github':{}, '@/lib/social-card-layout':{PROFILE_CARD_STYLES:['github','compact','split','editorial','minimal']}});

for (const name of ['__proto__', 'constructor', 'toString']) {
  test(`invalid inherited theme ${name} falls back on both card families`, () => {
    assert.deepEqual(resolveTheme(name, {}), resolveTheme('default', {}));
    const social = resolveProfileCardOptions(new URLSearchParams({ theme: name })).theme;
    assert.deepEqual(social, resolveProfileCardOptions(new URLSearchParams({theme: 'github'})).theme);
  });
}
