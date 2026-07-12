import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'fitnfuel:lastRoute';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari standalone
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Persists the last visited dashboard route and, in the installed PWA,
// restores it when the app is launched at the bare /dashboard start_url.
export function useLastRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (location.pathname !== '/dashboard' || !isStandalone()) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== '/dashboard') navigate(stored, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (location.pathname.startsWith('/dashboard/welcome') || path.includes('autostart=1')) return;
    localStorage.setItem(STORAGE_KEY, path);
  }, [location]);
}
