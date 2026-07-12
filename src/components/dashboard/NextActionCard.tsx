import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, UtensilsCrossed, Droplets, TrendingUp, Check, Timer, Flame } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { TodaysPlan } from '../../lib/planGenerator';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { hapticMedium, hapticLight } from '../../lib/haptics';

interface NextActionCardProps {
  plan: TodaysPlan | null;
  className?: string;
}

// The single "what should I do right now" hero card at the top of Today.
const NextActionCard: React.FC<NextActionCardProps> = ({ plan, className = '' }) => {
  const navigate = useNavigate();
  const { dailyLog, insights } = useDailyLogContext();
  const { targets } = insights;

  const workoutDone = dailyLog.isCompleted('workout', 'workout');
  const nextMeal = plan?.meals.find((m) => !dailyLog.isCompleted('meal', m.key)) ?? null;
  const waterTarget = targets?.waterMl ?? 2500;
  const waterLow = dailyLog.waterMl < waterTarget;

  let content: React.ReactNode;

  if (plan?.workout && !workoutDone) {
    const workout = plan.workout;
    const todayIndex = (new Date().getDay() + 6) % 7;
    content = (
      <>
        <div className="flex items-center gap-2">
          <Badge tone="primary">Up next</Badge>
          <span className="flex items-center gap-1 text-xs text-ink-faint">
            <Timer className="h-3.5 w-3.5" /> {workout.duration}
          </span>
          <span className="flex items-center gap-1 text-xs text-ink-faint">
            <Flame className="h-3.5 w-3.5" /> {workout.calories_burned} kcal
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">{workout.name}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Guided sets, timers, demos, and voice coaching — camera form analysis where supported.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="shadow-glow-primary"
            onClick={() => {
              hapticMedium();
              navigate(`/dashboard/exercise/workout?day=${todayIndex}`);
            }}
          >
            <ScanFace className="mr-2 h-5 w-5" />
            Start Today's Workout
          </Button>
          <button
            onClick={() => {
              hapticLight();
              dailyLog.toggleCompletion({ itemType: 'workout', itemKey: 'workout', itemName: workout.name });
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <Check className="h-4 w-4" />
            Just mark as done
          </button>
        </div>
      </>
    );
  } else if (nextMeal) {
    content = (
      <>
        <Badge tone="primary">Up next</Badge>
        <h2 className="mt-2 font-display text-2xl font-semibold capitalize text-ink sm:text-3xl">
          Log your {nextMeal.key}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {nextMeal.meal.name} · {nextMeal.meal.calories} kcal planned
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              hapticMedium();
              navigate('/dashboard/diet');
            }}
          >
            <UtensilsCrossed className="mr-2 h-5 w-5" />
            <span className="capitalize">Log {nextMeal.key}</span>
          </Button>
          <button
            onClick={() => {
              hapticLight();
              dailyLog.toggleCompletion({
                itemType: 'meal',
                itemKey: nextMeal.key,
                itemName: nextMeal.meal.name,
                calories: nextMeal.meal.calories,
                protein: nextMeal.meal.protein,
                carbs: nextMeal.meal.carbs,
                fat: nextMeal.meal.fat,
              });
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <Check className="h-4 w-4" />
            Ate as planned
          </button>
        </div>
      </>
    );
  } else if (waterLow) {
    content = (
      <>
        <Badge tone="primary">Almost there</Badge>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">Stay hydrated</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {Math.round((waterTarget - dailyLog.waterMl) / 250) * 250} ml to go today.
        </p>
        <div className="mt-4">
          <Button
            size="lg"
            onClick={() => {
              hapticMedium();
              dailyLog.addWater(250);
            }}
          >
            <Droplets className="mr-2 h-5 w-5" />
            Add a glass (250 ml)
          </Button>
        </div>
      </>
    );
  } else {
    content = (
      <>
        <Badge tone="success">All done</Badge>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Everything's checked off today
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Nice work. See how your week is trending.</p>
        <div className="mt-4">
          <Button
            size="lg"
            variant="subtle"
            onClick={() => {
              hapticLight();
              navigate('/dashboard/progress');
            }}
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            View progress
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className={`card-glass-strong bg-hero-gradient overflow-hidden p-6 sm:p-7 ${className}`} data-tour="next-action">
      {content}
    </div>
  );
};

export default NextActionCard;
