import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary-gradient text-white shadow-glow-primary hover:brightness-110 active:brightness-95',
  ghost:
    'bg-transparent text-gray-300 hover:bg-white/5 hover:text-white',
  subtle:
    'bg-surface-2 text-gray-200 border border-surface-line hover:bg-surface-3 hover:text-white',
  danger:
    'bg-secondary-600/90 text-white hover:bg-secondary-600',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base rounded-2xl gap-2',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);

export default Button;
