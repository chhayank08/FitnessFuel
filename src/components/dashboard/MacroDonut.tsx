import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MacroDonutProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

// Validated categorical trio (dataviz skill, dark-surface CVD check):
// protein #857BFF, carbs #D97706, fat #EC4899 — fixed order, never cycled.
const MACRO_COLORS = { protein: '#857BFF', carbs: '#D97706', fat: '#EC4899' };

const CustomTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number }[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-surface-line-strong bg-surface-3 px-3 py-2 shadow-card">
      <p className="text-sm font-semibold text-white">{p.name}: {p.value}g</p>
    </div>
  );
};

const MacroDonut: React.FC<MacroDonutProps> = ({ protein, carbs, fat, size = 140 }) => {
  const data = [
    { name: 'Protein', value: protein, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: carbs, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: fat, color: MACRO_COLORS.fat },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <div style={{ width: size, height: size }} className="flex items-center justify-center text-xs text-gray-500">No macro data</div>;
  }

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.3} outerRadius={size * 0.48} paddingAngle={2} stroke="none">
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MacroDonut;
