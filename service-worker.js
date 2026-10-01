const CACHE_NAME = "moriya-signage-v95-mobile-sheet-drag";
const APP_SHELL = [
  "./",
  "./index.html",
  "./iphone/index.html",
  "./iphone/iphone.css",
  "./iphone/iphone.js",
  "./iphone/viewport.js",
  "./iphone/sheet-drag.js",
  "./iphone/manifest.webmanifest",
  "./assets/icons/moriya-navi-180.png",
  "./assets/icons/moriya-navi-192.png",
  "./assets/icons/moriya-navi-512.png",
  "./data/display-theme.js",
  "./styles.css",
  "./new-ui.css",
  "./app.js",
  "./new-ui.js",
  "./github-sync-core.js",
  "./github-sync.js",
  "./assets/vendor/qrcode-core.js",
  "./assets/vendor/jsQR.js",
  "./lan-sync.js",
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  // Cloud APIs must never receive the offline HTML fallback or enter app caches.
  if (new URL(request.url).origin !== location.origin) return;
  if (request.destination === "video") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (new URL(request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
  );
});
