import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const IconButton: React.FC<IconButtonProps> = ({ label, className = '', children, ...props }) => (
  <button
    aria-label={label}
    title={label}
    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted transition-colors duration-200 hover:bg-white/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
