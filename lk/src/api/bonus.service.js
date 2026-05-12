import { api } from './client';

// Переключатель: mock / real
const USE_MOCK = true;

// мок-данные
const mock = {
  referralCode: 'halisa',
  invitedCount: 2,
  maxInvites: 5,
  reward: '1 месяц бесплатно',
  yearlyDiscount: 20,
  weeklyContent: true,
};

// 
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getBonus() {
  if (USE_MOCK) {
    await delay(300);
    return mock;
  }

  //endpoint
  return api.get('/api/subscription/bonus');
}

export async function claimReferralReward() {
  if (USE_MOCK) {
    await delay(200);
    return { success: true };
  }

  return api.post('/api/subscription/bonus/claim');
}