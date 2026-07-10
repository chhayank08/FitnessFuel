import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <p className="mt-1 max-w-xs text-sm text-gray-400">{description}</p>
    {actionLabel && onAction && (
      <Button variant="subtle" size="sm" className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
