import { LanguageStat, LangChartOptions } from "@/lib/types";
import { ThemeConfig } from "@/lib/themes/types";
import { escapeXml } from "@/lib/sanitize";
import { truncateToWidth, formatLangPct } from "../../text-metrics";

export default function renderVerticalListLanguageChart(
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
  const ROW_H = 32;
  const CIRCLE_R = 4;
  const NAMES_TOP = BAR_Y + BAR_H + 18;
  const H = NAMES_TOP + languages.length * ROW_H + 16;
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
  const clipDef = `<clipPath id="vl-clip"><rect x="${PAD}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}"/></clipPath>`;

  const langRows = languages.map((lang, i) => {
    const y = NAMES_TOP + i * ROW_H;
    const pct = formatLangPct(lang.size, totalSize);
    const name = truncateToWidth(lang.name, W - PAD * 2 - 60, 13);

    const divider =
      i < languages.length - 1
        ? `<line x1="${PAD}" y1="${y + ROW_H}" x2="${W - PAD}" y2="${y + ROW_H}" stroke="${theme.border}" stroke-width="1" opacity="0.2"/>`
        : "";

    return `${divider}
    <circle cx="${PAD + CIRCLE_R}" cy="${y + ROW_H / 2}" r="${CIRCLE_R}" fill="${lang.color ?? "#586069"}"/>
    <text x="${PAD + CIRCLE_R * 2 + 8}" y="${y + ROW_H / 2 + 4}" class="lc-name">${escapeXml(name)}</text>
    <text x="${W - PAD}" y="${y + ROW_H / 2 + 4}" class="lc-pct" text-anchor="end">${escapeXml(pct)}</text>`;
  });

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD}" y="${TITLE_H - 4}" class="lc-title">${escapeXml(options.custom_title ?? "Top Languages")}</text>`;

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Top Languages (vertical list)">
  <title>${escapeXml(options.custom_title ?? "Top Languages")}</title>
  <defs>${clipDef}</defs>
  <style>
    .lc-title { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .lc-name  { font: 400 13px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
    .lc-pct   { font: 400 13px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.7; }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${W - 1}" height="${H - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
  <g clip-path="url(#vl-clip)">${barSegments.join("")}</g>
  ${langRows.join("\n")}
</svg>`;
}
