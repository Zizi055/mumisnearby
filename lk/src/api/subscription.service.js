const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function createSubscriptionCheckout(payload) {
  await delay(1100);

  const shouldFail = false;

  if (shouldFail) {
    throw new Error('Не удалось обработать оплату. Попробуйте ещё раз.');
  }

  return {
    status: 'success',
    paymentId: `pay_${Date.now()}`,
    subscriptionId: `sub_${Date.now()}`,
    planId: payload.planId,
    period: payload.period,
    changeType: payload.changeType,
    amount: payload.amount,
    nextChargeDate:
      payload.period === 'year'
        ? '12 февраля 2027'
        : '12 марта 2026',
  };
}