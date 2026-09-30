import { NextRequest } from "next/server";
import { fetchGitHubStats } from "@/lib/github";
import { renderErrorCard, renderSparkline } from "@/lib/svg";
import { resolveTheme } from "@/lib/themes/themes";
import { sanitizeUsername, sanitizeHexParam, parseFiniteFloat } from "@/lib/sanitize";
import { getCacheHeaders } from "@/lib/cache";

export const dynamic = "force-dynamic";

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const rawUsername = params.get("username") ?? "";
  const username = sanitizeUsername(rawUsername);

  const themeName = params.get("theme") ?? "default";
  const theme = resolveTheme(themeName, {
    bg: sanitizeHexParam(params.get("bg")),
    text: sanitizeHexParam(params.get("text")),
    title_color: sanitizeHexParam(params.get("title_color")),
    icon_color: sanitizeHexParam(params.get("icon_color")),
    border_color: sanitizeHexParam(params.get("border_color")),
  });

  const days = clamp(parseInt(params.get("days") ?? "30", 10) || 30, 7, 90);
  const width = clamp(
    parseInt(params.get("width") ?? "320", 10) || 320,
    180,
    800,
  );
  const height = clamp(
    parseInt(params.get("height") ?? "80", 10) || 80,
    40,
    240,
  );
  const borderRadius = clamp(
    parseFiniteFloat(params.get("border_radius"), 6),
    0,
    50,
  );
  const hideBorder = params.get("hide_border") === "true";
  const lineColor = sanitizeHexParam(params.get("line_color"));
  const fillColor = sanitizeHexParam(params.get("fill_color"));
  const customTitle = params.get("title") ?? undefined;

  const headers = {
    "Content-Type": "image/svg+xml",
    ...getCacheHeaders("activity"),
  } as const;

  if (!username) {
    return new Response(
      renderErrorCard('Missing or invalid "username" parameter.', theme),
      { status: 400, headers },
    );
  }

  try {
    const stats = await fetchGitHubStats(username);
    const svg = renderSparkline(stats.contributionDays, theme, {
      days,
      width,
      height,
      hide_border: hideBorder,
      border_radius: borderRadius,
      line_color: lineColor,
      fill_color: fillColor,
      custom_title: customTitle,
    });

    return new Response(svg, { status: 200, headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(renderErrorCard(message, theme), {
      status: 500,
      headers,
    });
  }
}
