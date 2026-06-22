/* バドミントン大会システム Service Worker
   ★アプリ（court.html / hq.html / sync.js など）を更新したら、下の CACHE の
     バージョン番号を必ず上げること（v1→v2…）。上げ忘れると利用者端末に古い版が
     キャッシュされたまま残る。 */
const CACHE = 'bdmt-tourney-v1';

const ASSETS = [
  './court.html', './hq.html',
  './sync.js', './firebase-config.js', './firebase-boot.js',
  './manifest-court.webmanifest', './manifest-hq.webmanifest',
  './icon-court-192.png', './icon-court-512.png', './icon-court-maskable-512.png', './apple-touch-court.png',
  './icon-hq-192.png', './icon-hq-512.png', './icon-hq-maskable-512.png', './apple-touch-hq.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 同一オリジンのみ対象。Firebase/gstatic などの外部はキャッシュせずネットワークへ。
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    // ?room= などのクエリ違いでも本体にヒットさせる
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
