const CACHE_NAME = "phoenix-store-v1";

self.addEventListener("install", (event) => {
  console.log("Phoenix Store PWA installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network-first: Phoenix Store data always stays fresh
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});