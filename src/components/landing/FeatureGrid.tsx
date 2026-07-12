import React from 'react';
import { Dumbbell, Utensils, BarChart, ScanFace } from 'lucide-react';
import Reveal from './Reveal';

const FEATURES = [
  {
    title: 'Personalized nutrition, built around you',
    description: 'Calorie and macro targets computed from your body and goal — plus a real food database and barcode scanner.',
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Training that adapts to your goal',
    description: 'A weekly workout plan and full exercise library, tailored to weight loss, muscle gain, or maintenance.',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Live form feedback from your webcam',
    description: 'The Form Coach counts reps and scores your form in real time — no extra hardware required.',
    icon: ScanFace,
    image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Insights, not just data',
    description: 'A composite health score, trend charts, and daily nudges that turn your logs into something useful.',
    icon: BarChart,
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80',
  },
];

const FeatureGrid: React.FC = () => (
  <section id="features" className="border-t border-surface-line bg-surface-1 py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Everything in one place</h2>
        <p className="mt-4 text-ink-muted">No more juggling a nutrition app, a workout app, and a notes app.</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 0.08}>
            <div className="card-glass group h-full overflow-hidden transition-shadow duration-300 hover:shadow-elevation-3">
              <div className="h-36 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{feature.description}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureGrid;
