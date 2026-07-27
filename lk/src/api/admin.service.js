import { api } from './client';

// Админские эндпоинты поддержки — /admin/support/tickets*.
// Доступ проверяет бэк по роли пользователя в токене: если залогинен
// не админ, эти запросы вернут 403 (см. обработку в AdminSupport.jsx).
// Тело сообщений — поле 'body' (как и в пользовательском support.service.js,
// подтверждено реальным 422 с сервера при создании тикета).

// GET /admin/support/tickets — все обращения всех пользователей.
export async function getAdminTickets() {
  const data = await api.get('/admin/support/tickets');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

// GET /admin/support/tickets/{id} — обращение целиком + переписка.
export async function getAdminTicket(id) {
  return api.get(`/admin/support/tickets/${id}`);
}

// POST /admin/support/tickets/{id}/messages — ответ от поддержки.
// Тело — multipart/form-data с полем 'body' (та же форма, что и на
// пользовательской стороне), не JSON.
export async function addAdminTicketMessage(id, text) {
  const body = new FormData();
  body.append('body', text);
  return api.post(`/admin/support/tickets/${id}/messages`, body);
}

// PATCH /admin/support/tickets/{id}/status — сменить статус (new/in_progress/resolved).
export async function updateAdminTicketStatus(id, status) {
  return api.patch(`/admin/support/tickets/${id}/status`, { status });
}

// ─── Заявки (лиды с главной страницы и с Конструктора) ──────────────────────
// Эндпоинтов POST /leads и GET /admin/leads на бэке пока нет — фронт (форма
// на главной + модалка на Конструкторе, main.js) уже шлёт заявки на POST
// /leads, эта функция читает список для админки. Как только бэкендер добавит
// оба эндпоинта — заработает без изменений на фронте.
export async function getAdminLeads() {
  const data = await api.get('/admin/leads');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

// ─── Пользователи (ЛК) ───────────────────────────────────────────────────────
// GET /admin/users тоже пока нет на бэке — заведён по тому же принципу.
export async function getAdminUsers() {
  const data = await api.get('/admin/users');
  return Array.isArray(data) ? data : (data?.items ?? []);
}
