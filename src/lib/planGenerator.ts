import { NutritionProfile, calculateTargets, toNutritionProfile } from './nutrition';
import { getRecipe } from './recipeCatalog';
// planGenerator ⇄ workoutPlanGenerator import cycle is safe: both sides only
// touch the other module inside function bodies, never at module init.
import { generateWeeklyWorkoutPlan } from './workoutPlanGenerator';

export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  ingredients: string[];
  instructions: string[];
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DayMealPlan {
  day: string;
  meals: { breakfast: Meal; lunch: Meal; dinner: Meal; snack?: Meal };
}

export interface ExerciseItem {
  name: string;
  duration: string;
  calories_burned: number;
  type: string;
}

export interface DayExercisePlan {
  day: string;
  exercises: ExerciseItem[];
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_NAMES: Record<string, Record<string, string[]>> = {
  breakfast: {
    weight_loss: ['Protein Power Bowl', 'Green Smoothie Bowl', 'Egg White Scramble', 'Greek Yogurt Parfait', 'Oatmeal with Berries', 'Avocado Toast', 'Chia Seed Pudding'],
    weight_gain: ['Hearty Breakfast Bowl', 'Protein Pancakes', 'Loaded Oatmeal', 'Breakfast Burrito', 'French Toast', 'Granola Bowl', 'Power Smoothie'],
    muscle_gain: ['High-Protein Scramble', 'Muscle Builder Bowl', 'Protein Oats', 'Power Breakfast', 'Anabolic French Toast', 'Protein Smoothie Bowl', 'Egg & Quinoa Bowl'],
    maintain: ['Balanced Breakfast', 'Morning Energy Bowl', 'Classic Oatmeal', 'Healthy Start', 'Nutritious Breakfast', 'Morning Fuel', 'Breakfast Blend'],
  },
  lunch: {
    weight_loss: ['Lean & Green Salad', 'Protein Power Lunch', 'Veggie Wrap', 'Grilled Chicken Bowl', 'Quinoa Salad', 'Soup & Salad', 'Mediterranean Bowl'],
    weight_gain: ['Hearty Grain Bowl', 'Loaded Sandwich', 'Power Lunch Plate', 'Protein-Rich Pasta', 'Substantial Salad', 'Energy Bowl', 'Filling Wrap'],
    muscle_gain: ['Muscle Building Bowl', 'High-Protein Lunch', 'Anabolic Meal', 'Power Plate', 'Protein-Packed Lunch', 'Strength Bowl', 'Recovery Meal'],
    maintain: ['Balanced Lunch Plate', 'Midday Fuel', 'Nutritious Bowl', 'Healthy Lunch', 'Balanced Meal', 'Lunch Special', 'Midday Energy'],
  },
  dinner: {
    weight_loss: ['Light Evening Meal', 'Lean Protein Plate', 'Veggie-Forward Dinner', 'Clean Eating Plate', 'Light & Satisfying', 'Evening Greens', 'Mindful Dinner'],
    weight_gain: ['Substantial Dinner', 'Hearty Evening Meal', 'Power Dinner', 'Filling Plate', 'Energy Dinner', 'Robust Meal', 'Satisfying Dinner'],
    muscle_gain: ['Recovery Dinner', 'Muscle Fuel Plate', 'Anabolic Dinner', 'Strength Meal', 'Protein Power Dinner', 'Growth Plate', 'Evening Recovery'],
    maintain: ['Balanced Dinner', 'Evening Nutrition', 'Healthy Dinner', 'Balanced Plate', 'Nutritious Evening', 'Dinner Balance', 'Evening Fuel'],
  },
  snack: {
    weight_loss: ['Smart Snack', 'Protein Bite', 'Healthy Choice', 'Light Snack', 'Clean Snack', 'Mindful Bite', 'Lean Snack'],
    weight_gain: ['Energy Boost', 'Power Snack', 'Calorie Dense Bite', 'Fuel Snack', 'Growth Snack', 'Energy Bar', 'Power Bite'],
    muscle_gain: ['Protein Power Snack', 'Muscle Fuel', 'Anabolic Bite', 'Recovery Snack', 'Strength Snack', 'Protein Hit', 'Muscle Snack'],
    maintain: ['Balanced Snack', 'Healthy Bite', 'Nutritious Snack', 'Energy Snack', 'Balanced Bite', 'Healthy Choice', 'Smart Bite'],
  },
};

function getMealName(type: string, goal: string, dayIndex: number): string {
  const names = MEAL_NAMES[type]?.[goal] || MEAL_NAMES[type]?.maintain || ['Healthy Meal'];
  return names[dayIndex % names.length];
}

function buildMeal(type: string, goal: string, dayIndex: number, calories: number, protein: number, carbs: number, fat: number): Meal {
  const name = getMealName(type, goal, dayIndex);
  const recipe = getRecipe(name, type as MealSlot);
  return {
    name,
    calories,
    protein,
    carbs,
    fat,
    image: recipe.image,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  };
}

// Deterministic pure function of profile + day index: TodaysPlanCard,
// SchedulePage, and completion keys all depend on this staying stable.
export function generateWeeklyMealPlan(profileRow: Parameters<typeof toNutritionProfile>[0]): DayMealPlan[] {
  const p: NutritionProfile = toNutritionProfile(profileRow);
  const goal = p.goal;
  const targets = calculateTargets(p);
  const baseDailyCalories = targets.dailyCalories;
  const baseProtein = targets.protein;
  const baseFat = targets.fat;
  const baseCarbs = targets.carbs;

  const dist = goal === 'weight_loss'
    ? { breakfast: 0.30, lunch: 0.40, dinner: 0.30 }
    : goal === 'weight_gain' || goal === 'muscle_gain'
    ? { breakfast: 0.25, lunch: 0.35, dinner: 0.40 }
    : { breakfast: 0.25, lunch: 0.40, dinner: 0.35 };

  return DAYS.map((day, i) => {
    const variation = 1 + Math.sin(i * 0.7) * 0.08;
    const cal = Math.round(baseDailyCalories * variation);
    const pro = Math.round(baseProtein * variation);
    const carb = Math.round(baseCarbs * variation);
    const fat = Math.round(baseFat * variation);

    const plan: DayMealPlan = {
      day,
      meals: {
        breakfast: buildMeal('breakfast', goal, i, Math.round(cal * dist.breakfast), Math.round(pro * dist.breakfast), Math.round(carb * dist.breakfast * 1.2), Math.round(fat * dist.breakfast * 0.8)),
        lunch: buildMeal('lunch', goal, i, Math.round(cal * dist.lunch), Math.round(pro * dist.lunch * 1.1), Math.round(carb * dist.lunch), Math.round(fat * dist.lunch)),
        dinner: buildMeal('dinner', goal, i, Math.round(cal * dist.dinner), Math.round(pro * dist.dinner * 1.2), Math.round(carb * dist.dinner * 0.8), Math.round(fat * dist.dinner * 1.1)),
      },
    };

    if (cal > 2200 || goal === 'weight_gain' || goal === 'muscle_gain') {
      plan.meals.snack = buildMeal('snack', goal, i, Math.round(cal * 0.15), Math.round(pro * 0.15), Math.round(carb * 0.15), Math.round(fat * 0.15));
    }

    return plan;
  });
}

// Thin adapter over the real generator (workoutPlanGenerator.ts) keeping the
// legacy ExerciseItem summary shape that TodaysPlanCard, NextActionCard, and
// the 'workout' completion key already depend on.
export function generateWeeklyExercisePlan(profileRow: Parameters<typeof toNutritionProfile>[0]): DayExercisePlan[] {
  const week = generateWeeklyWorkoutPlan(profileRow);
  return week.map((dayPlan) => ({
    day: dayPlan.day,
    exercises: dayPlan.restDay
      ? [{ name: 'Rest Day', duration: 'Full day', calories_burned: 0, type: 'rest' }]
      : [{
          name: dayPlan.focus,
          duration: `${dayPlan.totalMinutes} min`,
          calories_burned: dayPlan.estCalories,
          type: dayPlan.type,
        }],
  }));
}

export interface TodaysPlan {
  meals: { key: MealSlot; meal: Meal }[];
  workout: ExerciseItem | null; // null on rest day
}

export function getTodaysPlan(profileRow: Parameters<typeof toNutritionProfile>[0], date: Date = new Date()): TodaysPlan {
  const dayIndex = (date.getDay() + 6) % 7; // DAYS is Monday-first
  const mealDay = generateWeeklyMealPlan(profileRow)[dayIndex];
  const exerciseDay = generateWeeklyExercisePlan(profileRow)[dayIndex];

  const meals: TodaysPlan['meals'] = (['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[])
    .filter((slot) => mealDay.meals[slot])
    .map((slot) => ({ key: slot, meal: mealDay.meals[slot]! }));

  const workout = exerciseDay.exercises[0];
  return { meals, workout: workout && workout.type !== 'rest' ? workout : null };
}

// Returns a different template meal for the slot with today's macros intact —
// used by the "Replace meal" quick action. Pure: cycles the slot's name pool
// past the excluded names.
export function getAlternativeMeal(
  profileRow: Parameters<typeof toNutritionProfile>[0],
  slot: MealSlot,
  excludeNames: string[],
  date: Date = new Date()
): Meal | null {
  const goal = toNutritionProfile(profileRow).goal;
  const current = getTodaysPlan(profileRow, date).meals.find((m) => m.key === slot)?.meal;
  if (!current) return null;

  const pool = MEAL_NAMES[slot]?.[goal] || MEAL_NAMES[slot]?.maintain || [];
  const candidates = pool.filter((n) => !excludeNames.includes(n) && n !== current.name);
  const name = candidates[0] ?? pool.find((n) => n !== current.name);
  if (!name) return null;

  // Swap the full recipe (image/ingredients/instructions), keep today's macros.
  const recipe = getRecipe(name, slot);
  return { ...current, name, image: recipe.image, ingredients: recipe.ingredients, instructions: recipe.instructions };
}
