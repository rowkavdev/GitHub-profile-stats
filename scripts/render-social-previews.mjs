import { loadRoute } from '../tests/helpers/route-loader.mjs';
import { writeFileSync } from 'node:fs';
const c=loadRoute('lib/profile-card.ts');
const avatar='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" fill="#24292f"/><text x="72" y="94" text-anchor="middle" font-family="Arial" font-size="60" fill="#f1e05a">R</text></svg>').toString('base64');
const languages=[{name:'TypeScript',percentage:74.5,size:745,color:'#3178c6'},{name:'CSS',percentage:18.5,size:185,color:'#663399'},{name:'JavaScript',percentage:7,size:70,color:'#f1e05a'}];
const repo={owner:'rowkavdev',name:'GitHub-profile-stats',description:'Beautiful GitHub stats cards for your README - just paste one line.',avatarDataUri:avatar,contributors:8,commits:233,openIssues:5,stars:45,forks:8,languages};
const profile={username:'rowkav09',name:'Rowan Kavanagh',bio:'Building tools for developers. Open source, self-hosted apps and things that make GitHub more useful.',avatarDataUri:avatar,followers:20,publicRepos:12,totalStars:45,contributionsThisYear:233,totalPRs:30,languages};
for(const style of c.PROFILE_CARD_STYLES){
 const options=c.resolveProfileCardOptions(new URLSearchParams(`style=${style}&type=profile`));
 const cards=[c.renderRepositoryCard(repo,options),c.renderProfileCard(profile,options)];
 writeFileSync(`/tmp/style-${style}.html`,`<html><body style="margin:0;padding:28px;background:#f6f8fa;font-family:Arial"><h2 style="margin:0 0 18px;font-size:25px">${style==='github'?'GitHub (default)':style[0].toUpperCase()+style.slice(1)} · Repository + profile</h2>${cards.map(svg=>`<div style="margin-bottom:22px">${svg.replace(/width="1200" height="\d+" viewBox/,`width="1000" height="${Math.round(options.height*1000/options.width)}" viewBox`)}</div>`).join('')}<p style="color:#656d76;font-size:18px">Preview uses sample data and a placeholder avatar. Language percentages are labelled.</p></body></html>`);
}
