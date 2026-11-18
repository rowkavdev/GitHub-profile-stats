import { Redis } from "@upstash/redis";
import { SITE, SITE_ROUTES } from "./site";

export type StatusLevel = "operational" | "degraded" | "down";

export type StatusEndpointKey =
  | "home"
  | "card"
  | "langs"
  | "mini"
  | "sparkline"
  | "badge"
  | "robots"
  | "sitemap";

export type StatusEndpointSnapshot = {
  key: StatusEndpointKey;
  label: string;
  path: string;
  url: string;
  status: number | null;
  ok: boolean;
  responseTimeMs: number | null;
  checkedAt: string;
  error?: string;
};

export type StatusHistoryEntry = {
  checkedAt: string;
  ok: boolean;
  status: number | null;
  responseTimeMs: number | null;
};

export type StatusEndpointReport = StatusEndpointSnapshot & {
  uptime24h: number | null;
  uptime7d: number | null;
};

export type StatusReport = {
  checkedAt: string;
  overall: {
    status: StatusLevel;
    uptime24h: number | null;
    uptime7d: number | null;
    averageResponseMs: number | null;
    averageApiResponseMs: number | null;
    healthyCount: number;
    totalCount: number;
  };
  endpoints: StatusEndpointReport[];
};

type StatusEndpointDefinition = {
  key: StatusEndpointKey;
  label: string;
  path: string;
};

const STATUS_ENDPOINTS: StatusEndpointDefinition[] = [
  { key: "home", label: "Home page", path: SITE_ROUTES.home },
  {
    key: "card",
    label: "Stats card API",
    path: `${SITE_ROUTES.apiCard}?username=octocat&theme=tokyonight`,
  },
  {
    key: "langs",
    label: "Languages API",
    path: `${SITE_ROUTES.apiLangs}?username=octocat&theme=tokyonight`,
  },
  {
    key: "mini",
    label: "Mini badge API",
    path: `${SITE_ROUTES.apiMini}?username=octocat&metric=stars`,
  },
  {
    key: "sparkline",
    label: "Sparkline API",
    path: `${SITE_ROUTES.apiSparkline}?username=octocat&days=30`,
  },
  { key: "badge", label: "Counter badge API", path: SITE_ROUTES.apiBadge },
  { key: "robots", label: "robots.txt", path: "/robots.txt" },
  { key: "sitemap", label: "sitemap.xml", path: "/sitemap.xml" },
];

const HISTORY_WINDOW_MS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
} as const;

const HISTORY_LIMIT = 200;
const HISTORY_TTL_SECONDS = 14 * 24 * 60 * 60;
const STATUS_TIMEOUT_MS = 7000;

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function buildUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  timeoutId.unref?.();
  return controller.signal;
}

async function probeEndpoint(
  definition: StatusEndpointDefinition,
): Promise<StatusEndpointSnapshot> {
  const url = buildUrl(definition.path);
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: timeoutSignal(STATUS_TIMEOUT_MS),
    });

    // Headers alone decide probe health; discard unused bodies without
    // waiting for cleanup or letting it change the recorded status.
    try { Promise.resolve(response.body?.cancel?.()).catch(() => {}); } catch {}

    return {
      key: definition.key,
      label: definition.label,
      path: definition.path,
      url,
      status: response.status,
      ok: response.ok,
      responseTimeMs: Math.round(performance.now() - startedAt),
      checkedAt,
    };
  } catch (error) {
    return {
      key: definition.key,
      label: definition.label,
      path: definition.path,
      url,
      status: null,
      ok: false,
      responseTimeMs: Math.round(performance.now() - startedAt),
      checkedAt,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function storeSnapshot(snapshot: StatusEndpointSnapshot): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = `status:history:${snapshot.key}`;
  const record: StatusHistoryEntry = {
    checkedAt: snapshot.checkedAt,
    ok: snapshot.ok,
    status: snapshot.status,
    responseTimeMs: snapshot.responseTimeMs,
  };

  await redis
    .multi()
    .lpush(key, record)
    .ltrim(key, 0, HISTORY_LIMIT - 1)
    .expire(key, HISTORY_TTL_SECONDS)
    .exec();
}

function parseHistoryEntry(entry: unknown): StatusHistoryEntry | null {
  let parsed = entry;

  if (typeof entry === "string") {
    try {
      parsed = JSON.parse(entry) as unknown;
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;

  const candidate = parsed as Partial<StatusHistoryEntry>;
  const hasValidStatus =
    candidate.status === null || typeof candidate.status === "number";
  const hasValidResponseTime =
    candidate.responseTimeMs === null ||
    typeof candidate.responseTimeMs === "number";

  if (
    typeof candidate.checkedAt !== "string" ||
    typeof candidate.ok !== "boolean" ||
    !hasValidStatus ||
    !hasValidResponseTime
  ) {
    return null;
  }

  return candidate as StatusHistoryEntry;
}

async function readHistory(key: StatusEndpointKey): Promise<StatusHistoryEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  const rawEntries = await redis.lrange<StatusHistoryEntry | string>(
    `status:history:${key}`,
    0,
    HISTORY_LIMIT - 1,
  );

  return rawEntries
    .map(parseHistoryEntry)
    .filter((entry): entry is StatusHistoryEntry => entry !== null);
}

function computeUptime(
  entries: StatusHistoryEntry[],
  windowMs: number,
): number | null {
  const cutoff = Date.now() - windowMs;
  const recent = entries.filter((entry) => Date.parse(entry.checkedAt) >= cutoff);

  if (recent.length === 0) return null;

  const healthy = recent.filter((entry) => entry.ok).length;
  return (healthy / recent.length) * 100;
}

function computeAverageResponseMs(
  snapshots: StatusEndpointSnapshot[],
): number | null {
  const values = snapshots
    .map((snapshot) => snapshot.responseTimeMs)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

export async function collectStatusReport(): Promise<StatusReport> {
  const checkedAt = new Date().toISOString();
  const snapshots = await Promise.all(
    STATUS_ENDPOINTS.map((definition) => probeEndpoint(definition)),
  );

  await Promise.all(snapshots.map((snapshot) => storeSnapshot(snapshot)));

  const histories = new Map(
    await Promise.all(
      snapshots.map(async (snapshot) => [
        snapshot.key,
        await readHistory(snapshot.key),
      ] as const),
    ),
  );

  const endpoints: StatusEndpointReport[] = snapshots.map((snapshot) => {
    const history = histories.get(snapshot.key) ?? [];
    return {
      ...snapshot,
      uptime24h: computeUptime(history, HISTORY_WINDOW_MS.day),
      uptime7d: computeUptime(history, HISTORY_WINDOW_MS.week),
    };
  });

  const healthyCount = snapshots.filter((snapshot) => snapshot.ok).length;
  const totalCount = snapshots.length;

  let status: StatusLevel = "operational";
  if (healthyCount === 0) {
    status = "down";
  } else if (healthyCount < totalCount) {
    status = "degraded";
  }

  const allHistory = Array.from(histories.values()).flat();
  const apiSnapshots = snapshots.filter((snapshot) =>
    snapshot.path.startsWith("/api/"),
  );

  return {
    checkedAt,
    overall: {
      status,
      uptime24h: computeUptime(allHistory, HISTORY_WINDOW_MS.day),
      uptime7d: computeUptime(allHistory, HISTORY_WINDOW_MS.week),
      averageResponseMs: computeAverageResponseMs(snapshots),
      averageApiResponseMs: computeAverageResponseMs(apiSnapshots),
      healthyCount,
      totalCount,
    },
    endpoints,
  };
}

export function getStatusCopy(status: StatusLevel): {
  label: string;
  description: string;
} {
  switch (status) {
    case "operational":
      return {
        label: "Operational",
        description: "All monitored endpoints are responding normally.",
      };
    case "degraded":
      return {
        label: "Degraded",
        description: "One or more endpoints are slow or returning errors.",
      };
    case "down":
      return {
        label: "Down",
        description: "None of the monitored endpoints responded successfully.",
      };
  }
}

export function formatPercentage(value: number | null): string {
  return value === null ? "n/a" : `${value.toFixed(2)}%`;
}

export function formatMilliseconds(value: number | null): string {
  return value === null ? "n/a" : `${value} ms`;
}
