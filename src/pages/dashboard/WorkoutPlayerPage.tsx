import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, Variants } from 'framer-motion';
import {
  Camera, CameraOff, Check, ChevronRight, Dumbbell, Flame, Mic, MicOff,
  Pause, Play, SkipForward, Square, Timer as TimerIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import RingGauge from '../../components/ui/RingGauge';
import DemoMedia from '../../components/workout/DemoMedia';
import ExerciseInfoCard from '../../components/workout/ExerciseInfoCard';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { useSettings } from '../../hooks/useSettings';
import { useWorkoutSessions } from '../../hooks/useWorkoutSessions';
import { useWorkoutPlayer } from '../../hooks/useWorkoutPlayer';
import { usePoseSession } from '../../hooks/usePoseSession';
import {
  CATALOG_CATEGORIES, CatalogExercise, EXERCISE_CATALOG, QUICK_PICK_EXERCISES, ExerciseCategory,
} from '../../lib/exerciseCatalog';
import {
  PlannedExercise, dayPlanSequence, generateWeeklyWorkoutPlan, quickWorkoutSequence,
} from '../../lib/workoutPlanGenerator';
import { resolveMedia } from '../../services/exerciseMedia';
import { preloadPoseLandmarker } from '../../lib/poseLandmarker';
import { voice } from '../../lib/voice';
import { localDateString } from '../../lib/dates';
import { hapticLight } from '../../lib/haptics';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// ─── Picker tile thumbnail ──────────────────────────────────────────────────

const PickerThumb: React.FC<{ exercise: CatalogExercise }> = ({ exercise }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolveMedia(exercise).then((m) => {
      if (!cancelled) setUrl(m?.url ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [exercise]);
  return (
    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2">
      {url ? (
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Dumbbell className="h-5 w-5 text-ink-faint" />
      )}
    </div>
  );
};

// ─── Exercise picker ────────────────────────────────────────────────────────

const ExercisePicker: React.FC<{ onPick: (ex: CatalogExercise) => void }> = ({ onPick }) => {
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all');
  const list = QUICK_PICK_EXERCISES.filter((e) => category === 'all' || e.category === category);

  return (
    <motion.div variants={item} className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATALOG_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              category === c.id ? 'bg-primary-500/20 text-ink' : 'bg-surface-2 text-ink-muted hover:text-ink'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((ex) => (
          <Card
            key={ex.key}
            interactive
            onClick={() => {
              hapticLight();
              voice.unlock();
              onPick(ex);
            }}
            className="flex items-center gap-3 p-3"
          >
            <PickerThumb exercise={ex} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{ex.name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">{ex.primaryMuscles.join(' · ')}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge tone="neutral" className="capitalize">{ex.category}</Badge>
                {ex.tracking !== 'timer' && (
                  <Badge tone="primary" className="gap-1"><Camera className="h-3 w-3" /> AI coach</Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-faint" />
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Active player ──────────────────────────────────────────────────────────

interface ActivePlayerProps {
  sequence: PlannedExercise[];
  source: 'quick' | 'plan';
  weightKg: number;
  onExit: () => void;
}

const ActivePlayer: React.FC<ActivePlayerProps> = ({ sequence, source, weightKg, onExit }) => {
  const { settings, update } = useSettings();
  const voiceOn = settings.coach.voiceFeedback;
  const { saveSession } = useWorkoutSessions();
  const { dailyLog } = useDailyLogContext();
  const player = useWorkoutPlayer(sequence, voiceOn, weightKg);
  const [cameraOn, setCameraOn] = useState(true);
  const savedRef = useRef(false);
  const [saved, setSaved] = useState(false);

  const exercise = player.exercise;
  const cameraEligible = !!exercise && exercise.tracking !== 'timer' && !!exercise.poseKey;
  const useCamera = cameraEligible && cameraOn;
  const pose = usePoseSession(exercise?.poseKey ?? 'squat', exercise?.tracking === 'camera-hold' ? 'hold' : 'reps');

  // Start/stop the camera session as camera exercises begin and end. The
  // session survives between-set rests (stage stays mounted) and restarts
  // only when the exercise itself changes.
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const activeCameraKey =
    useCamera && (player.phase === 'exercising' || player.phase === 'resting') ? exercise?.key : null;
  useEffect(() => {
    if (activeCameraKey) {
      poseRef.current.start();
      const ref = poseRef;
      return () => ref.current.stop();
    }
  }, [activeCameraKey]);

  // Feed camera reps (per-set baseline) into the player.
  const repBaselineRef = useRef(0);
  useEffect(() => {
    repBaselineRef.current = pose.reps.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.exIndex, player.setIndex]);
  useEffect(() => {
    if (!useCamera || exercise?.tracking !== 'camera-reps') return;
    const setReps = pose.reps.length - repBaselineRef.current;
    if (setReps > 0) player.reportCameraReps(setReps, pose.avgScore || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose.reps.length]);

  // Pause/resume the pose session with the player.
  useEffect(() => {
    if (!useCamera) return;
    if (player.paused) poseRef.current.pause();
    else if (poseRef.current.status === 'paused') poseRef.current.resume();
  }, [player.paused, useCamera]);

  // Persist once finished.
  useEffect(() => {
    if (player.phase !== 'done' || savedRef.current) return;
    savedRef.current = true;
    const s = player.summary;
    if (s.durationSeconds < 30 && s.totalReps === 0) return; // nothing meaningful to log
    const primary = s.exercises[0]?.key ?? sequence[0]?.key ?? 'workout';
    const scores = s.exercises.map((e) => e.avgScore).filter((x): x is number => x != null);
    (async () => {
      const ok = await saveSession({
        exercise_key: primary,
        duration_seconds: s.durationSeconds,
        total_reps: s.totalReps,
        avg_form_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        rep_scores: [],
        feedback: [],
        source,
        calories: s.calories,
        exercises: s.exercises as unknown as never,
        log_date: localDateString(),
      });
      setSaved(ok);
      if (ok) toast.success('Workout saved to your history');
      // Plan workouts also tick today's completion so streak semantics stay intact.
      if (ok && source === 'plan' && !dailyLog.isCompleted('workout', 'workout')) {
        dailyLog.toggleCompletion({ itemType: 'workout', itemKey: 'workout', itemName: 'Workout' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.phase]);

  if (!exercise || !player.plan) return null;

  if (player.phase === 'done') {
    const s = player.summary;
    return (
      <motion.div variants={item} className="space-y-5">
        <Card className="p-6 text-center">
          <p className="text-sm text-ink-muted">Workout complete</p>
          <div className="mt-3 flex justify-center gap-8">
            <div>
              <p className="font-display text-3xl font-semibold text-ink">{fmt(s.durationSeconds)}</p>
              <p className="text-xs text-ink-faint">duration</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-primary-300">{s.calories}</p>
              <p className="text-xs text-ink-faint">kcal burned</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-ink">{s.totalReps}</p>
              <p className="text-xs text-ink-faint">total reps</p>
            </div>
          </div>
          {saved && <Badge tone="success" className="mt-4">Saved to Training → History</Badge>}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Exercises</h3>
          <ul className="mt-3 space-y-2">
            {s.exercises.map((e) => (
              <li key={e.key} className="flex items-center justify-between text-sm">
                <span className="text-ink">{e.name}</span>
                <span className="text-ink-muted">
                  {e.sets} × {EXERCISE_CATALOG[e.key]?.type === 'timed' ? fmt(Math.round(e.durationSec / Math.max(e.sets, 1))) : `${Math.round(e.reps / Math.max(e.sets, 1))} reps`}
                  {e.avgScore != null && <span className="ml-2 text-primary-300">{e.avgScore} form</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex gap-3">
          <Button variant="subtle" className="flex-1" onClick={onExit}>Done</Button>
        </div>
      </motion.div>
    );
  }

  const isCountdown = player.phase === 'countdown';
  const isResting = player.phase === 'resting';
  const target = exercise.type === 'timed' ? player.plan.durationSec ?? 30 : player.plan.reps ?? 12;
  const repsShown = exercise.tracking === 'camera-reps' && useCamera ? player.cameraReps : null;

  return (
    <motion.div variants={item} className="mx-auto max-w-lg space-y-4 lg:max-w-4xl">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          {/* Demo / camera stage — always at the top of the viewport */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${exercise.key}-${activeCameraKey && (pose.status === 'running' || pose.status === 'paused') ? 'cam' : 'demo'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {activeCameraKey && (pose.status === 'running' || pose.status === 'paused') ? (
                <Card className="relative overflow-hidden p-0">
                  <video ref={pose.videoRef} className="w-full -scale-x-100" playsInline muted />
                  <canvas ref={pose.canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />
                  <div className="absolute left-3 top-3">
                    <Badge tone="primary" className="capitalize">{exercise.tracking === 'camera-hold' ? `posture ${pose.holdScore}%` : pose.phase}</Badge>
                  </div>
                </Card>
              ) : (
                <DemoMedia exercise={exercise} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* HUD */}
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-semibold text-ink">{exercise.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {isCountdown ? 'Get ready…' : isResting ? 'Resting' : `Set ${player.setIndex + 1} of ${player.plan.sets}`}
                  {' · '}exercise {player.exIndex + 1}/{player.sequenceLength}
                  {' · '}{fmt(player.totalElapsed)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => update({ coach: { voiceFeedback: !voiceOn } })}
                  aria-label={voiceOn ? 'Voice on' : 'Voice off'}
                  className="rounded-lg bg-surface-2 p-2 text-ink-muted hover:bg-surface-3"
                >
                  {voiceOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                {cameraEligible && (
                  <button
                    onClick={() => setCameraOn((c) => !c)}
                    aria-label={cameraOn ? 'Camera on' : 'Camera off'}
                    className="rounded-lg bg-surface-2 p-2 text-ink-muted hover:bg-surface-3"
                  >
                    {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              {isCountdown ? (
                <div className="flex h-28 items-center justify-center">
                  <p className="animate-pulse font-display text-2xl font-semibold text-primary-300">Get ready…</p>
                </div>
              ) : isResting || exercise.type === 'timed' ? (
                <RingGauge
                  value={isResting ? player.secondsLeft / Math.max(player.plan.restSec, 1) : player.secondsLeft / Math.max(target, 1)}
                  size={120}
                  colorFrom={isResting ? '#4AE3AC' : '#857BFF'}
                  colorTo={isResting ? '#34D399' : '#6C63FF'}
                >
                  <span className="font-display text-2xl font-semibold text-ink tabular-nums">{player.secondsLeft}</span>
                </RingGauge>
              ) : (
                <div className="text-center">
                  <span className="font-display text-5xl font-semibold text-ink">
                    <AnimatedNumber value={repsShown ?? 0} />
                    <span className="text-2xl text-ink-faint"> / {target}</span>
                  </span>
                  <p className="mt-1 text-xs text-ink-muted">{repsShown != null ? 'reps counted by camera' : 'target reps'}</p>
                </div>
              )}
            </div>

            {useCamera && pose.currentCue && player.phase === 'exercising' && (
              <p className="mt-3 rounded-lg bg-primary-500/10 px-3 py-2 text-center text-sm text-primary-300">{pose.currentCue}</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="subtle" size="sm" onClick={() => { player.togglePause(); hapticLight(); }} disabled={isCountdown}>
                {player.paused ? <Play className="mr-1 h-4 w-4" /> : <Pause className="mr-1 h-4 w-4" />}
                {player.paused ? 'Resume' : 'Pause'}
              </Button>
              {!isCountdown && !isResting && exercise.type === 'reps' && (
                <Button size="sm" onClick={() => player.completeSet({ reps: repsShown || target })}>
                  <Check className="mr-1 h-4 w-4" />
                  Set done
                </Button>
              )}
              <Button variant="subtle" size="sm" onClick={player.skipExercise} disabled={isCountdown}>
                <SkipForward className="mr-1 h-4 w-4" />
                Skip
              </Button>
              <Button variant="danger" size="sm" onClick={player.finishNow}>
                <Square className="mr-1 h-4 w-4" />
                Finish
              </Button>
            </div>
          </Card>

          {player.nextExercise && (
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <TimerIcon className="h-3.5 w-3.5" />
              Next up: <span className="font-medium text-ink-muted">{player.nextExercise.name}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ExerciseInfoCard exercise={exercise} weightKg={weightKg} />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Page ───────────────────────────────────────────────────────────────────

const WorkoutPlayerPage: React.FC = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, insights } = useDailyLogContext();
  const weightKg = insights.nutritionProfile?.weight ?? 70;

  const exerciseParam = searchParams.get('exercise');
  const dayParam = searchParams.get('day');
  const [started, setStarted] = useState(false);

  // Warm the pose model while the user is choosing.
  useEffect(() => {
    preloadPoseLandmarker();
  }, []);

  const picked: CatalogExercise | null = exerciseParam ? EXERCISE_CATALOG[exerciseParam] ?? null : null;
  const dayIndex = dayParam != null ? parseInt(dayParam, 10) : null;
  const dayPlan = useMemo(() => {
    if (dayIndex == null || !Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6 || !profile) return null;
    const plan = generateWeeklyWorkoutPlan(profile)[dayIndex];
    return plan.restDay ? null : plan;
  }, [dayIndex, profile]);

  const sequence = useMemo<PlannedExercise[] | null>(() => {
    if (picked) return quickWorkoutSequence(picked);
    if (dayPlan) return dayPlanSequence(dayPlan);
    return null;
  }, [picked, dayPlan]);

  const source: 'quick' | 'plan' = picked ? 'quick' : 'plan';

  const handlePick = useCallback(
    (ex: CatalogExercise) => {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('exercise', ex.key);
        return p;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const handleExit = useCallback(() => {
    setStarted(false);
    navigate('/dashboard/exercise');
  }, [navigate]);

  const title = started && sequence ? 'Workout' : picked || dayPlan ? 'Ready to go' : 'Quick Workout';

  return (
    <motion.div className="mx-auto max-w-5xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        {!started && (
          <p className="mt-1 text-sm text-ink-muted">
            {picked || dayPlan ? 'Check the demo, then hit start' : 'Pick an exercise — never the same squats twice'}
          </p>
        )}
      </motion.div>

      {!sequence && <ExercisePicker onPick={handlePick} />}

      {sequence && !started && (
        <motion.div variants={item} className="mx-auto max-w-lg space-y-4">
          {picked && <DemoMedia exercise={picked} />}
          <Card className="p-5">
            {picked ? (
              <>
                <p className="font-display text-lg font-semibold text-ink">{picked.name}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {picked.defaultSets} sets ·{' '}
                  {picked.type === 'timed' ? `${picked.defaultDurationSec}s each` : `${picked.defaultReps} reps each`} ·{' '}
                  rest {picked.restSec}s
                </p>
              </>
            ) : dayPlan ? (
              <>
                <p className="font-display text-lg font-semibold text-ink">{dayPlan.day}: {dayPlan.focus}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {dayPlan.warmup.length + dayPlan.main.length + dayPlan.cooldown.length} exercises · ~{dayPlan.totalMinutes} min ·{' '}
                  <Flame className="inline h-3.5 w-3.5 text-primary-300" /> ~{dayPlan.estCalories} kcal
                </p>
                <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                  {dayPlanSequence(dayPlan).map((p, i) => (
                    <li key={`${p.key}-${i}`}>• {EXERCISE_CATALOG[p.key]?.name}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <Button
              className="mt-4 w-full"
              onClick={() => {
                voice.unlock();
                hapticLight();
                setStarted(true);
              }}
            >
              <Play className="mr-1.5 h-4 w-4" />
              Start workout
            </Button>
            {picked && (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.delete('exercise');
                  return p;
                }, { replace: true });
              }}>
                Choose a different exercise
              </Button>
            )}
          </Card>
          {picked && <ExerciseInfoCard exercise={picked} weightKg={weightKg} />}
        </motion.div>
      )}

      {sequence && started && (
        <ActivePlayer sequence={sequence} source={source} weightKg={weightKg} onExit={handleExit} />
      )}
    </motion.div>
  );
};

export default WorkoutPlayerPage;
