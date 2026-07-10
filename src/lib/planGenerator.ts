import { NutritionProfile, calculateTargets, toNutritionProfile } from './nutrition';

export interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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

const INGREDIENTS: Record<string, Record<string, string[]>> = {
  breakfast: {
    weight_loss: ['Egg whites', 'Spinach', 'Berries', 'Greek yogurt', 'Oats', 'Almond milk'],
    weight_gain: ['Whole eggs', 'Avocado', 'Nuts', 'Whole grain bread', 'Banana', 'Peanut butter'],
    muscle_gain: ['Protein powder', 'Oats', 'Berries', 'Almond butter', 'Milk', 'Honey'],
    maintain: ['Eggs', 'Vegetables', 'Whole grains', 'Fruit', 'Yogurt', 'Nuts'],
  },
  lunch: {
    weight_loss: ['Lean protein', 'Mixed greens', 'Vegetables', 'Olive oil', 'Quinoa', 'Lemon'],
    weight_gain: ['Chicken thigh', 'Brown rice', 'Avocado', 'Nuts', 'Vegetables', 'Olive oil'],
    muscle_gain: ['Lean beef', 'Sweet potato', 'Broccoli', 'Olive oil', 'Quinoa', 'Herbs'],
    maintain: ['Fish or chicken', 'Mixed vegetables', 'Whole grains', 'Healthy fats', 'Herbs', 'Spices'],
  },
  dinner: {
    weight_loss: ['White fish', 'Steamed vegetables', 'Leafy greens', 'Herbs', 'Lemon', 'Garlic'],
    weight_gain: ['Salmon', 'Quinoa', 'Roasted vegetables', 'Nuts', 'Olive oil', 'Herbs'],
    muscle_gain: ['Lean steak', 'Sweet potato', 'Asparagus', 'Garlic', 'Herbs', 'Olive oil'],
    maintain: ['Protein of choice', 'Vegetables', 'Complex carbs', 'Healthy fats', 'Seasonings', 'Herbs'],
  },
  snack: {
    weight_loss: ['Apple', 'Almond butter', 'Celery', 'Hummus', 'Berries', 'Greek yogurt'],
    weight_gain: ['Trail mix', 'Dried fruit', 'Nuts', 'Seeds', 'Granola', 'Milk'],
    muscle_gain: ['Protein bar', 'Greek yogurt', 'Berries', 'Granola', 'Protein shake', 'Banana'],
    maintain: ['Mixed nuts', 'Fruit', 'Yogurt', 'Vegetables', 'Hummus', 'Whole grains'],
  },
};

const INSTRUCTIONS: Record<string, string[]> = {
  breakfast: ['Prepare ingredients the night before for quick assembly', 'Include protein to maintain energy levels', 'Pair with water or herbal tea for hydration'],
  lunch: ['Eat when moderately hungry, not starving', 'Balance protein, carbs, and healthy fats', 'Take time to eat mindfully'],
  dinner: ['Eat 2-3 hours before bedtime for better digestion', 'Focus on protein and vegetables with moderate carbs', 'Keep portions appropriate for evening metabolism'],
  snack: ['Choose when genuinely hungry between meals', 'Focus on protein or healthy fats for satiety', 'Keep portions controlled'],
};

const EXERCISE_TEMPLATES: Record<string, ExerciseItem[]> = {
  weight_loss: [
    { name: 'Cardio (Running)', duration: '30 min', calories_burned: 300, type: 'cardio' },
    { name: 'HIIT Training', duration: '25 min', calories_burned: 250, type: 'hiit' },
    { name: 'Cycling', duration: '45 min', calories_burned: 400, type: 'cardio' },
    { name: 'Swimming', duration: '30 min', calories_burned: 350, type: 'cardio' },
    { name: 'Strength Training', duration: '40 min', calories_burned: 200, type: 'strength' },
    { name: 'Jump Rope', duration: '20 min', calories_burned: 220, type: 'cardio' },
  ],
  weight_gain: [
    { name: 'Weight Lifting', duration: '45 min', calories_burned: 180, type: 'strength' },
    { name: 'Compound Exercises', duration: '40 min', calories_burned: 160, type: 'strength' },
    { name: 'Resistance Training', duration: '35 min', calories_burned: 150, type: 'strength' },
    { name: 'Light Cardio', duration: '20 min', calories_burned: 120, type: 'cardio' },
    { name: 'Deadlifts & Squats', duration: '45 min', calories_burned: 190, type: 'strength' },
    { name: 'Upper Body Push', duration: '40 min', calories_burned: 160, type: 'strength' },
  ],
  muscle_gain: [
    { name: 'Heavy Lifting', duration: '50 min', calories_burned: 200, type: 'strength' },
    { name: 'Progressive Overload', duration: '45 min', calories_burned: 180, type: 'strength' },
    { name: 'Compound Movements', duration: '40 min', calories_burned: 170, type: 'strength' },
    { name: 'Isolation Exercises', duration: '30 min', calories_burned: 140, type: 'strength' },
    { name: 'Pull Day', duration: '45 min', calories_burned: 175, type: 'strength' },
    { name: 'Leg Day', duration: '50 min', calories_burned: 210, type: 'strength' },
  ],
  maintain: [
    { name: 'Mixed Training', duration: '35 min', calories_burned: 220, type: 'mixed' },
    { name: 'Moderate Cardio', duration: '30 min', calories_burned: 200, type: 'cardio' },
    { name: 'Strength Training', duration: '40 min', calories_burned: 180, type: 'strength' },
    { name: 'Flexibility & Yoga', duration: '25 min', calories_burned: 100, type: 'flexibility' },
    { name: 'Bodyweight Circuit', duration: '30 min', calories_burned: 190, type: 'mixed' },
    { name: 'Pilates', duration: '35 min', calories_burned: 150, type: 'flexibility' },
  ],
};

function getMealName(type: string, goal: string, dayIndex: number): string {
  const names = MEAL_NAMES[type]?.[goal] || MEAL_NAMES[type]?.maintain || ['Healthy Meal'];
  return names[dayIndex % names.length];
}

function getIngredients(type: string, goal: string): string[] {
  return INGREDIENTS[type]?.[goal] || INGREDIENTS[type]?.maintain || ['Healthy ingredients'];
}

function buildMeal(type: string, goal: string, dayIndex: number, calories: number, protein: number, carbs: number, fat: number): Meal {
  return {
    name: getMealName(type, goal, dayIndex),
    calories,
    protein,
    carbs,
    fat,
    ingredients: getIngredients(type, goal),
    instructions: INSTRUCTIONS[type] || ['Enjoy this healthy meal'],
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

export function generateWeeklyExercisePlan(profileRow: Parameters<typeof toNutritionProfile>[0]): DayExercisePlan[] {
  const goal = toNutritionProfile(profileRow).goal;
  const exercises = EXERCISE_TEMPLATES[goal] || EXERCISE_TEMPLATES.maintain;

  return DAYS.map((day, i) => ({
    day,
    exercises: i === 6
      ? [{ name: 'Rest Day', duration: 'Full day', calories_burned: 0, type: 'rest' }]
      : [exercises[i % exercises.length]],
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
