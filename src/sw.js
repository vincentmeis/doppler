self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open("d6Cache");
      cache.addAll(["index.html", "main.js", "style.css"]);
    })()
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        const updatedResponse = await fetch(event.request);
        if (updatedResponse.ok) {
          const cache = await caches.open("d6Cache");
          cache.put(event.request, updatedResponse.clone());
          return updatedResponse;
        } else {
          throw new Error(`Response status: ${updatedResponse.status}`);
        }
      } catch (error) {
        const cache = await caches.open("d6Cache");
        const cachedResponse = await cache.match(event.request);
        return cachedResponse;
      }
    })()
  );
});
