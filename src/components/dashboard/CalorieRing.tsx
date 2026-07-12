import React from 'react';
import { Flame } from 'lucide-react';
import Card from '../ui/Card';
import RingGauge from '../ui/RingGauge';
import AnimatedNumber from '../ui/AnimatedNumber';

interface CalorieRingProps {
  consumed: number;
  target: number;
  className?: string;
}

const CalorieRing: React.FC<CalorieRingProps> = ({ consumed, target, className = '' }) => {
  const over = consumed > target;
  const remaining = Math.max(target - consumed, 0);

  return (
    <Card className={`flex flex-col items-center p-6 ${className}`}>
      <div className="mb-4 flex w-full items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Calories today</h3>
        <Flame className={`h-4 w-4 ${over ? 'text-secondary-400' : 'text-primary-300'}`} />
      </div>

      <RingGauge
        value={target > 0 ? consumed / target : 0}
        size={190}
        colorFrom={over ? '#FF91A7' : '#857BFF'}
        colorTo={over ? '#FF6584' : '#6C63FF'}
      >
        <span className="font-display text-3xl font-semibold text-ink">
          <AnimatedNumber value={over ? consumed - target : remaining} />
        </span>
        <span className="mt-0.5 text-xs text-ink-muted">{over ? 'kcal over target' : 'kcal remaining'}</span>
      </RingGauge>

      <div className="mt-5 flex w-full justify-between text-sm">
        <div className="text-center">
          <p className="font-display font-semibold text-ink tabular-nums">{consumed.toLocaleString()}</p>
          <p className="text-xs text-ink-faint">eaten</p>
        </div>
        <div className="text-center">
          <p className="font-display font-semibold text-ink tabular-nums">{target.toLocaleString()}</p>
          <p className="text-xs text-ink-faint">target</p>
        </div>
      </div>
    </Card>
  );
};

export default CalorieRing;
