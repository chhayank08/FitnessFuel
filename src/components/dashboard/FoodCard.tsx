import React from 'react';
import { Utensils } from 'lucide-react';
import Card from '../ui/Card';
import { FoodItem } from '../../services/foods';

interface FoodCardProps {
  food: FoodItem;
  onClick: () => void;
}

const NUTRI_COLORS: Record<string, string> = {
  a: 'bg-success-500 text-surface-base',
  b: 'bg-success-500/60 text-white',
  c: 'bg-hydration-500 text-surface-base',
  d: 'bg-secondary-500/70 text-white',
  e: 'bg-secondary-500 text-white',
};

const FoodCard: React.FC<FoodCardProps> = ({ food, onClick }) => (
  <Card interactive onClick={onClick} className="flex items-center gap-3 p-3">
    {food.imageUrl ? (
      <img src={food.imageUrl} alt={food.name} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
    ) : (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-gray-500">
        <Utensils className="h-5 w-5" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-white">{food.name}</p>
      <p className="truncate text-xs text-gray-500">{food.brand || (food.source === 'usda' ? 'USDA' : 'Generic')}</p>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2">
      {food.nutriScore && (
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold uppercase ${NUTRI_COLORS[food.nutriScore] || 'bg-surface-3 text-gray-300'}`}>
          {food.nutriScore}
        </span>
      )}
      <span className="text-xs font-semibold text-gray-300 tabular-nums">{Math.round(food.per100g.calories)} kcal</span>
    </div>
  </Card>
);

export default FoodCard;
