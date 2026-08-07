/**
 * Service Worker hỗ trợ Progressive Web App (PWA) và Hoạt động Ngoại tuyến (Offline Capabilities).
 *
 * @remarks
 * - **CACHE VERSIONING**: Khóa tên cache `CACHE_NAME = 'wordora-app-shell-v1.0.0'`.
 * - **PRECACHE ASSETS**: Lưu trữ trước các tài nguyên App Shell tĩnh bao gồm `/`, `/manifest.json`, `/offline.html`, icons, và favicon.
 * - **NAVIGATION FALLBACK STRATEGY**:
 *   - Với các yêu cầu điều hướng trang (`request.mode === 'navigate'`): Thử tải qua mạng trước (Network-First). Nếu mất mạng, lấy từ cache hoặc hiển thị trang `/offline.html`.
 * - **STATIC ASSET STALE-WHILE-REVALIDATE**:
 *   - Với tài nguyên tĩnh (`/_next/`, `.js`, `.css`, `.png`, `.svg`, `.ico`): Lấy bản cache hiện tại ra lập tức (Stale), đồng thời gửi fetch cập nhật cache ngầm (Revalidate).
 * - **BOUNDARY WITH INDEXEDDB**:
 *   - Service Worker CHỈ lưu trữ static JS/CSS bundles và HTML App Shell.
 *   - Service Worker **TUYỆT ĐỐI KHÔNG LƯU TRỮ DỮ LIỆU CSDL INDEXEDDB** (bộ học, từ vựng, SRS state). Toàn bộ dữ liệu nghiệp vụ do Dexie.js quản lý độc lập trực tiếp dưới IndexedDB.
 */

const CACHE_NAME = 'wordora-app-shell-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('wordora-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate for Static Assets, Navigation Fallback for HTML
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Only handle GET requests
  if (request.method !== 'GET') return;

  // 2. Ignore non-http(s) schemes or browser extension requests
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // 3. Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // 4. Static assets (_next/static, images, fonts, icons)
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// Message Event - Listen for SKIP_WAITING from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

