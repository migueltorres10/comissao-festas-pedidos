const CACHE = 'pedidos-v12';
const scope = self.registration.scope;
const indexUrl = new URL('index.html', scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(indexUrl, { cache: 'reload' });
    if (!response.ok) throw new Error('Não foi possível obter a aplicação.');
    const html = await response.clone().text();
    // Cache the actual hashed build assets before activating the new version.
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
      .map(match => new URL(match[1], scope).href);
    await cache.addAll([...assets, new URL('manifest.webmanifest', scope).href, new URL('icon.svg', scope).href]);
    await cache.put(indexUrl, response.clone());
    await cache.put(scope, response);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (/^pedidos-v\d+$/.test(name) && name !== CACHE) await caches.delete(name);
    }
    // Cache Storage only: IndexedDB and all open orders remain untouched.
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      // Do not overwrite the installed shell: it matches the precached assets.
      return response.ok ? response : caches.match(indexUrl, { cacheName: CACHE });
    }).catch(() => caches.match(indexUrl, { cacheName: CACHE })));
    return;
  }
  event.respondWith(caches.match(request, { cacheName: CACHE }).then(cached => cached || fetch(request)));
});
