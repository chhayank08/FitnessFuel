import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Moon } from 'lucide-react';
import Card from '../ui/Card';
import { DAYS, DayMealPlan, DayExercisePlan } from '../../lib/planGenerator';

interface WeekAtAGlanceStripProps {
  mealPlan: DayMealPlan[];
  exercisePlan: DayExercisePlan[];
  todayCompleted: { meals: boolean; workout: boolean };
  className?: string;
}

// Compact 7-day summary replacing the old standalone Schedule page — tapping
// a day deep-links into Nutrition/Training with that day preselected.
const WeekAtAGlanceStrip: React.FC<WeekAtAGlanceStripProps> = ({
  mealPlan,
  exercisePlan,
  todayCompleted,
  className = '',
}) => {
  const navigate = useNavigate();
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-ink">This week</h3>
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS.map((day, i) => {
          const isToday = i === todayIndex;
          const workout = exercisePlan[i]?.exercises[0];
          const isRest = workout?.type === 'rest';
          const hasMeals = !!mealPlan[i];

          return (
            <button
              key={day}
              onClick={() => navigate(`/dashboard/diet?tab=plan&day=${i}`)}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-3 text-center transition-colors ${
                isToday ? 'bg-primary-500/15 ring-1 ring-primary-400/40' : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-[10px] font-medium uppercase tracking-wide ${isToday ? 'text-primary-300' : 'text-ink-faint'}`}>
                {day.slice(0, 3)}
              </span>
              <span className="flex items-center gap-0.5">
                {hasMeals && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isToday && todayCompleted.meals ? 'bg-success-400' : 'bg-hydration-400/70'
                    }`}
                  />
                )}
                {isRest ? (
                  <Moon className="h-3 w-3 text-ink-faint" />
                ) : (
                  <Dumbbell
                    className={`h-3 w-3 ${isToday && todayCompleted.workout ? 'text-success-400' : 'text-primary-400/70'}`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default WeekAtAGlanceStrip;
