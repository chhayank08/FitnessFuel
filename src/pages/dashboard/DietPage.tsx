import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Search, ScanBarcode, Star, UserCog } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { supabase } from '../../lib/supabase';
import { generateWeeklyMealPlan, DAYS, Meal, MealSlot } from '../../lib/planGenerator';
import { FoodItem } from '../../services/foods';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { useResearch } from '../../hooks/useResearch';
import { topicsForGoal } from '../../services/research';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import CalorieRing from '../../components/dashboard/CalorieRing';
import MacroBars from '../../components/dashboard/MacroBars';
import FoodCard from '../../components/dashboard/FoodCard';
import FoodDetailModal from '../../components/dashboard/FoodDetailModal';
import BarcodeScanner from '../../components/dashboard/BarcodeScanner';
import InsightBanner from '../../components/dashboard/InsightBanner';
import LogFoodBar from '../../components/dashboard/LogFoodBar';
import MealPlanTodayCard from '../../components/dashboard/MealPlanTodayCard';
import CoachTipCard from '../../components/dashboard/CoachTipCard';
import { useTodaysPlan } from '../../hooks/useTodaysPlan';
import { useNavigate } from 'react-router-dom';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const MEAL_IMAGES: Record<string, string> = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  lunch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  snack: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
};

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'search', label: 'Food Search' },
  { id: 'plan', label: 'Meal Plan' },
  { id: 'insights', label: 'Insights' },
];

const DietPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const { profile, profileLoading, dailyLog, insights } = useDailyLogContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTabState] = useState(() => searchParams.get('tab') || 'today');
  const [pendingQuery, setPendingQuery] = useState('');
  const [pendingScan, setPendingScan] = useState(() => searchParams.get('scan') === '1');
  const initialDay = useMemo(() => {
    const raw = searchParams.get('day');
    const n = raw != null ? parseInt(raw, 10) : NaN;
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : undefined;
  }, [searchParams]);

  // Keep the tab in the URL so nav-state restore and quick actions can deep-link.
  const setTab = useCallback(
    (next: string) => {
      setTabState(next);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('tab', next);
        params.delete('scan');
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  // ?scan=1 (Smart Action Button) → open Food Search with the scanner up.
  useEffect(() => {
    if (searchParams.get('scan') === '1') {
      setTabState(searchParams.get('tab') || 'search');
      setPendingScan(true);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.delete('scan');
        return params;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { nutritionProfile, targets } = insights;
  const weeklyPlan = useMemo(() => (nutritionProfile && profile ? generateWeeklyMealPlan(profile) : []), [nutritionProfile, profile]);
  const todaysPlan = useTodaysPlan(profile, nutritionProfile != null);

  const openSearch = useCallback(
    (query: string) => {
      setPendingQuery(query);
      setTab('search');
    },
    [setTab]
  );
  const openScanner = useCallback(() => {
    setPendingScan(true);
    setTab('search');
  }, [setTab]);

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <motion.div className="mx-auto max-w-7xl" variants={reducedMotion ? undefined : container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Nutrition</h1>
          <p className="mt-1 text-sm text-ink-muted">Your calorie ring, meal plan, and full food database</p>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </motion.div>

      {!nutritionProfile ? (
        <motion.div variants={item}>
          <Card>
            <EmptyState
              icon={UserCog}
              title="Complete your profile"
              description="Add your weight, height, and goal to unlock personalized nutrition targets and a daily meal plan."
              actionLabel="Get started"
              onAction={() => navigate('/dashboard/welcome')}
              className="py-16"
            />
          </Card>
        </motion.div>
      ) : (
        <>
          {tab === 'today' && (
            <TodayTab targets={targets!} todaysPlan={todaysPlan} onSearch={openSearch} onScan={openScanner} />
          )}
          {tab === 'search' && (
            <SearchTab
              userId={user?.id}
              onLogged={() => dailyLog.refresh()}
              initialQuery={pendingQuery}
              autoScan={pendingScan}
              onScanConsumed={() => setPendingScan(false)}
            />
          )}
          {tab === 'plan' && (
            <PlanTab weeklyPlan={weeklyPlan} isCompleted={dailyLog.isCompleted} onToggle={dailyLog.toggleCompletion} initialDay={initialDay} />
          )}
          {tab === 'insights' && (
            <InsightsTab goal={nutritionProfile.goal} targets={targets!} consumed={dailyLog.consumed} weightKg={nutritionProfile.weight} />
          )}
        </>
      )}
    </motion.div>
  );
};

// ---------- Today ----------

const TodayTab: React.FC<{
  targets: NonNullable<ReturnType<typeof useDailyLogContext>['insights']['targets']>;
  todaysPlan: ReturnType<typeof useTodaysPlan>;
  onSearch: (query: string) => void;
  onScan: () => void;
}> = ({ targets, todaysPlan, onSearch, onScan }) => {
  const { dailyLog } = useDailyLogContext();
  const meals = dailyLog.completions.filter((c) => c.item_type === 'meal');
  const proteinLeft = Math.max(targets.protein - dailyLog.consumed.protein, 0);
  const caloriesLeft = Math.max(targets.dailyCalories - dailyLog.consumed.calories, 0);

  return (
    <motion.div variants={item} className="space-y-5">
      {/* Log food front and center — no tab hunting */}
      <LogFoodBar onSearch={onSearch} onScan={onScan} />

      {caloriesLeft > 0 && (
        <InsightBanner
          text={
            proteinLeft > 0
              ? `${caloriesLeft.toLocaleString()} kcal and ${proteinLeft}g protein left today.`
              : `${caloriesLeft.toLocaleString()} kcal left today — protein target already hit.`
          }
        />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CalorieRing consumed={dailyLog.consumed.calories} target={targets.dailyCalories} className="h-full" />
        </div>
        <div className="lg:col-span-7">
          <Card className="h-full p-5">
            <h3 className="text-sm font-semibold text-ink">Logged today</h3>
            {meals.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Nothing logged yet — search for a food or check off a meal from your plan.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {meals.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-ink">{m.item_name}</p>
                      <p className="text-xs text-ink-faint">
                        P {m.protein}g · C {m.carbs}g · F {m.fat}g
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink-muted tabular-nums">{m.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5">
              <MacroBars consumed={dailyLog.consumed} targets={targets} />
            </div>
          </Card>
        </div>
      </div>

      {/* Today's meal plan directly below the metrics */}
      <MealPlanTodayCard
        plan={todaysPlan.plan}
        isCompleted={dailyLog.isCompleted}
        onToggle={dailyLog.toggleCompletion}
        onReplace={todaysPlan.replaceMeal}
        onReset={todaysPlan.resetMeal}
        isOverridden={todaysPlan.isOverridden}
      />
    </motion.div>
  );
};

// ---------- Food Search ----------

const SearchTab: React.FC<{
  userId: string | undefined;
  onLogged: () => void;
  initialQuery?: string;
  autoScan?: boolean;
  onScanConsumed?: () => void;
}> = ({ userId, onLogged, initialQuery = '', autoScan = false, onScanConsumed }) => {
  const { dailyLog } = useDailyLogContext();
  const [query, setQuery] = useState(initialQuery);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const { results, loading, searched, search, byBarcode } = useFoodSearch();

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (autoScan) {
      setScannerOpen(true);
      onScanConsumed?.();
    }
  }, [autoScan, onScanConsumed]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('saved_foods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) {
          if (error.code !== '42P01') console.error('Error fetching saved foods:', error);
          return;
        }
        setFavorites(
          (data || []).map((f) => ({
            id: `saved-${f.id}`,
            source: (f.source as 'off' | 'usda') || 'off',
            name: f.name,
            brand: f.brand,
            barcode: f.barcode,
            imageUrl: null,
            per100g: { calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat },
            servingDesc: f.serving_desc,
            nutriScore: null,
            allergens: [],
            ingredientsText: null,
            micronutrients: [],
          }))
        );
      });
  }, [userId]);

  const handleBarcode = useCallback(
    async (code: string) => {
      setScannerOpen(false);
      const food = await byBarcode(code);
      if (food) setSelected(food);
      else toast.error(`No product found for barcode ${code}`);
    },
    [byBarcode]
  );

  const logFood = async (food: FoodItem, grams: number) => {
    const factor = grams / 100;
    await dailyLog.logManualMeal({
      name: food.name,
      calories: Math.round(food.per100g.calories * factor),
      protein: Math.round(food.per100g.protein * factor),
      carbs: Math.round(food.per100g.carbs * factor),
      fat: Math.round(food.per100g.fat * factor),
    });
    setSelected(null);
    onLogged();
  };

  const saveFavorite = async (food: FoodItem) => {
    if (!userId) return;
    const { error } = await supabase.from('saved_foods').upsert(
      {
        user_id: userId,
        name: food.name,
        brand: food.brand,
        barcode: food.barcode,
        serving_desc: food.servingDesc,
        calories: food.per100g.calories,
        protein: food.per100g.protein,
        carbs: food.per100g.carbs,
        fat: food.per100g.fat,
        micronutrients: food.micronutrients as unknown as Record<string, unknown>,
        source: food.source,
      },
      { onConflict: 'user_id,barcode' }
    );
    if (error) {
      if (error.code === '42P01') toast.error('Saved foods need the latest database migration.');
      else toast.error('Could not save this food.');
      console.error(error);
      return;
    }
    toast.success('Saved to favorites');
  };

  return (
    <motion.div variants={item} className="space-y-5">
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any food — e.g. grilled chicken, oats, greek yogurt"
              className="w-full rounded-xl border border-surface-line-strong bg-surface-2 py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button variant="subtle" onClick={() => setScannerOpen(true)}>
            <ScanBarcode className="mr-1.5 h-4 w-4" />
            Scan
          </Button>
        </div>
      </Card>

      {favorites.length > 0 && !searched && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Star className="h-4 w-4 text-primary-300" />
            Favorites
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => (
              <FoodCard key={f.id} food={f} onClick={() => setSelected(f)} />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="No results" description={`Nothing matched "${query}" in Open Food Facts${import.meta.env.VITE_USDA_API_KEY ? ' or USDA' : ''}.`} className="py-12" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((f) => (
            <FoodCard key={f.id} food={f} onClick={() => setSelected(f)} />
          ))}
        </div>
      )}

      <FoodDetailModal food={selected} onClose={() => setSelected(null)} onLog={logFood} onSave={saveFavorite} />
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleBarcode} />
    </motion.div>
  );
};

// ---------- Meal Plan ----------

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const PlanTab: React.FC<{
  weeklyPlan: ReturnType<typeof generateWeeklyMealPlan>;
  isCompleted: (type: 'meal' | 'workout', key: string) => boolean;
  onToggle: (item: { itemType: 'meal' | 'workout'; itemKey: string; itemName: string; calories?: number; protein?: number; carbs?: number; fat?: number }) => void;
  initialDay?: number;
}> = ({ weeklyPlan, isCompleted, onToggle, initialDay }) => {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(initialDay ?? todayIndex);
  const [selectedMeal, setSelectedMeal] = useState<{ slot: MealSlot; meal: Meal } | null>(null);
  const dayPlan = weeklyPlan[selectedDay];

  return (
    <motion.div variants={item} className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              i === selectedDay ? 'bg-primary-500/20 text-ink' : 'bg-surface-2 text-ink-muted hover:text-ink'
            } ${i === todayIndex ? 'ring-1 ring-primary-400/50' : ''}`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MEAL_SLOTS.filter((slot) => dayPlan.meals[slot]).map((slot) => {
          const meal = dayPlan.meals[slot]!;
          const key = `${slot}-${selectedDay}`;
          const done = selectedDay === todayIndex && isCompleted('meal', slot);
          return (
            <Card key={key} interactive onClick={() => setSelectedMeal({ slot, meal })} className="overflow-hidden p-0">
              <img src={MEAL_IMAGES[slot]} alt={slot} className="h-32 w-full object-cover" />
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{slot}</p>
                <p className="mt-1 truncate text-sm font-semibold text-ink">{meal.name}</p>
                <p className="mt-1 text-xs text-ink-muted">{meal.calories} kcal · P{meal.protein} C{meal.carbs} F{meal.fat}</p>
                {selectedDay === todayIndex && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle({ itemType: 'meal', itemKey: slot, itemName: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat });
                    }}
                    className={`mt-3 w-full rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      done ? 'bg-success-500/15 text-success-400' : 'bg-surface-2 text-ink-muted hover:bg-surface-3'
                    }`}
                  >
                    {done ? 'Checked off' : 'Mark as eaten'}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!selectedMeal} onClose={() => setSelectedMeal(null)} panelClassName="max-w-lg max-h-[80vh] overflow-y-auto">
        {selectedMeal && (
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{selectedMeal.slot}</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-ink">{selectedMeal.meal.name}</h3>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                ['Calories', selectedMeal.meal.calories, ''],
                ['Protein', selectedMeal.meal.protein, 'g'],
                ['Carbs', selectedMeal.meal.carbs, 'g'],
                ['Fat', selectedMeal.meal.fat, 'g'],
              ].map(([label, val, unit]) => (
                <div key={label as string} className="rounded-lg bg-surface-2 p-2">
                  <p className="text-sm font-bold text-ink tabular-nums">{val}{unit}</p>
                  <p className="text-[10px] text-ink-faint">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">Ingredients</p>
              <ul className="space-y-1 text-sm text-ink-muted">
                {selectedMeal.meal.ingredients.map((ing, i) => (
                  <li key={i}>• {ing}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">Instructions</p>
              <ol className="space-y-1 text-sm text-ink-muted">
                {selectedMeal.meal.instructions.map((ins, i) => (
                  <li key={i}>{i + 1}. {ins}</li>
                ))}
              </ol>
            </div>
            <Button variant="ghost" className="mt-5 w-full" onClick={() => setSelectedMeal(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

// ---------- Insights ----------

const InsightsTab: React.FC<{
  goal: string;
  targets: NonNullable<ReturnType<typeof useDailyLogContext>['insights']['targets']>;
  consumed: ReturnType<typeof useDailyLogContext>['dailyLog']['consumed'];
  weightKg: number;
}> = ({ goal, targets, consumed, weightKg }) => {
  const [topic] = useState(() => topicsForGoal(goal)[0]);
  const { articles, loading: researchLoading } = useResearch(topic);

  const macroRows = [
    { label: 'Protein', current: consumed.protein, target: targets.protein, color: 'bg-[#857BFF]' },
    { label: 'Carbs', current: consumed.carbs, target: targets.carbs, color: 'bg-[#D97706]' },
    { label: 'Fat', current: consumed.fat, target: targets.fat, color: 'bg-[#EC4899]' },
  ];

  return (
    <motion.div variants={item} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <CoachTipCard />
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-ink">Today's macros vs. target</h3>
        <div className="mt-4 space-y-4">
          {macroRows.map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-medium text-ink-muted">{row.label}</span>
                <span className="text-ink-muted tabular-nums">
                  <span className="text-ink">{row.current}</span> / {row.target} g
                </span>
              </div>
              <ProgressBar value={row.target > 0 ? row.current / row.target : 0} colorClassName={row.color} />
            </div>
          ))}
          <div className="border-t border-surface-line pt-3 text-sm text-ink-muted">
            Protein per kg body weight:{' '}
            <span className="font-semibold text-ink">{weightKg > 0 ? (targets.protein / weightKg).toFixed(1) : '—'}</span>
            {' '}g/kg — target is {targets.protein.toFixed(0)}g/day
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-ink">Evidence corner</h3>
        <p className="mt-1 text-xs text-ink-faint">Research related to your goal — educational, not medical advice.</p>
        {researchLoading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : articles.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No articles available right now.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {articles.slice(0, 2).map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-surface-2 p-3 transition-colors hover:bg-surface-3"
              >
                <p className="text-sm font-medium text-ink">{a.title}</p>
                <p className="mt-1 text-xs text-ink-faint">{a.journal} {a.year && `· ${a.year}`}</p>
              </a>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default DietPage;
