import React, { useMemo } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Activity, Flame, HeartPulse, Weight, UserCog, Footprints, Moon, ScanFace, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { getTodaysPlan } from '../../lib/planGenerator';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';
import { useWeeklyActivity } from '../../hooks/useWeeklyActivity';
import { useWorkoutSessions } from '../../hooks/useWorkoutSessions';
import { computeHealthScore } from '../../lib/healthScore';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import StatTile from '../../components/dashboard/StatTile';
import MetricStatCard from '../../components/dashboard/MetricStatCard';
import CalorieRing from '../../components/dashboard/CalorieRing';
import MacroBars from '../../components/dashboard/MacroBars';
import WaterTracker from '../../components/dashboard/WaterTracker';
import StreakCard from '../../components/dashboard/StreakCard';
import GoalProgressCard from '../../components/dashboard/GoalProgressCard';
import InsightCard from '../../components/dashboard/InsightCard';
import WeightTrendChart from '../../components/dashboard/WeightTrendChart';
import TodaysPlanCard from '../../components/dashboard/TodaysPlanCard';
import { useNavigate } from 'react-router-dom';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { profile, profileLoading, dailyLog, weightHistory, streak, insights, quickAdd } = useDailyLogContext();
  const metrics = useHealthMetrics(14);
  const activity = useWeeklyActivity(`${dailyLog.completions.length}`);
  const { sessions } = useWorkoutSessions();

  const { nutritionProfile, targets, bmi, currentWeight, startWeight, weeklyDeltaKg, projectedGoalDate, insightTexts } = insights;

  const todaysPlan = useMemo(
    () => (nutritionProfile && profile ? getTodaysPlan(profile) : null),
    [nutritionProfile, profile]
  );

  const healthScore = useMemo(
    () =>
      computeHealthScore({
        streakDays: streak.current,
        waterMl: dailyLog.waterMl,
        waterTargetMl: targets?.waterMl ?? 2500,
        weeklyDeltaKg,
        goal: nutritionProfile?.goal ?? 'maintain',
        avgSteps7d: metrics.avgLast('steps', 7),
        avgSleepMin7d: metrics.avgLast('sleep_minutes', 7),
        workouts7d: activity.workouts7d,
      }),
    [streak, dailyLog.waterMl, targets, weeklyDeltaKg, nutritionProfile, metrics, activity.workouts7d]
  );

  const lastSession = sessions[0];

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-7xl"
      variants={reducedMotion ? undefined : container}
      initial="hidden"
      animate="show"
    >
      {/* Greeting */}
      <motion.div variants={item} className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">{todayLabel}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white">
            Welcome back, <span className="capitalize">{displayName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {nutritionProfile && (
            <button
              onClick={() => navigate('/dashboard/progress')}
              className="flex items-center gap-1.5 rounded-full border border-surface-line-strong bg-surface-2 px-3 py-1 text-sm text-gray-300 transition-colors hover:text-white"
            >
              <HeartPulse className="h-3.5 w-3.5 text-primary-300" />
              Health Score <span className="font-semibold text-white tabular-nums">{healthScore.score}</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
          {streak.current > 0 && (
            <Badge tone="success" className="px-3 py-1 text-sm">
              <Flame className="h-3.5 w-3.5" />
              {streak.current}-day streak
            </Badge>
          )}
        </div>
      </motion.div>

      {!nutritionProfile ? (
        <motion.div variants={item}>
          <Card>
            <EmptyState
              icon={UserCog}
              title="Set up your dashboard"
              description="Add your weight, height, and goal to your profile — your calorie targets, macros, and daily plan are built from them."
              actionLabel="Complete profile"
              onAction={() => navigate('/dashboard/profile')}
              className="py-16"
            />
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={item}>
              <StatTile
                title="Current weight"
                value={currentWeight ?? 0}
                format={(n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                unit="kg"
                icon={Weight}
                delta={weeklyDeltaKg}
                deltaSuffix=" kg this week"
                negativeIsGood={nutritionProfile.goal === 'weight_loss'}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatTile
                title="Calories remaining"
                value={Math.max((targets?.dailyCalories ?? 0) - dailyLog.consumed.calories, 0)}
                unit="kcal"
                icon={Flame}
                iconClassName="bg-secondary-500/15 text-secondary-400"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatTile
                title="BMI"
                value={bmi?.bmi ?? 0}
                format={(n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                unit={bmi?.category}
                icon={HeartPulse}
                iconClassName="bg-success-500/15 text-success-400"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatTile
                title="Daily burn (TDEE)"
                value={targets?.tdee ?? 0}
                unit="kcal"
                icon={Activity}
                iconClassName="bg-hydration-500/15 text-hydration-400"
              />
            </motion.div>
          </div>

          {/* Tracking row */}
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <motion.div variants={item} className="lg:col-span-4">
              <CalorieRing consumed={dailyLog.consumed.calories} target={targets?.dailyCalories ?? 0} className="h-full" />
            </motion.div>
            <div className="flex flex-col gap-5 lg:col-span-4">
              <motion.div variants={item} className="flex-1">
                <MacroBars consumed={dailyLog.consumed} targets={targets!} className="h-full" />
              </motion.div>
              <motion.div variants={item}>
                <WaterTracker waterMl={dailyLog.waterMl} targetMl={targets?.waterMl ?? 2500} onAdd={dailyLog.addWater} />
              </motion.div>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-4">
              <motion.div variants={item}>
                <StreakCard streak={streak} />
              </motion.div>
              <motion.div variants={item} className="flex-1">
                <GoalProgressCard
                  startWeight={startWeight ?? nutritionProfile.weight}
                  currentWeight={currentWeight ?? nutritionProfile.weight}
                  targetWeight={nutritionProfile.targetWeight}
                  projectedDate={projectedGoalDate}
                  className="h-full"
                />
              </motion.div>
            </div>
          </div>

          {/* Wearable strip — only shown once a device has synced data */}
          {metrics.hasData && (
            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <motion.div variants={item}>
                <MetricStatCard
                  title="Steps today"
                  value={metrics.latest('steps')}
                  format={(n) => Math.round(n).toLocaleString()}
                  icon={Footprints}
                  iconClassName="bg-primary-500/15 text-primary-300"
                  sparkData={metrics.sparkValues('steps', 7)}
                  sparkColor="#857BFF"
                />
              </motion.div>
              <motion.div variants={item}>
                <MetricStatCard
                  title="Sleep last night"
                  value={metrics.latest('sleep_minutes') != null ? metrics.latest('sleep_minutes')! / 60 : null}
                  format={(n) => n.toFixed(1)}
                  unit="h"
                  icon={Moon}
                  iconClassName="bg-hydration-500/15 text-hydration-400"
                  sparkData={metrics.sparkValues('sleep_minutes', 7)}
                  sparkColor="#38BDF8"
                />
              </motion.div>
              <motion.div variants={item}>
                <MetricStatCard
                  title="Resting heart rate"
                  value={metrics.latest('heart_rate_resting')}
                  unit="bpm"
                  icon={HeartPulse}
                  iconClassName="bg-secondary-500/15 text-secondary-400"
                  sparkData={metrics.sparkValues('heart_rate_resting', 7)}
                  sparkColor="#FF6584"
                />
              </motion.div>
            </div>
          )}

          {/* Form Coach CTA */}
          <motion.div variants={item} className="mb-5">
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  <ScanFace className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {lastSession ? `Last session: ${lastSession.exercise_key.replace(/-/g, ' ')}` : 'Try the AI Form Coach'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lastSession
                      ? `${lastSession.total_reps} reps · form score ${lastSession.avg_form_score != null ? Math.round(lastSession.avg_form_score) : '—'}`
                      : 'Live rep counting and form feedback using your webcam'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/coach')}
                className="flex items-center gap-1 text-sm font-medium text-primary-300 hover:text-primary-200"
              >
                {lastSession ? 'New session' : 'Get started'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </Card>
          </motion.div>

          {/* Plan + trend row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <motion.div variants={item} className="lg:col-span-7">
              <TodaysPlanCard
                plan={todaysPlan}
                isCompleted={dailyLog.isCompleted}
                onToggle={dailyLog.toggleCompletion}
                className="h-full"
              />
            </motion.div>
            <div className="flex flex-col gap-5 lg:col-span-5">
              <motion.div variants={item}>
                <WeightTrendChart logs={weightHistory.logs} onLogWeight={() => quickAdd.openWith('weight')} />
              </motion.div>
              <motion.div variants={item} className="flex-1">
                <InsightCard texts={insightTexts} className="h-full" />
              </motion.div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default DashboardHome;
