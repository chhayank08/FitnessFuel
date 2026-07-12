import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { Dumbbell, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { User } from '@supabase/supabase-js';
import { AuthMode } from './AuthModal';

interface LandingNavProps {
  user: User | null;
  onOpenAuth: (mode: AuthMode) => void;
  onSignOut: () => void;
  onScrollToFeatures: () => void;
}

const navLinkClass =
  'px-3 py-2 rounded-lg text-sm font-medium text-ink-muted transition-colors hover:bg-white/5 hover:text-ink';

const LandingNav: React.FC<LandingNavProps> = ({ user, onOpenAuth, onSignOut, onScrollToFeatures }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setCondensed(y > 24));

  return (
    <nav className="fixed inset-x-0 top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <motion.div
        className="mx-3 mt-2 rounded-2xl border bg-surface-base/70 shadow-elevation-2 backdrop-blur-xl sm:mx-4 lg:mx-auto lg:max-w-6xl"
        style={{ borderColor: 'rgb(var(--surface-line-rgb) / var(--surface-line-strong-alpha))' }}
        animate={reducedMotion ? undefined : { paddingTop: condensed ? 2 : 8, paddingBottom: condensed ? 2 : 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        initial={false}
      >
        <div className={`px-4 sm:px-6 ${reducedMotion ? (condensed ? 'py-0.5' : 'py-2') : ''}`}>
          <div className="flex h-12 items-center justify-between">
            <Link to="/" className="flex items-center">
              <Dumbbell className="h-7 w-7 text-primary-400" />
              <span className="ml-2 font-display text-lg font-semibold text-ink">Fitness Fuel</span>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              <button onClick={onScrollToFeatures} className={navLinkClass}>Features</button>
              {user ? (
                <>
                  <Link to="/dashboard" className="ml-2">
                    <Button size="sm">Dashboard</Button>
                  </Link>
                  <button onClick={onSignOut} className={navLinkClass}>Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => onOpenAuth('signIn')} className={navLinkClass}>Sign In</button>
                  <Button size="sm" className="ml-2" onClick={() => onOpenAuth('signUp')}>Sign Up</Button>
                </>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-white/5 hover:text-ink"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="space-y-1 border-t border-surface-line pb-3 pt-2 md:hidden">
              <button
                onClick={() => { onScrollToFeatures(); setMobileMenuOpen(false); }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-white/5 hover:text-ink"
              >
                Features
              </button>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-ink">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { onSignOut(); setMobileMenuOpen(false); }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-white/5 hover:text-ink"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { onOpenAuth('signIn'); setMobileMenuOpen(false); }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-white/5 hover:text-ink"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { onOpenAuth('signUp'); setMobileMenuOpen(false); }}
                    className="block w-full rounded-lg bg-primary-500/15 px-3 py-2 text-left text-sm font-medium text-primary-300"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default LandingNav;
