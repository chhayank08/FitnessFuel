import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

const LandingFooter: React.FC = () => (
  <footer className="border-t border-surface-line py-10">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
      <Link to="/" className="flex items-center">
        <Dumbbell className="h-6 w-6 text-primary-400" />
        <span className="ml-2 font-display text-sm font-semibold text-ink">Fitness Fuel</span>
      </Link>
      <p className="text-sm text-ink-faint">&copy; {new Date().getFullYear()} Fitness Fuel. All rights reserved.</p>
    </div>
  </footer>
);

export default LandingFooter;
