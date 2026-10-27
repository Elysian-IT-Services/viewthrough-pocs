import { createReporter, mountConsentGate, recordDeferredClick, activeOperatorUrl } from '/core/lander/index.js';

const report = createReporter(document.getElementById('status'));
const stage = document.getElementById('stage');

function fireHiddenIframe() {
  if (!recordDeferredClick('iframe')) {
    report('skipped', 'already recorded — press Reset to fire again');
    return;
  }

  const url = activeOperatorUrl();
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.className = 'stage';
  frame.title = 'Affiliate click — hidden in production, shown here so you can see the operator load';
  frame.addEventListener('load', () => report('loaded', 'iframe navigated (load fires even if content was blocked). Now watch Network for the operator beacon and check its cookies in DevTools.'));
  stage.append(frame);

  report('fired', `GET ${url} in an iframe (visible here; hidden in production). You stayed on the lander.`);
}

mountConsentGate({ onBanner: fireHiddenIframe, report });
