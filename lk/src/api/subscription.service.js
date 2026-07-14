import { api } from './client';

// Реальный путь по спеке — /subscription/status (было /subscription).
export async function getSubscription() {
  return api.get('/subscription/status');
}

// Реальный путь по спеке — POST /subscription/activate (было /subscription/checkout).
// Тело по спеке: { plan_id, billing_period, payment_token, external_payment_id }.
// payment_token/external_payment_id должны приходить от платёжного провайдера —
// этой интеграции на фронте пока нет (сознательно не делаем сейчас, вне
// текущего скоупа). Отправляем то, что реально можем заполнить с фронта —
// сам вызов оплаты не заработает до подключения платёжного шлюза, но путь
// и известные поля теперь верные.
export async function createSubscriptionCheckout({ planId, billingPeriod }) {
  return api.post('/subscription/activate', {
    plan_id: planId,
    billing_period: billingPeriod,
  });
}