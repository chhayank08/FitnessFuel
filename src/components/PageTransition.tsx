import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Route-level cross-fade for dashboard pages. Uses the useOutlet snapshot so
// the exiting page can animate out. Keyed on pathname only — search-param
// changes (e.g. DietPage tabs) must not re-run the transition. Kept subtle:
// pages run their own stagger entrances.
const PageTransition: React.FC = () => {
  const outlet = useOutlet();
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return <>{outlet}</>;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
