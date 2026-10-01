import { LanguageStat, LangChartOptions } from "@/lib/types";
import { ThemeConfig } from "@/lib/themes/types";
import { escapeXml } from "@/lib/sanitize";

export default function renderStackedLanguageChart(
  languages: LanguageStat[],
  totalSize: number,
  theme: ThemeConfig,
  options: LangChartOptions,
): string {
  const W = 495;
  const PAD = 22;
  const TITLE_H = options.hide_title ? 0 : 28;
  const BAR_H = 16;
  const BAR_Y = TITLE_H + 10;
  const BAR_W = W - PAD * 2;
  const COLS = 3;
  const ROW_H = 20;
  const COL_W = Math.floor(BAR_W / COLS);

  const NAMES_TOP = BAR_Y + BAR_H + 18;
  const numRows = Math.ceil(Math.min(languages.length, 12) / COLS);
  const H = NAMES_TOP + numRows * ROW_H + 16;
  const rx = options.border_radius;

  let used = 0;
  const segments = languages.map((lang, idx) => {
    const pct = totalSize > 0 ? (lang.size / totalSize) * 100 : 0;
    // Reserve the minimum width for remaining languages before assigning
    // a dominant segment; otherwise tiny segments can run beyond the card.
    const reserved = (languages.length - idx - 1) * 3;
    let w = Math.min(
      Math.max(3, Math.round((pct / 100) * BAR_W)),
      Math.max(0, BAR_W - used - reserved),
    );
    if (idx === languages.length - 1) {
      w = Math.max(0, BAR_W - used);
    }
    used += w;
    return { lang, w };
  });

  let bx = PAD;
  const barSegments = segments.map(({ lang, w }) => {
    const rect = `<rect x="${bx}" y="${BAR_Y}" width="${w}" height="${BAR_H}" fill="${lang.color ?? "#586069"}"/>`;
    const label =
      w >= 36
        ? `<text x="${bx + w / 2}" y="${BAR_Y + BAR_H / 2 + 4}" text-anchor="middle" font="600 10px 'Segoe UI', Ubuntu, sans-serif" fill="#fff" opacity="0.9">${escapeXml(lang.name)}</text>`
        : "";
    bx += w;
    return rect + label;
  });

  const langLabels = languages.slice(0, 12).map((lang, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const lx = PAD + col * COL_W;
    const ly = NAMES_TOP + row * ROW_H;
    const pct = totalSize > 0 ? (lang.size / totalSize) * 100 : 0;
    const pctText = `${pct.toFixed(1)}%`;
    const name =
      lang.name.length > 16 ? `${lang.name.slice(0, 15)}…` : lang.name;
    return `<circle cx="${lx + 6}" cy="${ly + 5}" r="4" fill="${lang.color ?? "#586069"}"/>
  <text x="${lx + 14}" y="${ly + 9}" class="lc-name">${escapeXml(name)}</text>
  <text x="${lx + COL_W - 2}" y="${ly + 9}" class="lc-pct" text-anchor="end">${pctText}</text>`;
  });

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD}" y="${TITLE_H - 4}" class="lc-title">${escapeXml(options.custom_title ?? "Top Languages")}</text>`;

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Top Languages (stacked)">
  <title>${escapeXml(options.custom_title ?? "Top Languages")}</title>
  <style>
    .lc-title { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .lc-name  { font: 400 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; }
    .lc-pct   { font: 600 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.7; }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${W - 1}" height="${H - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
  <g>${barSegments.join("")}</g>
  ${langLabels.join("\n  ")}
</svg>`;
}
