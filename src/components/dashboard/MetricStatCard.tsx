import React from 'react';
import { LucideIcon } from 'lucide-react';
import Card from '../ui/Card';
import AnimatedNumber from '../ui/AnimatedNumber';
import Sparkline from '../ui/Sparkline';

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
  icon: Icon,
  iconClassName = 'bg-primary-500/15 text-primary-300',
  sparkData,
  sparkColor = '#857BFF',
  emptyLabel = 'No device connected',
}) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
        {value != null ? (
          <p className="mt-2 font-display text-2xl font-semibold text-white">
            <AnimatedNumber value={value} format={format} />
            {unit && <span className="ml-1 text-sm font-normal text-gray-400">{unit}</span>}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{emptyLabel}</p>
        )}
      </div>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {value != null && sparkData && sparkData.length >= 2 && (
      <div className="mt-3">
        <Sparkline data={sparkData} stroke={sparkColor} width={200} height={32} />
      </div>
    )}
  </Card>
);

export default MetricStatCard;
