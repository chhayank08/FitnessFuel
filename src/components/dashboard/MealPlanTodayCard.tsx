import React from 'react';
import { RefreshCcw, RotateCcw, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../ui/Card';
import { TodaysPlan, MealSlot } from '../../lib/planGenerator';
import { hapticLight } from '../../lib/haptics';

export const MEAL_IMAGES: Record<string, string> = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  lunch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  snack: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
};

interface MealPlanTodayCardProps {
  plan: TodaysPlan | null;
  isCompleted: (type: 'meal' | 'workout', key: string) => boolean;
  onToggle: (item: {
    itemType: 'meal' | 'workout';
    itemKey: string;
    itemName: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) => void;
  onReplace: (slot: MealSlot) => { name: string } | null;
  onReset: (slot: MealSlot) => void;
  isOverridden: (slot: MealSlot) => boolean;
  className?: string;
}

// Today's meal plan with per-meal quick actions: log, replace, reset.
const MealPlanTodayCard: React.FC<MealPlanTodayCardProps> = ({
  plan,
  isCompleted,
  onToggle,
  onReplace,
  onReset,
  isOverridden,
  className = '',
}) => {
  if (!plan || plan.meals.length === 0) return null;

  const handleReplace = (slot: MealSlot) => {
    hapticLight();
    const alt = onReplace(slot);
    if (alt) toast.success(`Swapped to ${alt.name}`);
    else toast.error('No alternative available for this meal');
  };

  return (
    <div className={className}>
      <h3 className="mb-3 text-sm font-semibold text-ink">Today's meal plan</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plan.meals.map(({ key: slot, meal }) => {
          const done = isCompleted('meal', slot);
          return (
            <Card key={slot} className="overflow-hidden p-0">
              <img src={MEAL_IMAGES[slot]} alt="" loading="lazy" className="h-24 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{slot}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReplace(slot)}
                      aria-label={`Replace ${slot}`}
                      title="Replace with another meal"
                      className="rounded-md p-1 text-ink-faint transition-colors hover:bg-white/5 hover:text-ink"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                    </button>
                    {isOverridden(slot) && (
                      <button
                        onClick={() => {
                          hapticLight();
                          onReset(slot);
                          toast.success('Back to the planned meal');
                        }}
                        aria-label={`Reset ${slot} to plan`}
                        title="Back to planned meal"
                        className="rounded-md p-1 text-ink-faint transition-colors hover:bg-white/5 hover:text-ink"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-ink" title={meal.name}>{meal.name}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {meal.calories} kcal · P{meal.protein} C{meal.carbs} F{meal.fat}
                </p>
                <button
                  onClick={() => {
                    hapticLight();
                    onToggle({
                      itemType: 'meal',
                      itemKey: slot,
                      itemName: meal.name,
                      calories: meal.calories,
                      protein: meal.protein,
                      carbs: meal.carbs,
                      fat: meal.fat,
                    });
                  }}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    done ? 'bg-success-500/15 text-success-400' : 'bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {done ? 'Logged' : 'Log meal'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlanTodayCard;
