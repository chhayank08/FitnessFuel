import React from 'react';
import { LucideIcon } from 'lucide-react';
import AnimatedNumber from '../ui/AnimatedNumber';
import Sparkline from '../ui/Sparkline';
import BaseStatCard from './BaseStatCard';

interface MetricStatCardProps {
  title: string;
  value: number | null;
  format?: (n: number) => string;
  unit?: string;
  icon: LucideIcon;
  iconClassName?: string;
  sparkData?: number[];
  sparkColor?: string;
  emptyLabel?: string;
}

const MetricStatCard: React.FC<MetricStatCardProps> = ({
  title,
  value,
  format,
  unit,
  icon,
  iconClassName,
  sparkData,
  sparkColor = '#857BFF',
  emptyLabel = 'No device connected',
}) => (
  <BaseStatCard
    title={title}
    icon={icon}
    iconClassName={iconClassName}
    footer={
      value != null && sparkData && sparkData.length >= 2 ? (
        <div className="mt-3">
          <Sparkline data={sparkData} stroke={sparkColor} width={200} height={32} />
        </div>
      ) : undefined
    }
  >
    {value != null ? (
      <p className="mt-2 font-display text-2xl font-semibold text-white">
        <AnimatedNumber value={value} format={format} />
        {unit && <span className="ml-1 text-sm font-normal text-gray-400">{unit}</span>}
      </p>
    ) : (
      <p className="mt-2 text-sm text-gray-500">{emptyLabel}</p>
    )}
  </BaseStatCard>
);

export default MetricStatCard;
