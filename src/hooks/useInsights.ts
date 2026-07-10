import { useMemo } from 'react';
import {
  NutritionProfile,
  NutritionTargets,
  calculateBMI,
  calculateTargets,
  normalizeProfile,
  projectGoalDate,
} from '../lib/nutrition';
import { ProfileRow } from './useProfile';
import { ProgressLog } from './useWeightHistory';

export interface Insights {
  nutritionProfile: NutritionProfile | null;
  targets: NutritionTargets | null;
  bmi: { bmi: number; category: string } | null;
  currentWeight: number | null;
  startWeight: number | null;
  // weight change over roughly the last 7 days; null with fewer than 2 logs
  weeklyDeltaKg: number | null;
  projectedGoalDate: Date | null;
  insightTexts: string[];
}

export function useInsights(profile: ProfileRow | null, logs: ProgressLog[]): Insights {
  return useMemo(() => {
    const nutritionProfile = normalizeProfile(profile);
    const targets = nutritionProfile ? calculateTargets(nutritionProfile) : null;

    const weighted = logs.filter((l) => l.weight != null);
    const currentWeight =
      weighted.length > 0 ? weighted[weighted.length - 1].weight : nutritionProfile?.weight ?? null;
    const startWeight = weighted.length > 0 ? weighted[0].weight : nutritionProfile?.weight ?? null;

    const bmi =
      nutritionProfile && currentWeight ? calculateBMI(currentWeight, nutritionProfile.height) : null;

    let weeklyDeltaKg: number | null = null;
    if (weighted.length >= 2) {
      const latest = weighted[weighted.length - 1];
      const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const baseline =
        [...weighted].reverse().find((l) => new Date(l.created_at).getTime() <= weekAgoMs) || weighted[0];
      if (baseline.id !== latest.id) {
        weeklyDeltaKg = parseFloat(((latest.weight ?? 0) - (baseline.weight ?? 0)).toFixed(1));
      }
    }

    const projectedGoalDate =
      nutritionProfile && currentWeight
        ? projectGoalDate(currentWeight, nutritionProfile.targetWeight, nutritionProfile.weeklyWeightChange)
        : null;

    const insightTexts: string[] = [];
    if (weeklyDeltaKg != null && weeklyDeltaKg !== 0) {
      insightTexts.push(
        weeklyDeltaKg < 0
          ? `Down ${Math.abs(weeklyDeltaKg)} kg this week`
          : `Up ${weeklyDeltaKg} kg this week`
      );
    }
    if (bmi) {
      insightTexts.push(`Your BMI is ${bmi.bmi} (${bmi.category.toLowerCase()})`);
    }
    if (projectedGoalDate && nutritionProfile?.targetWeight) {
      insightTexts.push(
        `On track to reach ${nutritionProfile.targetWeight} kg by ${projectedGoalDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
      );
    }

    return {
      nutritionProfile,
      targets,
      bmi,
      currentWeight,
      startWeight,
      weeklyDeltaKg,
      projectedGoalDate,
      insightTexts,
    };
  }, [profile, logs]);
}
