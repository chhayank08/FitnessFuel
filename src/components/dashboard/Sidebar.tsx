import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { PILLAR_ITEMS, SECONDARY_ITEMS } from './navItems';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
    isActive ? 'bg-primary-500/15 text-ink' : 'text-ink-muted hover:bg-white/5 hover:text-ink'
  }`;

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const isOnSecondaryPage = SECONDARY_ITEMS.some((item) => location.pathname.startsWith(item.path));
  const [youExpanded, setYouExpanded] = useState(isOnSecondaryPage);
  const YouIcon = PILLAR_ITEMS[4].icon;

  return (
    <div data-tour="sidebar" className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-shrink-0 flex-col border-r border-surface-line bg-surface-1 md:flex">
      <nav className="mt-24 flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Menu</p>
        <div className="space-y-1">
          {PILLAR_ITEMS.slice(0, 4).map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-400 shadow-glow-primary" />
                  )}
                  <item.icon size={19} className={`mr-3 ${isActive ? 'text-primary-300' : ''}`} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setYouExpanded((v) => !v)}
            className={`flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isOnSecondaryPage ? 'text-ink' : 'text-ink-muted hover:bg-white/5 hover:text-ink'
            }`}
          >
            <YouIcon size={19} className={`mr-3 ${isOnSecondaryPage ? 'text-primary-300' : ''}`} />
            <span className="flex-1 text-left">You</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${youExpanded ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence initial={false}>
            {youExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden pl-4"
              >
                <div className="space-y-1 border-l border-surface-line pl-3 pt-1">
                  {SECONDARY_ITEMS.map((item) => (
                    <NavLink key={item.path} to={item.path} className={navLinkClass}>
                      {({ isActive }) => (
                        <>
                          <item.icon size={17} className={`mr-3 ${isActive ? 'text-primary-300' : ''}`} />
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <div className="border-t border-surface-line p-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-white/5 hover:text-ink"
        >
          <LogOut size={19} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
