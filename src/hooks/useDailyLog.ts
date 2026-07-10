import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateString } from '../lib/dates';

export type DailyLogRow = Database['public']['Tables']['daily_logs']['Row'];
export type PlanCompletion = Database['public']['Tables']['plan_completions']['Row'];

export interface CompletionInput {
  itemType: 'meal' | 'workout';
  itemKey: string;
  itemName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Consumed {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// 42P01 = relation does not exist: the tracking migration hasn't been applied yet.
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === '42P01';
}

let warnedMissingTables = false;
function warnMissingTables() {
  if (warnedMissingTables) return;
  warnedMissingTables = true;
  toast.error('Daily tracking is not set up yet — apply the latest database migration.');
}

export function useDailyLog() {
  const { user } = useAuth();
  const today = localDateString();
  const [dailyRow, setDailyRow] = useState<DailyLogRow | null>(null);
  const [completions, setCompletions] = useState<PlanCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setDailyRow(null);
      setCompletions([]);
      setLoading(false);
      return;
    }
    const [dailyRes, completionsRes] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle(),
      supabase.from('plan_completions').select('*').eq('user_id', user.id).eq('log_date', today),
    ]);
    if (dailyRes.error) {
      if (isMissingTable(dailyRes.error)) warnMissingTables();
      else console.error('Error fetching daily log:', dailyRes.error);
    } else {
      setDailyRow(dailyRes.data);
    }
    if (completionsRes.error) {
      if (isMissingTable(completionsRes.error)) warnMissingTables();
      else console.error('Error fetching completions:', completionsRes.error);
    } else {
      setCompletions(completionsRes.data || []);
    }
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const waterMl = dailyRow?.water_ml ?? 0;

  const consumed: Consumed = useMemo(() => {
    const fromMeals = completions
      .filter((c) => c.item_type === 'meal')
      .reduce(
        (acc, c) => ({
          calories: acc.calories + (c.calories || 0),
          protein: acc.protein + (c.protein || 0),
          carbs: acc.carbs + (c.carbs || 0),
          fat: acc.fat + (c.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    return {
      calories: fromMeals.calories + (dailyRow?.extra_calories ?? 0),
      protein: fromMeals.protein + (dailyRow?.extra_protein ?? 0),
      carbs: fromMeals.carbs + (dailyRow?.extra_carbs ?? 0),
      fat: fromMeals.fat + (dailyRow?.extra_fat ?? 0),
    };
  }, [completions, dailyRow]);

  const addWater = useCallback(
    async (ml: number) => {
      if (!user) return;
      const previous = dailyRow;
      const nextWater = (previous?.water_ml ?? 0) + ml;
      setDailyRow((prev) =>
        prev
          ? { ...prev, water_ml: nextWater }
          : {
              id: 'optimistic',
              user_id: user.id,
              log_date: today,
              water_ml: nextWater,
              extra_calories: 0,
              extra_protein: 0,
              extra_carbs: 0,
              extra_fat: 0,
              updated_at: new Date().toISOString(),
            }
      );
      const { error } = await supabase
        .from('daily_logs')
        .upsert(
          { user_id: user.id, log_date: today, water_ml: nextWater, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,log_date' }
        );
      if (error) {
        setDailyRow(previous);
        if (isMissingTable(error)) warnMissingTables();
        else toast.error('Could not log water. Try again.');
        console.error('Error adding water:', error);
        return;
      }
      refresh();
    },
    [user, dailyRow, today, refresh]
  );

  const isCompleted = useCallback(
    (itemType: 'meal' | 'workout', itemKey: string) =>
      completions.some((c) => c.item_type === itemType && c.item_key === itemKey),
    [completions]
  );

  const toggleCompletion = useCallback(
    async (item: CompletionInput) => {
      if (!user) return;
      const existing = completions.find((c) => c.item_type === item.itemType && c.item_key === item.itemKey);
      if (existing) {
        setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
        const { error } = await supabase.from('plan_completions').delete().eq('id', existing.id);
        if (error) {
          setCompletions((prev) => [...prev, existing]);
          toast.error('Could not update. Try again.');
          console.error('Error removing completion:', error);
        }
        return;
      }
      const optimistic: PlanCompletion = {
        id: `optimistic-${Date.now()}`,
        user_id: user.id,
        log_date: today,
        item_type: item.itemType,
        item_key: item.itemKey,
        item_name: item.itemName,
        calories: item.calories ?? 0,
        protein: item.protein ?? 0,
        carbs: item.carbs ?? 0,
        fat: item.fat ?? 0,
        completed_at: new Date().toISOString(),
      };
      setCompletions((prev) => [...prev, optimistic]);
      const { error } = await supabase.from('plan_completions').upsert(
        {
          user_id: user.id,
          log_date: today,
          item_type: item.itemType,
          item_key: item.itemKey,
          item_name: item.itemName,
          calories: item.calories ?? 0,
          protein: item.protein ?? 0,
          carbs: item.carbs ?? 0,
          fat: item.fat ?? 0,
        },
        { onConflict: 'user_id,log_date,item_type,item_key' }
      );
      if (error) {
        setCompletions((prev) => prev.filter((c) => c.id !== optimistic.id));
        if (isMissingTable(error)) warnMissingTables();
        else toast.error('Could not update. Try again.');
        console.error('Error adding completion:', error);
        return;
      }
      refresh();
    },
    [user, completions, today, refresh]
  );

  const logManualMeal = useCallback(
    async (entry: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => {
      await toggleCompletion({
        itemType: 'meal',
        itemKey: `manual-${crypto.randomUUID()}`,
        itemName: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      });
      toast.success('Meal logged');
    },
    [toggleCompletion]
  );

  return { loading, waterMl, consumed, completions, addWater, isCompleted, toggleCompletion, logManualMeal, refresh };
}
