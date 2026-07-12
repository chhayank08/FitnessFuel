import React from 'react';
import Reveal from './Reveal';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah J.',
    role: 'Lost 30 lbs in 6 months',
    content: 'Fitness Fuel completely transformed my approach to health. The personalized meal plans and workout routines made it easy to stay consistent and see real results.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 2,
    name: 'Michael C.',
    role: 'Gained 15 lbs of muscle',
    content: 'As someone who struggled to gain weight, the nutrition guidance was a game-changer. The app helped me track my progress and stay motivated.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 3,
    name: 'Emily R.',
    role: 'Marathon runner',
    content: 'The training plans helped me prepare for my first marathon. The nutrition tips and recovery strategies were essential to my success.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  },
];

const Testimonials: React.FC = () => (
  <section className="border-t border-surface-line bg-surface-1 py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Real people, real progress</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08}>
            <div className="card-glass h-full p-6">
              <p className="text-sm text-ink-muted">&ldquo;{t.content}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <img
                  src={t.image}
                  alt={t.name}
                  loading="lazy"
                  className="h-10 w-10 rounded-full border border-surface-line-strong object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-primary-300">{t.role}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
