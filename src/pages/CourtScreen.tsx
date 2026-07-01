import React, { useState } from 'react';
import { Gavel, Users, Clock, Vote, Check, ShieldAlert, Award, MessageSquare, Plus, ArrowLeft, Shield, Trash2, Calendar, Lock, Unlock, Download, Copy, ExternalLink, Sparkles, Share2, X } from 'lucide-react';
import { validateInputText } from '../lib/validation';
import { CourtCase, CourtArgument } from '../types';
import { saveCourtCaseToFirestore } from '../lib/firestoreService';
import BeforeRegretLogo from '../components/BeforeRegretLogo';

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
  const [isPartnerInvite, setIsPartnerInvite] = useState(false);
  const [showCaseDeleteConfirm, setShowCaseDeleteConfirm] = useState(false);
  const [reportedArguments, setReportedArguments] = useState<string[]>([]);

  const [now, setNow] = useState(new Date());
  const [simExpired, setSimExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [certificateUnlocked, setCertificateUnlocked] = useState(false);

  // Certificate dynamic personalization states
  const [certHeroText, setCertHeroText] = useState('BOUNDARY DEFENDER');
  const [certVerdict, setCertVerdict] = useState('NOT GUILTY');
  const [certQuote, setCertQuote] = useState('The Court finds your actions reasonable and your boundaries justified.');
  const [certPercent, setCertPercent] = useState<number | null>(null);
  const [certArchetype, setCertArchetype] = useState('BOUNDARY DEFENDER');
  const [certConfidence, setCertConfidence] = useState('HIGH');
  const [certJurors, setCertJurors] = useState<number | null>(null);
  const [certIsGeneratingImage, setCertIsGeneratingImage] = useState(false);
  const [certFormat, setCertFormat] = useState<'standard' | 'story916'>('standard');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        if (window.innerWidth < 768) {
          setCertFormat('story916');
        } else {
          setCertFormat('standard');
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const [showAddNameForm, setShowAddNameForm] = useState(false);
  const [typedPin, setTypedPin] = useState('');
  const [typedName, setTypedName] = useState('');
  const [typedConfirmName, setTypedConfirmName] = useState('');
  const [nameRevealConsent, setNameRevealConsent] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);


  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isInvite = new URLSearchParams(window.location.search).get('partnerInvite') === 'true';
      setIsPartnerInvite(isInvite);
      if (isInvite) {
        setSelectedSide('Partner');
      }
    }
  }, [courtCase.slug]);

  React.useEffect(() => {
    if (certificateUnlocked) {
      const voteCleanHands = totalVotes > 0 ? (100 - getPercent(courtCase.votes.me)) : 92;
      setCertPercent(voteCleanHands);
      setCertJurors(totalVotes || 1284);
      
      const customQuoteText = voteCleanHands >= 80 
        ? `The Court finds your actions highly reasonable, your boundaries completely justified, and your standards pristine.` 
        : voteCleanHands >= 50 
          ? `The Court finds your boundaries justified and guides both parties to uphold respectful communications.`
          : `The Court identifies reasonable concern and recommends establishing healthier boundaries to avoid regret.`;
      setCertQuote(customQuoteText);
    }
  }, [certificateUnlocked]);

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
    const val = validateInputText(argumentText, "Argument / Comment");
    if (!val.isValid) {
      alert(val.error);
      return;
    }
    onAddArgument(courtCase.slug, selectedSide, argumentText);
    setArgumentText('');
  };

  const handleDownloadImage = async () => {
    const el = document.getElementById('certificate-print-area');
    if (!el) return;
    try {
      setCertIsGeneratingImage(true);
      // Let states settle
      await new Promise(resolve => setTimeout(resolve, 100));
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(el, {
        pixelRatio: 2.0,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          margin: '0',
          borderRadius: '24px' // Matches the rounded structure of our card
        }
      });
      const link = document.createElement('a');
      link.download = `Relationship_Court_Certificate_${courtCase.caseNumber || 'CASE'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error rendering image:', error);
    } finally {
      setCertIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Return Button */}
      <button
        onClick={() => setScreen({ type: 'court_list' })}
        className="text-xs text-[#6B7280] hover:text-[#24324A] inline-flex items-center gap-1 font-semibold border border-[#E5E7EB] bg-white px-3 py-1.5 rounded-xl transition-all hover:border-zinc-300 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Before Regret Cases
      </button>

      {/* Primary Dilemma header */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {isAdmin && (
          <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-4 mb-4 space-y-4 text-xs animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-2">
              <span className="font-bold text-red-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-mono">
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
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] transition-all cursor-pointer shadow-sm"
                  >
                    Yes, Delete Case
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCaseDeleteConfirm(false)}
                    className="px-2.5 py-1 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold text-[10px] transition-all cursor-pointer border border-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCaseDeleteConfirm(true)}
                  className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-bold flex items-center gap-1 transition-colors text-[10px] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Court Case
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {/* Option to change trial duration */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-zinc-600 font-sans tracking-wide">
                  Change Trial Duration:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={courtCase.deliberationDays || 3}
                    onChange={async (e) => {
                      const selectedDays = parseFloat(e.target.value);
                      try {
                        const updatedCase: CourtCase = {
                          ...courtCase,
                          deliberationDays: selectedDays
                        };
                        await saveCourtCaseToFirestore(updatedCase);
                      } catch (err) {
                        console.error("Error updating deliberation days:", err);
                      }
                    }}
                    className="rounded-lg border border-red-200 bg-white p-1.5 text-xs text-zinc-800 focus:outline-none focus:border-red-400 font-mono focus:ring-1 focus:ring-red-400"
                  >
                    <option value="0.000694">1 Minute (Quick Test)</option>
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                  </select>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    (Current: {deliberationDays < 1 ? "1 Min" : `${deliberationDays} Days`})
                  </span>
                </div>
              </div>

              {/* Reset Trial / Open Sealed Perspectives Button */}
              <div className="flex flex-col justify-end md:items-end space-y-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Set createdAt to current time (which re-opens the trial if expired)
                      const updatedCase: CourtCase = {
                        ...courtCase,
                        createdAt: new Date().toISOString()
                      };
                      await saveCourtCaseToFirestore(updatedCase);
                      setSimExpired(false);
                    } catch (err) {
                      console.error("Error resetting case:", err);
                    }
                  }}
                  className="w-full md:w-auto px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition-all duration-200 cursor-pointer"
                >
                  <Unlock className="h-3.5 w-3.5" /> Reset Trial & Open Perspectives
                </button>
                <span className="text-[9px] text-zinc-500 mt-0.5 md:text-right font-sans block">
                  Sets start time to NOW and unseals all perspectives.
                </span>
              </div>
            </div>
          </div>
        )}

        {isPartnerInvite && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fadeIn text-[#1E3A8A]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 border border-blue-200 text-blue-600 shrink-0 mt-0.5">
              <Users className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 font-sans flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" /> You Have Been Invited to Respond in Opposition
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed font-sans">
                Your partner has submitted this case and requested your perspective to ensure a balanced community trial. Under peer-juror guidelines, your identity is 100% anonymous. Share your narrative below so peer citizens can weigh both sides fairly.
              </p>
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const formElement = document.getElementById("argument-form") || document.querySelector("form");
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Submit Counter-Argument Below
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FFF8E1] text-[#C9A227]">
              <Gavel className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A227]">The Relationship Court Case • {courtCase.caseNumber || 'CASE-C2011'}</span>
          </div>
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Ended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        
        <h1 className="text-lg sm:text-xl font-bold text-[#24324A] leading-snug font-serif flex items-center gap-2 flex-wrap">
          <span>"{courtCase.title}"</span>
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono bg-rose-50 text-rose-700 border border-rose-200">
              <span className="h-1 w-1 rounded-full bg-rose-500" />
              Ended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
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

        {courtCase.wantsPartnerResponse && (
          <div className="bg-[#FAF8F2] border border-[#ECECEC] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-3">
            <div className="space-y-0.5">
              <span className="font-bold text-[#24324A] flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5 text-[#C9A227]" /> Partner Opposition Invited
              </span>
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                The submitter requested a response from their partner to allow jurors to judge both sides fairly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const inviteLink = `${window.location.origin}/court/${courtCase.slug}?partnerInvite=true`;
                const message = `This link is only for you to add your argument, do not share with anyone then ${inviteLink}`;
                navigator.clipboard.writeText(message);
                alert("📋 Copied invitation message to clipboard!");
              }}
              className="px-3 py-2 rounded-lg text-[10.5px] font-bold bg-[#24324A] hover:bg-[#1C273A] text-white transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
            >
              <Copy className="h-3 w-3" /> Copy Invite Message
            </button>
          </div>
        )}
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
              ? "Perspectives have been finalized and decided by the Peer Jury."
              : "Peer Jurors are on the stand sharing balanced insights. Cast your perspectives below before values lock!"
            }
          </h2>
        </div>

        {/* Live numerical countdown */}
        <div className="bg-white text-zinc-900 p-4 rounded-xl flex flex-col items-center justify-center font-mono min-w-[200px] border border-zinc-200 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-sans font-extrabold mb-1.5 flex items-center gap-1">
            {isExpired ? "Deliberation Closed" : "Remaining Deliberation"}
          </span>
          <span className={`text-base font-black tracking-wider ${isExpired ? "text-rose-600 font-mono" : "text-[#C9A227]"}`}>
            {getRemainingTimeText()}
          </span>
          

        </div>
      </div>

      {/* SECTION: TRIBUNAL CLEAN HANDS CERTIFICATE */}
      {isExpired && currentVerdict() !== 'Me' && (
        <div className="relative rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xl space-y-6 transition-all duration-300 animate-fadeIn text-left">
          {/* Close Certificate Plaque (X) Badge */}
          {certificateUnlocked && (
            <button
              onClick={() => setCertificateUnlocked(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all hover:bg-zinc-200 cursor-pointer z-50 focus:outline-none"
              title="Close Certificate Plaque"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div className="space-y-1 text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#C9A227] bg-amber-50 border border-[#C9A227]/30 px-3 py-1 rounded-full font-mono">
                <Award className="h-4 w-4 animate-pulse text-[#C9A227]" /> Boundary Certificate
              </span>
              <h3 className="text-lg font-black text-zinc-900 font-sans tracking-tight pt-1">
                Community Verdict Certificate ⚖️
              </h3>
              <p className="text-xs text-zinc-600 max-w-xl leading-relaxed font-medium">
                Peer deliberation consensus determines you held proper, healthy relationship boundaries in this dispute. Export this certificate to validate your healthy boundaries!
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-2.5 font-sans">
              {!certificateUnlocked ? (
                <button
                  onClick={() => {
                    setCertificateUnlocked(true);
                    setCopied(false);
                  }}
                  className="bg-[#C9A227] hover:bg-[#B38E1D] text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" /> View Certificate
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 no-print">
                  {/* Download Image (PNG) Button */}
                  <button
                    onClick={handleDownloadImage}
                    disabled={certIsGeneratingImage}
                    className="bg-[#C9A227] hover:bg-[#B38E1D] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    title="Download high-resolution PNG image of your certificate"
                  >
                    <Download className="h-4 w-4" />
                    {certIsGeneratingImage ? "Downloading..." : "Download"}
                  </button>

                  {/* Copy Link Button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3005);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-[#30363D] transition-all shadow active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 text-[#F4B942]" /> {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {certificateUnlocked && (
            <div className="space-y-6 animate-fadeIn">
              {/* Personalization Section */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left space-y-2 max-w-2xl mx-auto no-print">
                {courtCase.recipientName ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        CERTIFICATE RECIPIENT LOCKED
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        This credential is permanently locked and issued to <strong className="text-white font-black">"{courtCase.recipientName}"</strong>. Recipient names can only be added once to preserve social-proof integrity.
                      </p>
                    </div>
                  </div>
                ) : !showAddNameForm ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#F4B942]" /> Is this your case? Click to add your name
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Enter your Case PIN to permanently add your name to this certificate. <strong>Note: This can only be done once.</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddNameForm(true);
                        setTypedPin('');
                        setTypedName('');
                        setTypedConfirmName('');
                        setNameRevealConsent(false);
                        setNameError('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#F4B942]/10 border border-[#F4B942]/30 hover:bg-[#F4B942]/20 text-[#F4B942] active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      Add Your Name
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C9A227] font-mono">
                        CLAIM CERTIFICATE & ADD YOUR NAME
                      </span>
                      <button
                        onClick={() => setShowAddNameForm(false)}
                        className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition-all text-[9.5px] uppercase font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <p className="text-[10px] text-amber-700 leading-tight font-sans font-bold">
                      ⚠️ Once submitted, the name is permanently locked on the certificate database and cannot be modified ever again.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                          CASE PIN (PASSWORD):
                        </label>
                        <input
                          type="password"
                          placeholder={courtCase.passwordPin ? "Enter 4-digit PIN..." : "No PIN required"}
                          disabled={!courtCase.passwordPin}
                          value={typedPin}
                          onChange={(e) => setTypedPin(e.target.value.trim())}
                          className="w-full bg-white border border-zinc-300 disabled:opacity-50 text-zinc-950 text-xs px-3 py-2 rounded-lg font-mono focus:border-[#C9A227] focus:outline-none transition-all placeholder:text-zinc-400 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                          RECIPIENT NAME:
                        </label>
                        <input
                          type="text"
                          maxLength={35}
                          placeholder="e.g. Samuel Bennett"
                          value={typedName}
                          onChange={(e) => setTypedName(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-zinc-950 text-xs px-3 py-2 rounded-lg focus:border-[#C9A227] focus:outline-none transition-all placeholder:text-zinc-400 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                          CONFIRM RECIPIENT NAME:
                        </label>
                        <input
                          type="text"
                          maxLength={35}
                          placeholder="Type name again to confirm..."
                          value={typedConfirmName}
                          onChange={(e) => setTypedConfirmName(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-zinc-950 text-xs px-3 py-2 rounded-lg focus:border-[#C9A227] focus:outline-none transition-all placeholder:text-zinc-400 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 font-sans">
                      <input
                        type="checkbox"
                        id="consent-reveal-checkbox"
                        checked={nameRevealConsent}
                        onChange={(e) => setNameRevealConsent(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-300 bg-white text-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 h-3.5 w-3.5 cursor-pointer accent-[#C9A227]"
                      />
                      <label htmlFor="consent-reveal-checkbox" className="text-[10.5px] text-zinc-700 font-bold leading-tight cursor-pointer select-none">
                        I understand that adding my name makes it publicly visible on this certificate.
                      </label>
                    </div>

                    {nameError && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">
                        ⚠️ Error: {nameError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 mt-2">
                      <button
                        onClick={async () => {
                          const cleanName = typedName.trim();
                          const cleanConfirm = typedConfirmName.trim();

                          if (!cleanName) {
                            setNameError("Please enter a recipient name.");
                            return;
                          }
                          if (cleanName !== cleanConfirm) {
                            setNameError("The Recipient Name and Confirm Recipient Name fields do not match.");
                            return;
                          }
                          if (courtCase.passwordPin && typedPin !== courtCase.passwordPin) {
                            setNameError("Incorrect Case PIN. Certificate claim failed.");
                            return;
                          }
                          if (!nameRevealConsent) {
                            setNameError("Please confirm public display acknowledgement by checking the consent box.");
                            return;
                          }
                          
                          setIsSavingName(true);
                          setNameError('');
                          try {
                            const updatedCase: CourtCase = {
                              ...courtCase,
                              recipientName: cleanName
                            };
                            await saveCourtCaseToFirestore(updatedCase);
                            setShowAddNameForm(false);
                          } catch (err) {
                            console.error(err);
                            setNameError("Error saving to database. Certificate update failed.");
                          } finally {
                            setIsSavingName(false);
                          }
                        }}
                        disabled={isSavingName || !nameRevealConsent}
                        className="bg-[#C9A227] hover:bg-[#B38E1D] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all shadow cursor-pointer"
                      >
                        {isSavingName ? "Saving Name..." : "Confirm & Apply Name"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

              {/* HIGH-FIDELITY DESIGNED RELATIONSHIP COURT CERTIFICATE IN SINGLE CANVAS CARD */}
              <div 
                id="certificate-print-area"
                className={`relative rounded-[24px] border-[#C29B38] bg-[#FAFAF6] text-[#1E293B] text-center mx-auto shadow-2xl overflow-hidden transition-all duration-300 select-none ${
                  certFormat === 'story916' 
                    ? 'border-[10px] border-double flex flex-col justify-between p-5 pt-8 pb-14' 
                    : 'border-8 border-double p-6 sm:p-10 space-y-6 pb-8 max-w-2xl'
                }`}
                style={certFormat === 'story916' ? { aspectRatio: '9/16', width: '100%', maxWidth: '410px' } : undefined}
              >
                {/* Dual-line elegant outer border ornaments */}
                <div className="absolute inset-2 sm:inset-3 border border-[#C29B38]/40 pointer-events-none rounded-[16px]" />
                <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t border-l border-[#C29B38] rounded-tl pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t border-r border-[#C29B38] rounded-tr pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b border-l border-[#C29B38] rounded-bl pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b border-r border-[#C29B38] rounded-br pointer-events-none" />

                {/* Soft pastel corner watercolor waves */}
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-gradient-to-tr from-[#FDFBF7] to-amber-100/40 rounded-tr-[100%] pointer-events-none select-none z-0 filter blur-sm animate-pulse" />
                <div className="absolute bottom-0 right-0 w-44 h-44 bg-gradient-to-tl from-[#FDFBF7] to-teal-100/30 rounded-tl-[100%] pointer-events-none select-none z-0 filter blur-sm" />

                {/* Left bottom heart outline contour illustration */}
                <div className="absolute bottom-6 left-6 text-[#E0A994]/20 pointer-events-none z-0 select-none">
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                {/* Right bottom heart outline contour illustration */}
                <div className="absolute bottom-6 right-6 text-[#8CBDB0]/20 pointer-events-none z-0 select-none">
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                {/* Vintage Gavel / Scales Watermark backdrop */}
                <div className="absolute -bottom-8 -right-8 opacity-[0.03] select-none pointer-events-none transform rotate-12 scale-125">
                  <Award className="h-96 w-96 text-amber-900" />
                </div>

                {/* Golden Wax Foil Stamp/Seal */}
                <div className={`absolute z-10 select-none pointer-events-none ${
                  certFormat === 'story916' ? 'top-4 right-4 scale-75 origin-top-right' : 'top-6 right-6 sm:top-8 sm:right-8'
                }`}>
                  <div className="relative flex items-center justify-center">
                    {/* Golden jagged rosette seal background */}
                    <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 shadow-md border-2 border-white animate-pulse opacity-95" />
                    {/* Inner gold concentric seal */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-300 flex flex-col items-center justify-center text-[7px] font-black text-amber-950 font-serif tracking-tighter uppercase leading-none shadow-inner">
                      <span className="text-[5.5px] font-bold text-amber-950/80">COMMUNITY</span>
                      <span className="text-[11px] my-0.5 font-sans font-black tracking-normal">
                        {certPercent !== null ? certPercent : (totalVotes > 0 ? (100 - getPercent(courtCase.votes.me)) : 92)}%
                      </span>
                      <span className="text-[5.5px] font-bold text-amber-950/85">
                        {certVerdict || "NOT GUILTY"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. TOP LAYING AREA */}
                <div className={`${certFormat === 'story916' ? 'space-y-1.5 pt-1' : 'contents'} shrink-0`}>
                  {/* Certificate Heading */}
                  <div className="space-y-1 pt-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-amber-600 text-[11px] sm:text-xs">⚖️</span>
                      <span className="block text-[8px] sm:text-[9.5px] uppercase tracking-[0.22em] font-mono font-bold text-amber-800">
                        BR COURT
                      </span>
                      <span className="text-amber-600 text-[11px] sm:text-xs">⚖️</span>
                    </div>
                    <h2 className="text-[9px] sm:text-[10.5px] text-[#A67C1E] tracking-[0.1em] font-serif uppercase font-bold italic leading-none">
                      — Community Decision —
                    </h2>
                  </div>

                  {/* Recipient Custom Name */}
                  {courtCase.recipientName && (
                    <div className="pt-1.5 pb-0.5 text-center animate-fadeIn select-all">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-[#B45309] font-black font-sans block mb-1">
                        THIS CREDENTIAL IS PROUDLY ISSUED TO
                      </span>
                      <span className={`font-black text-slate-950 tracking-wider font-serif px-6 block max-w-sm mx-auto border-b border-dashed border-[#C29B38]/30 pb-1 leading-tight ${
                        certFormat === 'story916' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
                      }`}>
                        {courtCase.recipientName}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. MIDDLE LAYING AREA */}
                <div className={`${certFormat === 'story916' ? 'space-y-3.5 my-auto flex flex-col items-center justify-center' : 'contents'} shrink-0`}>
                  {/* Shield Icon, Badge Header and ribbon block */}
                  <div className={`flex flex-col items-center animate-fadeIn ${
                    certFormat === 'story916' ? 'space-y-1.5 pt-0.5' : 'space-y-3 pt-2'
                  }`}>
                    {/* Custom Before Regret Emblem Logo matching user upload */}
                    <BeforeRegretLogo showText={false} size={certFormat === 'story916' ? 55 : 85} lightTheme={true} className="mb-0.5" />

                    {/* Title with decorative rays */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-amber-600/40 text-xs font-serif select-none">🗲</span>
                      <h3 className={`font-black tracking-widest text-[#1B2B3E] uppercase font-sans leading-none ${
                        certFormat === 'story916' ? 'text-lg' : 'text-xl sm:text-2xl'
                      }`}>
                        BR COURT CERTIFICATE
                      </h3>
                      <span className="text-amber-600/40 text-xs font-serif select-none">🗲</span>
                    </div>

                    {/* Highlighted prominent verdict box */}
                    <div className={`relative inline-block bg-gradient-to-r from-[#1E293B] to-[#334155] rounded-2xl border-2 border-[#C29B38] shadow-xl transform -skew-x-2 hover:skew-x-0 transition-transform duration-300 ${
                      certFormat === 'story916' ? 'px-6 py-2' : 'px-10 py-4'
                    }`}>
                      <span className={`font-black text-[#C29B38] uppercase tracking-[0.25em] block font-mono ${
                        certFormat === 'story916' ? 'text-[8.5px] mb-1' : 'text-[10px] sm:text-[11px] mb-1.5'
                      }`}>
                        PEER VERDICT DELIVERED
                      </span>
                      <span className={`font-extrabold text-white uppercase tracking-widest block font-sans px-3 ${
                        certFormat === 'story916' ? 'text-xl' : 'text-2xl sm:text-3xl'
                      }`}>
                        ★ {certVerdict || "NOT GUILTY"} ★
                      </span>
                    </div>
                  </div>

                  {/* Formal Statement & Quote decoration */}
                  <div className={`font-serif text-slate-800 leading-relaxed px-3 max-w-xl mx-auto ${
                    certFormat === 'story916' ? 'space-y-1 pt-0.5' : 'space-y-4 pt-2'
                  }`}>
                    <div className="max-w-md mx-auto space-y-0.5 py-0.5 text-center px-4 relative">
                      <span className="text-lg text-amber-500 font-serif leading-none block">“</span>
                      <p className={`font-semibold italic text-[#2F3E50] leading-relaxed max-w-sm mx-auto font-serif ${
                        certFormat === 'story916' ? 'text-[10.5px] line-clamp-3' : 'text-xs sm:text-sm'
                      }`}>
                        {certQuote}
                      </p>
                      <span className="text-lg text-amber-500 font-serif leading-none block">”</span>
                    </div>
                  </div>

                  {/* Two-column premium statistics table */}
                  <div className={`grid grid-cols-2 border-t border-b border-amber-700/10 max-w-xl mx-auto bg-stone-50/50 rounded-xl w-full ${
                    certFormat === 'story916' ? 'gap-2 py-2 px-3' : 'gap-4 py-5 px-4'
                  }`}>
                    <div className="flex flex-col items-center text-center space-y-0.5">
                      <div className={`rounded-full bg-[#E07A5F] flex items-center justify-center text-white shadow-sm shrink-0 ${
                        certFormat === 'story916' ? 'h-5.5 w-5.5' : 'h-7 w-7'
                      }`}>
                        <Users className={certFormat === 'story916' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                      </div>
                      <div className="leading-tight">
                        <span className="text-[7.5px] uppercase tracking-wider text-stone-500 block font-sans font-bold">REVIEWED BY</span>
                        <span className="text-xs font-black text-slate-800 font-sans block pt-0.5">
                          {(certJurors !== null ? certJurors : (totalVotes || 1284)).toLocaleString()}
                        </span>
                        <span className="text-[6.5px] uppercase tracking-widest text-[#B45309] font-bold block">RELATIONSHIP JURORS</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-0.5 border-l border-amber-700/10">
                      <div className={`rounded-full bg-[#4AA3A2] flex items-center justify-center text-white shadow-sm shrink-0 ${
                        certFormat === 'story916' ? 'h-5.5 w-5.5' : 'h-7 w-7'
                      }`}>
                        <Shield className={certFormat === 'story916' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                      </div>
                      <div className="leading-tight">
                        <span className="text-[7.5px] uppercase tracking-wider text-stone-500 block font-sans font-bold">CONFIDENCE</span>
                        <span className="text-xs font-black text-slate-800 font-sans block pt-0.5 uppercase">
                          {certConfidence}
                        </span>
                        <span className="text-[8px] text-amber-500 block mt-0.5 leading-none">★★★★★</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM FOOTER - PLACED SLIGHTLY HIGHER, ULTRA SHARP AND PROMINENT */}
                <div className={`flex flex-col items-center justify-center gap-1.5 mx-auto w-full relative shrink-0 ${
                  certFormat === 'story916' ? 'mb-4 pt-1.5' : 'pt-4'
                }`}>
                  <span className="text-[11px] md:text-xs uppercase tracking-[0.22em] text-[#5C2D11] font-black font-mono">
                    check my case on:
                  </span>
                  <div className="bg-[#090D12] text-[#F4B942] rounded-full px-8 py-3 shadow-lg border-2 border-[#C29B38] text-[10.5px] tracking-[0.3em] font-sans font-black select-all leading-none shrink-0 transform hover:scale-105 transition-all duration-200 uppercase">
                    BeforeRegret.com
                  </div>
                  <div className="flex items-center gap-2 mt-2 bg-amber-50 border-2 border-[#C29B38]/60 px-4 py-1.5 rounded-xl shadow-sm">
                    <span className="text-[10px] uppercase tracking-widest text-[#5C2D11] font-extrabold font-sans">
                      my case id:
                    </span>
                    <span className="font-mono text-slate-950 text-[10.5px] font-black tracking-wider bg-white px-3 py-1 rounded border border-amber-200 shadow-inner select-all">
                      {courtCase.caseNumber || 'CASE-C2011'}
                    </span>
                  </div>
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Cast Your Vote</h3>
          
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
                { label: "Both are wrong", key: 'both' },
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Community Opinions</h3>

            {/* Submit Argument Form */}
            <form id="argument-form" onSubmit={handleArgSubmit} className="space-y-3 bg-[#FAF8F2] p-3 rounded-xl border border-[#E5E7EB]">
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
              {courtCase.arguments.filter(arg => !reportedArguments.includes(arg.id)).map(arg => {
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
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 font-medium">
                       <button
                         type="button"
                         onClick={() => {
                           if (window.confirm("Are you sure you want to flag this opinion for safety review? It will be hidden immediately to comply with ad safety guidelines.")) {
                             setReportedArguments(prev => [...prev, arg.id]);
                           }
                         }}
                         className="text-zinc-400 hover:text-red-600 hover:underline cursor-pointer"
                       >
                         Report Issue
                       </button>
                       <div className="flex gap-3">
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
