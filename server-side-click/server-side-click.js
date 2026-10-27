import { API_DEFERRED_CLICK } from '/core/constants/index.js';
import { createReporter, mountConsentGate, readDeferredClick, recordDeferredClick, openCornerWindow, closeWindowAfterDelay, activeOperator, getOperatorKey } from '/core/lander/index.js';

const report = createReporter(document.getElementById('status'));
const pill = document.getElementById('pill');
const result = document.getElementById('result');

function setPill(variant, text) {
  pill.hidden = false;
  pill.className = `pill ${variant}`;
  pill.textContent = text;
}

function orDash(value) {
  if (value === null || value === undefined) return '—';
  return value;
}

function paramRows(params) {
  const names = Object.keys(params);
  if (names.length === 0) return '<span>Link parameters</span><code>none confirmed for this operator yet</code>';
  return names.map((name) => `<span>${name}</span><code class="big">${orDash(params[name])}</code>`).join('');
}

function describeParams(params) {
  const names = Object.keys(params);
  if (names.length === 0) return 'no confirmed link parameters';
  return names.map((name) => `${name} ${orDash(params[name])}`).join(' · ');
}

function render(data) {
  let capturedUrl = '—';
  let manualLink = '';
  if (data.landingUrl) {
    capturedUrl = `<a href="${data.landingUrl}" target="_blank" rel="noopener">${data.landingUrl}</a>`;
    manualLink = `<p><a class="cta" href="${data.landingUrl}" target="_blank" rel="noopener">Open captured operator URL manually (fallback if the popup was blocked)</a></p>`;
  }

  let cookies = 'none';
  if (data.serverReceivedCookies && data.serverReceivedCookies.length) cookies = data.serverReceivedCookies.join(', ');

  result.hidden = false;
  result.innerHTML = `
    <div class="kv">
      <span>Server status</span><code>${data.status}</code>
      ${paramRows(data.params)}
      <span>Captured URL</span><span>${capturedUrl}</span>
      <span>Cookies the <em>server</em> got</span><code>${cookies}</code>
    </div>
    <p class="muted">Server-received cookies land on our server, not your browser. The <strong>second half</strong> below is what sets the cookies in the <em>user's</em> browser: it loads the captured URL in an auto-closing corner window.</p>
    ${manualLink}`;
}

async function fireServerSide() {
  if (readDeferredClick()) {
    report('skipped', 'already recorded — press Reset to fire again');
    return;
  }

  // The window only opens if we ask for it inside the click, so reserve a blank one and navigate it
  // once the server replies.
  const popupWindow = openCornerWindow('about:blank', report);
  setPill('go', '⚡ First half — server is minting the referral…');
  report('fired', `POST ${API_DEFERRED_CLICK} → server GETs the operator link with its own IP + UA`);

  try {
    const response = await fetch(API_DEFERRED_CLICK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: getOperatorKey() }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || response.status);

    report('response', `status ${data.status} · ${describeParams(data.params)}`);
    recordDeferredClick('server', { landingUrl: data.landingUrl });
    render(data);

    if (!popupWindow) {
      setPill('bad', '✗ popup blocked — use the manual button');
      return;
    }
    if (!data.landingUrl) {
      popupWindow.close();
      setPill('bad', '✓ referral captured, nothing to open');
      return;
    }

    popupWindow.location = data.landingUrl;
    report('second-half', 'Loaded the captured operator URL in the user\'s browser — first-party cookies land here, not on our server.');
    closeWindowAfterDelay(popupWindow, report);
    setPill('ok', '✓ Minted server-side + loaded in-browser (cookies set in the user browser)');
  } catch (error) {
    if (popupWindow) popupWindow.close();
    setPill('bad', '✗ Server call failed');
    report('error', error.message);
  }
}

function priorParams(landingUrl) {
  const url = new URL(landingUrl);
  const params = {};
  for (const name of activeOperator().landingParams) {
    params[name] = url.searchParams.get(name);
  }
  return params;
}

const prior = readDeferredClick();
if (prior && prior.landingUrl) {
  render({ status: '(prior run)', landingUrl: prior.landingUrl, params: priorParams(prior.landingUrl) });
}

mountConsentGate({ onBanner: fireServerSide, report });
