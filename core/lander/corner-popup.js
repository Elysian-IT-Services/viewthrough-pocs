import { POPUP_SIZE_PX, POPUP_CLOSE_AFTER_OPEN_MS, POPUP_CLOSE_CHECK_MS } from '../constants/index.js';

function cornerPosition() {
  const screenWidth = screen.availWidth || screen.width;
  const screenHeight = screen.availHeight || screen.height;
  return { left: Math.max(0, screenWidth - POPUP_SIZE_PX), top: Math.max(0, screenHeight - POPUP_SIZE_PX) };
}

// A window is its own top-level page, not a frame, so the operator writes its SameSite=Lax cookies
// exactly as it would in a normal tab. The small corner size is what keeps it out of the way;
// nothing here touches focus, because a backgrounded window gets its timers throttled.
export function openCornerWindow(url, report) {
  const { left, top } = cornerPosition();
  const features = `popup=yes,width=${POPUP_SIZE_PX},height=${POPUP_SIZE_PX},left=${left},top=${top}`;
  const popupWindow = window.open(url, '_blank', features);

  if (!popupWindow) {
    report('blocked', 'window.open was refused — nothing opened; the explicit click-through still works');
    return null;
  }

  // Size and position are best effort: browsers clamp or ignore them, and phones ignore them
  // entirely and open a full tab.
  try {
    popupWindow.resizeTo(POPUP_SIZE_PX, POPUP_SIZE_PX);
    popupWindow.moveTo(left, top);
  } catch {
    // Clamped by the browser.
  }

  report('fired', `Opened ${url} in a ${POPUP_SIZE_PX}px window at the bottom-right.`);
  return popupWindow;
}

function closeAndVerify(popupWindow, report, openedAt) {
  popupWindow.close();
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
