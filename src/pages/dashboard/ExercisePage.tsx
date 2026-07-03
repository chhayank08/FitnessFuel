import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Clock, Dumbbell, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { toast } from 'react-hot-toast';

type Exercise = {
  name: string;
  category: string;
  sets: number;
  reps: number;
  rest_seconds: number;
};

type WorkoutDay = {
  day: string;
  type: 'workout' | 'rest';
  exercises: Exercise[];
  estimated_duration?: number;
  notes?: string;
};

type WorkoutPlan = {
  workout_plan: WorkoutDay[];
  intensity: string;
  goal: string;
  duration_weeks: number;
  notes: string;
};

type ExercisePlan = {
  id: string;
  name: string;
  description: string | null;
  duration: number | null;
  difficulty: string | null;
  created_at: string;
};

const ExercisePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (user) {
      fetchExercisePlans();
      fetchWorkoutRecommendations();
    }
  }, [user]);
  
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

  const generateWeeklyExercisePlan = (profile: any) => {
    const goal = profile.goal || 'maintain';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
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
    
    const workoutPlan: WorkoutPlan = {
      workout_plan: days.map((day, index) => ({
        day,
        type: index % 7 === 6 ? 'rest' : 'workout',
        exercises: index % 7 === 6 ? [] : [
          {
            name: exercises[index % exercises.length].name,
            category: exercises[index % exercises.length].type,
            sets: 3,
            reps: 12,
            rest_seconds: 60
          }
        ],
        estimated_duration: index % 7 === 6 ? 0 : parseInt(exercises[index % exercises.length].duration),
        notes: index % 7 === 6 ? 'Take a complete rest day. Focus on recovery, light stretching, or gentle walking.' : ''
      })),
      intensity: goal === 'weight_loss' ? 'High' : goal === 'weight_gain' || goal === 'muscle_gain' ? 'Moderate' : 'Balanced',
      goal: goal,
      duration_weeks: 4,
      notes: `Personalized ${goal.replace('_', ' ')} workout plan based on your profile.`
    };
    
    return workoutPlan;
  };

  const fetchWorkoutRecommendations = async () => {
    try {
      const userProfile = await fetchUserProfile();
      if (!userProfile) {
        toast.error('Please complete your profile first');
        return;
      }

      const generatedPlan = generateWeeklyExercisePlan(userProfile);
      setWorkoutPlan(generatedPlan);
    } catch (error: any) {
      console.error('Error generating workout recommendations:', error);
      toast.error('Failed to generate workout recommendations');
    }
  };

  const fetchExercisePlans = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('exercise_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setExercisePlans(data);
      }
    } catch (error) {
      console.error('Error fetching exercise plans:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty: string | null) => {
    if (!difficulty) return 'bg-gray-500';
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'low':
        return 'bg-green-500';
      case 'intermediate':
      case 'moderate':
        return 'bg-primary-500';
      case 'advanced':
      case 'high':
        return 'bg-secondary-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cardio':
        return 'bg-red-500';
      case 'strength':
        return 'bg-blue-500';
      case 'core':
        return 'bg-yellow-500';
      case 'functional':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderWorkoutDay = (day: WorkoutDay) => {
    if (day.type === 'rest') {
      return (
        <div key={day.day} className="bg-dark-500 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-primary-500 mr-2" />
            <h3 className="text-xl font-semibold text-white">{day.day}</h3>
            <span className="ml-2 px-2 py-1 text-xs font-medium text-white rounded-full bg-green-500">
              Rest Day
            </span>
          </div>
          <p className="text-gray-400">{day.notes}</p>
        </div>
      );
    }

    return (
      <div key={day.day} className="bg-dark-500 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Dumbbell className="h-6 w-6 text-primary-500 mr-2" />
            <h3 className="text-xl font-semibold text-white">{day.day}</h3>
          </div>
          <div className="flex items-center text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">{day.estimated_duration} min</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {day.exercises.map((exercise, idx) => (
            <div key={idx} className="bg-dark-400 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{exercise.name}</h4>
                <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getCategoryColor(exercise.category)}`}>
                  {exercise.category}
                </span>
              </div>
              <div className="flex items-center text-gray-300 text-sm space-x-4">
                <span>{exercise.sets} sets</span>
                <span>{exercise.reps} reps</span>
                <span>{exercise.rest_seconds}s rest</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const filteredExercisePlans = exercisePlans.filter(plan => 
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Exercise Plans</h1>
          <p className="text-gray-400 mt-1">Your personalized workout recommendations</p>
        </div>
        
        <button 
          onClick={fetchWorkoutRecommendations}
          className="mt-4 md:mt-0 flex items-center bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          <Plus className="mr-2 h-5 w-5" />
          Refresh Recommendations
        </button>
      </div>

      {/* AI Workout Plan */}
      {workoutPlan && (
        <div className="mb-8">
          <div className="bg-dark-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Personalized Workout Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-primary-400">{workoutPlan.intensity}</h3>
                <p className="text-gray-400">Intensity</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-primary-400">{workoutPlan.goal}</h3>
                <p className="text-gray-400">Goal</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-primary-400">{workoutPlan.duration_weeks} weeks</h3>
                <p className="text-gray-400">Duration</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{workoutPlan.notes}</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {workoutPlan.workout_plan.map(renderWorkoutDay)}
          </div>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="bg-dark-500 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full p-2 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select className="p-2 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      
      {/* Saved Exercise Plans Section */}
      <h2 className="text-xl font-semibold text-white mb-4">Your Saved Exercise Plans</h2>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredExercisePlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercisePlans.map((plan) => (
            <div key={plan.id} className="bg-dark-500 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  {plan.difficulty && (
                    <span className={`ml-2 px-2 py-1 text-xs font-medium text-white rounded-full ${getDifficultyColor(plan.difficulty)}`}>
                      {plan.difficulty}
                    </span>
                  )}
                </div>
                
                {plan.description && (
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                )}
                
                <div className="flex items-center mb-4">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-white">{plan.duration ? `${plan.duration} minutes` : 'Duration not set'}</span>
                </div>
                
                <div className="flex justify-between">
                  <button className="flex items-center text-primary-400 hover:text-primary-300 transition duration-150">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button className="flex items-center text-secondary-500 hover:text-secondary-400 transition duration-150">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-500 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-300 mb-4">No exercise plans found. Create your first workout to get started!</p>
          <button className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
            <Plus className="mr-2 h-5 w-5" />
            Create New Workout
          </button>
        </div>
      )}
    </div>
  );
};

export default ExercisePage;
