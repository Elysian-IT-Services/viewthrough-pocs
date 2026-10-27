import { OPERATORS, RELAY_OPERATOR_KEY, CLICK_ID_PARAM, TEST_CLICK_ID } from '../core/constants/index.js';

const VISIT_URL = OPERATORS.find((operator) => operator.key === RELAY_OPERATOR_KEY).url;
const TIMEOUT_MS = 5000;

export async function setAttribution(req, res) {
  try {
    const visitorIp = req.ip;
    const afp = TEST_CLICK_ID;
    const targetUrl = new URL(VISIT_URL);
    targetUrl.searchParams.set(CLICK_ID_PARAM, afp);

    console.log(`[abandoned relay] forwarding visit for IP: ${visitorIp}`);

    // These three headers are the abandoned trick. They are only text in the request:
    // the connection still comes from this server, so the affiliate sees our IP, not the reader's.
    const response = await fetch(targetUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': visitorIp,
        'Client-IP': visitorIp,
        'User-Agent': req.body.userAgent,
      },
    });

    if (response.status >= 400) {
      throw new Error(`Operator responded with ${response.status}`);
    }

    // The redirect stops here. We hand the browser a string it will never navigate to.
    return res.status(200).json({
      success: true,
      message: 'Operator accepted the attribution request.',
      afp,
      operatorStatus: response.status,
      operatorContentType: response.headers.get('content-type'),
      operatorLocation: response.headers.get('location'),
    });
  } catch (error) {
    console.error('Transmission to operator failed:', error.message);
    return res.status(502).json({ error: 'Pipeline connection failed' });
  }
}
