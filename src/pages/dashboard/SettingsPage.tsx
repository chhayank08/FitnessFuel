import React, { useState } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
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
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} label={title} />
  </div>
);

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const { settings, update, loading } = useSettings();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

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
        <h1 className="font-display text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Preferences are saved automatically as you change them</p>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-white">Notifications</h2>
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
          <h2 className="text-base font-semibold text-white">Privacy</h2>
          <div className="mt-2 divide-y divide-surface-line">
            <SettingRow title="Public profile" description="Allow others to view your profile" checked={settings.privacy.publicProfile} onChange={(v) => update({ privacy: { ...settings.privacy, publicProfile: v } })} />
            <SettingRow title="Share progress" description="Allow others to view your progress" checked={settings.privacy.shareProgress} onChange={(v) => update({ privacy: { ...settings.privacy, shareProgress: v } })} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-white">Form Coach</h2>
          <div className="mt-2 divide-y divide-surface-line">
            <SettingRow title="Voice feedback" description="Announce rep counts and coaching cues out loud" checked={settings.coach.voiceFeedback} onChange={(v) => update({ coach: { voiceFeedback: v } })} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-white">Units</h2>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Weight unit</label>
            <select
              value={settings.units.weight}
              onChange={(e) => update({ units: { weight: e.target.value as 'kg' | 'lbs' } })}
              className="w-full max-w-xs rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-6">
          <h2 className="text-base font-semibold text-white">Data management</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-white">Export your data</p>
              <p className="mt-0.5 text-xs text-gray-400">Download everything you've logged as a JSON file</p>
              <Button variant="subtle" size="sm" className="mt-2" loading={exporting} onClick={exportData}>
                <Download className="mr-1.5 h-4 w-4" />
                Export data
              </Button>
            </div>
            <div className="border-t border-surface-line pt-4">
              <p className="text-sm font-medium text-white">Delete your data</p>
              <p className="mt-0.5 text-xs text-gray-400">Permanently deletes everything you've logged and signs you out</p>
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
              <h2 className="font-display text-lg font-semibold text-white">Delete all your data?</h2>
              <p className="mt-1 text-sm text-gray-400">
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
            className="mt-4 w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500"
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
