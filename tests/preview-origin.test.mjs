import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadRoute } from './helpers/route-loader.mjs';
test('preview origin has a stable server snapshot and the actual browser origin after hydration', () => {
  let server, client, unsubscribe;
  const { usePreviewOrigin } = loadRoute('components/CardPreview/utils/origin.ts', { react: {
    useSyncExternalStore: (subscribe, getSnapshot, getServerSnapshot) => {
      server=getServerSnapshot(); client=getSnapshot(); unsubscribe=subscribe(()=>{}); return client;
    },
  } });
  const original=global.window;
  global.window={location:{origin:'https://preview.example.test'}};
  try {
    assert.equal(usePreviewOrigin(),'https://preview.example.test');
    assert.equal(server,'https://ghstats.dev');
    assert.equal(typeof unsubscribe,'function');
  } finally { global.window=original; }
  const source=readFileSync('src/components/CardPreview/CardPreview.tsx','utf8');
  assert.doesNotMatch(source,/setOrigin\(/);
  assert.match(source,/usePreviewOrigin\(\)/);
});
