import React, { useEffect, useRef, useState } from 'react';
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
const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

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
        setPull(0);
        return;
      }
      e.preventDefault();
      const next = Math.min(dy * RESISTANCE, MAX_PULL);
      pullRef.current = next;
      setPull(next);
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        hapticMedium();
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  return (
    <div ref={containerRef}>
      <div
        aria-hidden={pull === 0 && !refreshing}
        className="pointer-events-none flex justify-center overflow-hidden transition-[height]"
        style={{ height: pull }}
      >
        <RefreshCw
          className={`mt-3 h-6 w-6 text-primary-400 ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${(pull / MAX_PULL) * 360}deg)`, opacity: pull / THRESHOLD }}
        />
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
