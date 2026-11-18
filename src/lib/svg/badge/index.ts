import { escapeXml } from "@/lib/sanitize";
import { BadgeStyle, BadgeColors } from "./types";
import { VALID_STYLES, STYLE_CONFIGS } from "./configs/registry";

export function resolveBadgeStyle(style?: string | null): BadgeStyle {
  if (style && VALID_STYLES.has(style)) {
    return style as BadgeStyle;
  }
  return "flat";
}

export function renderBadge(
  label: string,
  value: string,
  color: string | BadgeColors = "4c8eda",
  style?: string | BadgeStyle,
): string {
  const safeLabel = escapeXml(label);
  const safeValue = escapeXml(value);
  const cfg =
    STYLE_CONFIGS[resolveBadgeStyle(typeof style === "string" ? style : null)];

  const accent = typeof color === "string" ? color : (color.accent ?? "4c8eda");
  const labelBg = typeof color === "string" ? "555" : (color.labelBg ?? "555");
  const text = typeof color === "string" ? "fff" : (color.text ?? "fff");

  // Transform visible text before XML escaping so entities remain valid.
  const labelText = cfg.uppercase ? label.toUpperCase() : label;
  const valueText = cfg.uppercase ? value.toUpperCase() : value;
  const displayLabel = escapeXml(labelText);
  const displayValue = escapeXml(valueText);

  if (cfg.transparent) {
    const labelTextWidth = Math.round(labelText.length * cfg.charWidth);
    const valueTextWidth = Math.round(valueText.length * cfg.charWidth);
    const totalWidth = labelTextWidth + valueTextWidth + cfg.pad * 2 + 4;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${cfg.height}" role="img" aria-label="${safeLabel}: ${safeValue}">
  <title>${safeLabel}: ${safeValue}</title>
  <g font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${cfg.fontSize}" font-weight="${cfg.fontWeight}">
    <text x="${cfg.pad}" y="${cfg.textY}" fill="#${labelBg}" text-anchor="start">${displayLabel}</text>
    <text x="${cfg.pad + labelTextWidth + 4}" y="${cfg.textY}" fill="#${accent}" text-anchor="start">${displayValue}</text>
  </g>
</svg>`;
  }

  const labelWidth = Math.round(
    labelText.length * cfg.charWidth + cfg.pad * 2,
  );
  const valueWidth = Math.round(
    valueText.length * cfg.charWidth + cfg.pad * 2,
  );
  const totalWidth = labelWidth + valueWidth;

  let gradientDef = "";
  let overlayRect = "";
  if (cfg.gradient === "shields") {
    gradientDef = `<linearGradient id="${cfg.gradientId}" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>`;
    overlayRect = `<rect width="${totalWidth}" height="${cfg.height}" fill="url(#${cfg.gradientId})"/>`;
  } else if (cfg.gradient === "plastic") {
    gradientDef = `<linearGradient id="${cfg.gradientId}" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset="0.1" stop-color="#fff" stop-opacity=".15"/>
    <stop offset="0.9" stop-color="#000" stop-opacity=".15"/>
    <stop offset="1" stop-color="#000" stop-opacity=".35"/>
  </linearGradient>`;
    overlayRect = `<rect width="${totalWidth}" height="${cfg.height}" fill="url(#${cfg.gradientId})"/>`;
  }

  const letterSpacingAttr = cfg.letterSpacing
    ? ` letter-spacing="${cfg.letterSpacing}"`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${cfg.height}" role="img" aria-label="${safeLabel}: ${safeValue}">
  <title>${safeLabel}: ${safeValue}</title>
  ${gradientDef}
  <clipPath id="${cfg.clipId}"><rect width="${totalWidth}" height="${cfg.height}" rx="${cfg.rx}" fill="#fff"/></clipPath>
  <g clip-path="url(#${cfg.clipId})">
    <rect width="${labelWidth}" height="${cfg.height}" fill="#${labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${cfg.height}" fill="#${accent}"/>
    ${overlayRect}
  </g>
  <g fill="#${text}" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="${cfg.fontSize}" font-weight="${cfg.fontWeight}"${letterSpacingAttr}>
    <text x="${labelWidth / 2}" y="${cfg.textY}">${displayLabel}</text>
    <text x="${labelWidth + valueWidth / 2}" y="${cfg.textY}">${displayValue}</text>
  </g>
</svg>`;
}
