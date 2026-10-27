# vt-poc — affiliate attribution experiments

Every approach we tried to get an affiliate credited when a reader engages with an ad on our lander,
without dragging the reader out of their journey.

Each approach lives in its own folder and has its own page with test steps on it. Start the server,
open the menu, and click through them. This file explains why each one exists and which ones work.

## The problem

A reader clicks a paid Meta ad, passes through Keitaro, lands on our page, accepts marketing consent,
and engages with an operator's banner. We want the operator (Slots.lv, via the Revenue Network
tracking link) to credit us if that reader registers later — ideally without sending them away.

## What we measured, and why it decides everything

Slots.lv does not set an affiliate cookie over HTTP. Attribution runs on a self-hosted Matomo install:
when the join page loads, their script posts a `join_start` event to `idg.slots.lv/matomo.php`, and
Matomo ties that event to its visitor cookie `_pk_id`.

**A registration is credited only if the `_pk_id` present at registration is the same one that
recorded `join_start` with our referral.** `_pk_id` is `SameSite=Lax`, so only a real top-level
navigation writes it.

Three consequences, and they rule out most of the clever ideas:

- An **iframe** cannot work. A `SameSite=Lax` cookie is never written in a third-party frame. Chrome
  keeps nothing useful; Safari, Firefox and in-app browsers keep nothing at all.
- A **server-side call** cannot work on its own. A server cannot set a cookie in someone's browser.
  It can mint the tagged URL, nothing more.
- **Only a top-level load attributes.** Everything that works below is a variation on that.

## Setup

Needs Node 20 or newer. No build step.

```
npm install
cp .env.example .env     # then fill in the affiliate values
npm start                # http://localhost:4100
```

**The affiliate URLs and account ids are not in this repo.** They live in `.env`, which is
gitignored. `npm start` and `npm test` run `npm run setup` first, which reads `.env` and writes
`core/constants/affiliate.js` and `browser-extension/operators.js` — both generated, both gitignored.
Nothing else in the codebase contains a tracking token or an account id.

If `.env` is missing you get `No .env found. Copy .env.example to .env and fill in your affiliate
values.` rather than a stack trace. Ask whoever handed you this repo for the real values.

One thing `.env` cannot cover: the browser extension's `manifest.json` lists the operator **domains**
in `host_permissions`, and a manifest is static JSON that cannot read environment variables. The
domains are visible there; no account id or tracking token is.

Open <http://localhost:4100/> for the menu. Every POC page carries its own short test steps, and a
black bar at the top of each page lets you switch operator — every name, host, cookie and test step
on that page follows the switch.

```
npm test           # the navigation-flows unit tests
npm run lint       # eslint, should be clean
```

The browser extension is loaded separately — see its section below.

## The approaches

### Current

| Folder | What it does | Verdict |
|---|---|---|
| `cookie-proof/` | Opens the same affiliate link top-level and in an iframe so you can compare the cookies each keeps. | The clearest demonstration of the problem. Start here. |
| `pop-under/` | Opens your lander in a new tab, then sends the original tab to the affiliate link behind it. | **Works in every browser.** The main approach. |
| `pop-over/` | Opens the affiliate link in a small corner window in front, which closes itself. | Works on desktop. The window does appear in front — no browser lets a page push a window it opened behind itself. |
| `server-side-click/` | The server calls the affiliate link to mint a referral URL, then the browser loads that URL. | Useful as a capture-and-defer step. Cannot set a cookie by itself. |
| `hidden-iframe/` | Loads the affiliate link in an iframe while the reader stays put. | Does not work. Needs Slots.lv to set `_pk_id` as `SameSite=None; Secure`, and even then Chrome only. |
| `browser-extension/` | An installed extension opens the affiliate link top-level in a background tab and can prove which cookie the reader now carries. | Works, desktop Chrome/Edge only. |

An explicit "Visit <operator>" click-through sits on every lander page. It attributes in every
browser including Meta's in-app browser, and it is the baseline the others try to improve on.

**Why those two names.** A pop-under is judged by what the reader sees, not by which window moved:
in `pop-under/` the operator ends up behind your lander, which is the pop-under outcome even though
the mechanism is a tab swap. In `pop-over/` the operator window opens in front, so it is the
opposite, and calling it a pop-under is what made the two confusing in the first place.

### Earlier attempts, set aside

| Folder | What it tried | Why it was dropped |
|---|---|---|
| `banner-impression/` | Load the operator's real creative and hope the impression alone earns credit. | Impressions counted, but under `Default`. The cookie was rejected cross-site and no exposure was ever linked to a registration. |
| `navigation-flows/` | The first versions of the two pop-under ideas, with unit tests. | Superseded by `pop-under/` and `pop-over/`. Kept for the tests and the reasoning. |
| `ip-spoof-relay/` | The server called the affiliate link with the reader's IP and user agent in forged headers. | **Abandoned.** Forged headers are just text — the connection still comes from our server, and the operator's redirect dies in Node instead of reaching the reader. **It still runs** — fire it yourself and watch it fail, so nobody is tempted to try it again. |

### Browser behaviour we had to understand first

These four are short mechanism demos, not attribution attempts. They explain why the working
approaches are shaped the way they are.

| Folder | Question it answers |
|---|---|
| `opener-isolation/` | What can a new tab still do to the page that opened it? (`rel="noopener"` removes the handle the pop-unders need.) |
| `user-gesture/` | How long does a click stay valid for `window.open`? (Not long — which is why every pop-under opens its window first and asks questions later.) |
| `pre-navigation-beacon/` | How do you finish a tracking request as the page unloads? (`navigator.sendBeacon`, no fake loading overlay needed.) |
| `samesite-cookies/` | Which cookie attributes does the browser actually store? The root of the whole `_pk_id` problem. |

## The test click ID

Every outbound URL that takes a click-id parameter carries `vtpoc-test-001` instead of a random one,
so POC traffic is obvious in the affiliate's reporting and can never be confused with a real click.
It is defined once as `TEST_CLICK_ID` in `core/constants/operators.js`; change it there if you need a
different marker.

Which parameter carries it is per operator: `clickIdParam` on the operator's profile. Thunder
Partners uses `afp`. Revenue Network has no confirmed click-id parameter, so its profile says `null`
and nothing is added to the link — see the open questions below. Do not guess the parameter name.

## Testing

Each page has its own numbered steps. The general shape is the same everywhere:

1. Start the server, open the POC page, and check the operator in the black bar at the top. The
   page's own steps name the hosts and cookies for whichever operator is selected.
2. Open DevTools → Application → Cookies → the operator's origin and clear what is there, so you
   start from a known state. Do not leave an operator tab open while you clear — their script will
   quietly mint a fresh visitor id and you will compare against the wrong one.
3. Run the POC's action.
4. Re-check the cookies. A pass means the operator's attribution cookie is present and first-party.
5. Then visit the operator top-level by typing their address, and confirm the same attribution
   cookie is still there. That match is the actual proof — it is what makes a later registration
   attributable.

### The pop-over close delay — and how to find the smallest one that works

The corner window closes itself after `POPUP_CLOSE_AFTER_OPEN_MS` in `core/constants/index.js`,
counted from the moment it opens. **A page cannot see a cross-origin window finish loading**, so
that one number has to cover the redirect, the landing page and the operator's cookie write. The
shipped value is a starting point, not a measurement — too short and nothing attributes, too long
and the reader sits there watching a window.

The POC page has a **close delay box** so you can find the real floor without editing code: set it
to 0 to keep the window open, watch in that window's DevTools for the attribution cookie, and
compare against the `fired` timestamp in the status log. That gap is the floor. Then raise the box
off 0, confirm the cookie is there before the window closes, and shave it down until it stops
working. The step-by-step version is on the page itself.

Put whatever you land on back into `POPUP_CLOSE_AFTER_OPEN_MS` so every run starts there, and redo
the measurement once on a throttled connection — the floor on a desk is not the floor on 3G.

One thing shortens the floor itself rather than the margin: `server-side-click/` mints the tagged
landing URL on the server, so the window skips the redirect hop and only has the landing page left
to do.

The extension's `TAB_CLOSE_MS` is a different thing with a similar name: the extension *can* see the
tab reach `complete`, so its 40 ms is a grace period after the load, not a budget for it. Do not copy
one value into the other.

### The browser extension

```
npm start
```
Then `chrome://extensions` → Developer mode → Load unpacked → pick the `browser-extension/` folder.
Open <http://localhost:4100/browser-extension/demo/> and follow the steps on the page. Click the
extension's toolbar icon to see the recorded cookie next to the live one — if they match, attribution
holds.

### The abandoned relay

`ip-spoof-relay/` runs like every other POC — open it and press the button. It is kept working on
purpose: the point is that you can watch it fail rather than take our word for it.

What you will see: the server replies `200` with an `operatorLocation` pointing at the operator's
site. That looks like success and is not. The redirect was followed by our *server*, so the reader's
browser never visits the operator and never receives a cookie. The forged `X-Forwarded-For`,
`Client-IP` and `User-Agent` headers are only text in a request — they cannot change which machine
the TCP connection comes from, so the affiliate still sees our server's IP.

## Where this got to

**Working today:** the explicit click-through everywhere, and the pop-under everywhere. The pop-over
is the quieter desktop variant. The extension adds a higher-confidence path on desktop Chrome and
Edge.

**The catch.** Our traffic is paid Meta ads and is mostly mobile in-app. Meta's in-app browser
supports no extensions at all, so the extension cannot reach most of the people we are buying. It is
an add-on, not a replacement.

**Open questions, blocking real progress:**

- *Revenue Network* — what is the affiliate postback/S2S conversion URL? Without it, registrations
  never flow back to Keitaro. Also: is the `referral` token single-use, what is the attribution
  window, and what is the sub-ID parameter called? Do not guess `subid`/`sid`.
- *Slots.lv* — will they set Matomo `_pk_id` and `_pk_ses` to `SameSite=None; Secure`? That is the
  single change that would make the hidden iframe work on Chrome. Also: which cookie does their
  attribution ultimately key on, and what is the test-registration path?

**Before any of this is deployed:** `POST /api/deferred-click` is unauthenticated and unthrottled.
It needs rate limiting, an origin check and a server-side consent check, or it can be used to spam
clicks against our affiliate account.

## Adding an operator

Everything on every page — names, hosts, cookies, banner copy, test steps — comes from one operator
profile, so adding an operator is two edits and a restart:

1. Add `<KEY>_URL=` to `.env` (and `<KEY>_CREATIVE_URL=` if you want the banner-impression POC).
2. Add one entry to `OPERATOR_PROFILES` in `core/constants/operators.js`, with `env: { url:
   '<KEY>_URL' }` matching the name you used. Leave anything you have not confirmed with the
   operator as `null` — the pages then say "not confirmed for this operator yet" instead of printing
   a guess into a test step.
3. `npm start`. The switcher, the lander copy, the server, and the extension's operator list all
   pick it up.

Two things that cannot read `.env` and need a manual line:

- `browser-extension/manifest.json` → add the operator's hosts to `host_permissions`. `npm run
  setup` prints exactly which ones are missing.
- Nothing else. The extension's operator list itself is generated.

## Layout

```
core/constants/operators.js   one profile per operator — the single source of operator truth
core/constants/index.js       everything else shared: port, API paths, storage keys, timings
core/lander/                  consent gate, operator switcher, operator copy, corner window
server.js                     one express server serving every POC and the few API routes
<poc>/                        one folder per approach, each with its own page and test steps
```

Operator-specific copy in a page is never typed out. It is `<span data-op="label"></span>` (or
`clickHost`, `landingUrl`, `cookieOrigin`, `attributionCookie`, `cookieList`, `beacon`, `reporting`,
`bannerCopy`, `visitCta`), filled in by `core/lander/operator-text.js`. Links use `data-op-link`.

Adding a POC means creating the folder and adding its name to `POC_FOLDERS` in
`core/constants/index.js`, then adding a line to `index.html`.
