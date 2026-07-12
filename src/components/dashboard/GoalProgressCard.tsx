import React from 'react';
import { Target } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { formatWeight, convertWeight, WeightUnit } from '../../lib/units';

interface GoalProgressCardProps {
  startWeight: number;
  currentWeight: number;
  targetWeight: number | null;
  projectedDate: Date | null;
  className?: string;
  unit?: WeightUnit;
}

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  startWeight,
  currentWeight,
  targetWeight,
  projectedDate,
  className = '',
  unit = 'kg',
}) => {
  if (!targetWeight) {
    return (
      <Card className={`p-5 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Goal</h3>
          <Target className="h-4 w-4 text-ink-faint" />
        </div>
        <p className="mt-3 text-sm text-ink-muted">Set a target weight in your profile to track progress toward it.</p>
      </Card>
    );
  }

  const total = Math.abs(targetWeight - startWeight);
  const done = Math.abs(currentWeight - startWeight);
  const movedTowardTarget = Math.sign(currentWeight - startWeight) === Math.sign(targetWeight - startWeight);
  const progress = total > 0 ? (movedTowardTarget ? Math.min(done / total, 1) : 0) : 1;
  const remaining = parseFloat(Math.abs(targetWeight - currentWeight).toFixed(1));

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Goal</h3>
        <Target className="h-4 w-4 text-primary-300" />
      </div>

      <p className="mt-3 text-sm text-ink-muted">
        <span className="font-display text-lg font-semibold text-ink tabular-nums">{convertWeight(remaining, unit).toFixed(1)} {unit}</span> to go
      </p>

      <ProgressBar value={progress} colorClassName="bg-primary-gradient" className="mt-3" />

      <div className="mt-2 flex justify-between text-xs text-ink-faint tabular-nums">
        <span>{formatWeight(startWeight, unit)}</span>
        <span className="text-ink-muted">{formatWeight(currentWeight, unit)}</span>
        <span>{formatWeight(targetWeight, unit)}</span>
      </div>

      {projectedDate && (
        <p className="mt-3 text-xs text-ink-muted">
          Projected to reach it by{' '}
          <span className="font-medium text-primary-300">
            {projectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </p>
      )}
    </Card>
  );
};

export default GoalProgressCard;
