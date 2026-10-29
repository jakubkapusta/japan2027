/* Service worker — tryb offline dla planu podróży Japonia 2027 */
const CACHE = 'japonia2027-v2';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './img/day01-1-susukino.jpg',
  './img/day02-1-moiwa.jpg',
  './img/day03-1-kamui.jpg',
  './img/day04-1-shikisai.jpg',
  './img/day05-1-bluepond.jpg',
  './img/day06-1-asahidake.jpg',
  './img/day07-1-tomita.jpg',
  './img/day08-1-abashiri.jpg',
  './img/day09-1-goko.jpg',
  './img/day10-1-kamuiwakka.jpg',
  './img/day11-1-mashu.jpg',
  './img/day12-1-shinjuku.jpg',
  './img/day13-1-ashi.jpg',
  './img/day14-1-shinokubo.jpg',
  './img/day15-1-takeshita.jpg',
  './img/dog.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Ten sam origin (github.io) co japan2026 — kasujemy tylko własne stare cache
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('japonia2027-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Strona (nawigacja): sieć najpierw (świeże dane gdy online), cache w razie braku sieci
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Reszta (ikony, manifest, fonty Google): cache najpierw, w tle dociągamy i zapisujemy
  e.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        const okToCache = res && res.status === 200 &&
          (url.origin === location.origin ||
           url.host.includes('gstatic') || url.host.includes('googleapis'));
        if (okToCache) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
