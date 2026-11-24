import { api } from './client';

// Активация промокода уже зарегистрированным пользователем.
// POST /promo-codes/activate — код в теле. Тот же вызов есть и как
// POST /promo-codes/{code}/activate, телом удобнее: код не надо
// кодировать в адрес.
//
// В ответ PromoActivated: id, code, subscription_id и conditions
// (тариф и дата, до которой он действует).
export async function activatePromoCode(code) {
  return api.post('/promo-codes/activate', { code: code.trim() });
}
