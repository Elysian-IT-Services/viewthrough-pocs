import { mountOperatorContext } from './operator-text.js';
import { grantConsent, hasConsent, readDeferredClick, resetState } from './storage.js';

export function createReporter(element) {
  return function report(state, message) {
    element.textContent += `\n${new Date().toISOString()} [${state}] ${message}`;
  };
}

export function mountConsentGate({ onConsent, onBanner, report }) {
  const operator = mountOperatorContext();
  const consent = document.getElementById('consent');
  const banner = document.getElementById('banner');

  function reveal() {
    consent.hidden = true;
    banner.hidden = false;
  }

  report('state', `operator: ${operator.label} — ${operator.network}`);
  if (hasConsent()) reveal();

  const prior = readDeferredClick();
  if (prior) report('state', `deferred click already recorded via ${prior.mechanism} at ${prior.at} — press Reset to run again`);

  consent.querySelector('button').addEventListener('click', (event) => {
    grantConsent();
    reveal();
    if (onConsent) onConsent(event);
  });

  banner.addEventListener('click', (event) => {
    if (!onBanner) return;
    event.preventDefault();
    onBanner(event);
  });

  document.getElementById('reset').addEventListener('click', () => {
    resetState();
    location.reload();
  });
}
