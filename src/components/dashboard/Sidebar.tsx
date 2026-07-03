import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Utensils, 
  Dumbbell, 
  Settings, 
  BarChart, 
  Calendar, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Profile', path: '/dashboard/profile', icon: <User size={20} /> },
    { name: 'Diet', path: '/dashboard/diet', icon: <Utensils size={20} /> },
    { name: 'Exercise', path: '/dashboard/exercise', icon: <Dumbbell size={20} /> },
    { name: 'Progress', path: '/dashboard/progress', icon: <BarChart size={20} /> },
    { name: 'Schedule', path: '/dashboard/schedule', icon: <Calendar size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="fixed left-0 top-0 h-full bg-dark-500 text-white w-64 flex-shrink-0 hidden md:flex md:flex-col z-30">
      <nav className="flex-1 mt-24 px-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition duration-150 ${
                  isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-300 hover:bg-dark-400 hover:text-white'
                }`
              }
              end={item.path === '/dashboard'}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t border-dark-400">
        <button
          onClick={() => signOut()}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-md hover:bg-dark-400 hover:text-white transition duration-150"
        >
          <LogOut size={20} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;