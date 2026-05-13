import { useState, useEffect } from 'react';
import { getSubscription } from '../api/subscription.service';

export function useSubscription() {
  const [data, setData] = useState({ planId: null, payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    getSubscription()
      .then((res) => { if (mounted) setData(res); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  return { ...data, loading, error };
}