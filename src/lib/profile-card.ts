import { GitHubStats } from "@/lib/types";
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

function stat(x: number, y: number, value: string | number, label: string, color: string, muted: string) {
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="30" font-weight="700" fill="${color}">${escapeXml(String(value))}</text><text x="${x}" y="${y + 28}" font-family="${font}" font-size="16" fill="${muted}">${escapeXml(label)}</text>`;
}

function languagePills(data: ProfileCardData, y: number, theme: ProfileCardOptions["theme"]) {
  let x = 70;
  return data.languages.slice(0, 4).map((lang) => {
    const label = `${lang.name} ${lang.percentage}%`;
    const width = Math.max(110, label.length * 9 + 38);
    const out = `<rect x="${x}" y="${y}" width="${width}" height="36" rx="18" fill="${theme.panel}" stroke="${theme.border}"/><circle cx="${x + 19}" cy="${y + 18}" r="5" fill="${lang.color}"/><text x="${x + 32}" y="${y + 23}" font-family="${font}" font-size="14" fill="${theme.text}">${escapeXml(label)}</text>`;
    x += width + 12;
    return out;
  }).join("");
}

function languageSection(data: ProfileCardData, y: number, theme: ProfileCardOptions["theme"], width: number) {
  const languages = data.languages.slice(0, 4);
  const panelX = 42;
  const panelWidth = width - 84;
  const gap = 14;
  const tileWidth = (panelWidth - 56 - gap * 3) / 4;
  const tiles = languages.map((lang, index) => {
    const x = panelX + 28 + index * (tileWidth + gap);
    const barWidth = Math.max(0, (tileWidth - 32) * Math.min(100, lang.percentage) / 100);
    return `<rect x="${x}" y="${y + 52}" width="${tileWidth}" height="82" rx="14" fill="${theme.bg}" stroke="${theme.border}"/><circle cx="${x + 18}" cy="${y + 77}" r="6" fill="${lang.color}"/><text x="${x + 32}" y="${y + 83}" font-family="${font}" font-size="17" font-weight="600" fill="${theme.text}">${escapeXml(lang.name)}</text><text x="${x + tileWidth - 16}" y="${y + 83}" text-anchor="end" font-family="${font}" font-size="16" fill="${theme.muted}">${lang.percentage}%</text><rect x="${x + 16}" y="${y + 101}" width="${tileWidth - 32}" height="10" rx="5" fill="${theme.border}"/><rect x="${x + 16}" y="${y + 101}" width="${barWidth}" height="10" rx="5" fill="${lang.color}"/>`;
  }).join("");
  return `<rect x="${panelX}" y="${y}" width="${panelWidth}" height="154" rx="22" fill="${theme.panel}" stroke="${theme.border}"/><text x="${panelX + 28}" y="${y + 33}" font-family="${font}" font-size="19" font-weight="700" fill="${theme.text}">Top languages</text>${tiles}`;
}

function avatar(data: ProfileCardData, x: number, y: number, size: number, theme: ProfileCardOptions["theme"]) {
  if (!data.avatarDataUri) return "";
  const id = `avatar-${x}-${y}`;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.18)}"/></clipPath></defs><rect x="${x - 2}" y="${y - 2}" width="${size + 4}" height="${size + 4}" rx="${Math.round(size * 0.2)}" fill="${theme.border}"/><image href="${data.avatarDataUri}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}

function statPanel(x: number, y: number, width: number, value: string | number, label: string, theme: ProfileCardOptions["theme"]) {
  return `<rect x="${x}" y="${y}" width="${width}" height="112" rx="18" fill="${theme.panel}" stroke="${theme.border}"/><text x="${x + 22}" y="${y + 47}" font-family="${font}" font-size="30" font-weight="700" fill="${theme.text}">${escapeXml(String(value))}</text><text x="${x + 22}" y="${y + 78}" font-family="${font}" font-size="15" fill="${theme.muted}">${escapeXml(label)}</text>`;
}

function repoLayout(data: ProfileCardData, options: ProfileCardOptions) {
  const { theme, width, height } = options;
  const displayName = escapeXml(options.title || data.name || data.username);
  const bio = options.subtitle ?? data.bio ?? "";
  const bioLine = bio ? `<text x="70" y="180" font-family="${font}" font-size="20" fill="${theme.muted}">${escapeXml(bio.slice(0, 110))}</text>` : "";
  const stats = [[data.followers, "Followers"], [data.publicRepos, "Public repos"], [data.totalStars, "Stars earned"], [data.contributionsThisYear, "Contributions"]] as const;
  return `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="28" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2"/><rect x="42" y="42" width="${width - 84}" height="206" rx="24" fill="${theme.panel}" stroke="${theme.border}"/>${options.showAvatar ? avatar(data, width - 238, 59, 170, theme) : ""}<text x="70" y="112" font-family="${font}" font-size="40" font-weight="700" fill="${theme.text}">${displayName}</text><text x="70" y="150" font-family="${font}" font-size="22" fill="${theme.accent}">@${escapeXml(data.username)}</text>${bioLine}${stats.map((item, index) => statPanel(42 + index * 284, 276, 264, item[0], item[1], theme)).join("")}${options.showLanguages ? languageSection(data, 420, theme, width) : ""}<rect x="0" y="${height - 18}" width="${width}" height="18" fill="${theme.accent}"/>`;
}

function profileLayout(data: ProfileCardData, options: ProfileCardOptions) {
  const { theme, width, height } = options;
  const bio = options.subtitle ?? data.bio ?? "";
  const bioLine = bio ? `<text x="305" y="218" font-family="${font}" font-size="19" fill="${theme.muted}">${escapeXml(bio.slice(0, 100))}</text>` : "";
  const stats = [[data.contributionsThisYear, "Contributions this year"], [data.totalStars, "Stars earned"], [data.totalPRs, "Pull requests"], [data.followers, "Followers"]] as const;
  return `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="38" y="38" width="${width - 76}" height="${height - 76}" rx="34" fill="${theme.panel}" stroke="${theme.border}" stroke-width="2"/>${options.showAvatar ? avatar(data, 76, 72, 180, theme) : ""}<text x="292" y="130" font-family="${font}" font-size="46" font-weight="700" fill="${theme.text}">${escapeXml(data.name || data.username)}</text><text x="292" y="176" font-family="${font}" font-size="24" fill="${theme.accent}">@${escapeXml(data.username)}</text>${bioLine}${stats.map((item, index) => statPanel(70 + index * 270, 292, 248, item[0], item[1], theme)).join("")}${options.showLanguages ? languagePills(data, 452, theme) : ""}`;
}

function compactLayout(data: ProfileCardData, options: ProfileCardOptions) {
  const { theme, width, height } = options;
  const stats = [[data.followers, "Followers"], [data.totalStars, "Stars"], [data.publicRepos, "Repos"], [data.contributionsThisYear, "Contributions"]] as const;
  return `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="24" fill="${theme.panel}" stroke="${theme.border}" stroke-width="2"/>${options.showAvatar ? avatar(data, 42, 38, 150, theme) : ""}<text x="222" y="86" font-family="${font}" font-size="36" font-weight="700" fill="${theme.text}">${escapeXml(data.name || data.username)}</text><text x="222" y="128" font-family="${font}" font-size="21" fill="${theme.accent}">@${escapeXml(data.username)}</text>${stats.map((item, index) => statPanel(42 + index * 238, 180, 218, item[0], item[1], theme)).join("")}`;
}

function contributionGraphLayout(data: ProfileCardData, options: ProfileCardOptions) {
  const { theme, width, height } = options;
  const days = data.contributionDays.slice(-371);
  const max = Math.max(...days.map((day) => day.contributionCount), 1);
  const cell = 16;
  const gap = 4;
  const startX = 74;
  const startY = 178;
  const cells = days.map((day, index) => {
    const week = Math.floor(index / 7);
    const weekday = index % 7;
    const ratio = day.contributionCount / max;
    const opacity = day.contributionCount === 0 ? 1 : Math.max(0.28, Math.min(1, 0.22 + ratio * 0.78));
    const fill = day.contributionCount === 0 ? theme.panel : theme.accent;
    const label = `${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`;
    return `<rect x="${startX + week * (cell + gap)}" y="${startY + weekday * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${fill}" fill-opacity="${opacity}" stroke="${theme.border}" stroke-width="0.5"><title>${escapeXml(label)}</title></rect>`;
  }).join("");
  return `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="28" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2"/><text x="70" y="88" font-family="${font}" font-size="38" font-weight="700" fill="${theme.text}">${escapeXml(options.title || `${data.username}'s contributions`)}</text><text x="${width - 70}" y="88" text-anchor="end" font-family="${font}" font-size="32" font-weight="700" fill="${theme.text}">${data.contributionsThisYear}</text><text x="${width - 70}" y="116" text-anchor="end" font-family="${font}" font-size="15" fill="${theme.muted}">contributions this year</text><rect x="42" y="148" width="${width - 84}" height="208" rx="22" fill="${theme.panel}" stroke="${theme.border}"/>${cells}<text x="70" y="395" font-family="${font}" font-size="16" fill="${theme.muted}">Less</text><rect x="115" y="380" width="16" height="16" rx="3" fill="${theme.panel}" stroke="${theme.border}"/>${[0.28, 0.52, 0.76, 1].map((opacity, index) => `<rect x="${139 + index * 24}" y="380" width="16" height="16" rx="3" fill="${theme.accent}" fill-opacity="${opacity}"/>`).join("")}<text x="244" y="395" font-family="${font}" font-size="16" fill="${theme.muted}">More</text>${statPanel(70, 450, 300, data.currentStreak, "Current streak (days)", theme)}${statPanel(450, 450, 300, data.longestStreak, "Longest streak (days)", theme)}${statPanel(830, 450, 300, data.totalCommits, "Commits this year", theme)}`;
}

export function renderProfileCard(data: ProfileCardData, options: ProfileCardOptions): string {
  const body = options.type === "profile" ? profileLayout(data, options) : options.type === "compact" ? compactLayout(data, options) : options.type === "contributions" ? contributionGraphLayout(data, options) : repoLayout(data, options);
  return `<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.username)} GitHub profile card"><title>${escapeXml(data.username)} GitHub profile card</title>${body}</svg>`;
}


export function resolveProfileCardOptions(params: URLSearchParams): ProfileCardOptions {
  const type = PROFILE_CARD_TYPES.includes(params.get("type") as ProfileCardType) ? params.get("type") as ProfileCardType : "repo";
  const themeName = params.get("theme") || "github";
  const preset = Object.hasOwn(PROFILE_THEMES, themeName) ? PROFILE_THEMES[themeName] : PROFILE_THEMES.github;
  const custom = (key: keyof ProfileCardTheme) => sanitizeHexParam(params.get(key)) || preset[key];
  const compact = type === "compact";
  return {
    type,
    theme: { bg: custom("bg"), panel: custom("panel"), text: custom("text"), muted: custom("muted"), accent: custom("accent"), border: custom("border") },
    title: params.get("title")?.slice(0, 80) || undefined,
    subtitle: params.get("subtitle")?.slice(0, 140) || undefined,
    showAvatar: params.get("show_avatar") !== "false",
    showLanguages: !compact && params.get("show_languages") !== "false",
    width: compact ? 1000 : 1200,
    height: compact ? 320 : 627,
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
};

export function parseRepository(value: string | null): { owner: string; repo: string } | null {
  const match = value?.trim().match(/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

export async function fetchRepositoryCardData(owner: string, repo: string): Promise<RepositoryCardData> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "github-profile-stats" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 404 ? `Repository "${owner}/${repo}" not found` : `GitHub API responded with status ${response.status}`);
  const json = await response.json();
  // Repository REST open_issues_count includes PRs. Search's is:issue count
  // preserves the label's meaning without paging every open issue/PR.
  const issueQuery = new URLSearchParams({ q: `repo:${owner}/${repo} is:issue is:open`, per_page: "1" });
  const issuesResponse = await fetch(`https://api.github.com/search/issues?${issueQuery}`, { headers, cache: "no-store" });
  if (!issuesResponse.ok) throw new Error(`GitHub issue count request failed: ${issuesResponse.status}`);
  const issues = await issuesResponse.json();
  if (issues.incomplete_results === true || !Number.isSafeInteger(issues.total_count) || issues.total_count < 0) {
    throw new Error("GitHub returned an incomplete issue count");
  }
  let contributors = 0;
  let commits = 0;
  try {
    const contributorsResponse = await fetch(`${json.contributors_url}?per_page=1&anon=true`, { headers, cache: "no-store" });
    if (contributorsResponse.ok) {
      const link = contributorsResponse.headers.get("link") || "";
      const last = link.match(/[?&]page=(\d+)>; rel="last"/);
      contributors = last ? Number(last[1]) : (await contributorsResponse.json()).length;
    }
  } catch {}
  try {
    const commitsResponse = await fetch(`${json.commits_url.replace("{/sha}", "")}?per_page=1`, { headers, cache: "no-store" });
    if (commitsResponse.ok) {
      const link = commitsResponse.headers.get("link") || "";
      const last = link.match(/[?&]page=(\d+)>; rel="last"/);
      commits = last ? Number(last[1]) : (await commitsResponse.json()).length;
    }
  } catch {}
  return { owner: json.owner.login, name: json.name, description: json.description || "", ownerAvatarUrl: json.owner.avatar_url, avatarDataUri: "", contributors, commits, openIssues: issues.total_count, stars: json.stargazers_count, forks: json.forks_count };
}

export function renderRepositoryCard(data: RepositoryCardData, options: ProfileCardOptions): string {
  const { theme, width, height } = options;
  const avatarSvg = options.showAvatar && data.avatarDataUri ? avatar({ username: data.owner, avatarDataUri: data.avatarDataUri } as ProfileCardData, width - 250, 62, 172, theme) : "";
  const body = `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="28" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2"/>${avatarSvg}<text x="70" y="125" font-family="${font}" font-size="38" font-weight="400" fill="${theme.text}">${escapeXml(data.owner)}/</text><text x="${70 + Math.min(data.owner.length * 22 + 22, 360)}" y="125" font-family="${font}" font-size="38" font-weight="700" fill="${theme.text}">${escapeXml(data.name)}</text>${(options.subtitle || data.description) ? `<text x="70" y="185" font-family="${font}" font-size="22" fill="${theme.muted}">${escapeXml((options.subtitle || data.description).slice(0, 95))}</text>` : ""}${[[data.commits, "Commits"], [data.contributors, "Contributors"], [data.openIssues, "Open issues"], [data.stars, "Stars"], [data.forks, "Forks"]].map((item, index) => statPanel(42 + index * 224, 286, 204, item[0], item[1] as string, theme)).join("")}<rect x="0" y="${height - 18}" width="${width}" height="18" fill="${theme.accent}"/>`;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(data.owner)}/${escapeXml(data.name)} repository card"><title>${escapeXml(data.owner)}/${escapeXml(data.name)} repository card</title>${body}</svg>`;
}
