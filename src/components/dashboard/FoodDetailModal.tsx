import React, { useState } from 'react';
import { Star, Plus, Utensils } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import MacroDonut from './MacroDonut';
import { FoodItem } from '../../services/foods';

interface FoodDetailModalProps {
  food: FoodItem | null;
  onClose: () => void;
  onLog: (food: FoodItem, grams: number) => void;
  onSave: (food: FoodItem) => void;
}

const NUTRI_COLORS: Record<string, string> = {
  a: 'bg-success-500 text-surface-base',
  b: 'bg-success-500/60 text-ink',
  c: 'bg-hydration-500 text-surface-base',
  d: 'bg-secondary-500/70 text-ink',
  e: 'bg-secondary-500 text-ink',
};

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ food, onClose, onLog, onSave }) => {
  const [grams, setGrams] = useState(100);

  if (!food) return null;
  const factor = grams / 100;
  const calories = Math.round(food.per100g.calories * factor);
  const protein = Math.round(food.per100g.protein * factor);
  const carbs = Math.round(food.per100g.carbs * factor);
  const fat = Math.round(food.per100g.fat * factor);

  return (
    <Modal open={!!food} onClose={onClose} panelClassName="max-w-lg max-h-[85vh] overflow-y-auto">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {food.imageUrl ? (
            <img src={food.imageUrl} alt={food.name} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-faint">
              <Utensils className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-semibold text-ink">{food.name}</h2>
            {food.brand && <p className="text-sm text-ink-muted">{food.brand}</p>}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {food.nutriScore && (
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold uppercase ${NUTRI_COLORS[food.nutriScore] || 'bg-surface-3 text-ink-muted'}`}>
                  {food.nutriScore}
                </span>
              )}
              <Badge tone="neutral">{food.source === 'off' ? 'Open Food Facts' : 'USDA'}</Badge>
              {food.allergens.slice(0, 3).map((a) => (
                <Badge key={a} tone="alert">{a}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-5">
          <MacroDonut protein={protein} carbs={carbs} fat={fat} size={120} />
          <div className="flex-1 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-muted">Calories</span><span className="font-semibold text-ink tabular-nums">{calories}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Protein</span><span className="font-semibold text-ink tabular-nums">{protein} g</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Carbs</span><span className="font-semibold text-ink tabular-nums">{carbs} g</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Fat</span><span className="font-semibold text-ink tabular-nums">{fat} g</span></div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Serving size (g)</label>
          <input
            type="number"
            min={1}
            value={grams}
            onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {food.servingDesc && <p className="mt-1 text-xs text-ink-faint">Typical serving: {food.servingDesc}</p>}
        </div>

        {food.micronutrients.length > 0 && (
          <div className="mt-4 rounded-xl bg-surface-2 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Micronutrients (per 100g)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {food.micronutrients.map((m) => (
                <div key={m.label} className="flex justify-between text-ink-muted">
                  <span>{m.label}</span>
                  <span className="tabular-nums">{m.value}{m.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {food.ingredientsText && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">Ingredients</p>
            <p className="text-xs text-ink-muted">{food.ingredientsText}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onSave(food)}>
            <Star className="mr-1.5 h-4 w-4" />
            Save
          </Button>
          <Button onClick={() => onLog(food, grams)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Log to today
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FoodDetailModal;
