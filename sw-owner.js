// AquaFlow Owner Service Worker - Push Notifications
const CACHE_NAME = 'aquaflow-owner-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// Handle incoming push notifications
self.addEventListener('push', function(e) {
    let data = { title: '🔔 New Order!', body: 'A new order has been received.', orderId: '' };
    
    try {
        if (e.data) data = e.data.json();
    } catch(err) {}

    const options = {
        body: data.body,
        icon: '/owner-icon.png',
        badge: '/owner-icon.png',
        tag: 'new-order-' + data.orderId,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: '/owner-dashboard.html' },
        actions: [
            { action: 'view', title: '👁 View Order' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    e.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click
self.addEventListener('notificationclick', function(e) {
    e.notification.close();

    if (e.action === 'dismiss') return;

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // If dashboard is already open, focus it
            for (const client of clientList) {
                if (client.url.includes('owner-dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open it
            if (clients.openWindow) {
                return clients.openWindow('/owner-dashboard.html');
            }
        })
    );
});
