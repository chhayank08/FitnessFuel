import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    reminders: true,
    updates: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: false,
    shareProgress: false,
    shareWorkouts: false,
  });
  const [themeSettings, setThemeSettings] = useState({
    darkMode: true,
    accentColor: 'primary',
  });
  
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.name]: e.target.checked,
    });
  };
  
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrivacySettings({
      ...privacySettings,
      [e.target.name]: e.target.checked,
    });
  };
  
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setThemeSettings({
      ...themeSettings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      
      {/* Notifications */}
      <div className="bg-dark-500 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-gray-400 text-sm">Receive updates and reminders via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="email"
                checked={notificationSettings.email}
                onChange={handleNotificationChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-gray-400 text-sm">Receive notifications on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="push"
                checked={notificationSettings.push}
                onChange={handleNotificationChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Workout Reminders</p>
              <p className="text-gray-400 text-sm">Get reminded about scheduled workouts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="reminders"
                checked={notificationSettings.reminders}
                onChange={handleNotificationChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Product Updates</p>
              <p className="text-gray-400 text-sm">Receive updates about new features</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="updates"
                checked={notificationSettings.updates}
                onChange={handleNotificationChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Privacy */}
      <div className="bg-dark-500 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Privacy</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Public Profile</p>
              <p className="text-gray-400 text-sm">Allow others to view your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="publicProfile"
                checked={privacySettings.publicProfile}
                onChange={handlePrivacyChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Share Progress</p>
              <p className="text-gray-400 text-sm">Allow others to view your progress</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="shareProgress"
                checked={privacySettings.shareProgress}
                onChange={handlePrivacyChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Share Workouts</p>
              <p className="text-gray-400 text-sm">Allow others to view your workouts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="shareWorkouts"
                checked={privacySettings.shareWorkouts}
                onChange={handlePrivacyChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Appearance */}
      <div className="bg-dark-500 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Appearance</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Dark Mode</p>
              <p className="text-gray-400 text-sm">Use dark theme throughout the app</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="darkMode"
                checked={themeSettings.darkMode}
                onChange={handleThemeChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div>
            <p className="text-white font-medium mb-2">Accent Color</p>
            <select
              name="accentColor"
              value={themeSettings.accentColor}
              onChange={handleThemeChange}
              className="w-full p-2 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="primary">Purple</option>
              <option value="secondary">Pink</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Data Management */}
      <div className="bg-dark-500 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Data Management</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-white font-medium mb-2">Export Data</p>
            <p className="text-gray-400 text-sm mb-2">Download all your data in JSON format</p>
            <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
              Export Data
            </button>
          </div>
          
          <div className="pt-4 border-t border-dark-400">
            <p className="text-white font-medium mb-2">Delete Account</p>
            <p className="text-gray-400 text-sm mb-2">Permanently delete your account and all data</p>
            <button className="bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;