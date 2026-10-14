import { getTodaysUsers } from "@/lib/tracking";

export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
} as const;

export async function GET() {
  const now = new Date();
  const users = await getTodaysUsers(now);

  return new Response(
    JSON.stringify({
      date: now.toISOString().slice(0, 10),
      users,
    }),
    { status: 200, headers: HEADERS },
  );
}
