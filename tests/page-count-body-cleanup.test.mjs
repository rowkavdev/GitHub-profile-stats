import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { fetchRepositoryCardData } = loadRoute('lib/profile-card.ts');

const repoJson = { owner: { login: 'owner' }, name: 'repo',
  contributors_url: 'https://api.github.com/repos/owner/repo/contributors',
  commits_url: 'https://api.github.com/repos/owner/repo/commits{/sha}',
  stargazers_count: 0, forks_count: 0 };

function pageResponse(mode, track) {
  const body = new ReadableStream({
    pull() { track.reads++; },
    cancel() {
      track.cancels++;
      if (mode === 'pending') return new Promise(() => {});
      if (mode === 'rejecting') return Promise.reject(new Error('cleanup rejected'));
      if (mode === 'throwing') throw new Error('cleanup threw');
    },
  }, { highWaterMark: 0 });
  track.bodies.push(body);
  return new Response(body, { status: 200, headers: {
    'content-type': 'application/json',
    link: '<https://api.github.com/repos/owner/repo/commits?per_page=1&page=3>; rel="last"',
  }});
}

function mockCardFetch(track, pageMode) {
  return async url => {
    if (url.includes('/search/issues')) return Response.json({ total_count: 1, incomplete_results: false });
    if (url.includes('/contributors')) return pageResponse(pageMode, track);
    if (url.includes('/commits')) return pageResponse(pageMode, track);
    if (url.includes('/languages')) return Response.json({});
    return Response.json(repoJson);
  };
}

for (const mode of ['settled', 'pending', 'rejecting', 'throwing']) {
  test(`page counts from Link headers discard bodies without waiting (${mode})`, async () => {
    const original = globalThis.fetch;
    const track = { reads: 0, cancels: 0, bodies: [] };
    globalThis.fetch = mockCardFetch(track, mode);
    let timer;
    try {
      const data = await Promise.race([
        fetchRepositoryCardData('owner', 'repo'),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('cleanup blocked')), 300); }),
      ]);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(data.contributors, 3);
      assert.equal(data.commits, 3);
      assert.equal(track.cancels, 2);
      assert.equal(track.reads, 0);
      assert.ok(track.bodies.every(body => !body.locked));
    } finally {
      clearTimeout(timer);
      globalThis.fetch = original;
    }
  });
}

test('failed page count requests discard the error body before throwing', async () => {
  const original = globalThis.fetch;
  const track = { reads: 0, cancels: 0, bodies: [] };
  globalThis.fetch = async url => {
    if (url.includes('/search/issues')) return Response.json({ total_count: 1, incomplete_results: false });
    if (url.includes('/contributors')) return pageResponse('settled', track); // 200 here; commits fails below
    if (url.includes('/commits')) {
      const body = new ReadableStream({ pull() { track.reads++; }, cancel() { track.cancels++; } }, { highWaterMark: 0 });
      track.bodies.push(body);
      return new Response(body, { status: 500, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('/languages')) return Response.json({});
    return Response.json(repoJson);
  };
  try {
    await assert.rejects(fetchRepositoryCardData('owner', 'repo'), /repository count request failed: 500/);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(track.cancels, 2); // Link-header contributors body and the 500 commits body
    assert.equal(track.reads, 0);
  } finally { globalThis.fetch = original; }
});

test('a 204 page count reply stays a zero and discards nothing readable', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    if (url.includes('/search/issues')) return Response.json({ total_count: 1, incomplete_results: false });
    if (url.includes('/contributors')) return new Response(null, { status: 204 });
    if (url.includes('/commits')) return Response.json([]);
    if (url.includes('/languages')) return Response.json({});
    return Response.json(repoJson);
  };
  try {
    const data = await fetchRepositoryCardData('owner', 'repo');
    assert.equal(data.contributors, 0);
    assert.equal(data.commits, 0);
  } finally { globalThis.fetch = original; }
});
