import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

// Drives the service-worker install/update lifecycle for the browser PWA.
// Registration is skipped entirely inside the Capacitor native shell — the
// same dist/ build is loaded directly into the native WebView, which has no
// use for (and shouldn't run) a browser service worker.
export function useServiceWorkerUpdate() {
  const isNative = Capacitor.isNativePlatform();
  const updateToastId = useRef<string | null>(null);

  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: !isNative,
    onRegisterError: (error) => {
      console.error('Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    if (isNative || !needRefresh) return;

    updateToastId.current = toast.custom(
      (t) => (
        <div
          className={`flex items-center gap-3 rounded-xl border border-primary-500/25 bg-surface-3 px-4 py-3 shadow-card transition-opacity ${
            t.visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-sm text-white">A new version is available</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-500/20 px-3 py-1.5 text-sm font-medium text-primary-300 hover:bg-primary-500/30"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button onClick={() => toast.dismiss(t.id)} aria-label="Dismiss" className="text-gray-500 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    );

    return () => {
      if (updateToastId.current) toast.dismiss(updateToastId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh, isNative]);

  useEffect(() => {
    if (isNative || !offlineReady) return;
    toast.success('Ready to work offline', { duration: 4000 });
    setOfflineReady(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineReady, isNative]);
}
