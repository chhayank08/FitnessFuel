import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISE_CATALOG, CatalogExercise, estimateCalories } from '../lib/exerciseCatalog';
import { PlannedExercise } from '../lib/workoutPlanGenerator';
import { preloadMedia } from '../services/exerciseMedia';
import { voice } from '../lib/voice';
import { hapticMedium, hapticSuccess } from '../lib/haptics';

export type PlayerPhase = 'countdown' | 'exercising' | 'resting' | 'done';

export interface CompletedExercise {
  key: string;
  name: string;
  sets: number;
  reps: number;
  durationSec: number;
  avgScore: number | null;
}

export interface WorkoutSummary {
  durationSeconds: number;
  calories: number;
  totalReps: number;
  exercises: CompletedExercise[];
}

// Drives a full workout session over a planned exercise sequence: countdown →
// (exercising → resting) × sets × exercises → done. Timed exercises tick down
// automatically; rep exercises complete a set via completeSet() (tapped by the
// user, or fired by the camera rep counter reaching the target).
export function useWorkoutPlayer(sequence: PlannedExercise[], voiceOn: boolean, weightKg: number) {
  const [phase, setPhase] = useState<PlayerPhase>('countdown');
  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [cameraReps, setCameraReps] = useState(0); // reps in the current set

  const completedRef = useRef<Map<string, CompletedExercise>>(new Map());
  const scoresRef = useRef<Map<string, number[]>>(new Map());
  const caloriesRef = useRef(0);
  const startedRef = useRef(false);
  const setStartRef = useRef(Date.now());
  const secondsLeftRef = useRef(0);

  const setSeconds = useCallback((n: number) => {
    secondsLeftRef.current = n;
    setSecondsLeft(n);
  }, []);

  const current = sequence[exIndex] as PlannedExercise | undefined;
  const exercise: CatalogExercise | undefined = current ? EXERCISE_CATALOG[current.key] : undefined;
  const nextExercise: CatalogExercise | undefined =
    exIndex + 1 < sequence.length ? EXERCISE_CATALOG[sequence[exIndex + 1].key] : undefined;

  const speak = useCallback(
    (text: string, interrupt = false) => {
      if (voiceOn) voice.speak(text, { interrupt });
    },
    [voiceOn]
  );

  // Opening countdown, then first exercise announcement.
  useEffect(() => {
    if (startedRef.current || !exercise || !current) return;
    startedRef.current = true;
    const begin = () => {
      setPhase('exercising');
      setStartRef.current = Date.now();
      if (exercise.type === 'timed') setSeconds(current.durationSec ?? 30);
      announceExercise(exercise, current, 1);
    };
    if (voiceOn) voice.countdown(begin);
    else setTimeout(begin, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const announceExercise = useCallback(
    (ex: CatalogExercise, plan: PlannedExercise, setNum: number) => {
      const target = ex.type === 'timed' ? `${plan.durationSec ?? 30} seconds` : `${plan.reps ?? 12} reps`;
      speak(setNum === 1 ? `${ex.name}. Set 1 of ${plan.sets}: ${target}.` : `Set ${setNum} of ${plan.sets}: ${target}.`);
    },
    [speak]
  );

  const recordSet = useCallback(
    (reps: number, workSec: number, score: number | null) => {
      if (!exercise) return;
      const prev = completedRef.current.get(exercise.key) ?? {
        key: exercise.key,
        name: exercise.name,
        sets: 0,
        reps: 0,
        durationSec: 0,
        avgScore: null,
      };
      prev.sets += 1;
      prev.reps += reps;
      prev.durationSec += workSec;
      completedRef.current.set(exercise.key, prev);
      if (score != null) {
        const list = scoresRef.current.get(exercise.key) ?? [];
        list.push(score);
        scoresRef.current.set(exercise.key, list);
      }
      caloriesRef.current += estimateCalories(exercise.met, weightKg, workSec / 60);
    },
    [exercise, weightKg]
  );

  const advance = useCallback(() => {
    if (!current || !exercise) return;
    const isLastSet = setIndex + 1 >= current.sets;
    if (!isLastSet) {
      // between-sets rest
      setSetIndex((i) => i + 1);
      setCameraReps(0);
      if (current.restSec > 0) {
        setPhase('resting');
        setSeconds(current.restSec);
        speak(`Rest. ${current.restSec} seconds.`);
      } else {
        setPhase('exercising');
        setStartRef.current = Date.now();
        if (exercise.type === 'timed') setSeconds(current.durationSec ?? 30);
        announceExercise(exercise, current, setIndex + 2);
      }
      return;
    }

    // exercise finished
    hapticMedium();
    const nextIdx = exIndex + 1;
    if (nextIdx >= sequence.length) {
      setPhase('done');
      hapticSuccess();
      speak('Workout complete. Great job!', true);
      return;
    }
    const next = sequence[nextIdx];
    const nextEx = EXERCISE_CATALOG[next.key];
    setExIndex(nextIdx);
    setSetIndex(0);
    setCameraReps(0);
    const restAfter = current.restSec;
    if (restAfter > 0) {
      setPhase('resting');
      setSeconds(restAfter);
      speak(`Nice. Next up: ${nextEx.name}. Rest ${restAfter} seconds.`);
    } else {
      setPhase('exercising');
      setStartRef.current = Date.now();
      if (nextEx.type === 'timed') setSeconds(next.durationSec ?? 30);
      announceExercise(nextEx, next, 1);
    }
  }, [current, exercise, setIndex, exIndex, sequence, speak, announceExercise, setSeconds]);

  /** Complete the current set (user tap, camera target reached, or timer end). */
  const completeSet = useCallback(
    (opts: { reps?: number; score?: number | null } = {}) => {
      if (phase !== 'exercising' || !current || !exercise) return;
      const workSec =
        exercise.type === 'timed'
          ? current.durationSec ?? 30
          : Math.min(Math.round((Date.now() - setStartRef.current) / 1000), (opts.reps ?? current.reps ?? 12) * 6);
      recordSet(opts.reps ?? current.reps ?? 12, workSec, opts.score ?? null);
      advance();
    },
    [phase, current, exercise, recordSet, advance]
  );

  // Preload the next exercise's demo media while the current one runs.
  useEffect(() => {
    if (nextExercise) preloadMedia(nextExercise);
  }, [nextExercise]);

  // Shared 1 Hz tick: total elapsed + timed-work/rest countdowns.
  const completeSetRef = useRef(completeSet);
  completeSetRef.current = completeSet;

  useEffect(() => {
    if (phase === 'done' || paused) return;
    const t = setInterval(() => {
      setTotalElapsed((s) => s + 1);
      const s = secondsLeftRef.current;

      if (phase === 'resting') {
        if (s === 4 && voiceOn) voice.speak('3, 2, 1', { interrupt: true });
        if (s <= 1) {
          // rest over → start the pending set
          const cur = sequence[exIndex];
          const ex = EXERCISE_CATALOG[cur.key];
          setPhase('exercising');
          setStartRef.current = Date.now();
          setSeconds(ex.type === 'timed' ? cur.durationSec ?? 30 : 0);
          if (voiceOn) {
            const target = ex.type === 'timed' ? `${cur.durationSec ?? 30} seconds` : `${cur.reps ?? 12} reps`;
            voice.speak(`Set ${setIndex + 1} of ${cur.sets}: ${target}.`);
          }
        } else {
          setSeconds(s - 1);
        }
        return;
      }

      if (phase === 'exercising' && exercise?.type === 'timed') {
        const total = current?.durationSec ?? 30;
        if (s === Math.ceil(total / 2) && total >= 40 && voiceOn) voice.speak('Halfway there.');
        if (s === 4 && voiceOn) voice.speak('3, 2, 1', { interrupt: true });
        if (s <= 1) {
          setSeconds(0);
          completeSetRef.current({});
        } else {
          setSeconds(s - 1);
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, paused, exercise, current, sequence, exIndex, setIndex, voiceOn, setSeconds]);

  /** Camera rep counter feed: complete the set when the target is reached. */
  const reportCameraReps = useCallback(
    (count: number, avgScore: number | null) => {
      setCameraReps(count);
      const target = current?.reps ?? 12;
      if (phase === 'exercising' && exercise?.type === 'reps' && count >= target) {
        completeSetRef.current({ reps: count, score: avgScore });
      }
    },
    [phase, current, exercise]
  );

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (!p) voice.stop();
      return !p;
    });
  }, []);

  const skipExercise = useCallback(() => {
    if (!current || phase === 'done') return;
    // record nothing for the skipped remainder; jump to next exercise
    const nextIdx = exIndex + 1;
    if (nextIdx >= sequence.length) {
      setPhase('done');
      speak('Workout complete.', true);
      return;
    }
    const next = sequence[nextIdx];
    const nextEx = EXERCISE_CATALOG[next.key];
    setExIndex(nextIdx);
    setSetIndex(0);
    setCameraReps(0);
    setPhase('exercising');
    setStartRef.current = Date.now();
    if (nextEx.type === 'timed') setSeconds(next.durationSec ?? 30);
    announceExercise(nextEx, next, 1);
  }, [current, phase, exIndex, sequence, speak, announceExercise, setSeconds]);

  const finishNow = useCallback(() => {
    voice.stop();
    setPhase('done');
  }, []);

  const summary: WorkoutSummary = useMemo(() => {
    const exercises = Array.from(completedRef.current.values()).map((e) => {
      const scores = scoresRef.current.get(e.key);
      return {
        ...e,
        avgScore: scores?.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      };
    });
    return {
      durationSeconds: totalElapsed,
      calories: Math.round(caloriesRef.current),
      totalReps: exercises.reduce((s, e) => s + e.reps, 0),
      exercises,
    };
    // recompute when the workout ends or time advances
  }, [totalElapsed, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    phase,
    paused,
    exercise,
    nextExercise,
    plan: current,
    exIndex,
    setIndex,
    sequenceLength: sequence.length,
    secondsLeft,
    totalElapsed,
    cameraReps,
    summary,
    completeSet,
    reportCameraReps,
    togglePause,
    skipExercise,
    finishNow,
  };
}
