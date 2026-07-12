import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Search, Dumbbell, Clock, UserCog, Sparkles, Play, Flame, TrendingUp } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { generateWeeklyWorkoutPlan, DayWorkoutPlan, PlannedExercise } from '../../lib/workoutPlanGenerator';
import { EXERCISE_CATALOG } from '../../lib/exerciseCatalog';
import { preloadPoseLandmarker } from '../../lib/poseLandmarker';
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary';
import { useWorkoutSessions } from '../../hooks/useWorkoutSessions';
import { ExerciseInfo } from '../../services/exercises';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ExerciseDetailModal from '../../components/dashboard/ExerciseDetailModal';
import FormCoachCTA from '../../components/dashboard/FormCoachCTA';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const TABS = [
  { id: 'plan', label: 'My Plan' },
  { id: 'library', label: 'Library' },
  { id: 'history', label: 'History' },
];

const TYPE_TONE: Record<string, 'primary' | 'success' | 'alert' | 'neutral'> = {
  cardio: 'alert',
  strength: 'primary',
  hiit: 'alert',
  flexibility: 'success',
  mixed: 'neutral',
};

const ExercisePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, profileLoading, dailyLog, insights } = useDailyLogContext();
  const { sessions } = useWorkoutSessions();
  const reducedMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'plan');
  const initialDay = useMemo(() => {
    const raw = searchParams.get('day');
    const n = raw != null ? parseInt(raw, 10) : NaN;
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : undefined;
  }, [searchParams]);

  const { nutritionProfile } = insights;
  const weeklyPlan = useMemo(() => (nutritionProfile && profile ? generateWeeklyWorkoutPlan(profile) : []), [nutritionProfile, profile]);

  // Warm the pose model so "Start workout" feels instant.
  useEffect(() => {
    preloadPoseLandmarker();
  }, []);

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <motion.div className="mx-auto max-w-7xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Training</h1>
          <p className="mt-1 text-sm text-ink-muted">Your weekly plan, the full exercise library, and session history</p>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </motion.div>

      {tab === 'plan' &&
        (!nutritionProfile ? (
          <motion.div variants={item}>
            <Card>
              <EmptyState
                icon={UserCog}
                title="Complete your profile"
                description="Add your weight, height, and goal to unlock a personalized weekly workout plan."
                actionLabel="Get started"
                onAction={() => navigate('/dashboard/welcome')}
                className="py-16"
              />
            </Card>
          </motion.div>
        ) : (
          <PlanTab weeklyPlan={weeklyPlan} isCompleted={dailyLog.isCompleted} onToggle={dailyLog.toggleCompletion} initialDay={initialDay} lastSession={sessions[0]} />
        ))}

      {tab === 'library' && <LibraryTab />}
      {tab === 'history' && <HistoryTab />}
    </motion.div>
  );
};

// ---------- My Plan ----------

const plannedLabel = (p: PlannedExercise): string => {
  if (p.durationSec != null) {
    const d = p.durationSec >= 60 ? `${Math.round(p.durationSec / 60)} min` : `${p.durationSec}s`;
    return p.sets > 1 ? `${p.sets} × ${d}` : d;
  }
  return `${p.sets} × ${p.reps} reps`;
};

const PlanSection: React.FC<{ title: string; items: PlannedExercise[] }> = ({ title, items }) => {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</p>
      <ul className="space-y-1.5">
        {items.map((p, i) => {
          const ex = EXERCISE_CATALOG[p.key];
          return (
            <li key={`${p.key}-${i}`} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{ex?.name ?? p.key}</p>
                <p className="truncate text-xs text-ink-faint">{ex?.primaryMuscles.join(' · ')}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-medium text-ink-muted tabular-nums">{plannedLabel(p)}</p>
                {p.restSec > 0 && p.sets > 1 && <p className="text-[10px] text-ink-faint">rest {p.restSec}s</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const PlanTab: React.FC<{
  weeklyPlan: DayWorkoutPlan[];
  isCompleted: (type: 'meal' | 'workout', key: string) => boolean;
  onToggle: (item: { itemType: 'meal' | 'workout'; itemKey: string; itemName: string }) => void;
  initialDay?: number;
  lastSession?: ReturnType<typeof useWorkoutSessions>['sessions'][number];
}> = ({ weeklyPlan, isCompleted, onToggle, initialDay, lastSession }) => {
  const navigate = useNavigate();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(initialDay ?? todayIndex);
  const dayPlan = weeklyPlan[selectedDay];
  const isToday = selectedDay === todayIndex;
  const done = isToday && !dayPlan?.restDay && isCompleted('workout', 'workout');

  return (
    <motion.div variants={item} className="space-y-5">
      <FormCoachCTA lastSession={lastSession} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weeklyPlan.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setSelectedDay(i)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              i === selectedDay ? 'bg-primary-500/20 text-ink' : 'bg-surface-2 text-ink-muted hover:text-ink'
            } ${i === todayIndex ? 'ring-1 ring-primary-400/50' : ''}`}
          >
            {d.day.slice(0, 3)}
          </button>
        ))}
      </div>

      {dayPlan && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              {dayPlan.day}
              {isToday && <Badge tone="primary">Today</Badge>}
              <Badge tone={TYPE_TONE[dayPlan.type] || 'neutral'}>{dayPlan.type}</Badge>
            </h3>
            {!dayPlan.restDay && (
              <span className="flex items-center gap-3 text-xs text-ink-faint">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{dayPlan.totalMinutes} min</span>
                <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> ~{dayPlan.estCalories} kcal</span>
              </span>
            )}
          </div>

          {dayPlan.restDay ? (
            <p className="mt-3 text-sm text-ink-muted">Rest day — recovery, light stretching, or a gentle walk.</p>
          ) : (
            <>
              <p className="mt-2 font-display text-xl font-semibold text-ink">{dayPlan.focus}</p>

              <div className="mt-4 space-y-4">
                <PlanSection title="Warm-up" items={dayPlan.warmup} />
                <PlanSection title="Workout" items={dayPlan.main} />
                <PlanSection title="Cooldown" items={dayPlan.cooldown} />
              </div>

              <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-faint">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {dayPlan.progressionNote}
              </p>

              <Button
                className="mt-4 w-full"
                onClick={() => navigate(`/dashboard/exercise/workout?day=${selectedDay}`)}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Start workout
              </Button>

              {isToday && (
                <button
                  onClick={() => onToggle({ itemType: 'workout', itemKey: 'workout', itemName: dayPlan.focus })}
                  className={`mt-2 w-full rounded-lg py-2 text-xs font-medium transition-colors ${
                    done ? 'bg-success-500/15 text-success-400' : 'bg-surface-2 text-ink-muted hover:bg-surface-3'
                  }`}
                >
                  {done ? 'Completed' : 'Mark as complete'}
                </button>
              )}
            </>
          )}
        </Card>
      )}
    </motion.div>
  );
};

// ---------- Library ----------

const LibraryTab: React.FC = () => {
  const { filtered, loading, error, filters, setFilters, bodyParts, equipments } = useExerciseLibrary();
  const [selected, setSelected] = useState<ExerciseInfo | null>(null);

  return (
    <motion.div variants={item} className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder="Search exercises — e.g. squat, lat pulldown"
              className="w-full rounded-xl border border-surface-line-strong bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filters.bodyPart}
            onChange={(e) => setFilters((f) => ({ ...f, bodyPart: e.target.value }))}
            className="rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink capitalize focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All body parts</option>
            {bodyParts.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filters.equipment}
            onChange={(e) => setFilters((f) => ({ ...f, equipment: e.target.value }))}
            className="rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink capitalize focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All equipment</option>
            {equipments.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState icon={Dumbbell} title="Library unavailable" description="Couldn't reach the exercise database. Check your connection and try again." className="py-12" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="No matches" description="Try a different search term or clear the filters." className="py-12" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 60).map((ex) => (
            <Card key={ex.id} interactive onClick={() => setSelected(ex)} className="flex items-center gap-3 p-3">
              {ex.mediaUrl ? (
                <img src={ex.mediaUrl} alt={ex.name} className="h-14 w-14 flex-shrink-0 rounded-lg bg-surface-2 object-contain" />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-faint">
                  <Dumbbell className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize text-ink">{ex.name}</p>
                <p className="truncate text-xs capitalize text-ink-faint">{ex.bodyPart} · {ex.equipment}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />
    </motion.div>
  );
};

// ---------- History ----------

const HistoryTab: React.FC = () => {
  const { sessions, loading } = useWorkoutSessions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <motion.div variants={item} className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </motion.div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div variants={item}>
        <Card>
          <EmptyState
            icon={Sparkles}
            title="No workouts yet"
            description="Finish a Quick Workout, a plan workout, or a Form Coach session and it will show up here."
            actionLabel="Start a Quick Workout"
            onAction={() => navigate('/dashboard/exercise/workout')}
            className="py-16"
          />
        </Card>
      </motion.div>
    );
  }

  const SOURCE_LABEL: Record<string, { label: string; tone: 'primary' | 'success' | 'neutral' }> = {
    coach: { label: 'Coach', tone: 'primary' },
    quick: { label: 'Quick', tone: 'success' },
    plan: { label: 'Plan', tone: 'neutral' },
  };

  return (
    <motion.div variants={item} className="space-y-3">
      {sessions.map((s) => {
        const src = SOURCE_LABEL[s.source ?? 'coach'] ?? SOURCE_LABEL.coach;
        const exerciseList = Array.isArray(s.exercises)
          ? (s.exercises as { name?: string }[]).map((e) => e?.name).filter(Boolean).join(', ')
          : '';
        return (
          <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium capitalize text-ink">
                  {exerciseList || s.exercise_key.replace(/-/g, ' ')}
                </p>
                <Badge tone={src.tone}>{src.label}</Badge>
              </div>
              <p className="text-xs text-ink-faint">
                {new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{Math.floor(s.duration_seconds / 60)}:{String(s.duration_seconds % 60).padStart(2, '0')}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-5 text-sm">
              <div className="text-center">
                <p className="font-semibold text-ink tabular-nums">{s.total_reps}</p>
                <p className="text-xs text-ink-faint">reps</p>
              </div>
              {s.calories != null && (
                <div className="text-center">
                  <p className="font-semibold text-primary-300 tabular-nums">{Math.round(Number(s.calories))}</p>
                  <p className="text-xs text-ink-faint">kcal</p>
                </div>
              )}
              <div className="text-center">
                <p className={`font-semibold tabular-nums ${(s.avg_form_score ?? 0) >= 80 ? 'text-success-400' : (s.avg_form_score ?? 0) >= 60 ? 'text-primary-300' : 'text-secondary-400'}`}>
                  {s.avg_form_score != null ? Math.round(s.avg_form_score) : '—'}
                </p>
                <p className="text-xs text-ink-faint">form score</p>
              </div>
            </div>
          </Card>
        );
      })}
    </motion.div>
  );
};

export default ExercisePage;
