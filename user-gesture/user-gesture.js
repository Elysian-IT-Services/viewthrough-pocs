const TARGET_URL = 'https://example.com';
const WINDOW_FEATURES = 'width=400,height=400';
const GESTURE_DELAY_MS = 1500;

const status = document.getElementById('status');

function log(message) {
  status.textContent += `\n${message}`;
}

function openWindow(label) {
  const opened = window.open(TARGET_URL, '_blank', WINDOW_FEATURES);
  if (opened) {
    log(`${label}: the window opened.`);
  } else {
    log(`${label}: the popup blocker stopped the window.`);
  }
}

document.getElementById('immediate').addEventListener('click', () => {
  openWindow('Immediate');
});

document.getElementById('delayed').addEventListener('click', () => {
  log(`Waiting ${GESTURE_DELAY_MS / 1000}s so the click's activation runs out.`);
  setTimeout(() => openWindow('Delayed'), GESTURE_DELAY_MS);
});
