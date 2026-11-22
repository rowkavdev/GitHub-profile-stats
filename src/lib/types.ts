export interface LanguageStat {
  name: string;
  size: number;
  color: string; // hex color from GitHub
  percentage: number; // 0-100
}

export interface GitHubStats {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  totalStars: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  estimatedCodingHours: number;
  currentStreak: number;
  longestStreak: number;
  commitsThisWeek: number;
  commitsLastWeek: number;
  weeklyTrend: number; // percentage change vs last week
  avgCommitsPerDay: number;
  mostActiveDay: string; // e.g. "Monday"
  publicRepos: number;
  followers: number;
  contributionsThisYear: number;
  activityLevel: number; // 0–100 percentage for the ring
  grade: string; // A+, A, B+, B, C, D
  languages: LanguageStat[];
  contributionDays: ContributionDay[]; // daily contributions used for sparklines and analytics
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface CardOptions {
  allTime?: boolean;
  theme: string;
  hide_border: boolean;
  hide_title: boolean;
  hide: string[];
  show_icons: boolean;
  show_ring: boolean;
  border_radius: number;
  custom_title?: string;
  size: "default" | "compact";
  compact_count: 3 | 4 | 6;
  show_emoji: boolean;
  order?: string[]; // custom stat display order
}

//This is the single source of truth.  Add new Language Options here.
export const LANG_CHART_LAYOUTS = [
  "donut",
  "donut_vertical",
  "compact",
  "bar",
  "stacked",
  "horizontal_list",
  "vertical_list",
  "grid",
] as const;

export type LangChartLayout = (typeof LANG_CHART_LAYOUTS)[number];

export interface LangChartOptions {
  hide_border: boolean;
  hide_title: boolean;
  custom_title?: string;
  border_radius: number;
  max_langs: number; // max languages to show (default 8)
  layout: LangChartLayout;
}

export type StatKey =
  | "stars"
  | "commits"
  | "prs"
  | "issues"
  | "hours"
  | "streak"
  | "week"
  | "trend"
  | "avg"
  | "active_day"
  | "grade"
  | "repos"
  | "followers"
  | "contributions";
