import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DailyLogProvider } from '../../context/DailyLogContext';
import Sidebar from '../../components/dashboard/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import CommandPalette from '../../components/dashboard/CommandPalette';
import QuickAddModal from '../../components/dashboard/QuickAddModal';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();

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
        <div className="flex">
          <Sidebar />
          <main className="ml-0 mt-20 min-h-screen flex-1 p-4 md:ml-64 md:p-8">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <QuickAddModal />
      </div>
    </DailyLogProvider>
  );
};

export default DashboardLayout;
