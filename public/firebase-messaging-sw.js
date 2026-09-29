// public/firebase-messaging-sw.js
// Service Worker untuk mendengarkan sinyal notifikasi latar belakang (Background Web Push)

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const payload = event.data.json();
        const signal = payload.data || payload;

        // Tampilkan Native Desktop Notification jika tab sedang diminimize
        const title = signal.status === 'PAID' ? '💰 Pembayaran QRIS Lunas!' : '🔔 Pesanan Online Baru Masuk!';
        const options = {
            body: `ID Transaksi: #${signal.transaction_id || '-'} (Klik untuk buka kasir)`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: signal,
            tag: `order-${signal.transaction_id}`,
            renotify: true,
        };

        event.waitUntil(
            self.registration.showNotification(title, options).then(() => {
                // Teruskan sinyal ke semua tab React yang terbuka
                return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
                    clients.forEach((client) => {
                        client.postMessage({
                            type: 'FIREBASE_ORDER_SIGNAL',
                            signal: signal,
                        });
                    });
                });
            })
        );
    } catch (err) {
        console.error('[SW] Error parsing push data:', err);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/owner/transactions') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('/owner/transactions');
            }
        })
    );
});
