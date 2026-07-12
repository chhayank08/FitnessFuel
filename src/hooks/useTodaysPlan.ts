import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTodaysPlan, getAlternativeMeal, Meal, MealSlot, TodaysPlan } from '../lib/planGenerator';
import { ProfileRow } from './useProfile';

type Overrides = Partial<Record<MealSlot, Meal>>;

const storageKey = () => `fitnfuel:mealOverrides:${new Date().toISOString().slice(0, 10)}`;

function readOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Overrides) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(overrides));
  } catch {
    /* storage full/unavailable */
  }
}

// Today's plan with per-slot meal replacements merged in. Overrides keep the
// original slot key so completion tracking is unaffected; they reset daily
// (date-scoped localStorage key).
export function useTodaysPlan(profile: ProfileRow | null, enabled: boolean) {
  const [overrides, setOverrides] = useState<Overrides>(readOverrides);

  // Cross-component sync within the tab (DietPage + dashboard card).
  useEffect(() => {
    const onChange = () => setOverrides(readOverrides());
    window.addEventListener('fitnfuel:mealOverrides', onChange);
    return () => window.removeEventListener('fitnfuel:mealOverrides', onChange);
  }, []);

  const basePlan = useMemo<TodaysPlan | null>(
    () => (enabled && profile ? getTodaysPlan(profile) : null),
    [enabled, profile]
  );

  const plan = useMemo<TodaysPlan | null>(() => {
    if (!basePlan) return null;
    return {
      ...basePlan,
      meals: basePlan.meals.map((m) => (overrides[m.key] ? { ...m, meal: overrides[m.key]! } : m)),
    };
  }, [basePlan, overrides]);

  const replaceMeal = useCallback(
    (slot: MealSlot) => {
      if (!profile) return null;
      const currentName = overrides[slot]?.name;
      const alt = getAlternativeMeal(profile, slot, currentName ? [currentName] : []);
      if (!alt) return null;
      const next = { ...overrides, [slot]: alt };
      writeOverrides(next);
      setOverrides(next);
      window.dispatchEvent(new Event('fitnfuel:mealOverrides'));
      return alt;
    },
    [profile, overrides]
  );

  const resetMeal = useCallback(
    (slot: MealSlot) => {
      const next = { ...overrides };
      delete next[slot];
      writeOverrides(next);
      setOverrides(next);
      window.dispatchEvent(new Event('fitnfuel:mealOverrides'));
    },
    [overrides]
  );

  const isOverridden = useCallback((slot: MealSlot) => overrides[slot] != null, [overrides]);

  return { plan, replaceMeal, resetMeal, isOverridden };
}
