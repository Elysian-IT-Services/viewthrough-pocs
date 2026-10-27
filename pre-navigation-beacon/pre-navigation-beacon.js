const BEACON_URL = '/api/track-beacon';

document.getElementById('leave').addEventListener('click', () => {
  const payload = JSON.stringify({ event: 'outbound_click', ts: Date.now() });
  // The browser owns the request from here, so it survives this page unloading.
  navigator.sendBeacon(BEACON_URL, payload);
});
