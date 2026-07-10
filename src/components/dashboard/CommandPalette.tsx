import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scale, GlassWater, UtensilsCrossed, LogOut, LucideIcon } from 'lucide-react';
import Modal from '../ui/Modal';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';
import { useDailyLogContext } from '../../context/DailyLogContext';
import { useHotkey } from '../../hooks/useHotkey';

interface Command {
  id: string;
  label: string;
  section: 'Navigate' | 'Quick actions' | 'Account';
  icon: LucideIcon;
  run: () => void;
}

const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { palette, quickAdd } = useDailyLogContext();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useHotkey('k', () => palette.setOpen(!palette.open), { mod: true });

  const commands = useMemo<Command[]>(() => {
    const close = () => palette.setOpen(false);
    return [
      ...NAV_ITEMS.map<Command>((item) => ({
        id: `nav-${item.path}`,
        label: item.name,
        section: 'Navigate',
        icon: item.icon,
        run: () => {
          close();
          navigate(item.path);
        },
      })),
      {
        id: 'quick-weight',
        label: 'Log weight',
        section: 'Quick actions',
        icon: Scale,
        run: () => {
          close();
          quickAdd.openWith('weight');
        },
      },
      {
        id: 'quick-water',
        label: 'Log water',
        section: 'Quick actions',
        icon: GlassWater,
        run: () => {
          close();
          quickAdd.openWith('water');
        },
      },
      {
        id: 'quick-meal',
        label: 'Log a meal',
        section: 'Quick actions',
        icon: UtensilsCrossed,
        run: () => {
          close();
          quickAdd.openWith('meal');
        },
      },
      {
        id: 'sign-out',
        label: 'Sign out',
        section: 'Account',
        icon: LogOut,
        run: () => {
          close();
          signOut();
        },
      },
    ];
  }, [navigate, palette, quickAdd, signOut]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (palette.open) {
      setQuery('');
      setActiveIndex(0);
      // wait for the enter animation to mount the input
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [palette.open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[activeIndex]?.run();
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let lastSection: string | null = null;

  return (
    <Modal open={palette.open} onClose={() => palette.setOpen(false)} align="top" panelClassName="max-w-xl overflow-hidden">
      <div className="flex items-center gap-3 border-b border-surface-line px-4">
        <Search className="h-4 w-4 flex-shrink-0 text-gray-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search pages and actions…"
          className="w-full bg-transparent py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none"
        />
        <kbd className="rounded-md border border-surface-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
          esc
        </kbd>
      </div>

      <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-gray-500">Nothing matches "{query}"</p>
        )}
        {filtered.map((cmd, index) => {
          const showSection = cmd.section !== lastSection;
          lastSection = cmd.section;
          return (
            <React.Fragment key={cmd.id}>
              {showSection && (
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 first:pt-1">
                  {cmd.section}
                </p>
              )}
              <button
                data-index={index}
                onClick={cmd.run}
                onMouseMove={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  index === activeIndex ? 'bg-primary-500/15 text-white' : 'text-gray-300'
                }`}
              >
                <cmd.icon className={`h-4 w-4 ${index === activeIndex ? 'text-primary-300' : 'text-gray-500'}`} />
                {cmd.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </Modal>
  );
};

export default CommandPalette;
