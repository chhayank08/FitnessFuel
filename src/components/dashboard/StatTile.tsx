import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import AnimatedNumber from '../ui/AnimatedNumber';
import BaseStatCard from './BaseStatCard';

interface StatTileProps {
  title: string;
  value: number;
  format?: (n: number) => string;
  unit?: string;
  icon: LucideIcon;
  iconClassName?: string; // e.g. bg-primary-500/15 text-primary-300
  delta?: number | null; // signed change; omit/null hides the chip
  deltaSuffix?: string;
  // whether a negative delta is a good thing (weight loss goal)
  negativeIsGood?: boolean;
}

const StatTile: React.FC<StatTileProps> = ({
  title,
  value,
  format,
  unit,
  icon,
  iconClassName,
  delta,
  deltaSuffix = '',
  negativeIsGood = false,
}) => {
  const showDelta = delta != null && delta !== 0;
  const isGood = delta != null && (negativeIsGood ? delta < 0 : delta > 0);

  return (
    <BaseStatCard title={title} icon={icon} iconClassName={iconClassName}>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">
        <AnimatedNumber value={value} format={format} />
        {unit && <span className="ml-1 text-sm font-normal text-ink-muted">{unit}</span>}
      </p>
      {showDelta && (
        <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${isGood ? 'text-success-400' : 'text-secondary-400'}`}>
          {delta! < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
          {Math.abs(delta!)}{deltaSuffix}
        </p>
      )}
    </BaseStatCard>
  );
};

export default StatTile;
