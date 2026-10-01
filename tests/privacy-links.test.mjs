import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
test('privacy navigation uses Next Link without changing its destination', () => {
  const source = ts.createSourceFile('privacy.tsx', readFileSync('src/app/privacy/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const links = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const href = node.attributes.properties.find((prop) => prop.name?.getText(source) === 'href');
      if (href?.initializer?.text === '/') links.push(node.tagName.getText(source));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.deepEqual(links, ['Link']);
  const text=[];
  function textVisit(node) { if(ts.isJsxText(node)) text.push(node.text); ts.forEachChild(node,textVisit); }
  textVisit(source);
  assert.ok(text.every(value => !/["']/.test(value)), 'JSX quotes are entity-escaped');
});
