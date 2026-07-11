import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Sparkles, X } from 'lucide-react';

type Tone = 'primary' | 'success' | 'warning' | 'hydration';

const TONE_STYLES: Record<Tone, { border: string; icon: string; bg: string }> = {
  primary: { border: 'border-primary-500/25', icon: 'text-primary-300', bg: 'bg-primary-500/10' },
  success: { border: 'border-success-500/25', icon: 'text-success-400', bg: 'bg-success-500/10' },
  warning: { border: 'border-warning-500/25', icon: 'text-warning-400', bg: 'bg-warning-500/10' },
  hydration: { border: 'border-hydration-500/25', icon: 'text-hydration-400', bg: 'bg-hydration-500/10' },
};

interface InsightBannerProps {
  text: string;
  tone?: Tone;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  className?: string;
}

// Single-headline nudge, distinct from InsightCard's list of insights — meant
// for the one most useful thing to surface right now (e.g. "180g protein left").
const InsightBanner: React.FC<InsightBannerProps> = ({
  text,
  tone = 'primary',
  icon: Icon = Sparkles,
  action,
  dismissible = true,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);
  const styles = TONE_STYLES[tone];

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 rounded-xl border ${styles.border} ${styles.bg} px-4 py-3 ${className}`}
        >
          <Icon className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} />
          <p className="flex-1 text-sm text-gray-200">{text}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="flex-shrink-0 text-sm font-medium text-white underline-offset-2 hover:underline"
            >
              {action.label}
            </button>
          )}
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="flex-shrink-0 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InsightBanner;
