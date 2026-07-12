import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TOUR_STEPS, TOUR_STORAGE_KEY, TourStep } from './tourSteps';

interface TourContextValue {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  isDone: () => boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

function visibleSteps(): TourStep[] {
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  return TOUR_STEPS.filter((s) => s.media === 'all' || (isDesktop ? s.media === 'desktop' : s.media === 'mobile'));
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'done');
    setActive(false);
    setStepIndex(0);
  }, []);

  const start = useCallback(() => {
    setSteps(visibleSteps());
    setStepIndex(0);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= visibleSteps().length) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [finish]);

  const prev = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);

  const isDone = useCallback(() => localStorage.getItem(TOUR_STORAGE_KEY) === 'done', []);

  const value = useMemo(
    () => ({ active, stepIndex, steps, start, next, prev, skip: finish, isDone }),
    [active, stepIndex, steps, start, next, prev, finish, isDone]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
