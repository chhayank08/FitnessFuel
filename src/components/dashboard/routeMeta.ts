export interface RouteMeta {
  title: string;
  subtitle: string;
}

// Longest-prefix match so /dashboard/exercise/coach beats /dashboard/exercise.
const ROUTE_META: [string, RouteMeta][] = [
  ['/dashboard/exercise/coach', { title: 'Form Coach', subtitle: 'AI-guided workout sessions' }],
  ['/dashboard/welcome', { title: 'Welcome', subtitle: 'Set up your profile' }],
  ['/dashboard/profile', { title: 'Profile', subtitle: 'Your body stats and goals' }],
  ['/dashboard/diet', { title: 'Nutrition', subtitle: 'Log food and track macros' }],
  ['/dashboard/exercise', { title: 'Training', subtitle: 'Workouts and history' }],
  ['/dashboard/progress', { title: 'Health', subtitle: 'Trends and progress' }],
  ['/dashboard/learn', { title: 'Learn', subtitle: 'Evidence-based guidance' }],
  ['/dashboard/devices', { title: 'Devices', subtitle: 'Connected health platforms' }],
  ['/dashboard/settings', { title: 'Settings', subtitle: 'Preferences and account' }],
  ['/dashboard', { title: 'Today', subtitle: 'Your daily overview' }],
];

export function getRouteMeta(pathname: string): RouteMeta {
  const match = ROUTE_META.filter(([prefix]) => pathname.startsWith(prefix)).sort(
    (a, b) => b[0].length - a[0].length
  )[0];
  return match?.[1] ?? { title: 'Today', subtitle: 'Your daily overview' };
}
