import { RESUME_PARAM } from '/core/constants/index.js';
import { createReporter, mountConsentGate, readDeferredClick, recordDeferredClick, activeOperatorUrl } from '/core/lander/index.js';

const report = createReporter(document.getElementById('status'));
const resumed = new URLSearchParams(location.search).has(RESUME_PARAM);

// This tab navigates to the operator, so nothing can close it afterwards: a script may only close a
// window it opened itself. That is why the operator tab lingers in the background.
function popUnder() {
  if (readDeferredClick()) {
    report('skipped', 'already recorded — press Reset to run again');
    return;
  }

  const resumeUrl = new URL(location.href);
  resumeUrl.searchParams.set(RESUME_PARAM, '1');

  const landerClone = window.open(resumeUrl.href, '_blank');
  if (!landerClone) {
    report('blocked', 'window.open was refused — nothing navigated; the explicit click-through still works');
    return;
  }

  recordDeferredClick('pop-under');
  location.replace(activeOperatorUrl());
}

if (resumed) report('resumed', 'You are on the lander clone; the tab you left is loading the operator top-level behind you.');
mountConsentGate({ onConsent: popUnder, report });
