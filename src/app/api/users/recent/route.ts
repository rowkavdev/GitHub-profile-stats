import { getRecentUsers } from "@/lib/tracking";

export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
} as const;

export async function GET() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const users = await getRecentUsers(end);

  return new Response(
    JSON.stringify({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      users,
    }),
    { status: 200, headers: HEADERS },
  );
}
