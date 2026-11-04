import { readStatusReport } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await readStatusReport();

  if (!report) return Response.json({ error: "No status report is available" }, {
    status: 503, headers: { "Cache-Control": "no-store" },
  });
  return Response.json(report, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
