import React from 'react';
import { Check, Dumbbell, UtensilsCrossed, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { TodaysPlan } from '../../lib/planGenerator';
import { CompletionInput } from '../../hooks/useDailyLog';

interface TodaysPlanCardProps {
  plan: TodaysPlan | null; // null while the profile is incomplete
  isCompleted: (itemType: 'meal' | 'workout', itemKey: string) => boolean;
  onToggle: (item: CompletionInput) => void;
  className?: string;
}

const CheckRow: React.FC<{
  checked: boolean;
  title: string;
  subtitle: string;
  meta: string;
  icon: React.ReactNode;
  onToggle: () => void;
}> = ({ checked, title, subtitle, meta, icon, onToggle }) => (
  <button
    onClick={onToggle}
    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
  >
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
        checked
          ? 'border-success-500 bg-success-500 text-surface-base'
          : 'border-surface-line-strong bg-transparent group-hover:border-gray-400'
      }`}
    >
      {checked && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      )}
    </span>
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2 text-gray-400">
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className={`block truncate text-sm font-medium transition-colors ${checked ? 'text-gray-500 line-through' : 'text-white'}`}>
        {title}
      </span>
      <span className="block text-xs capitalize text-gray-500">{subtitle}</span>
    </span>
    <span className="flex-shrink-0 text-xs text-gray-400 tabular-nums">{meta}</span>
  </button>
);

const TodaysPlanCard: React.FC<TodaysPlanCardProps> = ({ plan, isCompleted, onToggle, className = '' }) => {
  const navigate = useNavigate();

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Today's plan</h3>
        {plan && (
          <span className="text-xs text-gray-500">
            {plan.meals.filter((m) => isCompleted('meal', m.key)).length +
              (plan.workout && isCompleted('workout', 'workout') ? 1 : 0)}
            /{plan.meals.length + (plan.workout ? 1 : 0)} done
          </span>
        )}
      </div>

      {!plan ? (
        <EmptyState
          icon={UserCog}
          title="No plan yet"
          description="Complete your profile and your daily meals and workout will show up here."
          actionLabel="Get started"
          onAction={() => navigate('/dashboard/welcome')}
        />
      ) : (
        <div className="mt-3 space-y-1">
          {plan.meals.map(({ key, meal }) => (
            <CheckRow
              key={key}
              checked={isCompleted('meal', key)}
              title={meal.name}
              subtitle={key}
              meta={`${meal.calories} kcal`}
              icon={<UtensilsCrossed className="h-4 w-4" />}
              onToggle={() =>
                onToggle({
                  itemType: 'meal',
                  itemKey: key,
                  itemName: meal.name,
                  calories: meal.calories,
                  protein: meal.protein,
                  carbs: meal.carbs,
                  fat: meal.fat,
                })
              }
            />
          ))}

          {plan.workout ? (
            <CheckRow
              checked={isCompleted('workout', 'workout')}
              title={plan.workout.name}
              subtitle="workout"
              meta={plan.workout.duration}
              icon={<Dumbbell className="h-4 w-4" />}
              onToggle={() =>
                onToggle({ itemType: 'workout', itemKey: 'workout', itemName: plan.workout!.name })
              }
            />
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-success-500/10 px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-500/15 text-success-400">
                <Dumbbell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Rest day</p>
                <p className="text-xs text-gray-400">Recovery, light stretching, or a gentle walk.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TodaysPlanCard;
