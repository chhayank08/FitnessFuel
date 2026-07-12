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

// A day counts as active when the user checked off any plan item, logged
// water, or recorded ANY workout session (quick, coach, or plan-driven).
export function useStreak(refreshKey?: unknown): Streak {
  const { user } = useAuth();
  const [state, setState] = useState<Streak>({ current: 0, last7: Array(7).fill(false), loading: true });
  const [sessionBump, setSessionBump] = useState(0);

  // Refetch whenever any workout session is saved anywhere in the app.
  useEffect(() => {
    const onSaved = () => setSessionBump((n) => n + 1);
    window.addEventListener('ff-workout-saved', onSaved);
    return () => window.removeEventListener('ff-workout-saved', onSaved);
  }, []);

  useEffect(() => {
    if (!user) {
      setState({ current: 0, last7: Array(7).fill(false), loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const since = localDateString(daysAgo(60));
      const [completionsRes, waterRes, sessionsRes] = await Promise.all([
        supabase.from('plan_completions').select('log_date').eq('user_id', user.id).gte('log_date', since),
        supabase.from('daily_logs').select('log_date, water_ml').eq('user_id', user.id).gte('log_date', since),
        supabase.from('workout_sessions').select('log_date').eq('user_id', user.id).gte('log_date', since),
      ]);
      if (cancelled) return;

      const activeDates = new Set<string>();
      (completionsRes.data || []).forEach((r) => activeDates.add(r.log_date));
      (waterRes.data || []).forEach((r) => {
        if (r.water_ml > 0) activeDates.add(r.log_date);
      });
      // Tolerate a not-yet-applied migration (missing table/column).
      if (!sessionsRes.error) {
        (sessionsRes.data || []).forEach((r) => {
          if (r.log_date) activeDates.add(r.log_date);
        });
      } else if (sessionsRes.error.code !== '42P01' && sessionsRes.error.code !== '42703') {
        console.error('Error fetching workout sessions for streak:', sessionsRes.error);
      }

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
  }, [user, refreshKey, sessionBump]);

  return state;
}
