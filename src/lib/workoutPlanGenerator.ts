// Real weekly workout plan generation from the user profile. Deterministic,
// pure function of the profile — same input always yields the same week, so
// completion keys and "today's workout" stay stable across renders/devices.

import { toNutritionProfile } from './nutrition';
import { DAYS } from './planGenerator';
import { CatalogExercise, EXERCISE_CATALOG, estimateCalories } from './exerciseCatalog';

export interface PlannedExercise {
  key: string;
  sets: number;
  reps?: number;
  durationSec?: number;
  restSec: number;
}

export interface DayWorkoutPlan {
  day: string;
  focus: string;
  type: string; // maps to ExercisePage TYPE_TONE badges: cardio|strength|hiit|flexibility|mixed|rest
  restDay: boolean;
  warmup: PlannedExercise[];
  main: PlannedExercise[];
  cooldown: PlannedExercise[];
  totalMinutes: number;
  estCalories: number;
  progressionNote: string;
}

type ProfileRow = Parameters<typeof toNutritionProfile>[0];

// ── volume scaling ──────────────────────────────────────────────────────────

interface VolumeScale {
  sets: number; // multiplier
  reps: number; // multiplier
  label: 'gentle' | 'standard' | 'high';
}

function volumeScale(activityLevel: string, age: number): VolumeScale {
  const gentle = age > 55 || activityLevel === 'sedentary';
  if (gentle) return { sets: 0.75, reps: 0.75, label: 'gentle' };
  if (activityLevel === 'very' || activityLevel === 'extra') return { sets: 1.25, reps: 1.15, label: 'high' };
  return { sets: 1, reps: 1, label: 'standard' };
}

function planned(key: string, scale: VolumeScale, overrides: Partial<PlannedExercise> = {}): PlannedExercise {
  const ex = EXERCISE_CATALOG[key];
  const sets = Math.max(1, Math.round((overrides.sets ?? ex.defaultSets) * scale.sets));
  if (ex.type === 'timed') {
    return {
      key,
      sets,
      durationSec: Math.round((overrides.durationSec ?? ex.defaultDurationSec ?? 30) * scale.reps),
      restSec: overrides.restSec ?? ex.restSec,
    };
  }
  return {
    key,
    sets,
    reps: Math.max(5, Math.round((overrides.reps ?? ex.defaultReps ?? 12) * scale.reps)),
    restSec: overrides.restSec ?? ex.restSec,
  };
}

// Short warm-up versions regardless of the exercise's default volume.
function warm(key: string, durationSec = 40): PlannedExercise {
  const ex = EXERCISE_CATALOG[key];
  return ex.type === 'timed'
    ? { key, sets: 1, durationSec, restSec: 10 }
    : { key, sets: 1, reps: 12, restSec: 10 };
}

function cool(key: string, durationSec = 90): PlannedExercise {
  return { key, sets: 1, durationSec, restSec: 0 };
}

// ── weekly splits per goal ──────────────────────────────────────────────────
// Six training days (Sunday rest). Each entry: focus label, badge type,
// warm-up keys, main circuit keys, and beginner-swaps where an exercise has a
// friendlier alternative.

interface DayTemplate {
  focus: string;
  type: string;
  warmup: string[];
  main: string[];
  cooldown: string[];
}

const SPLITS: Record<string, DayTemplate[]> = {
  weight_loss: [
    { focus: 'Full-Body Fat Burn', type: 'hiit', warmup: ['jumping-jack', 'high-knees'], main: ['squat', 'pushup', 'mountain-climber', 'burpee'], cooldown: ['full-body-stretch'] },
    { focus: 'Cardio Blast', type: 'cardio', warmup: ['jumping-jack', 'butt-kick'], main: ['jump-rope', 'high-knees', 'shadow-boxing', 'step-up'], cooldown: ['hamstring-stretch'] },
    { focus: 'Lower Body Burn', type: 'strength', warmup: ['high-knees', 'jumping-jack'], main: ['squat', 'lunge', 'glute-bridge', 'wall-sit', 'calf-raise'], cooldown: ['hip-stretch'] },
    { focus: 'Core & Cardio', type: 'hiit', warmup: ['jumping-jack', 'butt-kick'], main: ['mountain-climber', 'bicycle-crunch', 'russian-twist', 'plank', 'burpee'], cooldown: ['full-body-stretch'] },
    { focus: 'Steady-State Cardio', type: 'cardio', warmup: ['jumping-jack'], main: ['running'], cooldown: ['hamstring-stretch'] },
    { focus: 'Active Recovery Flow', type: 'flexibility', warmup: ['jumping-jack'], main: ['sun-salutation', 'warrior-pose', 'downward-dog'], cooldown: ['child-pose'] },
  ],
  weight_gain: [
    { focus: 'Push Strength', type: 'strength', warmup: ['jumping-jack', 'shoulder-stretch'], main: ['pushup', 'incline-pushup', 'diamond-pushup', 'plank'], cooldown: ['shoulder-stretch'] },
    { focus: 'Leg Strength', type: 'strength', warmup: ['high-knees', 'jumping-jack'], main: ['squat', 'lunge', 'bulgarian-split-squat', 'calf-raise'], cooldown: ['hip-stretch'] },
    { focus: 'Core Foundation', type: 'strength', warmup: ['jumping-jack'], main: ['situp', 'leg-raise', 'russian-twist', 'plank'], cooldown: ['full-body-stretch'] },
    { focus: 'Light Conditioning', type: 'cardio', warmup: ['butt-kick'], main: ['walking', 'step-up'], cooldown: ['hamstring-stretch'] },
    { focus: 'Glutes & Hamstrings', type: 'strength', warmup: ['jumping-jack', 'high-knees'], main: ['glute-bridge', 'hip-thrust', 'reverse-lunge', 'donkey-kick'], cooldown: ['hip-stretch'] },
    { focus: 'Upper Body Volume', type: 'strength', warmup: ['jumping-jack', 'shoulder-stretch'], main: ['wide-pushup', 'pushup', 'bicep-curl', 'side-plank'], cooldown: ['shoulder-stretch'] },
  ],
  muscle_gain: [
    { focus: 'Push Day', type: 'strength', warmup: ['jumping-jack', 'shoulder-stretch'], main: ['pushup', 'diamond-pushup', 'wide-pushup', 'plank'], cooldown: ['shoulder-stretch'] },
    { focus: 'Leg Day', type: 'strength', warmup: ['high-knees', 'jumping-jack'], main: ['squat', 'jump-squat', 'bulgarian-split-squat', 'calf-raise'], cooldown: ['hip-stretch'] },
    { focus: 'Core Day', type: 'strength', warmup: ['jumping-jack'], main: ['situp', 'leg-raise', 'hollow-hold', 'russian-twist', 'plank'], cooldown: ['full-body-stretch'] },
    { focus: 'Glutes & Posterior', type: 'strength', warmup: ['jumping-jack', 'high-knees'], main: ['hip-thrust', 'glute-bridge', 'reverse-lunge', 'fire-hydrant'], cooldown: ['hip-stretch'] },
    { focus: 'Conditioning', type: 'hiit', warmup: ['jumping-jack', 'butt-kick'], main: ['burpee', 'mountain-climber', 'jump-squat', 'shadow-boxing'], cooldown: ['full-body-stretch'] },
    { focus: 'Arms & Upper Volume', type: 'strength', warmup: ['jumping-jack', 'shoulder-stretch'], main: ['bicep-curl', 'incline-pushup', 'pushup', 'side-plank'], cooldown: ['shoulder-stretch'] },
  ],
  maintain: [
    { focus: 'Full-Body Mix', type: 'mixed', warmup: ['jumping-jack', 'high-knees'], main: ['squat', 'pushup', 'plank', 'jumping-jack'], cooldown: ['full-body-stretch'] },
    { focus: 'Cardio Session', type: 'cardio', warmup: ['butt-kick'], main: ['jump-rope', 'high-knees', 'step-up'], cooldown: ['hamstring-stretch'] },
    { focus: 'Strength Circuit', type: 'strength', warmup: ['jumping-jack'], main: ['lunge', 'glute-bridge', 'wall-sit', 'calf-raise'], cooldown: ['hip-stretch'] },
    { focus: 'Yoga & Balance', type: 'flexibility', warmup: [], main: ['sun-salutation', 'warrior-pose', 'tree-pose', 'downward-dog'], cooldown: ['child-pose'] },
    { focus: 'Core Circuit', type: 'mixed', warmup: ['jumping-jack'], main: ['crunch', 'bicycle-crunch', 'plank', 'russian-twist'], cooldown: ['full-body-stretch'] },
    { focus: 'Bodyweight Circuit', type: 'mixed', warmup: ['jumping-jack', 'butt-kick'], main: ['squat', 'pushup', 'mountain-climber', 'burpee'], cooldown: ['full-body-stretch'] },
  ],
};

// Friendlier substitutes for gentle-volume users (beginners / 55+).
const GENTLE_SWAPS: Record<string, string> = {
  burpee: 'step-up',
  'jump-squat': 'squat',
  'diamond-pushup': 'knee-pushup',
  pushup: 'knee-pushup',
  'wide-pushup': 'incline-pushup',
  'bulgarian-split-squat': 'lunge',
  situp: 'crunch',
  'jump-rope': 'jumping-jack',
  sprint: 'running',
  'hollow-hold': 'crunch',
};

function exerciseMinutes(p: PlannedExercise): number {
  const ex = EXERCISE_CATALOG[p.key];
  const workSec = p.durationSec != null ? p.sets * p.durationSec : p.sets * (p.reps ?? ex.defaultReps ?? 12) * 3;
  const restSec = Math.max(0, p.sets - 1) * p.restSec;
  return (workSec + restSec) / 60;
}

function sectionCalories(items: PlannedExercise[], weightKg: number): number {
  return items.reduce((sum, p) => {
    const ex = EXERCISE_CATALOG[p.key];
    const workMin = (p.durationSec != null ? p.sets * p.durationSec : p.sets * (p.reps ?? 12) * 3) / 60;
    return sum + estimateCalories(ex.met, weightKg, workMin);
  }, 0);
}

export function generateWeeklyWorkoutPlan(profileRow: ProfileRow): DayWorkoutPlan[] {
  const p = toNutritionProfile(profileRow);
  const scale = volumeScale(p.activityLevel, p.age);
  const split = SPLITS[p.goal] || SPLITS.maintain;

  const swap = (key: string) => (scale.label === 'gentle' && GENTLE_SWAPS[key] ? GENTLE_SWAPS[key] : key);

  const progressionNote =
    scale.label === 'gentle'
      ? 'Focus on form this week. Next week, add 1–2 reps per set once every set feels controlled.'
      : scale.label === 'high'
      ? 'Add 2 reps or 10 seconds per exercise next week, and shave 5 seconds off each rest.'
      : 'When you finish every set comfortably, add 2 reps or 10 seconds per exercise next week.';

  return DAYS.map((day, i) => {
    if (i === 6) {
      return {
        day,
        focus: 'Rest Day',
        type: 'rest',
        restDay: true,
        warmup: [],
        main: [],
        cooldown: [],
        totalMinutes: 0,
        estCalories: 0,
        progressionNote: 'Recovery is where the progress happens — walk, hydrate, sleep well.',
      };
    }

    const tpl = split[i % split.length];
    const warmup = tpl.warmup.map((k) => warm(swap(k)));
    const main = tpl.main.map((k) => planned(swap(k), scale));
    const cooldown = tpl.cooldown.map((k) => cool(swap(k)));
    const all = [...warmup, ...main, ...cooldown];
    const totalMinutes = Math.round(all.reduce((s, e) => s + exerciseMinutes(e), 0));
    const estCal = sectionCalories(all, p.weight);

    return {
      day,
      focus: tpl.focus,
      type: tpl.type,
      restDay: false,
      warmup,
      main,
      cooldown,
      totalMinutes,
      estCalories: estCal,
      progressionNote,
    };
  });
}

/** Flat exercise sequence for the workout player (warmup → main → cooldown). */
export function dayPlanSequence(day: DayWorkoutPlan): PlannedExercise[] {
  return [...day.warmup, ...day.main, ...day.cooldown];
}

/** Single-exercise sequence at catalog defaults (Quick Workout). */
export function quickWorkoutSequence(exercise: CatalogExercise): PlannedExercise[] {
  return [
    {
      key: exercise.key,
      sets: exercise.defaultSets,
      reps: exercise.type === 'reps' ? exercise.defaultReps : undefined,
      durationSec: exercise.type === 'timed' ? exercise.defaultDurationSec : undefined,
      restSec: exercise.restSec,
    },
  ];
}
