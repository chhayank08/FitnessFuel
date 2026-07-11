import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PILLAR_ITEMS } from './navItems';

const BottomTabBar: React.FC = () => (
  <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-line bg-surface-1/95 pb-safe backdrop-blur-xl md:hidden">
    <div className="flex h-16 items-stretch justify-around">
      {PILLAR_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/dashboard'}
          className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="bottom-tab-indicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary-400 shadow-glow-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon size={21} className={isActive ? 'text-primary-300' : 'text-gray-500'} />
              <span className={isActive ? 'text-white' : 'text-gray-500'}>{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomTabBar;
