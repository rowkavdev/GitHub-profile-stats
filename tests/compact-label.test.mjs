import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('compact layout is named Compact while visibility toggles stay Hidden', () => {
  const source = readFileSync(new URL('../src/components/CardPreview/CardPreview.tsx', import.meta.url), 'utf8');
  assert.match(source, /s === "default" \? "Standard" : "Compact"/);
  assert.match(source, /hidden \? "Hidden" : "Visible"/);
});
