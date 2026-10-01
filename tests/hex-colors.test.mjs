import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidHex, sanitizeHexParam } from '../src/lib/sanitize.ts';

test('hex colors accept exactly CSS 3, 4, 6 and 8 digit forms', () => {
  for (const color of ['abc', 'abcd', 'abcdef', 'abcdef12', 'ABCD']) {
    assert.equal(isValidHex(color), true, color);
    assert.equal(sanitizeHexParam('#' + color), color);
  }
  for (const color of ['', 'ab', 'abcde', 'abcdefg', 'abcdef123', 'xyz']) {
    assert.equal(isValidHex(color), false, color);
    assert.equal(sanitizeHexParam(color), undefined);
  }
});
