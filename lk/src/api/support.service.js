import { api } from './client';

// Значения по бэковым enum'ам (TicketType / TicketStatus из спеки).
// 'closed' и 'technical' на бэке не существуют — не используем их нигде.
export const TICKET_TYPES = ['voice_model', 'generation', 'billing', 'other'];
export const TICKET_STATUSES = ['new', 'in_progress', 'resolved'];

// POST /support/tickets — multipart/form-data, вложение опционально.
// Пользователь определяется бэком по Bearer-токену — отдельно user_id/
// user_email передавать не нужно (раньше слались зря и без авторизации).
// Поле текста обращения на бэке называется 'body', а не 'message'
// (см. реальный 422 с сервера: "loc":["body","body"], "msg":"Field required").
export async function createTicket({ type, subject, message, file }) {
  const body = new FormData();
  body.append('type', type);
  body.append('subject', subject);
  body.append('body', message);
  if (file) body.append('attachment', file);

  return api.post('/support/tickets', body);
}

// GET /support/tickets — список обращений текущего пользователя.
export async function getTickets() {
  const data = await api.get('/support/tickets');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

// GET /support/tickets/{id} — детали обращения вместе с перепиской.
export async function getTicket(id) {
  return api.get(`/support/tickets/${id}`);
}

// POST /support/tickets/{id}/messages — ответ пользователя в тикете.
// Тело — multipart/form-data с полем 'body' (см. Body_add_message_
// support_tickets__ticket_id__messages_post в спеке), не JSON.
export async function addTicketMessage(id, message) {
  const body = new FormData();
  body.append('body', message);
  return api.post(`/support/tickets/${id}/messages`, body);
}
