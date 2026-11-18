import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync(new URL('../src/components/GoogleAnalyticsConsent.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const KEY = 'ghstats-analytics-consent';
function tab(storage) {
  const states = [], deps = [], cleanups = [], listeners = new Map(), commands = [];
  let cursor = 0, effects = [], path = '/octocat', reloads = 0;
  const window = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); } };
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const context = { exports: {}, require: id => id === 'react' ? {
    useCallback: fn => fn,
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = value; }]; },
    useEffect: (fn, next) => { const i = cursor++; if (!deps[i] || next.some((v, j) => v !== deps[i][j])) effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); }); deps[i] = next; },
  } : id === './analytics-consent-state' ? { readSavedChoice:()=>storage.get(KEY) ?? null, useConsentReady:()=>true } : id === 'next/navigation' ? { usePathname: () => path } : { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' },
  window, localStorage, document: { cookie: '_ga=fixture', createElement: () => ({}), head: { appendChild: () => {} } }, location: { hostname: 'ghstats.dev', reload: () => reloads++ }, Date };
  vm.runInNewContext(code, context);
  function render() { cursor = 0; effects = []; const tree = context.exports.default(); effects.forEach(fn => fn()); return tree; }
  render(); render(); window.gtag = (...args) => commands.push(args);
  return { render, window, commands, get reloads() { return reloads; }, navigate: next => { path = next; render(); },
    storageEvent: (value, key = KEY) => listeners.get('storage')?.({ key, newValue: value, storageArea: localStorage }),
    unmount: () => cleanups.forEach(fn => fn?.()), get listenerCount() { return listeners.size; } };
}
function button(node, label) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'button' && node.props.children === label) return node;
  for (const child of [node.props?.children].flat()) { const found = button(child, label); if (found) return found; }
}
test('withdrawing consent in one tab stops page views in another mounted tab', () => {
  const storage = new Map([[KEY, 'granted']]);
  const a = tab(storage), b = tab(storage);
  button(b.render(), 'Analytics choices').props.onClick();
  button(b.render(), 'Decline').props.onClick();
  assert.equal(storage.get(KEY), 'denied'); assert.equal(b.reloads, 1);
  a.storageEvent('denied'); a.navigate('/another-user');
  assert.equal(a.commands.filter(c => c[0] === 'event' && c[1] === 'page_view').length, 0);
  assert.equal(a.window['ga-disable-G-ZGXCN93Z7E'], true);
  assert.equal(a.reloads, 1);
  a.unmount(); assert.equal(a.listenerCount, 0);
});
test('unrelated storage events do not withdraw consent, clearing consent does', () => {
  const a = tab(new Map([[KEY, 'granted']]));
  a.storageEvent('denied', 'unrelated'); a.navigate('/status');
  assert.equal(a.commands.filter(c => c[0] === 'event').length, 1);
  a.commands.length = 0; a.storageEvent(null); a.navigate('/privacy');
  assert.equal(a.commands.filter(c => c[0] === 'event').length, 0);
  assert.equal(a.window['ga-disable-G-ZGXCN93Z7E'], true);
});
