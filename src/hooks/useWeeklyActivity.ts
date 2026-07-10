import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateString, daysAgo } from '../lib/dates';

export interface DayActivity {
  date: string;
  meals: number;
  workouts: number;
}

// Last 7 days of plan_completions, grouped by day — powers the activity
// consistency chart and the workouts-this-week input to the health score.
export function useWeeklyActivity(refreshKey?: unknown) {
  const { user } = useAuth();
  const [days, setDays] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDays([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const since = localDateString(daysAgo(6));
      const { data, error } = await supabase
        .from('plan_completions')
        .select('log_date, item_type')
        .eq('user_id', user.id)
        .gte('log_date', since);
      if (cancelled) return;
      const byDate = new Map<string, DayActivity>();
      for (let i = 6; i >= 0; i--) {
        const d = localDateString(daysAgo(i));
        byDate.set(d, { date: d, meals: 0, workouts: 0 });
      }
      if (!error) {
        (data || []).forEach((row) => {
          const entry = byDate.get(row.log_date);
          if (!entry) return;
          if (row.item_type === 'meal') entry.meals++;
          else entry.workouts++;
        });
      } else if (error.code !== '42P01') {
        console.error('Error fetching weekly activity:', error);
      }
      setDays(Array.from(byDate.values()));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  const workouts7d = days.reduce((sum, d) => sum + (d.workouts > 0 ? 1 : 0), 0);

  return { days, workouts7d, loading };
}
