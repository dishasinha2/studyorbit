self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("studyorbit-shell-v1").then((cache) =>
      cache.addAll(["/", "/dashboard", "/profile", "/ai", "/manifest.webmanifest"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open("studyorbit-shell-v1").then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/dashboard"))),
  );
});
