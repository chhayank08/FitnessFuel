import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateString, daysAgo } from '../lib/dates';

export interface Streak {
  current: number;
  // last 7 calendar days, oldest first; true = active day
  last7: boolean[];
  loading: boolean;
}

// A day counts as active when the user checked off any plan item or logged water.
export function useStreak(refreshKey?: unknown): Streak {
  const { user } = useAuth();
  const [state, setState] = useState<Streak>({ current: 0, last7: Array(7).fill(false), loading: true });

  useEffect(() => {
    if (!user) {
      setState({ current: 0, last7: Array(7).fill(false), loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const since = localDateString(daysAgo(60));
      const [completionsRes, waterRes] = await Promise.all([
        supabase.from('plan_completions').select('log_date').eq('user_id', user.id).gte('log_date', since),
        supabase.from('daily_logs').select('log_date, water_ml').eq('user_id', user.id).gte('log_date', since),
      ]);
      if (cancelled) return;

      const activeDates = new Set<string>();
      (completionsRes.data || []).forEach((r) => activeDates.add(r.log_date));
      (waterRes.data || []).forEach((r) => {
        if (r.water_ml > 0) activeDates.add(r.log_date);
      });

      // Consecutive active days ending today (or yesterday, so the streak
      // isn't shown as broken before the user logs anything today).
      let current = 0;
      const todayActive = activeDates.has(localDateString());
      for (let i = todayActive ? 0 : 1; i < 60; i++) {
        if (activeDates.has(localDateString(daysAgo(i)))) current++;
        else break;
      }

      const last7 = Array.from({ length: 7 }, (_, i) => activeDates.has(localDateString(daysAgo(6 - i))));
      setState({ current, last7, loading: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  return state;
}
