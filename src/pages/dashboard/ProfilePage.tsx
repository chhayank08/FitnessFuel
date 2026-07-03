import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Profile = {
  id: string;
  full_name: string | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  goal: string | null;
  age: string | null;
  gender: string | null;
  weekly_weight_change?: number;
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    weight: profile?.weight?.toString() || '70',
    height: profile?.height?.toString() || '170',
    age: profile?.age?.toString() || '30',
    gender: profile?.gender || 'male',
    activity_level: profile?.activity_level || 'moderately_active',
    goal: profile?.goal || 'maintain',
    weekly_weight_change: profile?.weekly_weight_change || 0
  });

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          weight: data.weight?.toString() || '70',
          height: data.height?.toString() || '170',
          age: data.age?.toString() || '30',
          gender: data.gender || 'male',
          activity_level: data.activity_level || 'moderately_active',
          goal: data.goal || 'maintain',
          weekly_weight_change: data.weekly_weight_change || 0
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      handleNumberInput(e as React.ChangeEvent<HTMLInputElement>);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateFormData = () => {
    if (!formData.full_name?.trim()) return 'Full name is required';

    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
  
    if (weight < 30 || weight > 300) return 'Please enter a valid weight between 30 and 300 kg';
    if (height < 100 || height > 250) return 'Please enter a valid height between 100 and 250 cm';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!user) {
        setMessage({ text: 'Please sign in to update your profile', type: 'error' });
        return;
      }

      const validationError = validateFormData();
      if (validationError) {
        setMessage({ text: validationError, type: 'error' });
        return;
      }
      
      const updates = {
        id: user.id,
        full_name: formData.full_name.trim(),
        weight: formData.weight,
        height: formData.height,
        activity_level: formData.activity_level,
        goal: formData.goal,
        weekly_weight_change: formData.weekly_weight_change,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      
      await fetchProfile(); // Refresh profile data
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Error updating profile. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-500 bg-opacity-20 text-green-500' : 'bg-secondary-500 bg-opacity-20 text-secondary-500'}`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-dark-500 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-1">
                Weight (kg)
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-1">
                Height (cm)
              </label>
              <input
                id="height"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-1">
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="goal" className="block text-sm font-medium text-gray-300 mb-1">
                Fitness Goal
              </label>
              <select
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a goal</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="weight_gain">Weight Gain</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintain">Maintain Weight</option>
              </select>
            </div>
            
            {(formData.goal === 'weight_loss' || formData.goal === 'weight_gain') && (
              <div className="md:col-span-2">
                <label htmlFor="weekly_weight_change" className="block text-sm font-medium text-gray-300 mb-3">
                  Weekly {formData.goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'} Target: {formData.goal === 'weight_loss' ? Math.abs(formData.weekly_weight_change) : formData.weekly_weight_change} kg/week
                </label>
                <div className="px-4">
                  <input
                    id="weekly_weight_change"
                    name="weekly_weight_change"
                    type="range"
                    min={formData.goal === 'weight_loss' ? "0.1" : "0.1"}
                    max={formData.goal === 'weight_loss' ? "2" : "2"}
                    step="0.1"
                    value={formData.weekly_weight_change}
                    onChange={handleChange}
                    className="w-full h-2 bg-dark-400 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>0.1 kg/week</span>
                    <span>1 kg/week</span>
                    <span>2 kg/week</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.goal === 'weight_loss' 
                    ? 'Recommended: 0.5-1 kg per week for healthy weight loss'
                    : 'Recommended: 0.25-0.5 kg per week for healthy weight gain'
                  }
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label htmlFor="activity_level" className="block text-sm font-medium text-gray-300 mb-1">
                Activity Level
              </label>
              <select
                id="activity_level"
                name="activity_level"
                value={formData.activity_level}
                onChange={handleChange}
                className="w-full p-3 bg-dark-400 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select your activity level</option>
                <option value="sedentary">Sedentary (Little to no exercise)</option>
                <option value="light">Lightly Active (Light exercise 1-3 days/week)</option>
                <option value="moderate">Moderately Active (Moderate exercise 3-5 days/week)</option>
                <option value="very">Very Active (Hard exercise 6-7 days/week)</option>
                <option value="extra">Extra Active (Very hard exercise & physical job)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-md transition duration-200 disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 bg-dark-500 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
        
        <div className="space-y-4">
          <button className="w-full md:w-auto bg-transparent hover:bg-dark-400 text-white font-medium py-2 px-4 rounded-md border border-dark-300 transition duration-200">
            Change Password
          </button>
          
          <button className="w-full md:w-auto bg-transparent hover:bg-secondary-500 text-secondary-500 hover:text-white font-medium py-2 px-4 rounded-md border border-secondary-500 transition duration-200">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
