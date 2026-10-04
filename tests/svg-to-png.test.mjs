import { test } from "node:test";
import assert from "node:assert/strict";
import { svgToPng } from "../src/lib/svg-to-png.ts";
import { Resvg } from "@resvg/resvg-js";

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const textSvg = `<svg width="300" height="80" viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="80" fill="#000"/><text x="10" y="55" font-family="${FONT_STACK}" font-size="48" fill="#fff">Hello 42</text></svg>`;
const blankSvg = textSvg.replace(/<text.*<\/text>/, "");


function brightPixelCount(png) {
  // Decode through resvg by embedding the PNG in an SVG and reading raw pixels.
  const uri = `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
  const img = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><image href="${uri}" width="300" height="80"/></svg>`).render();
  const px = img.pixels;
  let count = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i] > 128) count++;
  return count;
}

test("PNG export draws text using the bundled font", () => {
  const png = svgToPng(textSvg, 300);
  assert.deepEqual([...png.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  assert.ok(brightPixelCount(png) > 400, "expected white glyph pixels on the black card");
  assert.equal(brightPixelCount(svgToPng(blankSvg, 300)), 0);
});

test("PNG export scales to the requested width", () => {
  const png = svgToPng(textSvg, 600);
  const view = new DataView(png.buffer, png.byteOffset);
  assert.equal(view.getUint32(16), 600);
  assert.equal(view.getUint32(20), 160);
});
