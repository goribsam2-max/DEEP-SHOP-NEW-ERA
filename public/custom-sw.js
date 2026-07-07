// Standard Web Push Handler for VAPID implementation
self.addEventListener('push', function(event) {
  // If no data, do nothing
  if (!event.data) return;
  
  try {
     const data = event.data.json();
     const title = data.title || 'Vibe Gadgets';
     const options = {
         body: data.body,
         icon: data.icon || '/apple-touch-icon.png',
         image: data.image,
         data: { url: data.url || '/' }
     };
     event.waitUntil(self.registration.showNotification(title, options));
  } catch(e) {
     // Not JSON or handled
  }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
            let urlToOpen = event.notification.data?.url || '/';
            // ensure it's a full URL
            if (urlToOpen.startsWith('/')) {
                urlToOpen = self.location.origin + urlToOpen;
            } else if (!urlToOpen.startsWith('http')) {
                urlToOpen = self.location.origin + '/' + urlToOpen;
            }
            
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if ('focus' in client) {
                    client.focus();
                    if ('navigate' in client) {
                        return client.navigate(urlToOpen);
                    }
                    return;
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
