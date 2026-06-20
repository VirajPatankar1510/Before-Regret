import React, { useState } from 'react';
import { Gavel, Users, Clock, Vote, Check, ShieldAlert, Award, MessageSquare, Plus, ArrowLeft, Shield, Trash2, Calendar, Lock, Unlock, Download, Copy, ExternalLink, Sparkles, Share2, X } from 'lucide-react';
import { CourtCase, CourtArgument } from '../types';

interface CourtScreenProps {
  courtCase: CourtCase;
  setScreen: (screen: { type: string; slug?: string }) => void;
  onVoteCourt: (slug: string, side: 'me' | 'partner' | 'both' | 'neither') => void;
  onAddArgument: (slug: string, side: 'Me' | 'Partner' | 'Both' | 'Neither', text: string) => void;
  userVotedCases: { [slug: string]: string };
  isAdmin?: boolean;
  onDeleteArgument?: (caseSlug: string, argId: string) => void;
  onDeleteCourtCase?: (caseSlug: string) => void;
}

export default function CourtScreen({ 
  courtCase, 
  setScreen, 
  onVoteCourt, 
  onAddArgument, 
  userVotedCases,
  isAdmin = false,
  onDeleteArgument,
  onDeleteCourtCase
}: CourtScreenProps) {
  const [argumentText, setArgumentText] = useState('');
  const [selectedSide, setSelectedSide] = useState<'Me' | 'Partner' | 'Both' | 'Neither'>('Me');
  const [showCaseDeleteConfirm, setShowCaseDeleteConfirm] = useState(false);

  const [now, setNow] = useState(new Date());
  const [simExpired, setSimExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [certificateUnlocked, setCertificateUnlocked] = useState(false);
  


  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const userVote = userVotedCases[courtCase.slug];
  const totalVotes = courtCase.votes.me + courtCase.votes.partner + courtCase.votes.both + courtCase.votes.neither;

  const getPercent = (val: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((val / totalVotes) * 100);
  };

  const currentVerdict = () => {
    const list = [
      { side: 'Me', val: courtCase.votes.me },
      { side: 'Partner', val: courtCase.votes.partner },
      { side: 'Both', val: courtCase.votes.both },
      { side: 'Neither', val: courtCase.votes.neither }
    ];
    list.sort((a,b) => b.val - a.val);
    return list[0].side;
  };

  // Check if case is real or pre-seeded mockup, and handle timer expired logic
  const isRealCase = !!courtCase.createdAt;
  const deliberationDays = courtCase.deliberationDays || 3;
  const createdDate = courtCase.createdAt ? new Date(courtCase.createdAt) : null;
  const expirationTime = createdDate ? (createdDate.getTime() + deliberationDays * 24 * 60 * 60 * 1000) : 0;
  
  const isExpired = !isRealCase || simExpired || (createdDate ? now.getTime() >= expirationTime : true);

  const getRemainingTimeText = () => {
    if (isExpired) return "00d 00h 00m 00s";
    if (!createdDate) return "00d 00h 00m 00s";
    
    const diff = expirationTime - now.getTime();
    if (diff <= 0) return "00d 00h 00m 00s";

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleArgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!argumentText.trim()) return;
    onAddArgument(courtCase.slug, selectedSide, argumentText);
    setArgumentText('');
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Return Button */}
      <button
        onClick={() => setScreen({ type: 'home' })}
        className="text-xs text-[#6B7280] hover:text-[#24324A] inline-flex items-center gap-1 font-semibold border border-[#E5E7EB] bg-white px-3 py-1.5 rounded-xl transition-all hover:border-zinc-300 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Before Regret Cases
      </button>

      {/* Primary Dilemma header */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-2 text-xs">
            <span className="font-bold text-red-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <Shield className="h-3.5 w-3.5 text-[#C9A227] animate-pulse" /> Court Case Override Console
            </span>
            {showCaseDeleteConfirm ? (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-red-700 font-bold font-mono text-[11px]">Permanently delete trial?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCourtCase?.(courtCase.slug);
                    setScreen({ type: 'home' });
                  }}
                  className="px-2.5 py-1 rounded bg-red-600 text-white font-extrabold text-[10px] transition-all"
                >
                  Yes, Delete Case
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaseDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded bg-zinc-200 text-zinc-700 font-bold text-[10px] transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCaseDeleteConfirm(true)}
                className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Court Case
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FFF8E1] text-[#C9A227]">
            <Gavel className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A227]">Before Regret Court Case • {courtCase.caseNumber || 'CASE-C2011'}</span>
        </div>
        
        <h1 className="text-lg sm:text-xl font-bold text-[#24324A] leading-snug font-serif">
          "{courtCase.title}"
        </h1>

        <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-sans font-medium">
          <span>Judge: @{courtCase.author}</span>
          <span>•</span>
          <span>Case Lodged: {courtCase.postTime}</span>
          <span>•</span>
          <span className="text-[#2E7D32] font-bold">{totalVotes.toLocaleString()} jurors voted</span>
        </div>

        <p className="text-base text-[#374151] leading-relaxed font-serif pl-3 border-l-2 border-[#C9A227] not-italic">
          {courtCase.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {courtCase.tags.map(t => (
            <span key={t} className="text-[10px] font-semibold text-[#6B7280] bg-[#F4F1E8] border border-[#E5E7EB] px-2 py-0.5 rounded">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION: DELIBERATION COUNTDOWN TIMER PANEL */}
      <div className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden transition-all duration-300 ${
        isExpired 
          ? 'bg-zinc-50 border-zinc-200 text-zinc-700' 
          : 'bg-[#FFFDF4] border-[#E8D79B] text-[#785E14] animate-fadeIn'
      }`}>
        {/* Subtle decorative elements for premium marketer touch */}
        {!isExpired && <div className="absolute top-0 right-0 h-10 w-10 bg-[#F4B942]/10 rounded-full blur-xl animate-pulse" />}

        <div className="space-y-1 z-10 flex-1">
          <div className="flex items-center gap-2">
            {isExpired ? (
              <span className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-zinc-500 font-mono uppercase bg-zinc-200/50 px-2.5 py-0.5 rounded border border-zinc-300">
                <Lock className="h-3 w-3" /> Perspectives Sealed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-[#C9A227] font-mono uppercase bg-[#FFF8E1] px-2.5 py-0.5 rounded border border-[#E8D79B] animate-pulse">
                <Clock className="h-3 w-3" /> Deliberation In Progress
              </span>
            )}
            <span className="text-[10px] text-zinc-500 font-mono font-medium">
              Trial Duration: {deliberationDays < 1 ? "1 Minute" : `${deliberationDays} Days`}
            </span>
          </div>
          <h2 className="text-sm font-bold font-serif leading-tight">
            {isExpired 
              ? "Perspectives have been finalized and verified by the Peer Jury. This decision docket is archive-sealed."
              : "Peer Jurors are on the stand sharing balanced insights. Cast your perspectives below before values lock!"
            }
          </h2>
          <p className="text-xs text-zinc-500 leading-normal font-sans">
            Once deliberation ends, if you hold the clean hand consensus, a verified social sharing credential becomes available.
          </p>
        </div>

        {/* Live numerical countdown */}
        <div className="bg-[#1F2937] text-white p-4 rounded-xl flex flex-col items-center justify-center font-mono min-w-[200px] border border-zinc-700 shadow-md">
          <span className="text-[9px] uppercase tracking-widest text-[#AAB2C0] font-sans font-extrabold mb-1.5 flex items-center gap-1">
            {isExpired ? "Deliberation Closed" : "Remaining Deliberation"}
          </span>
          <span className={`text-base font-black tracking-wider ${isExpired ? "text-rose-400 font-mono" : "text-[#FFF8E1]"}`}>
            {getRemainingTimeText()}
          </span>
          
          {/* Simulation fast-forward triggers for testing */}
          {!isExpired && isRealCase && (
            <button
              onClick={() => {
                setSimExpired(true);
                setCertificateUnlocked(false);
              }}
              className="mt-2 text-[9px] uppercase font-bold text-[#F4B942] bg-[#F4B942]/10 hover:bg-[#F4B942]/20 px-2 py-1 rounded transition-all border border-[#F4B942]/20 flex items-center gap-1 active:scale-95 cursor-pointer"
              title="Skip the 3-day wait to instantly test the certificate!"
            >
              <Sparkles className="h-2.5 w-2.5" /> Skip Deliberation (Dev Mode)
            </button>
          )}
        </div>
      </div>

      {/* SECTION: TRIBUNAL CLEAN HANDS CERTIFICATE */}
      {isExpired && currentVerdict() !== 'Me' && (
        <div className="relative rounded-3xl border border-[#30363D] bg-[#161B22] p-5 sm:p-7 shadow-xl space-y-6 transition-all duration-300 animate-fadeIn text-left">
          {/* Close Certificate Plaque (X) Badge */}
          {certificateUnlocked && (
            <button
              onClick={() => setCertificateUnlocked(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all hover:bg-zinc-800 cursor-pointer z-50 focus:outline-none"
              title="Close Certificate Plaque"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#30363D]/60 pb-5">
            <div className="space-y-1 text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#F4B942] bg-[#F4B942]/10 border border-[#F4B942]/30 px-3 py-1 rounded-full font-mono">
                <Award className="h-4 w-4 animate-pulse text-[#F4B942]" /> Official Boundary Clearance
              </span>
              <h3 className="text-lg font-black text-white font-sans tracking-tight pt-1">
                Jury Boundary Authentication Registry ⚖️
              </h3>
              <p className="text-xs text-[#AAB2C0] max-w-xl leading-relaxed">
                Peer deliberation consensus determines you held proper, healthy relationship boundaries in this dispute. Export this verified certificate to validate your healthy boundaries!
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-2.5">
              {!certificateUnlocked ? (
                <button
                  onClick={() => {
                    setCertificateUnlocked(true);
                    setCopied(false);
                  }}
                  className="bg-[#F4B942] hover:bg-[#E0A52D] text-[#0D1117] font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Sparkles className="h-4 w-4" /> Retrieve Certificate
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 no-print">
                  {/* Download (PDF/Print) Button */}
                  <button
                    onClick={() => window.print()}
                    className="bg-[#F4B942] hover:bg-[#E0A52D] text-[#0D1117] font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    title="Print or Save Certificate as high-res PDF"
                  >
                    <Download className="h-4 w-4" /> Download/Print
                  </button>

                  {/* Share Certificate Button */}
                  <button
                    onClick={async () => {
                      const shareTitle = 'Before Regret Jury - Verified Boundary Clearance';
                      const shareText = `I just received my social proof boundary badge on Before Regret Jury! ⚖️ Consensual clean hands score: ${100 - getPercent(courtCase.votes.me)}%. Docket Code: ${courtCase.caseNumber || 'CASE-C2011'}. View the official jury findings here:`;
                      const shareUrl = window.location.href;

                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: shareTitle,
                            text: shareText,
                            url: shareUrl,
                          });
                        } catch (err) {
                          // Ignore abort errors
                        }
                      } else {
                        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      }
                    }}
                    className="bg-zinc-800 hover:bg-zinc-750 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-zinc-700 transition-all shadow active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="h-4 w-4 text-[#F4B942]" /> {copied ? "Copied Link!" : "Share Link"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {certificateUnlocked && (
            <div className="space-y-6 animate-fadeIn">
              {/* PRINT STYLE COMPONENT OVERRIDE */}
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #certificate-print-area, #certificate-print-area * {
                    visibility: visible !important;
                  }
                  #certificate-print-area {
                    position: fixed !important;
                    left: 2% !important;
                    top: 2% !important;
                    width: 96% !important;
                    max-width: 850px !important;
                    border: 12px double #C29B38 !important;
                    background-color: #FAFAF6 !important;
                    color: #1E293B !important;
                    box-shadow: none !important;
                    transform: none !important;
                    z-index: 9999999 !important;
                    border-radius: 0px !important;
                    padding: 3rem !important;
                    font-family: Georgia, Garamond, serif !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}} />

              {/* AUTHENTIC HIGH-PRESTIGE CERTIFICATE OF BOUNDARY INTEGRITY */}
              <div 
                id="certificate-print-area"
                className="relative rounded-3xl border-8 border-double border-[#C29B38] bg-[#FAFAF6] text-[#1E293B] p-6 sm:p-10 space-y-6 text-center max-w-2xl mx-auto shadow-2xl overflow-hidden transition-all duration-300 select-none pb-8"
              >
                {/* Vintage Watermark Flourish backdrop */}
                <div className="absolute -bottom-8 -right-8 opacity-[0.03] select-none pointer-events-none transform rotate-12 scale-125">
                  <Award className="h-96 w-96 text-amber-900" />
                </div>

                {/* Classical Golden Wax Foil Stamp/Seal */}
                <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10 select-none pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    {/* Golden jagged seal back */}
                    <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 shadow-md border-2 border-white animate-pulse opacity-95" />
                    {/* Inner gold concentric seal */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-300 flex flex-col items-center justify-center text-[7.5px] font-black text-amber-950 font-serif tracking-tighter uppercase leading-none shadow-inner">
                      <span>VERIFIED</span>
                      <span className="text-[10px] my-0.5">⚖️</span>
                      <span className="font-bold">CLEAN HANDS</span>
                    </div>
                  </div>
                </div>

                {/* Certificate Heading */}
                <div className="space-y-1 pt-4 text-center">
                  <span className="block text-[8px] sm:text-[9.5px] uppercase tracking-[0.22em] font-mono font-bold text-amber-800">
                    National Assembly of Peer Arbitrators & Mediators
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-slate-900 uppercase">
                    Decree of Boundary Integrity
                  </h2>
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-[#C29B38] to-transparent w-3/4 mx-auto mt-2" />
                </div>

                {/* Formal statement of credential */}
                <div className="space-y-4 font-serif text-slate-800 leading-relaxed text-xs sm:text-sm italic px-3 max-w-xl mx-auto">
                  <p className="not-italic font-sans text-[8.5px] tracking-widest text-[#B45309] font-black uppercase">
                    REGISTRY CODE: <span className="font-mono text-slate-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{courtCase.caseNumber || 'CASE-C2011'}</span>
                  </p>
                  
                  <p className="text-[13px] leading-relaxed">
                    "This formal decree attests that relationship delegates of the Before Regret Court have fully reviewed, tested, and deliberated upon the boundary conditions presented in relationship controversy:"
                  </p>

                  <div className="not-italic bg-stone-100/70 border border-stone-200 rounded-xl p-3 max-w-md mx-auto my-3 text-left">
                    <span className="block text-[7.5px] font-mono uppercase tracking-widest text-stone-400 font-bold mb-1">DOCKET CASE OVERVIEW</span>
                    <span className="font-sans font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      "{courtCase.title}"
                    </span>
                  </div>

                  <p className="text-[13px] leading-relaxed">
                    By standard democratic consensus, the jury hereby declares the respondent to be cleared of relationship overreach. The respondent's physical and mental boundaries are validated as standard, constructive, and highly dignified.
                  </p>
                </div>

                {/* High-Fidelity Jury consensus statistics */}
                <div className="grid grid-cols-2 gap-3 border-t border-b border-amber-700/10 py-5 max-w-sm mx-auto bg-stone-50 rounded-xl px-2">
                  <div className="text-center flex flex-col justify-center">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-sans font-bold">Consensus Ratio</span>
                    <span className="text-xl font-black text-[#B45309] font-mono leading-none pt-0.5">
                      {100 - getPercent(courtCase.votes.me)}% Clear
                    </span>
                    <span className="text-[7px] uppercase text-zinc-400 tracking-wider mt-1 block font-mono">Proper Boundary Ratio</span>
                  </div>
                  <div className="text-center border-l border-[#30363D]/10 flex flex-col justify-center">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-sans font-bold">Assembly Audited</span>
                    <span className="text-xl font-black text-slate-900 font-mono leading-none pt-0.5">
                      {totalVotes.toLocaleString()} Peers
                    </span>
                    <span className="text-[7px] uppercase text-zinc-400 tracking-wider mt-1 block font-mono">Active Citizens Verified</span>
                  </div>
                </div>

                {/* Signatures & Seal Registry Footer */}
                <div className="flex justify-between items-end pt-6 max-w-md mx-auto text-[8px] text-zinc-500 font-mono uppercase tracking-widest">
                  <div className="text-center w-28 border-t border-zinc-300 pt-2">
                    <span className="font-serif italic font-bold text-slate-800 tracking-wider font-extrabold lowercase text-[10px] block mb-0.5">@before_regret</span>
                    <span className="block text-[7px] text-zinc-400">Assembly Overseer</span>
                  </div>
                  <div className="text-center w-28 border-t border-zinc-300 pt-2">
                    <span className="font-sans font-black text-slate-800 tracking-normal block mb-0.5">PEER JURY SECURE</span>
                    <span className="block text-[7px] text-zinc-400">Consensus Confirmed</span>
                  </div>
                </div>

                {/* Official Stamp Watermark Footer */}
                <div className="text-[6.5px] uppercase font-mono tracking-[0.25em] text-zinc-400 text-center pt-2 select-none">
                  INTEGRITY REGISTRY VALUE • STATE ID {courtCase.slug.substring(0, 8).toUpperCase() || 'VERID-99'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COURT POLL / VOTE OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Active Poll Voting */}
        <div className="md:col-span-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Cast Your Jury Perspective</h3>
          
          {(userVote || isExpired) ? (
            <div className="space-y-3">
              {isExpired ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-center text-[#9F5F1B] font-bold mb-2 flex items-center justify-center gap-1.5 shadow-sm">
                  <Lock className="h-4 w-4" strokeWidth="2.5" /> final deliberation results sealed!
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-center text-[#2E7D32] font-bold mb-2 flex items-center justify-center gap-1.5 shadow-sm">
                  <Check className="h-4 w-4" /> verdict registered! Current court breakdown:
                </div>
              )}

              {[
                { label: "Blame Me (Poster)", key: 'me', val: courtCase.votes.me, color: 'bg-[#24324A]' },
                { label: "Blame Partner", key: 'partner', val: courtCase.votes.partner, color: 'bg-[#B23B3B]' },
                { label: "Blame Both equally", key: 'both', val: courtCase.votes.both, color: 'bg-[#C9A227]' },
                { label: "Blame Neither", key: 'neither', val: courtCase.votes.neither, color: 'bg-[#9CA3AF]' }
              ].map(opt => {
                const pct = getPercent(opt.val);
                return (
                  <div key={opt.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-[#6B7280]">
                      <span className={userVote === opt.key ? 'text-[#24324A] font-bold' : ''}>
                        {opt.label} {userVote === opt.key && ' (Your Vote)'}
                      </span>
                      <span className="text-[#1F2937] font-bold">{pct}% ({opt.val})</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#FAF8F2] overflow-hidden border border-[#E5E7EB]">
                      <div className={`h-full ${opt.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#ECECEC] pt-3 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Leading Perspective</span>
                <span className="text-sm font-bold text-[#C9A227] uppercase bg-[#FFF8E1] px-3 py-1 rounded border border-[#E8D79B] inline-block mt-1 font-mono">
                  {currentVerdict() === 'Me' ? 'Poster at Fault' : currentVerdict() === 'Partner' ? 'Partner at Fault' : currentVerdict() === 'Both' ? 'Both Share Blame' : 'Mutual Understanding / No Fault'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[#6B7280] leading-relaxed mb-3">Vote anonymously based purely on relationship rules and boundary violations:</p>
              {[
                { label: "I am wrong", key: 'me' },
                { label: "Partner is wrong", key: 'partner' },
                { label: "Both are wrong (Culpable of friction)", key: 'both' },
                { label: "Neither are wrong (Just miscommunication)", key: 'neither' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => onVoteCourt(courtCase.slug, opt.key as any)}
                  className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-3 text-xs font-bold text-[#1F2937] hover:border-[#24324A] hover:bg-[#FAF8F2] transition-all flex items-center justify-between shadow-sm cursor-pointer"
                  id={`court-vote-${opt.key}`}
                >
                  <span>{opt.label}</span>
                  <Vote className="h-4 w-4 text-[#6B7280] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Juror Arguments List & Input */}
        <div className="md:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Jury Deliberation Opinions</h3>

            {/* Submit Argument Form */}
            <form onSubmit={handleArgSubmit} className="space-y-3 bg-[#FAF8F2] p-3 rounded-xl border border-[#E5E7EB]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Who are you blaming?</span>
                <div className="flex gap-1 text-[10px]">
                  {['Me', 'Partner', 'Both', 'Neither'].map(side => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setSelectedSide(side as any)}
                      className={`px-2.5 py-1 rounded font-bold border transition-all ${
                        selectedSide === side 
                          ? 'bg-[#FFF8E1] border-[#C9A227] text-[#C9A227]' 
                          : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                      }`}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Submit your deliberative juror opinion here. What boundary was crossed? Keep it objective."
                value={argumentText}
                onChange={(e) => setArgumentText(e.target.value)}
                maxLength={800}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] min-h-[70px]"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#24324A] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#1C273A]"
                >
                  <Plus className="h-3.5 w-3.5" /> Register Argument
                </button>
              </div>
            </form>

            {/* List Opinions */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courtCase.arguments.map(arg => {
                const badgeColor = 
                  arg.side === 'Me' ? 'bg-[#24324A]/5 text-[#24324A] border-[#24324A]/10' :
                  arg.side === 'Partner' ? 'bg-[#B23B3B]/5 text-[#B23B3B] border-[#B23B3B]/10' :
                  arg.side === 'Both' ? 'bg-[#FFF8E1] text-[#C9A227] border-[#E8D79B]' :
                  'bg-zinc-50 text-zinc-500 border-zinc-200';

                return (
                  <div key={arg.id} className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-3.5 text-xs shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                        <span className="font-bold text-[#1F2937]">@{arg.author}</span>
                        <span className="text-[9px] bg-emerald-50 text-[#2E7D32] px-1 py-0.2 rounded font-bold border border-emerald-100">
                          {arg.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${badgeColor}`}>
                          Blamed: {arg.side}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteArgument?.(courtCase.slug, arg.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 p-1 rounded-md transition-colors"
                            title="Moderator: Delete opinion"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[#374151] leading-relaxed font-serif text-sm not-italic">"{arg.text}"</p>
                    <div className="flex justify-end gap-3 text-[10px] text-zinc-400 mt-2 font-medium">
                       <span>Was this analysis helpful?</span>
                       <button 
                         type="button"
                         onClick={() => alert("Opinion upvoted!")}
                         className="text-[#24324A] hover:text-[#C9A227] font-bold hover:underline"
                       >
                         Upvote ({arg.votes})
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
