import React from 'react';
import { Activity, Dumbbell, Flame, Heart, TrendingUp, Utensils, Weight } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import ProgressChart from '../../components/dashboard/ProgressChart';
import ActivityCard from '../../components/dashboard/ActivityCard';
import { useAuth } from '../../context/AuthContext';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  
  // Mock data for the weight progress chart
  const weightData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Weight (lbs)',
        data: [185, 183, 180, 178, 175, 172],
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Mock data for the calories chart
  const caloriesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories Consumed',
        data: [2100, 2300, 2000, 2400, 2200, 2500, 2300],
        borderColor: '#FF6584',
        backgroundColor: 'rgba(255, 101, 132, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Calories Burned',
        data: [2300, 2400, 2200, 2500, 2400, 2600, 2500],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Mock data for recent activities
  const activities = [
    {
      id: '1',
      title: 'Completed Workout',
      description: 'Upper Body Strength Training - 45 minutes',
      time: '2 hours ago',
      type: 'exercise' as const,
    },
    {
      id: '2',
      title: 'Logged Meal',
      description: 'Breakfast - Oatmeal with berries and protein shake',
      time: '5 hours ago',
      type: 'diet' as const,
    },
    {
      id: '3',
      title: 'Weight Update',
      description: 'Recorded new weight: 172 lbs (-0.5 lbs)',
      time: '1 day ago',
      type: 'progress' as const,
    },
    {
      id: '4',
      title: 'New Diet Plan',
      description: 'Created a new high-protein meal plan',
      time: '2 days ago',
      type: 'diet' as const,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.email?.split('@')[0] || 'User'}</h1>
        <p className="text-gray-400 mt-1">Here's an overview of your fitness journey</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Current Weight" 
          value="172 lbs" 
          change="3 lbs" 
          positive={false} 
          icon={Weight}
          color="bg-primary-500"
        />
        <StatCard 
          title="Daily Calories" 
          value="2,300" 
          change="200" 
          positive={true} 
          icon={Flame}
          color="bg-secondary-500"
        />
        <StatCard 
          title="Active Days" 
          value="18/30" 
          change="5 days" 
          positive={true} 
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard 
          title="Workouts" 
          value="12" 
          change="3" 
          positive={true} 
          icon={Dumbbell}
          color="bg-blue-500"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart title="Weight Progress" data={weightData} />
        <ProgressChart title="Calorie Intake vs. Burn" data={caloriesData} />
      </div>
      
      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ActivityCard activities={activities} />
        </div>
        
        <div className="lg:col-span-2 bg-dark-500 rounded-lg shadow-md p-6">
          <h3 className="text-white text-lg font-medium mb-4">Upcoming Schedule</h3>
          <div className="space-y-4">
            <div className="flex p-4 bg-dark-400 rounded-lg">
              <div className="mr-4">
                <Dumbbell className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <p className="text-white font-medium">Lower Body Workout</p>
                <p className="text-gray-400 text-sm">Today, 5:30 PM - 6:30 PM</p>
              </div>
            </div>
            
            <div className="flex p-4 bg-dark-400 rounded-lg">
              <div className="mr-4">
                <Utensils className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-white font-medium">Meal Prep</p>
                <p className="text-gray-400 text-sm">Tomorrow, 10:00 AM - 11:30 AM</p>
              </div>
            </div>
            
            <div className="flex p-4 bg-dark-400 rounded-lg">
              <div className="mr-4">
                <Heart className="h-6 w-6 text-secondary-500" />
              </div>
              <div>
                <p className="text-white font-medium">Cardio Session</p>
                <p className="text-gray-400 text-sm">Wednesday, 6:00 AM - 7:00 AM</p>
              </div>
            </div>
            
            <div className="flex p-4 bg-dark-400 rounded-lg">
              <div className="mr-4">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-white font-medium">Progress Check-in</p>
                <p className="text-gray-400 text-sm">Friday, 8:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;