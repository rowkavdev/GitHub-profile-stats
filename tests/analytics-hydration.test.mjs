import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRoute } from './helpers/route-loader.mjs';
import { readFileSync } from 'node:fs';
test('consent hydration is hidden on server and reads only known saved choices', () => {
  const { readSavedChoice, useConsentReady } = loadRoute('components/analytics-consent-state.ts', { react: { useSyncExternalStore:(subscribe,client,server)=>{
    assert.equal(server(),false);assert.equal(client(),true);assert.equal(typeof subscribe(()=>{}),'function');return true;
  } } });
  const previous=global.localStorage;
  try {
    for(const [saved,expected] of [['granted','granted'],['denied','denied'],['wrong',null],[null,null]]) {
      global.localStorage={getItem:()=>saved};assert.equal(readSavedChoice(),expected);
    }
    global.localStorage={getItem:()=>{throw Error('unavailable');}};assert.equal(readSavedChoice(),null);
    assert.equal(useConsentReady(),true);
  } finally {global.localStorage=previous;}
  const source=readFileSync('src/components/GoogleAnalyticsConsent.tsx','utf8');
  assert.doesNotMatch(source,/setReady\(/);
  assert.match(source,/useState<Choice>\(readSavedChoice\)/);
  assert.match(source,/if\(!ready\)return null/);
});
