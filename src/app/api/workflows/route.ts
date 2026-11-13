import { NextRequest } from "next/server";
import { sanitizeUsername, sanitizeHexParam, formatNumber, truncateCodePoints } from "@/lib/sanitize";
import { getWorkflowRuns } from "@/lib/workflow-runs";
import { resolveWorkflowOwners } from "@/lib/workflow-scope";
import { renderBadge, resolveBadgeStyle } from "@/lib/svg/badge";
import { resolveTheme } from "@/lib/themes/themes";
import { renderErrorCard } from "@/lib/svg";
import { getCacheHeaders } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const username = sanitizeUsername(params.get("username") ?? "");
  const theme = resolveTheme(params.get("theme") ?? "default", {});
  const headers = { "Content-Type": "image/svg+xml", ...getCacheHeaders("daily") };
  if (!username) return new Response(renderErrorCard("Missing or invalid username", theme), { status: 400, headers });
  // This expensive badge is deliberately limited to Rowan's repos. A public
  // per-request owner selector would let anyone drain the shared GitHub token.
  const owners = resolveWorkflowOwners(username, params.get("orgs"));
  if (!owners) {
    return new Response(renderErrorCard("Workflow badge is currently limited to rowkav09 and optional rowkavdev", theme), { status: 400, headers: { "Content-Type": "image/svg+xml", ...getCacheHeaders("no-store") } });
  }
  try {
    const { count } = await getWorkflowRuns(owners);
    const label = truncateCodePoints(params.get("label")?.trim() ?? "", 32) || "Workflow runs";
    const accent = sanitizeHexParam(params.get("color")) ?? "4c8eda";
    const svg = renderBadge(label, formatNumber(count), { accent, labelBg: "30363d", text: "ffffff" }, resolveBadgeStyle(params.get("style")));
    return new Response(svg, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workflow runs";
    return new Response(renderErrorCard(message, theme), { status: 503, headers: { "Content-Type": "image/svg+xml", ...getCacheHeaders("no-store") } });
  }
}
