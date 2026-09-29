export type CacheProfileName = "activity" | "default" | "slow" | "daily" | "no-store";

export type MiniMetricKey =
  | "stars"
  | "commits"
  | "prs"
  | "issues"
  | "streak"
  | "week"
  | "followers"
  | "repos"
  | "contributions";

type CacheProfile = {
  browserMaxAge: number;
  edgeMaxAge: number;
  staleWhileRevalidate: number;
};

const CACHE_PROFILES: Record<Exclude<CacheProfileName, "no-store">, CacheProfile> = {
  activity: {
    browserMaxAge: 300,
    edgeMaxAge: 1800,
    staleWhileRevalidate: 3600,
  },
  default: {
    browserMaxAge: 300,
    edgeMaxAge: 1800,
    staleWhileRevalidate: 3600,
  },
  slow: {
    browserMaxAge: 1800,
    edgeMaxAge: 21600,
    staleWhileRevalidate: 86400,
  },
  daily: {
    browserMaxAge: 3600,
    edgeMaxAge: 86400,
    staleWhileRevalidate: 172800,
  },
};

const MINI_METRIC_PROFILES: Record<MiniMetricKey, CacheProfileName> = {
  stars: "daily",
  commits: "activity",
  prs: "activity",
  issues: "activity",
  streak: "activity",
  week: "activity",
  followers: "slow",
  repos: "slow",
  contributions: "activity",
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export function getCacheHeaders(profileName: CacheProfileName): Record<string, string> {
  if (profileName === "no-store") {
    return { ...NO_CACHE_HEADERS };
  }

  const profile = CACHE_PROFILES[profileName];
  return {
    "Cache-Control": `public, max-age=${profile.browserMaxAge}, s-maxage=${profile.edgeMaxAge}, stale-while-revalidate=${profile.staleWhileRevalidate}`,
    "CDN-Cache-Control": `public, s-maxage=${profile.edgeMaxAge}, stale-while-revalidate=${profile.staleWhileRevalidate}`,
    "Vercel-CDN-Cache-Control": `public, s-maxage=${profile.edgeMaxAge}, stale-while-revalidate=${profile.staleWhileRevalidate}`,
  };
}

export function getMiniMetricCacheProfile(metric: string): CacheProfileName {
  return Object.hasOwn(MINI_METRIC_PROFILES, metric)
    ? MINI_METRIC_PROFILES[metric as MiniMetricKey]
    : "default";
}
