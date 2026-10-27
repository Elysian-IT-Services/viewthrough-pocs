// Every outbound link carries this instead of a random id, so POC traffic is obvious in the
// affiliate's reporting and can never be mistaken for a real click.
export const TEST_CLICK_ID = 'vtpoc-test-001';

export function withClickId(profile, rawUrl) {
  if (!profile.clickIdParam) return rawUrl;
  const url = new URL(rawUrl);
  url.searchParams.set(profile.clickIdParam, TEST_CLICK_ID);
  return url.toString();
}

// One entry per operator, holding everything that is not a secret. The click URL itself comes
// from .env, so adding an operator is: one entry here, plus <KEY>_URL in .env.
// Anything we have not confirmed with the operator stays null — the pages then say so instead
// of printing a guess into a test step.
export const OPERATOR_PROFILES = [
  {
    key: 'slotslv',
    label: 'Slots.lv',
    network: 'Revenue Network',
    clickHost: 'record.revenuenetwork.com',
    clickIdParam: null,
    landingHost: 'www.slots.lv',
    landingPath: '/join',
    landingParams: ['referral', 'affid'],
    cookieOrigin: 'https://www.slots.lv',
    cookieDomain: 'slots.lv',
    attributionCookie: '_pk_id',
    otherCookies: ['affid', '_pk_ref'],
    beacon: 'POST idg.slots.lv/matomo.php (e_n=join_start)',
    reporting: 'Revenue Network reporting',
    env: { url: 'SLOTSLV_URL' },
  },
  {
    key: 'thunder',
    label: 'Thunderpick',
    network: 'Thunder Partners',
    clickHost: 'go.thunder.partners',
    clickIdParam: 'afp',
    landingHost: null,
    landingPath: null,
    landingParams: [],
    cookieOrigin: null,
    cookieDomain: null,
    attributionCookie: null,
    otherCookies: [],
    beacon: null,
    reporting: 'Thunder Partners reporting',
    env: {
      url: 'THUNDER_URL',
      creativeUrl: 'THUNDER_CREATIVE_URL',
      bta: 'THUNDER_BTA',
      placementId: 'THUNDER_PLACEMENT_ID',
    },
  },
];
