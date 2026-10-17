import { useEffect, useState } from 'react';
import './App.css';
import AuthPage from './components/AuthPage';
import HealthForm from './components/HealthForm';
import NetworkStatus from './components/NetworkStatus';
import SyncQueueView from './components/SyncQueueView';
import { supabase } from './services/supabaseClient';
import { setupNetworkListeners } from './services/queueManager';

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

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError('');
      setAuthLoading(false);
    });

    supabase.auth.getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (!mounted) return;
        if (error) {
          setAuthError(error.message);
        } else {
          setSession(currentSession);
        }
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Unable to restore authentication session:', error);
        setAuthError('Unable to restore your session. Please try signing in again.');
        setAuthLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    return setupNetworkListeners(() => {
      setRefreshTrigger((prev) => prev + 1);
    });
  }, [session]);

  const handleRecordSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Unable to sign out:', error);
      setAuthError(error.message);
    }
  };

  if (authLoading) {
    return (
      <main className="auth-loading" aria-live="polite">
        <Brand />
        <span>Preparing your workspace…</span>
      </main>
    );
  }

  if (!session) {
    return <AuthPage initialError={authError} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <span className="account-label">{session.user.email}</span>
          <button className="text-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="app-main">
        {authError && <p className="form-message error" role="alert">{authError}</p>}
        <section className="welcome-row" aria-labelledby="welcome-title">
          <div>
            <p className="eyebrow">Community health workspace</p>
            <h1 className="welcome-title" id="welcome-title">Good care, wherever you are.</h1>
            <p className="welcome-copy">Capture visits offline. Your records sync when you’re connected.</p>
          </div>
          <NetworkStatus />
        </section>

        <div className="dashboard-grid">
          <HealthForm onRecordSaved={handleRecordSaved} />
          <SyncQueueView refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <footer className="app-footer">
        AfyaSync · Secure, offline-first community care
      </footer>
    </div>
  );
}
