import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, ScanBarcode, ScanFace, Droplets, Weight, UtensilsCrossed } from 'lucide-react';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { hapticLight, hapticSelection } from '../../lib/haptics';

interface Action {
  key: string;
  label: string;
  icon: React.ElementType;
  run: () => void;
}

interface SmartActionButtonProps {
  variant: 'header' | 'fab';
}

// Expanding quick-action button. Header variant fans out as a dropdown list;
// FAB variant sits above the bottom tab bar with a scrim behind the fan.
const SmartActionButton: React.FC<SmartActionButtonProps> = ({ variant }) => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { quickAdd } = useDailyLogContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const dispatch = (run: () => void) => {
    hapticLight();
    setOpen(false);
    run();
  };

  const actions: Action[] = [
    { key: 'barcode', label: 'Scan barcode', icon: ScanBarcode, run: () => navigate('/dashboard/diet?tab=search&scan=1') },
    { key: 'workout', label: 'Quick workout', icon: ScanFace, run: () => navigate('/dashboard/exercise/workout') },
    { key: 'water', label: 'Log water', icon: Droplets, run: () => quickAdd.openWith('water') },
    { key: 'weight', label: 'Log weight', icon: Weight, run: () => quickAdd.openWith('weight') },
    { key: 'meal', label: 'Custom meal', icon: UtensilsCrossed, run: () => quickAdd.openWith('meal') },
  ];

  const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reducedMotion ? 0 : 0.035 } },
  };
  const itemVariants = reducedMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: variant === 'fab' ? 14 : -10, scale: 0.9 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 420, damping: 26 } },
      };

  const trigger = (
    <motion.button
      onClick={() => {
        hapticSelection();
        setOpen((v) => !v);
      }}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label="Quick actions"
      data-tour="smart-action"
      animate={reducedMotion ? undefined : { rotate: open ? 45 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={
        variant === 'fab'
          ? 'flex h-14 w-14 items-center justify-center rounded-full bg-primary-gradient text-white shadow-glow-primary'
          : 'tap-target flex items-center justify-center rounded-xl text-primary-300 transition-colors hover:bg-white/5 hover:text-primary-200'
      }
    >
      <Plus className={variant === 'fab' ? 'h-7 w-7' : 'h-5 w-5'} />
    </motion.button>
  );

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          aria-label="Quick actions"
          variants={listVariants}
          initial="hidden"
          animate="show"
          exit="hidden"
          className={
            variant === 'fab'
              ? 'absolute bottom-16 right-0 flex flex-col items-end gap-2.5'
              : 'absolute right-0 top-12 z-50 flex w-52 flex-col gap-1 rounded-2xl border border-surface-line-strong bg-surface-3 p-1.5 shadow-elevation-3'
          }
        >
          {actions.map((action) => (
            <motion.button
              key={action.key}
              role="menuitem"
              variants={itemVariants}
              onClick={() => dispatch(action.run)}
              className={
                variant === 'fab'
                  ? 'flex items-center gap-2.5 rounded-full border border-surface-line-strong bg-surface-3 py-2.5 pl-4 pr-3 text-sm font-medium text-ink shadow-elevation-2'
                  : 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink'
              }
            >
              {variant === 'fab' ? (
                <>
                  {action.label}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
                    <action.icon className="h-4 w-4" />
                  </span>
                </>
              ) : (
                <>
                  <action.icon className="h-4 w-4 flex-shrink-0 text-primary-300" />
                  {action.label}
                </>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (variant === 'fab') {
    return (
      <>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
          )}
        </AnimatePresence>
        <div
          ref={containerRef}
          className="fixed right-4 z-40 md:hidden"
          style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom) + 1rem)' }}
        >
          {menu}
          {trigger}
        </div>
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {trigger}
      {menu}
    </div>
  );
};

export default SmartActionButton;
