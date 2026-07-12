// Thin wrapper around the Notification permission API.
//
// GOTCHA: requestNotificationPermission() must be invoked synchronously from
// inside a user-gesture handler (a click), with no `await` before the call.
// Safari (desktop and iOS 16.4+) silently no-ops the permission prompt
// otherwise — the promise resolves but no dialog ever appears, and the
// permission stays 'default' forever until the page reloads.
//
// Once a user denies, no API can re-prompt — the browser must be reset by
// hand in site settings. Callers must detect 'denied' and show guidance
// rather than a dead toggle.

export type NotificationSupport = 'unsupported' | 'ios-not-installed' | 'supported';

function isStandalone(): boolean {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
}

/**
 * Reports whether notifications can work in this context at all — distinct
 * from permission state. iOS Safari lacks the Notification API entirely
 * unless the site is installed to the Home Screen (iOS >= 16.4).
 */
export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return isIOS() && !isStandalone() ? 'ios-not-installed' : 'unsupported';
  }
  return 'supported';
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Call synchronously from a click handler — see module doc above. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}
