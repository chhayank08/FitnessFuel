import {
  LayoutDashboard,
  HeartPulse,
  Utensils,
  Dumbbell,
  ScanFace,
  GraduationCap,
  Watch,
  User,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

// The 5 daily-driver pillars — primary navigation on both mobile (bottom tab
// bar) and desktop (sidebar).
export const PILLAR_ITEMS: NavItem[] = [
  { name: 'Today', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Nutrition', path: '/dashboard/diet', icon: Utensils },
  { name: 'Training', path: '/dashboard/exercise', icon: Dumbbell },
  { name: 'Health', path: '/dashboard/progress', icon: HeartPulse },
  { name: 'You', path: '/dashboard/profile', icon: User },
];

// Lower-frequency destinations, grouped under "You" — reachable via the
// desktop sidebar's expandable group, the You pillar's in-page tabs on
// mobile, and the command palette.
export const SECONDARY_ITEMS: NavItem[] = [
  { name: 'Profile', path: '/dashboard/profile', icon: User },
  { name: 'Devices', path: '/dashboard/devices', icon: Watch },
  { name: 'Learn', path: '/dashboard/learn', icon: GraduationCap },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

// Not a top-level pillar — surfaced as a CTA within Training instead.
export const COACH_ITEM: NavItem = { name: 'Form Coach', path: '/dashboard/exercise/coach', icon: ScanFace };
