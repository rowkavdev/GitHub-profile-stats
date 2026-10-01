import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const script = new URL('../scripts/check-uptime.mjs', import.meta.url);
function check(report) {
  return spawnSync(process.execPath, [script.pathname], { input: JSON.stringify(report), encoding: 'utf8' });
}
test('uptime probe rejects an outage even with a successful HTTP response', () => {
  const result = check({ overall: { status: 'down', healthyCount: 0, totalCount: 8 } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /down/);
});
test('uptime probe rejects partial outages and malformed reports', () => {
  for (const overall of [{ status: 'degraded', healthyCount: 7, totalCount: 8 }, {}, { status: 'operational', healthyCount: 0, totalCount: 8 }]) {
    assert.equal(check({ overall }).status, 1);
  }
});
test('uptime probe accepts an operational report with all endpoints healthy', () => {
  assert.equal(check({ overall: { status: 'operational', healthyCount: 8, totalCount: 8 } }).status, 0);
});
test('scheduled workflow checks the report body, not only its HTTP status', () => {
  assert.match(readFileSync(new URL('../.github/workflows/uptime-probe.yml', import.meta.url), 'utf8'), /node scripts\/check-uptime\.mjs/);
});
