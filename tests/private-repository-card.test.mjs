import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const { fetchRepositoryCardData } = loadRoute('lib/profile-card.ts');
test('public repository cards reject token-visible private repositories before follow-up reads', async () => {
 const original = globalThis.fetch;
 const requests = [];
 globalThis.fetch = async url => {
  requests.push(url);
  if(url.includes('/search/issues'))return Response.json({total_count:1,incomplete_results:false});
  if(url.includes('/contributors')||url.includes('/commits'))return Response.json([]);
  if(url.includes('/languages'))return Response.json({});
  return Response.json({private:true,owner:{login:'fixture'},name:'private-fixture',description:'fixture private description',contributors_url:'https://api.github.com/repos/fixture/private-fixture/contributors',commits_url:'https://api.github.com/repos/fixture/private-fixture/commits{/sha}',stargazers_count:2,forks_count:0});
 };
 try {
  await assert.rejects(fetchRepositoryCardData('fixture','private-fixture'),/not found/);
  assert.equal(requests.length,1,'no private aggregates or language reads after metadata identifies it as private');
 } finally {globalThis.fetch=original;}
});
