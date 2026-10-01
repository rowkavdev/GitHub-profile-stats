import { Redis } from "@upstash/redis";

const USERS_SET_KEY = "embed:users";

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/** Record a username that used the embed (fire-and-forget). */
export async function trackUser(username: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.sadd(USERS_SET_KEY, username.toLowerCase());
}

/** Return the number of unique usernames that have ever used the embed. */
export async function getUserCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return await redis.scard(USERS_SET_KEY);
}

const VISITS_KEY = "embed:visits";

/** Increment and return total visit count. */
export async function trackVisit(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return await redis.incr(VISITS_KEY);
}

/** Return total visit count without incrementing. */
export async function getVisitCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return (await redis.get<number>(VISITS_KEY)) ?? 0;
}

// Active counters keep their accumulated count. Anonymous counters that have
// not been used for 90 days expire, so invented names do not persist forever.
const VIEW_RETENTION_SECONDS = 90 * 24 * 60 * 60;
const TRACK_VIEW_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[1])
return count
`;

function viewKey(username: string, repo?: string): string {
  return repo ? `views:${username.toLowerCase()}/${repo.toLowerCase()}` : `views:${username.toLowerCase()}`;
}

/** Atomically increment and refresh retention, preserving legacy counts. */
export async function trackView(username: string, repo?: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return await redis.eval<[number], number>(TRACK_VIEW_SCRIPT, [viewKey(username, repo)], [VIEW_RETENTION_SECONDS]);
}

/** Reads do not create counters or extend their lifetime. */
export async function getViewCount(username: string, repo?: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return (await redis.get<number>(viewKey(username, repo))) ?? 0;
}

// Legacy aliases kept for backward compatibility
export const trackProfileView = (username: string) => trackView(username);
export const getProfileViewCount = (username: string) => getViewCount(username);
