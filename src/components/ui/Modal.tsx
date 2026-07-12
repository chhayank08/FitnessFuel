import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  // top aligns the panel near the top of the viewport (command palette style)
  align?: 'center' | 'top';
  panelClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  align = 'center',
  panelClassName = '',
  ariaLabel,
  ariaLabelledBy,
}) => {
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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 z-50 flex justify-center p-4 ${align === 'top' ? 'items-start pt-[12vh]' : 'items-center'}`}
        >
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
            className={`relative w-full max-w-lg rounded-2xl border border-surface-line-strong bg-surface-3 shadow-card ${panelClassName}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
