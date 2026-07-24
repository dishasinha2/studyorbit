importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const notificationTitle = payload.notification?.title || payload.data?.title || "StudyOrbit Alert";
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || "You have a new career reminder in StudyOrbit.",
        icon: "/globe.svg",
        badge: "/window.svg",
        data: payload.data || {},
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    } catch (e) {
      console.warn("[FCM Service Worker] Push payload parse error:", e);
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/notifications");
      }
    })
  );
});
