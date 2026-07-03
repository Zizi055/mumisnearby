import { api } from './client';

// GET /api/subscription/bonus
// BonusStatusResponse: { referral_code, invited_count, max_invites, weekly_content }
export async function getBonus() {
  const data = await api.get('/api/subscription/bonus');
  return {
    referralCode:  data.referral_code,
    invitedCount:  data.invited_count  ?? 0,
    maxInvites:    data.max_invites    ?? 10,
    weeklyContent: data.weekly_content ?? true,
  };
}

// POST /api/subscription/bonus/claim
// ClaimBonusResponse: { success, message, weekly_content, invited_count }
export async function claimBonus() {
  const data = await api.post('/api/subscription/bonus/claim', {});
  if (!data.success) throw new Error(data.message || 'Не удалось получить бонус');
  return data;
}

// GET /referral/link
// ReferralLinkResponse: { link, referral_code }
export async function getReferralLink() {
  return api.get('/referral/link');
}

// GET /referral/stats
// ReferralStatsResponse: { invited_count, referred_users: [{ username, created_at }] }
export async function getReferralStats() {
  return api.get('/referral/stats');
}
