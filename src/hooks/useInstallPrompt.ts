import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !('MSStream' in window);
  const isChromeOnIOS = /CriOS/i.test(ua);
  return isIOS && !isChromeOnIOS;
}

// Wraps the beforeinstallprompt lifecycle (Android/desktop Chrome/Edge) and
// detects iOS Safari, which never fires that event and needs manual
// "Add to Home Screen" instructions instead. No-ops entirely inside the
// Capacitor native shell, where there's no browser install affordance.
export function useInstallPrompt() {
  const isNative = Capacitor.isNativePlatform();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay());

  useEffect(() => {
    if (isNative || isInstalled) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [isNative, isInstalled]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    isNative,
    isInstalled,
    isInstallable: !isNative && !isInstalled && deferredPrompt != null,
    isIOSInstallable: !isNative && !isInstalled && deferredPrompt == null && isIOSSafari(),
    promptInstall,
  };
}
