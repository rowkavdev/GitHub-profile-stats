import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
test('both consent-panel privacy links use native Next navigation', () => {
  const source=ts.createSourceFile('consent.tsx',readFileSync('src/components/GoogleAnalyticsConsent.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const links=[];
  function visit(node){
    if(ts.isJsxOpeningElement(node)){
      const href=node.attributes.properties.find(prop=>prop.name?.getText(source)==='href');
      if(href?.initializer?.text==='/privacy')links.push(node.tagName.getText(source));
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
  assert.deepEqual(links,['Link','Link']);
});
