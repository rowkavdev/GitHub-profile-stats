import { timingSafeEqual } from "node:crypto";
import { collectScheduledStatusReport } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";
  const actualBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (!secret || actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await collectScheduledStatusReport();
    if (!report) return Response.json({ error: "No report available" }, { status: 503 });
    return Response.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Status collection failed" }, { status: 503 });
  }
}
