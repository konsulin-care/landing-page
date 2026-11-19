import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isConfiguredUrl, loadChatwoot } from '../assets/js/chatwoot-loader.js';

/**
 * Build a fake document/window pair that records script insertion.
 * @returns {{doc: object, win: object, inserted: Array<object>}} Fakes and the insertion log.
 */
function fakeEnv() {
  const inserted = [];
  const doc = {
    createElement: () => ({}),
    getElementsByTagName: () => [
      { parentNode: { insertBefore: (node) => inserted.push(node) } },
    ],
  };
  const win = {};
  return { doc, win, inserted };
}

test('defaults to not inserting when baseUrl is empty', () => {
  const { doc, win, inserted } = fakeEnv();
  assert.equal(isConfiguredUrl(''), false);
  assert.equal(loadChatwoot({ baseUrl: '', websiteToken: 't' }, doc, win), false);
  assert.equal(inserted.length, 0);
});

test('does not insert when baseUrl is still a placeholder', () => {
  const { doc, win, inserted } = fakeEnv();
  assert.equal(isConfiguredUrl('{CHATWOOT_URL}'), false);
  assert.equal(loadChatwoot({ baseUrl: '{CHATWOOT_URL}', websiteToken: 't' }, doc, win), false);
  assert.equal(inserted.length, 0);
});

test('inserts one deferred async script pointing at the SDK', () => {
  const { doc, win, inserted } = fakeEnv();
  const baseUrl = 'https://chat.example.com';
  assert.equal(loadChatwoot({ baseUrl, websiteToken: 't' }, doc, win), true);
  assert.equal(inserted.length, 1);
  const script = inserted[0];
  assert.equal(script.src, baseUrl + '/packs/js/sdk.js');
  assert.equal(script.defer, true);
  assert.equal(script.async, true);
});

test('onload runs chatwootSDK with the configured token and baseUrl', () => {
  const { doc, win, inserted } = fakeEnv();
  const calls = [];
  win.chatwootSDK = { run: (opts) => calls.push(opts) };
  const baseUrl = 'https://chat.example.com';
  loadChatwoot({ baseUrl, websiteToken: 'tok-123' }, doc, win);
  inserted[0].onload();
  assert.deepEqual(calls, [{ websiteToken: 'tok-123', baseUrl }]);
  assert.equal(win.chatwootSettings.launcherTitle, 'Tanya Lyna');
});
