import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { fetchGitHubStats, parseExtraOwners } from "@/lib/github";
import { sanitizeUsername } from "@/lib/sanitize";
import { getCacheHeaders } from "@/lib/cache";
import { fetchRepositoryCardData, parseRepository, renderProfileCard, renderRepositoryCard, resolveProfileCardOptions } from "@/lib/profile-card";

export const dynamic = "force-dynamic";
export const runtime = "edge";

async function avatarDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "image/png";
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch { return ""; }
}

export async function GET(request: NextRequest) {
  const username = sanitizeUsername(request.nextUrl.searchParams.get("username") || "");
  const repository = parseRepository(request.nextUrl.searchParams.get("repo"));
  if (!username && !repository) return new Response("Supply a valid username or repo=owner/name", { status: 400 });
  try {
    const options = resolveProfileCardOptions(request.nextUrl.searchParams);
    let svg: string;
    if (repository) {
      const data = await fetchRepositoryCardData(repository.owner, repository.repo);
      svg = renderRepositoryCard({ ...data, avatarDataUri: await avatarDataUri(data.ownerAvatarUrl) }, options);
    } else {
      const extraOwners = parseExtraOwners(request.nextUrl.searchParams.get("orgs"), username);
      const stats = await fetchGitHubStats(username!, false, extraOwners);
      svg = renderProfileCard({ ...stats, avatarDataUri: await avatarDataUri(stats.avatarUrl) }, options);
    }
    const dataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    const response = new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={options.width} height={options.height} alt="" />
      </div>,
      { width: options.width, height: options.height },
    );
    for (const [name, value] of Object.entries(getCacheHeaders("default"))) {
      response.headers.set(name, value);
    }
    if (request.nextUrl.searchParams.get("download") === "true") {
      response.headers.set("Content-Disposition", `attachment; filename="${repository ? `${repository.owner}-${repository.repo}` : username}-github-card.png"`);
    }
    return response;
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Unable to render profile card", { status: 500 });
  }
}
