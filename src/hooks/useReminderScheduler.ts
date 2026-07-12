import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useSettings } from './useSettings';
import { scheduleReminders, stopReminders } from '../lib/reminderScheduler';

// Mounts the local reminder scheduler for the lifetime of the dashboard.
// Re-derives schedules whenever reminder settings change or the tab regains
// visibility (covers clock drift / long-sleep timer inaccuracy). No-ops
// entirely inside the Capacitor native shell — local web notifications don't
// apply there (native push/local-notification plugins are out of scope).
export function useReminderScheduler() {
  const { settings, loading } = useSettings();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative || loading) return;

    scheduleReminders(settings.reminders);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleReminders(settings.reminders);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopReminders();
    };
  }, [isNative, loading, settings.reminders]);
}
