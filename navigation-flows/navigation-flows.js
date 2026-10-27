import { CLICK_ID_PARAM, TEST_CLICK_ID } from '../core/constants/index.js';

const MAX_DELAY_MS = 60000;
const POPUP_FEATURES = 'popup=yes,width=400,height=300';
const CLOSE_CHECK_MS = 150;

function focusQuietly(windowHandle) {
  try {
    windowHandle.focus();
  } catch {
    // The browser decides whether focus actually moves, and may refuse outright.
  }
}

function isClosed(windowHandle) {
  try {
    return windowHandle.closed;
  } catch {
    return true;
  }
}

function publisherWatchUrl(host, afp, delay, affiliateUrl) {
  const publisher = new URL(host.location.href);
  publisher.search = new URLSearchParams({ watch: '1', afp, delay, target: affiliateUrl });
  publisher.hash = '';
  return publisher.href;
}

export function startNavigationFlow(mode, rawUrl, delay, report, host = window) {
  const target = new URL(rawUrl);
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error('Use an http or https affiliate URL.');
  }
  if (mode !== 'reverse' && mode !== 'popup') {
    throw new Error('Unknown flow.');
  }
  if (!Number.isFinite(delay) || delay < 0 || delay > MAX_DELAY_MS) {
    throw new Error('Close delay must be 0 to 60 seconds.');
  }

  const afp = TEST_CLICK_ID;
  target.searchParams.set(CLICK_ID_PARAM, afp);

  let destination = target.href;
  let features = POPUP_FEATURES;
  if (mode === 'reverse') {
    destination = publisherWatchUrl(host, afp, delay, target.href);
    features = '';
  }

  // Keep this before any asynchronous work so it still runs on the real click's activation.
  const opened = host.open(destination, '_blank', features);
  report('run', `AFP: ${afp}\nAffiliate URL: ${target.href}`);

  if (!opened) {
    report('blocked', 'The browser blocked the new window. The original page is untouched and no fallback request fired.');
    return { afp, opened: false };
  }

  if (mode === 'popup') {
    observeNavigationWindow(opened, delay, report, host);
    return { afp, opened: true };
  }

  focusQuietly(opened);
  // replace, not assign: without a history entry of its own the original tab may still be closable.
  host.location.replace(target.href);
  return { afp, opened: true };
}

export function observeNavigationWindow(windowHandle, delay, report, host = window) {
  if (delay === 0) {
    report('manual', 'Window left open so you can read the Network tab. Close it yourself when you are done.');
    return;
  }

  report('waiting', `Close attempt in ${delay / 1000}s. A timer does not confirm the operator finished its token POST.`);
  host.setTimeout(() => {
    requestClose(windowHandle, report, host);
    focusQuietly(host);
  }, delay);
}

function requestClose(windowHandle, report, host) {
  if (!windowHandle || isClosed(windowHandle)) {
    report('unverified', 'The window had already gone or the browser cut the handle off. Closure and attribution are both unverified.');
    return;
  }

  try {
    windowHandle.close();
  } catch (error) {
    report('unverified', `Could not control the window: ${error.message}`);
    return;
  }

  host.setTimeout(() => reportCloseResult(windowHandle, report), CLOSE_CHECK_MS);
}

function reportCloseResult(windowHandle, report) {
  if (isClosed(windowHandle)) {
    report('unverified', 'Close was requested and the handle says closed. Count the real windows yourself; attribution is still unverified.');
    return;
  }
  report('still-open', 'The browser kept the window open. Close it yourself; attribution is unverified.');
}
