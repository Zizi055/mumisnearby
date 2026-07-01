import { api } from './client';

// Получить статус бонусов и реферальную программу
// GET /api/subscription/bonus
// Возвращает: { referral_code, invited_count, max_invites, weekly_content }
export async function getBonus() {
  const data = await api.get('/api/subscription/bonus');

  //Форматируем данные для компонента SubscriptionBonus.jsx
  return {
    referralCode:   data.referral_code,
    invitedCount:   data.invited_count,
    maxInvites:     data.max_invites,
    reward:         `${data.balance_discount || 10}% скидки на подписку`,
    yearlyDiscount: 20,                  // бэкенд не возвращает — подставляем
    weeklyContent:  data.weekly_content,
  };
}

// Получить бонус, когда достигнут лимит приглашений
// POST /api/subscription/bonus/claim
export async function claimBonus() {
  return api.post('/api/subscription/bonus/claim', {});
}

// Применить реферальный код при регистрации
// POST /api/referral/apply
export async function applyReferral(referral_code) {
  return api.post('/api/referral/apply', { referral_code });
}

// Получить скидку на балансе пользователя
// GET /api/referral/discount
export async function getReferralDiscount() {
  return api.get('/api/referral/discount');
}
