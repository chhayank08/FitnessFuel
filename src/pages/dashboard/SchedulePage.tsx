import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

interface MealPlan {
  day: string;
  meals: {
    breakfast: { name: string; calories: number; image_url: string; ingredients: string[]; instructions: string[]; protein?: number; carbs?: number; fat?: number };
    lunch: { name: string; calories: number; image_url: string; ingredients: string[]; instructions: string[]; protein?: number; carbs?: number; fat?: number };
    dinner: { name: string; calories: number; image_url: string; ingredients: string[]; instructions: string[]; protein?: number; carbs?: number; fat?: number };
    snack?: { name: string; calories: number; image_url: string; ingredients: string[]; instructions: string[]; protein?: number; carbs?: number; fat?: number };
  };
}

interface ExercisePlan {
  day: string;
  exercises: {
    name: string;
    duration: string;
    calories_burned: number;
    type: string;
  }[];
}

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState<MealPlan[]>([]);
  const [weeklyExercisePlan, setWeeklyExercisePlan] = useState<ExercisePlan[]>([]);
  const [activeTab, setActiveTab] = useState<'meals' | 'exercises'>('meals');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (user) {
      fetchWeeklyPlans();
    }
  }, [user]);

  const fetchWeeklyPlans = async () => {
    try {
      setLoading(true);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return;
      }

      if (profile) {
        // Generate weekly meal plan
        const mealPlan = await generateWeeklyMealPlan(profile);
        setWeeklyMealPlan(mealPlan);

        // Generate weekly exercise plan
        const exercisePlan = generateWeeklyExercisePlan(profile);
        setWeeklyExercisePlan(exercisePlan);
      }
    } catch (error) {
      console.error('Error fetching weekly plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyMealPlan = async (profile: any): Promise<MealPlan[]> => {
    const weeklyPlan: MealPlan[] = [];
    const baseTimestamp = Date.now();
    
    // Get user's nutritional targets
    const baseResponse = await axios.post('http://localhost:3000/api/diet/recommend', {
      weight: parseFloat(profile.weight),
      height: parseFloat(profile.height),
      age: parseInt(profile.age || '30'),
      gender: profile.gender || 'male',
      activity_level: profile.activity_level || 'moderate',
      goal: profile.goal || 'maintain',
      weekly_weight_change: profile.weekly_weight_change || 0,
      day_seed: baseTimestamp
    });
    
    const baseDailyCalories = baseResponse.data.daily_calories || 2000;
    const baseProtein = baseResponse.data.protein || 150;
    const baseCarbs = baseResponse.data.carbs || 250;
    const baseFat = baseResponse.data.fat || 67;
    const goal = profile.goal || 'maintain';
    
    // Optimized calorie distribution based on goals
    let calorieDistribution;
    if (goal === 'weight_loss') {
      calorieDistribution = { breakfast: 0.30, lunch: 0.40, dinner: 0.30 };
    } else if (goal === 'weight_gain' || goal === 'muscle_gain') {
      calorieDistribution = { breakfast: 0.25, lunch: 0.35, dinner: 0.40 };
    } else {
      calorieDistribution = { breakfast: 0.25, lunch: 0.40, dinner: 0.35 };
    }
    
    for (let i = 0; i < 7; i++) {
      try {
        // Create unique seed and calorie variation for each day
        const dayVariation = baseTimestamp + (i * 1000) + (i * i * 47) + (i * 13);
        const calorieVariation = 1 + ((Math.sin(i * 0.7) * 0.1) + (Math.cos(i * 1.3) * 0.05)); // ±15% variation
        const dailyCalories = Math.round(baseDailyCalories * calorieVariation);
        const dailyProtein = Math.round(baseProtein * calorieVariation);
        const dailyCarbs = Math.round(baseCarbs * calorieVariation);
        const dailyFat = Math.round(baseFat * calorieVariation);
        
        console.log(`Generating ${days[i]} meal plan - Calories: ${dailyCalories} (${Math.round((calorieVariation - 1) * 100)}% variation)`);
        
        const response = await axios.post('http://localhost:3000/api/diet/recommend', {
          weight: parseFloat(profile.weight),
          height: parseFloat(profile.height),
          age: parseInt(profile.age || '30'),
          gender: profile.gender || 'male',
          activity_level: profile.activity_level || 'moderate',
          goal: profile.goal || 'maintain',
          weekly_weight_change: profile.weekly_weight_change || 0,
          day_seed: dayVariation
        });

        const meals = response.data.meals || [];
        console.log(`${days[i]} meals generated:`, meals.map((m: any) => `${m.name} (${m.calories} cal)`));
        
        // Create day plan with properly distributed calories and variation
        const dayPlan: MealPlan = {
          day: days[i],
          meals: {
            breakfast: meals.find((m: any) => m.meal_type === 'breakfast') || {
              name: getDefaultMealName('breakfast', goal, i),
              calories: Math.round(dailyCalories * calorieDistribution.breakfast),
              image_url: '',
              ingredients: getDefaultIngredients('breakfast', goal),
              instructions: getDefaultInstructions('breakfast', goal),
              protein: Math.round(dailyProtein * calorieDistribution.breakfast),
              carbs: Math.round(dailyCarbs * calorieDistribution.breakfast * 1.2), // Higher carbs for breakfast
              fat: Math.round(dailyFat * calorieDistribution.breakfast * 0.8)
            },
            lunch: meals.find((m: any) => m.meal_type === 'lunch') || {
              name: getDefaultMealName('lunch', goal, i),
              calories: Math.round(dailyCalories * calorieDistribution.lunch),
              image_url: '',
              ingredients: getDefaultIngredients('lunch', goal),
              instructions: getDefaultInstructions('lunch', goal),
              protein: Math.round(dailyProtein * calorieDistribution.lunch * 1.1), // Higher protein for lunch
              carbs: Math.round(dailyCarbs * calorieDistribution.lunch),
              fat: Math.round(dailyFat * calorieDistribution.lunch)
            },
            dinner: meals.find((m: any) => m.meal_type === 'dinner') || {
              name: getDefaultMealName('dinner', goal, i),
              calories: Math.round(dailyCalories * calorieDistribution.dinner),
              image_url: '',
              ingredients: getDefaultIngredients('dinner', goal),
              instructions: getDefaultInstructions('dinner', goal),
              protein: Math.round(dailyProtein * calorieDistribution.dinner * 1.2), // Higher protein for dinner
              carbs: Math.round(dailyCarbs * calorieDistribution.dinner * 0.8), // Lower carbs for dinner
              fat: Math.round(dailyFat * calorieDistribution.dinner * 1.1)
            }
          }
        };

        // Add snack if user needs higher calories
        if (dailyCalories > 2200 || goal === 'weight_gain' || goal === 'muscle_gain') {
          const snackMeal = meals.find((m: any) => m.meal_type === 'snack');
          if (snackMeal) {
            dayPlan.meals.snack = snackMeal;
          } else {
            dayPlan.meals.snack = {
              name: getDefaultMealName('snack', goal, i),
              calories: Math.round(dailyCalories * 0.15),
              image_url: '',
              ingredients: getDefaultIngredients('snack', goal),
              instructions: getDefaultInstructions('snack', goal),
              protein: Math.round(dailyProtein * 0.15),
              carbs: Math.round(dailyCarbs * 0.15),
              fat: Math.round(dailyFat * 0.15)
            };
          }
        }

        weeklyPlan.push(dayPlan);
        
        // Add delay to ensure variety
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`Error generating plan for ${days[i]}:`, error);
        // Fallback plan with proper calorie distribution and variation
        const fallbackCalories = Math.round(baseDailyCalories * (1 + ((Math.sin(i * 0.7) * 0.1) + (Math.cos(i * 1.3) * 0.05))));
        const fallbackProtein = Math.round(baseProtein * (fallbackCalories / baseDailyCalories));
        const fallbackCarbs = Math.round(baseCarbs * (fallbackCalories / baseDailyCalories));
        const fallbackFat = Math.round(baseFat * (fallbackCalories / baseDailyCalories));
        
        weeklyPlan.push({
          day: days[i],
          meals: {
            breakfast: {
              name: getDefaultMealName('breakfast', goal, i),
              calories: Math.round(fallbackCalories * calorieDistribution.breakfast),
              image_url: '',
              ingredients: getDefaultIngredients('breakfast', goal),
              instructions: getDefaultInstructions('breakfast', goal),
              protein: Math.round(fallbackProtein * calorieDistribution.breakfast),
              carbs: Math.round(fallbackCarbs * calorieDistribution.breakfast * 1.2),
              fat: Math.round(fallbackFat * calorieDistribution.breakfast * 0.8)
            },
            lunch: {
              name: getDefaultMealName('lunch', goal, i),
              calories: Math.round(fallbackCalories * calorieDistribution.lunch),
              image_url: '',
              ingredients: getDefaultIngredients('lunch', goal),
              instructions: getDefaultInstructions('lunch', goal),
              protein: Math.round(fallbackProtein * calorieDistribution.lunch * 1.1),
              carbs: Math.round(fallbackCarbs * calorieDistribution.lunch),
              fat: Math.round(fallbackFat * calorieDistribution.lunch)
            },
            dinner: {
              name: getDefaultMealName('dinner', goal, i),
              calories: Math.round(fallbackCalories * calorieDistribution.dinner),
              image_url: '',
              ingredients: getDefaultIngredients('dinner', goal),
              instructions: getDefaultInstructions('dinner', goal),
              protein: Math.round(fallbackProtein * calorieDistribution.dinner * 1.2),
              carbs: Math.round(fallbackCarbs * calorieDistribution.dinner * 0.8),
              fat: Math.round(fallbackFat * calorieDistribution.dinner * 1.1)
            }
          }
        });
      }
    }
    
    return weeklyPlan;
  };

  // Helper functions for default meal generation
  const getDefaultMealName = (mealType: string, goal: string, dayIndex: number): string => {
    const mealNames = {
      breakfast: {
        weight_loss: ['Protein Power Bowl', 'Green Smoothie Bowl', 'Egg White Scramble', 'Greek Yogurt Parfait', 'Oatmeal with Berries', 'Avocado Toast', 'Chia Seed Pudding'],
        weight_gain: ['Hearty Breakfast Bowl', 'Protein Pancakes', 'Loaded Oatmeal', 'Breakfast Burrito', 'French Toast', 'Granola Bowl', 'Power Smoothie'],
        muscle_gain: ['High-Protein Scramble', 'Muscle Builder Bowl', 'Protein Oats', 'Power Breakfast', 'Anabolic French Toast', 'Protein Smoothie Bowl', 'Egg & Quinoa Bowl'],
        maintain: ['Balanced Breakfast', 'Morning Energy Bowl', 'Classic Oatmeal', 'Healthy Start', 'Nutritious Breakfast', 'Morning Fuel', 'Breakfast Blend']
      },
      lunch: {
        weight_loss: ['Lean & Green Salad', 'Protein Power Lunch', 'Veggie Wrap', 'Grilled Chicken Bowl', 'Quinoa Salad', 'Soup & Salad', 'Mediterranean Bowl'],
        weight_gain: ['Hearty Grain Bowl', 'Loaded Sandwich', 'Power Lunch Plate', 'Protein-Rich Pasta', 'Substantial Salad', 'Energy Bowl', 'Filling Wrap'],
        muscle_gain: ['Muscle Building Bowl', 'High-Protein Lunch', 'Anabolic Meal', 'Power Plate', 'Protein-Packed Lunch', 'Strength Bowl', 'Recovery Meal'],
        maintain: ['Balanced Lunch Plate', 'Midday Fuel', 'Nutritious Bowl', 'Healthy Lunch', 'Balanced Meal', 'Lunch Special', 'Midday Energy']
      },
      dinner: {
        weight_loss: ['Light Evening Meal', 'Lean Protein Plate', 'Veggie-Forward Dinner', 'Clean Eating Plate', 'Light & Satisfying', 'Evening Greens', 'Mindful Dinner'],
        weight_gain: ['Substantial Dinner', 'Hearty Evening Meal', 'Power Dinner', 'Filling Plate', 'Energy Dinner', 'Robust Meal', 'Satisfying Dinner'],
        muscle_gain: ['Recovery Dinner', 'Muscle Fuel Plate', 'Anabolic Dinner', 'Strength Meal', 'Protein Power Dinner', 'Growth Plate', 'Evening Recovery'],
        maintain: ['Balanced Dinner', 'Evening Nutrition', 'Healthy Dinner', 'Balanced Plate', 'Nutritious Evening', 'Dinner Balance', 'Evening Fuel']
      },
      snack: {
        weight_loss: ['Smart Snack', 'Protein Bite', 'Healthy Choice', 'Light Snack', 'Clean Snack', 'Mindful Bite', 'Lean Snack'],
        weight_gain: ['Energy Boost', 'Power Snack', 'Calorie Dense Bite', 'Fuel Snack', 'Growth Snack', 'Energy Bar', 'Power Bite'],
        muscle_gain: ['Protein Power Snack', 'Muscle Fuel', 'Anabolic Bite', 'Recovery Snack', 'Strength Snack', 'Protein Hit', 'Muscle Snack'],
        maintain: ['Balanced Snack', 'Healthy Bite', 'Nutritious Snack', 'Energy Snack', 'Balanced Bite', 'Healthy Choice', 'Smart Bite']
      }
    };
    
    const goalMeals = mealNames[mealType as keyof typeof mealNames]?.[goal as keyof typeof mealNames.breakfast] || mealNames[mealType as keyof typeof mealNames]?.maintain || ['Healthy Meal'];
    return goalMeals[dayIndex % goalMeals.length];
  };

  const getDefaultIngredients = (mealType: string, goal: string): string[] => {
    const ingredients = {
      breakfast: {
        weight_loss: ['Egg whites', 'Spinach', 'Berries', 'Greek yogurt', 'Oats', 'Almond milk'],
        weight_gain: ['Whole eggs', 'Avocado', 'Nuts', 'Whole grain bread', 'Banana', 'Peanut butter'],
        muscle_gain: ['Protein powder', 'Oats', 'Berries', 'Almond butter', 'Milk', 'Honey'],
        maintain: ['Eggs', 'Vegetables', 'Whole grains', 'Fruit', 'Yogurt', 'Nuts']
      },
      lunch: {
        weight_loss: ['Lean protein', 'Mixed greens', 'Vegetables', 'Olive oil', 'Quinoa', 'Lemon'],
        weight_gain: ['Chicken thigh', 'Brown rice', 'Avocado', 'Nuts', 'Vegetables', 'Olive oil'],
        muscle_gain: ['Lean beef', 'Sweet potato', 'Broccoli', 'Olive oil', 'Quinoa', 'Herbs'],
        maintain: ['Fish or chicken', 'Mixed vegetables', 'Whole grains', 'Healthy fats', 'Herbs', 'Spices']
      },
      dinner: {
        weight_loss: ['White fish', 'Steamed vegetables', 'Leafy greens', 'Herbs', 'Lemon', 'Garlic'],
        weight_gain: ['Salmon', 'Quinoa', 'Roasted vegetables', 'Nuts', 'Olive oil', 'Herbs'],
        muscle_gain: ['Lean steak', 'Sweet potato', 'Asparagus', 'Garlic', 'Herbs', 'Olive oil'],
        maintain: ['Protein of choice', 'Vegetables', 'Complex carbs', 'Healthy fats', 'Seasonings', 'Herbs']
      },
      snack: {
        weight_loss: ['Apple', 'Almond butter', 'Celery', 'Hummus', 'Berries', 'Greek yogurt'],
        weight_gain: ['Trail mix', 'Dried fruit', 'Nuts', 'Seeds', 'Granola', 'Milk'],
        muscle_gain: ['Protein bar', 'Greek yogurt', 'Berries', 'Granola', 'Protein shake', 'Banana'],
        maintain: ['Mixed nuts', 'Fruit', 'Yogurt', 'Vegetables', 'Hummus', 'Whole grains']
      }
    };
    
    return ingredients[mealType as keyof typeof ingredients]?.[goal as keyof typeof ingredients.breakfast] || ingredients[mealType as keyof typeof ingredients]?.maintain || ['Healthy ingredients'];
  };

  const getDefaultInstructions = (mealType: string, goal: string): string[] => {
    const instructions = {
      breakfast: [
        'Start your day with this nutritious meal',
        'Prepare ingredients the night before for quick assembly',
        'Include protein to maintain energy levels throughout the morning',
        'Pair with water or herbal tea for optimal hydration'
      ],
      lunch: [
        'Perfect midday fuel for sustained afternoon energy',
        'Eat when you feel moderately hungry, not starving',
        'Balance protein, carbs, and healthy fats for optimal nutrition',
        'Take time to eat mindfully and enjoy your meal'
      ],
      dinner: [
        'End your day with this satisfying and nutritious meal',
        'Eat 2-3 hours before bedtime for better digestion',
        'Focus on protein and vegetables with moderate carbs',
        'Keep portions appropriate for evening metabolism'
      ],
      snack: [
        'Perfect between-meal energy boost when needed',
        'Choose when you feel genuinely hungry between meals',
        'Focus on protein or healthy fats for satiety',
        'Keep portions controlled to avoid interfering with main meals'
      ]
    };
    
    return instructions[mealType as keyof typeof instructions] || ['Enjoy this healthy meal'];
  };

  const generateWeeklyExercisePlan = (profile: any): ExercisePlan[] => {
    const goal = profile.goal || 'maintain';
    const activityLevel = profile.activity_level || 'moderate';
    
    const exerciseTemplates = {
      weight_loss: [
        { name: 'Cardio (Running)', duration: '30 min', calories_burned: 300, type: 'cardio' },
        { name: 'HIIT Training', duration: '25 min', calories_burned: 250, type: 'hiit' },
        { name: 'Cycling', duration: '45 min', calories_burned: 400, type: 'cardio' },
        { name: 'Swimming', duration: '30 min', calories_burned: 350, type: 'cardio' },
        { name: 'Strength Training', duration: '40 min', calories_burned: 200, type: 'strength' }
      ],
      weight_gain: [
        { name: 'Weight Lifting', duration: '45 min', calories_burned: 180, type: 'strength' },
        { name: 'Compound Exercises', duration: '40 min', calories_burned: 160, type: 'strength' },
        { name: 'Resistance Training', duration: '35 min', calories_burned: 150, type: 'strength' },
        { name: 'Light Cardio', duration: '20 min', calories_burned: 120, type: 'cardio' }
      ],
      muscle_gain: [
        { name: 'Heavy Lifting', duration: '50 min', calories_burned: 200, type: 'strength' },
        { name: 'Progressive Overload', duration: '45 min', calories_burned: 180, type: 'strength' },
        { name: 'Compound Movements', duration: '40 min', calories_burned: 170, type: 'strength' },
        { name: 'Isolation Exercises', duration: '30 min', calories_burned: 140, type: 'strength' }
      ],
      maintain: [
        { name: 'Mixed Training', duration: '35 min', calories_burned: 220, type: 'mixed' },
        { name: 'Moderate Cardio', duration: '30 min', calories_burned: 200, type: 'cardio' },
        { name: 'Strength Training', duration: '40 min', calories_burned: 180, type: 'strength' },
        { name: 'Flexibility & Yoga', duration: '25 min', calories_burned: 100, type: 'flexibility' }
      ]
    };

    const exercises = exerciseTemplates[goal as keyof typeof exerciseTemplates] || exerciseTemplates.maintain;
    
    return days.map((day, index) => ({
      day,
      exercises: index % 7 === 6 ? [{ name: 'Rest Day', duration: 'Full day', calories_burned: 0, type: 'rest' }] : 
                 [exercises[index % exercises.length]]
    }));
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
            onClick={() => setActiveTab('meals')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'meals' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Meal Plan
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'exercises' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
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
              
              <div className="space-y-4">
                {Object.entries(dayPlan.meals).map(([mealType, meal]) => (
                  <div key={mealType} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                        {meal.image_url && meal.image_url.startsWith('https://') ? (
                          <img
                            src={meal.image_url}
                            alt={meal.name}
                            className="w-full h-full rounded-lg object-cover"
                            onLoad={() => console.log(`Image loaded: ${meal.name}`)}
                            onError={() => console.log(`Image failed: ${meal.image_url}`)}
                          />
                        ) : (
                          <span className="text-lg">🍽️</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white capitalize">{mealType}</h4>
                        <p className="text-sm text-slate-400">{meal.calories} calories</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{meal.name}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Calories:</span>
                  <span className="text-white font-semibold">
                    {Object.values(dayPlan.meals).reduce((sum, meal) => sum + meal.calories, 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Click to view details</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'meals' && selectedDay && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{selectedDay} Meal Plan</h2>
            <button 
              onClick={() => setSelectedDay(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Week View
            </button>
          </div>
          
          {weeklyMealPlan.find(day => day.day === selectedDay) && (
            <div className="space-y-6">
              {Object.entries(weeklyMealPlan.find(day => day.day === selectedDay)!.meals).map(([mealType, meal]) => (
                <div key={mealType} className="bg-slate-900 rounded-2xl p-8 border border-slate-700">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white capitalize mb-2">{mealType}</h3>
                      <h4 className="text-xl text-slate-300 mb-4">{meal.name}</h4>
                    </div>
                    {meal.image_url && (
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="w-32 h-32 rounded-xl object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-blue-400">{meal.calories}</div>
                      <div className="text-slate-400 text-sm">Calories</div>
                    </div>
                    {meal.protein && (
                      <div className="bg-slate-800 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-emerald-400">{meal.protein}g</div>
                        <div className="text-slate-400 text-sm">Protein</div>
                      </div>
                    )}
                    {meal.carbs && (
                      <div className="bg-slate-800 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-orange-400">{meal.carbs}g</div>
                        <div className="text-slate-400 text-sm">Carbs</div>
                      </div>
                    )}
                    {meal.fat && (
                      <div className="bg-slate-800 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-purple-400">{meal.fat}g</div>
                        <div className="text-slate-400 text-sm">Fat</div>
                      </div>
                    )}
                  </div>
                  
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-lg font-bold text-white mb-3">Ingredients</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {meal.ingredients.map((ingredient, idx) => (
                          <div key={idx} className="flex items-center bg-slate-800 p-3 rounded-lg">
                            <span className="text-blue-400 mr-3">•</span>
                            <span className="text-slate-200">{ingredient}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {meal.instructions && meal.instructions.length > 0 && (
                    <div>
                      <h5 className="text-lg font-bold text-white mb-3">Instructions</h5>
                      <div className="space-y-3">
                        {meal.instructions.map((instruction, idx) => (
                          <div key={idx} className="flex bg-slate-800 p-4 rounded-lg">
                            <span className="text-blue-400 font-bold mr-4 min-w-[2rem]">{idx + 1}.</span>
                            <span className="text-slate-200">{instruction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'exercises' && !selectedDay && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {weeklyExercisePlan.map((dayPlan, index) => (
            <div 
              key={index} 
              className="bg-slate-900 rounded-2xl p-6 border border-slate-700 cursor-pointer hover:border-slate-600 transition-all"
              onClick={() => setSelectedDay(dayPlan.day)}
            >
              <h3 className="text-xl font-bold text-white mb-4">{dayPlan.day}</h3>
              
              <div className="space-y-4">
                {dayPlan.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{exercise.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exercise.type === 'cardio' ? 'bg-red-500/20 text-red-400' :
                        exercise.type === 'strength' ? 'bg-blue-500/20 text-blue-400' :
                        exercise.type === 'hiit' ? 'bg-orange-500/20 text-orange-400' :
                        exercise.type === 'rest' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {exercise.type}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Duration: {exercise.duration}</span>
                      <span>Burns: {exercise.calories_burned} cal</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Calories Burned:</span>
                  <span className="text-white font-semibold">
                    {dayPlan.exercises.reduce((sum, exercise) => sum + exercise.calories_burned, 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Click to view details</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'exercises' && selectedDay && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{selectedDay} Exercise Plan</h2>
            <button 
              onClick={() => setSelectedDay(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Week View
            </button>
          </div>
          
          {weeklyExercisePlan.find(day => day.day === selectedDay) && (
            <div className="space-y-6">
              {weeklyExercisePlan.find(day => day.day === selectedDay)!.exercises.map((exercise, index) => (
                <div key={index} className="bg-slate-900 rounded-2xl p-8 border border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{exercise.name}</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        exercise.type === 'cardio' ? 'bg-red-500/20 text-red-400' :
                        exercise.type === 'strength' ? 'bg-blue-500/20 text-blue-400' :
                        exercise.type === 'hiit' ? 'bg-orange-500/20 text-orange-400' :
                        exercise.type === 'rest' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {exercise.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 p-6 rounded-xl">
                      <h4 className="text-lg font-bold text-white mb-4">Exercise Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duration:</span>
                          <span className="text-white font-semibold">{exercise.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Calories Burned:</span>
                          <span className="text-white font-semibold">{exercise.calories_burned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Exercise Type:</span>
                          <span className="text-white font-semibold capitalize">{exercise.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 p-6 rounded-xl">
                      <h4 className="text-lg font-bold text-white mb-4">Instructions</h4>
                      <div className="text-slate-300 space-y-2">
                        {exercise.type === 'rest' ? (
                          <p>Take a complete rest day. Focus on recovery, light stretching, or gentle walking.</p>
                        ) : exercise.type === 'cardio' ? (
                          <div className="space-y-2">
                            <p>• Warm up for 5 minutes</p>
                            <p>• Maintain steady pace for main duration</p>
                            <p>• Cool down for 5 minutes</p>
                            <p>• Stay hydrated throughout</p>
                          </div>
                        ) : exercise.type === 'strength' ? (
                          <div className="space-y-2">
                            <p>• Warm up with light cardio (5 min)</p>
                            <p>• Focus on compound movements</p>
                            <p>• 3-4 sets of 8-12 reps</p>
                            <p>• Rest 60-90 seconds between sets</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p>• Follow proper form</p>
                            <p>• Listen to your body</p>
                            <p>• Stay consistent</p>
                            <p>• Track your progress</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;