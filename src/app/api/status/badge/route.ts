import { renderBadge, resolveBadgeStyle } from "@/lib/svg/badge";
import { getCacheHeaders } from "@/lib/cache";
import {
  formatMilliseconds,
  formatPercentage,
  readStatusReport,
  STATUS_REPORT_MAX_AGE_SECONDS,
  type StatusReport,
  type StatusLevel,
} from "@/lib/status";

export const dynamic = "force-dynamic";

type StatusBadgeMetric = "uptime" | "response";

function toneForStatus(status: StatusLevel): string {
  switch (status) {
    case "operational":
      return "3fb950";
    case "degraded":
      return "d29922";
    case "down":
      return "f85149";
  }
}

function getBadgeValue(
  report: StatusReport,
  metric: StatusBadgeMetric,
  period: string,
): string {
  if (metric === "response") {
    return formatMilliseconds(report.overall.averageApiResponseMs);
  }

  const uptime = period === "7d"
    ? report.overall.uptime7d
    : report.overall.uptime24h;

  return formatPercentage(uptime);
}

function getBadgeLabel(metric: StatusBadgeMetric, period: string): string {
  if (metric === "response") return "api response";
  return period === "7d" ? "7d uptime" : "24h uptime";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const style = resolveBadgeStyle(params.get("style"));
  const metric: StatusBadgeMetric =
    params.get("metric") === "response" ? "response" : "uptime";
  const period = params.get("period") === "7d" ? "7d" : "24h";

  try {
    const report = await readStatusReport();
    if (!report) throw new Error("No current status report");
    const badgeValue = getBadgeValue(report, metric, period);
    const accent = toneForStatus(report.overall.status);

    const svg = renderBadge(
      getBadgeLabel(metric, period),
      badgeValue,
      { accent, labelBg: "555", text: "fff" },
      style,
    );

    const expiresAt = Date.parse(report.checkedAt) + STATUS_REPORT_MAX_AGE_SECONDS * 1000;
    const secondsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const cacheHeaders = secondsLeft > 0
      ? {
          "Cache-Control": `public, max-age=${Math.min(60, secondsLeft)}, s-maxage=${Math.min(300, secondsLeft)}`,
          "CDN-Cache-Control": `public, s-maxage=${Math.min(300, secondsLeft)}`,
          "Vercel-CDN-Cache-Control": `public, s-maxage=${Math.min(300, secondsLeft)}`,
        }
      : getCacheHeaders("no-store");

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        ...cacheHeaders,
      },
    });
  } catch {
    const fallback = renderBadge(
      getBadgeLabel(metric, period),
      "unknown",
      { accent: "8b949e", labelBg: "555", text: "fff" },
      style,
    );

    return new Response(fallback, {
      status: 503,
      headers: {
        "Content-Type": "image/svg+xml",
        ...getCacheHeaders("no-store"),
      },
    });
  }
}
