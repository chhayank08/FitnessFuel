import React from 'react';
import { Search, Dumbbell, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MobileSidebar from './MobileSidebar';
import NotificationsDropdown from './NotificationsDropdown';
import IconButton from '../ui/IconButton';
import { useDailyLogContext } from '../../context/DailyLogContext';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const { palette, quickAdd, profile } = useDailyLogContext();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-surface-line bg-surface-base/80 backdrop-blur-xl">
      <div className="px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="-mt-1 md:hidden">
              <MobileSidebar />
            </div>
            <div className="ml-2 flex items-center md:ml-0">
              <Dumbbell className="h-7 w-7 text-primary-400" />
              <span className="ml-2 font-display text-lg font-semibold text-white">Fitness Fuel</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => palette.setOpen(true)}
              className="hidden w-64 items-center gap-2 rounded-xl border border-surface-line bg-surface-1 px-3.5 py-2 text-sm text-gray-500 transition-colors hover:border-surface-line-strong hover:text-gray-300 md:flex"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search or jump to…</span>
              <kbd className="rounded-md border border-surface-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>

            <IconButton label="Search" className="md:hidden" onClick={() => palette.setOpen(true)}>
              <Search className="h-5 w-5" />
            </IconButton>

            <IconButton label="Quick log" onClick={() => quickAdd.openWith('weight')} className="text-primary-300 hover:text-primary-200">
              <Plus className="h-5 w-5" />
            </IconButton>

            <NotificationsDropdown />

            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-gradient text-sm font-semibold text-white shadow-glow-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="ml-2 hidden text-sm text-gray-200 md:block">{displayName}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
