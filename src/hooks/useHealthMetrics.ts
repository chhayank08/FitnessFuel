import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateString, daysAgo } from '../lib/dates';

export interface MetricPoint {
  date: string;
  value: number;
}

export type MetricSeries = Record<string, MetricPoint[]>;

export function useHealthMetrics(days = 90) {
  const { user } = useAuth();
  const [series, setSeries] = useState<MetricSeries>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSeries({});
      setLoading(false);
      return;
    }
    const since = localDateString(daysAgo(days));
    const { data, error } = await supabase
      .from('health_metrics')
      .select('log_date, metric_type, value')
      .eq('user_id', user.id)
      .gte('log_date', since)
      .order('log_date', { ascending: true });
    if (error) {
      if (error.code !== '42P01') console.error('Error fetching health metrics:', error);
      setSeries({});
    } else {
      const grouped: MetricSeries = {};
      (data || []).forEach((row) => {
        (grouped[row.metric_type] ||= []).push({ date: row.log_date, value: Number(row.value) });
      });
      setSeries(grouped);
    }
    setLoading(false);
  }, [user, days]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const helpers = useMemo(() => {
    const get = (type: string): MetricPoint[] => series[type] || [];
    const latest = (type: string): number | null => {
      const s = get(type);
      return s.length ? s[s.length - 1].value : null;
    };
    const avgLast = (type: string, n: number): number | null => {
      const s = get(type).slice(-n);
      if (!s.length) return null;
      return s.reduce((sum, p) => sum + p.value, 0) / s.length;
    };
    const sparkValues = (type: string, n = 14): number[] => get(type).slice(-n).map((p) => p.value);
    return { get, latest, avgLast, sparkValues };
  }, [series]);

  const hasData = Object.keys(series).length > 0;

  return { series, hasData, loading, refresh, ...helpers };
}
