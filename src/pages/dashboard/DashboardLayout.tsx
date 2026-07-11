import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DailyLogProvider } from '../../context/DailyLogContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import Sidebar from '../../components/dashboard/Sidebar';
import BottomTabBar from '../../components/dashboard/BottomTabBar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import CommandPalette from '../../components/dashboard/CommandPalette';
import QuickAddModal from '../../components/dashboard/QuickAddModal';
import InstallPrompt from '../../components/InstallPrompt';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const isOnline = useOnlineStatus();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <DailyLogProvider>
      <div className="min-h-screen bg-surface-base">
        <DashboardHeader />
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-0 top-20 z-30 overflow-hidden md:left-64"
            >
              <div className="flex items-center justify-center gap-2 bg-warning-500/15 px-4 py-2 text-sm text-warning-400">
                <WifiOff className="h-3.5 w-3.5" />
                You're offline — showing your last-loaded data
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex">
          <Sidebar />
          <main className="ml-0 mt-20 min-h-screen flex-1 p-4 pb-[calc(4.25rem+env(safe-area-inset-bottom)+1rem)] md:ml-64 md:p-8 md:pb-8">
            <Outlet />
          </main>
        </div>
        <BottomTabBar />
        <CommandPalette />
        <QuickAddModal />
        <InstallPrompt />
      </div>
    </DailyLogProvider>
  );
};

export default DashboardLayout;
