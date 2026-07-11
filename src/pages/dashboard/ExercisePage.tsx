import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Search, Dumbbell, Clock, UserCog, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { generateWeeklyExercisePlan } from '../../lib/planGenerator';
import { useExerciseLibrary } from '../../hooks/useExerciseLibrary';
import { useWorkoutSessions } from '../../hooks/useWorkoutSessions';
import { ExerciseInfo } from '../../services/exercises';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
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
  const weeklyPlan = useMemo(() => (nutritionProfile && profile ? generateWeeklyExercisePlan(profile) : []), [nutritionProfile, profile]);

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
          <h1 className="font-display text-3xl font-semibold text-white">Training</h1>
          <p className="mt-1 text-sm text-gray-400">Your weekly plan, the full exercise library, and session history</p>
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

const PlanTab: React.FC<{
  weeklyPlan: ReturnType<typeof generateWeeklyExercisePlan>;
  isCompleted: (type: 'meal' | 'workout', key: string) => boolean;
  onToggle: (item: { itemType: 'meal' | 'workout'; itemKey: string; itemName: string }) => void;
  initialDay?: number;
  lastSession?: ReturnType<typeof useWorkoutSessions>['sessions'][number];
}> = ({ weeklyPlan, isCompleted, onToggle, initialDay, lastSession }) => {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(initialDay ?? todayIndex);
  const dayPlan = weeklyPlan[selectedDay];
  const workout = dayPlan?.exercises[0];
  const isRest = workout?.type === 'rest';
  const isToday = selectedDay === todayIndex;
  const done = isToday && !isRest && isCompleted('workout', 'workout');

  return (
    <motion.div variants={item} className="space-y-5">
      <FormCoachCTA lastSession={lastSession} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weeklyPlan.map((dayPlan, i) => (
          <button
            key={dayPlan.day}
            onClick={() => setSelectedDay(i)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              i === selectedDay ? 'bg-primary-500/20 text-white' : 'bg-surface-2 text-gray-400 hover:text-white'
            } ${i === todayIndex ? 'ring-1 ring-primary-400/50' : ''}`}
          >
            {dayPlan.day.slice(0, 3)}
          </button>
        ))}
      </div>

      {dayPlan && workout && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              {dayPlan.day}
              {isToday && <Badge tone="primary">Today</Badge>}
            </h3>
            {!isRest && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {workout.duration}
              </span>
            )}
          </div>

          {isRest ? (
            <p className="mt-3 text-sm text-gray-400">Rest day — recovery, light stretching, or a gentle walk.</p>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-white">{workout.name}</p>
                <Badge tone={TYPE_TONE[workout.type] || 'neutral'} className="mt-1">{workout.type}</Badge>
              </div>
              <span className="text-xs text-gray-400">{workout.calories_burned} kcal</span>
            </div>
          )}

          {isToday && !isRest && (
            <button
              onClick={() => onToggle({ itemType: 'workout', itemKey: 'workout', itemName: workout.name })}
              className={`mt-3 w-full rounded-lg py-2 text-xs font-medium transition-colors ${
                done ? 'bg-success-500/15 text-success-400' : 'bg-surface-2 text-gray-300 hover:bg-surface-3'
              }`}
            >
              {done ? 'Completed' : 'Mark as complete'}
            </button>
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
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder="Search exercises — e.g. squat, lat pulldown"
              className="w-full rounded-xl border border-surface-line-strong bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filters.bodyPart}
            onChange={(e) => setFilters((f) => ({ ...f, bodyPart: e.target.value }))}
            className="rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white capitalize focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All body parts</option>
            {bodyParts.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filters.equipment}
            onChange={(e) => setFilters((f) => ({ ...f, equipment: e.target.value }))}
            className="rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white capitalize focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-gray-500">
                  <Dumbbell className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize text-white">{ex.name}</p>
                <p className="truncate text-xs capitalize text-gray-500">{ex.bodyPart} · {ex.equipment}</p>
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
            title="No Form Coach sessions yet"
            description="Analyze a workout with the AI Form Coach and your rep counts and form scores will show up here."
            actionLabel="Open Form Coach"
            onAction={() => navigate('/dashboard/exercise/coach')}
            className="py-16"
          />
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={item} className="space-y-3">
      {sessions.map((s) => (
        <Card key={s.id} className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium capitalize text-white">{s.exercise_key.replace(/-/g, ' ')}</p>
            <p className="text-xs text-gray-500">{new Date(s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-white tabular-nums">{s.total_reps}</p>
              <p className="text-xs text-gray-500">reps</p>
            </div>
            <div className="text-center">
              <p className={`font-semibold tabular-nums ${(s.avg_form_score ?? 0) >= 80 ? 'text-success-400' : (s.avg_form_score ?? 0) >= 60 ? 'text-primary-300' : 'text-secondary-400'}`}>
                {s.avg_form_score != null ? Math.round(s.avg_form_score) : '—'}
              </p>
              <p className="text-xs text-gray-500">form score</p>
            </div>
          </div>
        </Card>
      ))}
    </motion.div>
  );
};

export default ExercisePage;
