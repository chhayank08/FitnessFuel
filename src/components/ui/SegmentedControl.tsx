import React, { useId } from 'react';
import { motion } from 'framer-motion';

export interface SegmentedControlOption {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  active,
  onChange,
  className = '',
  size = 'md',
}) => {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      className={`inline-flex max-w-full overflow-x-auto rounded-xl bg-surface-2 p-1 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.id === active;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${SIZES[size]} ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`segmented-pill-${layoutId}`}
                className="absolute inset-0 rounded-lg bg-primary-500/20"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.icon && <option.icon className="h-3.5 w-3.5" />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
