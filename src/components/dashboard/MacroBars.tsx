import React from 'react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { Consumed } from '../../hooks/useDailyLog';
import { NutritionTargets } from '../../lib/nutrition';

// Fixed identity colors, validated for CVD separation + contrast on surface-1;
// each bar is direct-labeled so color is never the sole identity.
const MACROS = [
  { key: 'protein', label: 'Protein', color: 'bg-[#857BFF]' },
  { key: 'carbs', label: 'Carbs', color: 'bg-[#D97706]' },
  { key: 'fat', label: 'Fat', color: 'bg-[#EC4899]' },
] as const;

interface MacroBarsProps {
  consumed: Consumed;
  targets: NutritionTargets;
  className?: string;
}

const MacroBars: React.FC<MacroBarsProps> = ({ consumed, targets, className = '' }) => (
  <Card className={`p-5 ${className}`}>
    <h3 className="text-sm font-semibold text-ink">Macros</h3>
    <div className="mt-4 space-y-4">
      {MACROS.map((macro) => {
        const eaten = consumed[macro.key];
        const target = targets[macro.key];
        return (
          <div key={macro.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-ink-muted">{macro.label}</span>
              <span className="text-xs text-ink-muted tabular-nums">
                <span className="text-ink">{eaten}</span> / {target} g
              </span>
            </div>
            <ProgressBar value={target > 0 ? eaten / target : 0} colorClassName={macro.color} />
          </div>
        );
      })}
    </div>
  </Card>
);

export default MacroBars;
