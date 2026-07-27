import { api } from './client';

// GET /api/payments/history — реальный эндпоинт (появился в свежей спеке).
// Форма ответа в спеке не расписана (schema: {}), поэтому маппим поля
// защитно, по нескольким вероятным именам — поправим, когда увидим
// настоящий ответ от бэка.
function normalizePayment(p) {
  return {
    id:         p.id,
    title:      p.plan_name ?? p.plan?.name ?? 'Подписка',
    type:       p.type ?? 'Подписка',
    date:       p.created_at ?? p.date ?? null,
    amount:     Number(p.amount ?? 0),
    status:     p.status ?? 'unknown', // ожидаем paid | pending | failed
    method:     p.payment_method ?? p.method ?? null,
    receiptUrl: p.receipt_url ?? null,
  };
}

export async function getPayments() {
  const data = await api.get('/api/payments/history');
  const list = Array.isArray(data) ? data : (data?.items ?? []);
  return list.map(normalizePayment);
}

// POST /api/payments/create — запускает оплату через YooKassa, возвращает
// confirmation_url, куда нужно перенаправить пользователя для оплаты.
export async function createPayment({ planId, billingPeriod }) {
  return api.post('/api/payments/create', {
    plan_id: planId,
    billing_period: billingPeriod,
  });
}
