import { LanguageStat, LangChartOptions } from "@/lib/types";
import { ThemeConfig } from "@/lib/themes/types";
import { escapeXml } from "@/lib/sanitize";
import {
  truncateToWidth,
  formatLangPct,
  estimateTextWidth,
} from "../../text-metrics";

export default function renderHorizontalListLanguageChart(
  languages: LanguageStat[],
  totalSize: number,
  theme: ThemeConfig,
  options: LangChartOptions,
): string {
  const W = 495;
  const PAD = 25;
  const TITLE_H = options.hide_title ? 0 : 28;
  const BAR_H = 10;
  const BAR_Y = TITLE_H + 12;
  const BAR_W = W - PAD * 2;
  const ITEM_GAP = 20;
  const ROW_H = 22;
  const CIRCLE_R = 4;
  const CIRCLE_GAP = 10;
  const rx = options.border_radius;

  let bx = PAD;
  const barSegments = languages.map((lang, idx) => {
    // Leave each remaining nonzero language visible inside the clip area.
    const reserved = (languages.length - idx - 1) * 2;
    const w = Math.min(
      Math.max(2, Math.round((lang.size / totalSize) * BAR_W)),
      Math.max(0, PAD + BAR_W - bx - reserved),
    );
    const el = `<rect x="${bx}" y="${BAR_Y}" width="${w}" height="${BAR_H}" fill="${lang.color ?? "#586069"}"/>`;
    bx += w;
    return el;
  });
  const clipDef = `<clipPath id="hl-clip"><rect x="${PAD}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}"/></clipPath>`;

  const items = languages.map((lang) => {
    const pct = formatLangPct(lang.size, totalSize);
    const displayName = truncateToWidth(lang.name, BAR_W - 60, 11);
    const itemTextWidth =
      CIRCLE_R * 2 +
      CIRCLE_GAP +
      estimateTextWidth(displayName, 11) +
      14 +
      estimateTextWidth(pct, 11);
    return { lang: { ...lang, displayName }, pct, itemTextWidth };
  });

  const rows: (typeof items)[0][][] = [];
  let currentRow: (typeof items)[0][] = [];
  let currentWidth = 0;

  for (const item of items) {
    const totalRowWidth =
      currentWidth +
      item.itemTextWidth +
      (currentRow.length > 0 ? ITEM_GAP : 0);
    if (currentRow.length > 0 && totalRowWidth > BAR_W) {
      rows.push(currentRow);
      currentRow = [item];
      currentWidth = item.itemTextWidth;
    } else {
      currentRow.push(item);
      currentWidth = totalRowWidth;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const numRows = rows.length;
  const ITEMS_TOP = BAR_Y + BAR_H + 18;
  const H = ITEMS_TOP + numRows * ROW_H + 16;

  const itemSvgs = rows
    .map((row, rowIdx) => {
      const y = ITEMS_TOP + rowIdx * ROW_H;
      let x = PAD;
      return row
        .map((item, colIdx) => {
          const circleX = x + CIRCLE_R;
          const textX = x + CIRCLE_R * 2 + CIRCLE_GAP;
          const pctX =
            textX + estimateTextWidth(item.lang.displayName, 11) + 14;

          const svg = `<circle cx="${circleX}" cy="${y + 5}" r="${CIRCLE_R}" fill="${item.lang.color ?? "#586069"}"/>
    <text x="${textX}" y="${y + 9}" class="lc-name">${escapeXml(item.lang.displayName)}</text>
    <text x="${pctX}" y="${y + 9}" class="lc-pct">${escapeXml(item.pct)}</text>`;

          x += item.itemTextWidth + (colIdx < row.length - 1 ? ITEM_GAP : 0);
          return svg;
        })
        .join("\n  ");
    })
    .join("\n");

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD}" y="${TITLE_H - 4}" class="lc-title">${escapeXml(options.custom_title ?? "Top Languages")}</text>`;

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Top Languages (horizontal list)">
  <title>${escapeXml(options.custom_title ?? "Top Languages")}</title>
  <defs>${clipDef}</defs>
  <style>
    .lc-title { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .lc-name  { font: 400 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
    .lc-pct   { font: 600 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.7; }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${W - 1}" height="${H - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
  <g clip-path="url(#hl-clip)">${barSegments.join("")}</g>
  ${itemSvgs}
</svg>`;
}
