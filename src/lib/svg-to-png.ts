import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");
const FONT_FILES = ["NotoSans-Regular.ttf", "NotoSans-Bold.ttf"].map((name) => path.join(FONT_DIR, name));

/**
 * Rasterise a card SVG to PNG at its own width. The hosted runtime has no
 * system fonts, so system fonts are off and Noto Sans is bundled; the card's
 * font stack ends in sans-serif, which maps to it. Without a font every
 * <text> element silently renders as nothing.
 */
export function svgToPng(svg: string, width: number): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: false,
      fontFiles: FONT_FILES,
      defaultFontFamily: "Noto Sans",
      sansSerifFamily: "Noto Sans",
    },
  });
  return resvg.render().asPng();
}
