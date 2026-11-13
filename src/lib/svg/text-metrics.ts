/** East Asian wide and fullwidth characters (CJK, kana, Hangul, fullwidth forms). */
function isWideChar(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

export function charWidth(ch: string, fontSize: number): number {
  if (isWideChar(ch)) return fontSize;
  const c = ch.toLowerCase();
  if ("ijlt!:;|".includes(c)) return fontSize * 0.27;
  if ("frskce".includes(c)) return fontSize * 0.42;
  if ("adgnoquvxyzsbhkp".includes(c)) return fontSize * 0.5;
  if ("mwW".includes(c)) return fontSize * 0.58;
  if ("MQ@".includes(c)) return fontSize * 0.69;
  return fontSize * 0.5;
}

export function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) width += charWidth(ch, fontSize);
  return width;
}

export function truncateToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
): string {
  const characters = Array.from(text);
  let width = 0;
  let lastFit = 0;
  for (let i = 0; i < characters.length; i++) {
    const w = charWidth(characters[i], fontSize);
    if (width + w > maxWidth) break;
    width += w;
    lastFit = i + 1;
  }
  if (lastFit === characters.length) return text;
  if (lastFit === 0) return "\u2026";
  const ellipsisW = charWidth("\u2026", fontSize);
  while (lastFit > 0 && width + ellipsisW > maxWidth) {
    width -= charWidth(characters[lastFit - 1], fontSize);
    lastFit--;
  }
  if (lastFit === 0) return "\u2026";
  return characters.slice(0, lastFit).join("") + "\u2026";
}

/** Formats a language's share of the total as a percentage string, with a
 * floor so vanishingly small (but nonzero) shares don't display as "0.0%". */
export function formatLangPct(size: number, total: number): string {
  if (total <= 0) return "0.0%";
  const pct = (size / total) * 100;
  if (pct > 0 && pct < 0.05) return "0.1%";
  return `${pct.toFixed(1)}%`;
}
