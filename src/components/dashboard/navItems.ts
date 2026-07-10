import {
  LayoutDashboard,
  HeartPulse,
  Utensils,
  Dumbbell,
  ScanFace,
  Calendar,
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

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Health', path: '/dashboard/progress', icon: HeartPulse },
  { name: 'Nutrition', path: '/dashboard/diet', icon: Utensils },
  { name: 'Training', path: '/dashboard/exercise', icon: Dumbbell },
  { name: 'Form Coach', path: '/dashboard/coach', icon: ScanFace },
  { name: 'Schedule', path: '/dashboard/schedule', icon: Calendar },
  { name: 'Learn', path: '/dashboard/learn', icon: GraduationCap },
  { name: 'Devices', path: '/dashboard/devices', icon: Watch },
  { name: 'Profile', path: '/dashboard/profile', icon: User },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];
