import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0..1, clamped
  colorClassName?: string; // tailwind bg-* class for the fill
  heightClassName?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  colorClassName = 'bg-primary-500',
  heightClassName = 'h-2',
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const pct = Math.min(Math.max(value, 0), 1) * 100;

  return (
    <div className={`w-full overflow-hidden rounded-full bg-surface-3 ${heightClassName} ${className}`}>
      <motion.div
        className={`h-full rounded-full ${colorClassName}`}
        initial={reducedMotion ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
      />
    </div>
  );
};

export default ProgressBar;
