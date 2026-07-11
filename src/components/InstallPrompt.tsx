import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import Card from './ui/Card';
import Button from './ui/Button';

const DISMISS_KEY = 'fitnfuel:install-dismissed';

const InstallPrompt: React.FC = () => {
  const { isInstallable, isIOSInstallable, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (dismissed || (!isInstallable && !isIOSInstallable)) return null;

  return (
    <Card className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom)+0.75rem)] left-4 right-4 z-30 flex items-center gap-3 p-4 md:bottom-4 md:left-auto md:right-4 md:w-96">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
        {isIOSInstallable ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">Install FitnessFuel</p>
        <p className="mt-0.5 text-xs text-gray-400">
          {isIOSInstallable
            ? 'Tap Share, then "Add to Home Screen" for quick access.'
            : 'Add it to your home screen for a faster, full-screen experience.'}
        </p>
        {isInstallable && (
          <Button size="sm" className="mt-2.5" onClick={promptInstall}>
            Install
          </Button>
        )}
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="flex-shrink-0 text-gray-500 hover:text-gray-300">
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
};

export default InstallPrompt;
