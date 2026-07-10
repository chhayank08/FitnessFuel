import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface CardProps extends MotionProps {
  className?: string;
  interactive?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ className = '', interactive = false, children, onClick, ...motionProps }) => (
  <motion.div
    onClick={onClick}
    className={`card-glass ${interactive ? 'cursor-pointer transition-colors duration-200 hover:bg-surface-2' : ''} ${className}`}
    {...motionProps}
  >
    {children}
  </motion.div>
);

export default Card;
