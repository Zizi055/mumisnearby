import { useEffect, useState } from 'react';
import { getSubscription } from '../store/subscription.store';

export function useSubscription() {
  const [subscription, setSubscription] = useState(getSubscription());

  useEffect(() => {
    const update = () => {
      setSubscription(getSubscription());
    };

    window.addEventListener('subscription:updated', update);

    return () => {
      window.removeEventListener('subscription:updated', update);
    };
  }, []);

  return subscription;
}