import { ContributionDay } from "../../types";
import { ThemeConfig } from "@/lib/themes/types";
import { escapeXml } from "../../sanitize";
import { renderErrorCard } from "../svg-primitives";
import { estimateTextWidth, truncateToWidth } from "../text-metrics";

export interface SparklineOptions {
  days: number;
  width: number;
  height: number;
  hide_border: boolean;
  border_radius: number;
  line_color?: string;
  fill_color?: string;
  custom_title?: string;
}

export function renderSparkline(
  days: ContributionDay[],
  theme: ThemeConfig,
  options: SparklineOptions,
): string {
  const totalDays = Math.min(Math.max(options.days, 7), 90);
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-totalDays);

  if (recent.length === 0) {
    return renderErrorCard("No contribution data available.", theme);
  }

  const WIDTH = Math.max(180, Math.min(options.width, 800));
  const HEIGHT = Math.max(40, Math.min(options.height, 240));
  const PAD_X = 14;
  const TITLE_Y = 16;
  const PAD_TOP = 28;
  const PAD_BOTTOM = 10;
  const contentW = WIDTH - PAD_X * 2;
  const contentH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const values = recent.map((d) => d.contributionCount);
  const maxVal = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x =
      recent.length === 1
        ? WIDTH / 2
        : PAD_X + (i / (recent.length - 1)) * contentW;
    const y = PAD_TOP + contentH - (v / maxVal) * contentH;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, v };
  });

  const lineColor = `#${options.line_color ?? theme.title.replace(/^#/, "")}`;
  const fillColor = `#${options.fill_color ?? theme.title.replace(/^#/, "")}`;
  const rx = options.border_radius;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const firstX = points[0]?.x ?? PAD_X;
  const lastPoint = points[points.length - 1];
  const areaPath = `M ${firstX} ${HEIGHT - PAD_BOTTOM} ${linePath.replace(/^M/, "L")} L ${lastPoint.x} ${HEIGHT - PAD_BOTTOM} Z`;

  const title = options.custom_title ?? `Last ${recent.length} ${recent.length === 1 ? "day" : "days"}`; // fallback title
  const latestVal = values[values.length - 1];
  const latestLabel = `Today: ${latestVal}`;
  // The width helper is approximate; leave slack for bold system fonts.
  const titleWidth = Math.max(0, contentW - estimateTextWidth(latestLabel, 11) * 1.2 - 12);
  const visibleTitle = truncateToWidth(title, titleWidth / 1.2, 12);

  const border = options.hide_border
    ? ""
    : ` stroke="${theme.border}" stroke-width="1"`;

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Contributions sparkline (latest ${latestVal})">
  <title>${escapeXml(title)}</title>
  <style>
    .sl-title { font: 600 12px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.title}; }
    .sl-value { font: 600 11px 'Segoe UI', Ubuntu, sans-serif; fill: ${theme.text}; opacity: 0.8; }
  </style>
  <rect x="0.5" y="0.5" rx="${rx}" ry="${rx}" width="${WIDTH - 1}" height="${HEIGHT - 1}" fill="${theme.bg}"${border}/>
  <path d="${areaPath}" fill="${fillColor}" opacity="0.12" />
  <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.2" stroke-linecap="round" />
  <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="3.6" fill="${lineColor}" stroke="${theme.bg}" stroke-width="1" />
  <text x="${PAD_X}" y="${TITLE_Y}" class="sl-title">${escapeXml(visibleTitle)}</text>
  <text x="${WIDTH - PAD_X}" y="${TITLE_Y}" class="sl-value" text-anchor="end">${latestLabel}</text>
  
</svg>`;
}
