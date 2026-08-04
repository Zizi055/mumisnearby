import { api } from './client';

// ─────────────────────────────────────────────────────────────────────
// Уведомления. Модуль появился на бэке позже фронта — до этого колокольчик
// в шапке показывал жёстко вписанный список из двух записей (MOCK_NOTIFICATIONS
// в Header.jsx), одинаковый у всех пользователей.
//
// Типы (NotificationType): generation_ready | generation_failed
//                          | ticket_reply | system
// ─────────────────────────────────────────────────────────────────────

// GET /notifications -> { items: NotificationOut[], total, unread_count }
export async function getNotifications({ page = 1, pageSize = 20 } = {}) {
  return api.get(`/notifications?page=${page}&page_size=${pageSize}`);
}

// PATCH /notifications/{id}/read -> 204
export async function markNotificationRead(id) {
  return api.patch(`/notifications/${id}/read`);
}

// PATCH /notifications/read-all -> 204
export async function markAllNotificationsRead() {
  return api.patch('/notifications/read-all');
}

// GET /notifications/stream — Server-Sent Events: бэк сам присылает событие,
// когда появляется новое уведомление (озвучка готова, ответ в поддержке).
//
// Штатный EventSource не умеет ставить заголовок Authorization, а токен у нас
// в localStorage, не в куке. Поэтому читаем поток через fetch + ReadableStream
// и разбираем формат SSE руками: события разделены пустой строкой, полезная
// нагрузка — в строках `data: ...`.
//
// Возвращает функцию отписки. Вызывающий код обязан держать fallback на
// обычный опрос: соединение может не дойти через прокси или отвалиться.
export function subscribeToNotifications(onEvent) {
  const token = localStorage.getItem('token');
  if (!token || typeof AbortController === 'undefined') return () => {};

  const controller = new AbortController();
  let closed = false;

  (async () => {
    try {
      const res = await fetch('/notifications/stream', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Событие закончилось, когда встретили пустую строку.
        let sep = buffer.indexOf('\n\n');
        while (sep !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);

          const payload = raw
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('\n');

          // heartbeat (строки, начинающиеся с ':') сюда не попадают —
          // у них нет поля data.
          if (payload) {
            let parsed = payload;
            try {
              parsed = JSON.parse(payload);
            } catch {
              // не JSON — отдаём как есть, вызывающий всё равно
              // просто перечитывает список
            }
            onEvent(parsed);
          }

          sep = buffer.indexOf('\n\n');
        }
      }
    } catch {
      // Разрыв соединения или abort при размонтировании — молча выходим,
      // подстраховкой служит периодический опрос в вызывающем коде.
    }
  })();

  return () => {
    closed = true;
    controller.abort();
  };
}
