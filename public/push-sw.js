/* Service Worker Push & Lock Screen Notification Handler (Imported by Workbox SW) */

self.addEventListener('push', function (event) {
  let payload = {
    title: 'វត្តស្នាយដួច',
    body: 'មានកម្មវិធីបុណ្យ ឬថ្ងៃសីលជិតមកដល់',
    url: '/?open=calendar',
    tag: 'wsd-calendar-reminder',
    icon: '/pwa-192x192.png',
    badge: '/icon-192.png',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = Object.assign(payload, parsed);
    }
  } catch (e) {
    try {
      const text = event.data && event.data.text();
      if (text) payload.body = text;
    } catch (_) {}
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'wsd-calendar-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/?open=calendar',
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/?open=calendar';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          client.postMessage({ type: 'OPEN_CALENDAR', url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
