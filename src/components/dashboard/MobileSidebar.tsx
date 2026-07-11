import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SECONDARY_ITEMS, COACH_ITEM } from './navItems';
import IconButton from '../ui/IconButton';
import Sheet from '../ui/Sheet';

// Mobile overflow menu for the "You" pillar's sub-pages + Form Coach deep
// link + sign out. Primary navigation lives in BottomTabBar; this only
// covers what doesn't fit in the 5 tab slots.
const MobileSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  const items = [...SECONDARY_ITEMS, COACH_ITEM];

  return (
    <>
      <div className="md:hidden">
        <IconButton label="Open menu" onClick={() => setIsOpen(true)}>
          <Menu className="h-6 w-6" />
        </IconButton>
      </div>

      <Sheet open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-2 pb-4">
          <p className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">More</p>
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                    isActive ? 'bg-primary-500/15 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={19} className="mr-3" />
                {item.name}
              </NavLink>
            ))}
          </div>
          <div className="mt-2 border-t border-surface-line pt-2">
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
            >
              <LogOut size={19} className="mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
};

export default MobileSidebar;
