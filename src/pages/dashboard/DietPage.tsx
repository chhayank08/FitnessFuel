import React, { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];


interface Recipe {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  instructions: string[];
  ingredients: string[];
  rating: number;
  image_url: string;
  recipe_id?: string;
  meal_type?: string;
}

type DietPlan = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  daily_calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Recipe[];
  created_at: string;
};

const DietPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<DietPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Recipe | null>(null);


  const fetchUserProfile = async () => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const fetchMLRecommendations = async (userProfile: any) => {
    try {
      const defaultData = {
        daily_calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67,
        meals: [],
        meal_analytics: {},
        goal_insights: {}
      };

      if (!userProfile.weight || !userProfile.height) {
        toast.error('Please update your profile with weight and height information');
        return defaultData;
      }

      const response = await axios.post('http://localhost:3000/api/diet/recommend', {
        weight: parseFloat(userProfile.weight),
        height: parseFloat(userProfile.height),
        age: parseInt(userProfile.age || '30'),
        gender: userProfile.gender || 'male',
        activity_level: userProfile.activity_level || 'moderate',
        goal: userProfile.goal || 'maintain',
        // Meal count will be calculated automatically based on macros
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      return {
        daily_calories: response.data.daily_calories || 2000,
        protein: response.data.protein || 150,
        carbs: response.data.carbs || 250,
        fat: response.data.fat || 67,
        fiber: response.data.fiber || 30,
        water_ml: response.data.water_ml || 2500,
        tdee: response.data.tdee || 2000,
        bmr: response.data.bmr || 1600,
        bmi: response.data.bmi || 22,
        meals: Array.isArray(response.data.meals) ? response.data.meals : [],
        meal_analytics: response.data.meal_analytics || {},
        goal_insights: response.data.goal_insights || {}
      };
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch diet recommendations');
      return {
        daily_calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67,
        meals: [],
        meal_analytics: {},
        goal_insights: {}
      };
    }
  };

  const generateMealPlanCharts = (plan: DietPlan) => {
    // Enhanced calorie distribution based on actual meals
    const mealCalories = plan.meals.reduce((acc, meal) => {
      acc[meal.meal_type] = (acc[meal.meal_type] || 0) + meal.calories;
      return acc;
    }, {} as Record<string, number>);

    const calorieDistribution = Object.entries(mealCalories).map(([type, calories], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: calories,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D'][index % 5]
    }));

    const macroDistribution = [
      { 
        name: 'Protein', 
        value: plan.protein, 
        calories: plan.protein * 4,
        percentage: Math.round((plan.protein * 4 / plan.daily_calories) * 100),
        color: '#6366F1',
        target: plan.protein,
        actual: plan.meals.reduce((sum, meal) => sum + meal.protein, 0)
      },
      { 
        name: 'Carbs', 
        value: plan.carbs, 
        calories: plan.carbs * 4,
        percentage: Math.round((plan.carbs * 4 / plan.daily_calories) * 100),
        color: '#10B981',
        target: plan.carbs,
        actual: plan.meals.reduce((sum, meal) => sum + meal.carbs, 0)
      },
      { 
        name: 'Fat', 
        value: plan.fat, 
        calories: plan.fat * 9,
        percentage: Math.round((plan.fat * 9 / plan.daily_calories) * 100),
        color: '#F59E0B',
        target: plan.fat,
        actual: plan.meals.reduce((sum, meal) => sum + meal.fat, 0)
      }
    ];

    // Simulated weekly progress with goal-based trends
    const goalTrend = plan.goal_insights?.weekly_weight_change_estimate || 0;
    const weeklyCalories = Array.from({ length: 7 }, (_, i) => {
      const baseVariation = (Math.random() - 0.5) * 150;
      const trendAdjustment = goalTrend * 500 * (i / 7); // Gradual trend
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        calories: Math.round(plan.daily_calories + baseVariation + trendAdjustment),
        target: plan.daily_calories,
        burned: Math.round(plan.tdee + baseVariation * 0.5)
      };
    });

    // Enhanced macro comparison with actual vs target
    const macroComparison = [
      { 
        nutrient: 'Protein', 
        current: plan.meals.reduce((sum, meal) => sum + meal.protein, 0), 
        recommended: plan.protein, 
        unit: 'g',
        importance: 'High'
      },
      { 
        nutrient: 'Carbs', 
        current: plan.meals.reduce((sum, meal) => sum + meal.carbs, 0), 
        recommended: plan.carbs, 
        unit: 'g',
        importance: 'Medium'
      },
      { 
        nutrient: 'Fat', 
        current: plan.meals.reduce((sum, meal) => sum + meal.fat, 0), 
        recommended: plan.fat, 
        unit: 'g',
        importance: 'Medium'
      },
      { 
        nutrient: 'Fiber', 
        current: plan.fiber || 25, 
        recommended: plan.fiber || 30, 
        unit: 'g',
        importance: 'High'
      },
      { 
        nutrient: 'Water', 
        current: (plan.water_ml || 2500) / 1000, 
        recommended: (plan.water_ml || 2500) / 1000, 
        unit: 'L',
        importance: 'High'
      }
    ];

    return (
      <div className="space-y-8 mt-8">
        {/* Professional Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Enhanced Calorie Distribution */}
          <div className="xl:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Meal Distribution</h3>
                <p className="text-slate-400 text-sm">Calories per meal type</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {plan.daily_calories}
                </div>
                <p className="text-slate-400 text-xs">Total calories</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calorieDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#CBD5E1" 
                    fontSize={12} 
                    fontWeight={500}
                    tick={{ fill: '#CBD5E1' }}
                  />
                  <YAxis 
                    stroke="#CBD5E1" 
                    fontSize={12}
                    tick={{ fill: '#CBD5E1' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #3B82F6',
                      borderRadius: '16px',
                      color: '#F8FAFC',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                      backdropFilter: 'blur(16px)'
                    }}
                    labelStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#barGradient)" 
                    radius={[8, 8, 0, 0]}
                    stroke="#3B82F6"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Advanced Macro Analysis */}
          <div className="xl:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Macronutrient Profile</h3>
                <p className="text-slate-400 text-sm">Target vs Actual distribution</p>
              </div>
              <div className="flex space-x-3">
                {macroDistribution.map((macro, i) => (
                  <div key={i} className="flex items-center bg-slate-800 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: macro.color}}></div>
                    <span className="text-xs text-slate-300 font-medium">{macro.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <Pie
                    data={macroDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    stroke="#1E293B"
                    strokeWidth={2}
                    filter="url(#shadow)"
                  >
                    {macroDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-600 backdrop-blur-sm">
                            <p className="text-white font-bold text-lg mb-2">{data.name}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target:</span>
                                <span className="text-white font-semibold">{data.target}g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Actual:</span>
                                <span className="text-white font-semibold">{data.actual}g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Calories:</span>
                                <span className="text-white font-semibold">{data.calories}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">% of Total:</span>
                                <span className="text-white font-semibold">{data.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Weekly Calorie Trend</h3>
                <p className="text-slate-400 text-sm">Intake vs Expenditure analysis</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                  <span className="text-xs text-slate-300">Intake</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-xs text-slate-300">Burned</span>
                </div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCalories} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="intakeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="burnedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#CBD5E1" 
                    fontSize={12} 
                    fontWeight={500}
                    tick={{ fill: '#CBD5E1' }}
                  />
                  <YAxis 
                    stroke="#CBD5E1" 
                    fontSize={12}
                    tick={{ fill: '#CBD5E1' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #10B981',
                      borderRadius: '16px',
                      color: '#F8FAFC',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                    }}
                  />
                  <Bar dataKey="calories" fill="url(#intakeGradient)" radius={[6, 6, 0, 0]} name="Calories Intake" />
                  <Bar dataKey="burned" fill="url(#burnedGradient)" radius={[6, 6, 0, 0]} name="Calories Burned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Nutrition Goals</h3>
              <p className="text-slate-400 text-sm">Daily targets vs actual intake</p>
            </div>
            <div className="space-y-5">
              {macroComparison.map((item, index) => {
                const percentage = (item.current / item.recommended) * 100;
                const isOnTrack = percentage >= 90 && percentage <= 110;
                const isOver = percentage > 110;
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold text-sm">{item.nutrient}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.importance === 'High' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {item.importance}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-bold text-sm">
                          {item.current}{item.unit}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">
                          / {item.recommended}{item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ease-out relative ${
                            isOnTrack ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                            isOver ? 'bg-gradient-to-r from-orange-500 to-red-500' : 
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="absolute -top-1 right-0 transform translate-x-2">
                        <span className={`text-xs font-bold ${
                          isOnTrack ? 'text-emerald-400' : 
                          isOver ? 'text-orange-400' : 'text-blue-400'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comprehensive Nutrition Analytics */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Comprehensive Nutrition Analysis</h3>
            <p className="text-slate-400">Detailed breakdown of your personalized nutrition plan</p>
          </div>
          
          {/* Goal Insights */}
          {plan.goal_insights && (
            <div className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-600">
              <h4 className="text-lg font-bold text-white mb-4">Goal Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{plan.goal_insights.goal}</div>
                  <div className="text-slate-400 text-sm">Current Goal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">{plan.goal_insights.bmi_category}</div>
                  <div className="text-slate-400 text-sm">BMI Category</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    plan.goal_insights.weekly_weight_change_estimate > 0 ? 'text-orange-400' : 
                    plan.goal_insights.weekly_weight_change_estimate < 0 ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    {plan.goal_insights.weekly_weight_change_estimate > 0 ? '+' : ''}
                    {plan.goal_insights.weekly_weight_change_estimate} lbs
                  </div>
                  <div className="text-slate-400 text-sm">Weekly Change Est.</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Macro Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {macroDistribution.map((macro, index) => (
              <div key={index} className="bg-slate-800/50 p-6 rounded-xl border border-slate-600 hover:border-slate-500 transition-all">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-5 h-5 rounded-full mr-3 shadow-lg"
                    style={{ backgroundColor: macro.color }}
                  ></div>
                  <h4 className="text-white font-bold text-lg">{macro.name}</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target:</span>
                    <span className="text-white font-bold">{macro.target}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Actual:</span>
                    <span className="text-white font-bold">{macro.actual}g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Calories:</span>
                    <span className="text-white font-bold">{macro.calories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">% of Total:</span>
                    <span className="text-white font-bold">{macro.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Per kg body:</span>
                    <span className="text-white font-bold">
                      {((macro.actual || macro.target) / (plan.bmi ? Math.sqrt(plan.bmi * (plan.tdee/25)) : 70)).toFixed(1)}g/kg
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((macro.actual / macro.target) * 100, 100)}%`,
                          backgroundColor: macro.color
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Metrics */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600">
              <div className="text-2xl font-bold text-blue-400 mb-1">{plan.bmr}</div>
              <div className="text-slate-400 text-sm">BMR (cal/day)</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{plan.tdee}</div>
              <div className="text-slate-400 text-sm">TDEE (cal/day)</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600">
              <div className="text-2xl font-bold text-purple-400 mb-1">{plan.bmi}</div>
              <div className="text-slate-400 text-sm">BMI</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-600">
              <div className="text-2xl font-bold text-orange-400 mb-1">{(plan.water_ml/1000).toFixed(1)}L</div>
              <div className="text-slate-400 text-sm">Water Goal</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMealCard = (recipe: Recipe) => {
    const totalMacros = recipe.protein + recipe.carbs + recipe.fat;
    const proteinPercent = (recipe.protein / totalMacros) * 100;
    const carbsPercent = (recipe.carbs / totalMacros) * 100;
    const fatPercent = (recipe.fat / totalMacros) * 100;
    const proteinDensity = (recipe.protein / recipe.calories) * 100;

    return (
      <div 
        key={recipe.recipe_id} 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl group"
        onClick={() => setSelectedMeal(recipe)}
      >
        <div className="relative overflow-hidden">
          {recipe.image_url && recipe.image_url.startsWith('https://') ? (
            <img 
              src={recipe.image_url}
              alt={recipe.name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
              onLoad={() => console.log(`Recipe image loaded: ${recipe.name}`)}
              onError={() => console.log(`Recipe image failed: ${recipe.image_url}`)}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🍽️</div>
                <span className="text-slate-400 text-sm">No Image Available</span>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
              recipe.meal_type === 'breakfast' ? 'bg-amber-500/90 text-white' :
              recipe.meal_type === 'lunch' ? 'bg-emerald-500/90 text-white' :
              recipe.meal_type === 'dinner' ? 'bg-blue-500/90 text-white' :
              'bg-purple-500/90 text-white'
            }`}>
              {recipe.meal_type?.toUpperCase()}
            </span>
          </div>
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center space-x-2">
              <div className="flex text-yellow-400">
                {'★'.repeat(Math.floor(recipe.rating))}
              </div>
              <span className="text-white text-sm font-medium">{recipe.rating}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {recipe.name}
              </h4>
              {recipe.protein_density && (
                <p className="text-slate-400 text-sm">
                  Protein density: {recipe.protein_density}%
                </p>
              )}
              {recipe.prep_time && (
                <p className="text-slate-400 text-sm">
                  Prep: {recipe.prep_time} • Cook: {recipe.cook_time || '20 mins'}
                </p>
              )}
            </div>
            {recipe.servings && (
              <div className="text-right">
                <div className="text-emerald-400 font-bold text-sm">Servings</div>
                <div className="text-slate-300 text-xs">{recipe.servings}</div>
              </div>
            )}
          </div>
          
          {/* Enhanced Nutrition Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-slate-700">
              <p className="text-slate-400 text-xs mb-1">Calories</p>
              <p className="text-blue-400 font-bold text-lg">{recipe.calories}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-slate-700">
              <p className="text-slate-400 text-xs mb-1">Protein</p>
              <p className="text-emerald-400 font-bold text-lg">{recipe.protein}g</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-slate-700">
              <p className="text-slate-400 text-xs mb-1">Carbs</p>
              <p className="text-orange-400 font-bold text-lg">{recipe.carbs}g</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-slate-700">
              <p className="text-slate-400 text-xs mb-1">Fat</p>
              <p className="text-purple-400 font-bold text-lg">{recipe.fat}g</p>
            </div>
          </div>

          {/* Advanced Macro Visualization */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-white font-semibold text-sm">Macro Distribution</p>
              <p className="text-slate-400 text-xs">Protein: {proteinDensity.toFixed(1)}% density</p>
            </div>
            <div className="relative">
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-700">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" 
                  style={{ width: `${proteinPercent}%` }}
                  title={`Protein: ${proteinPercent.toFixed(1)}%`}
                ></div>
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500" 
                  style={{ width: `${carbsPercent}%` }}
                  title={`Carbs: ${carbsPercent.toFixed(1)}%`}
                ></div>
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500" 
                  style={{ width: `${fatPercent}%` }}
                  title={`Fat: ${fatPercent.toFixed(1)}%`}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-emerald-400">{proteinPercent.toFixed(0)}%</span>
                <span className="text-orange-400">{carbsPercent.toFixed(0)}%</span>
                <span className="text-purple-400">{fatPercent.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Ingredients Preview */}
          <div className="mb-4">
            <h5 className="font-bold text-white mb-3 text-sm">Key Ingredients</h5>
            <div className="flex flex-wrap gap-2">
              {recipe.ingredients.slice(0, 5).map((ingredient, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300 border border-slate-600">
                  {ingredient}
                </span>
              ))}
              {recipe.ingredients.length > 5 && (
                <span className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-400 border border-slate-600">
                  +{recipe.ingredients.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const userProfile = await fetchUserProfile();
        if (userProfile) {
          const recommendations = await fetchMLRecommendations(userProfile);
          if (recommendations) {
            const newPlan: DietPlan = {
              id: 'temp-' + Date.now(),
              user_id: user.id,
              name: 'Daily Plan',
              description: 'AI Generated Diet Plan',
              daily_calories: recommendations.daily_calories,
              protein: recommendations.protein,
              carbs: recommendations.carbs,
              fat: recommendations.fat,
              fiber: recommendations.fiber,
              water_ml: recommendations.water_ml,
              tdee: recommendations.tdee,
              bmr: recommendations.bmr,
              bmi: recommendations.bmi,
              meals: recommendations.meals,
              meal_analytics: recommendations.meal_analytics,
              goal_insights: recommendations.goal_insights,
              created_at: new Date().toISOString()
            };
            setCurrentPlan(newPlan);
          }
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Personalized Diet Plan</h1>
          <p className="text-slate-400">AI-optimized nutrition recommendations for your goals</p>
        </div>
        {currentPlan?.goal_insights && (
          <div className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-3 rounded-xl border border-blue-500/30">
            <div className="text-center">
              <div className="text-lg font-bold text-white capitalize">{currentPlan.goal_insights.goal}</div>
              <div className="text-blue-400 text-sm">{currentPlan.goal_insights.bmi_category}</div>
            </div>
          </div>
        )}
      </div>

      {currentPlan && (
        <>
          {/* Professional Nutrition Overview */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 mb-10 border border-slate-700 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Calories */}
              <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 p-6 rounded-2xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Daily Calories</h3>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                    Target
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {currentPlan.daily_calories}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <div className="text-sm text-slate-400">BMR</div>
                    <div className="text-lg font-bold text-white">{currentPlan.bmr || 1600}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <div className="text-sm text-slate-400">TDEE</div>
                    <div className="text-lg font-bold text-white">{currentPlan.tdee || 2000}</div>
                  </div>
                </div>
              </div>
              
              {/* Protein */}
              <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 p-6 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Protein</h3>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    {Math.round((currentPlan.protein * 4 / currentPlan.daily_calories) * 100)}%
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">{currentPlan.protein}g</div>
                  <div className="text-lg text-slate-400">{currentPlan.protein * 4} calories</div>
                </div>
                <div className="mt-4 p-2 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-sm text-slate-400">Per kg bodyweight</div>
                  <div className="text-lg font-bold text-white">
                    {(currentPlan.protein / (currentPlan.bmi ? Math.sqrt(currentPlan.bmi * 10) : 70)).toFixed(1)}g/kg
                  </div>
                </div>
              </div>
              
              {/* Carbs & Fat */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-orange-600/10 to-orange-800/10 p-4 rounded-2xl border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Carbohydrates</h3>
                    <div className="px-2 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400">
                      {Math.round((currentPlan.carbs * 4 / currentPlan.daily_calories) * 100)}%
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <div className="text-2xl font-bold text-orange-400">{currentPlan.carbs}g</div>
                    <div className="text-sm text-slate-400">{currentPlan.carbs * 4} calories</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 p-4 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Fats</h3>
                    <div className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400">
                      {Math.round((currentPlan.fat * 9 / currentPlan.daily_calories) * 100)}%
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <div className="text-2xl font-bold text-purple-400">{currentPlan.fat}g</div>
                    <div className="text-sm text-slate-400">{currentPlan.fat * 9} calories</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-700">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400 mb-1">{currentPlan.bmi || 22}</div>
                <div className="text-slate-400 text-sm">BMI</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400 mb-1">{currentPlan.fiber || 30}g</div>
                <div className="text-slate-400 text-sm">Fiber</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400 mb-1">{((currentPlan.water_ml || 2500)/1000).toFixed(1)}L</div>
                <div className="text-slate-400 text-sm">Water</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400 mb-1">{currentPlan.meals.length}</div>
                <div className="text-slate-400 text-sm">Meals</div>
              </div>
            </div>
          </div>

          {generateMealPlanCharts(currentPlan)}

          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Your Personalized Meal Plan</h2>
              <div className="text-sm text-gray-400">
                {currentPlan.meals.length} meals • Total: {currentPlan.meals.reduce((sum, meal) => sum + meal.calories, 0)} calories
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentPlan.meals.map((meal) => renderMealCard(meal))}
            </div>
            
            {/* Meal Summary */}
            <div className="mt-8 bg-dark-500 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Meal Plan Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-3">Total Nutrition</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Calories:</span>
                      <span className="text-white font-semibold">
                        {currentPlan.meals.reduce((sum, meal) => sum + meal.calories, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Protein:</span>
                      <span className="text-white font-semibold">
                        {currentPlan.meals.reduce((sum, meal) => sum + meal.protein, 0)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Carbs:</span>
                      <span className="text-white font-semibold">
                        {currentPlan.meals.reduce((sum, meal) => sum + meal.carbs, 0)}g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Fat:</span>
                      <span className="text-white font-semibold">
                        {currentPlan.meals.reduce((sum, meal) => sum + meal.fat, 0)}g
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-3">Meal Distribution</h4>
                  <div className="space-y-2 text-sm">
                    {['breakfast', 'lunch', 'dinner'].map(mealType => {
                      const mealCount = currentPlan.meals.filter(meal => meal.meal_type === mealType).length;
                      const mealCalories = currentPlan.meals
                        .filter(meal => meal.meal_type === mealType)
                        .reduce((sum, meal) => sum + meal.calories, 0);
                      return (
                        <div key={mealType} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{mealType}:</span>
                          <span className="text-white font-semibold">
                            {mealCount} meal{mealCount !== 1 ? 's' : ''} ({mealCalories} cal)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Enhanced Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedMeal.name}</h2>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      selectedMeal.meal_type === 'breakfast' ? 'bg-amber-500/20 text-amber-400' :
                      selectedMeal.meal_type === 'lunch' ? 'bg-emerald-500/20 text-emerald-400' :
                      selectedMeal.meal_type === 'dinner' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {selectedMeal.meal_type?.toUpperCase()}
                    </span>
                    <div className="flex items-center text-yellow-400">
                      {'★'.repeat(Math.floor(selectedMeal.rating))}
                      <span className="ml-1 text-white">{selectedMeal.rating}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMeal(null)}
                  className="text-slate-400 hover:text-white text-3xl transition-colors p-2 hover:bg-slate-800 rounded-full"
                >
                  ×
                </button>
              </div>
              
              {/* Enhanced Nutrition Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{selectedMeal.calories}</div>
                  <div className="text-slate-400 text-sm font-medium">Calories</div>
                </div>
                <div className="text-center bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{selectedMeal.protein}g</div>
                  <div className="text-slate-400 text-sm font-medium">Protein</div>
                </div>
                <div className="text-center bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="text-3xl font-bold text-orange-400 mb-2">{selectedMeal.carbs}g</div>
                  <div className="text-slate-400 text-sm font-medium">Carbs</div>
                </div>
                <div className="text-center bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{selectedMeal.fat}g</div>
                  <div className="text-slate-400 text-sm font-medium">Fat</div>
                </div>
              </div>
              
              {/* Meal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {selectedMeal.prep_time && (
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 text-center">
                    <div className="text-slate-400 text-sm mb-1">Prep Time</div>
                    <div className="text-white font-bold">{selectedMeal.prep_time}</div>
                  </div>
                )}
                {selectedMeal.cook_time && (
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 text-center">
                    <div className="text-slate-400 text-sm mb-1">Cook Time</div>
                    <div className="text-white font-bold">{selectedMeal.cook_time}</div>
                  </div>
                )}
                {selectedMeal.servings && (
                  <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 text-center">
                    <div className="text-slate-400 text-sm mb-1">Servings</div>
                    <div className="text-white font-bold">{selectedMeal.servings}</div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ingredients Section */}
                <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Ingredients</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedMeal.ingredients.map((ingredient, idx) => (
                      <div key={idx} className="flex items-center bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                        <span className="text-blue-400 mr-3 text-lg">•</span>
                        <span className="text-slate-200 font-medium">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Instructions Section */}
                <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Instructions</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedMeal.instructions.map((instruction, idx) => (
                      <div key={idx} className="flex bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                        <span className="text-blue-400 font-bold mr-4 text-lg min-w-[2rem]">{idx + 1}.</span>
                        <span className="text-slate-200 leading-relaxed">{instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Additional Nutrition Info */}
              <div className="mt-8 bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Nutrition Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">{selectedMeal.protein * 4}</div>
                    <div className="text-slate-400 text-sm">Protein Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-400">{selectedMeal.carbs * 4}</div>
                    <div className="text-slate-400 text-sm">Carb Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">{selectedMeal.fat * 9}</div>
                    <div className="text-slate-400 text-sm">Fat Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{((selectedMeal.protein / selectedMeal.calories) * 100).toFixed(1)}%</div>
                    <div className="text-slate-400 text-sm">Protein Density</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietPage;