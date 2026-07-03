import React, { useState, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ProgressChart from '../../components/dashboard/ProgressChart';

type ProgressLog = {
  id: string;
  created_at: string;
  weight: number | null;
  notes: string | null;
  mood: string | null;
};

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchProgressLogs();
    }
  }, [user]);
  
  const fetchProgressLogs = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProgressLogs(data);
      }
    } catch (error) {
      console.error('Error fetching progress logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare data for weight chart
  const weightChartData = {
    labels: progressLogs
      .slice()
      .reverse()
      .map(log => new Date(log.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: progressLogs
          .slice()
          .reverse()
          .map(log => log.weight || 0),
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Mock data for other charts
  const calorieChartData = {
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
  
  const workoutChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Workouts Completed',
        data: [3, 5, 4, 6],
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Progress Tracking</h1>
          <p className="text-gray-400 mt-1">Monitor your fitness journey</p>
        </div>
        
        <button className="mt-4 md:mt-0 flex items-center bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
          <Plus className="mr-2 h-5 w-5" />
          Log Progress
        </button>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart 
          title="Weight Progress" 
          data={progressLogs.length > 0 ? weightChartData : {
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
          }} 
        />
        <ProgressChart title="Calorie Intake vs. Burn" data={calorieChartData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart title="Workout Consistency" data={workoutChartData} />
        <div className="bg-dark-500 rounded-lg shadow-md p-6">
          <h3 className="text-white text-lg font-medium mb-4">Stats Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-400 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Starting Weight</p>
              <p className="text-2xl font-semibold text-white">185 lbs</p>
            </div>
            <div className="bg-dark-400 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Current Weight</p>
              <p className="text-2xl font-semibold text-white">172 lbs</p>
            </div>
            <div className="bg-dark-400 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Loss</p>
              <p className="text-2xl font-semibold text-green-500">-13 lbs</p>
            </div>
            <div className="bg-dark-400 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Avg. Weekly Loss</p>
              <p className="text-2xl font-semibold text-green-500">-1.1 lbs</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Logs */}
      <div className="bg-dark-500 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-medium">Progress Logs</h3>
          <button className="flex items-center text-primary-400 hover:text-primary-300 transition duration-150">
            <Calendar className="h-5 w-5 mr-1" />
            View Calendar
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : progressLogs.length > 0 ? (
          <div className="space-y-4">
            {progressLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="bg-dark-400 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">
                      {new Date(log.created_at).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {log.weight && (
                      <p className="text-gray-300 mt-1">Weight: {log.weight} lbs</p>
                    )}
                    {log.mood && (
                      <p className="text-gray-300 mt-1">Mood: {log.mood}</p>
                    )}
                  </div>
                  <div className="bg-dark-500 px-3 py-1 rounded-full text-sm text-primary-400">
                    Details
                  </div>
                </div>
                {log.notes && (
                  <p className="text-gray-400 mt-2 border-t border-dark-300 pt-2">{log.notes}</p>
                )}
              </div>
            ))}
            
            {progressLogs.length > 5 && (
              <button className="w-full py-2 text-center text-primary-400 hover:text-primary-300 transition duration-150">
                View All Logs
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No progress logs found. Start tracking your progress!</p>
            <button className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
              <Plus className="mr-2 h-5 w-5" />
              Log Progress
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;