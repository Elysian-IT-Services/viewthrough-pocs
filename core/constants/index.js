import { AFFILIATE } from './affiliate.js';
import { OPERATOR_PROFILES, TEST_CLICK_ID, withClickId } from './operators.js';

export { OPERATOR_PROFILES, TEST_CLICK_ID };

// Only navigation-flows still tags its own URL; every other POC gets a tagged URL from the operator.
export const CLICK_ID_PARAM = 'afp';

function buildOperator(profile) {
  const values = AFFILIATE[profile.key];
  if (!values) throw new Error(`No .env values for operator "${profile.key}". Run npm run setup.`);
  return { ...profile, ...values, url: withClickId(profile, values.url) };
}

export const OPERATORS = OPERATOR_PROFILES.map(buildOperator);
export const DEFAULT_OPERATOR = 'slotslv';
// Only this operator's .env values carry the bta and placement id the relay sends.
export const RELAY_OPERATOR_KEY = 'thunder';
export const PORT = 4100;

export const POC_FOLDERS = [
  'cookie-proof',
  'hidden-iframe',
  'pop-under',
  'pop-over',
  'server-side-click',
  'banner-impression',
  'navigation-flows',
  'opener-isolation',
  'user-gesture',
  'pre-navigation-beacon',
  'samesite-cookies',
  'ip-spoof-relay',
];

export const API_DEFERRED_CLICK = '/api/deferred-click';
export const API_SET_COOKIE_TEST = '/api/set-cookie-test';
export const API_TRACK_BEACON = '/api/track-beacon';
export const API_SET_ATTRIBUTION = '/api/set-attribution';

export const SAMESITE_POLICIES = ['Strict', 'Lax', 'None'];
export const DEFAULT_SAMESITE_POLICY = 'Lax';

export const STORAGE_KEYS = { consent: 'vta:consent', deferredClick: 'vta:deferred-click', operator: 'vta:operator' };
export const RESUME_PARAM = 'resumed';

export const POPUP_SIZE_PX = 120;
// A page cannot see a cross-origin window finish loading, so this one number covers the redirect,
// the landing page and the operator's cookie write. The box on the POC page overrides it; 0 keeps it open.
export const POPUP_CLOSE_AFTER_OPEN_MS = 3000;
export const POPUP_CLOSE_CHECK_MS = 150;
// One focus() call loses the race with the window opening, so there is a second attempt this late.
export const FOCUS_RETRY_MS = 50;
