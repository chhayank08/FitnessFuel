export type Goal = 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintain';

export interface NutritionProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: string;
  activityLevel: string;
  goal: Goal;
  targetWeight: number | null;
  weeklyWeightChange: number | null;
}

export interface NutritionTargets {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
  waterMl: number;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  weight_loss: -500,
  weight_gain: 300,
  muscle_gain: 200,
  maintain: 0,
};

// Mifflin-St Jeor
export function calculateBMR(p: NutritionProfile): number {
  return p.gender === 'male'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
    : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
}

export function calculateTDEE(p: NutritionProfile): number {
  return Math.round(calculateBMR(p) * (ACTIVITY_MULTIPLIERS[p.activityLevel] || 1.55));
}

export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: string } {
  const bmi = parseFloat((weightKg / ((heightCm / 100) ** 2)).toFixed(1));
  const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  return { bmi, category };
}

export function calculateTargets(p: NutritionProfile): NutritionTargets {
  const bmr = Math.round(calculateBMR(p));
  const tdee = calculateTDEE(p);
  const dailyCalories = Math.round(tdee + (GOAL_ADJUSTMENTS[p.goal] || 0));
  const protein = Math.round(p.weight * 2);
  const fat = Math.round((dailyCalories * 0.25) / 9);
  const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);
  const waterMl = Math.round(p.weight * 35);
  return { dailyCalories, protein, carbs, fat, bmr, tdee, waterMl };
}

// Projected date to reach targetWeight at weeklyChangeKg per week; null when
// the rate is unset/zero, points away from the target, or is implausibly slow.
export function projectGoalDate(
  currentKg: number,
  targetKg: number | null,
  weeklyChangeKg: number | null
): Date | null {
  if (!targetKg || !weeklyChangeKg) return null;
  const delta = targetKg - currentKg;
  if (delta === 0) return null;
  if (Math.sign(delta) !== Math.sign(weeklyChangeKg)) return null;
  const weeks = Math.abs(delta) / Math.abs(weeklyChangeKg);
  if (weeks > 520) return null;
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil(weeks * 7));
  return date;
}

interface ProfileRowLike {
  weight?: number | string | null;
  height?: number | string | null;
  age?: number | string | null;
  gender?: string | null;
  activity_level?: string | null;
  goal?: string | null;
  target_weight?: number | string | null;
  weekly_weight_change?: number | string | null;
}

function coerce(row: ProfileRowLike): NutritionProfile {
  return {
    weight: parseFloat(String(row.weight ?? '')) || 70,
    height: parseFloat(String(row.height ?? '')) || 170,
    age: parseInt(String(row.age ?? '30'), 10) || 30,
    gender: row.gender || 'male',
    activityLevel: row.activity_level || 'moderate',
    goal: (row.goal as Goal) || 'maintain',
    targetWeight: row.target_weight != null ? parseFloat(String(row.target_weight)) || null : null,
    weeklyWeightChange:
      row.weekly_weight_change != null ? parseFloat(String(row.weekly_weight_change)) || null : null,
  };
}

// Loose normalization with sensible defaults — for plan generation where a
// plausible plan beats no plan.
export function toNutritionProfile(row: ProfileRowLike): NutritionProfile {
  return coerce(row);
}

// Strict normalization — null when weight/height are missing, so callers can
// render an empty state instead of computing targets from defaults.
export function normalizeProfile(row: ProfileRowLike | null): NutritionProfile | null {
  if (!row) return null;
  const weight = parseFloat(String(row.weight ?? ''));
  const height = parseFloat(String(row.height ?? ''));
  if (!weight || !height) return null;
  return coerce(row);
}
