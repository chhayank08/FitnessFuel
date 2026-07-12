import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

function vibrate(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}

export function hapticLight() {
  if (isNative()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  else vibrate(10);
}

export function hapticMedium() {
  if (isNative()) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  else vibrate(20);
}

export function hapticSelection() {
  if (isNative()) Haptics.selectionStart().then(() => Haptics.selectionEnd()).catch(() => {});
  else vibrate(8);
}

export function hapticSuccess() {
  if (isNative()) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  else vibrate(15);
}
