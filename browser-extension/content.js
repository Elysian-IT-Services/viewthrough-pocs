// Content scripts cannot use a static import, so config.js is loaded dynamically.
import(chrome.runtime.getURL('config.js')).then((config) => {
  const {
    LANDER_SOURCE, EXTENSION_SOURCE, MSG_FIRE, MSG_RESULT, MSG_READY,
    PRESENCE_ATTR, PRESENCE_VALUE,
  } = config;

  function post(type, payload) {
    window.postMessage({ source: EXTENSION_SOURCE, type, ...payload }, location.origin);
  }

  window.addEventListener('message', (event) => {
    const { source, type, operator } = event.data ?? {};
    if (event.source !== window || event.origin !== location.origin) return;
    if (source !== LANDER_SOURCE || type !== MSG_FIRE) return;
    chrome.runtime.sendMessage({ type, operator }).then((result) => post(MSG_RESULT, { result }));
  });

  document.documentElement.dataset[PRESENCE_ATTR] = PRESENCE_VALUE;

  function announce() {
    post(MSG_READY, {});
  }

  // Wait for DOMContentLoaded or the page misses the READY message.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', announce);
  else announce();
});
