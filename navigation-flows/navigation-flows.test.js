import test from 'node:test';
import assert from 'node:assert/strict';
import { startNavigationFlow, observeNavigationWindow } from './navigation-flows.js';

const target = 'https://operator.example/visit/?bta=test-bta&campaign=hotspawn_new&afp=old';

function fixture() {
  const calls = [];
  const timers = [];
  const reports = [];

  const opened = {
    closed: false,
    focus() {
      calls.push('offer-focus');
    },
    close() {
      calls.push('close');
      this.closed = true;
    },
  };

  const host = {
    location: {
      href: 'http://localhost:4100/navigation-flows/',
      replace(url) {
        calls.push(['replace', url]);
      },
    },
    open(...args) {
      calls.push(['open', ...args]);
      return opened;
    },
    setTimeout(fn, delay) {
      calls.push(['timer', delay]);
      timers.push(fn);
    },
    focus() {
      calls.push('publisher-focus');
    },
  };

  function report(state, message) {
    reports.push({ state, message });
  }

  return { host, opened, calls, timers, reports, report };
}

test('popup opens synchronously, once, at 400x300, and the publisher does not navigate', () => {
  const harness = fixture();
  const run = startNavigationFlow('popup', target, 3000, harness.report, harness.host);
  const openCalls = harness.calls.filter((call) => call[0] === 'open');

  assert.equal(harness.calls[0][0], 'open');
  assert.equal(harness.calls[0][3], 'popup=yes,width=400,height=300');
  assert.equal(openCalls.length, 1);
  assert.equal(harness.calls.some((call) => call[0] === 'replace'), false);

  const sent = new URL(harness.calls[0][1]);
  assert.equal(sent.searchParams.get('afp'), run.afp);
  assert.equal(sent.searchParams.getAll('afp').length, 1);
  assert.equal(sent.searchParams.get('bta'), 'test-bta');
  assert.equal(sent.searchParams.get('campaign'), 'hotspawn_new');
});

test('reverse opens the publisher first and replaces the original history entry with the affiliate URL', () => {
  const harness = fixture();
  const run = startNavigationFlow('reverse', target, 3000, harness.report, harness.host);
  const clone = new URL(harness.calls[0][1]);

  assert.equal(clone.origin, 'http://localhost:4100');
  assert.equal(clone.searchParams.get('watch'), '1');
  assert.equal(clone.searchParams.get('afp'), run.afp);
  assert.equal(harness.calls[1], 'offer-focus');
  assert.deepEqual(harness.calls[2], ['replace', clone.searchParams.get('target')]);
  assert.equal(harness.timers.length, 0);
});

for (const mode of ['popup', 'reverse']) {
  test(`${mode}: a blocked window leaves the original untouched and does not try again`, () => {
    const harness = fixture();
    harness.host.open = (...args) => {
      harness.calls.push(['open', ...args]);
      return null;
    };

    assert.equal(startNavigationFlow(mode, target, 3000, harness.report, harness.host).opened, false);
    assert.equal(harness.calls.length, 1);
    assert.equal(harness.reports.at(-1).state, 'blocked');
  });
}

test('a disconnected handle never reports confirmed physical closure', () => {
  const harness = fixture();
  harness.opened.closed = true;
  observeNavigationWindow(harness.opened, 3000, harness.report, harness.host);
  harness.timers.shift()();

  assert.equal(harness.calls.includes('close'), false);
  assert.equal(harness.reports.at(-1).state, 'unverified');
});

test('a null opener in the reverse flow is unverified, not success', () => {
  const harness = fixture();
  observeNavigationWindow(null, 3000, harness.report, harness.host);
  harness.timers.shift()();

  assert.equal(harness.reports.at(-1).state, 'unverified');
});

test('a refused close is reported as still open', () => {
  const harness = fixture();
  harness.opened.close = () => {};
  observeNavigationWindow(harness.opened, 3000, harness.report, harness.host);
  harness.timers.shift()();
  harness.timers.shift()();

  assert.equal(harness.reports.at(-1).state, 'still-open');
});

test('a close request followed by a closed handle still claims neither closure nor attribution', () => {
  const harness = fixture();
  observeNavigationWindow(harness.opened, 3000, harness.report, harness.host);
  harness.timers.shift()();
  harness.timers.shift()();

  assert.equal(harness.calls.includes('close'), true);
  assert.equal(harness.reports.at(-1).state, 'unverified');
});

test('manual inspection mode does not close the window or schedule a timer', () => {
  const harness = fixture();
  observeNavigationWindow(harness.opened, 0, harness.report, harness.host);

  assert.equal(harness.calls.length, 0);
  assert.equal(harness.reports.at(-1).state, 'manual');
});

test('an invalid scheme or delay fails before anything opens or navigates', () => {
  const harness = fixture();

  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'bad-url']) {
    assert.throws(() => startNavigationFlow('popup', url, 3000, harness.report, harness.host));
  }
  for (const delay of [-1, NaN, Infinity, 60001]) {
    assert.throws(() => startNavigationFlow('popup', target, delay, harness.report, harness.host));
  }

  assert.equal(harness.calls.length, 0);
});

test('a refused focus does not stop the reverse navigation', () => {
  const harness = fixture();
  harness.opened.focus = () => {
    throw new Error('denied');
  };
  startNavigationFlow('reverse', target, 3000, harness.report, harness.host);

  assert.equal(harness.calls.at(-1)[0], 'replace');
});
