import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { Search, Dumbbell } from 'lucide-react';
import MobileSidebar from './MobileSidebar';
import NotificationsDropdown from './NotificationsDropdown';
import ProfileMenu from './ProfileMenu';
import SmartActionButton from './SmartActionButton';
import IconButton from '../ui/IconButton';
import { getRouteMeta } from './routeMeta';
import { useDailyLogContext } from '../../context/DailyLogContext';

const DashboardHeader: React.FC = () => {
  const { palette } = useDailyLogContext();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const meta = getRouteMeta(location.pathname);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setCondensed(y > 24));

  // Publish the real header height (incl. env(safe-area-inset-top) padding in
  // standalone PWAs) as --app-header-h so the layout clears it exactly. Only
  // the expanded height is published — the scroll-condense animation must not
  // shift page content.
  const headerRef = useRef<HTMLElement>(null);
  const condensedRef = useRef(condensed);
  condensedRef.current = condensed;
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => {
      if (condensedRef.current) return;
      document.documentElement.style.setProperty('--app-header-h', `${el.getBoundingClientRect().height}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    // Fonts can change the measured height after first paint.
    document.fonts?.ready.then(publish).catch(() => {});
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <motion.div
        className="mx-3 mt-2 rounded-2xl border bg-surface-base/70 shadow-elevation-2 backdrop-blur-xl sm:mx-4"
        style={{ borderColor: 'rgb(var(--surface-line-rgb) / var(--surface-line-strong-alpha))' }}
        animate={reducedMotion ? undefined : { paddingTop: condensed ? 4 : 10, paddingBottom: condensed ? 4 : 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        initial={false}
      >
        <div className={`px-3 sm:px-5 ${reducedMotion ? (condensed ? 'py-1' : 'py-2.5') : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center">
              <div className="-mt-1 md:hidden">
                <MobileSidebar />
              </div>
              <div className="ml-2 flex items-center md:ml-0">
                <Dumbbell className="h-7 w-7 flex-shrink-0 text-primary-400" />
                <span className="ml-2 hidden font-display text-lg font-semibold text-ink lg:block">Fitness Fuel</span>
              </div>
              <div className="ml-3 min-w-0 border-l border-surface-line pl-3 md:ml-4 md:pl-4">
                <h1 className="truncate font-display text-base font-semibold leading-tight text-ink md:text-lg">
                  {meta.title}
                </h1>
                {!condensed && (
                  <p className="hidden truncate text-xs text-ink-faint md:block">{meta.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => palette.setOpen(true)}
                data-tour="search"
                className="hidden w-56 items-center gap-2 rounded-xl border border-surface-line bg-surface-1 px-3.5 py-2 text-sm text-ink-faint transition-colors hover:border-surface-line-strong hover:text-ink-muted md:flex lg:w-64"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search or jump to…</span>
                <kbd className="rounded-md border border-surface-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                  {isMac ? '⌘K' : 'Ctrl K'}
                </kbd>
              </button>

              <IconButton label="Search" className="md:hidden" onClick={() => palette.setOpen(true)}>
                <Search className="h-5 w-5" />
              </IconButton>

              <SmartActionButton variant="header" />

              <NotificationsDropdown />

              <ProfileMenu />
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default DashboardHeader;
