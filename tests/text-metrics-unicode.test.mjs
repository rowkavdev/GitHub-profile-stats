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
