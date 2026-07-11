import React from 'react';
import { LucideIcon } from 'lucide-react';
import Card from '../ui/Card';

interface BaseStatCardProps {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

// Shared header/icon chrome for stat-style cards (StatTile, MetricStatCard).
const BaseStatCard: React.FC<BaseStatCardProps> = ({
  title,
  icon: Icon,
  iconClassName = 'bg-primary-500/15 text-primary-300',
  children,
  footer,
  className = '',
}) => (
  <Card className={`p-5 ${className}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-label font-medium uppercase text-gray-500">{title}</p>
        {children}
      </div>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {footer}
  </Card>
);

export default BaseStatCard;
