import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
}

interface MealPlan {
  day: string;
  meals: { breakfast: Meal; lunch: Meal; dinner: Meal; snack?: Meal };
}

interface Exercise {
  name: string;
  duration: string;
  calories_burned: number;
  type: string;
}

interface ExercisePlan {
  day: string;
  exercises: Exercise[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const EXERCISE_TEMPLATES: Record<string, Exercise[]> = {
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

function generateWeeklyMealPlan(profile: any): MealPlan[] {
  const weight = parseFloat(profile.weight) || 70;
  const height = parseFloat(profile.height) || 170;
  const age = parseInt(profile.age || '30');
  const gender = profile.gender || 'male';
  const activityLevel = profile.activity_level || 'moderate';
  const goal = profile.goal || 'maintain';

  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 };
  const tdee = bmr * (multipliers[activityLevel] || 1.55);
  const adjustments: Record<string, number> = { weight_loss: -500, weight_gain: 300, muscle_gain: 200, maintain: 0 };
  const baseDailyCalories = Math.round(tdee + (adjustments[goal] || 0));
  const baseProtein = Math.round(weight * 2);
  const baseFat = Math.round((baseDailyCalories * 0.25) / 9);
  const baseCarbs = Math.round((baseDailyCalories - baseProtein * 4 - baseFat * 9) / 4);

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

    const plan: MealPlan = {
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

function generateWeeklyExercisePlan(profile: any): ExercisePlan[] {
  const goal = profile.goal || 'maintain';
  const exercises = EXERCISE_TEMPLATES[goal] || EXERCISE_TEMPLATES.maintain;

  return DAYS.map((day, i) => ({
    day,
    exercises: i === 6
      ? [{ name: 'Rest Day', duration: 'Full day', calories_burned: 0, type: 'rest' }]
      : [exercises[i % exercises.length]],
  }));
}

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState<MealPlan[]>([]);
  const [weeklyExercisePlan, setWeeklyExercisePlan] = useState<ExercisePlan[]>([]);
  const [activeTab, setActiveTab] = useState<'meals' | 'exercises'>('meals');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWeeklyPlans();
  }, [user]);

  const fetchWeeklyPlans = async () => {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) { console.error('Profile fetch error:', error); return; }

      if (profile) {
        setWeeklyMealPlan(generateWeeklyMealPlan(profile));
        setWeeklyExercisePlan(generateWeeklyExercisePlan(profile));
      }
    } catch (error) {
      console.error('Error generating weekly plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Weekly Schedule</h1>
          <p className="text-slate-400">Optimized meal distribution and exercise plan for your goals</p>
        </div>
        <div className="mt-4 md:mt-0 flex bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('meals'); setSelectedDay(null); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'meals' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Meal Plan
          </button>
          <button
            onClick={() => { setActiveTab('exercises'); setSelectedDay(null); }}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'exercises' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Exercise Plan
          </button>
        </div>
      </div>

      {activeTab === 'meals' && !selectedDay && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {weeklyMealPlan.map((dayPlan, index) => (
            <div
              key={index}
              className="bg-slate-900 rounded-2xl p-6 border border-slate-700 cursor-pointer hover:border-slate-600 transition-all"
              onClick={() => setSelectedDay(dayPlan.day)}
            >
              <h3 className="text-xl font-bold text-white mb-4">{dayPlan.day}</h3>
              <div className="space-y-3">
                {Object.entries(dayPlan.meals).map(([mealType, meal]) => (
                  <div key={mealType} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm capitalize">{mealType}</span>
                      <span className="text-blue-400 text-sm font-medium">{meal.calories} cal</span>
                    </div>
                    <p className="text-white text-sm mt-1">{meal.name}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm">
                <span className="text-slate-400">Total:</span>
                <span className="text-white font-semibold">
                  {Object.values(dayPlan.meals).reduce((sum, m) => sum + m.calories, 0)} cal
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'meals' && selectedDay && (() => {
        const dayPlan = weeklyMealPlan.find(d => d.day === selectedDay);
        if (!dayPlan) return null;
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedDay} Meal Plan</h2>
              <button onClick={() => setSelectedDay(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
                ← Back
              </button>
            </div>
            <div className="space-y-6">
              {Object.entries(dayPlan.meals).map(([mealType, meal]) => (
                <div key={mealType} className="bg-slate-900 rounded-2xl p-8 border border-slate-700">
                  <h3 className="text-2xl font-bold text-white capitalize mb-1">{mealType}</h3>
                  <h4 className="text-xl text-slate-300 mb-6">{meal.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[['Calories', meal.calories, 'text-blue-400', ''], ['Protein', meal.protein, 'text-emerald-400', 'g'], ['Carbs', meal.carbs, 'text-orange-400', 'g'], ['Fat', meal.fat, 'text-purple-400', 'g']].map(([label, val, color, unit]) => (
                      <div key={label as string} className="bg-slate-800 p-4 rounded-xl text-center">
                        <div className={`text-2xl font-bold ${color}`}>{val}{unit}</div>
                        <div className="text-slate-400 text-sm">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-lg font-bold text-white mb-3">Ingredients</h5>
                      <div className="space-y-2">
                        {meal.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center bg-slate-800 p-3 rounded-lg">
                            <span className="text-blue-400 mr-3">•</span>
                            <span className="text-slate-200">{ing}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-white mb-3">Instructions</h5>
                      <div className="space-y-2">
                        {meal.instructions.map((ins, idx) => (
                          <div key={idx} className="flex bg-slate-800 p-3 rounded-lg">
                            <span className="text-blue-400 font-bold mr-3">{idx + 1}.</span>
                            <span className="text-slate-200">{ins}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {activeTab === 'exercises' && !selectedDay && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {weeklyExercisePlan.map((dayPlan, index) => (
            <div
              key={index}
              className="bg-slate-900 rounded-2xl p-6 border border-slate-700 cursor-pointer hover:border-slate-600 transition-all"
              onClick={() => setSelectedDay(dayPlan.day)}
            >
              <h3 className="text-xl font-bold text-white mb-4">{dayPlan.day}</h3>
              <div className="space-y-3">
                {dayPlan.exercises.map((ex, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{ex.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${ex.type === 'rest' ? 'bg-green-500/20 text-green-400' : ex.type === 'cardio' ? 'bg-red-500/20 text-red-400' : ex.type === 'hiit' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {ex.type}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{ex.duration}</span>
                      <span>{ex.calories_burned} cal burned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'exercises' && selectedDay && (() => {
        const dayPlan = weeklyExercisePlan.find(d => d.day === selectedDay);
        if (!dayPlan) return null;
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedDay} Exercise Plan</h2>
              <button onClick={() => setSelectedDay(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
                ← Back
              </button>
            </div>
            <div className="space-y-6">
              {dayPlan.exercises.map((ex, i) => (
                <div key={i} className="bg-slate-900 rounded-2xl p-8 border border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">{ex.name}</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${ex.type === 'rest' ? 'bg-green-500/20 text-green-400' : ex.type === 'cardio' ? 'bg-red-500/20 text-red-400' : ex.type === 'hiit' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {ex.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 p-6 rounded-xl space-y-3">
                      <h4 className="text-lg font-bold text-white mb-2">Details</h4>
                      {[['Duration', ex.duration], ['Calories Burned', `${ex.calories_burned} cal`], ['Type', ex.type]].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-slate-400">{label}:</span>
                          <span className="text-white font-semibold capitalize">{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl">
                      <h4 className="text-lg font-bold text-white mb-3">Instructions</h4>
                      <div className="text-slate-300 space-y-2 text-sm">
                        {ex.type === 'rest' ? (
                          <p>Take a complete rest day. Focus on recovery, light stretching, or gentle walking.</p>
                        ) : ex.type === 'cardio' || ex.type === 'hiit' ? (
                          <>
                            <p>• Warm up for 5 minutes</p>
                            <p>• Maintain target intensity for main duration</p>
                            <p>• Cool down for 5 minutes</p>
                            <p>• Stay hydrated throughout</p>
                          </>
                        ) : (
                          <>
                            <p>• Warm up with light cardio (5 min)</p>
                            <p>• Focus on proper form over weight</p>
                            <p>• 3-4 sets of 8-12 reps</p>
                            <p>• Rest 60-90 seconds between sets</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SchedulePage;
