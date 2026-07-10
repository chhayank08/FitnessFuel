import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) => (
  <div className={`inline-flex max-w-full overflow-x-auto rounded-xl bg-surface-2 p-1 ${className}`}>
    {tabs.map((tab) => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
            isActive ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="tabs-pill"
              className="absolute inset-0 rounded-lg bg-primary-500/20"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

export default Tabs;
