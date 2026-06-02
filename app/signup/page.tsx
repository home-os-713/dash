"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mb-5">
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D8D5CB] bg-white text-[#2B2B28] text-sm font-medium hover:bg-[#FAF9F6] transition-colors disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 h-px bg-[#EAE8E1]" />
        <span className="text-xs text-[#78756E]">or</span>
        <div className="flex-1 h-px bg-[#EAE8E1]" />
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
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

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-[#D8D5CB] bg-white text-[#2B2B28] placeholder-[#8A8780] focus:outline-none focus:ring-2 focus:ring-[#5A6247]/30 focus:border-[#5A6247]/40 transition-shadow";

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl border border-[#EAE8E1] shadow-soft p-8 animate-rise">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2B2B28]">Check your email</h1>
          <p className="text-sm text-[#6E6B64] mt-2">
            We sent a confirmation link to <strong className="text-[#2B2B28]">{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm text-[#5A6247] font-medium hover:text-[#4A5239] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#EAE8E1] shadow-soft p-8 animate-rise">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#5A6247] mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2B2B28]">Create account</h1>
          <p className="text-sm text-[#6E6B64] mt-1">Start tracking your home finances</p>
        </div>

        <GoogleButton />

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#57554F] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#57554F] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputCls}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5A6247] text-white rounded-xl py-2.5 font-medium hover:bg-[#4A5239] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6E6B64] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#5A6247] font-medium hover:text-[#4A5239] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
