var CACHE = "stubx-lab-2026-10-09-4";
var FILES = ["./index.html", "./sw.js"];

function blocked(url) {
  var path = url.pathname;
  if (path === "/" || path === "/index.html") return true;
  if (/\/(?:aviso|avisos|notice|notices)(?:\/|$)/i.test(path)) return true;
  if (path.indexOf("/lab/") === -1 && !/\/lab$/.test(path)) return true;
  return false;
}

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
  if (blocked(url)) return;
  event.respondWith(fetch(event.request).then(function (response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) {
        return cache.put(event.request, copy);
      });
    }
    return response;
  }).catch(function () {
    return caches.match(event.request);
  }));
});
