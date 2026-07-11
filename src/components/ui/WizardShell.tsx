import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Button from './Button';
import ProgressBar from './ProgressBar';

interface WizardShellProps {
  step: number; // 0-indexed
  totalSteps: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  hideFooter?: boolean;
  children: React.ReactNode;
}

const WizardShell: React.FC<WizardShellProps> = ({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  nextLoading = false,
  hideFooter = false,
  children,
}) => (
  <div className="flex min-h-screen flex-col bg-surface-base">
    <div className="flex items-center gap-4 px-5 pb-2 pt-safe sm:px-8">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : (
        <div className="h-9 w-9 flex-shrink-0" />
      )}
      <ProgressBar value={(step + 1) / totalSteps} className="flex-1" heightClassName="h-1.5" />
      <span className="w-10 flex-shrink-0 text-right text-xs tabular-nums text-gray-500">
        {step + 1}/{totalSteps}
      </span>
    </div>

    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>

    {!hideFooter && (
      <div className="border-t border-surface-line px-5 pb-safe pt-4 sm:px-8">
        <div className="mx-auto max-w-md">
          <Button
            variant="primary"
            className="w-full"
            onClick={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    )}
  </div>
);

export default WizardShell;
