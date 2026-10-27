import { mountOperatorContext } from '/core/lander/index.js';

const operator = mountOperatorContext();
const creative = document.getElementById('creative');
const clickThrough = document.getElementById('click-through');
const status = document.getElementById('status');

function report(state) {
  status.textContent = [
    `Pixel: ${state}`,
    `Operator: ${operator.label}`,
    `URL: ${creative.src}`,
    `Size: ${creative.naturalWidth} x ${creative.naturalHeight}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n');
}

clickThrough.href = operator.url;

if (operator.creativeUrl) {
  document.getElementById('creativeHost').textContent = new URL(operator.creativeUrl).host;
  creative.addEventListener('load', () => report('loaded'));
  creative.addEventListener('error', () => report('request went out, no image came back (a 204 or a non-image response)'));
  // Set src last so the click id is already on the very first request the browser makes.
  creative.src = operator.creativeUrl;
} else {
  creative.hidden = true;
  status.textContent = `No creative URL for ${operator.label}. Add <KEY>_CREATIVE_URL to .env and a creativeUrl entry to its env map in core/constants/operators.js.`;
}
