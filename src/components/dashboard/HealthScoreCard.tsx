import React from 'react';
import { Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import RingGauge from '../ui/RingGauge';
import AnimatedNumber from '../ui/AnimatedNumber';
import ProgressBar from '../ui/ProgressBar';
import { HealthScore } from '../../lib/healthScore';

const scoreColor = (score: number) =>
  score >= 80 ? { from: '#4AE3AC', to: '#34D399' } : score >= 55 ? { from: '#857BFF', to: '#6C63FF' } : { from: '#FF91A7', to: '#FF6584' };

interface HealthScoreCardProps {
  health: HealthScore;
  className?: string;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ health, className = '' }) => {
  const color = scoreColor(health.score);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <RingGauge value={health.score / 100} size={168} colorFrom={color.from} colorTo={color.to}>
            <span className="font-display text-4xl font-semibold text-white">
              <AnimatedNumber value={health.score} />
            </span>
            <span className="mt-0.5 text-xs text-gray-400">Health Score</span>
          </RingGauge>
        </div>

        <div className="flex flex-col justify-center gap-3">
          {health.subscores.map((s) => (
            <div key={s.key}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium text-gray-300">{s.label}</span>
                <span className="text-gray-500 tabular-nums">{Math.round(s.score)}</span>
              </div>
              <ProgressBar
                value={s.score / 100}
                heightClassName="h-1.5"
                colorClassName={s.score >= 80 ? 'bg-success-500' : s.score >= 55 ? 'bg-primary-500' : 'bg-secondary-500'}
              />
            </div>
          ))}
        </div>
      </div>

      {health.drivers.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-surface-line pt-4">
          {health.drivers.map((d, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-300" />
              {d}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
};

export default HealthScoreCard;
