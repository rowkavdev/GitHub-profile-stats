import { LanguageStat, LangChartOptions } from "@/lib/types";
import { ThemeConfig } from "@/lib/themes/types";

import { escapeXml } from "@/lib/sanitize";

export default function renderDonutLanguageChart(
  languages: LanguageStat[],
  totalSize: number,
  theme: ThemeConfig,
  options: LangChartOptions,
): string {
  const W = 495;
  const PAD = 22;
  const TITLE_H = options.hide_title ? 0 : 28;
  const RADIUS = 72;
  const RING = 0.62;
  const COLS = 2;
  const ROW_H = 22;
  const GAP_CIRCLE_LEGEND = 40;

  const numRows = Math.ceil(Math.min(languages.length, 12) / COLS);
  const legendH = numRows * ROW_H;
  const contentH = Math.max(RADIUS * 2, legendH);

  const CX = PAD + RADIUS;
  const CY = TITLE_H + 20 + contentH / 2;

  const LEGEND_X = CX + RADIUS + GAP_CIRCLE_LEGEND;
  const LEGEND_W = W - LEGEND_X - PAD;
  const COL_W = Math.floor(LEGEND_W / COLS);
  const legendTop = CY - legendH / 2;

  const H = TITLE_H + 20 + contentH + 20;
  const rx = options.border_radius;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  let cumulativeAngle = -90;
  const slices = languages.map((lang) => {
    const pct = totalSize > 0 ? lang.size / totalSize : 0;
    const angle = pct * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const innerR = RADIUS * RING;

    if (angle >= 359.999) {
      return `<circle cx="${CX}" cy="${CY}" r="${(RADIUS + innerR) / 2}" fill="none" stroke="${lang.color ?? "#586069"}" stroke-width="${RADIUS - innerR}"/>`;
    }

    const ox1 = CX + RADIUS * Math.cos(toRad(startAngle));
    const oy1 = CY + RADIUS * Math.sin(toRad(startAngle));
    const ox2 = CX + RADIUS * Math.cos(toRad(endAngle));
    const oy2 = CY + RADIUS * Math.sin(toRad(endAngle));
    const ix1 = CX + innerR * Math.cos(toRad(endAngle));
    const iy1 = CY + innerR * Math.sin(toRad(endAngle));
    const ix2 = CX + innerR * Math.cos(toRad(startAngle));
    const iy2 = CY + innerR * Math.sin(toRad(startAngle));
    const largeArc = angle > 180 ? 1 : 0;

    const path = [
      `M ${ox1.toFixed(2)} ${oy1.toFixed(2)}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${ox2.toFixed(2)} ${oy2.toFixed(2)}`,
      `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
      `Z`,
    ].join(" ");

    return `<path d="${path}" fill="${lang.color ?? "#586069"}" stroke="${theme.bg}" stroke-width="1.5"/>`;
  });

  const topLang = languages[0];
  const topPct =
    topLang && totalSize > 0
      ? ((topLang.size / totalSize) * 100).toFixed(0)
      : "0";
  const centerLabel = topLang
    ? `<text x="${CX}" y="${CY - 4}" text-anchor="middle" class="lc-center-pct">${topPct}%</text>
  <text x="${CX}" y="${CY + 12}" text-anchor="middle" class="lc-center-name">${escapeXml(topLang.name.length > 10 ? topLang.name.slice(0, 9) + "…" : topLang.name)}</text>`
    : "";

  const legend = languages.slice(0, 12).map((lang, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const lx = LEGEND_X + col * COL_W;
    const ly = legendTop + row * ROW_H;
    const pct = totalSize > 0 ? (lang.size / totalSize) * 100 : 0;
    const maxNameLen = 12;
    const name =
      lang.name.length > maxNameLen
        ? `${lang.name.slice(0, maxNameLen - 1)}…`
        : lang.name;
    return `<circle cx="${lx + 6}" cy="${ly + 10}" r="4" fill="${lang.color ?? "#586069"}"/>
  <text x="${lx + 15}" y="${ly + 14}" class="lc-name">${escapeXml(name)}</text>
  <text x="${lx + COL_W}" y="${ly + 14}" class="lc-pct" text-anchor="end">${pct.toFixed(1)}%</text>`;
  });

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD}" y="${TITLE_H - 4}" class="lc-title">${escapeXml(options.custom_title ?? "Top Languages")}</text>`;

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Top Languages (pie)">
  <title>${escapeXml(options.custom_title ?? "Top Languages")}</title>
  <style>
    .lc-title       { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .lc-name        { font: 400 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
    .lc-pct         { font: 600 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.7; }
    .lc-center-pct  { font: 700 18px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .lc-center-name { font: 400 10px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.7; }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${W - 1}" height="${H - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
  <g>${slices.join("")}</g>
  ${centerLabel}
  ${legend.join("\n  ")}
</svg>`;
}
