import { createReporter, mountConsentGate, getOperatorKey } from '/core/lander/index.js';

// These come from the extension's own config.js, which a normal page cannot import, so the lander
// has to repeat them. Change them in both places or the handshake goes quiet.
const LANDER_SOURCE = 'vta-lander';
const EXTENSION_SOURCE = 'vta-extension';
const MSG_FIRE = 'VTA_FIRE';
const MSG_RESULT = 'VTA_RESULT';
const MSG_READY = 'VTA_READY';
const PRESENCE_ATTR = 'vtaExtension';
const PRESENCE_VALUE = 'ready';

function byId(id) {
  return document.getElementById(id);
}

const report = createReporter(byId('status'));

function setPill(id, variant, text) {
  const pill = byId(id);
  pill.hidden = false;
  pill.className = `pill ${variant}`;
  pill.textContent = text;
}

function paramRows(params) {
  const names = Object.keys(params ?? {});
  if (names.length === 0) return '<span>Link params</span><code>none confirmed for this operator</code>';
  return names.map((name) => `<span>${name}</span><code>${params[name] ?? '—'}</code>`).join('');
}

function describeCookieDelay(elapsedMs) {
  if (elapsedMs === null || elapsedMs === undefined) return 'not seen before the tab closed';
  return `${elapsedMs} ms after the tab opened — the floor for POPUP_CLOSE_AFTER_OPEN_MS`;
}

function showResult(result) {
  if (result.cookie) setPill('pill', 'ok', '✓ Fired top-level and recorded the attribution cookie');
  else setPill('pill', 'bad', '✗ Fired, but no attribution cookie was found');

  const debugNote = result.keepTab ? ' · debug: background tab left open' : '';
  report('result', `cookie ${result.cookie?.name ?? 'none'} · ${describeCookieDelay(result.cookieAfterMs)}${debugNote}`);

  const box = byId('result');
  box.hidden = false;
  box.innerHTML = `<div class="kv">
    <span>Operator</span><code>${result.label}</code>
    <span>Fired at</span><code>${result.firedAt}</code>
    ${paramRows(result.params)}
    <span>Landing URL</span><code>${result.landingUrl ?? '—'}</code>
    <span>Cookie</span><code>${result.cookie ? `${result.cookie.name}=${result.cookie.value}` : 'none observed'}</code>
    <span>Cookie after</span><code>${describeCookieDelay(result.cookieAfterMs)}</code>
  </div>`;
}

function fireViaExtension() {
  if (document.documentElement.dataset[PRESENCE_ATTR] !== PRESENCE_VALUE) {
    report('blocked', 'extension not detected — nothing fired');
    return;
  }

  setPill('pill', 'go', '⚡ Extension is opening the operator top-level in a background tab…');
  report('fired', 'postMessage → content script → service worker → chrome.tabs.create (background, top-level)');
  window.postMessage({ source: LANDER_SOURCE, type: MSG_FIRE, operator: getOperatorKey() }, location.origin);
}

window.addEventListener('message', (event) => {
  const { source, type, result } = event.data ?? {};
  if (event.source !== window || event.origin !== location.origin || source !== EXTENSION_SOURCE) return;
  if (type === MSG_READY) setPill('presence', 'ok', '✓ Extension detected');
  if (type === MSG_RESULT) showResult(result);
});

mountConsentGate({ onBanner: fireViaExtension, report });
