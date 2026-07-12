import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { hapticMedium } from '../lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}

const THRESHOLD = 64;
const MAX_PULL = 90;
const RESISTANCE = 0.4;

// Touch-only pull-to-refresh for the dashboard main area. Non-passive
// touchmove so we can preventDefault only while actively pulling.
//
// The pull distance is written straight to the DOM via refs inside a single
// coalesced rAF — no React state updates during the gesture, so the routed
// page never re-renders while the user drags.
const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spinnerBoxRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const rafRef = useRef<number>();

  const applyPull = useCallback((px: number, animate: boolean) => {
    const box = spinnerBoxRef.current;
    const icon = iconRef.current;
    if (!box || !icon) return;
    box.style.transition = animate ? 'height 150ms ease-out' : 'none';
    box.style.height = `${px}px`;
    if (!refreshingRef.current) {
      icon.style.transform = `rotate(${(px / MAX_PULL) * 360}deg)`;
      icon.style.opacity = `${Math.min(px / THRESHOLD, 1)}`;
    }
    box.setAttribute('aria-hidden', String(px === 0 && !refreshingRef.current));
  }, []);

  const schedulePull = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      applyPull(pullRef.current, false);
    });
  }, [applyPull]);

  useEffect(() => {
    // Desktop pointers get browser-native scrolling; skip entirely.
    if (window.matchMedia('(pointer: fine)').matches) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        schedulePull();
        return;
      }
      e.preventDefault();
      pullRef.current = Math.min(dy * RESISTANCE, MAX_PULL);
      schedulePull();
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        applyPull(THRESHOLD, true);
        hapticMedium();
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          pullRef.current = 0;
          applyPull(0, true);
        }
      } else {
        pullRef.current = 0;
        applyPull(0, true);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onRefresh, applyPull, schedulePull]);

  return (
    <div ref={containerRef}>
      <div
        ref={spinnerBoxRef}
        aria-hidden
        className="pointer-events-none flex justify-center overflow-hidden"
        style={{ height: 0 }}
      >
        <RefreshCw
          ref={iconRef}
          className={`mt-3 h-6 w-6 text-primary-400 ${refreshing ? 'animate-spin' : ''}`}
          style={{ opacity: 0 }}
        />
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
