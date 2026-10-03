import { renderSocialLayout, PROFILE_CARD_STYLES, ProfileCardStyle } from "@/lib/social-card-layout";
export { PROFILE_CARD_STYLES } from "@/lib/social-card-layout";
import { GitHubStats, LanguageStat } from "@/lib/types";
import { escapeXml, sanitizeHexParam } from "@/lib/sanitize";

export type ProfileCardType = "repo" | "profile" | "compact" | "contributions";

export type ProfileCardTheme = {
  bg: string;
  panel: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
};

export type ProfileCardOptions = {
  type: ProfileCardType;
  style: ProfileCardStyle;
  theme: ProfileCardTheme;
  title?: string;
  subtitle?: string;
  showAvatar: boolean;
  showLanguages: boolean;
  width: number;
  height: number;
};

export type ProfileCardData = GitHubStats & {
  avatarDataUri: string;
};


export const PROFILE_CARD_TYPES: ProfileCardType[] = ["repo", "profile", "compact", "contributions"];

export const PROFILE_THEMES: Record<string, ProfileCardTheme> = {
  github: {
    bg: "#ffffff",
    panel: "#f6f8fa",
    text: "#1f2328",
    muted: "#656d76",
    accent: "#0969da",
    border: "#d0d7de",
  },
  light: {
    bg: "#ffffff",
    panel: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    accent: "#2563eb",
    border: "#cbd5e1",
  },
  dark: {
    bg: "#0d1117",
    panel: "#161b22",
    text: "#f0f6fc",
    muted: "#8b949e",
    accent: "#58a6ff",
    border: "#30363d",
  },
  ocean: {
    bg: "#071a2b",
    panel: "#0b2942",
    text: "#e6f5ff",
    muted: "#9ac7df",
    accent: "#38bdf8",
    border: "#155e75",
  },
  violet: {
    bg: "#18122b",
    panel: "#241b3f",
    text: "#f5f3ff",
    muted: "#c4b5fd",
    accent: "#a78bfa",
    border: "#4c3b78",
  },
  amber: {
    bg: "#21170b",
    panel: "#33230f",
    text: "#fff7df",
    muted: "#e7c98a",
    accent: "#f5b942",
    border: "#6f4d1c",
  },
};


const font = "'Segoe UI',Inter,Ubuntu,-apple-system,BlinkMacSystemFont,sans-serif";

function statPanel(x: number, y: number, width: number, value: string | number, label: string, theme: ProfileCardOptions["theme"]) {
  return `<rect x="${x}" y="${y}" width="${width}" height="112" rx="18" fill="${theme.panel}" stroke="${theme.border}"/><text x="${x + 22}" y="${y + 47}" font-family="${font}" font-size="30" font-weight="700" fill="${theme.text}">${escapeXml(String(value))}</text><text x="${x + 22}" y="${y + 78}" font-family="${font}" font-size="15" fill="${theme.muted}">${escapeXml(label)}</text>`;
}

function contributionGraphLayout(data: ProfileCardData, options: ProfileCardOptions) {
  const { theme, width, height } = options;
  const days = data.contributionDays.slice(-371);
  const max = Math.max(...days.map((day) => day.contributionCount), 1);
  const cell = 16;
  const gap = 4;
  const startX = 74;
  const startY = 178;
  // Place each day by its real UTC weekday. The calendar range can start
  // mid-week and may skip dates, so list position says nothing about the row.
  const dayMs = 86_400_000;
  const dayStart = (date: string) => Date.parse(`${date}T00:00:00Z`);
  const firstDay = days.length > 0 ? dayStart(days[0].date) : 0;
  const gridStart = firstDay - new Date(firstDay).getUTCDay() * dayMs;
  const cells = days.map((day) => {
    const offset = Math.round((dayStart(day.date) - gridStart) / dayMs);
    const week = Math.floor(offset / 7);
    const weekday = offset % 7;
    const ratio = day.contributionCount / max;
    const opacity = day.contributionCount === 0 ? 1 : Math.max(0.28, Math.min(1, 0.22 + ratio * 0.78));
    const fill = day.contributionCount === 0 ? theme.panel : theme.accent;
    const label = `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`;
    return `<rect x="${startX + week * (cell + gap)}" y="${startY + weekday * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${fill}" fill-opacity="${opacity}" stroke="${theme.border}" stroke-width="0.5"><title>${escapeXml(label)}</title></rect>`;
  }).join("");
  return `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="28" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2"/><text x="70" y="88" font-family="${font}" font-size="38" font-weight="700" fill="${theme.text}">${escapeXml(options.title || `${data.username}'s contributions`)}</text><text x="${width - 70}" y="88" text-anchor="end" font-family="${font}" font-size="32" font-weight="700" fill="${theme.text}">${data.contributionsThisYear}</text><text x="${width - 70}" y="116" text-anchor="end" font-family="${font}" font-size="15" fill="${theme.muted}">contributions this year</text><rect x="42" y="148" width="${width - 84}" height="208" rx="22" fill="${theme.panel}" stroke="${theme.border}"/>${cells}<text x="70" y="395" font-family="${font}" font-size="16" fill="${theme.muted}">Less</text><rect x="115" y="380" width="16" height="16" rx="3" fill="${theme.panel}" stroke="${theme.border}"/>${[0.28, 0.52, 0.76, 1].map((opacity, index) => `<rect x="${139 + index * 24}" y="380" width="16" height="16" rx="3" fill="${theme.accent}" fill-opacity="${opacity}"/>`).join("")}<text x="244" y="395" font-family="${font}" font-size="16" fill="${theme.muted}">More</text>${statPanel(70, 450, 300, data.currentStreak, "Current streak (days)", theme)}${statPanel(450, 450, 300, data.longestStreak, "Longest streak (days)", theme)}${statPanel(830, 450, 300, data.totalCommits, "Commits this year", theme)}`;
}

export function renderProfileCard(data: ProfileCardData, options: ProfileCardOptions): string {
  const body = options.type === "contributions" ? contributionGraphLayout(data, options) : renderSocialLayout({
    name: options.title || data.name || data.username, handle: data.username,
    description: options.subtitle ?? data.bio ?? "", avatar: data.avatarDataUri,
    metrics: [{value:data.followers,label:"Followers",icon:"people"},{value:data.publicRepos,label:"Public repos",icon:"repo"},{value:data.totalStars,label:"Stars earned",icon:"star"},{value:data.contributionsThisYear,label:"Contributions",icon:"graph"}],
    languages: data.languages,
  }, options);
  return `<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.username)} GitHub profile card"><title>${escapeXml(data.username)} GitHub profile card</title>${body}</svg>`;
}


export function resolveProfileCardOptions(params: URLSearchParams): ProfileCardOptions {
  const type = PROFILE_CARD_TYPES.includes(params.get("type") as ProfileCardType) ? params.get("type") as ProfileCardType : "repo";
  const themeName = params.get("theme") || "github";
  const preset = Object.hasOwn(PROFILE_THEMES, themeName) ? PROFILE_THEMES[themeName] : PROFILE_THEMES.github;
  const custom = (key: keyof ProfileCardTheme) => sanitizeHexParam(params.get(key)) || preset[key];
  const style = PROFILE_CARD_STYLES.includes(params.get("style") as ProfileCardStyle) ? params.get("style") as ProfileCardStyle : "github";
  const compact = type === "compact" && style === "github";
  const heights = { github: 500, compact: 430, split: 550, editorial: 550, minimal: 400 };
  return {
    type,
    style,
    theme: { bg: custom("bg"), panel: custom("panel"), text: custom("text"), muted: custom("muted"), accent: custom("accent"), border: custom("border") },
    title: params.get("title")?.slice(0, 80) || undefined,
    subtitle: params.get("subtitle")?.slice(0, 140) || undefined,
    showAvatar: params.get("show_avatar") !== "false",
    showLanguages: params.get("show_languages") !== "false",
    width: compact ? 1000 : 1200,
    height: type === "contributions" ? 627 : compact ? 430 : heights[style],
  };
}

export type RepositoryCardData = {
  owner: string;
  name: string;
  description: string;
  ownerAvatarUrl: string;
  avatarDataUri: string;
  contributors: number;
  commits: number;
  openIssues: number;
  stars: number;
  forks: number;
  languages?: LanguageStat[];
};

export function parseRepository(value: string | null): { owner: string; repo: string } | null {
  const match = value?.trim().match(/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

async function repositoryPageCount(url: string, headers: Record<string,string>): Promise<number> {
  const response = await fetch(url, {headers, cache: "no-store"});
  if (!response.ok) throw new Error(`GitHub repository count request failed: ${response.status}`);
  if (response.status === 204) return 0;
  const last = (response.headers.get("link") || "").match(/[?&]page=(\d+)>; rel="last"/);
  if (last) {
    const count = Number(last[1]);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("GitHub returned an invalid repository count");
    return count;
  }
  const entries: unknown = await response.json();
  if (!Array.isArray(entries)) throw new Error("GitHub returned an invalid repository count response");
  return entries.length;
}

async function repositoryLanguages(owner: string, repo: string, headers: Record<string,string>): Promise<LanguageStat[]> {
  // One cached fetch, not a request per language; style changes reuse the response.
  const languagesResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`, { headers, next: { revalidate: 3600 } });
  if (languagesResponse.ok) {
    const bytes: Record<string, number> = await languagesResponse.json();
    const entries = Object.entries(bytes).filter(([,size]) => Number.isFinite(size) && size > 0).sort((a,b) => b[1]-a[1]);
    const total = entries.reduce((sum,[,size])=>sum+size,0);
    const colors: Record<string,string> = { TypeScript:"#3178c6", JavaScript:"#f1e05a", CSS:"#663399", HTML:"#e34c26", Python:"#3572a5", Rust:"#dea584", Go:"#00add8", Shell:"#89e051", Java:"#b07219", Ruby:"#701516", C:"#555555", "C++":"#f34b7d", "C#":"#178600" };
    return entries.map(([name,size])=>({name,size,percentage:size/total*100,color:colors[name]||"#8b949e"}));
  }
  return [];
}

export async function fetchRepositoryCardData(owner: string, repo: string): Promise<RepositoryCardData> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "github-profile-stats" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 404 ? `Repository "${owner}/${repo}" not found` : `GitHub API responded with status ${response.status}`);
  const json = await response.json();
  if (json.private === true) throw new Error(`Repository "${owner}/${repo}" not found`);
  // Repository REST open_issues_count includes PRs. Search's is:issue count
  // preserves the label's meaning without paging every open issue/PR.
  const issueQuery = new URLSearchParams({ q: `repo:${owner}/${repo} is:issue is:open`, per_page: "1" });
  const issuesResponse = await fetch(`https://api.github.com/search/issues?${issueQuery}`, { headers, cache: "no-store" });
  if (!issuesResponse.ok) throw new Error(`GitHub issue count request failed: ${issuesResponse.status}`);
  const issues = await issuesResponse.json();
  if (issues.incomplete_results === true || !Number.isSafeInteger(issues.total_count) || issues.total_count < 0) {
    throw new Error("GitHub returned an incomplete issue count");
  }
  const contributors = await repositoryPageCount(`${json.contributors_url}?per_page=1&anon=true`, headers);
  const commits = await repositoryPageCount(`${json.commits_url.replace("{/sha}", "")}?per_page=1`, headers);
  const languages = await repositoryLanguages(owner, repo, headers);
  return { owner: json.owner.login, name: json.name, description: json.description || "", ownerAvatarUrl: json.owner.avatar_url, avatarDataUri: "", contributors, commits, openIssues: issues.total_count, stars: json.stargazers_count, forks: json.forks_count, languages };
}

export function renderRepositoryCard(data: RepositoryCardData, options: ProfileCardOptions): string {
  const { width, height } = options;
  const body = renderSocialLayout({ owner: data.owner, name: options.title || data.name, description: options.subtitle ?? data.description, avatar: data.avatarDataUri,
    metrics: [{value:data.contributors,label:"Contributors",icon:"people"},{value:data.openIssues,label:"Open issues",icon:"issue"},{value:data.stars,label:"Stars",icon:"star"},{value:data.forks,label:"Forks",icon:"pr"}], languages: data.languages || [],
  }, options);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.owner)}/${escapeXml(data.name)} repository card"><title>${escapeXml(data.owner)}/${escapeXml(data.name)} repository card</title>${body}</svg>`;
}
