import { api } from './client';

// Реальный путь по спеке — /subscription/status (было /subscription).
export async function getSubscription() {
  return api.get('/subscription/status');
}

// ─────────────────────────────────────────────────────────────────────
// УДАЛЕНО 16.08.2026 по итогам security-ревью (критичный пункт №3).
//
// Был POST /subscription/activate — он выдавал любому залогиненному
// пользователю любой платный тариф на год без оплаты. Эндпоинта больше
// нет, запрос вернёт 405.
//
// Единственный штатный путь активации: POST /api/payments/create →
// оплата в ЮKassa → вебхук на бэке включает подписку. Форсировать
// активацию с фронта нельзя и не нужно — см. SubscriptionSuccess.jsx,
// там опрос статуса.
//
// Ручная выдача осталась только у админов: POST /subscription/admin/grant
// с админским JWT.
// ─────────────────────────────────────────────────────────────────────

// POST /subscription/cancel — отключает автопродление, доступ по
// тарифу сохраняется до конца уже оплаченного периода.
export async function cancelAutoRenew() {
  return api.post('/subscription/cancel', {});
}

// GET /subscription/{plan_id} — актуальная информация о тарифе с бэка.
// В спеке response schema: {} — форма ответа не описана. Используется
// в useTariffPricing() для подтягивания реальной цены поверх статичных
// данных из tariffs.data.js.
export async function getPlanInfo(planId) {
  return api.get(`/subscription/${planId}`);
}