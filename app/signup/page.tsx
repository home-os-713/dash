'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal" style={{ position: 'static', width: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📬</div>
          <div className="modal-title">Check your email</div>
          <p style={{ fontSize: 13, color: '#888780', marginTop: 8 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <div style={{ marginTop: 16 }}>
            <a href="/login" style={{ color: '#378ADD', fontSize: 13, textDecoration: 'none' }}>Back to sign in</a>
          </div>
        </div>
      </div>
    );
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
          <div className="modal-title" style={{ margin: 0 }}>Create account</div>
        </div>
        <form onSubmit={handleSignup}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <div style={{ fontSize: 13, color: '#a32d2d', marginBottom: 12 }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '9px 0' }}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#888780' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#378ADD', textDecoration: 'none' }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
