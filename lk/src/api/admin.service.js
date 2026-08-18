import { adminApi } from './adminClient';

// Админские эндпоинты — /admin/support/tickets*, /admin/leads, /admin/users.
// Требуют токен из /auth/admin/login (см.
// adminAuth.service.js), не пользовательский токен — поэтому ходим через
// adminApi (adminClient.js), а не через обычный api (client.js).

// GET /admin/support/tickets — обращения всех пользователей.
//
// Бэк умеет фильтр по статусу и постраничную выдачу
// (?status_filter=&page=&page_size=), а мы раньше тянули всё одним
// запросом без параметров. На сотне обращений это лишний трафик и
// заметная задержка отрисовки.
//
// Ответ — TicketListResponse: { items, total, page, page_size }.
// Возвращаем его целиком, чтобы страница знала общее количество и
// могла нарисовать пагинацию.
export async function getAdminTickets({
  status = null,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  // status_filter принимает значения TicketStatus: new | in_progress | resolved.
  if (status && status !== 'all') params.set('status_filter', status);

  const data = await adminApi.get(`/admin/support/tickets?${params}`);

  return {
    items: Array.isArray(data) ? data : (data?.items ?? []),
    total: data?.total ?? (Array.isArray(data) ? data.length : 0),
    page: data?.page ?? page,
    pageSize: data?.page_size ?? pageSize,
  };
}

// GET /admin/support/tickets/{id} — обращение целиком + переписка.
export async function getAdminTicket(id) {
  return adminApi.get(`/admin/support/tickets/${id}`);
}

// POST /admin/support/tickets/{id}/messages — ответ от поддержки.
// Тело — multipart/form-data с полем 'body' (та же форма, что и на
// пользовательской стороне), не JSON.
export async function addAdminTicketMessage(id, text) {
  const body = new FormData();
  body.append('body', text);
  return adminApi.post(`/admin/support/tickets/${id}/messages`, body);
}

// PATCH /admin/support/tickets/{id}/status — сменить статус (new/in_progress/resolved).
export async function updateAdminTicketStatus(id, status) {
  return adminApi.patch(`/admin/support/tickets/${id}/status`, { status });
}

// ─── Ручная выдача подписки (админ) ─────────────────────────────────────────
// POST /subscription/admin/grant — единственный легальный способ выдать
// тариф без оплаты. Раньше это умел POST /subscription/activate, доступный
// любому пользователю; его удалили по security-ревью (критичный пункт №3).
//
// Тело: { user_id, plan_id, billing_period }. billing_period — 'month'
// или 'year'. Неизвестный пользователь или тариф → 404.
//
// Идёт через adminApi: требуется админский токен, пользовательский не подойдёт.
export async function grantSubscription({ userId, planId, billingPeriod }) {
  return adminApi.post('/subscription/admin/grant', {
    user_id: Number(userId),
    plan_id: Number(planId),
    billing_period: billingPeriod === 'month' ? 'month' : 'year',
  });
}

// ─── Заявки (лиды с главной страницы и с Конструктора) ──────────────────────
// Эндпоинтов POST /leads и GET /admin/leads на бэке пока нет — фронт (форма
// на главной + модалка на Конструкторе, main.js) уже шлёт заявки на POST
// /leads, эта функция читает список для админки. Как только бэкендер добавит
// оба эндпоинта — заработает без изменений на фронте.
export async function getAdminLeads() {
  const data = await adminApi.get('/admin/leads');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

// ─── Пользователи (ЛК) ───────────────────────────────────────────────────────
// GET /admin/users тоже пока нет на бэке — заведён по тому же принципу.
export async function getAdminUsers() {
  const data = await adminApi.get('/admin/users');
  return Array.isArray(data) ? data : (data?.items ?? []);
}
