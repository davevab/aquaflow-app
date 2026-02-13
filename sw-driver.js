// AquaFlow Driver Service Worker - Push Notifications
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', function(e) {
    let data = { title: '🚚 New Delivery!', body: 'You have a new delivery assigned.', orderId: '' };
    try { if (e.data) data = e.data.json(); } catch(err) {}

    e.waitUntil(self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/driver-icon.png',
        badge: '/driver-icon.png',
        tag: 'new-delivery-' + data.orderId,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: '/driver-app.html' },
        actions: [
            { action: 'view', title: '👁 View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    }));
});

self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    if (e.action === 'dismiss') return;
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (const client of clientList) {
                if (client.url.includes('driver-app') && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/driver-app.html');
        })
    );
});
