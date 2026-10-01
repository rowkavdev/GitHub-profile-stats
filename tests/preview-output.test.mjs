import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
import { readFileSync } from 'node:fs';
test('embed snippets derive directly from current inputs and clear immediately on empty input', () => {
  const { deriveEmbedOutput }=loadRoute('components/CardPreview/utils/output.ts');
  assert.deepEqual(deriveEmbedOutput('https://local/api/card?username=octocat','Stats Card'),{
    embedUrl:'https://local/api/card?username=octocat',embedLabel:'Stats Card',markdownCode:'![Stats Card](https://local/api/card?username=octocat)',htmlCode:'<img src="https://local/api/card?username=octocat" alt="Stats Card" />',
  });
  assert.deepEqual(deriveEmbedOutput('','Languages'),{embedUrl:'',embedLabel:'Languages',markdownCode:'',htmlCode:''});
  const source=readFileSync('src/components/CardPreview/CardPreview.tsx','utf8');
  assert.doesNotMatch(source,/setOutput/);
  assert.match(source,/deriveEmbedOutput\(url, EMBED_LABELS\[embedType\]\)/);
  assert.match(source,/url \? image\.imgUrl : ""/);
});
