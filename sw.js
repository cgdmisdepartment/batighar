const CACHE_NAME = 'batighar-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Apps Script API কল এবং external app URL গুলো ক্যাশ না করে সরাসরি নেটওয়ার্ক থেকে আনা হবে,
  // যাতে ডেটা সবসময় সর্বশেষ থাকে (অ্যাপ লিস্ট, নোটিফিকেশন ইত্যাদি বাসি cache থেকে না আসে)
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // শুধু সফল, একই-অরিজিন রেসপন্স ক্যাশ করা হবে
        if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
