const CACHE_NAME = "moriya-signage-v2.2.2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./qr-transfer-core.js", "./qr-transfer-main.js", "./qr-transfer.js",
  "./iphone/index.html",
  "./iphone/iphone.css",
  "./iphone/iphone.js",
  "./iphone/viewport.js",
  "./iphone/sheet-drag.js",
  "./iphone/offline.js",
  "./iphone/manifest.webmanifest",
  "./assets/icons/moriya-navi-180.png",
  "./assets/icons/moriya-navi-192.png",
  "./assets/icons/moriya-navi-512.png",
  "./data/display-theme.js",
  "./styles.css",
  "./new-ui.css",
  "./app.js",
  "./calendar-reminders-core.js",
  "./calendar-reminders.js",
  "./garbage-reminders.js",
  "./new-ui.js",
  "./earthquake-beta.js",
  "./earthquake-core.js",
  "./earthquake-runtime.js",
  "./assets/audio/eew-first.mp3",
  "./earthquake-beta.css",
  "./data/earthquake-regions.json",
  "./data/earthquake-regions.geojson",
  "./web-updates.js",
  "./github-sync-core.js",
  "./github-sync.js",
  "./assets/vendor/qrcode-core.js",
  "./assets/vendor/jsQR.js",
  "./app-update-core.js",
  "./app-updates.js",
  "./release-config.json",
  "./local-video-background.js",
  "./manifest.webmanifest",
  "./data/tx-moriya-akihabara.js",
  "./data/tx-moriya-arrivals.js",
  "./data/tx-moriya-akihabara.json",
  "./data/moriya-garbage-calendar.js",
  "./assets/fonts/LINESeedJP-Thin.woff2",
  "./assets/fonts/LINESeedJP-Regular.woff2",
  "./assets/fonts/LINESeedJP-Bold.woff2",
  "./assets/fonts/LINESeedJP-ExtraBold.woff2",
  "./assets/fonts/material-symbols-subset.woff2",
  "./assets/backgrounds/sunny-komorebi-1.webp",
  "./assets/backgrounds/sunny-komorebi-1-rich.webp",
  "./assets/backgrounds/sunny-komorebi-2.webp",
  "./assets/backgrounds/sunny-komorebi-2-rich.webp",
  "./assets/backgrounds/sunny-komorebi-3.webp",
  "./assets/backgrounds/sunny-komorebi-3-rich.webp",
  "./assets/backgrounds/sunny-komorebi-color.webp",
  "./assets/backgrounds/sunny-komorebi-color-rich.webp",
  "./assets/backgrounds/sunny-komorebi-4.webp",
  "./assets/backgrounds/sunny-komorebi-4-rich.webp",
  "./assets/backgrounds/sunny-komorebi-5.webp",
  "./assets/backgrounds/sunny-komorebi-5-rich.webp",
  "./assets/backgrounds/sunny-komorebi-6.webp",
  "./assets/backgrounds/sunny-komorebi-6-rich.webp",
  "./assets/backgrounds/cloudy-forest-1.webp",
  "./assets/backgrounds/cloudy-forest-1-rich.webp",
  "./assets/backgrounds/cloudy-forest-2.webp",
  "./assets/backgrounds/cloudy-forest-2-rich.webp",
  "./assets/backgrounds/cloudy-forest-3.webp",
  "./assets/backgrounds/cloudy-forest-3-rich.webp",
  "./assets/backgrounds/cloudy-forest-4.webp",
  "./assets/backgrounds/cloudy-forest-4-rich.webp",
  "./assets/backgrounds/cloudy-forest-5.webp",
  "./assets/backgrounds/cloudy-forest-5-rich.webp",
  "./assets/backgrounds/rain-window-1.webp",
  "./assets/backgrounds/rain-window-1-rich.webp",
  "./assets/backgrounds/rain-window-2.webp",
  "./assets/backgrounds/rain-window-2-rich.webp",
  "./assets/backgrounds/rain-window-3.webp",
  "./assets/backgrounds/rain-window-3-rich.webp",
  "./assets/backgrounds/rain-window-4.webp",
  "./assets/backgrounds/rain-window-4-rich.webp",
  "./assets/backgrounds/rain-window-5.webp",
  "./assets/backgrounds/rain-window-5-rich.webp",
  "./assets/backgrounds/night-clear-1.webp",
  "./assets/backgrounds/night-clear-1-rich.webp",
  "./assets/backgrounds/night-clear-2.webp",
  "./assets/backgrounds/night-clear-2-rich.webp",
  "./assets/backgrounds/night-clear-milkyway.webp",
  "./assets/backgrounds/night-clear-milkyway-rich.webp",
  "./assets/backgrounds/night-clear-3.webp",
  "./assets/backgrounds/night-clear-3-rich.webp",
  "./assets/backgrounds/night-clear-4.webp",
  "./assets/backgrounds/night-clear-4-rich.webp",
  "./assets/backgrounds/night-clear-5.webp",
  "./assets/backgrounds/night-clear-5-rich.webp",
  "./assets/backgrounds/night-cloudy-1.webp",
  "./assets/backgrounds/night-cloudy-1-rich.webp",
  "./assets/backgrounds/night-cloudy-2.webp",
  "./assets/backgrounds/night-cloudy-2-rich.webp",
  "./assets/backgrounds/night-cloudy-3.webp",
  "./assets/backgrounds/night-cloudy-3-rich.webp",
  "./assets/backgrounds/night-cloudy-4.webp",
  "./assets/backgrounds/night-cloudy-4-rich.webp",
  "./assets/backgrounds/night-cloudy-5.webp",
  "./assets/backgrounds/night-cloudy-5-rich.webp",
  "./assets/backgrounds/night-rain-1.webp",
  "./assets/backgrounds/night-rain-1-rich.webp",
  "./assets/backgrounds/night-rain-2.webp",
  "./assets/backgrounds/night-rain-2-rich.webp",
  "./assets/backgrounds/night-rain-3.webp",
  "./assets/backgrounds/night-rain-3-rich.webp",
  "./assets/backgrounds/night-rain-4.webp",
  "./assets/backgrounds/night-rain-4-rich.webp",
  "./assets/backgrounds/night-rain-5.webp",
  "./assets/backgrounds/night-rain-5-rich.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => {
    // One-time repair: broken navigation cannot run the normal update button.
    // Future releases still wait for the normal safe update flow.
    if (CACHE_NAME === 'moriya-signage-v2.1.1') return self.skipWaiting();
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("moriya-signage-") && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function navigationResponse(response) {
  // Sites canonicalizes index.html to its directory. Safari rejects a followed
  // redirect returned for a navigation; reconstruct the decoded HTML response,
  // including previously cached responses, without its internal URL history.
  if (!response?.redirected || !response.ok) return response;
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');
  headers.delete('Location');
  return new Response(await response.blob(), {status:response.status, statusText:response.statusText, headers});
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  // Cloud APIs must never receive the offline HTML fallback or enter app caches.
  const url = new URL(request.url), base = new URL('./', self.location.href);
  if (url.origin !== base.origin || url.pathname.includes('/api/')) return;
  if (request.destination === "video") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Local development uses current files even before its old worker has been
    // unregistered. Hosted PWA snapshots retain their atomic cache-first policy.
    if (['127.0.0.1','localhost','[::1]'].includes(url.hostname)) {
      try { const response = await fetch(request, {cache:'no-store'}); if (response.ok) return response; } catch {}
    }
    const saved = await cache.match(request, {ignoreSearch:true});
    if (saved) return saved;
    if (request.mode === 'navigate' && (url.pathname === base.pathname || url.pathname === base.pathname+'index.html')) return cache.match(new URL('index.html',base).href);
    // No API responses, tokens, user uploads or arbitrary HTML fallbacks.
    return fetch(request);
  })().then(response => request.mode === 'navigate' ? navigationResponse(response) : response));
});
