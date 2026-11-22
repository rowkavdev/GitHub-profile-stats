import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';

const github = {
  async fetchGitHubStats() {
    return {
      username: 'sample', name: 'Sample', avatarUrl: '', followers: 0,
      publicRepos: 0, totalStars: 0, contributionsThisYear: 0, languages: [],
    };
  },
  parseExtraOwners: () => [],
};

const request = {
  nextUrl: new URL('/api/profile?' + new URLSearchParams({
    username: 'sample',
    type: 'profile',
    title: 'Heading' + ' '.repeat(72) + '😀',
    subtitle: 'Subtitle' + ' '.repeat(131) + '🚀',
  }), 'https://local.test'),
};

test('social SVG keeps Unicode characters at the title and subtitle boundaries', async () => {
  const { GET } = loadRoute('app/api/profile/route.ts', { '@/lib/github': github });
  const response = await GET(request);
  assert.equal(response.status, 200);
  const svg = await response.text();
  assert.match(svg, /Heading 😀/);
  assert.match(svg, /Subtitle 🚀/);
});

test('social PNG passes intact boundary text to the rasterizer', async () => {
  let source;
  const { GET } = loadRoute('app/api/profile/png/route.tsx', {
    '@/lib/github': github,
    '@/lib/svg-to-png': {
      svgToPng(svg) {
        source = svg;
        return new Uint8Array();
      },
    },
  });
  const response = await GET(request);
  assert.equal(response.status, 200);
  assert.match(source, /Heading 😀/);
  assert.match(source, /Subtitle 🚀/);
});

test('social options still cap ASCII and leave empty text to existing defaults', () => {
  const { resolveProfileCardOptions } = loadRoute('lib/profile-card.ts');
  const options = resolveProfileCardOptions(new URLSearchParams({
    title: 'a'.repeat(81),
    subtitle: 'b'.repeat(141),
  }));
  assert.equal(options.title, 'a'.repeat(80));
  assert.equal(options.subtitle, 'b'.repeat(140));

  const empty = resolveProfileCardOptions(new URLSearchParams({ title: '', subtitle: '' }));
  assert.equal(empty.title, undefined);
  assert.equal(empty.subtitle, undefined);
});
