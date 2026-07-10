import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RingGaugeProps {
  value: number; // 0..1, clamped
  size?: number;
  strokeWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  glow?: boolean;
  children?: React.ReactNode; // centered content
  className?: string;
}

const RingGauge: React.FC<RingGaugeProps> = ({
  value,
  size = 180,
  strokeWidth = 14,
  colorFrom = '#857BFF',
  colorTo = '#6C63FF',
  glow = true,
  children,
  className = '',
}) => {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const clamped = Math.min(Math.max(value, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
          {glow && (
            <filter id={`ring-glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-grad-${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          filter={glow ? `url(#ring-glow-${id})` : undefined}
          initial={reducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 50, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

export default RingGauge;
