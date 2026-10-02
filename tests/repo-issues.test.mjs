import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { fetchRepositoryCardData } = loadRoute('lib/profile-card.ts');
test('repository open issue count excludes PRs rather than trusting combined REST total', async () => {
  const original = globalThis.fetch; let query;
  globalThis.fetch = async url => {
    if (url.includes('/search/issues')) { query = new URL(url).searchParams.get('q'); return Response.json({ total_count: 1, incomplete_results: false, items: [{ id: 1 }] }); }
    if (url.includes('/contributors')) return Response.json([]);
    if (url.includes('/commits')) return Response.json([]);
    return Response.json({ owner: { login: 'owner' }, name: 'repo', open_issues_count: 16, contributors_url: 'https://api.github.com/repos/owner/repo/contributors', commits_url: 'https://api.github.com/repos/owner/repo/commits{/sha}', stargazers_count: 0, forks_count: 0 });
  };
  try { assert.equal((await fetchRepositoryCardData('owner', 'repo')).openIssues, 1); assert.equal(query, 'repo:owner/repo is:issue is:open'); }
  finally { globalThis.fetch = original; }
});
test('failed issue-only query cannot silently fall back to inflated total', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => url.includes('/search/issues') ? new Response('{}', { status: 403 }) : Response.json({ owner: { login: 'owner' }, name: 'repo', open_issues_count: 16 });
  try { await assert.rejects(fetchRepositoryCardData('owner', 'repo')); } finally { globalThis.fetch = original; }
});

test('failed contributors lookup does not render a verified zero total', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    if (url.includes('/search/issues')) return Response.json({ total_count: 1, incomplete_results: false });
    if (url.includes('/contributors')) return Response.json({ message: 'rate limited' }, { status: 403 });
    if (url.includes('/commits')) return Response.json([]);
    if (url.includes('/languages')) return Response.json({});
    return Response.json({ owner: { login: 'owner' }, name: 'repo', contributors_url: 'https://api.github.com/repos/owner/repo/contributors', commits_url: 'https://api.github.com/repos/owner/repo/commits{/sha}', stargazers_count: 0, forks_count: 0 });
  };
  try { await assert.rejects(fetchRepositoryCardData('owner', 'repo'), /403/); }
  finally { globalThis.fetch = original; }
});
test('successful repository count lookups retain actual metrics', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=async url=>{
    if(url.includes('/search/issues'))return Response.json({total_count:1,incomplete_results:false});
    if(url.includes('/contributors'))return Response.json([{login:'one'},{login:'two'}]);
    if(url.includes('/commits'))return Response.json([{sha:'one'}],{headers:{link:'<https://api.github.com/repos/owner/repo/commits?per_page=1&page=42>; rel="last"'}});
    if(url.includes('/languages'))return Response.json({TypeScript:100});
    return Response.json({owner:{login:'owner'},name:'repo',contributors_url:'https://api.github.com/repos/owner/repo/contributors',commits_url:'https://api.github.com/repos/owner/repo/commits{/sha}',stargazers_count:5,forks_count:2});
  };
  try{const data=await fetchRepositoryCardData('owner','repo');assert.equal(data.contributors,2);assert.equal(data.commits,42);assert.equal(data.stars,5);assert.equal(data.openIssues,1);}finally{globalThis.fetch=original;}
});
test('count failure is caught at the public profile route, not returned as a successful false card', async()=>{
  const {GET}=loadRoute('app/api/profile/route.ts',{'@/lib/profile-card':{
    parseRepository:()=>({owner:'owner',repo:'repo'}),resolveProfileCardOptions:()=>({}),fetchRepositoryCardData:async()=>{throw new Error('GitHub repository count request failed: 403');},
  }});
  const response=await GET({nextUrl:new URL('https://local/api/profile?repo=owner/repo')});
  assert.equal(response.status,500);assert.match(await response.text(),/403/);
});
test('contributors 204 from an empty repository counts as zero instead of failing JSON parsing', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    if (url.includes('/search/issues')) return Response.json({ total_count: 0, incomplete_results: false });
    if (url.includes('/contributors')) return new Response(null, { status: 204 });
    if (url.includes('/commits')) return Response.json([]);
    if (url.includes('/languages')) return Response.json({});
    return Response.json({ owner: { login: 'owner' }, name: 'repo', contributors_url: 'https://api.github.com/repos/owner/repo/contributors', commits_url: 'https://api.github.com/repos/owner/repo/commits{/sha}', stargazers_count: 0, forks_count: 0 });
  };
  try { assert.equal((await fetchRepositoryCardData('owner', 'repo')).contributors, 0); }
  finally { globalThis.fetch = original; }
});
