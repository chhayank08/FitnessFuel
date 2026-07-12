import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Reveal from './Reveal';

const FAQS = [
  {
    q: 'Is Fitness Fuel free?',
    a: 'Yes — creating an account, personalized nutrition targets, meal plans, workout plans, and the AI Form Coach are all free.',
  },
  {
    q: 'Does the Form Coach record or upload my video?',
    a: 'No. Pose detection runs entirely on your device in the browser. The camera feed is never recorded, stored, or sent anywhere.',
  },
  {
    q: 'Can I use it offline?',
    a: 'Yes. Install the app to your home screen and your last-loaded data stays available offline; changes sync when you reconnect.',
  },
  {
    q: 'Does it work with my fitness tracker?',
    a: 'You can connect supported health platforms from the Devices page to pull in steps, sleep, and heart-rate data for your health score.',
  },
  {
    q: 'How are my calorie targets calculated?',
    a: 'From your weight, height, age, activity level, and goal using standard TDEE formulas — then split into protein, carb, and fat targets.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Questions, answered</h2>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <Reveal key={faq.q} delay={i * 0.05}>
                <div className="card-glass overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-ink">{faq.q}</span>
                    <motion.span
                      animate={reducedMotion ? undefined : { rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 text-ink-faint"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="px-5 pb-4 text-sm text-ink-muted">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
