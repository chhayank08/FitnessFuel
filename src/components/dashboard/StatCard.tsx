import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  color: string;
};

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  positive = true, 
  icon: Icon,
  color
}) => {
  return (
    <div className="bg-dark-500 rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-white">{value}</p>
            {change && (
              <p className={`ml-2 text-sm ${positive ? 'text-green-500' : 'text-secondary-500'}`}>
                {positive ? '+' : ''}{change}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;