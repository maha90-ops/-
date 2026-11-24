/* service-worker.js — Offline First
   يخزن كل ملفات التطبيق عند أول زيارة، ثم يخدمها من الذاكرة المحلية.
   عند تعديل أي ملف: غيّر رقم VERSION ليحصل الطلاب على النسخة الجديدة. */
const VERSION = 'wrm-v1.0.0';
const CORE = [
  './', './index.html', './style.css', './app.js', './data.js', './manifest.json',
  './modules/utils.js', './modules/store.js', './modules/audio.js',
  './components/scenes.js', './components/nemo.js', './components/ui.js',
  './modules/intro.js', './modules/map.js',
  './modules/stage-lab.js', './modules/stage-investigate.js', './modules/stage-clouds.js',
  './modules/stage-weather.js', './modules/stage-planet.js', './modules/stage-whatif.js',
  './modules/stage-city.js', './modules/stage-challenge.js', './modules/achievement.js',
  './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-512.png',
  './assets/fonts/tajawal-arabic-400-normal.woff2', './assets/fonts/tajawal-arabic-500-normal.woff2',
  './assets/fonts/tajawal-arabic-700-normal.woff2', './assets/fonts/tajawal-latin-400-normal.woff2',
  './assets/fonts/tajawal-latin-700-normal.woff2',
  './assets/fonts/baloo-bhaijaan-2-arabic-700-normal.woff2', './assets/fonts/baloo-bhaijaan-2-arabic-800-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache First للملفات المحلية، مع تحديث الذاكرة في الخلفية (stale-while-revalidate) */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => null);
        if (hit) { e.waitUntil(net); return hit; }
        return net.then(res => res || (req.mode === 'navigate' ? cache.match('./index.html') : new Response('', { status: 504 })));
      })
    )
  );
});
