import React, { useMemo } from 'react';
import { Area, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Scale } from 'lucide-react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Tabs from '../ui/Tabs';
import { ProgressLog } from '../../hooks/useWeightHistory';

interface WeightTrendChartProps {
  logs: ProgressLog[];
  onLogWeight: () => void;
  className?: string;
  // when provided, renders a 7/30/90-day range picker and a 7-point moving average
  rangeControl?: boolean;
  title?: string;
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: { value: number }[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-line-strong bg-surface-3 px-3 py-2 shadow-card">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-white tabular-nums">{payload[0].value} kg</p>
    </div>
  );
};

const RANGES = [
  { id: '7', label: '7d', days: 7 },
  { id: '30', label: '30d', days: 30 },
  { id: '90', label: '90d', days: 90 },
];

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  logs,
  onLogWeight,
  className = '',
  rangeControl = false,
  title = 'Weight trend',
}) => {
  const [range, setRange] = React.useState('30');

  const filteredLogs = useMemo(() => {
    if (!rangeControl) return logs;
    const days = RANGES.find((r) => r.id === range)?.days ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return logs.filter((l) => new Date(l.created_at).getTime() >= cutoff);
  }, [logs, range, rangeControl]);

  const data = useMemo(() => {
    const points = filteredLogs
      .filter((l) => l.weight != null)
      .map((l) => ({
        date: new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: parseFloat((l.weight as number).toFixed(1)),
      }));
    // 7-point trailing moving average — smooths day-to-day noise
    return points.map((p, i) => {
      const window = points.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((s, w) => s + w.weight, 0) / window.length;
      return { ...p, avg: parseFloat(avg.toFixed(1)) };
    });
  }, [filteredLogs]);

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {rangeControl && data.length >= 2 && <Tabs tabs={RANGES.map((r) => ({ id: r.id, label: r.label }))} active={range} onChange={setRange} />}
      </div>

      {data.length < 2 ? (
        <EmptyState
          icon={Scale}
          title={data.length === 0 ? 'No weigh-ins yet' : 'One more to draw a trend'}
          description="Log your weight regularly and your trend line appears here."
          actionLabel="Log your first weigh-in"
          onAction={onLogWeight}
        />
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
                <filter id="weight-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickFormatter={(v: number) => v.toFixed(1)}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#857BFF"
                strokeWidth={2}
                fill="url(#weight-fill)"
                filter="url(#weight-line-glow)"
                dot={false}
                activeDot={{ r: 4, fill: '#857BFF', stroke: '#14141F', strokeWidth: 2 }}
              />
              {rangeControl && data.length >= 7 && (
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#38BDF8"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  name="7-day average"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default WeightTrendChart;
