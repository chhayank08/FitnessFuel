import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-shimmer rounded-lg ${className}`}
    style={{
      backgroundImage:
        'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
    }}
  />
);

export default Skeleton;
