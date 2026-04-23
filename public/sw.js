self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "星ヶ丘こどもクラブ";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "default",
    data: {
      url: data.url || "/",
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const urlToOpen = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Find an existing PWA (standalone) window first
        for (const client of windowClients) {
          if (new URL(client.url).origin === self.location.origin) {
            return client.focus().then((c) => {
              if (c.url !== urlToOpen) c.navigate(urlToOpen);
              return c;
            });
          }
        }
        // No existing window — open new (will launch PWA if installed)
        return clients.openWindow(urlToOpen);
      }),
  );
});
