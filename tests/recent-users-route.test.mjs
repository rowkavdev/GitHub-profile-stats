import assert from "node:assert/strict";
import test from "node:test";
import { loadRoute } from "./helpers/route-loader.mjs";

const { GET } = loadRoute("app/api/users/recent/route.ts", {
  "@/lib/tracking": {
    getRecentUsers: async () => ["alice", "octocat"],
  },
});

test("recent users endpoint publishes a seven-day UTC window with short caching", async () => {
  const response = await GET();
  const payload = await response.json();
  const start = new Date(`${payload.startDate}T00:00:00.000Z`);
  const end = new Date(`${payload.endDate}T00:00:00.000Z`);

  assert.equal(response.status, 200);
  assert.equal((end.getTime() - start.getTime()) / 86_400_000, 6);
  assert.deepEqual(payload.users, ["alice", "octocat"]);
  assert.match(response.headers.get("cache-control"), /s-maxage=300/);
});
