import { Goal } from './nutrition';

export interface HealthScoreInput {
  streakDays: number;
  waterMl: number;
  waterTargetMl: number;
  weeklyDeltaKg: number | null;
  goal: Goal;
  avgSteps7d: number | null; // null = no wearable data
  avgSleepMin7d: number | null;
  workouts7d: number;
}

export interface SubScore {
  key: string;
  label: string;
  score: number; // 0–100
  weight: number;
}

export interface HealthScore {
  score: number; // 0–100 composite
  subscores: SubScore[];
  drivers: string[]; // human insights, worst-first
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Composite wellness score. Wearable-dependent subscores (activity, sleep)
// drop out of the weighting when no device data exists, so the score stays
// honest for users without a connected device.
export function computeHealthScore(input: HealthScoreInput): HealthScore {
  const subscores: SubScore[] = [];

  subscores.push({
    key: 'consistency',
    label: 'Consistency',
    score: clamp((input.streakDays / 7) * 100),
    weight: 0.2,
  });

  subscores.push({
    key: 'hydration',
    label: 'Hydration',
    score: clamp((input.waterMl / Math.max(input.waterTargetMl, 1)) * 100),
    weight: 0.15,
  });

  let weightScore = 60; // neutral when there's no trend yet
  if (input.weeklyDeltaKg != null) {
    const delta = input.weeklyDeltaKg;
    if (input.goal === 'weight_loss') weightScore = delta < -0.1 ? 100 : delta <= 0.1 ? 60 : 25;
    else if (input.goal === 'weight_gain' || input.goal === 'muscle_gain')
      weightScore = delta > 0.1 ? 100 : delta >= -0.1 ? 60 : 25;
    else weightScore = Math.abs(delta) <= 0.3 ? 100 : 50;
  }
  subscores.push({ key: 'weight', label: 'Weight trend', score: weightScore, weight: 0.2 });

  subscores.push({
    key: 'training',
    label: 'Training',
    score: clamp((input.workouts7d / 4) * 100),
    weight: 0.15,
  });

  if (input.avgSteps7d != null) {
    subscores.push({
      key: 'activity',
      label: 'Activity',
      score: clamp((input.avgSteps7d / 10000) * 100),
      weight: 0.15,
    });
  }

  if (input.avgSleepMin7d != null) {
    // 7–8.5h is the sweet spot; fall off on either side
    const h = input.avgSleepMin7d / 60;
    const sleepScore = h >= 7 && h <= 8.5 ? 100 : h >= 6 ? 70 - (7 - Math.min(h, 7)) * 20 : 35;
    subscores.push({ key: 'sleep', label: 'Sleep', score: clamp(sleepScore), weight: 0.15 });
  }

  const totalWeight = subscores.reduce((s, x) => s + x.weight, 0);
  const score = Math.round(subscores.reduce((s, x) => s + x.score * (x.weight / totalWeight), 0));

  const driverText: Record<string, [string, string]> = {
    consistency: ['Log something daily to rebuild your streak', 'Your logging streak is carrying your score'],
    hydration: ["You're behind on water today", 'Hydration is on target'],
    weight: ['Your weight trend is moving against your goal', 'Weight is trending exactly where you want it'],
    training: ['No workouts checked off this week yet', 'Training volume looks strong this week'],
    activity: ['Daily steps are below the 10k benchmark', 'Step count is excellent'],
    sleep: ['Sleep is pulling your score down — aim for 7–8.5 h', 'Sleep is in the optimal range'],
  };

  const sorted = [...subscores].sort((a, b) => a.score - b.score);
  const drivers: string[] = [];
  if (sorted[0] && sorted[0].score < 70) drivers.push(driverText[sorted[0].key][0]);
  if (sorted[1] && sorted[1].score < 55) drivers.push(driverText[sorted[1].key][0]);
  const best = sorted[sorted.length - 1];
  if (best && best.score >= 85) drivers.push(driverText[best.key][1]);

  return { score, subscores, drivers };
}
