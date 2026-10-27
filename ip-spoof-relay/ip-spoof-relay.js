import { OPERATORS, RELAY_OPERATOR_KEY, API_SET_ATTRIBUTION, TEST_CLICK_ID } from '../core/constants/index.js';
import { fillOperatorText } from '../core/lander/index.js';

// This POC is pinned to one operator: it is abandoned, and only that operator's .env values carry
// the bta and placement id it sends.
const operator = OPERATORS.find((item) => item.key === RELAY_OPERATOR_KEY);
const CAMPAIGN = 'hotspawn_new';

const status = document.getElementById('status');

fillOperatorText(operator);

function show(label, detail) {
  status.textContent = `${label}\n\n${detail}`;
}

async function runRelay() {
  const afp = TEST_CLICK_ID;
  show('Relay running.', `AFP: ${afp}`);

  const body = {
    userAgent: navigator.userAgent,
    cxd: `${operator.bta}_${operator.placementId}_${afp}`,
    campaign: CAMPAIGN,
    afp,
  };

  try {
    const response = await fetch(API_SET_ATTRIBUTION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    show(`Server replied ${response.status}.`, JSON.stringify(result, null, 2));
  } catch (error) {
    show('The relay request failed.', error.message);
  }
}

document.getElementById('run').addEventListener('click', runRelay);
