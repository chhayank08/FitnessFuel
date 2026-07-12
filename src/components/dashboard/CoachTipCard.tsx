import React, { useMemo, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import Card from '../ui/Card';

interface Tip {
  id: string;
  text: string;
}

const TIPS: Tip[] = [
  { id: 'barcode', text: 'You can scan any product barcode from the + button — nutrition facts fill in automatically.' },
  { id: 'palette', text: 'Press ⌘K (or Ctrl K) to jump to any page or action without touching the mouse.' },
  { id: 'form-coach', text: 'The AI Form Coach counts reps and scores your form live using your camera — video never leaves your device.' },
  { id: 'water', text: 'Tap the water card to log a glass in one touch. Hydration feeds your health score.' },
  { id: 'streak', text: 'Check off a meal, workout, or water goal every day to keep your streak alive.' },
  { id: 'swap-meal', text: 'Not feeling a planned meal? Hit the swap icon on any meal card for an alternative with the same macros.' },
];

const STORAGE_KEY = 'fitnfuel:dismissedTips';

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

// Dismissible "did you know" card cycling through undiscovered features.
const CoachTipCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  const tip = useMemo(() => TIPS.find((t) => !dismissed.includes(t.id)) ?? null, [dismissed]);
  if (!tip) return null;

  const dismiss = () => {
    const next = [...dismissed, tip.id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDismissed(next);
  };

  return (
    <Card className={`flex items-start gap-3 p-4 ${className}`}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning-500/15 text-warning-400">
        <Lightbulb className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Did you know?</p>
        <p className="mt-0.5 text-sm text-ink-muted">{tip.text}</p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="rounded-md p-1 text-ink-faint transition-colors hover:bg-white/5 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
};

export default CoachTipCard;
