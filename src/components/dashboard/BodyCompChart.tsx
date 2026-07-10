import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity } from 'lucide-react';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { MetricPoint } from '../../hooks/useHealthMetrics';

interface BodyCompChartProps {
  bodyFat: MetricPoint[];
  muscleMass: MetricPoint[];
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
          {p.dataKey === 'bodyFat' ? 'Body fat' : 'Muscle mass'}: {p.value}
          {p.dataKey === 'bodyFat' ? '%' : ' kg'}
        </p>
      ))}
    </div>
  );
};

const BodyCompChart: React.FC<BodyCompChartProps> = ({ bodyFat, muscleMass, className = '' }) => {
  const data = useMemo(() => {
    const map = new Map<string, { date: string; bodyFat?: number; muscleMass?: number }>();
    bodyFat.forEach((p) => {
      const label = new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      map.set(p.date, { ...(map.get(p.date) || { date: label }), date: label, bodyFat: p.value });
    });
    muscleMass.forEach((p) => {
      const label = new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      map.set(p.date, { ...(map.get(p.date) || { date: label }), date: label, muscleMass: p.value });
    });
    return Array.from(map.values());
  }, [bodyFat, muscleMass]);

  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white">Body composition</h3>
      {data.length < 2 ? (
        <EmptyState
          icon={Activity}
          title="No body composition data"
          description="Connect a smart scale (or the demo device) in Devices to see body fat and muscle mass trends."
        />
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="bodyfat-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6584" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF6584" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="muscle-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="bodyFat" stroke="#FF6584" strokeWidth={2} fill="url(#bodyfat-fill)" dot={false} name="Body fat" connectNulls />
              <Area type="monotone" dataKey="muscleMass" stroke="#34D399" strokeWidth={2} fill="url(#muscle-fill)" dot={false} name="Muscle mass" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary-400" />Body fat %</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-400" />Muscle mass kg</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BodyCompChart;
