// Custom service worker (injectManifest strategy). vite-plugin-pwa injects
// the precache manifest at the self.__WB_MANIFEST placeholder below at build
// time — this file must stay the swSrc referenced in vite.config.ts.
//
// Runtime caching here mirrors the previous generateSW `workbox.runtimeCaching`
// config 1:1 (same regexes/cache names/expiration) — the switch to
// injectManifest was made ONLY to unlock push/notificationclick handlers,
// which generateSW cannot support.

/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  })
);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\//,
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\//,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/cdn\.jsdelivr\.net\//,
  new CacheFirst({
    cacheName: 'cdn-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/storage\.googleapis\.com\//,
  new CacheFirst({
    cacheName: 'mediapipe-model',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\//,
  new NetworkFirst({
    cacheName: 'supabase-postgrest',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
  'GET'
);

registerRoute(/^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/v1\//, new NetworkOnly());
registerRoute(/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\//, new NetworkOnly());

registerRoute(
  /^https:\/\/world\.openfoodfacts\.org\//,
  new StaleWhileRevalidate({ cacheName: 'openfoodfacts-api', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] })
);
registerRoute(
  /^https:\/\/api\.nal\.usda\.gov\//,
  new StaleWhileRevalidate({ cacheName: 'usda-api', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] })
);
registerRoute(
  /^https:\/\/exercisedb\.p\.rapidapi\.com\//,
  new StaleWhileRevalidate({ cacheName: 'exercisedb-api', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] })
);
registerRoute(
  /^https:\/\/eutils\.ncbi\.nlm\.nih\.gov\//,
  new StaleWhileRevalidate({ cacheName: 'pubmed-api', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] })
);
registerRoute(
  /^https:\/\/clinicaltrials\.gov\//,
  new StaleWhileRevalidate({ cacheName: 'clinicaltrials-api', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] })
);
registerRoute(
  /^https:\/\/api\.fda\.gov\//,
  new StaleWhileRevalidate({ cacheName: 'openfda-api', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] })
);

// virtual:pwa-register/react posts this when updateServiceWorker(true) is
// called from the "update available" toast (src/lib/pwa.tsx) — generateSW
// wired this automatically via its `skipWaiting` option; injectManifest needs
// it done by hand.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Push notifications ──────────────────────────────────────────────────────

interface PushPayload {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  const { title = 'FitnFuel', body = '', icon = '/icons/icon-192.png', badge = '/icons/icon-192.png', tag, url = '/dashboard' } = data;
  event.waitUntil(self.registration.showNotification(title, { body, icon, badge, tag, data: { url } }));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) (client as WindowClient).navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// The browser can invalidate/rotate a push subscription at any time. This
// handler is best-effort: the SW has no authenticated Supabase client, so it
// can only re-subscribe locally — the real safety net is client-side
// reconciliation on app foreground (usePushSubscription.ts checks the live
// subscription against the stored row on mount).
//
// VITE_VAPID_PUBLIC_KEY is inlined here by Vite's static define replacement
// at build time (same mechanism as any import.meta.env.VITE_* usage) — it is
// NOT a runtime env lookup, since service workers have no import.meta.env.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

self.addEventListener('pushsubscriptionchange', (event: Event) => {
  const pse = event as Event & { newSubscription?: PushSubscription; oldSubscription?: PushSubscription };
  if (!VAPID_PUBLIC_KEY) return;
  const resubscribe = self.registration.pushManager
    .subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })
    .catch(() => null);
  (event as ExtendableEvent).waitUntil?.(resubscribe as unknown as Promise<void>);
  void pse;
});
