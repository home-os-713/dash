'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={handleGoogle}
        disabled={loading}
        style={{
          width: '100%',
          padding: '9px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          border: '0.5px solid rgba(0,0,0,0.2)',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: '#1a1a18',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Redirecting…' : 'Continue with Google'}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px' }}>
        <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.12)' }} />
        <span style={{ fontSize: 12, color: '#888780' }}>or</span>
        <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.12)' }} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ position: 'static', width: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
          <div className="prop-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="modal-title" style={{ margin: 0 }}>Homeowner Dashboard</div>
        </div>
        <GoogleButton />
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ fontSize: 13, color: '#a32d2d', marginBottom: 12 }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '9px 0' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#888780' }}>
          No account?{' '}
          <a href="/signup" style={{ color: '#378ADD', textDecoration: 'none' }}>Sign up</a>
        </div>
      </div>
    </div>
  );
}
