import React from 'react';

type Activity = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'diet' | 'exercise' | 'progress' | 'system';
};

type ActivityCardProps = {
  activities: Activity[];
};

const ActivityCard: React.FC<ActivityCardProps> = ({ activities }) => {
  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'diet':
        return 'bg-green-500';
      case 'exercise':
        return 'bg-primary-500';
      case 'progress':
        return 'bg-secondary-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-dark-500 rounded-lg shadow-md p-6">
      <h3 className="text-white text-lg font-medium mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex">
            <div className="mr-4 flex-shrink-0">
              <div className={`h-3 w-3 rounded-full mt-1 ${getTypeColor(activity.type)}`}></div>
            </div>
            <div>
              <p className="text-white font-medium">{activity.title}</p>
              <p className="text-gray-400 text-sm">{activity.description}</p>
              <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityCard;