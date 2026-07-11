import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Plus, Footprints, HeartPulse, Moon, Percent, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';
import { useWeeklyActivity } from '../../hooks/useWeeklyActivity';
import { computeHealthScore } from '../../lib/healthScore';
import { connectDemo } from '../../services/wearables';
import HealthScoreCard from '../../components/dashboard/HealthScoreCard';
import MetricStatCard from '../../components/dashboard/MetricStatCard';
import WeightTrendChart from '../../components/dashboard/WeightTrendChart';
import BodyCompChart from '../../components/dashboard/BodyCompChart';
import ActivityConsistencyChart from '../../components/dashboard/ActivityConsistencyChart';

const RANGE_OPTIONS = [
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
];

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const ProgressPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const { dailyLog, weightHistory, streak, insights, quickAdd } = useDailyLogContext();
  const [range, setRange] = useState('90');
  const [connectingDemo, setConnectingDemo] = useState(false);
  const metrics = useHealthMetrics(parseInt(range, 10));
  const activity = useWeeklyActivity(`${dailyLog.completions.length}`);

  const tryDemoData = async () => {
    if (!user) return;
    setConnectingDemo(true);
    try {
      await connectDemo(user.id);
      await metrics.refresh();
      toast.success('Demo data connected — your charts are populated');
    } catch (e) {
      console.error(e);
      toast.error('Could not connect demo data. Try again.');
    } finally {
      setConnectingDemo(false);
    }
  };

  const health = useMemo(
    () =>
      computeHealthScore({
        streakDays: streak.current,
        waterMl: dailyLog.waterMl,
        waterTargetMl: insights.targets?.waterMl ?? 2500,
        weeklyDeltaKg: insights.weeklyDeltaKg,
        goal: insights.nutritionProfile?.goal ?? 'maintain',
        avgSteps7d: metrics.avgLast('steps', 7),
        avgSleepMin7d: metrics.avgLast('sleep_minutes', 7),
        workouts7d: activity.workouts7d,
      }),
    [streak, dailyLog.waterMl, insights.targets, insights.weeklyDeltaKg, insights.nutritionProfile, metrics, activity.workouts7d]
  );

  const loading = weightHistory.loading || metrics.loading;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div className="mx-auto max-w-7xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Health</h1>
          <p className="mt-1 text-sm text-gray-400">Your composite wellness score, vitals, and long-term trends</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={RANGE_OPTIONS} active={range} onChange={setRange} size="sm" />
          <Button variant="subtle" size="sm" onClick={() => quickAdd.openWith('weight')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Log progress
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <HealthScoreCard health={health} />
      </motion.div>

      {!metrics.hasData && (
        <motion.div variants={item} className="mb-5">
          <Card>
            <EmptyState
              icon={Sparkles}
              title="No wearable data yet"
              description="Connect a device to see steps, sleep, heart rate, and body composition here — or try it now with demo data."
              actionLabel={connectingDemo ? 'Connecting…' : 'Try with demo data'}
              onAction={tryDemoData}
              className="py-16"
            />
          </Card>
        </motion.div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <MetricStatCard
            title="Steps (7d avg)"
            value={metrics.avgLast('steps', 7)}
            format={(n) => Math.round(n).toLocaleString()}
            icon={Footprints}
            iconClassName="bg-primary-500/15 text-primary-300"
            sparkData={metrics.sparkValues('steps', 14)}
            sparkColor="#857BFF"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricStatCard
            title="Resting heart rate"
            value={metrics.latest('heart_rate_resting')}
            unit="bpm"
            icon={HeartPulse}
            iconClassName="bg-secondary-500/15 text-secondary-400"
            sparkData={metrics.sparkValues('heart_rate_resting', 14)}
            sparkColor="#FF6584"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricStatCard
            title="Sleep (7d avg)"
            value={metrics.avgLast('sleep_minutes', 7) != null ? metrics.avgLast('sleep_minutes', 7)! / 60 : null}
            format={(n) => n.toFixed(1)}
            unit="h"
            icon={Moon}
            iconClassName="bg-hydration-500/15 text-hydration-400"
            sparkData={metrics.sparkValues('sleep_minutes', 14)}
            sparkColor="#38BDF8"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricStatCard
            title="Body fat"
            value={metrics.latest('body_fat_pct')}
            format={(n) => n.toFixed(1)}
            unit="%"
            icon={Percent}
            iconClassName="bg-success-500/15 text-success-400"
            sparkData={metrics.sparkValues('body_fat_pct', 12)}
            sparkColor="#34D399"
          />
        </motion.div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <motion.div variants={item}>
          <WeightTrendChart logs={weightHistory.logs} onLogWeight={() => quickAdd.openWith('weight')} rangeControl title="Weight trend" />
        </motion.div>
        <motion.div variants={item}>
          <BodyCompChart bodyFat={metrics.get('body_fat_pct')} muscleMass={metrics.get('muscle_mass_kg')} />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <ActivityConsistencyChart days={activity.days} />
      </motion.div>

      {weightHistory.logs.some((l) => l.notes || l.mood) && (
        <motion.div variants={item} className="mt-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-white">Notes &amp; mood</h3>
            <div className="mt-3 space-y-3">
              {weightHistory.logs
                .filter((l) => l.notes || l.mood)
                .slice(-6)
                .reverse()
                .map((log) => (
                  <div key={log.id} className="rounded-xl bg-surface-2 p-3">
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    {log.mood && <p className="mt-1 text-sm text-gray-300">Mood: {log.mood}</p>}
                    {log.notes && <p className="mt-1 text-sm text-gray-400">{log.notes}</p>}
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProgressPage;
