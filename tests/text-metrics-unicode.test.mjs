import test from 'node:test';
import assert from 'node:assert/strict';
import { truncateToWidth, estimateTextWidth } from '../src/lib/svg/text-metrics.ts';

test('width truncation keeps complete Unicode code points and shares the estimator units', () => {
  assert.equal(truncateToWidth('😀ABC', 10, 10), '😀…');
  const text = '😀ABC';
  assert.equal(truncateToWidth(text, estimateTextWidth(text, 10), 10), text);
  assert.equal(truncateToWidth(text, 9, 10), '…');
});
test('ASCII truncation keeps the previous width and ellipsis decisions', () => {
  const text='GitHub statistics';
  assert.equal(truncateToWidth(text,estimateTextWidth(text,14),14),text);
  assert.equal(truncateToWidth('ABCD',10,10),'A…');
  assert.equal(truncateToWidth('ABCD',9,10),'…');
});
test('CJK and fullwidth characters are estimated at a full em, not at ASCII width', () => {
  for (const ch of ['漢', 'あ', 'カ', '한', 'Ａ', '，']) {
    assert.equal(estimateTextWidth(ch, 10), 10, ch);
  }
  assert.equal(estimateTextWidth('漢字', 14), 28);
});
test('a long CJK name is truncated to the width it will actually occupy', () => {
  assert.equal(truncateToWidth('漢字漢字漢字', 35, 10), '漢字漢…');
  assert.equal(truncateToWidth('漢字', 20, 10), '漢字');
});
test('ASCII and emoji estimates are unchanged by CJK handling', () => {
  assert.ok(Math.abs(estimateTextWidth('abc', 10) - 14.2) < 1e-9);
  assert.equal(estimateTextWidth('😀', 10), 5);
});
