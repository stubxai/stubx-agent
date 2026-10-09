var CACHE = "stubx-lab-draft-2026-10-09-2";
var FILES = [
  "./",
  "./index.html",
  "./verify/index.html",
  "./lab/index.html",
  "./tablero/index.html",
  "./assets/site.css",
  "./assets/site.js",
  "./assets/mission.js",
  "./sw.js",
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(FILES);
  }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (hit) {
    return hit || fetch(event.request);
  }).catch(function () {
    if (event.request.mode === "navigate") return caches.match("./index.html");
    return Promise.reject(new Error("offline"));
  }));
});
