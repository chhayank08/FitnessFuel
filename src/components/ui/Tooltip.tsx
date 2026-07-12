import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  delayMs?: number;
}

// Lightweight hover/focus tooltip — portals to body, flips above/below by
// available space. Wrap a single focusable child.
const Tooltip: React.FC<TooltipProps> = ({ content, children, delayMs = 400 }) => {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = rect.top < 56;
      setPos({
        top: below ? rect.bottom + 8 : rect.top - 8,
        left: rect.left + rect.width / 2,
        below,
      });
    }, delayMs);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setPos(null);
  };

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={pos ? id : undefined}
        className="inline-flex"
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="pointer-events-none fixed z-[60] max-w-56 -translate-x-1/2 rounded-lg border border-surface-line-strong bg-surface-3 px-2.5 py-1.5 text-xs text-ink shadow-elevation-2"
            style={{
              top: pos.top,
              left: pos.left,
              transform: `translateX(-50%) ${pos.below ? '' : 'translateY(-100%)'}`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
