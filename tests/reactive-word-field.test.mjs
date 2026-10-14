import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/components/ReactiveWordField.tsx", import.meta.url),
  "utf8",
);

test("reactive background listens without intercepting page controls", async () => {
  const css = await readFile(
    new URL("../src/app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /window\.addEventListener\("pointermove"/);
  assert.match(source, /window\.addEventListener\("pointerdown"/);
  assert.match(css, /\.reactive-word-field[\s\S]*pointer-events:\s*none/);
});

test("reactive background uses only the past week's successful card usernames", () => {
  assert.match(source, /fetch\("\/api\/users\/recent"/);
  assert.match(source, /const word = words\[wordIndex % words\.length\]/);
  assert.doesNotMatch(source, /const WORDS =/);
});

test("reactive background respects reduced-motion preferences", () => {
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.match(source, /reducedMotion\.matches/);
});

test("pointer clicks and drags produce bounded ripples", () => {
  assert.match(source, /addRipple\(pointer\.x, pointer\.y, 1\.15\)/);
  assert.match(source, /if \(ripples\.length > 8\) ripples\.shift\(\)/);
  assert.match(source, /pointer\.down && event\.timeStamp - lastTrailAt > 42/);
});
