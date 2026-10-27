// The operator list is generated from .env + core/constants/operators.js by npm run setup, because
// a packaged extension cannot import from core/ at runtime.
export { OPERATORS } from './operators.js';

export const DEMO_ORIGIN = 'http://localhost:4100';

export const LANDER_SOURCE = 'vta-lander';
export const EXTENSION_SOURCE = 'vta-extension';
export const MSG_FIRE = 'VTA_FIRE';
export const MSG_RESULT = 'VTA_RESULT';
export const MSG_READY = 'VTA_READY';
export const PRESENCE_ATTR = 'vtaExtension';
export const PRESENCE_VALUE = 'ready';

export const STORAGE_KEYS = { lastFire: 'vta:last-fire', keepTab: 'vta:keep-tab' };
export const TAB_STATUS_COMPLETE = 'complete';

export const NAV_TIMEOUT_MS = 20000;
// How often we look for the operator's attribution cookie while timing it.
export const COOKIE_POLL_MS = 25;
// A grace period *after* the tab reports complete, not a budget for the whole load. The page POCs
// cannot see a cross-origin load at all, which is why their close delay is measured in seconds.
export const TAB_CLOSE_MS = 40;

// 'explicit' is left out on purpose: a cookie the user cleared themselves is never replayed.
export const RESTORE_ON_CAUSES = ['expired', 'evicted'];
// Extra life given to a replayed cookie, because its original expiry is already in the past.
export const RESTORE_TTL_DAYS = 30;
export const RESTORE_TTL_S = RESTORE_TTL_DAYS * 24 * 60 * 60;
