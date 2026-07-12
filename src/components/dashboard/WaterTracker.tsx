import React from 'react';
import { GlassWater, Plus } from 'lucide-react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import AnimatedNumber from '../ui/AnimatedNumber';
import { hapticLight } from '../../lib/haptics';

interface WaterTrackerProps {
  waterMl: number;
  targetMl: number;
  onAdd: (ml: number) => void;
  className?: string;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ waterMl, targetMl, onAdd, className = '' }) => (
  <Card className={`p-5 ${className}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink">Water</h3>
      <GlassWater className="h-4 w-4 text-hydration-400" />
    </div>

    <p className="mt-3 font-display text-2xl font-semibold text-ink">
      <AnimatedNumber value={waterMl} />
      <span className="ml-1 text-sm font-normal text-ink-muted">/ {targetMl.toLocaleString()} ml</span>
    </p>

    <ProgressBar value={targetMl > 0 ? waterMl / targetMl : 0} colorClassName="bg-hydration-500" className="mt-3" />

    <div className="mt-4 flex gap-2">
      {[250, 500].map((ml) => (
        <button
          key={ml}
          onClick={() => { hapticLight(); onAdd(ml); }}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-hydration-500/25 bg-hydration-500/10 py-2 text-xs font-medium text-hydration-400 transition-colors hover:bg-hydration-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-hydration-400"
        >
          <Plus className="h-3.5 w-3.5" />
          {ml} ml
        </button>
      ))}
    </div>
  </Card>
);

export default WaterTracker;
