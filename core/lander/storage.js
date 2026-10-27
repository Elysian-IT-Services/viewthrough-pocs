import { OPERATORS, DEFAULT_OPERATOR, STORAGE_KEYS } from '../constants/index.js';

export function hasConsent() {
  return localStorage.getItem(STORAGE_KEYS.consent) === '1';
}

export function grantConsent() {
  localStorage.setItem(STORAGE_KEYS.consent, '1');
}

export function readDeferredClick() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.deferredClick));
}

export function recordDeferredClick(mechanism, extra = {}) {
  if (readDeferredClick()) return false;
  const click = { mechanism, at: new Date().toISOString(), ...extra };
  localStorage.setItem(STORAGE_KEYS.deferredClick, JSON.stringify(click));
  return true;
}

// Keeps the chosen operator so a reset leaves you on the operator you are demoing.
export function resetState() {
  localStorage.removeItem(STORAGE_KEYS.consent);
  localStorage.removeItem(STORAGE_KEYS.deferredClick);
}

export function getOperatorKey() {
  return localStorage.getItem(STORAGE_KEYS.operator) || DEFAULT_OPERATOR;
}

export function setOperatorKey(key) {
  localStorage.setItem(STORAGE_KEYS.operator, key);
}

export function activeOperator() {
  const operator = OPERATORS.find((item) => item.key === getOperatorKey());
  if (operator) return operator;
  return OPERATORS[0];
}

export function activeOperatorUrl() {
  return activeOperator().url;
}
