import { useState, useEffect } from 'react';
import { getSubscription } from '../api/subscription.service';

// Точная форма ответа GET /subscription/status ещё не подтверждена на
// практике — подстраховываемся под оба варианта именования (snake_case
// с бэка и camelCase, если вдруг сериализуется иначе).
function normalizeSubscription(res) {
  if (!res) return { planId: null, payments: [] };

  return {
    ...res,
    planId: res.plan_id ?? res.planId ?? null,
    payments: res.payments ?? [],
  };
}

export function useSubscription() {
  const [data, setData] = useState({ planId: null, payments: [] });
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