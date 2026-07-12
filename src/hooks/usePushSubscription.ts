import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPushSupport, getExistingSubscription, subscribeToPush, unsubscribeFromPush, PushSupport } from '../lib/pushSubscription';

export function usePushSubscription() {
  const { user } = useAuth();
  const [support, setSupport] = useState<PushSupport>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = getPushSupport();
    setSupport(s);
    if (s !== 'supported') {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }
    const sub = await getExistingSubscription();
    setIsSubscribed(sub != null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!user) return false;
    const ok = await subscribeToPush(user.id);
    if (ok) setIsSubscribed(true);
    return ok;
  }, [user]);

  const unsubscribe = useCallback(async () => {
    const ok = await unsubscribeFromPush();
    if (ok) setIsSubscribed(false);
    return ok;
  }, []);

  return { support, isSubscribed, loading, subscribe, unsubscribe };
}
