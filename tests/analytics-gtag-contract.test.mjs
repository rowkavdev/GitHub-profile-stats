import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('gtag commands use Arguments objects, matching the documented Google queue contract', () => {
 const source=readFileSync('src/components/GoogleAnalyticsConsent.tsx','utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const effects=[];let cursor=0;const window={addEventListener(){},removeEventListener(){}};
 const context={exports:{},require:id=>id==='react'?{useCallback:fn=>fn,useState:()=>[['granted',true,false][cursor++],()=>{}],useEffect:fn=>effects.push(fn)}:id==='next/navigation'?{usePathname:()=>'/status'}:{jsx:()=>null,jsxs:()=>null},window,localStorage:{getItem:()=> 'granted'},document:{createElement:()=>({}),head:{appendChild(){}}},Date};
 vm.runInNewContext(code,context);context.exports.default();effects.forEach(fn=>fn());
 const queue=window.dataLayer;
 assert.equal(queue.length,4);
 assert.ok(queue.every(command=>Object.prototype.toString.call(command)==='[object Arguments]'));
 assert.equal(queue[0][0],'consent');assert.equal(queue[0][2].ad_storage,'denied');
 assert.equal(queue[3][0],'event');assert.equal(queue[3][1],'page_view');
});
