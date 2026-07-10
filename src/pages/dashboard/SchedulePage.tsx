import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Utensils, Dumbbell, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { generateWeeklyMealPlan, generateWeeklyExercisePlan, DAYS, MealSlot, Meal } from '../../lib/planGenerator';
import { ExerciseItem } from '../../lib/planGenerator';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type SelectedItem = { kind: 'meal'; slot: MealSlot; meal: Meal } | { kind: 'workout'; workout: ExerciseItem };

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { profile, profileLoading, insights, dailyLog } = useDailyLogContext();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  const { nutritionProfile } = insights;
  const mealPlan = useMemo(() => (nutritionProfile && profile ? generateWeeklyMealPlan(profile) : []), [nutritionProfile, profile]);
  const exercisePlan = useMemo(() => (nutritionProfile && profile ? generateWeeklyExercisePlan(profile) : []), [nutritionProfile, profile]);

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!nutritionProfile) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-display text-3xl font-semibold text-white">Schedule</h1>
        <Card>
          <EmptyState
            icon={UserCog}
            title="Complete your profile"
            description="Add your weight, height, and goal to generate your weekly meal and workout schedule."
            actionLabel="Complete profile"
            onAction={() => navigate('/dashboard/profile')}
            className="py-16"
          />
        </Card>
      </div>
    );
  }

  const dayMeals = mealPlan[selectedDay];
  const dayWorkout = exercisePlan[selectedDay]?.exercises[0];
  const isRest = dayWorkout?.type === 'rest';
  const isToday = selectedDay === todayIndex;

  const totalCalories = Object.values(dayMeals.meals).reduce((sum, m) => sum + (m?.calories || 0), 0);

  return (
    <motion.div className="mx-auto max-w-6xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-white">Schedule</h1>
        <p className="mt-1 text-sm text-gray-400">Your week at a glance — meals and workouts, generated from your goal</p>
      </motion.div>

      <motion.div variants={item} className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              i === selectedDay ? 'bg-primary-500/20 text-white' : 'bg-surface-2 text-gray-400 hover:text-white'
            } ${i === todayIndex ? 'ring-1 ring-primary-400/50' : ''}`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="space-y-3">
        {MEAL_SLOTS.filter((slot) => dayMeals.meals[slot]).map((slot) => {
          const meal = dayMeals.meals[slot]!;
          const done = isToday && dailyLog.isCompleted('meal', slot);
          return (
            <Card key={slot} interactive onClick={() => setSelected({ kind: 'meal', slot, meal })} className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                <Utensils className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{slot}</p>
                <p className="truncate text-sm font-medium text-white">{meal.name}</p>
              </div>
              <span className="flex-shrink-0 text-sm text-gray-400 tabular-nums">{meal.calories} kcal</span>
              {isToday && done && <Badge tone="success">Done</Badge>}
            </Card>
          );
        })}

        {dayWorkout && (
          <Card
            interactive={!isRest}
            onClick={() => !isRest && setSelected({ kind: 'workout', workout: dayWorkout })}
            className="flex items-center gap-4 p-4"
          >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${isRest ? 'bg-success-500/15 text-success-400' : 'bg-hydration-500/15 text-hydration-400'}`}>
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{isRest ? 'Rest day' : 'Workout'}</p>
              <p className="truncate text-sm font-medium text-white">{isRest ? 'Recovery, stretching, or a walk' : dayWorkout.name}</p>
            </div>
            {!isRest && <span className="flex-shrink-0 text-sm text-gray-400">{dayWorkout.duration}</span>}
            {isToday && !isRest && dailyLog.isCompleted('workout', 'workout') && <Badge tone="success">Done</Badge>}
          </Card>
        )}
      </motion.div>

      <motion.div variants={item} className="mt-5">
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-gray-400">Total planned calories</span>
          <span className="font-display text-lg font-semibold text-white tabular-nums">{totalCalories.toLocaleString()} kcal</span>
        </Card>
      </motion.div>

      <Modal open={!!selected} onClose={() => setSelected(null)} panelClassName="max-w-lg max-h-[80vh] overflow-y-auto">
        {selected?.kind === 'meal' && (
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{selected.slot}</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-white">{selected.meal.name}</h2>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                ['Calories', selected.meal.calories, ''],
                ['Protein', selected.meal.protein, 'g'],
                ['Carbs', selected.meal.carbs, 'g'],
                ['Fat', selected.meal.fat, 'g'],
              ].map(([label, val, unit]) => (
                <div key={label as string} className="rounded-lg bg-surface-2 p-2">
                  <p className="text-sm font-bold text-white tabular-nums">{val}{unit}</p>
                  <p className="text-[10px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Ingredients</p>
              <ul className="space-y-1 text-sm text-gray-300">
                {selected.meal.ingredients.map((ing, i) => <li key={i}>• {ing}</li>)}
              </ul>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Instructions</p>
              <ol className="space-y-1 text-sm text-gray-300">
                {selected.meal.instructions.map((ins, i) => <li key={i}>{i + 1}. {ins}</li>)}
              </ol>
            </div>
            <Button variant="ghost" className="mt-5 w-full" onClick={() => setSelected(null)}>Close</Button>
          </div>
        )}

        {selected?.kind === 'workout' && (
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{selected.workout.type}</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-white">{selected.workout.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-sm font-bold text-white">{selected.workout.duration}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-sm font-bold text-white">{selected.workout.calories_burned} kcal</p>
                <p className="text-xs text-gray-500">Estimated burn</p>
              </div>
            </div>
            <Button variant="ghost" className="mt-5 w-full" onClick={() => setSelected(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default SchedulePage;
