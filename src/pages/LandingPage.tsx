import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeProfile } from '../lib/nutrition';
import { supabase } from '../lib/supabase';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import FeatureGrid from '../components/landing/FeatureGrid';
import ShowcaseSections from '../components/landing/ShowcaseSections';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import CTABand from '../components/landing/CTABand';
import LandingFooter from '../components/landing/LandingFooter';
import AuthModal, { AuthMode } from '../components/landing/AuthModal';

const LandingPage: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signUp');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (!user || !justLoggedIn) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const complete = normalizeProfile(data) != null;
      navigate(complete ? '/dashboard' : '/dashboard/welcome', { replace: true });
    })();
  }, [user, justLoggedIn, navigate]);

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <LandingNav
        user={user}
        onOpenAuth={openAuthModal}
        onSignOut={() => signOut()}
        onScrollToFeatures={scrollToFeatures}
      />

      <main className="pt-16">
        <Hero onGetStarted={() => openAuthModal('signUp')} onScrollToFeatures={scrollToFeatures} />
        <FeatureGrid />
        <ShowcaseSections />
        <Testimonials />
        <FAQ />
        <CTABand onGetStarted={() => openAuthModal('signUp')} />
      </main>

      <LandingFooter />

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setJustLoggedIn(true)}
      />
    </div>
  );
};

export default LandingPage;
