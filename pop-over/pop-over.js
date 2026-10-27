import { POPUP_SIZE_PX, POPUP_CLOSE_AFTER_OPEN_MS } from '/core/constants/index.js';
import { createReporter, mountConsentGate, recordDeferredClick, openCornerWindow, closeWindowAfterDelay, activeOperatorUrl } from '/core/lander/index.js';

const report = createReporter(document.getElementById('status'));

const delayInput = document.getElementById('closeDelay');
delayInput.value = POPUP_CLOSE_AFTER_OPEN_MS;

for (const element of document.querySelectorAll('[data-popup-size]')) {
  element.textContent = `${POPUP_SIZE_PX}px`;
}

// The window has to open inside the consent click or the browser blocks it as a popup.
function popOver() {
  const popupWindow = openCornerWindow(activeOperatorUrl(), report);
  if (!popupWindow) return;

  recordDeferredClick('pop-over');
  closeWindowAfterDelay(popupWindow, report, Number(delayInput.value));
}

mountConsentGate({ onConsent: popOver, report });
