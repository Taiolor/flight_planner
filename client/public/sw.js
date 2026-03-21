const CACHE_NAME = 'smartfly-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// =====================
// Ciclo de vida do SW
// =====================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não cachear chamadas de API
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first para navegação, cache-first para assets estáticos
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/').then((cached) => cached || fetch(event.request))
      )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});

// =====================
// Push Notifications
// =====================

self.addEventListener('push', (event) => {
  // Valores padrão caso o payload esteja ausente ou malformado
  let payload = {
    title: '✈️ Smart Fly',
    body: 'Você tem um voo em breve!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'flight-reminder',
    data: {}
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        icon: parsed.icon || payload.icon,
        badge: parsed.badge || payload.badge,
        tag: parsed.tag || payload.tag,
        data: parsed.data || payload.data,
      };
    } catch (e) {
      // Payload em texto simples
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    data: {
      ...payload.data,
      url: '/',
      timestamp: Date.now(),
    },
    // Manter a notificação visível até o usuário interagir
    requireInteraction: true,
    // Vibração: 200ms on, 100ms off, 200ms on
    vibrate: [200, 100, 200, 100, 200],
    // Ações rápidas
    actions: [
      {
        action: 'open',
        title: '✈️ Ver voo',
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
      }
    ],
    // Som padrão do sistema
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Ignorar ação de dispensar
  if (event.action === 'dismiss') {
    return;
  }

  // Determinar a URL de destino (pode vir no payload)
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Verificar se já existe uma aba com a URL do app aberta
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          // Focar a aba existente e navegar para a URL correta
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      // Nenhuma aba aberta — abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Tratar erros de notificação (ex: permissão revogada durante exibição)
self.addEventListener('notificationclose', (event) => {
  // Opcional: registrar métricas de dismissal
  console.log('[SW] Notificação fechada:', event.notification.tag);
});
