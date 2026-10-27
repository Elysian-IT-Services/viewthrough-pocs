const HIJACK_URL = '/opener-isolation/hijacked.html';

const status = document.getElementById('status');

if (window.opener) {
  status.textContent = 'window.opener is live. This page can reach the tab that opened it, and is about to navigate it away.';
  window.opener.location = HIJACK_URL;
} else {
  status.textContent = 'window.opener is null. The tab that opened this page is out of reach.';
}
