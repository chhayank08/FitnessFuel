import React from 'react';
import { Flame } from 'lucide-react';
import Card from '../ui/Card';
import AnimatedNumber from '../ui/AnimatedNumber';
import { Streak } from '../../hooks/useStreak';
import { daysAgo } from '../../lib/dates';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface StreakCardProps {
  streak: Streak;
  className?: string;
}

const StreakCard: React.FC<StreakCardProps> = ({ streak, className = '' }) => (
  <Card className={`p-5 ${className}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink">Streak</h3>
      <Flame className={`h-4 w-4 ${streak.current > 0 ? 'text-success-400' : 'text-ink-faint'}`} />
    </div>

    <p className="mt-3 font-display text-2xl font-semibold text-ink">
      <AnimatedNumber value={streak.current} />
      <span className="ml-1 text-sm font-normal text-ink-muted">{streak.current === 1 ? 'day' : 'days'}</span>
    </p>

    <div className="mt-4 flex justify-between">
      {streak.last7.map((active, i) => {
        const date = daysAgo(6 - i);
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={`block h-2.5 w-2.5 rounded-full ${
                active ? 'bg-success-500 shadow-glow-success' : 'bg-surface-3'
              }`}
            />
            <span className="text-[10px] text-ink-faint">{DAY_LETTERS[date.getDay()]}</span>
          </div>
        );
      })}
    </div>
  </Card>
);

export default StreakCard;
