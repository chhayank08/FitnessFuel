import React from 'react';
import Reveal from './Reveal';

const CTABand: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => (
  <section className="border-t border-surface-line bg-primary-gradient py-20">
    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Ready to build a plan that actually fits you?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          Set up your profile in under two minutes and see your personalized targets immediately.
        </p>
        <div className="mt-10">
          <button
            onClick={onGetStarted}
            className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-primary-700 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started free
          </button>
        </div>
      </Reveal>
    </div>
  </section>
);

export default CTABand;
