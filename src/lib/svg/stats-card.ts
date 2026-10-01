import { GitHubStats, CardOptions } from "../types";
import { ThemeConfig } from "@/lib/themes/types";
import { escapeXml } from "../sanitize";
import { ICONS, EMOJIS } from "./icons";
import { getVisibleStats } from "./stats-fields";
import { estimateTextWidth } from "./text-metrics";
import { renderActivityRing } from "./svg-primitives";

function renderCompactCard(
  stats: GitHubStats,
  theme: ThemeConfig,
  options: CardOptions,
): string {
  const count = options.compact_count;
  const COLS = count === 4 ? 2 : 3;
  const visible = getVisibleStats(stats, options.hide, options.order).slice(
    0,
    count,
  );
  const useEmoji = options.show_emoji;

  const W = 495;
  const PAD_X = 20;
  const PAD_TOP = 14;
  const TITLE_FS = 13;
  const TITLE_H = options.hide_title ? 0 : TITLE_FS + 10;
  const ROW_GAP = 1;
  const CELL_H = 62;
  const CELL_W = Math.floor((W - PAD_X * 2) / COLS);
  const PAD_BOT = 14;
  const numRows = Math.ceil(visible.length / COLS);
  const statsStartY = PAD_TOP + TITLE_H;
  const cardHeight =
    statsStartY + numRows * CELL_H + (numRows - 1) * ROW_GAP + PAD_BOT;
  const rx = options.border_radius;

  const title = options.custom_title
    ? escapeXml(options.custom_title)
    : `${escapeXml(stats.name || stats.username)}&apos;s GitHub Stats`;

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD_X}" y="${PAD_TOP + TITLE_FS}" class="c-title">${title}</text>`;

  const rowDividers = Array.from({ length: numRows - 1 }, (_, r) => {
    const y = statsStartY + (r + 1) * CELL_H + r * ROW_GAP;
    return `<line x1="${PAD_X}" y1="${y}" x2="${W - PAD_X}" y2="${y}" stroke="${theme.border}" stroke-width="1" opacity="0.3"/>`;
  }).join("\n");

  const colDividers = Array.from({ length: COLS - 1 }, (_, c) => {
    const x = PAD_X + (c + 1) * CELL_W;
    return `<line x1="${x}" y1="${statsStartY + 8}" x2="${x}" y2="${cardHeight - PAD_BOT - 8}" stroke="${theme.border}" stroke-width="1" opacity="0.3"/>`;
  }).join("\n");

  const cellSvgs = visible
    .map((stat, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cellX = PAD_X + col * CELL_W;
      const cellCenterX = cellX + CELL_W / 2;
      const cellY = statsStartY + row * (CELL_H + ROW_GAP);
      const delay = i * 70;

      const iconY = cellY + 11;
      const valueY = cellY + 40;
      const labelY = cellY + 55;

      const iconEl = useEmoji
        ? `<text x="${cellCenterX}" y="${iconY + 12}" text-anchor="middle" class="c-emoji">${EMOJIS[stat.icon] ?? "•"}</text>`
        : `<svg x="${cellCenterX - 7}" y="${iconY}" width="14" height="14" viewBox="0 0 16 16" fill="${theme.icon}"><path d="${ICONS[stat.icon] ?? ""}"/></svg>`;

      return `<g class="c-cell" style="animation-delay:${delay}ms">
      ${iconEl}
      <text x="${cellCenterX}" y="${valueY}" text-anchor="middle" class="c-value">${escapeXml(stat.value)}</text>
      <text x="${cellCenterX}" y="${labelY}" text-anchor="middle" class="c-label">${escapeXml(stat.short)}</text>
    </g>`;
    })
    .join("\n");

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${W}" height="${cardHeight}" viewBox="0 0 ${W} ${cardHeight}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <title>${title}</title>
  <style>
    .c-title { font: 600 ${TITLE_FS}px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.title}; animation: cFadeIn .8s ease-in-out forwards; }
    .c-label { font: 400 10px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; opacity: 0.45; letter-spacing: 0.3px; }
    .c-value { font: 700 17px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; }
    .c-emoji { font: normal 15px sans-serif; }
    .c-cell { opacity: 0; animation: cFadeIn .3s ease-in-out forwards; }
    @keyframes cFadeIn { from { opacity: 0 } to { opacity: 1 } }
    @media (prefers-reduced-motion: reduce) {
      .c-cell, .c-title { animation: none !important; opacity: 1; }
    }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${W - 1}" height="${cardHeight - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
${rowDividers}
${colDividers}
${cellSvgs}
</svg>`;
}

export function renderCard(
  stats: GitHubStats,
  theme: ThemeConfig,
  options: CardOptions,
): string {
  if (options.size === "compact") {
    return renderCompactCard(stats, theme, options);
  }

  const visible = getVisibleStats(stats, options.hide, options.order);
  const showIcons = options.show_icons;
  const showRing = options.show_ring;

  const CARD_WIDTH = 495;
  const PAD_X = 25;
  const PAD_TOP = 25;
  const TITLE_H = options.hide_title ? 0 : 30;
  const GAP = 5;
  const ROW_H = 25;
  const PAD_BOT = 20;
  const RING_R = 40;
  const RING_AREA = showRing ? RING_R * 2 + 30 : 0;
  const ICON_SIZE = 16;
  const TEXT_ICON_PAD = 25;
  const TEXT_Y_OFF = 12.5;
  const TITLE_FS = 18;
  const LABEL_FS = 14;
  const TREND_FS = 10;
  const RING_GRADE_FS = 20;
  const RING_PCT_FS = 11;
  const RING_STROKE = 5;

  const statsStartY = PAD_TOP + TITLE_H + GAP;
  const statsHeight = visible.length * ROW_H;
  const minHeight = showRing
    ? RING_AREA + PAD_TOP + TITLE_H + GAP + PAD_BOT
    : 0;
  const cardHeight = Math.max(statsStartY + statsHeight + PAD_BOT, minHeight);
  const rx = options.border_radius;

  const title = options.custom_title
    ? escapeXml(options.custom_title)
    : `${escapeXml(stats.name || stats.username)}&apos;s GitHub Stats`;

  const titleSvg = options.hide_title
    ? ""
    : `<text x="${PAD_X}" y="${PAD_TOP + TITLE_FS}" class="title">${title}</text>`;

  const statAreaWidth = showRing
    ? CARD_WIDTH - PAD_X - RING_AREA - 10
    : CARD_WIDTH - PAD_X;

  const rows = visible
    .map((stat, i) => {
      const y = statsStartY + i * ROW_H;
      const iconX = PAD_X;
      const textX = PAD_X + (showIcons ? TEXT_ICON_PAD : 0);
      const delay = i * 150;

      const iconSvg = showIcons
        ? `<svg x="${iconX}" y="${y}" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 16 16" fill="${theme.icon}"><path d="${ICONS[stat.icon] ?? ""}"/></svg>`
        : "";

      let trendSvg = "";
      if (stat.trend) {
        const arrowColor =
          stat.trend.direction === "up"
            ? "#3fb950"
            : stat.trend.direction === "down"
              ? "#f85149"
              : theme.text;
        const arrowPath =
          stat.trend.direction === "up"
            ? "M 0 6 L 4 0 L 8 6 L 5 6 L 5 10 L 3 10 L 3 6 Z"
            : stat.trend.direction === "down"
              ? "M 0 4 L 4 10 L 8 4 L 5 4 L 5 0 L 3 0 L 3 4 Z"
              : "M 0 4 L 8 4 L 8 6 L 0 6 Z";
        // The value is right-aligned, so the badge is placed from the value's
        // left edge, not from the label side, or a wide value runs into it.
        const badgeWidth = 12 + stat.trend.text.length * 6.5;
        const valueLeft = statAreaWidth - stat.value.length * 8;
        const labelEnd = textX + estimateTextWidth(`${stat.label}:`, LABEL_FS);
        const arrowX = Math.max(labelEnd + 8, valueLeft - 10 - badgeWidth);
        trendSvg = `<g transform="translate(${arrowX}, ${y + 2})">
          <path d="${arrowPath}" fill="${arrowColor}"/>
          <text x="12" y="9" fill="${arrowColor}" class="trend-text">${escapeXml(stat.trend.text)}</text>
        </g>`;
      }

      return `    <g class="row" style="animation-delay:${delay}ms">
      ${iconSvg}
      <text x="${textX}" y="${y + TEXT_Y_OFF}" class="label">${escapeXml(stat.label)}:</text>
      <text x="${statAreaWidth}" y="${y + TEXT_Y_OFF}" class="value" text-anchor="end">${escapeXml(stat.value)}</text>
      ${trendSvg}
    </g>`;
    })
    .join("\n");

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  const ringCx = CARD_WIDTH - PAD_X - RING_R - 5;
  const ringCy = statsStartY + statsHeight / 2;
  const ringSvg = showRing
    ? renderActivityRing(
        ringCx,
        ringCy,
        RING_R,
        stats.activityLevel,
        stats.grade,
        theme,
        RING_STROKE,
      )
    : "";

  return `<svg width="${CARD_WIDTH}" height="${cardHeight}" viewBox="0 0 ${CARD_WIDTH} ${cardHeight}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <title>${title}</title>
  <style>
    .title { font: 600 ${TITLE_FS}px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.title}; animation: fadeIn .8s ease-in-out forwards; }
    .label { font: 400 ${LABEL_FS}px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; }
    .value { font: 700 ${LABEL_FS}px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; }
    .trend-text { font: 700 ${TREND_FS}px 'Segoe UI', Ubuntu, Sans-Serif; }
    .ring-grade { font: 800 ${RING_GRADE_FS}px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.title}; }
    .ring-pct { font: 600 ${RING_PCT_FS}px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; opacity: 0.7; }
    .row   { opacity: 0; animation: fadeIn .3s ease-in-out forwards; }
    .ring-progress { animation: ringFill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes ringFill {
      from { stroke-dashoffset: ${2 * Math.PI * RING_R}; }
    }
    @media (prefers-reduced-motion: reduce) {
      .row, .title { animation: none !important; opacity: 1; }
      .ring-progress { animation: none !important; }
    }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${CARD_WIDTH - 1}" height="${cardHeight - 1}" fill="${theme.bg}"${border}/>
  ${titleSvg}
${rows}
  ${ringSvg}
</svg>`;
}
