import { NextRequest } from "next/server";
import { fetchLanguageStats, parseExtraOwners } from "@/lib/github";
import { renderLanguageChart, renderErrorCard } from "@/lib/svg";
import { resolveTheme } from "@/lib/themes/themes";
import { sanitizeUsername, sanitizeHexParam, parseFiniteFloat } from "@/lib/sanitize";
import {
  LangChartOptions,
  LangChartLayout,
  LANG_CHART_LAYOUTS,
} from "@/lib/types";
import { getCacheHeaders } from "@/lib/cache";

export const dynamic = "force-dynamic";

function parseLangLayout(value: string | null): LangChartLayout {
  return (LANG_CHART_LAYOUTS as readonly string[]).includes(value ?? "")
    ? (value as LangChartLayout)
    : "bar";
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

  const maxLangs = Math.min(
    Math.max(parseInt(params.get("max_langs") ?? "8") || 8, 1),
    12,
  );

  const options: LangChartOptions = {
    hide_border: params.get("hide_border") === "true",
    hide_title: params.get("hide_title") === "true",
    custom_title: params.get("custom_title") ?? undefined,
    border_radius: Math.min(
      Math.max(parseFiniteFloat(params.get("border_radius"), 4.5), 0),
      50,
    ),
    max_langs: maxLangs,
    layout: parseLangLayout(params.get("layout")),
  };

  const headers = {
    "Content-Type": "image/svg+xml",
    ...getCacheHeaders("slow"),
  };

  if (!username) {
    return new Response(
      renderErrorCard('Missing or invalid "username" parameter.', theme),
      { status: 400, headers },
    );
  }

  try {
    const extraOwners = parseExtraOwners(params.get("orgs"), username);
    const languages = await fetchLanguageStats(username, extraOwners);
    return new Response(renderLanguageChart(languages, theme, options), {
      status: 200,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(renderErrorCard(message, theme), {
      status: 500,
      headers: { ...headers, ...getCacheHeaders("no-store") },
    });
  }
}
