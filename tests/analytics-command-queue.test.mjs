import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('analytics queues the exact command and arguments as an array after consent', () => {
  const source = fs.readFileSync('src/components/GoogleAnalyticsConsent.tsx', 'utf8');
  assert.doesNotMatch(source, /push\(arguments\)/);
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  let stateIndex=0; const effects=[]; const window={ addEventListener(){}, removeEventListener(){} };
  const context={ exports:{}, require:id=>id==='react'?{
    useCallback:fn=>fn, useState:()=>[['granted',false][stateIndex++],()=>{}], useEffect:fn=>effects.push(fn),
  }:id==='./analytics-consent-state'?{readSavedChoice:()=> 'granted',useConsentReady:()=>true}:id==='next/navigation'?{usePathname:()=>'/status'}:{jsx:()=>null,jsxs:()=>null},
  window,localStorage:{getItem:()=> 'granted'},document:{createElement:()=>({}),head:{appendChild(){}}},Date };
  vm.runInNewContext(code,context);context.exports.default();effects.forEach(fn=>fn());
  const queue=window.dataLayer;
  assert.equal(queue.length,4);
  assert.ok(queue.every(Array.isArray));
  assert.equal(queue[0][0],'consent');
  assert.equal(queue[0][2].ad_storage,'denied');
  assert.equal(queue[3][0],'event');
  assert.equal(queue[3][1],'page_view');
  assert.equal(queue[3][2].page_path,'/status');
});
