// Splash build wiring: the homepage inlines the splash runtime and docks the
// real nav lockup, while other pages ship neither the script nor the key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';

/**
 * Returns inline (src-less) script bodies from rendered markup.
 * @param {string} html rendered HTML
 * @returns {string[]} inline script contents in document order
 */
function inlineScripts(html) {
  const pattern = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

/**
 * Reads the rendered homepage, failing when the build did not succeed.
 * @returns {string} index.html contents
 */
function homeHtml() {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  return readBuilt('index.html');
}

test('the built homepage inlines the splash script that defines window.jtSplashDock', () => {
  const html = homeHtml();
  const defining = inlineScripts(html).some((body) => /jtSplashDock\s*=/.test(body));
  assert.equal(defining, true, 'homepage must inline a script defining jtSplashDock');
});

test('the built homepage calls the dock hook inline after the nav lockup', () => {
  const html = homeHtml();
  const dockCall = html.match(/window\.jtSplashDock&&window\.jtSplashDock\(\)/);
  assert.ok(dockCall, 'homepage must contain the inline dock call');
  const logoIndex = html.search(/data-splash-logo/);
  assert.ok(logoIndex >= 0, 'homepage nav lockup must carry data-splash-logo');
  assert.ok(
    (dockCall.index ?? 0) > logoIndex,
    'the dock call must appear after the nav lockup',
  );
});

test('the built homepage contains exactly one data-splash-logo element', () => {
  const html = homeHtml();
  // Strip inline script bodies so the runtime selector string
  // `[data-splash-logo]` does not count as an element attribute.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const count = [...markup.matchAll(/(?:^|[\s"'=<])data-splash-logo(?=[\s"'=/>])/g)].length;
  assert.equal(count, 1, `expected one data-splash-logo, found ${count}`);
});

test('the built faq page contains neither the splash script nor the session key', () => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  const html = readBuilt('faq/index.html');
  assert.equal(html.includes('jtSplashDock'), false, 'faq must not define the dock hook');
  assert.equal(html.includes('jt-splash-seen'), false, 'faq must not ship the splash key');
});
