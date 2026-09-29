import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCardUrl } from '../src/lib/card-query.ts';

test('irrelevant query values converge on the same card URL', () => {
  const base = 'https://ghstats.dev/api/card?username=octocat&theme=dark';
  const first = canonicalCardUrl(new URL(base + '&utm_source=anything'));
  const second = canonicalCardUrl(new URL(base + '&unused=another'));
  assert.equal(first?.href, base);
  assert.equal(second?.href, base);
  assert.equal(canonicalCardUrl(new URL(base)), null);
});

test('all parameters read by the card handler survive normalization', () => {
  const url = new URL('https://ghstats.dev/api/card?username=octocat&orgs=org&alltime=true&bg=abc&text=def&title_color=123&icon_color=456&border_color=789&hide_border=true&hide_title=true&hide=followers&show_icons=false&show_ring=false&border_radius=0&custom_title=Title&size=compact&compact_count=4&show_emoji=true&order=stars,prs&theme=dark&noise=1');
  const expected = new URL(url);
  expected.searchParams.delete('noise');
  assert.equal(canonicalCardUrl(url)?.href, expected.href);
  assert.equal(url.searchParams.get('noise'), '1');
});
