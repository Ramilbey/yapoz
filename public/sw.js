// Shows order alerts when Yapoz is closed. The device plays its own notification sound: websites can't choose one here.
self.addEventListener("push", (e) => {
  const a = e.data ? e.data.json() : {};
  // Always show one: browsers cut off sites that receive a push and show nothing.
  e.waitUntil(self.registration.showNotification(a.title || "Yapoz", { body: a.body, tag: a.tag, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: a.url || "/app" } }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/app";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      const open = tabs.find((c) => new URL(c.url).pathname.startsWith("/app"));
      return open ? open.focus().then(() => open.navigate(url)) : self.clients.openWindow(url);
    }),
  );
});
