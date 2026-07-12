import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toNutritionProfile, calculateTargets, calculateBMI } from '../../lib/nutrition';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const inputClass =
  'w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500';
const labelClass = 'mb-1.5 block text-sm font-medium text-ink-muted';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    weight: '70',
    height: '170',
    age: '30',
    gender: 'male',
    activity_level: 'moderate',
    goal: 'maintain',
    weekly_weight_change: 0,
    target_weight: '',
  });

  useEffect(() => {
    if (user) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          weight: data.weight?.toString() || '70',
          height: data.height?.toString() || '170',
          age: data.age?.toString() || '30',
          gender: data.gender || 'male',
          activity_level: data.activity_level || 'moderate',
          goal: data.goal || 'maintain',
          weekly_weight_change: data.weekly_weight_change || 0,
          target_weight: data.target_weight?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'range' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (!formData.full_name.trim()) return toast.error('Full name is required');
    if (weight < 30 || weight > 300) return toast.error('Enter a valid weight between 30 and 300 kg');
    if (height < 100 || height > 250) return toast.error('Enter a valid height between 100 and 250 cm');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          weight,
          height,
          age: formData.age ? parseInt(formData.age, 10) : null,
          gender: formData.gender,
          activity_level: formData.activity_level,
          goal: formData.goal,
          weekly_weight_change: formData.weekly_weight_change,
          target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated — your targets are recalculated');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (!weight || !height) return null;
    const np = toNutritionProfile({
      weight,
      height,
      age: formData.age,
      gender: formData.gender,
      activity_level: formData.activity_level,
      goal: formData.goal,
    });
    const targets = calculateTargets(np);
    const bmi = calculateBMI(weight, height);
    return { targets, bmi };
  }, [formData.weight, formData.height, formData.age, formData.gender, formData.activity_level, formData.goal]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <motion.div className="mx-auto max-w-5xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">Your details power every target and plan across the app</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <motion.div variants={item}>
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className={labelClass}>Full Name</label>
                <input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input id="email" value={user?.email || ''} disabled className={`${inputClass} cursor-not-allowed opacity-60`} />
              </div>

              <div>
                <label htmlFor="weight" className={labelClass}>Weight (kg)</label>
                <input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="height" className={labelClass}>Height (cm)</label>
                <input id="height" name="height" type="number" value={formData.height} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="age" className={labelClass}>Age</label>
                <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="gender" className={labelClass}>Gender</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="target_weight" className={labelClass}>Target Weight (kg)</label>
                <input id="target_weight" name="target_weight" type="number" step="0.1" placeholder="e.g. 68" value={formData.target_weight} onChange={handleChange} className={inputClass} />
                <p className="mt-1 text-xs text-ink-faint">Powers the goal progress card on your dashboard</p>
              </div>

              <div>
                <label htmlFor="goal" className={labelClass}>Fitness Goal</label>
                <select id="goal" name="goal" value={formData.goal} onChange={handleChange} className={inputClass}>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="weight_gain">Weight Gain</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintain">Maintain Weight</option>
                </select>
              </div>

              {(formData.goal === 'weight_loss' || formData.goal === 'weight_gain') && (
                <div className="md:col-span-2">
                  <label htmlFor="weekly_weight_change" className={labelClass}>
                    Weekly {formData.goal === 'weight_loss' ? 'Loss' : 'Gain'} Target: {Math.abs(formData.weekly_weight_change)} kg/week
                  </label>
                  <input
                    id="weekly_weight_change"
                    name="weekly_weight_change"
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={formData.weekly_weight_change}
                    onChange={handleChange}
                    className="w-full accent-primary-500"
                  />
                  <div className="mt-1 flex justify-between text-xs text-ink-faint">
                    <span>0.1 kg/week</span>
                    <span>1 kg/week</span>
                    <span>2 kg/week</span>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label htmlFor="activity_level" className={labelClass}>Activity Level</label>
                <select id="activity_level" name="activity_level" value={formData.activity_level} onChange={handleChange} className={inputClass}>
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="light">Lightly active (1–3 days/week)</option>
                  <option value="moderate">Moderately active (3–5 days/week)</option>
                  <option value="very">Very active (6–7 days/week)</option>
                  <option value="extra">Extra active (hard exercise + physical job)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Button type="submit" loading={saving}>Save changes</Button>
              </div>
            </form>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="sticky top-24 p-5">
            <h3 className="text-sm font-semibold text-ink">Your numbers</h3>
            <p className="mt-1 text-xs text-ink-faint">Updates live as you edit the form</p>
            {preview ? (
              <div className="mt-4 space-y-3">
                {[
                  ['Daily calories', `${preview.targets.dailyCalories.toLocaleString()} kcal`],
                  ['BMR', `${preview.targets.bmr.toLocaleString()} kcal`],
                  ['TDEE', `${preview.targets.tdee.toLocaleString()} kcal`],
                  ['BMI', `${preview.bmi.bmi} (${preview.bmi.category})`],
                  ['Protein target', `${preview.targets.protein} g`],
                  ['Carbs target', `${preview.targets.carbs} g`],
                  ['Fat target', `${preview.targets.fat} g`],
                  ['Water target', `${(preview.targets.waterMl / 1000).toFixed(1)} L`],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                    <span className="text-xs text-ink-muted">{label}</span>
                    <span className="text-sm font-semibold text-ink tabular-nums">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">Enter weight and height to see your personalized targets.</p>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
