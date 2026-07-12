import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  User,
  TrendingUp,
  Bell,
  Settings,
  Watch,
  LogOut,
  Moon,
  Sun,
  Flame,
  Target,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { useThemeContext } from '../../context/ThemeContext';
import { hapticLight, hapticSelection } from '../../lib/haptics';

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Losing weight',
  weight_gain: 'Gaining weight',
  muscle_gain: 'Building muscle',
  maintain: 'Maintaining',
};

interface MenuItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Profile', icon: User, to: '/dashboard/profile' },
  { label: 'Progress & achievements', icon: TrendingUp, to: '/dashboard/progress' },
  { label: 'Notifications', icon: Bell, to: '/dashboard/settings' },
  { label: 'Connected devices', icon: Watch, to: '/dashboard/devices' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
];

const ProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { user, signOut } = useAuth();
  const { profile, dailyLog, streak, insights } = useDailyLogContext();
  const { theme, toggleTheme } = useThemeContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const goal = insights.nutritionProfile?.goal;
  const caloriesRemaining = Math.max(
    (insights.targets?.dailyCalories ?? 0) - dailyLog.consumed.calories,
    0
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  const openWithDelay = () => {
    if (isTouch) return;
    hoverTimer.current = setTimeout(() => setOpen(true), 150);
  };
  const cancelDelay = () => clearTimeout(hoverTimer.current);

  const go = (to: string) => {
    hapticLight();
    setOpen(false);
    navigate(to);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openWithDelay}
      onMouseLeave={cancelDelay}
      data-tour="profile-menu"
    >
      <button
        ref={triggerRef}
        onClick={() => {
          hapticSelection();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        className="tap-target flex items-center justify-center rounded-full"
      >
        <motion.div
          whileTap={reducedMotion ? undefined : { scale: 0.92 }}
          whileHover={reducedMotion ? undefined : { scale: 1.06 }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-gradient text-sm font-semibold text-white shadow-glow-primary ring-2 ring-transparent transition-shadow hover:ring-primary-400/40"
        >
          {displayName.charAt(0).toUpperCase()}
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Profile"
            className="absolute right-0 top-12 z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-surface-line-strong bg-surface-3 shadow-elevation-3"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Identity + today snapshot */}
            <div className="bg-hero-gradient border-b border-surface-line px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient text-base font-semibold text-white shadow-glow-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                  {goal && (
                    <p className="flex items-center gap-1 text-xs text-ink-muted">
                      <Target className="h-3 w-3" />
                      {GOAL_LABELS[goal] ?? goal}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-4">
                <div>
                  <p className="text-xs text-ink-faint">Calories left</p>
                  <p className="text-sm font-semibold text-ink tabular-nums">{caloriesRemaining.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-faint">Streak</p>
                  <p className="flex items-center gap-1 text-sm font-semibold text-ink tabular-nums">
                    <Flame className="h-3.5 w-3.5 text-success-400" />
                    {streak.current} days
                  </p>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => go(item.to)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
              ))}

              <button
                role="menuitem"
                onClick={() => {
                  hapticLight();
                  toggleTheme();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
                {theme === 'dark' ? 'Light theme' : 'Dark theme'}
              </button>

              <div className="mx-3 my-1.5 border-t border-surface-line" />

              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-secondary-400 transition-colors hover:bg-secondary-500/10"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
