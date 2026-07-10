import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu, X, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from './navItems';
import IconButton from '../ui/IconButton';

const MobileSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      <div className="md:hidden">
        <IconButton label="Open menu" onClick={() => setIsOpen(true)}>
          <Menu className="h-6 w-6" />
        </IconButton>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-surface-line bg-surface-1"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <div className="flex items-center justify-between border-b border-surface-line p-4">
                <div className="flex items-center">
                  <Dumbbell className="h-7 w-7 text-primary-400" />
                  <span className="ml-2 font-display text-lg font-semibold text-white">Fitness Fuel</span>
                </div>
                <IconButton label="Close menu" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>

              <nav className="mt-4 flex-grow px-3">
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard'}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-primary-500/15 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
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
                </div>
              </nav>

              <div className="border-t border-surface-line p-4">
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={19} className="mr-3" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileSidebar;
