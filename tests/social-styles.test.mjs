import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
const cards = loadRoute('lib/profile-card.ts');
const repo = { owner:'rowkavdev', name:'GitHub-profile-stats', description:'Beautiful GitHub stats cards for your README', avatarDataUri:'', contributors:8, commits:233, openIssues:5, stars:45, forks:8, languages:[{name:'TypeScript',size:75,percentage:75,color:'#3178c6'},{name:'CSS',size:25,percentage:25,color:'#663399'}] };
const profile = { username:'rowkav09', name:'Rowan Kavanagh', bio:'Building tools for developers', avatarDataUri:'', followers:20, publicRepos:12, totalStars:45, contributionsThisYear:233, totalPRs:30, languages:repo.languages };
test('five styles are independent of themes, default is GitHub', () => {
  assert.deepEqual(cards.PROFILE_CARD_STYLES, ['github','compact','split','editorial','minimal']);
  assert.equal(cards.resolveProfileCardOptions(new URLSearchParams()).style, 'github');
  assert.equal(cards.resolveProfileCardOptions(new URLSearchParams('style=split&theme=dark')).style, 'split');
  assert.equal(cards.resolveProfileCardOptions(new URLSearchParams('style=constructor')).style, 'github');
});
test('all styles render distinct repository and profile layouts with a real bottom language bar', () => {
  for (const render of [cards.renderRepositoryCard, cards.renderProfileCard]) {
    const values = ['github','compact','split','editorial','minimal'].map(style => {
      const svg = render(render===cards.renderRepositoryCard ? repo : profile, cards.resolveProfileCardOptions(new URLSearchParams(`style=${style}&type=profile`)));
      assert.match(svg, /data-language-bar/); assert.match(svg, /TypeScript/); assert.match(svg, /#3178c6/); assert.doesNotMatch(svg, /NaN|undefined/);
      return svg;
    });
    assert.equal(new Set(values).size,5);
  }
});
test('language hiding and XML escaping survive new layouts', () => {
  const svg = cards.renderRepositoryCard({...repo,name:'<script>&',description:'"<>&'},cards.resolveProfileCardOptions(new URLSearchParams('show_languages=false')));
  assert.doesNotMatch(svg,/data-language-bar|<script>/); assert.match(svg,/&lt;script&gt;&amp;/);
});
test('repository language bytes produce real percentages', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=async url => {
    if(url.includes('/search/issues')) return Response.json({total_count:2,incomplete_results:false});
    if(url.includes('/languages')) return Response.json({TypeScript:300,CSS:100});
    if(url.includes('/contributors')||url.includes('/commits')) return Response.json([]);
    return Response.json({owner:{login:'owner'},name:'repo',languages_url:'https://api.github.com/repos/owner/repo/languages',contributors_url:'https://api.github.com/repos/owner/repo/contributors',commits_url:'https://api.github.com/repos/owner/repo/commits{/sha}',stargazers_count:1,forks_count:0});
  };
  try { const data=await cards.fetchRepositoryCardData('owner','repo'); assert.equal(data.languages[0].percentage,75); assert.equal(data.languages[1].name,'CSS'); }
  finally {globalThis.fetch=original;}
});
test('all card types and styles have safe dimensions, language toggles and long text', () => {
  for (const type of ['repo','profile','compact','contributions']) for (const style of cards.PROFILE_CARD_STYLES) {
    const options=cards.resolveProfileCardOptions(new URLSearchParams(`type=${type}&style=${style}`));
    assert.ok(options.height>=400);
    if(type==='contributions') assert.equal(options.height,627);
    const data={...profile,name:'W'.repeat(160),bio:'<&>'.repeat(100),contributionDays:[],currentStreak:0,longestStreak:0,totalCommits:0};
    const svg=cards.renderProfileCard(data,options); assert.doesNotMatch(svg,/NaN|undefined/); assert.match(svg,/role="img"/);
  }
});
test('repository language failures cannot invent a coloured language share', async () => {
  const original=globalThis.fetch;
  globalThis.fetch=async url => {
    if(url.includes('/search/issues')) return Response.json({total_count:0,incomplete_results:false});
    if(url.includes('/languages')) return new Response('',{status:403});
    if(url.includes('/contributors')||url.includes('/commits')) return Response.json([]);
    return Response.json({owner:{login:'owner'},name:'repo',contributors_url:'https://api.github.com/repos/owner/repo/contributors',commits_url:'https://api.github.com/repos/owner/repo/commits{/sha}',stargazers_count:0,forks_count:0});
  };
  try { const data=await cards.fetchRepositoryCardData('owner','repo'); assert.deepEqual(data.languages,[]); assert.match(cards.renderRepositoryCard(data,cards.resolveProfileCardOptions(new URLSearchParams())),/No language data/); }
  finally {globalThis.fetch=original;}
});
