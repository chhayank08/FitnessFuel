import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell, Utensils, BarChart, ScanFace, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeProfile } from '../lib/nutrition';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

type Testimonial = {
  id: number;
  name: string;
  role: string;
  content: string;
  image: string;
};

const FEATURES = [
  {
    title: 'Personalized nutrition, built around you',
    description: 'Calorie and macro targets computed from your body and goal — plus a real food database and barcode scanner.',
    icon: Utensils,
    image:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Training that adapts to your goal',
    description: 'A weekly workout plan and full exercise library, tailored to weight loss, muscle gain, or maintenance.',
    icon: Dumbbell,
    image:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Live form feedback from your webcam',
    description: 'The Form Coach counts reps and scores your form in real time — no extra hardware required.',
    icon: ScanFace,
    image:
      'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Insights, not just data',
    description: 'A composite health score, trend charts, and daily nudges that turn your logs into something useful.',
    icon: BarChart,
    image:
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80',
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah J.',
    role: 'Lost 30 lbs in 6 months',
    content: 'Fitness Fuel completely transformed my approach to health. The personalized meal plans and workout routines made it easy to stay consistent and see real results.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 2,
    name: 'Michael C.',
    role: 'Gained 15 lbs of muscle',
    content: 'As someone who struggled to gain weight, the nutrition guidance was a game-changer. The app helped me track my progress and stay motivated.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 3,
    name: 'Emily R.',
    role: 'Marathon runner',
    content: 'The training plans helped me prepare for my first marathon. The nutrition tips and recovery strategies were essential to my success.',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
  },
];

const navLinkClass = 'px-3 py-2 rounded-lg text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { user, signOut, signIn, signUp, loading, error } = useAuth();
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

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = authMode === 'signIn'
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    if (success) setJustLoggedIn(true);
  };

  const openAuthModal = (mode: 'signIn' | 'signUp') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface-base text-white">
      <nav className="sticky top-0 z-40 border-b border-surface-line bg-surface-base/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center">
              <Dumbbell className="h-7 w-7 text-primary-400" />
              <span className="ml-2 font-display text-lg font-semibold">Fitness Fuel</span>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              <button onClick={scrollToFeatures} className={navLinkClass}>Features</button>
              {user ? (
                <>
                  <Link to="/dashboard" className="ml-2">
                    <Button size="sm">Dashboard</Button>
                  </Link>
                  <button onClick={() => signOut()} className={navLinkClass}>Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuthModal('signIn')} className={navLinkClass}>Sign In</button>
                  <Button size="sm" className="ml-2" onClick={() => openAuthModal('signUp')}>Sign Up</Button>
                </>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-surface-line px-4 pb-4 pt-2 md:hidden">
            <button
              onClick={() => { scrollToFeatures(); setMobileMenuOpen(false); }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Features
            </button>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-white">
                  Dashboard
                </Link>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openAuthModal('signIn'); setMobileMenuOpen(false); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { openAuthModal('signUp'); setMobileMenuOpen(false); }}
                  className="block w-full rounded-lg bg-primary-500/15 px-3 py-2 text-left text-sm font-medium text-primary-300"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div
            className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                  Your health, understood — not just tracked
                </h1>
                <p className="mt-6 text-lg text-gray-400">
                  Fitness Fuel turns your nutrition, training, and recovery into one clear plan — with live form
                  feedback and insights that actually tell you what to do next.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-base font-semibold text-white">Health improvement</h3>
                    <p className="mt-1.5 text-sm text-gray-400">
                      Boost your overall health with customized nutrition and fitness recommendations.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Meal planning</h3>
                    <p className="mt-1.5 text-sm text-gray-400">
                      Easily plan your meals with an intuitive, personalized interface.
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Button size="md" className="px-8 py-3" onClick={() => openAuthModal('signUp')}>
                    Get started free
                  </Button>
                  <button
                    onClick={scrollToFeatures}
                    className="group flex items-center justify-center gap-2 rounded-xl border border-surface-line-strong px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-primary-400/50 hover:text-white"
                  >
                    See how it works
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div
                  className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-primary-gradient opacity-30 blur-2xl"
                  aria-hidden="true"
                />
                <img
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80"
                  alt="Fitness tracking and meal planning"
                  loading="lazy"
                  className="relative rounded-2xl border border-surface-line-strong shadow-elevation-3"
                />
                <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-surface-line-strong bg-surface-2/95 p-4 shadow-card backdrop-blur-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/15 text-success-400">
                    <BarChart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Health Score 87</p>
                    <p className="text-xs text-gray-400">Trending up this week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-surface-line bg-surface-1 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Everything in one place</h2>
              <p className="mt-4 text-gray-400">No more juggling a nutrition app, a workout app, and a notes app.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="card-glass overflow-hidden">
                  <div className="h-36 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Real people, real progress</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className="card-glass p-6">
                  <p className="text-sm text-gray-300">&ldquo;{t.content}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <img
                      src={t.image}
                      alt={t.name}
                      loading="lazy"
                      className="h-10 w-10 rounded-full border border-surface-line-strong object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      <p className="text-xs text-primary-300">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-surface-line bg-primary-gradient py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Ready to build a plan that actually fits you?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Set up your profile in under two minutes and see your personalized targets immediately.
            </p>
            <div className="mt-10">
              <button
                onClick={() => openAuthModal('signUp')}
                className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-gray-100"
              >
                Get started free
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-line py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <Dumbbell className="h-6 w-6 text-primary-400" />
            <span className="ml-2 font-display text-sm font-semibold text-white">Fitness Fuel</span>
          </Link>
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Fitness Fuel. All rights reserved.</p>
        </div>
      </footer>

      <Modal open={authModalOpen} onClose={() => setAuthModalOpen(false)} panelClassName="max-w-md">
        <div className="p-6">
          <h2 className="font-display text-xl font-semibold text-white">
            {authMode === 'signIn' ? 'Sign in' : 'Create your account'}
          </h2>

          {error && (
            <div className="mt-4 rounded-xl border border-secondary-500/30 bg-secondary-500/10 px-3.5 py-2.5 text-sm text-secondary-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {authMode === 'signUp' && (
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-300">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={authMode === 'signIn' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              {authMode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-surface-line" />
            <span className="text-xs text-gray-500">or</span>
            <div className="h-px flex-1 bg-surface-line" />
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {authMode === 'signIn' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          <p className="mt-5 text-center text-sm text-gray-400">
            {authMode === 'signIn' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn')}
              className="ml-1.5 font-medium text-primary-300 hover:text-primary-200"
            >
              {authMode === 'signIn' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default LandingPage;
