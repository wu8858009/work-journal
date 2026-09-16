const CACHE_NAME = "wj-cache-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Some browser extensions' content scripts issue fetches from within the page's world,
  // which this service worker ends up intercepting too even though they're not ours to
  // handle — the Cache API only supports http/https, so caching one of those throws.
  if (!event.request.url.startsWith("http")) return;
  // Never cache/intercept API calls: they carry a per-login Authorization header (the cache
  // key is just the URL, not the header) and can be authenticated or per-department data, so
  // a stale cached response can silently stand in for a live one — e.g. an old cached 401 from
  // a past session getting replayed as if it were the current login's answer, or a cached empty
  // journals list masking real data. Let those always hit the network directly.
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
