import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Key, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw
} from 'lucide-react';
import { PRESEEDED_RELATIONSHIP_PROBLEMS, RelationshipProblem } from '../data/relationshipProblems';
import { fetchRelationshipProblemsFromFirestore, saveRelationshipProblemsToFirestore } from '../lib/firestoreService';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: (status: boolean) => void;
}

export default function AdminPanel({ isAdmin, onToggleAdmin }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Sync state and dynamic dictionary lists
  const [isSyncing, setIsSyncing] = useState(false);
  const [problems, setProblems] = useState<RelationshipProblem[]>(PRESEEDED_RELATIONSHIP_PROBLEMS);

  useEffect(() => {
    fetchRelationshipProblemsFromFirestore().then(list => {
      if (list && list.length > 0) {
        setProblems(list);
      }
    }).catch(err => {
      console.error("Failed to load custom relationship problems in admin:", err);
    });
  }, []);

  const handleSyncKeywords = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-relationship-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        throw new Error("HTTP response status error: " + res.status);
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server did not return JSON. Is it starting up?");
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.list)) {
        await saveRelationshipProblemsToFirestore(data.list);
        setProblems(data.list);
        alert(`Successfully synchronized ${data.list.length} relationship categories with latest trending search terms/phrases using Gemini API!`);
      } else {
        throw new Error(data.error || "Missing list array in response");
      }
    } catch (e: any) {
      console.error("Gemini keyword generation failed: ", e);
      alert("Failed to fetch trending relationship keywords: " + (e.message || e));
    } finally {
      setIsSyncing(false);
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className={`rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-2xl backdrop-blur-md transition-all duration-300 relative max-h-[85vh] overflow-y-auto scrollbar-thin ${
            isAdmin ? 'w-full max-w-lg' : 'w-80'
          }`}>
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
                className="text-zinc-500 hover:text-white text-xs font-semibold px-1 py-0.5 rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {isAdmin ? (
              <div className="space-y-4 text-xs text-left">
                <div className="rounded-xl border border-[#F4B942]/30 bg-[#F4B942]/5 p-3 text-zinc-300 space-y-1.5 font-sans">
                  <div className="flex items-center gap-1 text-[#F4B942] font-extrabold uppercase text-[10px]">
                    <CheckCircle className="h-3.5 w-3.5" /> Authorization Granted
                  </div>
                  <p className="leading-relaxed font-mono text-[10.5px]">
                    Master override is **active**. Direct editing and item excision/deletion triggers are now injected inline on users' relationship logs.
                  </p>
                </div>



                {/* SEARCH KEYWORDS DICTIONARY WIDGET */}
                <div className="border border-[#30363D] bg-[#0D1117] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#4F8CFF] uppercase text-[9px] tracking-wider block">
                      Keywords Dictionary
                    </span>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleSyncKeywords}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#4F8CFF]/15 hover:bg-[#4F8CFF]/25 text-[#4F8CFF] text-[9.5px] font-bold border border-[#4F8CFF]/20 cursor-pointer disabled:opacity-50 transition-all font-mono"
                    >
                      <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? "Syncing..." : "Gemini Sync"}</span>
                    </button>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-normal font-sans">
                    Fetch/add trending search keywords and phrases (hidden from standard listings) via Gemini.
                  </p>

                  <div className="max-h-28 overflow-y-auto space-y-1.5 border-t border-[#30363D]/60 pt-2 pr-1 scrollbar-thin text-left">
                    {problems.map(prob => (
                      <div key={prob.id} className="bg-[#161B22] p-1.5 rounded border border-[#30363D]/50">
                        <div className="flex items-center justify-between font-bold text-[9.5px] text-white">
                          <span>{prob.name}</span>
                          <span className="text-[8.5px] text-zinc-400 font-mono">
                            {prob.keywords.length} terms
                          </span>
                        </div>
                        <p className="text-[8.5px] text-zinc-500 line-clamp-2 mt-0.5 font-sans leading-tight">
                          {prob.keywords.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeauthorize}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 py-2 font-bold transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Exit Admin Mode
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-sans text-left">
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
                    className="w-full rounded-xl bg-[#4F8CFF] hover:bg-indigo-600 text-white py-2 font-bold shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer"
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

