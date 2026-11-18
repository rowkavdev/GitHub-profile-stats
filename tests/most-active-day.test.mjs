// Run with `npm test` (Node 22.18+ strips the TypeScript types in src/lib/github.ts).
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchGitHubStats } from "../src/lib/github.ts";

const realFetch = globalThis.fetch;
beforeEach(() => { process.env.GITHUB_TOKEN = "test-token"; });
afterEach(() => { globalThis.fetch = realFetch; });

function stats(days) {
  const user = {
    name: "Octo Cat", login: "octocat", avatarUrl: "https://example.com/a.png", bio: null, followers: { totalCount: 0 },
    repositories: { totalCount: 0, nodes: [] },
    contributionsCollection: {
      contributionYears: [2026], totalCommitContributions: 0, totalIssueContributions: 0, totalPullRequestContributions: 0,
      contributionCalendar: { totalContributions: 0, weeks: [{ contributionDays: days }] },
    },
  };
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { user } }), { status: 200 });
  return fetchGitHubStats("octocat");
}

test("a user with no contributions has no most active day, not Sunday", async () => {
  const result = await stats([{ contributionCount: 0, date: "2026-09-28" }, { contributionCount: 0, date: "2026-09-29" }]);
  assert.equal(result.mostActiveDay, "None");
});

test("the busiest weekday is still reported when there is activity", async () => {
  // 2026-09-29 is a Tuesday, 2026-09-30 a Wednesday.
  const result = await stats([{ contributionCount: 1, date: "2026-09-29" }, { contributionCount: 5, date: "2026-09-30" }]);
  assert.equal(result.mostActiveDay, "Wednesday");
});
