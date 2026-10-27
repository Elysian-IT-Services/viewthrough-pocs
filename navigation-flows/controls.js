import { activeOperatorUrl } from '../core/lander/index.js';
import { startNavigationFlow, observeNavigationWindow } from './navigation-flows.js';

const FINISHED_STATES = ['blocked', 'manual', 'unverified', 'still-open', 'error'];
const MAX_DELAY_MS = 60000;

const form = document.getElementById('test');
const status = document.getElementById('status');
const buttons = Array.from(form.querySelectorAll('button'));

form.elements.target.value = activeOperatorUrl();

function setButtonsDisabled(disabled) {
  for (const button of buttons) {
    button.disabled = disabled;
  }
}

function report(state, message) {
  status.textContent += `\n${new Date().toISOString()} [${state}] ${message}`;
  if (FINISHED_STATES.includes(state)) {
    setButtonsDisabled(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (buttons.some((button) => button.disabled)) {
    return;
  }

  setButtonsDisabled(true);
  status.textContent = '';
  const mode = event.submitter.value;
  const delay = Number(form.elements.delay.value) * 1000;

  try {
    startNavigationFlow(mode, form.elements.target.value, delay, report);
  } catch (error) {
    report('error', error.message);
  }
});

const params = new URLSearchParams(location.search);
if (params.get('watch') === '1') {
  const delay = Number(params.get('delay'));
  if (params.get('target')) {
    form.elements.target.value = params.get('target');
  }
  status.textContent = `Option A kept this publisher tab.\nAFP: ${params.get('afp')}\nAffiliate URL: ${form.elements.target.value}`;

  if (Number.isFinite(delay) && delay >= 0 && delay <= MAX_DELAY_MS) {
    form.elements.delay.value = delay / 1000;
    setButtonsDisabled(true);
    observeNavigationWindow(window.opener, delay, report);
  } else {
    report('error', 'Invalid close delay.');
  }
}
