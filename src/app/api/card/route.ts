import { NextRequest } from "next/server";
import { fetchGitHubStats, parseExtraOwners } from "@/lib/github";
import { renderCard, renderErrorCard } from "@/lib/svg";
import { resolveTheme } from "@/lib/themes/themes";
import { sanitizeUsername, sanitizeHexParam, parseFiniteFloat } from "@/lib/sanitize";
import { getCacheHeaders } from "@/lib/cache";
import { trackUser } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const rawUsername = params.get("username") ?? "";
  const username = sanitizeUsername(rawUsername);

  const themeName = params.get("theme") ?? "default";
  const allTime = params.get("alltime") === "true";

  const theme = resolveTheme(themeName, {
    bg: sanitizeHexParam(params.get("bg")),
    text: sanitizeHexParam(params.get("text")),
    title_color: sanitizeHexParam(params.get("title_color")),
    icon_color: sanitizeHexParam(params.get("icon_color")),
    border_color: sanitizeHexParam(params.get("border_color")),
  });

  const options = {
    theme: themeName,
    hide_border: params.get("hide_border") === "true",
    hide_title: params.get("hide_title") === "true",
    hide: (params.get("hide") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    show_icons: params.get("show_icons") !== "false",
    show_ring: params.get("show_ring") !== "false",
    border_radius: Math.min(
      Math.max(parseFiniteFloat(params.get("border_radius"), 4.5), 0),
      50,
    ),
    custom_title: params.get("custom_title") ?? undefined,
    size: (params.get("size") === "compact" ? "compact" : "default") as
      | "default"
      | "compact",
    compact_count: ([3, 4, 6].includes(
      parseInt(params.get("compact_count") ?? ""),
    )
      ? parseInt(params.get("compact_count")!)
      : 6) as 3 | 4 | 6,
    show_emoji: params.get("show_emoji") === "true",
    order: params.get("order")
      ? params
          .get("order")!
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  };

  const headers = {
    "Content-Type": "image/svg+xml",
    ...getCacheHeaders("default"),
  };

  if (!username) {
    return new Response(
      renderErrorCard('Missing or invalid "username" parameter.', theme),
      { status: 400, headers },
    );
  }

  try {
    const extraOwners = parseExtraOwners(params.get("orgs"), username);
    const stats = await fetchGitHubStats(username, allTime, extraOwners);
    const svg = renderCard(stats, theme, options);
    // A counter failure must not turn a successfully rendered card into an error.
    try { await trackUser(username); } catch {}
    return new Response(svg, { status: 200, headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(renderErrorCard(message, theme), {
      status: 500,
      headers: { ...headers, ...getCacheHeaders("no-store") },
    });
  }
}
