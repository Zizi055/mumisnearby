import { api } from './client';

export async function getSubscription() {
  return api.get('/subscription');
}

export async function createSubscriptionCheckout(payload) {
  return api.post('/subscription/checkout', payload);
}