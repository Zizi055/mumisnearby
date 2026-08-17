import { api } from './client';

// GET /api/payments/history — реальный эндпоинт (появился в свежей спеке).
// Форма ответа в спеке не расписана (schema: {}), поэтому маппим поля
// защитно, по нескольким вероятным именам — поправим, когда увидим
// настоящий ответ от бэка.
//
// Статусы приходят, скорее всего, сырыми терминами ЮKassa
// (succeeded/pending/waiting_for_capture/canceled) — приводим их к трём
// состояниям, которые уже понимает интерфейс (paid/pending/failed).
function normalizeStatus(raw) {
  if (['paid', 'succeeded', 'success'].includes(raw)) return 'paid';
  if (['failed', 'canceled', 'cancelled', 'error'].includes(raw)) return 'failed';
  if (['pending', 'waiting_for_capture'].includes(raw)) return 'pending';
  return raw ?? 'unknown';
}

function normalizePayment(p) {
  return {
    id:         p.id,
    title:      p.plan_name ?? p.plan?.name ?? 'Подписка',
    type:       p.type ?? 'Подписка',
    date:       p.created_at ?? p.date ?? null,
    amount:     Number(p.amount ?? 0),
    status:     normalizeStatus(p.status),
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
//
// С 16.08.2026 бэк принимает только 'month' и 'year'. Значение 'free'
// отклоняется с 400: бесплатный период выдаётся исключительно пробной
// подпиской, а не через оплату (критичный пункт №4 security-ревью).
// Страхуемся здесь, чтобы не улететь в 400 из-за случайного значения
// из URL или состояния переключателя.
export async function createPayment({ planId, billingPeriod }) {
  const period = billingPeriod === 'month' ? 'month' : 'year';

  if (billingPeriod && billingPeriod !== period) {
    console.warn(
      `Недопустимый billing_period "${billingPeriod}" — отправляем "${period}"`
    );
  }

  return api.post('/api/payments/create', {
    plan_id: planId,
    billing_period: period,
  });
}
