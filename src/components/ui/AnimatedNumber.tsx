import React, { useEffect, useState } from 'react';
import { useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString();

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, format = defaultFormat, className = '' }) => {
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => setDisplay(format(v)));
    return unsubscribe;
  }, [spring, format]);

  if (reducedMotion) {
    return <span className={`tabular-nums ${className}`}>{format(value)}</span>;
  }

  return <span className={`tabular-nums ${className}`}>{display}</span>;
};

export default AnimatedNumber;
