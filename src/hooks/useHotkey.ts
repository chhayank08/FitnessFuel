import { useEffect } from 'react';

// Subscribes to a window-level key combo. `mod` means Cmd on macOS / Ctrl elsewhere.
export function useHotkey(key: string, handler: () => void, { mod = false }: { mod?: boolean } = {}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (mod && !(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement;
      if (!mod && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, mod]);
}
