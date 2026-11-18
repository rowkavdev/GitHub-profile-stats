import { GitHubStats } from "../types";
import { formatNumber } from "../sanitize";

export interface StatItem {
  label: string;
  short: string;
  value: string;
  icon: string;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
}

export function formatTrend(pct: number): {
  direction: "up" | "down" | "neutral";
  text: string;
} {
  if (pct > 0) return { direction: "up", text: `+${pct}%` };
  if (pct < 0) return { direction: "down", text: `${pct}%` };
  return { direction: "neutral", text: "0%" };
}

export function getVisibleStats(
  stats: GitHubStats,
  hide: string[],
  order?: string[],
): StatItem[] {
  const year = new Date().getFullYear();
  const all: (StatItem & { key: string })[] = [
    {
      key: "stars",
      label: "Total Stars Earned",
      short: "Stars",
      value: formatNumber(stats.totalStars),
      icon: "star",
    },
    {
      key: "commits",
      label: `Total Commits (${year})`,
      short: "Commits",
      value: formatNumber(stats.totalCommits),
      icon: "commit",
    },
    {
      key: "prs",
      label: "Pull Requests",
      short: "Pull Requests",
      value: formatNumber(stats.totalPRs),
      icon: "pr",
    },
    {
      key: "issues",
      label: "Issues Opened",
      short: "Issues",
      value: formatNumber(stats.totalIssues),
      icon: "issue",
    },
    {
      key: "hours",
      label: "Estimated Coding Hours",
      short: "Hours",
      value: `${formatNumber(stats.estimatedCodingHours)}h`,
      icon: "clock",
    },
    {
      key: "streak",
      label: "Current Streak",
      short: "Streak",
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`,
      icon: "fire",
    },
    {
      key: "week",
      label: "Commits This Week",
      short: "This Week",
      value: formatNumber(stats.commitsThisWeek),
      icon: "calendar",
    },
    {
      key: "trend",
      label: "Weekly Trend",
      short: "Trend",
      value: `${formatNumber(stats.commitsThisWeek)} ${stats.commitsThisWeek === 1 ? "commit" : "commits"}`,
      icon: "trend",
      trend: formatTrend(stats.weeklyTrend),
    },
    {
      key: "avg",
      label: "Avg Commits / Day",
      short: "Avg / Day",
      value: `${stats.avgCommitsPerDay}`,
      icon: "clock",
    },
    {
      key: "active_day",
      label: "Most Active Day",
      short: "Active Day",
      value: stats.mostActiveDay,
      icon: "day",
    },
    {
      key: "grade",
      label: "Activity Grade",
      short: "Grade",
      value: stats.grade,
      icon: "trophy",
    },
    {
      key: "contributions",
      label: "Contributions This Year",
      short: "Contributions",
      value: formatNumber(stats.contributionsThisYear),
      icon: "graph",
    },
    {
      key: "repos",
      label: "Public Repos",
      short: "Repos",
      value: formatNumber(stats.publicRepos),
      icon: "repo",
    },
    {
      key: "followers",
      label: "Followers",
      short: "Followers",
      value: formatNumber(stats.followers),
      icon: "people",
    },
  ];

  const filtered = all.filter((s) => !hide.includes(s.key));

  if (order && order.length > 0) {
    filtered.sort((a, b) => {
      const ai = order.indexOf(a.key);
      const bi = order.indexOf(b.key);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  return filtered.map(({ label, short, value, icon, trend }) => ({
    label,
    short,
    value,
    icon,
    trend,
  }));
}
