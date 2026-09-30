import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
const require = createRequire(import.meta.url);
const ts = require('typescript');
export function loadRoute(relative, mocks = {}) {
  const root = path.resolve('src');
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === 'next/server') return {};
      if (!id.startsWith('.') && !id.startsWith('@/')) return require(id);
      let resolved = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(file), id);
      if (!existsSync(resolved) || !path.extname(resolved)) {
        resolved = existsSync(resolved + '.ts') ? resolved + '.ts' : path.join(resolved, 'index.ts');
      }
      return load(resolved);
    };
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return load(path.join(root, relative));
}
