import { LanguageStat, LangChartOptions } from "@/lib/types";
import { ThemeConfig } from "@/lib/themes/types";
import { escapeXml } from "@/lib/sanitize";
import { truncateToWidth, formatLangPct } from "../../text-metrics";

export default function renderDefaultLanguageChart(
  topLangs: LanguageStat[],
  totalSize: number,
  theme: ThemeConfig,
  options: LangChartOptions,
): string {
  const W = 495;
  const PAD = 25;
  const TITLE_H = options.hide_title ? 0 : 30;
  const BAR_TOP = TITLE_H + 12;
  const BAR_H = 10;
  const BAR_W = W - PAD * 2;
  const COLS = 3;
  const ROW_H = 20;
  const NAMES_TOP = BAR_TOP + BAR_H + 16;
  const numRows = Math.ceil(topLangs.length / COLS);
  const H = NAMES_TOP + numRows * ROW_H + 16;
  const rx = options.border_radius;

  let bx = PAD;
  const barSegments = topLangs.map((lang, idx) => {
    // Leave each remaining nonzero language visible inside the clip area.
    const reserved = (topLangs.length - idx - 1) * 2;
    const w = Math.min(
      Math.max(2, Math.round((lang.size / totalSize) * BAR_W)),
      Math.max(0, PAD + BAR_W - bx - reserved),
    );
    const el = `<rect x="${bx}" y="${BAR_TOP}" width="${w}" height="${BAR_H}" fill="${lang.color ?? "#586069"}"/>`;
    bx += w;
    return el;
  });

  const clipDef = `<clipPath id="lc-clip"><rect x="${PAD}" y="${BAR_TOP}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}"/></clipPath>`;

  const COL_W = Math.floor(BAR_W / COLS);
  const langLabels = topLangs.map((lang, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const lx = PAD + col * COL_W;
    const ly = NAMES_TOP + row * ROW_H;
    const pct = formatLangPct(lang.size, totalSize);
    const name = truncateToWidth(lang.name, COL_W - 22, 11);
    return `<circle cx="${lx + 6}" cy="${ly + 5}" r="4" fill="${lang.color ?? "#586069"}"/>
  <text x="${lx + 14}" y="${ly + 9}" class="lc-name">${escapeXml(name)}</text>
  <text x="${lx + COL_W - 2}" y="${ly + 9}" class="lc-pct" text-anchor="end">${escapeXml(pct)}</text>`;
  });

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD}" y="${TITLE_H - 4}" class="lc-title">${escapeXml(options.custom_title ?? "Top Languages")}</text>`;

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Top Languages">
  <title>${escapeXml(options.custom_title ?? "Top Languages")}</title>
  <defs>${clipDef}</defs>
  <style>
    .lc-title { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .lc-name  { font: 400 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
    .lc-pct   { font: 600 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.7; }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${W - 1}" height="${H - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
  <g clip-path="url(#lc-clip)">${barSegments.join("")}</g>
  ${langLabels.join("\n  ")}
</svg>`;
}
