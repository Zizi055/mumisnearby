import { useState, useEffect } from 'react';
import { getSubscription } from '../api/subscription.service';

// Реальная форма ответа GET /subscription/status (подтверждено по
// Network от клиента):
// {
//   plan: { id, name, access_lvl },
//   billing_period, status, auto_renew, expires_at,
//   limits: { fairy_tales: { limit, used }, lullabies: {...}, therapic: {...}, ... }
// }
// plan_id раньше искали плоским полем верхнего уровня — там его нет,
// он вложен в plan.id, поэтому «текущий тариф» нигде не подхватывался.
function normalizeSubscription(res) {
  if (!res) {
    return {
      planId: null,
      planAccessLvl: null,
      autoRenew: null,
      expiresAt: null,
      status: null,
      limits: {},
      payments: [],
    };
  }

  return {
    ...res,
    planId: res.plan?.id ?? res.plan_id ?? res.planId ?? null,
    planAccessLvl: res.plan?.access_lvl ?? null,
    autoRenew: res.auto_renew ?? null,
    expiresAt: res.expires_at ?? null,
    status: res.status ?? null,
    limits: res.limits ?? {},
    // payments сюда не приходят — это /api/payments/history отдельным
    // запросом (payments.service.js), оставляем как есть на случай, если
    // бэк когда-нибудь начнёт класть их и сюда.
    payments: res.payments ?? [],
  };
}

export function useSubscription() {
  const [data, setData] = useState({
    planId: null,
    planAccessLvl: null,
    autoRenew: null,
    expiresAt: null,
    status: null,
    limits: {},
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    getSubscription()
      .then((res) => { if (mounted) setData(normalizeSubscription(res)); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  return { ...data, loading, error };
}