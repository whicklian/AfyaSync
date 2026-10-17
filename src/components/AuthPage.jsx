import { useState } from 'react';
import { supabase } from '../services/supabaseClient';

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M17.5 6.5 6.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      </svg>
    </span>
  );
}

function Brand({ className = '' }) {
  return (
    <a className={`brand ${className}`.trim()} href="/" aria-label="AfyaSync home">
      <BrandMark />
      <span>AfyaSync</span>
    </a>
  );
}

export default function AuthPage({ initialError = '' }) {
  const [mode, setMode] = useState('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState(initialError ? { type: 'error', text: initialError } : null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'sign_up';
  const isReset = mode === 'reset';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage({ type: 'success', text: 'If an account exists for this email, a password reset link is on its way.' });
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage({ type: 'success', text: 'Account created. Check your email to confirm your address, then sign in.' });
          setMode('sign_in');
          setPassword('');
          return;
        }
        setMessage({ type: 'success', text: 'Your account is ready. Opening your workspace…' });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Authentication request failed:', error);
      setMessage({ type: 'error', text: error.message || 'We could not complete that request. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="About AfyaSync">
        <Brand />
        <div className="story-content">
          <p className="story-kicker">Care that keeps moving</p>
          <h1 className="story-title">Better care.<br /><em>Even offline.</em></h1>
          <p className="story-description">
            Keep every community visit close at hand. AfyaSync helps frontline teams
            capture health records securely, even when the network drops.
          </p>
          <div className="story-points">
            <div className="story-point"><span className="story-check" aria-hidden="true">✓</span> Save visits securely on your device</div>
            <div className="story-point"><span className="story-check" aria-hidden="true">✓</span> Sync automatically when you reconnect</div>
            <div className="story-point"><span className="story-check" aria-hidden="true">✓</span> Keep your community care in one place</div>
          </div>
        </div>
        <p className="story-footer">Made for the people who care for their communities.</p>
      </section>

      <section className="auth-side" aria-labelledby="auth-title">
        <div className="auth-card">
          <Brand className="mobile-auth-brand" />
          <p className="eyebrow">{isReset ? 'Account recovery' : 'Your care workspace'}</p>
          <h2 className="auth-heading" id="auth-title">
            {isReset ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="auth-subheading">
            {isReset
              ? 'Enter your email and we’ll send you a secure reset link.'
              : isSignUp
                ? 'Set up your account to securely manage community visits.'
                : 'Sign in to continue caring for your community.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  className="field-input"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
            )}
            <label className="field">
              <span className="field-label">Email address</span>
              <input
                className="field-input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {!isReset && (
              <label className="field">
                <span className="field-label">Password</span>
                <input
                  className="field-input"
                  type="password"
                  name="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            )}
            {!isSignUp && !isReset && (
              <div className="auth-forgot">
                <button className="link-button" type="button" onClick={() => switchMode('reset')}>
                  Forgot password?
                </button>
              </div>
            )}
            {message && (
              <p className={`form-message ${message.type === 'error' ? 'error' : ''}`} role="status">
                {message.text}
              </p>
            )}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting
                ? 'Please wait…'
                : isReset
                  ? 'Send reset link'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {isReset ? (
              <>
                Remember your password?{' '}
                <button className="link-button" type="button" onClick={() => switchMode('sign_in')}>Back to sign in</button>
              </>
            ) : isSignUp ? (
              <>
                Already have an account?{' '}
                <button className="link-button" type="button" onClick={() => switchMode('sign_in')}>Sign in</button>
              </>
            ) : (
              <>
                New to AfyaSync?{' '}
                <button className="link-button" type="button" onClick={() => switchMode('sign_up')}>Create an account</button>
              </>
            )}
          </p>
          <p className="auth-legal">
            By continuing, you agree to protect patient information and use AfyaSync
            in accordance with your organization’s privacy policies.
          </p>
        </div>
      </section>
    </main>
  );
}
