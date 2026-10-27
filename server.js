import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  API_DEFERRED_CLICK, API_SET_COOKIE_TEST, API_TRACK_BEACON, API_SET_ATTRIBUTION,
  PORT, POC_FOLDERS, OPERATORS, DEFAULT_OPERATOR,
  SAMESITE_POLICIES, DEFAULT_SAMESITE_POLICY,
} from './core/constants/index.js';
import { setAttribution } from './ip-spoof-relay/set-attribution.js';

const root = dirname(fileURLToPath(import.meta.url));
const SERVER_UA = 'approved-vta-poc/1.0 (server-side deferred click)';

function redactCookieValue(cookie) {
  const name = cookie.split('=')[0];
  return `${name}=<redacted>`;
}

// Resolve the operator by key from our own list. Fetching a URL the client sent would be an SSRF hole.
function operatorFor(key) {
  const operator = OPERATORS.find((item) => item.key === key);
  if (operator) return operator;
  return OPERATORS.find((item) => item.key === DEFAULT_OPERATOR);
}

const app = express();
app.use(express.json());

for (const name of POC_FOLDERS) {
  app.use(`/${name}`, express.static(join(root, name)));
}
app.use('/core', express.static(join(root, 'core')));
app.use('/browser-extension', express.static(join(root, 'browser-extension')));
app.get('/', (req, res) => res.sendFile(join(root, 'index.html')));

app.post(API_DEFERRED_CLICK, async (req, res) => {
  try {
    const operator = operatorFor(req.body.operator);
    // A server user agent and no forwarded client IP: the operator must see a server-originated click.
    const upstream = await fetch(operator.url, { redirect: 'manual', headers: { 'User-Agent': SERVER_UA } });
    const landingUrl = upstream.headers.get('location');

    const params = {};
    if (landingUrl) {
      const destination = new URL(landingUrl);
      for (const name of operator.landingParams) {
        params[name] = destination.searchParams.get(name);
      }
    }

    res.json({
      firedAt: new Date().toISOString(),
      status: upstream.status,
      landingUrl,
      params,
      serverReceivedCookies: upstream.headers.getSetCookie().map(redactCookieValue),
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get(API_SET_COOKIE_TEST, (req, res) => {
  let policy = DEFAULT_SAMESITE_POLICY;
  if (SAMESITE_POLICIES.includes(req.query.policy)) {
    policy = req.query.policy;
  }

  let cookie = `tracking_id=poc_user_999; Max-Age=3600; Path=/; SameSite=${policy}`;
  // SameSite=None is only stored when the cookie is Secure too, and localhost counts as secure.
  if (policy === 'None') {
    cookie += '; Secure';
  }

  res.setHeader('Set-Cookie', cookie);
  res.json({ success: true, message: `Cookie attempted with SameSite=${policy}.` });
});

// sendBeacon posts text/plain, so the global JSON parser skips it and this route needs its own.
app.post(API_TRACK_BEACON, express.text({ type: '*/*', limit: '4kb' }), (req, res) => {
  console.log('Beacon received before navigation:', req.body);
  res.sendStatus(204);
});

// The abandoned relay. Kept running so the failure is reproducible, tagged with the test click id.
app.post(API_SET_ATTRIBUTION, setAttribution);

app.listen(PORT, () => console.log(`vt-poc → http://localhost:${PORT}`));
