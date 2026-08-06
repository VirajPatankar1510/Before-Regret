import React, { useState, useEffect } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

interface AdminGateProps {
  children: React.ReactNode;
}

type GateState =
  | { status: 'checking' }
  | { status: 'not_configured' }
  | { status: 'signed_out' }
  | { status: 'signed_in' };

// Wraps every admin screen. The real enforcement is server-side (see src/server/adminAuth.ts and
// the requireAdmin middleware) -- this component is the user-facing half of that, not the security
// boundary itself. Anyone can bypass a client-side check by editing JS, which is exactly why the
// admin APIs verify the session cookie independently on every request.
export const AdminGate: React.FC<AdminGateProps> = ({ children }) => {
  const [gate, setGate] = useState<GateState>({ status: 'checking' });
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.configured) setGate({ status: 'not_configured' });
        else if (data?.signedIn) setGate({ status: 'signed_in' });
        else setGate({ status: 'signed_out' });
      })
      .catch(() => {
        if (!cancelled) setGate({ status: 'signed_out' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data?.success) {
        setPassword('');
        setGate({ status: 'signed_in' });
      } else {
        setError(data?.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (gate.status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (gate.status === 'not_configured') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin isn't set up yet</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            To turn this on, add two settings to your hosting environment and redeploy:
          </p>
          <ul className="text-sm text-slate-300 space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <li>
              <code className="text-blue-300 font-mono text-xs">ADMIN_PASSWORD</code>
              <span className="block text-xs text-slate-500 mt-0.5">The password you'll use to sign in.</span>
            </li>
            <li>
              <code className="text-blue-300 font-mono text-xs">ADMIN_SESSION_SECRET</code>
              <span className="block text-xs text-slate-500 mt-0.5">Any long random string. Keeps your sign-in secure.</span>
            </li>
          </ul>
          <p className="text-xs text-slate-500 leading-relaxed">
            Until both are set, this area stays locked for everyone — including you. That's
            deliberate: a missing setting should never leave the page open.
          </p>
        </div>
      </div>
    );
  }

  if (gate.status === 'signed_out') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5"
        >
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sign in</h1>
              <p className="text-sm text-slate-400 mt-1">This area is private.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="block text-xs font-bold text-slate-300">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
};
