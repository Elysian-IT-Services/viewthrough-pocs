const COOKIE_URL = '/api/set-cookie-test';

const status = document.getElementById('status');

function log(message) {
  status.textContent += `\n${message}`;
}

async function requestCookie(policy) {
  try {
    const response = await fetch(`${COOKIE_URL}?policy=${policy}`);
    const result = await response.json();
    log(`${policy}: ${result.message} Check Application then Cookies.`);
  } catch (error) {
    log(`${policy}: the request failed. ${error.message}`);
  }
}

for (const button of document.querySelectorAll('[data-policy]')) {
  button.addEventListener('click', () => requestCookie(button.dataset.policy));
}
