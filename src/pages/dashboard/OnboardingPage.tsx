import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LucideIcon, TrendingDown, TrendingUp, Dumbbell, Minus, Sparkles, Armchair, Footprints, Bike, Flame, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { supabase } from '../../lib/supabase';
import { toNutritionProfile, calculateTargets, calculateBMI, Goal } from '../../lib/nutrition';
import WizardShell from '../../components/ui/WizardShell';
import AnimatedNumber from '../../components/ui/AnimatedNumber';

const inputClass =
  'w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

interface OptionCardProps {
  selected: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ selected, icon: Icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors duration-150 ${
      selected
        ? 'border-primary-500/50 bg-primary-500/10'
        : 'border-surface-line-strong bg-surface-2 hover:border-surface-line-strong hover:bg-surface-3'
    }`}
  >
    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-primary-500/20 text-primary-300' : 'bg-surface-3 text-gray-400'}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-semibold ${selected ? 'text-white' : 'text-gray-200'}`}>{title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </div>
  </button>
);

const GOAL_OPTIONS: { id: Goal; title: string; description: string; icon: LucideIcon }[] = [
  { id: 'weight_loss', title: 'Lose weight', description: 'Sustainable calorie deficit', icon: TrendingDown },
  { id: 'weight_gain', title: 'Gain weight', description: 'Steady calorie surplus', icon: TrendingUp },
  { id: 'muscle_gain', title: 'Build muscle', description: 'Higher protein, lean surplus', icon: Dumbbell },
  { id: 'maintain', title: 'Maintain', description: 'Stay at your current weight', icon: Minus },
];

const ACTIVITY_OPTIONS: { id: string; title: string; description: string; icon: LucideIcon }[] = [
  { id: 'sedentary', title: 'Sedentary', description: 'Little to no exercise', icon: Armchair },
  { id: 'light', title: 'Lightly active', description: '1–3 days/week', icon: Footprints },
  { id: 'moderate', title: 'Moderately active', description: '3–5 days/week', icon: Bike },
  { id: 'very', title: 'Very active', description: '6–7 days/week', icon: Flame },
  { id: 'extra', title: 'Extra active', description: 'Hard exercise + physical job', icon: Zap },
];

const TOTAL_STEPS = 6;

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshProfile } = useDailyLogContext();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(user?.email?.split('@')[0] || '');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [targetWeight, setTargetWeight] = useState('');
  const [weeklyChange, setWeeklyChange] = useState(0.5);
  const [activityLevel, setActivityLevel] = useState('moderate');

  const showPace = goal === 'weight_loss' || goal === 'weight_gain';

  const preview = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return null;
    const np = toNutritionProfile({ weight: w, height: h, age, gender, activity_level: activityLevel, goal });
    return { targets: calculateTargets(np), bmi: calculateBMI(w, h) };
  }, [weight, height, age, gender, activityLevel, goal]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return fullName.trim().length > 0;
      case 1: {
        const a = parseInt(age, 10);
        const h = parseFloat(height);
        const w = parseFloat(weight);
        return a >= 13 && a <= 100 && h >= 100 && h <= 250 && w >= 30 && w <= 300;
      }
      case 2:
        return !!goal;
      case 3:
        return !showPace || (targetWeight === '' || (parseFloat(targetWeight) > 0 && parseFloat(targetWeight) < 400));
      case 4:
        return !!activityLevel;
      default:
        return true;
    }
  }, [step, fullName, age, height, weight, goal, showPace, targetWeight, activityLevel]);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          weight: parseFloat(weight),
          height: parseFloat(height),
          age: parseInt(age, 10),
          gender,
          activity_level: activityLevel,
          goal,
          weekly_weight_change: showPace ? weeklyChange : 0,
          target_weight: showPace && targetWeight ? parseFloat(targetWeight) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("You're all set — your plan is ready");
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong saving your profile');
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (step === TOTAL_STEPS - 1) {
      finish();
      return;
    }
    // skip the pace step for maintain/muscle_gain goals
    if (step === 2 && !showPace) {
      setStep(4);
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    if (step === 4 && !showPace) {
      setStep(2);
      return;
    }
    setStep((s) => s - 1);
  };

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={step > 0 ? goBack : undefined}
      onNext={goNext}
      nextDisabled={!stepValid}
      nextLoading={saving}
      nextLabel={step === TOTAL_STEPS - 1 ? "Let's go" : 'Continue'}
    >
      {step === 0 && (
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-display-lg text-white">Welcome to Fitness Fuel</h1>
          <p className="mt-2 text-sm text-gray-400">
            A few quick questions and we'll build your personalized nutrition and training targets.
          </p>
          <div className="mt-8">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">What should we call you?</label>
            <input
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-display text-display-lg text-white">About you</h1>
          <p className="mt-2 text-sm text-gray-400">This drives the calorie and macro math — Mifflin-St Jeor, nothing hidden.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Height (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Weight (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-display text-display-lg text-white">What's your goal?</h1>
          <p className="mt-2 text-sm text-gray-400">We'll tune your calorie and protein targets around this.</p>
          <div className="mt-8 space-y-3">
            {GOAL_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={goal === opt.id}
                icon={opt.icon}
                title={opt.title}
                description={opt.description}
                onClick={() => setGoal(opt.id)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && showPace && (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-display text-display-lg text-white">Target &amp; pace</h1>
          <p className="mt-2 text-sm text-gray-400">Optional — leave the target blank if you're not sure yet.</p>
          <div className="mt-8">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Target weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 68"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Weekly {goal === 'weight_loss' ? 'loss' : 'gain'} pace: {weeklyChange.toFixed(1)} kg/week
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={weeklyChange}
              onChange={(e) => setWeeklyChange(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0.1 kg/week</span>
              <span>1 kg/week</span>
              <span>2 kg/week</span>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-display text-display-lg text-white">How active are you?</h1>
          <p className="mt-2 text-sm text-gray-400">Outside of planned workouts — your day-to-day baseline.</p>
          <div className="mt-8 space-y-3">
            {ACTIVITY_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={activityLevel === opt.id}
                icon={opt.icon}
                title={opt.title}
                description={opt.description}
                onClick={() => setActivityLevel(opt.id)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-500/15 text-success-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-display-lg text-white">Your plan is ready</h1>
          <p className="mt-2 text-sm text-gray-400">Here's what we calculated — you can fine-tune it anytime in Settings.</p>
          {preview && (
            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-primary-300">Daily calorie target</p>
                <p className="mt-1 font-display text-display-lg text-white">
                  <AnimatedNumber value={preview.targets.dailyCalories} /> <span className="text-base font-normal text-gray-400">kcal</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Protein', preview.targets.protein, 'g'],
                  ['Carbs', preview.targets.carbs, 'g'],
                  ['Fat', preview.targets.fat, 'g'],
                ].map(([label, val, unit]) => (
                  <div key={label as string} className="rounded-xl bg-surface-2 p-3 text-center">
                    <p className="font-display text-lg font-semibold text-white tabular-nums">{val}{unit}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-sm text-gray-400">BMI</span>
                <span className="text-sm font-semibold text-white tabular-nums">{preview.bmi.bmi} ({preview.bmi.category})</span>
              </div>
            </div>
          )}
        </div>
      )}
    </WizardShell>
  );
};

export default OnboardingPage;
