import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useTour } from './TourContext';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Full-screen overlay that cuts a spotlight around the current tour step's
// target and anchors a coachmark card beside it.
const Spotlight: React.FC = () => {
  const { active, stepIndex, steps, next, prev, skip } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const [rect, setRect] = useState<Rect | null>(null);
  const trapRef = useFocusTrap(active);
  const pollRef = useRef<number>();

  const step = active ? steps[stepIndex] : null;

  // Navigate to the step's route if needed, then poll (bounded) for the target.
  useEffect(() => {
    if (!step) return;
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
      return; // effect re-runs on location change
    }

    let attempts = 0;
    const measure = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        return;
      }
      attempts += 1;
      if (attempts < 60) pollRef.current = requestAnimationFrame(measure);
      else next(); // target never appeared — skip this step
    };
    measure();

    const onUpdate = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener('resize', onUpdate);
    window.addEventListener('scroll', onUpdate, true);
    return () => {
      if (pollRef.current) cancelAnimationFrame(pollRef.current);
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate, true);
    };
  }, [step, location.pathname, navigate, next]);

  // Scroll target into view when the rect lands offscreen.
  useEffect(() => {
    if (!step || !rect) return;
    if (rect.top < 80 || rect.top + rect.height > window.innerHeight - 40) {
      document.querySelector(step.target)?.scrollIntoView({
        block: 'center',
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, rect == null]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, skip, next, prev]);

  if (!active || !step) return null;

  const cardBelow = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : true;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        className="fixed inset-0 z-[70]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-modal="true"
        role="dialog"
        aria-label={`Product tour: ${step.title}`}
      >
        {/* Spotlight cutout */}
        {rect ? (
          <motion.div
            className="absolute rounded-2xl"
            initial={false}
            animate={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)', pointerEvents: 'none' }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/70" style={{ pointerEvents: 'none' }} />
        )}

        {/* Coachmark card — outer div owns positioning so motion can own transform */}
        <div
          ref={trapRef}
          className="absolute left-1/2 w-[min(22rem,calc(100vw-2rem))]"
          style={{
            top: rect
              ? cardBelow
                ? Math.min(rect.top + rect.height + 16, window.innerHeight - 240)
                : Math.max(rect.top - 240, 16)
              : '40%',
            transform: 'translateX(-50%)',
          }}
        >
        <motion.div
          key={step.id}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: cardBelow ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-surface-line-strong bg-surface-3 p-5 shadow-elevation-3"
        >
          <p className="text-xs font-medium text-ink-faint">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink">{step.title}</h3>
          <p className="mt-1.5 text-sm text-ink-muted">{step.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={skip} className="text-sm text-ink-faint transition-colors hover:text-ink">
              Skip tour
            </button>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <Button variant="subtle" size="sm" onClick={prev}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={next}>
                {stepIndex + 1 >= steps.length ? 'Done' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default Spotlight;
