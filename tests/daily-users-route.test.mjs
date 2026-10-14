import assert from "node:assert/strict";
import test from "node:test";
import { loadRoute } from "./helpers/route-loader.mjs";

const { GET } = loadRoute("app/api/users/today/route.ts", {
  "@/lib/tracking": {
    getTodaysUsers: async () => ["alice", "octocat"],
  },
});

test("daily users endpoint publishes the current UTC set with short caching", async () => {
  const response = await GET();
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.match(payload.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(payload.users, ["alice", "octocat"]);
  assert.match(response.headers.get("cache-control"), /s-maxage=300/);
});
