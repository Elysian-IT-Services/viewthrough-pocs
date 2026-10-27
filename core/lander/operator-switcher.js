import { OPERATORS } from '../constants/index.js';
import { getOperatorKey, setOperatorKey, resetState } from './storage.js';

export function mountOperatorSwitcher() {
  const bar = document.createElement('div');
  bar.className = 'opbar';

  const title = document.createElement('strong');
  title.textContent = 'Operator:';

  const select = document.createElement('select');
  select.id = 'operator';
  for (const operator of OPERATORS) {
    const option = document.createElement('option');
    option.value = operator.key;
    option.textContent = `${operator.label} — ${operator.network}`;
    option.selected = operator.key === getOperatorKey();
    select.append(option);
  }

  const hint = document.createElement('span');
  hint.className = 'muted';
  hint.textContent = 'every name, cookie and test step on this page follows this choice';

  select.addEventListener('change', () => {
    setOperatorKey(select.value);
    resetState();
    location.reload();
  });

  bar.append(title, select, hint);
  document.body.prepend(bar);
}
