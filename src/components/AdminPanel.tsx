import React, { useState } from 'react';
import { Shield, ShieldAlert, Key, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: (status: boolean) => void;
}

export default function AdminPanel({ isAdmin, onToggleAdmin }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'BR1510') {
      onToggleAdmin(true);
      setError(false);
      setPassword('');
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  const handleDeauthorize = () => {
    onToggleAdmin(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Small link style trigger - no longer sticky or floating */}
      <button
        onClick={() => setIsOpen(true)}
        className={`hover:underline text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 ${
          isAdmin
            ? 'text-[#F4B942] animate-pulse font-extrabold'
            : 'text-zinc-500 hover:text-white'
        }`}
        title="Toggle Platform Admin Console"
      >
        <Shield className="h-3.5 w-3.5" />
        <span>{isAdmin ? 'Admin: Active' : 'Admin Console'}</span>
      </button>

      {/* Center Backdrop Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <div className="w-80 rounded-2xl border border-[#30363D] bg-[#161B22] p-4.5 shadow-2xl backdrop-blur-md animate-mdWave relative">
            <div className="flex items-center justify-between border-b border-[#30363D]/60 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <ShieldAlert className="h-4 w-4 text-[#F4B942]" />
                ) : (
                  <Shield className="h-4 w-4 text-[#AAB2C0]" />
                )}
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Platform Administration
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white text-xs font-semibold px-1 py-0.5 rounded transition-colors"
              >
                Close
              </button>
            </div>

            {isAdmin ? (
              <div className="space-y-3.5 text-xs">
                <div className="rounded-xl border border-[#F4B942]/30 bg-[#F4B942]/5 p-3 text-zinc-300 space-y-1.5 font-sans">
                  <div className="flex items-center gap-1 text-[#F4B942] font-extrabold uppercase text-[10px]">
                    <CheckCircle className="h-3.5 w-3.5" /> Authorization Granted
                  </div>
                  <p className="leading-relaxed font-mono text-[10.5px]">
                    Master override is **active**. Direct editing and item excision/deletion triggers are now injected inline on:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] font-mono text-zinc-400">
                    <li>User Story Posts</li>
                    <li>Jury Opinions & Arguments</li>
                    <li>Survival Q&A Answers</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleDeauthorize}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 py-2 font-bold transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" /> Exit Admin Mode
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-sans">
                <p className="text-[#AAB2C0] leading-relaxed text-[11px]">
                  Access the master back-office database override console to curate and regulate user-submitted relationship logs.
                </p>

                <form onSubmit={handleAuthorize} className="space-y-2.5">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Key className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                    <input
                      type="password"
                      placeholder="Enter Master Password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-[#4F8CFF] focus:outline-none"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-1 text-[#FF5D5D] text-[11px] font-semibold animate-shake">
                      <AlertTriangle className="h-3.5 w-3.5" /> Secret key invalid
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#4F8CFF] hover:bg-indigo-600 text-white py-2 font-bold shadow-lg shadow-indigo-600/10 transition-colors"
                  >
                    Authorize Console
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
