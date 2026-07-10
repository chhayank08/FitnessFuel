import { localDateString, daysAgo } from './dates';

export interface DemoMetric {
  log_date: string;
  metric_type: string;
  value: number;
}

// mulberry32 seeded from a string — deterministic per (user, date), so demo
// data survives reloads and re-syncs without jumping around.
function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 90 days of plausible wearable data with weekly rhythm and slow trends.
export function generateDemoMetrics(userId: string, days = 90): DemoMetric[] {
  const metrics: DemoMetric[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgo(i);
    const dateStr = localDateString(date);
    const rand = mulberry32(hashString(`${userId}:${dateStr}`));
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const progress = (days - 1 - i) / (days - 1); // 0 → 1 over the window

    const steps = Math.round((isWeekend ? 7500 : 9200) + (rand() - 0.4) * 5200 + progress * 900);
    const distance = Math.round(steps * 0.75); // ~0.75 m per step
    const sleep = Math.round(415 + (rand() - 0.5) * 95 + (isWeekend ? 35 : 0));
    const restingHr = Math.round(62 - progress * 4 + (rand() - 0.5) * 4);
    const avgHr = Math.round(restingHr + 16 + rand() * 12);
    const burned = Math.round(2150 + steps * 0.04 + (rand() - 0.5) * 180);

    metrics.push(
      { log_date: dateStr, metric_type: 'steps', value: Math.max(steps, 1200) },
      { log_date: dateStr, metric_type: 'distance_m', value: Math.max(distance, 900) },
      { log_date: dateStr, metric_type: 'sleep_minutes', value: Math.max(sleep, 300) },
      { log_date: dateStr, metric_type: 'heart_rate_resting', value: restingHr },
      { log_date: dateStr, metric_type: 'heart_rate_avg', value: avgHr },
      { log_date: dateStr, metric_type: 'calories_burned', value: burned }
    );

    // body composition: weekly smart-scale weigh-in (Withings-style)
    if (date.getDay() === 1) {
      metrics.push(
        { log_date: dateStr, metric_type: 'body_fat_pct', value: parseFloat((24.5 - progress * 1.8 + (rand() - 0.5) * 0.6).toFixed(1)) },
        { log_date: dateStr, metric_type: 'muscle_mass_kg', value: parseFloat((33.2 + progress * 1.1 + (rand() - 0.5) * 0.4).toFixed(1)) },
        { log_date: dateStr, metric_type: 'bp_systolic', value: Math.round(121 - progress * 3 + (rand() - 0.5) * 6) },
        { log_date: dateStr, metric_type: 'bp_diastolic', value: Math.round(79 - progress * 2 + (rand() - 0.5) * 4) }
      );
    }
  }

  return metrics;
}
