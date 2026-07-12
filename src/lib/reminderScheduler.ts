// Client-scheduled reminders (workout / water / meals) driven by
// setTimeout, routed through the service worker's showNotification so
// behavior is consistent with push notifications (same OS notification
// tray/style) rather than the page's own `new Notification()`.
//
// HONEST SCOPE: this only fires while a tab or the SW's event loop is alive
// — browsers suspend/terminate idle service workers, and there is no
// background-alarm API for regular web apps. These reminders work while
// FitnFuel is open or recently backgrounded; they are NOT guaranteed once
// the app is fully closed or the phone has been locked for a long time.
// Reliable "closed app" delivery needs Web Push + a server-side scheduled
// trigger (not built in this pass — see plan notes).

import type { AppSettings } from '../hooks/useSettings';
import { getPermission } from './notificationPermission';

type ReminderKind = 'workout' | 'water' | 'meal';

interface ScheduledReminder {
  kind: ReminderKind;
  timerId: ReturnType<typeof setTimeout>;
}

let active: ScheduledReminder[] = [];

function parseTimeToday(hhmm: string, from: Date = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(from);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Next occurrence of a daily HH:MM time, today if still ahead, else tomorrow. */
function nextDaily(hhmm: string, from: Date = new Date()): Date {
  const candidate = parseTimeToday(hhmm, from);
  if (candidate.getTime() <= from.getTime()) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

/** Next water reminder: repeats every N hours within [start, end], daily. */
function nextWaterReminder(settings: AppSettings['reminders'], from: Date = new Date()): Date | null {
  if (!settings.waterEnabled || settings.waterIntervalHours <= 0) return null;
  const start = parseTimeToday(settings.waterStart, from);
  const end = parseTimeToday(settings.waterEnd, from);
  if (end <= start) return null;

  const intervalMs = settings.waterIntervalHours * 60 * 60 * 1000;
  let candidate = new Date(start);
  while (candidate.getTime() <= from.getTime()) {
    candidate = new Date(candidate.getTime() + intervalMs);
    if (candidate > end) {
      // Roll to tomorrow's window start.
      candidate = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      break;
    }
  }
  return candidate;
}

/** Pure: computes the next fire Date for each enabled reminder kind. */
export function computeNextFireTimes(settings: AppSettings['reminders'], from: Date = new Date()) {
  const result: { workout?: Date; water?: Date; meals: Date[] } = { meals: [] };
  if (settings.workoutEnabled) result.workout = nextDaily(settings.workoutTime, from);
  const water = nextWaterReminder(settings, from);
  if (water) result.water = water;
  if (settings.mealEnabled) {
    result.meals = settings.mealTimes.map((t) => nextDaily(t, from)).sort((a, b) => a.getTime() - b.getTime());
  }
  return result;
}

const COPY: Record<ReminderKind, { title: string; body: string }> = {
  workout: { title: 'Time to train', body: "It's your scheduled workout time — let's get moving." },
  water: { title: 'Hydration check', body: 'Grab a glass of water to stay on track.' },
  meal: { title: 'Meal time', body: "Don't forget to log your meal." },
};

async function fire(kind: ReminderKind) {
  if (getPermission() !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const { title, body } = COPY[kind];
  reg.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: `reminder-${kind}` });
}

function clearAll() {
  active.forEach((r) => clearTimeout(r.timerId));
  active = [];
}

/**
 * (Re)derives and schedules all enabled reminders from current settings.
 * Safe to call repeatedly (e.g. on settings change or tab visibility change)
 * — always clears prior timers first. Caps each setTimeout at ~24h so a
 * backgrounded tab doesn't accumulate one enormous drifted delay.
 */
export function scheduleReminders(settings: AppSettings['reminders']) {
  clearAll();
  if (getPermission() !== 'granted') return;

  const now = new Date();
  const { workout, water, meals } = computeNextFireTimes(settings, now);
  const MAX_DELAY_MS = 23 * 60 * 60 * 1000; // re-derive at least once a day to avoid clock-drift on long delays

  const schedule = (kind: ReminderKind, at: Date | undefined) => {
    if (!at) return;
    const delay = Math.min(at.getTime() - now.getTime(), MAX_DELAY_MS);
    if (delay <= 0) return;
    const timerId = setTimeout(() => {
      fire(kind);
      scheduleReminders(settings); // re-derive the next occurrence
    }, delay);
    active.push({ kind, timerId });
  };

  schedule('workout', workout);
  schedule('water', water);
  meals.forEach((m) => schedule('meal', m));
}

export function stopReminders() {
  clearAll();
}
