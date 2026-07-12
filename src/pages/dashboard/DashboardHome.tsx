import React, { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Activity, Flame, HeartPulse, Weight, UserCog, Footprints, Moon, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { generateWeeklyMealPlan, generateWeeklyExercisePlan } from '../../lib/planGenerator';
import { useTodaysPlan } from '../../hooks/useTodaysPlan';
import { useHealthMetrics } from '../../hooks/useHealthMetrics';
import { useWeeklyActivity } from '../../hooks/useWeeklyActivity';
import { useSettings } from '../../hooks/useSettings';
import { computeHealthScore } from '../../lib/healthScore';
import { convertWeight } from '../../lib/units';
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
import NextActionCard from '../../components/dashboard/NextActionCard';
import CoachTipCard from '../../components/dashboard/CoachTipCard';
import WeekAtAGlanceStrip from '../../components/dashboard/WeekAtAGlanceStrip';
import { useTour } from '../../components/onboarding/TourContext';
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
  const { settings } = useSettings();
  const weightUnit = settings.units.weight;
  const metrics = useHealthMetrics(14);
  const activity = useWeeklyActivity(`${dailyLog.completions.length}`);

  const { nutritionProfile, targets, bmi, currentWeight, startWeight, weeklyDeltaKg, projectedGoalDate, insightTexts } = insights;

  const { plan: todaysPlan } = useTodaysPlan(profile, nutritionProfile != null);

  // First-run product tour: only after the profile wizard is complete.
  const tour = useTour();
  const tourStarted = useRef(false);
  useEffect(() => {
    if (tourStarted.current || profileLoading || !nutritionProfile || tour.isDone()) return;
    tourStarted.current = true;
    const t = setTimeout(() => tour.start(), 600);
    return () => clearTimeout(t);
  }, [profileLoading, nutritionProfile, tour]);

  const weeklyMealPlan = useMemo(
    () => (nutritionProfile && profile ? generateWeeklyMealPlan(profile) : []),
    [nutritionProfile, profile]
  );
  const weeklyExercisePlan = useMemo(
    () => (nutritionProfile && profile ? generateWeeklyExercisePlan(profile) : []),
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
          <p className="text-sm text-ink-muted">{todayLabel}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            Welcome back, <span className="capitalize">{displayName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {nutritionProfile && (
            <button
              onClick={() => navigate('/dashboard/progress')}
              className="flex items-center gap-1.5 rounded-full border border-surface-line-strong bg-surface-2 px-3 py-1 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <HeartPulse className="h-3.5 w-3.5 text-primary-300" />
              Health Score <span className="font-semibold text-ink tabular-nums">{healthScore.score}</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
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
              description="Add your weight, height, and goal — your calorie targets, macros, and daily plan are built from them."
              actionLabel="Get started"
              onAction={() => navigate('/dashboard/welcome')}
              className="py-16"
            />
          </Card>
        </motion.div>
      ) : (
        <>
          {/* What should I do right now */}
          <motion.div variants={item} className="mb-5">
            <NextActionCard plan={todaysPlan} />
          </motion.div>

          {/* Right now: rings + water + streak/goal */}
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <motion.div variants={item} className="lg:col-span-4" data-tour="calorie-ring">
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
                  unit={weightUnit}
                  className="h-full"
                />
              </motion.div>
            </div>
          </div>

          {/* Today's plan + this week */}
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <motion.div variants={item} className="lg:col-span-7" data-tour="todays-plan">
              <TodaysPlanCard
                plan={todaysPlan}
                isCompleted={dailyLog.isCompleted}
                onToggle={dailyLog.toggleCompletion}
                className="h-full"
              />
            </motion.div>
            <motion.div variants={item} className="lg:col-span-5">
              <WeekAtAGlanceStrip
                mealPlan={weeklyMealPlan}
                exercisePlan={weeklyExercisePlan}
                todayCompleted={{
                  meals: todaysPlan != null && todaysPlan.meals.every((m) => dailyLog.isCompleted('meal', m.key)),
                  workout: dailyLog.isCompleted('workout', 'workout'),
                }}
                className="h-full"
              />
            </motion.div>
          </div>

          {/* Stat tiles */}
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={item}>
              <StatTile
                title="Current weight"
                value={convertWeight(currentWeight ?? 0, weightUnit)}
                format={(n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                unit={weightUnit}
                icon={Weight}
                delta={weeklyDeltaKg != null ? Math.round(convertWeight(weeklyDeltaKg, weightUnit) * 10) / 10 : weeklyDeltaKg}
                deltaSuffix={` ${weightUnit} this week`}
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

          {/* Trend + insights */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <motion.div variants={item}>
              <WeightTrendChart logs={weightHistory.logs} onLogWeight={() => quickAdd.openWith('weight')} />
            </motion.div>
            <motion.div variants={item}>
              <InsightCard texts={insightTexts} className="h-full" />
            </motion.div>
          </div>

          <motion.div variants={item} className="mt-5">
            <CoachTipCard />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default DashboardHome;
