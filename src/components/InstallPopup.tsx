import React, { useState } from 'react';
import { Download, Share2, X, BellRing } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

const DISMISS_KEY = 'fitnfuel:install-popup-dismissed-until';
const DISMISS_DAYS = 14;

function isDismissedWithinWindow(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() < until;
}

// Shown once right after a real login (AuthContext.justLoggedIn), not on
// every page load — replaces the old persistent bottom-banner InstallPrompt.
// Framed around reminders, since notifications require the app be installed
// on iOS Safari.
const InstallPopup: React.FC = () => {
  const { justLoggedIn } = useAuth();
  const { isInstalled, isInstallable, isIOSInstallable, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    setDismissed(true);
  };

  const open =
    justLoggedIn &&
    !dismissed &&
    !isInstalled &&
    (isInstallable || isIOSInstallable) &&
    !isDismissedWithinWindow();

  return (
    <Modal open={open} onClose={dismiss} ariaLabel="Install FitnessFuel" panelClassName="max-w-sm">
      <div className="p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
          <BellRing className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-white">Add FitnessFuel to your home screen</h2>
        <p className="mt-1.5 text-sm text-gray-400">
          {isIOSInstallable
            ? 'Install the app to get workout, water, and meal reminders — Safari can\'t send notifications from a browser tab.'
            : 'Install the app for a faster, full-screen experience and reminder notifications.'}
        </p>

        {isIOSInstallable ? (
          <ol className="mt-4 space-y-2 rounded-xl bg-surface-2 p-3.5 text-left text-sm text-gray-300">
            <li className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">1</span>
              Tap <Share2 className="mx-1 inline h-4 w-4" /> Share in Safari's toolbar
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">2</span>
              Choose "Add to Home Screen"
            </li>
          </ol>
        ) : (
          <Button className="mt-4 w-full" onClick={() => { promptInstall(); dismiss(); }}>
            <Download className="mr-1.5 h-4 w-4" />
            Install FitnessFuel
          </Button>
        )}

        <button onClick={dismiss} className="mt-3 text-xs text-gray-500 hover:text-gray-300">
          Not now
        </button>
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="absolute right-3 top-3 text-gray-500 hover:text-gray-300">
        <X className="h-4 w-4" />
      </button>
    </Modal>
  );
};

export default InstallPopup;
