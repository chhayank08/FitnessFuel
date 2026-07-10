import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../ui/Card';
import { DayActivity } from '../../hooks/useWeeklyActivity';

interface ActivityConsistencyChartProps {
  days: DayActivity[];
  className?: string;
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-line-strong bg-surface-3 px-3 py-2 shadow-card">
      <p className="text-xs text-gray-400">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold text-white tabular-nums">
          {p.dataKey === 'meals' ? 'Meals logged' : 'Workouts'}: {p.value}
        </p>
      ))}
    </div>
  );
};

const ActivityConsistencyChart: React.FC<ActivityConsistencyChartProps> = ({ days, className = '' }) => {
  const data = useMemo(
    () =>
      days.map((d) => ({
        day: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
        meals: d.meals,
        workouts: d.workouts,
      })),
    [days]
  );

  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white">Activity consistency</h3>
      <p className="text-xs text-gray-500">Meals and workouts checked off, last 7 days</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barGap={4}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="meals" fill="#857BFF" radius={[4, 4, 0, 0]} maxBarSize={18} name="Meals" />
            <Bar dataKey="workouts" fill="#34D399" radius={[4, 4, 0, 0]} maxBarSize={18} name="Workouts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-400" />Meals</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-400" />Workouts</span>
      </div>
    </Card>
  );
};

export default ActivityConsistencyChart;
