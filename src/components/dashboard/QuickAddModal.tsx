import React, { useState } from 'react';
import { Scale, GlassWater, UtensilsCrossed } from 'lucide-react';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useDailyLogContext, QuickAddTab } from '../../context/DailyLogContext';

function hapticSuccess() {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

const TABS: { id: QuickAddTab; label: string; icon: React.ElementType }[] = [
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'water', label: 'Water', icon: GlassWater },
  { id: 'meal', label: 'Meal', icon: UtensilsCrossed },
];

const inputClass =
  'w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

const QuickAddModal: React.FC = () => {
  const { quickAdd, dailyLog, weightHistory } = useDailyLogContext();
  const [tab, setTab] = useState<QuickAddTab>(quickAdd.tab);
  const [saving, setSaving] = useState(false);

  const [weight, setWeight] = useState('');
  const [waterMl, setWaterMl] = useState('250');
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  // follow the tab requested by whoever opened the modal
  React.useEffect(() => {
    if (quickAdd.open) setTab(quickAdd.tab);
  }, [quickAdd.open, quickAdd.tab]);

  const close = () => {
    quickAdd.close();
    setWeight('');
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (tab === 'weight') {
        const kg = parseFloat(weight);
        if (!kg || kg <= 0) return;
        await weightHistory.logWeight(kg);
      } else if (tab === 'water') {
        const ml = parseInt(waterMl, 10);
        if (!ml || ml <= 0) return;
        await dailyLog.addWater(ml);
      } else {
        const calories = parseInt(mealCalories, 10);
        if (!mealName.trim() || !calories || calories <= 0) return;
        await dailyLog.logManualMeal({
          name: mealName.trim(),
          calories,
          protein: parseInt(mealProtein, 10) || 0,
          carbs: parseInt(mealCarbs, 10) || 0,
          fat: parseInt(mealFat, 10) || 0,
        });
      }
      hapticSuccess();
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={quickAdd.open} onClose={close} panelClassName="max-w-md">
      <div className="p-5">
        <h2 className="font-display text-lg font-semibold text-white">Quick log</h2>

        <div className="mt-4 flex rounded-xl bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-primary-500/20 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {tab === 'weight' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Weight (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="72.5"
                className={inputClass}
                autoFocus
              />
            </div>
          )}

          {tab === 'water' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Amount (ml)</label>
              <input
                type="number"
                inputMode="numeric"
                step="50"
                min="1"
                value={waterMl}
                onChange={(e) => setWaterMl(e.target.value)}
                className={inputClass}
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                {[250, 500, 750].map((ml) => (
                  <button
                    key={ml}
                    onClick={() => setWaterMl(String(ml))}
                    className="rounded-lg border border-surface-line bg-surface-2 px-3 py-1.5 text-xs text-hydration-400 transition-colors hover:bg-surface-3"
                  >
                    {ml} ml
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'meal' && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Meal name</label>
                <input
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="Chicken burrito"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Calories</label>
                  <input type="number" inputMode="numeric" min="1" value={mealCalories} onChange={(e) => setMealCalories(e.target.value)} placeholder="550" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Protein (g)</label>
                  <input type="number" inputMode="numeric" min="0" value={mealProtein} onChange={(e) => setMealProtein(e.target.value)} placeholder="35" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Carbs (g)</label>
                  <input type="number" inputMode="numeric" min="0" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} placeholder="60" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Fat (g)</label>
                  <input type="number" inputMode="numeric" min="0" value={mealFat} onChange={(e) => setMealFat(e.target.value)} placeholder="18" className={inputClass} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {tab === 'weight' ? 'Log weight' : tab === 'water' ? 'Log water' : 'Log meal'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickAddModal;
