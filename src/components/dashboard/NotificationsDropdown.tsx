import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IconButton from '../ui/IconButton';
import { useDailyLogContext } from '../../context/DailyLogContext';

const TONE_STYLES: Record<string, string> = {
  primary: 'bg-primary-500/15 text-primary-300',
  success: 'bg-success-500/15 text-success-400',
  alert: 'bg-secondary-500/15 text-secondary-400',
};

const NotificationsDropdown: React.FC = () => {
  const { notifications } = useDailyLogContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton label="Notifications" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute right-2 top-2 block h-2 w-2 animate-pulse-dot rounded-full bg-secondary-500" />
        )}
      </IconButton>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-surface-line-strong bg-surface-3 shadow-card"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="border-b border-surface-line px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <CheckCircle2 className="mb-2 h-6 w-6 text-success-400" />
                <p className="text-sm text-gray-400">All caught up</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${TONE_STYLES[n.tone]}`}>
                      <n.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{n.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
