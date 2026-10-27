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
// The abandoned relay was only ever wired for Thunder Partners, which is the one operator whose
// .env values include the bta and placement id it sends.
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

export const POPUP_SIZE_PX = 200;
// A page cannot see a cross-origin window finish loading, so this covers the redirect, the landing
// page and the operator's cookie write. The box on the pop-over page overrides it per run; 0 leaves
// the window open.
export const POPUP_CLOSE_AFTER_OPEN_MS = 1500;
export const POPUP_CLOSE_CHECK_MS = 150;
