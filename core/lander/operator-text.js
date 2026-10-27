import { activeOperator } from './storage.js';
import { mountOperatorSwitcher } from './operator-switcher.js';

// Used where we have not confirmed a value with the operator, so a test step says so rather than
// printing a guess.
const UNKNOWN = {
  landingUrl: 'the operator landing page (watch the Network tab to see where the redirect lands)',
  cookieOrigin: 'the operator domain',
  attributionCookie: 'the operator attribution cookie (not confirmed for this operator yet)',
  cookieList: 'whatever cookies the landing page sets',
  beacon: 'the operator analytics beacon',
};

function landingUrl(operator) {
  if (!operator.landingHost) return UNKNOWN.landingUrl;
  const params = operator.landingParams.map((name) => `${name}=…`).join('&');
  return `${operator.landingHost}${operator.landingPath}?${params}`;
}

function cookieList(operator) {
  if (!operator.attributionCookie) return UNKNOWN.cookieList;
  return [operator.attributionCookie, ...operator.otherCookies].join(', ');
}

const FIELDS = {
  label: (operator) => operator.label,
  network: (operator) => operator.network,
  operatorAndNetwork: (operator) => `${operator.label} — ${operator.network}`,
  clickHost: (operator) => operator.clickHost,
  landingUrl: landingUrl,
  cookieOrigin: (operator) => operator.cookieOrigin || UNKNOWN.cookieOrigin,
  attributionCookie: (operator) => operator.attributionCookie || UNKNOWN.attributionCookie,
  cookieList: cookieList,
  beacon: (operator) => operator.beacon || UNKNOWN.beacon,
  reporting: (operator) => operator.reporting,
  bannerCopy: (operator) => `${operator.label} — claim your welcome bonus`,
  visitCta: (operator) => `Visit ${operator.label} (explicit click-through)`,
};

export function fillOperatorText(operator) {
  for (const element of document.querySelectorAll('[data-op]')) {
    const describe = FIELDS[element.dataset.op];
    if (describe) {
      element.textContent = describe(operator);
    } else {
      element.textContent = `[no copy for data-op="${element.dataset.op}"]`;
    }
  }
}

// Every POC page calls this: the switcher, the operator links, and all operator copy.
export function mountOperatorContext() {
  const operator = activeOperator();
  mountOperatorSwitcher();
  fillOperatorText(operator);
  for (const link of document.querySelectorAll('a[data-op-link]')) {
    link.href = operator.url;
  }
  return operator;
}
