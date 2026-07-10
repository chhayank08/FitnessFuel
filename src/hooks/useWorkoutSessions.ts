import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../context/AuthContext';

export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type WorkoutSessionInsert = Omit<Database['public']['Tables']['workout_sessions']['Insert'], 'user_id'>;

export function useWorkoutSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50);
    if (error) {
      if (error.code !== '42P01') console.error('Error fetching workout sessions:', error);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const saveSession = useCallback(
    async (session: WorkoutSessionInsert): Promise<boolean> => {
      if (!user) return false;
      const { error } = await supabase.from('workout_sessions').insert({ ...session, user_id: user.id });
      if (error) {
        console.error('Error saving workout session:', error);
        return false;
      }
      await refresh();
      return true;
    },
    [user, refresh]
  );

  return { sessions, loading, saveSession, refresh };
}
