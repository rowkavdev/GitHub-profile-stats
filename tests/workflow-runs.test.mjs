import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchWorkflowRuns } from "../src/lib/workflow-runs.ts";
import { resolveWorkflowOwners } from "../src/lib/workflow-scope.ts";

const originalFetch = globalThis.fetch;
let calls;
beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push([url, init]);
    if (url.endsWith("/graphql")) {
      const { variables } = JSON.parse(init.body);
      const nodes = variables.login === "user" ? ["one", "two"] : ["shared"];
      return new Response(JSON.stringify({ data: { repositoryOwner: { repositories: {
        nodes: nodes.map((name) => ({ name, owner: { login: variables.login } })),
        pageInfo: { hasNextPage: false, endCursor: null },
      } } } }));
    }
    return new Response(JSON.stringify({ total_count: url.includes("/two/") ? 0 : 7 }));
  };
});
afterEach(() => { globalThis.fetch = originalFetch; });

test("totals public repos of user and opt-in owner with one run-count call per repo", async () => {
  assert.deepEqual(await fetchWorkflowRuns(["user", "org"]), { count: 14, repos: 3 });
  const graph = calls.filter(([url]) => url.endsWith("/graphql"));
  const runs = calls.filter(([url]) => url.includes("/actions/runs"));
  assert.equal(graph.length, 2);
  assert.equal(runs.length, 3);
  assert.ok(runs.every(([url]) => url.endsWith("?per_page=1")));
  assert.ok(graph.every(([, init]) => init.body.includes("privacy: PUBLIC")));
});

test("failure refuses partial totals", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/graphql")) return new Response(JSON.stringify({ data: { repositoryOwner: { repositories: {
      nodes: [{ name: "a", owner: { login: "user" } }, { name: "b", owner: { login: "user" } }],
      pageInfo: { hasNextPage: false, endCursor: null },
    } } } }));
    return url.includes("/b/") ? new Response("{}", { status: 403 }) : new Response('{"total_count":12}');
  };
  await assert.rejects(fetchWorkflowRuns(["user"]), /failed \(403\)/);
});

test("missing owner fails rather than publishing zero", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { repositoryOwner: null } }));
  await assert.rejects(fetchWorkflowRuns(["missing"]), /not found/);
});

test("fixed owner scope rejects arbitrary requests before any GitHub lookup", () => {
  assert.deepEqual(resolveWorkflowOwners("rowkav09", null), ["rowkav09"]);
  assert.deepEqual(resolveWorkflowOwners("ROWKAV09", "ROWKAVDEV"), ["rowkav09", "rowkavdev"]);
  for (const [username, org] of [["attacker", null], ["rowkav09", "other"], ["rowkav09", "rowkavdev,other"], ["rowkav09", ""]]) {
    assert.equal(resolveWorkflowOwners(username, org), null);
  }
});

// Small atomic Redis model: SET NX/EX, GET, and the two Lua compare operations.
function fakeRedis() {
  const data = new Map();
  return {
    data,
    async get(key) { return data.get(key)?.value ?? null; },
    async set(key, value, options = {}) {
      if (options.nx && data.has(key)) return null;
      data.set(key, { value, expires: options.ex });
      return "OK";
    },
    async eval(script, keys, args) {
      if (data.get(keys[0])?.value !== args[0]) return 0;
      if (keys.length === 2) { data.set(keys[1], { value: JSON.parse(args[1]) }); return 1; }
      data.delete(keys[0]); return 1;
    },
  };
}

test("failed attempt consumes its variant daily budget", async () => {
  const { getWorkflowRuns } = await import("../src/lib/workflow-runs.ts");
  const store = fakeRedis();
  let attempts = 0;
  const fail = async () => { attempts++; throw new Error("upstream failed"); };
  await assert.rejects(getWorkflowRuns(["rowkav09"], store, fail), /upstream failed/);
  await assert.rejects(getWorkflowRuns(["rowkav09"], store, fail), /updating/);
  assert.equal(attempts, 1);
  assert.equal(store.data.get("workflow-runs:v1:rowkav09:daily-attempt").expires, 86400);
});

test("old holder cannot remove successor lease or overwrite newer total", async () => {
  const { getWorkflowRuns } = await import("../src/lib/workflow-runs.ts");
  const store = fakeRedis();
  let release;
  const waiting = new Promise((r) => { release = r; });
  const first = getWorkflowRuns(["rowkav09"], store, async () => { await waiting; return { count: 4, repos: 1 }; });
  // Let the asynchronous Redis operations reach the paused refresh.
  for (let i = 0; i < 20 && ![...store.data.keys()].some((k) => k.endsWith(":lock")); i++) await Promise.resolve();
  const lockKey = "workflow-runs:v1:rowkav09:lock";
  store.data.set(lockKey, { value: "successor" });
  store.data.set("workflow-runs:v1:rowkav09", { value: { count: 99, repos: 1, updated: Date.now() } });
  release();
  await assert.rejects(first, /lease expired/);
  assert.equal(store.data.get(lockKey).value, "successor");
  assert.equal(store.data.get("workflow-runs:v1:rowkav09").value.count, 99);
});

for (const order of [["rowkav09", "rowkav09,rowkavdev"], ["rowkav09,rowkavdev", "rowkav09"]]) {
  test(`cold starts in order ${order.join(" then ")} each get one bounded sweep`, async () => {
    const { getWorkflowRuns } = await import("../src/lib/workflow-runs.ts");
    const store = fakeRedis();
    let attempts = 0;
    const refresh = async () => ({ count: ++attempts, repos: 1 });
    for (const variant of order) {
      const owners = variant.split(",");
      const first = await getWorkflowRuns(owners, store, refresh);
      assert.equal(first.count, attempts);
      assert.equal((await getWorkflowRuns(owners, store, refresh)).count, first.count);
    }
    assert.equal(attempts, 2);
    assert.equal([...store.data.keys()].filter((key) => key.endsWith(":daily-attempt")).length, 2);
    await assert.rejects(getWorkflowRuns(["stranger"], store, refresh), /Unsupported/);
    assert.equal(attempts, 2);
  });
}
