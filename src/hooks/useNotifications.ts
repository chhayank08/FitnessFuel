import { useMemo } from 'react';
import { Scale, Flame, UtensilsCrossed, UserCog, LucideIcon } from 'lucide-react';
import { ProgressLog } from './useWeightHistory';
import { Consumed } from './useDailyLog';
import { NutritionTargets } from '../lib/nutrition';

export interface Notification {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'alert';
}

// Notifications are derived from the user's own data — no table behind them.
export function useNotifications(args: {
  profileComplete: boolean;
  logs: ProgressLog[];
  consumed: Consumed;
  targets: NutritionTargets | null;
  streak: number;
}): Notification[] {
  const { profileComplete, logs, consumed, targets, streak } = args;

  return useMemo(() => {
    const notifications: Notification[] = [];

    if (!profileComplete) {
      notifications.push({
        id: 'complete-profile',
        title: 'Complete your profile',
        description: 'Add your weight and height to unlock personalized targets.',
        icon: UserCog,
        tone: 'primary',
      });
    }

    const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const hasRecentWeighIn = logs.some((l) => new Date(l.created_at).getTime() > weekAgoMs);
    if (profileComplete && !hasRecentWeighIn) {
      notifications.push({
        id: 'log-weight',
        title: 'Time for a weigh-in',
        description: "You haven't logged your weight this week.",
        icon: Scale,
        tone: 'alert',
      });
    }

    if (targets && new Date().getHours() >= 18 && consumed.calories < targets.dailyCalories * 0.5) {
      notifications.push({
        id: 'under-target',
        title: `${(targets.dailyCalories - consumed.calories).toLocaleString()} kcal under target`,
        description: 'Check off your meals as you eat to keep the ring accurate.',
        icon: UtensilsCrossed,
        tone: 'primary',
      });
    }

    if (streak >= 3) {
      notifications.push({
        id: 'streak',
        title: `${streak}-day streak`,
        description: 'Keep it going — log something today.',
        icon: Flame,
        tone: 'success',
      });
    }

    return notifications;
  }, [profileComplete, logs, consumed, targets, streak]);
}
