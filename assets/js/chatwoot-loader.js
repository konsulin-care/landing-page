// Chatwoot loader: defers the SDK until the browser is idle.
// Pure enough to be imported by the Node test suite (no DOM access on import
// when `window` is absent).

/**
 * Decide whether a Chatwoot base URL has been configured.
 * Missing values and unsubstituted `{...}` placeholders count as unconfigured.
 * @param {unknown} url Candidate base URL.
 * @returns {boolean} True when the URL looks like a real configured value.
 */
export function isConfiguredUrl(url) {
  return typeof url === 'string' && url !== '' && url.charAt(0) !== '{';
}

/**
 * Inject the Chatwoot SDK script and wire its onload to the SDK runner.
 * Does nothing when the base URL is not configured.
 * @param {{baseUrl: unknown, websiteToken: unknown}} config Chatwoot settings.
 * @param {Document} doc Document used to create and insert the script.
 * @param {Window} win Window that receives the SDK settings and runner.
 * @returns {boolean} True when a script was inserted, false when skipped.
 */
export function loadChatwoot(config, doc = document, win = window) {
  if (!isConfiguredUrl(config.baseUrl)) return false;
  win.chatwootSettings = {
    position: 'right',
    type: 'expanded_bubble',
    launcherTitle: 'Tanya Lyna',
  };
  const g = doc.createElement('script');
  const s = doc.getElementsByTagName('script')[0];
  g.src = config.baseUrl + '/packs/js/sdk.js';
  g.defer = true;
  g.async = true;
  g.onload = () =>
    win.chatwootSDK.run({
      websiteToken: config.websiteToken,
      baseUrl: config.baseUrl,
    });
  s.parentNode.insertBefore(g, s);
  return true;
}

if (typeof window !== 'undefined' && window.jtChatwootConfig) {
  const run = () => loadChatwoot(window.jtChatwootConfig);
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 5000 });
  else window.addEventListener('load', () => setTimeout(run, 1000));
}
