import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AppSettings {
  notifications: {
    email: boolean;
    push: boolean;
    workoutReminders: boolean;
    productUpdates: boolean;
  };
  privacy: {
    publicProfile: boolean;
    shareProgress: boolean;
  };
  coach: {
    voiceFeedback: boolean;
  };
  units: {
    weight: 'kg' | 'lbs';
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: { email: true, push: true, workoutReminders: true, productUpdates: false },
  privacy: { publicProfile: false, shareProgress: false },
  coach: { voiceFeedback: true },
  units: { weight: 'kg' },
};

function mergeSettings(stored: unknown): AppSettings {
  const s = (stored || {}) as Partial<AppSettings>;
  return {
    notifications: { ...DEFAULT_SETTINGS.notifications, ...s.notifications },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...s.privacy },
    coach: { ...DEFAULT_SETTINGS.coach, ...s.coach },
    units: { ...DEFAULT_SETTINGS.units, ...s.units },
  };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error && error.code !== '42P01') console.error('Error fetching settings:', error);
      setSettings(mergeSettings(data?.settings));
      setLoading(false);
    })();
  }, [user]);

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next: AppSettings = {
          notifications: { ...prev.notifications, ...patch.notifications },
          privacy: { ...prev.privacy, ...patch.privacy },
          coach: { ...prev.coach, ...patch.coach },
          units: { ...prev.units, ...patch.units },
        };
        if (user) {
          clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(async () => {
            const { error } = await supabase.from('user_settings').upsert({
              user_id: user.id,
              settings: next as unknown as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            });
            if (error) {
              if (error.code === '42P01') toast.error('Settings need the latest database migration.');
              else toast.error('Could not save settings.');
              console.error('Error saving settings:', error);
            }
          }, 500);
        }
        return next;
      });
    },
    [user]
  );

  return { settings, update, loading };
}
