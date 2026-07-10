import React from 'react';

type Tone = 'primary' | 'success' | 'hydration' | 'alert' | 'neutral';

const TONES: Record<Tone, string> = {
  primary: 'bg-primary-500/15 text-primary-300 border-primary-500/25',
  success: 'bg-success-500/15 text-success-400 border-success-500/25',
  hydration: 'bg-hydration-500/15 text-hydration-400 border-hydration-500/25',
  alert: 'bg-secondary-500/15 text-secondary-400 border-secondary-500/25',
  neutral: 'bg-white/5 text-gray-300 border-surface-line-strong',
};

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
