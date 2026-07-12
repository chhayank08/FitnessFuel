import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, BarChart, ScanFace } from 'lucide-react';
import Button from '../ui/Button';

interface HeroProps {
  onGetStarted: () => void;
  onScrollToFeatures: () => void;
}

const HEADLINE_LINES = ['Your health, understood —', 'not just tracked'];

const Hero: React.FC<HeroProps> = ({ onGetStarted, onScrollToFeatures }) => {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={sectionRef} className="bg-hero-gradient relative overflow-hidden py-24 sm:py-32">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-secondary-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              {HEADLINE_LINES.map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  {line}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="mt-6 text-lg text-ink-muted"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              Fitness Fuel turns your nutrition, training, and recovery into one clear plan — with live form
              feedback and insights that actually tell you what to do next.
            </motion.p>

            <motion.div
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <h3 className="text-base font-semibold text-ink">Health improvement</h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Boost your overall health with customized nutrition and fitness recommendations.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Meal planning</h3>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Easily plan your meals with an intuitive, personalized interface.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Button size="lg" onClick={onGetStarted}>
                Get started free
              </Button>
              <button
                onClick={onScrollToFeatures}
                className="group flex items-center justify-center gap-2 rounded-xl border border-surface-line-strong px-6 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-primary-400/50 hover:text-ink"
              >
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          <div className="relative hidden lg:block">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-primary-gradient opacity-30 blur-2xl"
              aria-hidden="true"
            />
            <motion.div style={reducedMotion ? undefined : { y: imageY }} className="relative">
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80"
                alt="Fitness tracking and meal planning"
                className="rounded-2xl border border-surface-line-strong shadow-elevation-3"
              />
              <motion.div
                className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-surface-line-strong bg-surface-2/95 p-4 shadow-card backdrop-blur-xl"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 24 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/15 text-success-400">
                  <BarChart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Health Score 87</p>
                  <p className="text-xs text-ink-muted">Trending up this week</p>
                </div>
              </motion.div>
              <motion.div
                className="absolute -right-5 -top-5 flex items-center gap-3 rounded-2xl border border-surface-line-strong bg-surface-2/95 p-4 shadow-card backdrop-blur-xl"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.85, type: 'spring', stiffness: 300, damping: 24 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  <ScanFace className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">12 reps · form 92</p>
                  <p className="text-xs text-ink-muted">AI Form Coach live</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
