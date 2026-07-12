import React from 'react';
import { ScanFace, TrendingUp, Flame } from 'lucide-react';
import Reveal from './Reveal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import CalorieRing from '../dashboard/CalorieRing';
import RingGauge from '../ui/RingGauge';

interface Row {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}

const ROWS: Row[] = [
  {
    id: 'nutrition',
    eyebrow: 'Nutrition',
    title: 'Log food in seconds, not minutes',
    body: 'Search a real food database, scan any barcode, or check off meals from your generated plan. Your calorie ring and macros update instantly.',
    visual: (
      <div className="mx-auto w-full max-w-sm">
        <CalorieRing consumed={1450} target={2200} />
      </div>
    ),
  },
  {
    id: 'coach',
    eyebrow: 'AI Form Coach',
    title: 'A trainer that watches your form',
    body: 'Point your camera, start a set, and get live rep counting, form scores, and voice cues. Everything runs on-device — video never leaves your phone.',
    visual: (
      <Card className="mx-auto w-full max-w-sm p-6">
        <div className="flex items-center justify-between">
          <Badge tone="primary" className="px-3 py-1 text-sm capitalize">squat · down</Badge>
          <ScanFace className="h-5 w-5 text-primary-300" />
        </div>
        <div className="mt-5 flex items-center justify-around">
          <div className="text-center">
            <p className="font-display text-4xl font-semibold text-ink tabular-nums">12</p>
            <p className="text-xs text-ink-muted">reps</p>
          </div>
          <RingGauge value={0.92} size={92} colorFrom="#4AE3AC" colorTo="#34D399">
            <span className="font-display text-lg font-semibold text-ink">92</span>
          </RingGauge>
        </div>
        <p className="mt-4 rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-ink-muted">
          "Nice depth — keep your chest up"
        </p>
      </Card>
    ),
  },
  {
    id: 'progress',
    eyebrow: 'Progress',
    title: 'See the trend, not just the number',
    body: 'Weight trends, streaks, and a composite health score built from your sleep, steps, hydration, and training — with projections toward your goal.',
    visual: (
      <Card className="mx-auto w-full max-w-sm p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Health Score</p>
          <Badge tone="success"><Flame className="h-3.5 w-3.5" /> 9-day streak</Badge>
        </div>
        <div className="mt-5 flex items-center justify-center gap-6">
          <RingGauge value={0.87} size={104} colorFrom="#857BFF" colorTo="#6C63FF">
            <span className="font-display text-2xl font-semibold text-ink">87</span>
          </RingGauge>
          <div className="space-y-2 text-sm text-ink-muted">
            <p className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-success-400" /> -0.4 kg this week</p>
            <p>Goal in ~6 weeks</p>
          </div>
        </div>
      </Card>
    ),
  },
];

const ShowcaseSections: React.FC = () => (
  <section className="py-20">
    <div className="mx-auto max-w-6xl space-y-24 px-4 sm:px-6 lg:px-8">
      {ROWS.map((row, i) => (
        <div key={row.id} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <Reveal className={i % 2 === 1 ? 'lg:order-2' : ''}>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-300">{row.eyebrow}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">{row.title}</h3>
            <p className="mt-4 text-ink-muted">{row.body}</p>
          </Reveal>
          <Reveal delay={0.1} className={i % 2 === 1 ? 'lg:order-1' : ''}>
            {row.visual}
          </Reveal>
        </div>
      ))}
    </div>
  </section>
);

export default ShowcaseSections;
