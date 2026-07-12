export interface TourStep {
  id: string;
  /** CSS selector for the spotlighted element */
  target: string;
  title: string;
  body: string;
  /** Route the step lives on; the tour navigates there if needed */
  route?: string;
  media: 'desktop' | 'mobile' | 'all';
}

export const TOUR_STORAGE_KEY = 'fitnfuel:tour:v1';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'next-action',
    target: '[data-tour="next-action"]',
    title: 'Your next move',
    body: 'This card always tells you what to do right now — start a workout, log a meal, or drink water. One tap and you are in.',
    route: '/dashboard',
    media: 'all',
  },
  {
    id: 'calorie-ring',
    target: '[data-tour="calorie-ring"]',
    title: 'Calories at a glance',
    body: 'Your daily ring fills as you log food. Macros, water, and streak live right beside it.',
    route: '/dashboard',
    media: 'all',
  },
  {
    id: 'todays-plan',
    target: '[data-tour="todays-plan"]',
    title: "Today's plan",
    body: 'Meals and workout for the day. Check items off as you go — your calories update instantly.',
    route: '/dashboard',
    media: 'all',
  },
  {
    id: 'smart-action',
    target: '[data-tour="smart-action"]',
    title: 'Quick actions',
    body: 'Scan a barcode, start a workout, or log water, weight, and meals from anywhere in the app.',
    media: 'all',
  },
  {
    id: 'search',
    target: '[data-tour="search"]',
    title: 'Jump anywhere',
    body: 'Press ⌘K (or Ctrl K) to search foods, jump to any page, or run quick actions from the keyboard.',
    media: 'desktop',
  },
  {
    id: 'bottom-nav',
    target: '[data-tour="bottom-nav"]',
    title: 'Get around',
    body: 'Today, Nutrition, Training, Health, and You — everything is one tap away.',
    media: 'mobile',
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Get around',
    body: 'Today, Nutrition, Training, and Health are always here. "You" holds profile, devices, and settings.',
    media: 'desktop',
  },
  {
    id: 'profile-menu',
    target: '[data-tour="profile-menu"]',
    title: 'Your profile',
    body: 'Calories left, streak, theme switch, connected devices, and sign-out — all under your avatar.',
    media: 'all',
  },
];
