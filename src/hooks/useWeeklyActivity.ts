import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateString, daysAgo } from '../lib/dates';

export interface DayActivity {
  date: string;
  meals: number;
  workouts: number;
}

// Last 7 days of plan_completions + workout_sessions, grouped by day — powers
// the activity consistency chart and the workouts-this-week input to the
// health score.
//
// Dedupe contract with workout_sessions.source: sessions with source='plan'
// are ALSO mirrored into plan_completions by the player, so only non-plan
// sessions add to the workout count here.
export function useWeeklyActivity(refreshKey?: unknown) {
  const { user } = useAuth();
  const [days, setDays] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionBump, setSessionBump] = useState(0);

  // Refetch whenever any workout session is saved anywhere in the app.
  useEffect(() => {
    const onSaved = () => setSessionBump((n) => n + 1);
    window.addEventListener('ff-workout-saved', onSaved);
    return () => window.removeEventListener('ff-workout-saved', onSaved);
  }, []);

  useEffect(() => {
    if (!user) {
      setDays([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const since = localDateString(daysAgo(6));
      const [completionsRes, sessionsRes] = await Promise.all([
        supabase.from('plan_completions').select('log_date, item_type').eq('user_id', user.id).gte('log_date', since),
        supabase.from('workout_sessions').select('log_date, source').eq('user_id', user.id).gte('log_date', since),
      ]);
      if (cancelled) return;
      const byDate = new Map<string, DayActivity>();
      for (let i = 6; i >= 0; i--) {
        const d = localDateString(daysAgo(i));
        byDate.set(d, { date: d, meals: 0, workouts: 0 });
      }
      if (!completionsRes.error) {
        (completionsRes.data || []).forEach((row) => {
          const entry = byDate.get(row.log_date);
          if (!entry) return;
          if (row.item_type === 'meal') entry.meals++;
          else entry.workouts++;
        });
      } else if (completionsRes.error.code !== '42P01') {
        console.error('Error fetching weekly activity:', completionsRes.error);
      }
      if (!sessionsRes.error) {
        (sessionsRes.data || []).forEach((row) => {
          if (!row.log_date || row.source === 'plan') return;
          const entry = byDate.get(row.log_date);
          if (entry) entry.workouts++;
        });
      } else if (sessionsRes.error.code !== '42P01' && sessionsRes.error.code !== '42703') {
        console.error('Error fetching workout sessions for weekly activity:', sessionsRes.error);
      }
      setDays(Array.from(byDate.values()));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey, sessionBump]);

  const workouts7d = days.reduce((sum, d) => sum + (d.workouts > 0 ? 1 : 0), 0);

  return { days, workouts7d, loading };
}
