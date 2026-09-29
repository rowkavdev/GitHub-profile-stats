import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml } from '../src/lib/sanitize.ts';

test('escaped text is valid XML 1.0 even with forbidden controls', () => {
  const input = 'A\x01B\x00C\u000bD\ufffeE\uffffF & <"\' 🙂';
  const escaped = escapeXml(input);
  assert.equal(escaped, 'ABCDEF &amp; &lt;&quot;&apos; 🙂');
  assert.doesNotMatch(escaped, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u);
});

test('preserves legal whitespace and removes unmatched surrogate code units', () => {
  assert.equal(escapeXml('a\t\nb\rc\ud800\udc00\ud800'), 'a\t\nb\rc𐀀');
});
