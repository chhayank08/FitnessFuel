import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../context/AuthContext';

export type ProgressLog = Database['public']['Tables']['progress_logs']['Row'];

export function useWeightHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching progress logs:', error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const logWeight = useCallback(
    async (weight: number, notes?: string) => {
      if (!user) return;
      const optimistic: ProgressLog = {
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        user_id: user.id,
        weight,
        notes: notes || null,
        mood: null,
      };
      setLogs((prev) => [...prev, optimistic]);
      const { error } = await supabase.from('progress_logs').insert({ user_id: user.id, weight, notes: notes || null });
      if (error) {
        setLogs((prev) => prev.filter((l) => l.id !== optimistic.id));
        toast.error('Could not save your weigh-in. Try again.');
        console.error('Error logging weight:', error);
        return;
      }
      toast.success('Weight logged');
      refresh();
    },
    [user, refresh]
  );

  return { logs, loading, logWeight, refresh };
}
