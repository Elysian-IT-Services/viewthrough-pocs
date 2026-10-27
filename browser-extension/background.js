import {
  OPERATORS, DEMO_ORIGIN, MSG_FIRE, STORAGE_KEYS, TAB_STATUS_COMPLETE,
  NAV_TIMEOUT_MS, TAB_CLOSE_MS, COOKIE_POLL_MS, RESTORE_ON_CAUSES, RESTORE_TTL_S,
} from './config.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function readStored(key) {
  const data = await chrome.storage.local.get(key);
  return data[key];
}

function cookieUrl(cookie) {
  const host = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
  return `https://${host}${cookie.path}`;
}

function snapshot(cookie) {
  const details = {
    url: cookieUrl(cookie),
    name: cookie.name,
    value: cookie.value,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    storeId: cookie.storeId,
    expirationDate: cookie.expirationDate,
  };
  // chrome.cookies.set rejects a domain field on a hostOnly cookie.
  if (!cookie.hostOnly) details.domain = cookie.domain;
  return details;
}

function waitForLoad(tabId) {
  return new Promise((resolve) => {
    function finish() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }
    function onUpdated(id, info) {
      if (id === tabId && info.status === TAB_STATUS_COMPLETE) finish();
    }
    const timer = setTimeout(finish, NAV_TIMEOUT_MS);
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

async function findCookie(operator) {
  if (!operator.cookie) return null;
  const cookies = await chrome.cookies.getAll({ domain: operator.cookie.domain });
  const found = cookies.find((cookie) => cookie.name.startsWith(operator.cookie.prefix));
  return found ? snapshot(found) : null;
}

// The number the page POCs need: how long after opening the operator before its attribution cookie
// actually exists. A page cannot see this for itself, so the extension measures it here.
function startCookieTimer(operator, cookieBefore) {
  const startedAt = Date.now();
  const timer = { elapsedMs: null, stopped: false };

  async function poll() {
    if (timer.stopped || Date.now() - startedAt > NAV_TIMEOUT_MS) return;

    const cookie = await findCookie(operator);
    const isNew = cookie && (!cookieBefore || cookie.value !== cookieBefore.value);
    if (isNew) {
      timer.elapsedMs = Date.now() - startedAt;
      return;
    }
    setTimeout(poll, COOKIE_POLL_MS);
  }

  poll();
  return timer;
}

async function fire(operatorKey) {
  const operator = OPERATORS.find((item) => item.key === operatorKey) ?? OPERATORS[0];

  const cookieBefore = await findCookie(operator);
  const cookieTimer = startCookieTimer(operator, cookieBefore);
  const tab = await chrome.tabs.create({ url: operator.url, active: false });
  await waitForLoad(tab.id);

  const { url } = await chrome.tabs.get(tab.id);
  await wait(TAB_CLOSE_MS);
  cookieTimer.stopped = true;

  const keepTab = Boolean(await readStored(STORAGE_KEYS.keepTab));
  if (!keepTab) await chrome.tabs.remove(tab.id);

  const params = {};
  if (url) {
    const landed = new URL(url);
    for (const name of operator.landingParams) {
      params[name] = landed.searchParams.get(name);
    }
  }

  const record = {
    operator: operator.key,
    label: operator.label,
    firedAt: new Date().toISOString(),
    landingUrl: url ?? null,
    params,
    cookieAfterMs: cookieTimer.elapsedMs,
    cookie: await findCookie(operator),
    keepTab,
    restores: 0,
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.lastFire]: record });
  console.log('[vta] fired', record);
  return record;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.origin !== DEMO_ORIGIN || message?.type !== MSG_FIRE) return false;
  fire(message.operator).then(sendResponse);
  return true;
});

// A restore only ever replays the value the operator's own script issued; it never invents one.
chrome.cookies.onChanged.addListener(async ({ removed, cause, cookie }) => {
  if (!removed || !RESTORE_ON_CAUSES.includes(cause)) return;

  const record = await readStored(STORAGE_KEYS.lastFire);
  const recorded = record?.cookie;
  if (!recorded || recorded.name !== cookie.name || recorded.url !== cookieUrl(cookie)) return;

  const expirationDate = Math.max(recorded.expirationDate ?? 0, nowInSeconds() + RESTORE_TTL_S);
  await chrome.cookies.set({ ...recorded, expirationDate });

  const updated = {
    ...record,
    restores: record.restores + 1,
    restoredAt: new Date().toISOString(),
    restoredCause: cause,
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.lastFire]: updated });
  console.log(`[vta] restored ${recorded.name} after ${cause}`);
});
