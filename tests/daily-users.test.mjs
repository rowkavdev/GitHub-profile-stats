import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire, Module } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import ts from "typescript";

function load(file, stubs) {
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = new Module(file);
  loaded.filename = file;
  loaded.paths = Module._nodeModulePaths(dirname(file));
  const nativeRequire = createRequire(file);
  loaded.require = (id) => stubs[id] ?? nativeRequire(id);
  loaded._compile(code, file);
  return loaded.exports;
}

test("recent users are normalized, deduplicated across seven UTC days, and short-lived", async () => {
  const commands = [];
  const dailyKey = "embed:users:daily:2026-10-15";

  class RedisMock {
    pipeline() {
      const pipeline = {
        sadd(key, value) {
          commands.push(["sadd", key, value]);
          return pipeline;
        },
        expire(key, seconds) {
          commands.push(["expire", key, seconds]);
          return pipeline;
        },
        async exec() {
          return [1, 1, 1];
        },
      };
      return pipeline;
    }

    async smembers(key) {
      commands.push(["smembers", key]);
      if (key.endsWith("2026-10-15")) return ["zed", "alice"];
      if (key.endsWith("2026-10-14")) return ["bob", "alice"];
      return [];
    }
  }

  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test";

  try {
    const tracking = load(join(process.cwd(), "src/lib/tracking.ts"), {
      "@upstash/redis": { Redis: RedisMock },
    });
    const date = new Date("2026-10-15T12:00:00.000Z");

    await tracking.trackUser("OctoCat", date);
    assert.deepEqual(await tracking.getRecentUsers(date), ["alice", "bob", "zed"]);
    assert.deepEqual(commands, [
      ["sadd", "embed:users", "octocat"],
      ["sadd", dailyKey, "octocat"],
      ["expire", dailyKey, 691200],
      ["smembers", "embed:users:daily:2026-10-15"],
      ["smembers", "embed:users:daily:2026-10-14"],
      ["smembers", "embed:users:daily:2026-10-13"],
      ["smembers", "embed:users:daily:2026-10-12"],
      ["smembers", "embed:users:daily:2026-10-11"],
      ["smembers", "embed:users:daily:2026-10-10"],
      ["smembers", "embed:users:daily:2026-10-09"],
    ]);
  } finally {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
