this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll([
        'index.html',
        'sw.js',
        'manifest.appcache',
        'manifest.json',
        'stylesheets/canvas.css',
        'stylesheets/dog.css',
        'stylesheets/list.css',
        'stylesheets/main.css',
        'stylesheets/map.css',
        'stylesheets/page-content.css',
        'stylesheets/welcome-card.css',
        'scripts/camera.js',
        'images/dog.png',
        'images/welcome-card.jpg',
        'node_modules/material-design-lite/material.min.css',
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/material-design-lite/material.min.js',
        'node_modules/leaflet/dist/leaflet.js',
        'node_modules/leaflet/dist/images/layers-2x.png',
        'node_modules/leaflet/dist/images/layers-2x.png',
        'node_modules/leaflet/dist/images/marker-icon-2x.png',
        'node_modules/leaflet/dist/images/marker-icon.png',
        'node_modules/leaflet/dist/images/marker-shadow.png',
        'node_modules/dexie/dist/dexie.min.js'
      ]);
    })
  );
});

this.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request).then(function(response) {
        caches.open('v1').then(function(cache) {
          cache.put(event.request, response);
        });

        return response.clone();
      });
    }).catch(function() {
      return fetch(event.request);
    })
  );
});
