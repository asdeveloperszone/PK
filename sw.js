// ASTUBE Service Worker — v3
// Hosted at: asdeveloperszone.github.io/PK

const CACHE     = 'astube-v3';
const BASE_PATH = '/PK';
const APP_SHELL = [
  BASE_PATH + '/index.html',
  BASE_PATH + '/search.html',
  BASE_PATH + '/player.html',
  BASE_PATH + '/login.html',
  BASE_PATH + '/profile.html',
  BASE_PATH + '/add-video.html',
  BASE_PATH + '/offline.html',
  BASE_PATH + '/style.css',
  BASE_PATH + '/app.js',
  BASE_PATH + '/config.js',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always pass through: Firebase, YouTube, backend, CDN
  if (
    url.includes('firebaseio.com')  ||
    url.includes('googleapis.com')  ||
    url.includes('ytimg.com')       ||
    url.includes('gstatic.com')     ||
    url.includes('localhost:5000')  ||
    url.includes('youtube.com')     ||
    e.request.method !== 'GET'
  ) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match(BASE_PATH + '/offline.html');
        }
      });
    })
  );
});
