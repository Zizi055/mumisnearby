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
export async function addAdminTicketMessage(id, text) {
  return api.post(`/admin/support/tickets/${id}/messages`, { body: text });
}

// PATCH /admin/support/tickets/{id}/status — сменить статус (new/in_progress/resolved).
export async function updateAdminTicketStatus(id, status) {
  return api.patch(`/admin/support/tickets/${id}/status`, { status });
}
