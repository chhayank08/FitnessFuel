import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

// Bottom-anchored modal for native-feeling mobile overlays (action sheets,
// pickers). Desktop/web callers should generally prefer Modal instead.
const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  children,
  panelClassName = '',
  ariaLabel,
  ariaLabelledBy,
}) => {
  const reducedMotion = useReducedMotion();
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            tabIndex={-1}
            className={`relative w-full max-w-lg rounded-t-2xl border border-surface-line-strong bg-surface-3 pb-safe shadow-elevation-3 sm:rounded-2xl ${panelClassName}`}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            drag={reducedMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={reducedMotion ? undefined : onDragEnd}
          >
            <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-surface-line-strong sm:hidden" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Sheet;
