export const SITE = {
  url: "https://ghstats.dev",
  name: "GitHub Profile Stats",
  title: "GitHub Profile Stats & README Cards | GHStats",
  description:
    "Create a live GitHub stats card for your profile README. Show commits, stars, streaks and more; choose a theme, preview the card, then copy the embed code. Free and open source.",
  authorName: "rowkav09",
  authorUrl: "https://github.com/rowkav09",
  creator: "rowkav09",
  publisher: "rowkav09",
  repoUrl: "https://github.com/rowkavdev/GitHub-profile-stats",
  avatarUrl: "https://github.com/rowkav09.png",
  ogImagePath: "/opengraph-image",
} as const;

export const SITE_ROUTES = {
  home: "/",
  status: "/status",
  apiStatus: "/api/status",
  apiStatusBadge: "/api/status/badge",
  apiCard: "/api/card",
  apiLangs: "/api/langs",
  apiMini: "/api/mini",
  apiSparkline: "/api/sparkline",
  apiBadge: "/api/badge",
  apiVisits: "/api/visits",
} as const;

export const ROBOTS_DISALLOW_ROUTES = ["/api/"] as const;

export const SITEMAP_ROUTES = [
  {
    url: SITE.url,
    changeFrequency: "weekly" as const,
    priority: 1,
  },
  {
    url: new URL(SITE_ROUTES.status, SITE.url).href,
    changeFrequency: "hourly" as const,
    priority: 0.5,
  },
] as const;
