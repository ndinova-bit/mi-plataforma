const CACHE_NAME = 'cfp403-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/header.css',
  '/css/hero.css',
  '/css/courses.css',
  '/css/footer.css',
  '/css/animations.css',
  '/js/ui.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
