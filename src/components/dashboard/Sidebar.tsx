import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from './navItems';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-shrink-0 flex-col border-r border-surface-line bg-surface-1 md:flex">
      <nav className="mt-24 flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">Menu</p>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
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
          onClick={() => signOut()}
          className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={19} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
