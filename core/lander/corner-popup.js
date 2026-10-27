import { POPUP_SIZE_PX, POPUP_CLOSE_AFTER_OPEN_MS, POPUP_CLOSE_CHECK_MS, FOCUS_RETRY_MS } from '../constants/index.js';

function cornerPosition() {
  const screenWidth = screen.availWidth || screen.width;
  const screenHeight = screen.availHeight || screen.height;
  return { left: Math.max(0, screenWidth - POPUP_SIZE_PX), top: Math.max(0, screenHeight - POPUP_SIZE_PX) };
}

// Chrome ignores blur() on a window it just opened, but usually honours focus() on the opener.
function returnFocusToLander(popupWindow) {
  try {
    popupWindow.blur();
    window.focus();
    setTimeout(() => window.focus(), FOCUS_RETRY_MS);
  } catch {
    // The browser kept focus on the new window.
  }
}

// A window is top-level, not a frame, so the operator writes its SameSite=Lax cookies as it would
// in a normal tab. That is the whole reason this attributes and the iframe POC does not.
export function openCornerWindow(url, report) {
  const { left, top } = cornerPosition();
  const features = `popup=yes,width=${POPUP_SIZE_PX},height=${POPUP_SIZE_PX},left=${left},top=${top}`;
  const popupWindow = window.open(url, '_blank', features);

  if (!popupWindow) {
    report('blocked', 'window.open was refused — nothing opened; the explicit click-through still works');
    return null;
  }

  // Best effort: browsers clamp these, and fullscreen or in-app browsers open a full tab instead.
  try {
    popupWindow.resizeTo(POPUP_SIZE_PX, POPUP_SIZE_PX);
    popupWindow.moveTo(left, top);
  } catch {
    // Clamped by the browser.
  }

  returnFocusToLander(popupWindow);

  report('fired', `Opened ${url} in a ${POPUP_SIZE_PX}px window at the bottom-right, focus handed back to the lander.`);
  return popupWindow;
}

function closeAndVerify(popupWindow, report, openedAt) {
  popupWindow.close();
  window.focus();
  setTimeout(() => {
    const elapsed = Date.now() - openedAt;
    if (popupWindow.closed) {
      report('closed', `Window closed ${elapsed} ms after it opened. Closing proves nothing by itself — check the operator cookies.`);
    } else {
      report('still-open', 'The browser refused to close the window. Close it yourself.');
    }
  }, POPUP_CLOSE_CHECK_MS);
}

export function closeWindowAfterDelay(popupWindow, report, delayMs = POPUP_CLOSE_AFTER_OPEN_MS) {
  const openedAt = Date.now();

  if (delayMs === 0) {
    report('manual', 'Auto-close is off. Watch the window yourself, note when the cookie lands, then close it.');
    return;
  }

  report('waiting', `Closing in ${delayMs} ms. Too short and the cookie never lands; too long and the reader sits and watches.`);
  setTimeout(() => closeAndVerify(popupWindow, report, openedAt), delayMs);
}
