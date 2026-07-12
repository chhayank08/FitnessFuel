import React, { useState } from 'react';
import { Search, ScanBarcode } from 'lucide-react';
import Button from '../ui/Button';
import { hapticLight } from '../../lib/haptics';

interface LogFoodBarProps {
  onSearch: (query: string) => void;
  onScan: () => void;
  className?: string;
}

// Prominent food-logging entry point at the top of the Nutrition Today tab.
// Submitting hands off to the Food Search tab; Scan opens the barcode scanner.
const LogFoodBar: React.FC<LogFoodBarProps> = ({ onSearch, onScan, className = '' }) => {
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    hapticLight();
    onSearch(query.trim());
  };

  return (
    <div className={`card-glass-strong bg-hero-gradient p-4 sm:p-5 ${className}`} data-tour="log-food">
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods — grilled chicken, oats, greek yogurt…"
            aria-label="Search foods to log"
            className="w-full rounded-xl border border-surface-line-strong bg-surface-2 py-3 pl-11 pr-4 text-base text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button type="submit" className="hidden sm:inline-flex">Search</Button>
        <Button
          type="button"
          variant="subtle"
          onClick={() => {
            hapticLight();
            onScan();
          }}
        >
          <ScanBarcode className="h-5 w-5 sm:mr-1.5" />
          <span className="hidden sm:inline">Scan barcode</span>
        </Button>
      </form>
    </div>
  );
};

export default LogFoodBar;
