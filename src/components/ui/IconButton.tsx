import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const IconButton: React.FC<IconButtonProps> = ({ label, className = '', children, ...props }) => (
  <button
    aria-label={label}
    title={label}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
