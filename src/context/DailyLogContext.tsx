import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useProfile, ProfileRow } from '../hooks/useProfile';
import { useDailyLog } from '../hooks/useDailyLog';
import { useWeightHistory } from '../hooks/useWeightHistory';
import { useStreak, Streak } from '../hooks/useStreak';
import { useInsights, Insights } from '../hooks/useInsights';
import { useNotifications, Notification } from '../hooks/useNotifications';

export type QuickAddTab = 'weight' | 'water' | 'meal';

interface DailyLogContextValue {
  profile: ProfileRow | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  dailyLog: ReturnType<typeof useDailyLog>;
  weightHistory: ReturnType<typeof useWeightHistory>;
  streak: Streak;
  insights: Insights;
  notifications: Notification[];
  quickAdd: { open: boolean; tab: QuickAddTab; openWith: (tab?: QuickAddTab) => void; close: () => void };
  palette: { open: boolean; setOpen: (open: boolean) => void };
}

const DailyLogContext = createContext<DailyLogContextValue | null>(null);

export const DailyLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const dailyLog = useDailyLog();
  const weightHistory = useWeightHistory();
  const streak = useStreak(`${dailyLog.completions.length}-${dailyLog.waterMl}`);
  const insights = useInsights(profile, weightHistory.logs);
  const notifications = useNotifications({
    profileComplete: insights.nutritionProfile != null,
    logs: weightHistory.logs,
    consumed: dailyLog.consumed,
    targets: insights.targets,
    streak: streak.current,
  });

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<QuickAddTab>('weight');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openWith = useCallback((tab: QuickAddTab = 'weight') => {
    setQuickAddTab(tab);
    setQuickAddOpen(true);
  }, []);
  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), []);

  const value = useMemo<DailyLogContextValue>(
    () => ({
      profile,
      profileLoading,
      refreshProfile,
      dailyLog,
      weightHistory,
      streak,
      insights,
      notifications,
      quickAdd: { open: quickAddOpen, tab: quickAddTab, openWith, close: closeQuickAdd },
      palette: { open: paletteOpen, setOpen: setPaletteOpen },
    }),
    [profile, profileLoading, refreshProfile, dailyLog, weightHistory, streak, insights, notifications, quickAddOpen, quickAddTab, openWith, closeQuickAdd, paletteOpen]
  );

  return <DailyLogContext.Provider value={value}>{children}</DailyLogContext.Provider>;
};

export function useDailyLogContext(): DailyLogContextValue {
  const ctx = useContext(DailyLogContext);
  if (!ctx) throw new Error('useDailyLogContext must be used within DailyLogProvider');
  return ctx;
}
