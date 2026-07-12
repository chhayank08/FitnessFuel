import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export type AuthMode = 'signIn' | 'signUp';

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  'w-full rounded-xl border border-surface-line-strong bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500';

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onModeChange, onClose, onSuccess }) => {
  const { signIn, signUp, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password, fullName);
    if (success) onSuccess();
  };

  return (
    <Modal open={open} onClose={onClose} panelClassName="max-w-md" ariaLabel={mode === 'signIn' ? 'Sign in' : 'Create your account'}>
      <div className="p-6">
        <h2 className="font-display text-xl font-semibold text-ink">
          {mode === 'signIn' ? 'Sign in' : 'Create your account'}
        </h2>

        {error && (
          <div className="mt-4 rounded-xl border border-secondary-500/30 bg-secondary-500/10 px-3.5 py-2.5 text-sm text-secondary-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'signUp' && (
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink-muted">Full name</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-muted">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-muted">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            {mode === 'signIn' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-surface-line" />
          <span className="text-xs text-ink-faint">or</span>
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
          {mode === 'signIn' ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        <p className="mt-5 text-center text-sm text-ink-muted">
          {mode === 'signIn' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => onModeChange(mode === 'signIn' ? 'signUp' : 'signIn')}
            className="ml-1.5 font-medium text-primary-300 hover:text-primary-200"
          >
            {mode === 'signIn' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </Modal>
  );
};

export default AuthModal;
