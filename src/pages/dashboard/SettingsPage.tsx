import React, { useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Download, Trash2, AlertTriangle, Moon, Sun, RefreshCcw, BellRing } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { useThemeContext } from '../../context/ThemeContext';
import { useTour } from '../../components/onboarding/TourContext';
import { TOUR_STORAGE_KEY } from '../../components/onboarding/tourSteps';
import { getNotificationSupport, getPermission, requestNotificationPermission } from '../../lib/notificationPermission';
import { usePushSubscription } from '../../hooks/usePushSubscription';
import Card from '../../components/ui/Card';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const ROW_TABLES = ['profiles', 'diet_plans', 'exercise_plans', 'progress_logs', 'daily_logs', 'plan_completions', 'health_metrics', 'device_connections', 'workout_sessions', 'saved_foods', 'user_settings'] as const;

const SettingRow: React.FC<{ title: string; description: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  title,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-xs text-ink-muted">{description}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} label={title} />
  </div>
);

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const { settings, update, loading } = useSettings();
  const { theme, toggleTheme } = useThemeContext();
  const tour = useTour();
  const replayTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    tour.start();
  };
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const notificationSupport = getNotificationSupport();
  const permission = getPermission();
  const push = usePushSubscription();
  const [sendingTest, setSendingTest] = useState(false);

  const togglePush = async () => {
    if (push.isSubscribed) {
      await push.unsubscribe();
      return;
    }
    if (notificationSupport !== 'supported') {
      toast.error(
        notificationSupport === 'ios-not-installed'
          ? 'Add FitnessFuel to your Home Screen first — Safari can\'t send notifications from a browser tab.'
          : "This browser doesn't support notifications."
      );
      return;
    }
    if (permission === 'denied') {
      toast.error('Notifications are blocked for this site — enable them in your browser settings.');
      return;
    }
    if (permission === 'default') {
      const result = await requestNotificationPermission();
      if (result !== 'granted') {
        toast.error('Notifications permission was not granted.');
        return;
      }
    }
    const ok = await push.subscribe();
    if (ok) toast.success('Push notifications enabled on this device');
    else toast.error('Could not enable push notifications');
  };

  const sendTestPush = async () => {
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', { body: { action: 'send-test' } });
      if (error || !data?.ok) {
        toast.error((data?.error as string) || 'Test push failed to send');
      } else {
        toast.success(`Test push sent (${data.sent}/${data.total})`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Test push failed to send');
    } finally {
      setSendingTest(false);
    }
  };

  // Must run synchronously inside the click that flips a reminder toggle on
  // — Safari silently drops the permission prompt if there's an await first.
  const enableReminder = async (patch: Partial<typeof settings.reminders>) => {
    if (notificationSupport !== 'supported') {
      toast.error(
        notificationSupport === 'ios-not-installed'
          ? 'Add FitnessFuel to your Home Screen first — Safari can\'t send notifications from a browser tab.'
          : "This browser doesn't support notifications."
      );
      return;
    }
    if (permission === 'denied') {
      toast.error('Notifications are blocked for this site — enable them in your browser settings.');
      return;
    }
    if (permission === 'default') {
      const result = await requestNotificationPermission();
      if (result !== 'granted') {
        toast.error('Notifications permission was not granted.');
        return;
      }
    }
    update({ reminders: { ...settings.reminders, ...patch } });
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const results: Record<string, unknown> = {};
      for (const table of ROW_TABLES) {
        const { data, error } = await supabase.from(table).select('*').eq(table === 'user_settings' ? 'user_id' : table === 'profiles' ? 'id' : 'user_id', user.id);
        if (!error) results[table] = data;
      }
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitnfuel-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const deleteAllData = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      for (const table of ROW_TABLES) {
        if (table === 'profiles') continue; // keep the profile row itself; auth account stays
        const column = table === 'user_settings' ? 'user_id' : 'user_id';
        await supabase.from(table).delete().eq(column, user.id);
      }
      toast.success('Your data has been deleted');
      setDeleteOpen(false);
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
      toast.error('Could not delete all data. Some tables may need the latest migration.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <motion.div className="mx-auto max-w-3xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Preferences are saved automatically as you change them</p>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Appearance</h2>
          <div className="mt-2 divide-y divide-surface-line">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink">Theme</p>
                <p className="text-xs text-ink-muted">Switch between dark and light</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-3"
              >
                {theme === 'dark' ? <Moon className="h-4 w-4 text-primary-300" /> : <Sun className="h-4 w-4 text-warning-400" />}
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink">Product tour</p>
                <p className="text-xs text-ink-muted">Replay the walkthrough of key features</p>
              </div>
              <button
                onClick={replayTour}
                className="flex items-center gap-2 rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-3"
              >
                <RefreshCcw className="h-4 w-4 text-primary-300" />
                Replay
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Notifications</h2>
          <div className="mt-2 divide-y divide-surface-line">
            <SettingRow title="Email notifications" description="Updates and reminders via email" checked={settings.notifications.email} onChange={(v) => update({ notifications: { ...settings.notifications, email: v } })} />
            <SettingRow title="Push notifications" description="Notifications on this device" checked={settings.notifications.push} onChange={(v) => update({ notifications: { ...settings.notifications, push: v } })} />
            <SettingRow title="Workout reminders" description="Get reminded about scheduled workouts" checked={settings.notifications.workoutReminders} onChange={(v) => update({ notifications: { ...settings.notifications, workoutReminders: v } })} />
            <SettingRow title="Product updates" description="News about new features" checked={settings.notifications.productUpdates} onChange={(v) => update({ notifications: { ...settings.notifications, productUpdates: v } })} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary-300" />
            <h2 className="text-base font-semibold text-ink">Reminders</h2>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Local reminders while FitnessFuel is open or recently backgrounded.
            {notificationSupport === 'ios-not-installed' && ' Add to your Home Screen to enable these on iPhone.'}
          </p>
          <div className="mt-2 divide-y divide-surface-line">
            <div className="py-3">
              <SettingRow
                title="Push notifications on this device"
                description="Reach you even when FitnessFuel is fully closed"
                checked={push.isSubscribed}
                onChange={togglePush}
              />
              {push.isSubscribed && (
                <Button variant="subtle" size="sm" className="mt-2" loading={sendingTest} onClick={sendTestPush}>
                  Send test notification
                </Button>
              )}
            </div>
            <div className="py-3">
              <SettingRow
                title="Workout reminder"
                description="A daily nudge at your chosen time"
                checked={settings.reminders.workoutEnabled}
                onChange={(v) => (v ? enableReminder({ workoutEnabled: true }) : update({ reminders: { ...settings.reminders, workoutEnabled: false } }))}
              />
              {settings.reminders.workoutEnabled && (
                <input
                  type="time"
                  value={settings.reminders.workoutTime}
                  onChange={(e) => update({ reminders: { ...settings.reminders, workoutTime: e.target.value } })}
                  className="mt-1 rounded-lg border border-surface-line-strong bg-surface-2 px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>

            <div className="py-3">
              <SettingRow
                title="Water reminders"
                description="Repeats through the day within a time window"
                checked={settings.reminders.waterEnabled}
                onChange={(v) => (v ? enableReminder({ waterEnabled: true }) : update({ reminders: { ...settings.reminders, waterEnabled: false } }))}
              />
              {settings.reminders.waterEnabled && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  Every
                  <select
                    value={settings.reminders.waterIntervalHours}
                    onChange={(e) => update({ reminders: { ...settings.reminders, waterIntervalHours: Number(e.target.value) } })}
                    className="rounded-lg border border-surface-line-strong bg-surface-2 px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[1, 2, 3, 4].map((h) => (
                      <option key={h} value={h}>{h}h</option>
                    ))}
                  </select>
                  between
                  <input
                    type="time"
                    value={settings.reminders.waterStart}
                    onChange={(e) => update({ reminders: { ...settings.reminders, waterStart: e.target.value } })}
                    className="rounded-lg border border-surface-line-strong bg-surface-2 px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  and
                  <input
                    type="time"
                    value={settings.reminders.waterEnd}
                    onChange={(e) => update({ reminders: { ...settings.reminders, waterEnd: e.target.value } })}
                    className="rounded-lg border border-surface-line-strong bg-surface-2 px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="py-3">
              <SettingRow
                title="Meal reminders"
                description="Three fixed times to log breakfast, lunch, and dinner"
                checked={settings.reminders.mealEnabled}
                onChange={(v) => (v ? enableReminder({ mealEnabled: true }) : update({ reminders: { ...settings.reminders, mealEnabled: false } }))}
              />
              {settings.reminders.mealEnabled && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {settings.reminders.mealTimes.map((t, i) => (
                    <input
                      key={i}
                      type="time"
                      value={t}
                      onChange={(e) => {
                        const mealTimes = [...settings.reminders.mealTimes];
                        mealTimes[i] = e.target.value;
                        update({ reminders: { ...settings.reminders, mealTimes } });
                      }}
                      className="rounded-lg border border-surface-line-strong bg-surface-2 px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Privacy</h2>
          <div className="mt-2 divide-y divide-surface-line">
            <SettingRow title="Public profile" description="Allow others to view your profile" checked={settings.privacy.publicProfile} onChange={(v) => update({ privacy: { ...settings.privacy, publicProfile: v } })} />
            <SettingRow title="Share progress" description="Allow others to view your progress" checked={settings.privacy.shareProgress} onChange={(v) => update({ privacy: { ...settings.privacy, shareProgress: v } })} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Form Coach</h2>
          <div className="mt-2 divide-y divide-surface-line">
            <SettingRow title="Voice feedback" description="Announce rep counts and coaching cues out loud" checked={settings.coach.voiceFeedback} onChange={(v) => update({ coach: { voiceFeedback: v } })} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Units</h2>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-ink-muted">Weight unit</label>
            <select
              value={settings.units.weight}
              onChange={(e) => update({ units: { weight: e.target.value as 'kg' | 'lbs' } })}
              className="w-full max-w-xs rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Data management</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-ink">Export your data</p>
              <p className="mt-0.5 text-xs text-ink-muted">Download everything you've logged as a JSON file</p>
              <Button variant="subtle" size="sm" className="mt-2" loading={exporting} onClick={exportData}>
                <Download className="mr-1.5 h-4 w-4" />
                Export data
              </Button>
            </div>
            <div className="border-t border-surface-line pt-4">
              <p className="text-sm font-medium text-ink">Delete your data</p>
              <p className="mt-0.5 text-xs text-ink-muted">Permanently deletes everything you've logged and signs you out</p>
              <Button variant="danger" size="sm" className="mt-2" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete my data
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} panelClassName="max-w-md">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary-400" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Delete all your data?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                This permanently deletes your logs, plans, health metrics, and saved foods across every part of the
                app, then signs you out. This cannot be undone. Your login itself is not deleted — contact support if
                you need the account removed entirely.
              </p>
            </div>
          </div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="mt-4 w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={confirmText !== 'DELETE'} loading={deleting} onClick={deleteAllData}>
              Delete everything
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default SettingsPage;
