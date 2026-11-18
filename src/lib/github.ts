import type { GitHubStats, ContributionDay, LanguageStat } from "./types";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_TOKEN_ENV_KEYS = [
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "GITHUB_ACCESS_TOKEN",
] as const;

function getGitHubToken(): string | undefined {
  for (const key of GITHUB_TOKEN_ENV_KEYS) {
    const token = process.env[key];
    if (token && token.trim().length > 0) {
      return token.trim();
    }
  }

  return undefined;
}

function getGitHubAuthError(status: number): string {
  if (status === 401) {
    return "GitHub API authentication failed (401). Check that GITHUB_TOKEN, GH_TOKEN, or GITHUB_ACCESS_TOKEN is set and still valid.";
  }

  if (status === 403) {
    return "GitHub API access was forbidden (403). Your token may be missing required access or you may have hit a secondary rate limit.";
  }

  return `GitHub API responded with status ${status}`;
}

const QUERY = `
query($username: String!) {
  user(login: $username) {
    name
    login
    avatarUrl
    bio
    followers {
      totalCount
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
      orderBy: { field: STARGAZERS, direction: DESC }
      isFork: false
    ) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }
    contributionsCollection {
      contributionYears
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function calculateStreak(days: ContributionDay[]): {
  current: number;
  longest: number;
} {
  // Streaks follow calendar dates, not neighbouring array entries, so a
  // missing or stale date ends a run.
  const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const active = [...new Set(
    days.filter((day) => day.contributionCount > 0).map((day) => dayNumber(day.date)),
  )].sort((a, b) => a - b);
  const todayNumber = Math.floor(Date.now() / 86_400_000);
  const past = active.filter((n) => n <= todayNumber);

  let longest = 0;
  let run = 0;
  for (let i = 0; i < past.length; i++) {
    run = i > 0 && past[i] === past[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // An empty today does not end a streak that ran through yesterday.
  let current = 0;
  const last = past[past.length - 1];
  if (last !== undefined && last >= todayNumber - 1) {
    current = 1;
    for (let i = past.length - 2; i >= 0 && past[i] === past[i + 1] - 1; i--) current++;
  }

  return { current, longest };
}

function calculateWeeklyTrend(
  days: ContributionDay[],
): { thisWeek: number; lastWeek: number } {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setUTCDate(twoWeeksAgo.getUTCDate() - 14);

  const today = now.toISOString().split("T")[0];
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

  const thisWeek = days
    .filter((d) => d.date > weekAgoStr && d.date <= today)
    .reduce((sum, d) => sum + d.contributionCount, 0);

  const lastWeek = days
    .filter((d) => d.date > twoWeeksAgoStr && d.date <= weekAgoStr)
    .reduce((sum, d) => sum + d.contributionCount, 0);

  return { thisWeek, lastWeek };
}

function calculateMostActiveDay(days: ContributionDay[]): string {
  const totals = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
  for (const d of days) {
    const dow = new Date(d.date + "T00:00:00").getDay();
    totals[dow] += d.contributionCount;
  }
  const best = Math.max(...totals);
  // With no contributions every day ties at 0, and indexOf would report
  // Sunday as the most active day.
  if (best === 0) return "None";
  return DAY_NAMES[totals.indexOf(best)];
}

function calculateAvgCommitsPerDay(days: ContributionDay[]): number {
  if (days.length === 0) return 0;
  const total = days.reduce((sum, d) => sum + d.contributionCount, 0);
  return Math.round((total / days.length) * 10) / 10;
}

function calculateActivityLevel(days: ContributionDay[]): number {
  // Activity level: % of days in past 7 that had at least 1 contribution
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const cutoff = weekAgo.toISOString().split("T")[0];

  const today = now.toISOString().split("T")[0];
  const recent = days.filter((d) => d.date > cutoff && d.date <= today);
  if (recent.length === 0) return 0;
  const activeDays = recent.filter((d) => d.contributionCount > 0).length;
  return Math.round((activeDays / recent.length) * 100);
}

function calculateGrade(activityLevel: number, streak: number, commitsThisWeek: number): string {
  // Weighted score: 50% activity (past 7 days), 25% streak (capped at 7 days), 25% weekly volume (capped at 20)
  const actScore = activityLevel; // 0–100
  const streakScore = Math.min(streak / 7, 1) * 100;
  const commitScore = Math.min(commitsThisWeek / 20, 1) * 100;
  const score = actScore * 0.5 + streakScore * 0.25 + commitScore * 0.25;

  if (score >= 80) return "A+";
  if (score >= 65) return "A";
  if (score >= 50) return "B+";
  if (score >= 35) return "B";
  if (score >= 20) return "C";
  return "D";
}

function calculateEstimatedCodingHours(
  commits: number,
  prs: number,
  issues: number,
): number {
  // Estimated hours based on yearly GitHub contribution events.
  const commitHours = commits * 0.5;
  const prHours = prs * 1.5;
  const issueHours = issues * 0.4;
  return Math.round((commitHours + prHours + issueHours) * 10) / 10;
}

type RepoLanguageNode = {
  stargazerCount?: number;
  languages?: { edges: Array<{ size: number; node: { name: string; color: string | null } }> } | null;
};

function aggregateLanguages(repos: RepoLanguageNode[]): LanguageStat[] {
  const langTotals: Record<string, { size: number; color: string }> = {};
  for (const repo of repos) {
    for (const edge of repo.languages?.edges ?? []) {
      const { name, color } = edge.node;
      if (!langTotals[name]) langTotals[name] = { size: 0, color: color ?? "#858585" };
      langTotals[name].size += edge.size;
    }
  }
  const totalLangSize = Object.values(langTotals).reduce((s, l) => s + l.size, 0);
  return Object.entries(langTotals)
    .map(([name, { size, color }]) => ({
      name,
      size,
      color: color || "#858585",
      percentage: totalLangSize > 0 ? Math.round((size / totalLangSize) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 12);
}

// ---------------------------------------------------------------------------
// Extra owners (opt-in, e.g. `?orgs=rowkavdev`)
//
// When someone moves their repos into an org, the stars, repo count and
// languages of those repos stop showing on their card, because those come from
// repositories the *user* owns. A card can opt in to also counting the public,
// non-fork repos owned by up to MAX_EXTRA_OWNERS other accounts (usually orgs).
//
// What "combined" means, per stat:
// - stars, repos, languages: summed across the user and the extra owners'
//   public, non-fork repos (top 100 by stars per owner, same limit as the user).
// - commits, PRs, issues, contributions, streaks, weekly/activity stats: NOT
//   summed. GitHub already credits a user's commits, PRs and issues in org repos
//   to that user's own contribution calendar, so adding org activity would
//   double count it (and would count other people's work).
// - followers, name, avatar, bio: always the user's own.
// Without the param nothing changes: no extra requests, same output.
// ---------------------------------------------------------------------------

export const MAX_EXTRA_OWNERS = 3;

const OWNER_LOGIN_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function parseExtraOwners(raw: string | null | undefined, username?: string | null): string[] {
  if (!raw) return [];
  const self = username?.toLowerCase();
  const seen = new Set<string>();
  const owners: string[] = [];
  for (const part of raw.split(",")) {
    const login = part.trim();
    if (!OWNER_LOGIN_RE.test(login)) continue;
    const key = login.toLowerCase();
    if (key === self || seen.has(key)) continue;
    seen.add(key);
    owners.push(login);
    if (owners.length >= MAX_EXTRA_OWNERS) break;
  }
  return owners;
}

const OWNER_REPOS_QUERY = `
query($login: String!) {
  repositoryOwner(login: $login) {
    login
    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }
  }
}`;

type OwnerRepos = { login: string; totalCount: number; nodes: RepoLanguageNode[] };

async function fetchOwnerRepos(login: string, token: string): Promise<OwnerRepos> {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-stats",
    },
    body: JSON.stringify({ query: OWNER_REPOS_QUERY, variables: { login } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(getGitHubAuthError(response.status));
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "Unknown GraphQL error");
  const owner = json.data?.repositoryOwner;
  if (!owner) throw new Error(`Account "${login}" in orgs= not found`);
  return {
    login: owner.login,
    totalCount: owner.repositories.totalCount,
    nodes: owner.repositories.nodes ?? [],
  };
}

function fetchExtraOwners(extraOwners: string[], token: string): Promise<OwnerRepos[]> {
  return Promise.all(extraOwners.map((login) => fetchOwnerRepos(login, token)));
}

type ContributionTotals = { totalCommitContributions: number; totalIssueContributions: number; totalPullRequestContributions: number };

async function fetchAllTimeTotals(username: string, token: string, years: number[]): Promise<ContributionTotals> {
  const collections = years.map((year) => `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year + 1}-01-01T00:00:00Z") { totalCommitContributions totalIssueContributions totalPullRequestContributions }`).join("\n");
  const response = await fetch(GITHUB_GRAPHQL, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "github-profile-stats" }, body: JSON.stringify({ query: `query($username: String!) { user(login: $username) { ${collections} } }`, variables: { username } }), cache: "no-store" });
  if (!response.ok) throw new Error(getGitHubAuthError(response.status));
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "Unable to load all-time contributions.");
  return Object.values(json.data.user as Record<string, ContributionTotals>).reduce((total, value) => ({ totalCommitContributions: total.totalCommitContributions + value.totalCommitContributions, totalIssueContributions: total.totalIssueContributions + value.totalIssueContributions, totalPullRequestContributions: total.totalPullRequestContributions + value.totalPullRequestContributions }), { totalCommitContributions: 0, totalIssueContributions: 0, totalPullRequestContributions: 0 });
}

export async function fetchGitHubStats(
  username: string,
  allTime = false,
  extraOwners: string[] = [],
): Promise<GitHubStats> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error(
      "GitHub API token is not set. Configure GITHUB_TOKEN, GH_TOKEN, or GITHUB_ACCESS_TOKEN.",
    );
  }

  const extraPromise = extraOwners.length > 0 ? fetchExtraOwners(extraOwners, token) : null;
  // Don't leave a rejected extra-owner request unhandled if the user query fails first.
  extraPromise?.catch(() => {});

  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-stats",
    },
    body: JSON.stringify({ query: QUERY, variables: { username } }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(getGitHubAuthError(response.status));
  }

  const json = await response.json();

  if (json.errors) {
    const msg = json.errors[0]?.message ?? "Unknown GraphQL error";
    throw new Error(msg);
  }

  const user = json.data?.user;
  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  const contrib = user.contributionsCollection;
  const totals = allTime
    ? await fetchAllTimeTotals(username, token, contrib.contributionYears)
    : contrib;
  const calendar = contrib.contributionCalendar;

  const allDays: ContributionDay[] = calendar.weeks.flatMap(
    (w: { contributionDays: ContributionDay[] }) => w.contributionDays,
  );

  const extras = extraPromise ? await extraPromise : [];
  const repoNodes: RepoLanguageNode[] = [
    ...user.repositories.nodes,
    ...extras.flatMap((owner) => owner.nodes),
  ];

  const totalStars = repoNodes.reduce(
    (sum: number, repo) => sum + (repo.stargazerCount ?? 0),
    0,
  );
  const publicRepos =
    user.repositories.totalCount +
    extras.reduce((sum, owner) => sum + owner.totalCount, 0);

  // Aggregate language sizes across all repos
  const languages = aggregateLanguages(repoNodes);

  const { current, longest } = calculateStreak(allDays);
  const { thisWeek, lastWeek } = calculateWeeklyTrend(allDays);
  const weeklyTrend =
    lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const activityLevel = calculateActivityLevel(allDays);
  const estimatedCodingHours = calculateEstimatedCodingHours(
    totals.totalCommitContributions,
    totals.totalPullRequestContributions,
    totals.totalIssueContributions,
  );

  return {
    username: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    totalStars,
    totalCommits: totals.totalCommitContributions,
    totalPRs: totals.totalPullRequestContributions,
    totalIssues: totals.totalIssueContributions,
    estimatedCodingHours,
    currentStreak: current,
    longestStreak: longest,
    commitsThisWeek: thisWeek,
    commitsLastWeek: lastWeek,
    weeklyTrend,
    avgCommitsPerDay: calculateAvgCommitsPerDay(allDays),
    mostActiveDay: calculateMostActiveDay(allDays),
    publicRepos,
    followers: user.followers.totalCount,
    contributionsThisYear: calendar.totalContributions,
    activityLevel,
    grade: calculateGrade(activityLevel, current, thisWeek),
    languages,
    contributionDays: allDays,
  };
}

const LANG_QUERY = `
query($username: String!) {
  user(login: $username) {
    repositories(
      first: 50
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node { name color }
          }
        }
      }
    }
  }
}`;

export async function fetchLanguageStats(
  username: string,
  extraOwners: string[] = [],
): Promise<LanguageStat[]> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error(
      "GitHub API token is not set. Configure GITHUB_TOKEN, GH_TOKEN, or GITHUB_ACCESS_TOKEN.",
    );
  }

  const extraPromise = extraOwners.length > 0 ? fetchExtraOwners(extraOwners, token) : null;
  extraPromise?.catch(() => {});

  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-profile-stats",
    },
    body: JSON.stringify({ query: LANG_QUERY, variables: { username } }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(getGitHubAuthError(response.status));
  }

  const json = await response.json();

  if (json.errors) {
    const msg = json.errors[0]?.message ?? "Unknown GraphQL error";
    throw new Error(msg);
  }

  const user = json.data?.user;
  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  const extras = extraPromise ? await extraPromise : [];
  return aggregateLanguages([
    ...user.repositories.nodes,
    ...extras.flatMap((owner) => owner.nodes),
  ]);
}
