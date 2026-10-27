import { POPUP_SIZE_PX, POPUP_CLOSE_AFTER_OPEN_MS } from '/core/constants/index.js';
import { createReporter, mountConsentGate, recordDeferredClick, openCornerWindow, closeWindowAfterDelay, activeOperator } from '/core/lander/index.js';

const report = createReporter(document.getElementById('status'));

const delayInput = document.getElementById('closeDelay');
delayInput.value = POPUP_CLOSE_AFTER_OPEN_MS;

for (const element of document.querySelectorAll('[data-popup-size]')) {
  element.textContent = `${POPUP_SIZE_PX}px`;
}

// The window has to open inside the consent click or the browser blocks it as a popup.
function popOver() {
  const operator = activeOperator();
  const popupWindow = openCornerWindow(operator.url, report);
  if (!popupWindow) return;

  const delayMs = Number(delayInput.value);
  recordDeferredClick('pop-over');
  closeWindowAfterDelay(popupWindow, report, delayMs);
}

mountConsentGate({ onConsent: popOver, report });
