import { STORAGE_KEYS, RESTORE_ON_CAUSES, RESTORE_TTL_DAYS } from './config.js';

const NOTHING_FIRED = '<p class="muted">Nothing fired yet. Open the demo lander, accept marketing consent, then click the banner.</p>';
const DISCLOSURE = `Persistence: if your browser drops that cookie (${RESTORE_ON_CAUSES.join(' or ')}) this extension re-writes the exact value the operator's own script issued, with ${RESTORE_TTL_DAYS} more days of life. It never invents a value, and it never brings back a cookie you cleared yourself.`;

function byId(id) {
  return document.getElementById(id);
}

function row(label, value) {
  return `<span>${label}</span><code>${value ?? '—'}</code>`;
}

function paramRows(params) {
  const names = Object.keys(params ?? {});
  if (names.length === 0) return row('Link params', 'none confirmed for this operator');
  return names.map((name) => row(name, params[name])).join('');
}

function verdict(recorded, live) {
  if (!recorded) {
    return { tone: 'bad', text: '✗ No attribution cookie was observed on that fire — nothing to prove.' };
  }
  if (live && live.value === recorded.value) {
    return { tone: 'ok', text: `✓ Live ${recorded.name} is the same visitor ID that logged join_start with our referral — attribution holds.` };
  }
  if (live) {
    return { tone: 'bad', text: `✗ A different ${recorded.name} is live — the recorded join_start will not attribute.` };
  }
  return { tone: 'bad', text: `✗ ${recorded.name} is gone from the browser and was not restored.` };
}

function panel(record, recorded, live) {
  const { tone, text } = verdict(recorded, live);
  return `<div class="kv">
      ${row('Operator', record.label)}
      ${row('Fired at', record.firedAt)}
      ${paramRows(record.params)}
      ${row('Landing URL', record.landingUrl)}
      ${row('Cookie after', record.cookieAfterMs === null ? 'not seen' : `${record.cookieAfterMs} ms`)}
      ${row('Recorded', recorded && `${recorded.name}=${recorded.value}`)}
      ${row('Live now', live && `${live.name}=${live.value}`)}
      ${row('Restores', record.restores)}
    </div>
    <span class="pill ${tone}">${text}</span>`;
}

async function main() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.lastFire, STORAGE_KEYS.keepTab]);
  const record = data[STORAGE_KEYS.lastFire];
  const recorded = record?.cookie;
  const live = recorded ? await chrome.cookies.get({ url: recorded.url, name: recorded.name }) : null;

  byId('panel').innerHTML = record ? panel(record, recorded, live) : NOTHING_FIRED;
  byId('disclosure').textContent = DISCLOSURE;

  const keepTab = byId('keepTab');
  keepTab.checked = Boolean(data[STORAGE_KEYS.keepTab]);
  keepTab.addEventListener('change', () => {
    chrome.storage.local.set({ [STORAGE_KEYS.keepTab]: keepTab.checked });
  });

  byId('forget').addEventListener('click', async () => {
    await chrome.storage.local.remove(STORAGE_KEYS.lastFire);
    location.reload();
  });
}

main();
