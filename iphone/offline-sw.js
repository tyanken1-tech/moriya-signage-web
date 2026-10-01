"use strict";
const VERSION = '20261001-offline-1';
const PREFIX = 'moriya-navi-shell-';
const SHELL = PREFIX + VERSION;
const PHOTOS = 'moriya-navi-selected-photos';
const base = new URL('./', self.location.href);
const urls = [
  './index.html', './iphone.css', './iphone.js', './viewport.js', './sheet-drag.js', './offline.js', './manifest.webmanifest',
  '../data/display-theme.js', '../data/tx-moriya-akihabara.js', '../data/tx-moriya-arrivals.js', '../data/moriya-garbage-calendar.js',
  '../assets/fonts/LINESeedJP-Regular.woff2', '../assets/fonts/LINESeedJP-Bold.woff2', '../assets/fonts/LINESeedJP-ExtraBold.woff2',
  '../assets/fonts/material-symbols-subset.woff2', '../assets/icons/moriya-navi-180.png', '../assets/icons/moriya-navi-192.png', '../assets/icons/moriya-navi-512.png',
].map(path => new URL(path, base).href);
const photoPrefix = new URL('../assets/backgrounds/', base).href;
let photoTask = Promise.resolve();
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(urls)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== SHELL).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
async function savePhotos(selected) {
  const desired = [...new Set(selected)].filter(url => typeof url === 'string' && url.startsWith(photoPrefix) && /\/[^/]+\.webp$/.test(url)).slice(0, 2);
  const cache = await caches.open(PHOTOS);
  // Commit both selected photos before removing old ones. Failed downloads keep
  // the last working offline background instead of deleting it prematurely.
  for (const url of desired) {
    if (await cache.match(url)) continue;
    const response = await fetch(url, {cache:'reload', signal:AbortSignal.timeout(10000)});
    if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) throw new Error('Photo unavailable');
    await cache.put(url, response);
  }
  for (const request of await cache.keys()) if (!desired.includes(request.url)) await cache.delete(request);
}
self.addEventListener('message', event => {
  if (event.data?.type !== 'SAVE_PHOTOS') return;
  const task = photoTask.catch(() => {}).then(() => savePhotos(event.data.urls || []));
  photoTask = task;
  event.waitUntil(task.then(() => event.ports[0]?.postMessage({ready:true}), () => event.ports[0]?.postMessage({ready:false})));
});
async function serve(request) {
  const url = new URL(request.url), shell = await caches.open(SHELL);
  if (request.mode === 'navigate') {
    try {
      const response = await fetch(request, {signal:AbortSignal.timeout(2500)});
      if (!response.ok) throw new Error('Server unavailable');
      return response;
    } catch {
      return await shell.match(new URL('index.html', base).href) || new Response('一度オンラインで開いてください。', {status:503});
    }
  }
  if (url.href.startsWith(photoPrefix)) {
    const cache = await caches.open(PHOTOS), saved = await cache.match(request, {ignoreSearch:true});
    if (saved) return saved;
    try { const response = await fetch(request); if (!response.ok) throw new Error('Photo unavailable'); return response; }
    catch {
      const keys = await cache.keys();
      return keys.length ? cache.match(keys[0]) : new Response('', {status:503});
    }
  }
  const saved = await shell.match(request, {ignoreSearch:true});
  return saved || fetch(request); // Never return HTML for missing fonts/scripts/API requests.
}
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== base.origin || url.pathname.includes('/api/')) return;
  event.respondWith(serve(request));
});
