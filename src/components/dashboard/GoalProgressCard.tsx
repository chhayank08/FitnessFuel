import React from 'react';
import { Target } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

interface GoalProgressCardProps {
  startWeight: number;
  currentWeight: number;
  targetWeight: number | null;
  projectedDate: Date | null;
  className?: string;
}

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  startWeight,
  currentWeight,
  targetWeight,
  projectedDate,
  className = '',
}) => {
  if (!targetWeight) {
    return (
      <Card className={`p-5 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Goal</h3>
          <Target className="h-4 w-4 text-gray-500" />
        </div>
        <p className="mt-3 text-sm text-gray-400">Set a target weight in your profile to track progress toward it.</p>
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
        <h3 className="text-sm font-semibold text-white">Goal</h3>
        <Target className="h-4 w-4 text-primary-300" />
      </div>

      <p className="mt-3 text-sm text-gray-300">
        <span className="font-display text-lg font-semibold text-white tabular-nums">{remaining} kg</span> to go
      </p>

      <ProgressBar value={progress} colorClassName="bg-primary-gradient" className="mt-3" />

      <div className="mt-2 flex justify-between text-xs text-gray-500 tabular-nums">
        <span>{startWeight} kg</span>
        <span className="text-gray-300">{currentWeight} kg</span>
        <span>{targetWeight} kg</span>
      </div>

      {projectedDate && (
        <p className="mt-3 text-xs text-gray-400">
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
