import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Traps Tab focus inside the returned container while `active`, and restores
// focus to the previously focused element on deactivate/unmount.
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active: boolean) {
  const containerRef = useRef<T>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement;

    // Content inside AnimatePresence isn't focusable until after first paint.
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container).focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      const prev = previouslyFocused.current;
      if (prev instanceof HTMLElement && document.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
    };
  }, [active]);

  return containerRef;
}
