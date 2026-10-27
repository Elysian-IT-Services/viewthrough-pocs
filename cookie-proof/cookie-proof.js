import { mountOperatorContext } from '/core/lander/index.js';

const operator = mountOperatorContext();
const frameHost = document.getElementById('frameHost');

document.getElementById('sourceUrl').textContent = operator.url;

document.getElementById('openTop').addEventListener('click', () => window.open(operator.url, '_blank'));

document.getElementById('loadFrame').addEventListener('click', () => {
  frameHost.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.src = operator.url;
  frameHost.append(frame);
});
