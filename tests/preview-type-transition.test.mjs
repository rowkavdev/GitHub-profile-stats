import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('choosing a non-card embed clears advanced mode in the same user action', () => {
  const source=readFileSync('src/components/CardPreview/CardPreview.tsx','utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const states=[],effects=[];let cursor=0;
  const configs={CARD_DEFAULTS:{},LANG_DEFAULTS:{},MINI_DEFAULTS:{},SPARK_DEFAULTS:{},STAT_OPTIONS:[],EMBED_LABELS:{card:'card'},MINI_METRICS:[]};
  const jsx=(type,props)=>({type,props});
  const context={exports:{},require:id=>id==='react'?{
    useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},
    useEffect:fn=>effects.push(fn),useMemo:fn=>fn(),useCallback:fn=>fn,
  }:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id.includes('registry')?{themes:{}}:id.includes('configs')?configs:id.includes('utils/embedUrl')?{appendCardParams(){},appendCardOrderParams(){},appendLangsParams(){},appendMiniParams(){},appendSparklineParams(){}}:id.includes('utils/output')?{deriveEmbedOutput:()=>({})}:id.includes('utils/origin')?{usePreviewOrigin:()=> 'https://ghstats.dev'}:id.includes('site')?{SITE:{url:'https://ghstats.dev'}}:id.includes('utils/state')?{usePatchState:()=>[{},()=>{}]}:id.includes('types')?{LANG_CHART_LAYOUTS:[]}: {},URLSearchParams};
  vm.runInNewContext(code,context);
  function render(){cursor=0;return context.exports.default();}
  function find(node,text){if(!node||typeof node!=='object')return;if(node.type==='button'&&node.props.children===text)return node;for(const child of [node.props?.children].flat(Infinity)){const r=find(child,text);if(r)return r;}}
  let tree=render();find(tree,'Show advanced').props.onClick();tree=render();
  assert.equal(states[3],true);
  find(tree,'Languages').props.onClick();
  assert.equal(states[0],'langs');
  assert.equal(states[3],false,'advanced mode must clear before an effect is needed');
});
