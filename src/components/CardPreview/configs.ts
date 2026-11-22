import { EmbedType } from "./types";
import { CardOpts, LangOpts, MiniOpts, SparkOpts } from "./types";

export const STAT_OPTIONS = [
  { key: "stars", label: "Stars" },
  { key: "commits", label: "Commits" },
  { key: "prs", label: "PRs" },
  { key: "issues", label: "Issues" },
  { key: "hours", label: "Hours" },
  { key: "streak", label: "Streak" },
  { key: "week", label: "Contributions This Week" },
  { key: "trend", label: "Contribution Trend" },
  { key: "avg", label: "Avg Contributions / Day" },
  { key: "active_day", label: "Active Day" },
  { key: "grade", label: "Grade" },
  { key: "contributions", label: "Contributions (Past Year)" },
  { key: "repos", label: "Repos" },
  { key: "followers", label: "Followers" },
];

export const MINI_METRICS = [
  "stars",
  "commits",
  "prs",
  "issues",
  "hours",
  "streak",
  "week",
  "followers",
  "repos",
  "contributions",
];

export const EMBED_LABELS: Record<EmbedType, string> = {
  card: "GitHub Stats Card",
  langs: "Top Languages",
  mini: "GitHub Mini Badge",
  sparkline: "Contribution Sparkline",
};

export const CARD_DEFAULTS: CardOpts = {
  showIcons: true,
  showRing: true,
  hideBorder: false,
  hideTitle: false,
  borderRadius: "4.5",
  customTitle: "",
  size: "default",
  compactCount: 6,
  showEmoji: false,
};

export const LANG_DEFAULTS: LangOpts = {
  layout: "bar",
  maxLangs: 8,
  hideBorder: false,
  hideTitle: false,
  borderRadius: "4.5",
};

export const MINI_DEFAULTS: MiniOpts = {
  metric: "stars",
  label: "",
  color: "",
  style: "flat",
};

export const SPARK_DEFAULTS: SparkOpts = {
  days: "30",
  width: "320",
  height: "80",
  title: "",
  lineColor: "",
  fillColor: "",
  hideBorder: false,
  borderRadius: "6",
};
