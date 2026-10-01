import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
test('generated site icon declares its image decorative without unused suppressions', () => {
  const source = ts.createSourceFile('icon.tsx', readFileSync('src/app/icon.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const images = [];
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'img') images.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(images.length, 1);
  const alt = images[0].attributes.properties.find((prop) => prop.name?.getText(source) === 'alt');
  assert.equal(alt?.initializer?.text, '');
  assert.doesNotMatch(source.text, /eslint-disable/);
});
