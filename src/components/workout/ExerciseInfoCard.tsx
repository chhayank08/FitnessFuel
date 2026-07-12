import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Info, AlertTriangle, ShieldCheck, ArrowUpDown } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { CatalogExercise, estimateCalories, defaultActiveMinutes } from '../../lib/exerciseCatalog';

interface ExerciseInfoCardProps {
  exercise: CatalogExercise;
  weightKg: number;
  className?: string;
}

// Collapsible exercise details: muscles, difficulty, equipment, calorie
// estimate, how-to, mistakes, safety, and modifications. Collapsed by default
// so the workout screen stays clean.
const ExerciseInfoCard: React.FC<ExerciseInfoCardProps> = ({ exercise, weightKg, className = '' }) => {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const kcal = estimateCalories(exercise.met, weightKg, defaultActiveMinutes(exercise));

  return (
    <Card className={`overflow-hidden p-0 ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Info className="h-4 w-4 text-primary-300" />
          About {exercise.name}
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="neutral" className="capitalize">{exercise.difficulty}</Badge>
          <ChevronDown className={`h-4 w-4 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="space-y-4 px-4 pb-4">
              <p className="text-sm text-ink-muted">{exercise.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {exercise.primaryMuscles.map((m) => (
                  <Badge key={m} tone="primary">{m}</Badge>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <Badge key={m} tone="neutral">{m}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted">
                <div className="rounded-lg bg-surface-2 p-2">
                  <p className="text-ink-faint">Equipment</p>
                  <p className="mt-0.5 font-medium capitalize text-ink">{exercise.equipment}</p>
                </div>
                <div className="rounded-lg bg-surface-2 p-2">
                  <p className="text-ink-faint">Est. burn (default volume)</p>
                  <p className="mt-0.5 font-medium text-ink">~{kcal} kcal</p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">How to</p>
                <ol className="space-y-1 text-sm text-ink-muted">
                  {exercise.instructions.map((s, i) => (
                    <li key={i}>{i + 1}. {s}</li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <AlertTriangle className="h-3 w-3" /> Common mistakes
                </p>
                <ul className="space-y-1 text-sm text-ink-muted">
                  {exercise.commonMistakes.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <ShieldCheck className="h-3 w-3" /> Safety
                </p>
                <ul className="space-y-1 text-sm text-ink-muted">
                  {exercise.safetyTips.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>

              {exercise.modifications.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    <ArrowUpDown className="h-3 w-3" /> Easier / harder
                  </p>
                  <ul className="space-y-1 text-sm text-ink-muted">
                    {exercise.modifications.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default ExerciseInfoCard;
