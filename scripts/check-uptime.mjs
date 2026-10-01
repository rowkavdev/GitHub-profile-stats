import { readFileSync } from 'node:fs';
try {
  const { overall } = JSON.parse(readFileSync(0, 'utf8'));
  if (overall?.status !== 'operational' || !Number.isInteger(overall.totalCount) || overall.totalCount < 1 || overall.healthyCount !== overall.totalCount) {
    throw new Error(`Service ${overall?.status ?? 'unknown'}: ${overall?.healthyCount ?? '?'}/${overall?.totalCount ?? '?'} endpoints healthy`);
  }
  console.log(`Operational: ${overall.healthyCount}/${overall.totalCount} endpoints healthy`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
