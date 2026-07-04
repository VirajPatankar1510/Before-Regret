import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Key, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Link2, 
  FileText, 
  Sparkles, 
  Copy, 
  Globe, 
  HelpCircle 
} from 'lucide-react';
import { PRESEEDED_RELATIONSHIP_PROBLEMS, RelationshipProblem } from '../data/relationshipProblems';
import { fetchRelationshipProblemsFromFirestore, saveRelationshipProblemsToFirestore } from '../lib/firestoreService';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: (status: boolean) => void;
}

const ARTICLE_PRESETS = [
  { name: "Infidelity Reconciliation Math", slug: "infidelity-reconciliation-math-of-forgiveness", url: "/guides/infidelity-reconciliation-math-of-forgiveness" },
  { name: "Marriage Ultimatum Protocol", slug: "ultimatum-protocol-why-marriage-deadlocks-fail", url: "/guides/ultimatum-protocol-why-marriage-deadlocks-fail" },
  { name: "Relocation Risk (Moving for Love)", slug: "relocation-risk-index-moving-for-love", url: "/guides/relocation-risk-index-moving-for-love" },
  { name: "Red Flag Boundary Matrix", slug: "red-flag-evaluation-boundary-matrix", url: "/guides/red-flag-evaluation-boundary-matrix" },
  { name: "Financial Infidelity & Secret Debt", slug: "financial-infidelity-secret-debt-private-accounts", url: "/guides/financial-infidelity-secret-debt-private-accounts" },
  { name: "Emotional Cheating Boundaries", slug: "emotional-cheating-vs-close-friendship-boundaries", url: "/guides/emotional-cheating-vs-close-friendship-boundaries" },
  { name: "Stonewalling & Silent Treatment", slug: "stonewalling-silent-treatment-emotional-punishment", url: "/guides/stonewalling-silent-treatment-emotional-punishment" },
  { name: "LDR Couple Bubble Blow Game", slug: "ldr-game", url: "/ldr-game" }
];

export default function AdminPanel({ isAdmin, onToggleAdmin }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Sync state and dynamic dictionary lists
  const [isSyncing, setIsSyncing] = useState(false);
  const [problems, setProblems] = useState<RelationshipProblem[]>(PRESEEDED_RELATIONSHIP_PROBLEMS);

  // Backlink builder state
  const [selectedArticle, setSelectedArticle] = useState(ARTICLE_PRESETS[0]);
  const [targetPlatform, setTargetPlatform] = useState('blog');
  const [backlinkTone, setBacklinkTone] = useState('empathetic');
  const [isGeneratingBacklink, setIsGeneratingBacklink] = useState(false);
  const [backlinkOutput, setBacklinkOutput] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleGenerateBacklink = async () => {
    setIsGeneratingBacklink(true);
    setBacklinkOutput(null);
    try {
      const origin = window.location.origin;
      const fullUrl = `${origin}${selectedArticle.url}`;
      
      const res = await fetch("/api/admin/generate-backlink-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlatform,
          selectedArticle: selectedArticle.name,
          linkUrl: fullUrl,
          tone: backlinkTone
        })
      });

      if (!res.ok) {
        throw new Error("Server responded with code: " + res.status);
      }

      const data = await res.json();
      if (data.success && data.outreach) {
        setBacklinkOutput(data.outreach);
      } else {
        throw new Error(data.error || "Failed to parse outreach generation payload.");
      }
    } catch (err: any) {
      console.error("Backlink generation failed:", err);
      alert("Error building outreach pack: " + (err.message || err));
    } finally {
      setIsGeneratingBacklink(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
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

                {/* AUTOMATIC LINK BUILDER & OUTREACH PACK WIDGET */}
                <div className="border border-[#30363D] bg-[#0D1117] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-pink-400" />
                    <span className="font-extrabold text-pink-400 uppercase text-[10px] tracking-wider block">
                      🔗 Backlink & Outreach Pitch Generator
                    </span>
                  </div>
                  
                  <p className="text-[9.5px] text-zinc-400 leading-normal">
                    Generate organic backlink pitches, cold outreach templates, or contextual forum responses to build authority for your pSEO pages.
                  </p>

                  <div className="space-y-2.5 pt-1 border-t border-[#30363D]/40">
                    {/* Select Article to promote */}
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Featured Article / Resource</label>
                      <select 
                        value={selectedArticle.slug}
                        onChange={(e) => {
                          const match = ARTICLE_PRESETS.find(a => a.slug === e.target.value);
                          if (match) setSelectedArticle(match);
                        }}
                        className="w-full text-[10.5px] rounded bg-[#161B22] border border-[#30363D] text-white px-2 py-1.5 focus:border-pink-500 outline-none"
                      >
                        {ARTICLE_PRESETS.map(art => (
                          <option key={art.slug} value={art.slug}>{art.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Target Platform Type */}
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Target Platform Type</label>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { id: 'blog', label: 'Blog' },
                          { id: 'parenting_forum', label: 'Forum' },
                          { id: 'reddit', label: 'Reddit' },
                          { id: 'quora', label: 'Quora' },
                          { id: 'directory', label: 'Index' }
                        ].map((plat) => (
                          <button
                            key={plat.id}
                            type="button"
                            onClick={() => setTargetPlatform(plat.id)}
                            className={`px-1 py-1 rounded text-[9px] font-bold border transition-colors ${
                              targetPlatform === plat.id 
                                ? 'bg-pink-500/15 text-pink-400 border-pink-500/40' 
                                : 'bg-[#161B22] text-zinc-400 border-[#30363D] hover:text-white'
                            }`}
                          >
                            {plat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Backlink Tone */}
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Pitch Tone</label>
                      <div className="flex gap-1.5">
                        {[
                          { id: 'empathetic', label: 'Empathetic & Caring' },
                          { id: 'professional', label: 'Professional Editor Pitch' },
                          { id: 'viral', label: 'Viral & Bold Storytelling' }
                        ].map((tn) => (
                          <button
                            key={tn.id}
                            type="button"
                            onClick={() => setBacklinkTone(tn.id)}
                            className={`flex-1 px-1.5 py-1 rounded text-[9px] font-bold border transition-colors ${
                              backlinkTone === tn.id 
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40' 
                                : 'bg-[#161B22] text-zinc-400 border-[#30363D] hover:text-white'
                            }`}
                          >
                            {tn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="button"
                      disabled={isGeneratingBacklink}
                      onClick={handleGenerateBacklink}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all font-mono"
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${isGeneratingBacklink ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingBacklink ? "Crafting Pitch..." : "Generate Backlink Outreach"}</span>
                    </button>
                  </div>

                  {/* OUTPUT RESULTS WINDOW */}
                  {backlinkOutput && (
                    <div className="space-y-3 pt-3 border-t border-[#30363D]/60 animate-fade-in text-left">
                      {/* Outreach Pitch */}
                      <div className="space-y-1 bg-[#161B22] rounded-lg p-2.5 border border-[#30363D]/70">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black text-pink-400">
                            ✨ Generated Outreach / Pitch Script
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(backlinkOutput.outreachPitch, 'pitch')}
                            className="inline-flex items-center gap-1 text-[8px] text-zinc-400 hover:text-white bg-[#0D1117] px-1.5 py-0.5 rounded border border-[#30363D] cursor-pointer"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            <span>{copiedField === 'pitch' ? 'Copied!' : 'Copy Script'}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                          {backlinkOutput.outreachPitch}
                        </p>
                      </div>

                      {/* Suggested Anchors */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-zinc-400 block">
                          🎯 Suggested Anchor Text
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {backlinkOutput.suggestedAnchors?.map((anchor: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleCopyText(anchor, `anchor-${idx}`)}
                              className="px-2 py-0.5 bg-[#161B22] border border-[#30363D] hover:border-pink-500/50 rounded text-[9px] font-mono text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>"{anchor}"</span>
                              <span className="text-[8px] text-zinc-500">
                                {copiedField === `anchor-${idx}` ? '✓' : '⧉'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Guest Post Outline Ideas */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-[#4F8CFF] block">
                          💡 Partner Guest Post Ideas
                        </span>
                        <ul className="space-y-1.5">
                          {backlinkOutput.guestPostOutlines?.map((outline: string, idx: number) => (
                            <li key={idx} className="bg-[#0D1117] p-2 rounded border border-[#30363D]/40 text-[9.5px] leading-relaxed text-zinc-300">
                              <span className="font-bold text-white block">Idea #{idx+1}</span>
                              {outline}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Strategic Positioning Angle */}
                      {backlinkOutput.positioningAngle && (
                        <div className="bg-indigo-950/20 rounded-lg p-2 border border-indigo-500/25 text-[9px] text-indigo-200 leading-normal font-sans">
                          <span className="font-bold uppercase text-[8.5px] tracking-wider text-indigo-300 block mb-0.5">
                            ⚡ Strategic Angle
                          </span>
                          {backlinkOutput.positioningAngle}
                        </div>
                      )}
                    </div>
                  )}
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

