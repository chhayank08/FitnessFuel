import React from 'react';
import { Bell, Search, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MobileSidebar from './MobileSidebar';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-dark-500 shadow-md z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="md:hidden -mt-1">
              <MobileSidebar />
            </div>
            <div className="flex items-center ml-2 md:ml-0">
              <Dumbbell className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-white">Fitness Fuel</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>
            
            {/* Notifications */}
            <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-dark-400 focus:outline-none relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-secondary-500"></span>
            </button>
            
            {/* User menu */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="ml-2 text-white text-sm hidden md:block">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;