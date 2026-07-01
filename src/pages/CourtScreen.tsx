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
  const [inviteCopied, setInviteCopied] = useState(false);
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
  
  const [partnerKeyValid, setPartnerKeyValid] = useState(true);
  const [partnerPinInput, setPartnerPinInput] = useState('');
  const [partnerPinConfirm, setPartnerPinConfirm] = useState('');
  const [partnerPinError, setPartnerPinError] = useState('');

  const [isPosterUnlocked, setIsPosterUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`poster_unlocked_${courtCase.slug}`) === 'true';
    }
    return false;
  });
  const [showSubmitterPinBox, setShowSubmitterPinBox] = useState(false);
  const [posterUnlockPin, setPosterUnlockPin] = useState('');
  const [posterUnlockError, setPosterUnlockError] = useState('');
  const [posterStatementText, setPosterStatementText] = useState('');
  const [partnerStatementText, setPartnerStatementText] = useState('');

  const handleUnlockPoster = () => {
    if (!courtCase.passwordPin) {
      setPosterUnlockError("This case has no PIN configured.");
      return;
    }
    if (posterUnlockPin === courtCase.passwordPin) {
      setIsPosterUnlocked(true);
      setPosterUnlockError('');
      if (typeof window !== 'undefined') {
        localStorage.setItem(`poster_unlocked_${courtCase.slug}`, 'true');
      }
    } else {
      setPosterUnlockError("Incorrect Submitter PIN.");
    }
  };

  const handleAddPosterStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterStatementText.trim()) return;
    const val = validateInputText(posterStatementText, "Statement");
    if (!val.isValid) {
      alert(val.error);
      return;
    }

    try {
      const newArg: CourtArgument = {
        id: 'official_' + Date.now().toString(),
        author: 'ME',
        side: 'Me',
        text: posterStatementText.trim(),
        votes: 0,
        role: 'Poster',
        isRealInput: true
      };

      const updatedCase: CourtCase = {
        ...courtCase,
        arguments: [newArg, ...(courtCase.arguments || [])]
      };

      await saveCourtCaseToFirestore(updatedCase);
      setPosterStatementText('');
      alert("✅ Your official submitter allegation/response has been published to the secure case log below!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit point to Firestore.");
    }
  };

  const handleAddPartnerStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerStatementText.trim()) return;
    const val = validateInputText(partnerStatementText, "Statement");
    if (!val.isValid) {
      alert(val.error);
      return;
    }

    try {
      const newArg: CourtArgument = {
        id: 'official_' + Date.now().toString(),
        author: 'Partner',
        side: 'Partner',
        text: partnerStatementText.trim(),
        votes: 0,
        role: 'Partner',
        isRealInput: true
      };

      const updatedCase: CourtCase = {
        ...courtCase,
        arguments: [newArg, ...(courtCase.arguments || [])]
      };

      await saveCourtCaseToFirestore(updatedCase);
      setPartnerStatementText('');
      alert("✅ Your official partner response/statement has been published to the secure case log below!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit point to Firestore.");
    }
  };

  const handleSavePartnerPin = async () => {
    if (partnerPinInput.length !== 4 || !/^\d+$/.test(partnerPinInput)) {
      setPartnerPinError("PIN must be exactly 4 digits.");
      return;
    }
    if (partnerPinInput !== partnerPinConfirm) {
      setPartnerPinError("PINs do not match.");
      return;
    }
    try {
      setPartnerPinError('');
      const updatedCase: CourtCase = {
        ...courtCase,
        partnerPasswordPin: partnerPinInput
      };
      await saveCourtCaseToFirestore(updatedCase);
      alert("🎉 Your 4-digit Partner Case PIN has been saved! You can now claim your certificate using this PIN if you are found not guilty.");
    } catch (err) {
      console.error(err);
      setPartnerPinError("Failed to save PIN to Firestore.");
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isInvite = params.get('partnerInvite') === 'true';
      setIsPartnerInvite(isInvite);
      if (isInvite) {
        setSelectedSide('Partner');
        if (courtCase.partnerKey) {
          const keyFromUrl = params.get('partnerKey');
          setPartnerKeyValid(keyFromUrl === courtCase.partnerKey);
        } else {
          setPartnerKeyValid(true);
        }
      } else {
        setPartnerKeyValid(true);
      }
    }
  }, [courtCase.slug, courtCase.partnerKey]);

  React.useEffect(() => {
    if (certificateUnlocked) {
      const blamedPercent = isPartnerInvite ? getPercent(courtCase.votes.partner) : getPercent(courtCase.votes.me);
      const voteCleanHands = totalVotes > 0 ? (100 - blamedPercent) : 92;
      setCertPercent(voteCleanHands);
      setCertJurors(totalVotes || 1284);
      
      const customQuoteText = voteCleanHands >= 80 
        ? `The Court finds your actions highly reasonable, your boundaries completely justified, and your standards pristine.` 
        : voteCleanHands >= 50 
          ? `The Court finds your boundaries justified and guides both parties to uphold respectful communications.`
          : `The Court identifies reasonable concern and recommends establishing healthier boundaries to avoid regret.`;
      setCertQuote(customQuoteText);
    }
  }, [certificateUnlocked, isPartnerInvite, courtCase.votes.me, courtCase.votes.partner]);

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

  const isViewerNotGuilty = isPartnerInvite 
    ? (currentVerdict() === 'Me' || currentVerdict() === 'Neither')
    : (currentVerdict() === 'Partner' || currentVerdict() === 'Neither');

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

  if (isPartnerInvite && !partnerKeyValid) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider font-sans">
          ⛔ Unauthorized Private Access
        </h2>
        <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
          This is a private, secure case link. If you are the partner, please request the exact secure invitation link containing the secret authorization key from the submitter.
        </p>
        <div className="pt-4">
          <button
            onClick={() => setScreen({ type: 'court_list' })}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow"
          >
            Go to Before Regret Cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Return Button */}
      <button
        onClick={() => setScreen({ type: 'court_list' })}
        className="text-xs text-[#6B7280] hover:text-[#24324A] inline-flex items-center gap-1 font-semibold border border-[#E5E7EB] bg-white px-3 py-1.5 rounded-xl transition-all hover:border-zinc-300 shadow-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Before Regret Cases
      </button>

      {/* MINIMAL COUNTDOWN TIMER ON TOP */}
      <div className={`rounded-xl border px-3 py-1 flex items-center justify-between gap-3 shadow-xs text-left ${
        isExpired 
          ? 'bg-zinc-50 border-zinc-200 text-zinc-500' 
          : 'bg-[#FFFDF4] border-[#E8D79B]/60 text-[#785E14] animate-fadeIn'
      }`}>
        <div className="flex items-center gap-2">
          {isExpired ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 font-mono uppercase bg-zinc-200/50 px-2 py-0.5 rounded border border-zinc-300">
              <Lock className="h-3 w-3" /> Sealed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#C9A227] font-mono uppercase bg-[#FFF8E1] px-2 py-0.5 rounded border border-[#E8D79B] animate-pulse">
              <Clock className="h-3 w-3" /> Live
            </span>
          )}
          <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-zinc-800">
            {getRemainingTimeText()}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono font-medium">
          Trial Duration: {deliberationDays < 1 ? "1 Min" : `${deliberationDays} Days`}
        </span>
      </div>

      {/* Admin overriding controls and Partner Setup */}
      {isAdmin && (
        <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-5 space-y-4 text-xs animate-fadeIn text-left">
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

            <div className="flex flex-col justify-end md:items-end space-y-1.5">
              <button
                type="button"
                onClick={async () => {
                  try {
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
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fadeIn text-left text-[#1E3A8A]">
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
          </div>
        </div>
      )}

      {isPartnerInvite && partnerKeyValid && !courtCase.partnerPasswordPin && (
        <div className="bg-[#FFFDF4] border-2 border-[#E8D79B] rounded-2xl p-5 space-y-4 shadow-md animate-fadeIn text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8E1] border border-[#E8D79B] text-[#C9A227] shrink-0">
              <Shield className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-900 font-sans flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#C9A227] animate-pulse" /> Secure Your Partner Access
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Please set your unique 4-digit Case PIN before contributing your side. This PIN secures your response anonymously and allows you to claim your Clean Hands Certificate if the jury declares you not guilty!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-md">
            <div>
              <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                Choose 4-Digit PIN:
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="e.g. 5821"
                value={partnerPinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPartnerPinInput(val);
                }}
                className="w-full bg-white border border-[#E8D79B] text-slate-950 text-xs px-3 py-2 rounded-lg font-mono focus:border-[#C9A227] focus:outline-none placeholder:text-zinc-400 font-bold placeholder:text-[10px]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                Confirm 4-Digit PIN:
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="Confirm PIN..."
                value={partnerPinConfirm}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPartnerPinConfirm(val);
                }}
                className="w-full bg-white border border-[#E8D79B] text-slate-950 text-xs px-3 py-2 rounded-lg font-mono focus:border-[#C9A227] focus:outline-none placeholder:text-zinc-400 font-bold placeholder:text-[10px]"
              />
            </div>
          </div>

          {partnerPinError && (
            <p className="text-[10.5px] text-rose-600 font-bold">
              ⚠️ {partnerPinError}
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSavePartnerPin}
              className="px-5 py-2 rounded-xl bg-[#24324A] hover:bg-[#1C273A] text-white font-extrabold text-xs uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer"
            >
              Save Secure PIN
            </button>
          </div>
        </div>
      )}

      {/* UNIFIED CASE DOSSIER & CLAIMS/DIALOGUE TIMELINE */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-xs space-y-4 text-left">
        {/* Dossier Header Info */}
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#FFF8E1] text-[#C9A227]">
              <Gavel className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#24324A] bg-[#FAF8F2] border border-[#E5E7EB] px-2 py-0.5 rounded shadow-2xs">The Relationship Court Case</span>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-zinc-900 text-[#F4B942] px-2.5 py-0.5 rounded border border-zinc-950 shadow-sm animate-pulse">
              {courtCase.caseNumber || 'CASE-C2011'}
            </span>
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

        {/* Case Title and Metadata */}
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-bold text-[#24324A] leading-snug font-serif">
            "{courtCase.title}"
          </h1>
          <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-sans font-medium">
            <span>Judge: @{courtCase.author}</span>
            <span>•</span>
            <span>Case Lodged: {courtCase.postTime}</span>
          </div>
        </div>

        {/* The Dialogue Thread */}
        <div className="space-y-3 pt-0.5">
          <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-2">
            <MessageSquare className="h-4 w-4 text-[#C9A227]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Case Dialogue & Timeline</h3>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {/* Highlighted original case description so it feels distinct, starting the timeline */}
            <div className="flex items-start gap-3 max-w-full animate-fadeIn border-b border-dashed border-zinc-200 pb-5 mb-3">
              <div className="flex-1 space-y-2 bg-gradient-to-r from-amber-50 to-orange-50/20 border-l-4 border-l-[#C9A227] border-y border-r border-[#E8D79B]/60 rounded-r-2xl rounded-l-md p-4 shadow-sm">
                <div className="flex items-center justify-between text-[10px] flex-wrap gap-1">
                  <span className="font-black text-[#8A6D1C] bg-[#FFF8E1] px-2.5 py-1 rounded border border-[#E8D79B] uppercase tracking-widest font-sans flex items-center gap-1.5">
                    ⚖️ Primary Case Allegation
                  </span>
                  <span className="text-zinc-500 font-bold font-mono uppercase tracking-wider">Lodged Core Case</span>
                </div>
                <p className="text-[#1E293B] leading-relaxed font-serif text-sm italic pr-1">
                  "{courtCase.description}"
                </p>
              </div>
            </div>

            {/* Map of rest of official arguments */}
            {(courtCase.arguments || [])
              .filter(arg => arg.role === 'Poster' || arg.role === 'Partner')
              .slice()
              .reverse() // Display chronologically from oldest to newest official arguments
              .map((arg) => {
                const isPoster = arg.role === 'Poster';
                return (
                  <div 
                    key={arg.id} 
                    className={`flex items-start gap-3 max-w-[85%] animate-fadeIn ${
                      isPoster ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className={`flex items-center gap-1.5 text-[10px] ${isPoster ? '' : 'justify-end'}`}>
                        <span className={`font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isPoster 
                            ? 'text-[#24324A] bg-[#24324A]/10' 
                            : 'text-[#B23B3B] bg-[#B23B3B]/10'
                        }`}>
                          {isPoster ? 'ME' : 'Partner'}
                        </span>
                        <span className="text-zinc-400 font-medium font-mono">Statement</span>
                      </div>
                      <div className={`rounded-2xl p-3.5 text-[#374151] shadow-sm leading-relaxed font-serif text-sm text-left ${
                        isPoster 
                          ? 'rounded-tl-none bg-[#FAF8F2] border border-[#24324A]/10' 
                          : 'rounded-tr-none bg-rose-50/50 border border-rose-100'
                      }`}>
                        "{arg.text}"
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>



        {/* INPUT BOX AREA (SECURE STATEMENTS) */}
        <div className="pt-4 border-t border-zinc-100">
          {!isPartnerInvite ? (
            /* POSTER (SUBMITTER) SECURE CONTROL & INPUT BOX */
            isPosterUnlocked ? (
              <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-left max-w-2xl mx-auto">
                <form onSubmit={handleAddPosterStatement} className="space-y-3 animate-fadeIn">
                  <p className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Submitter Controls Unlocked
                  </p>
                  <textarea
                    placeholder="Explain a new point, cite another boundary that was crossed, or write a direct rebuttal response to partner allegations..."
                    value={posterStatementText}
                    onChange={(e) => setPosterStatementText(e.target.value)}
                    maxLength={1000}
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] min-h-[85px] placeholder:text-[10px]"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-400 font-medium">Your entries will be tagged as "ME"</span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-[#24324A] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#1C273A] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add My Statement
                    </button>
                  </div>
                </form>
              </div>
            ) : !showSubmitterPinBox ? (
              <div className="text-center py-1">
                <button
                  type="button"
                  onClick={() => setShowSubmitterPinBox(true)}
                  className="text-[10px] text-[#24324A] hover:bg-[#24324A]/5 font-bold flex items-center gap-1.5 mx-auto transition-all px-2.5 py-1 rounded-lg border border-dashed border-[#24324A]/25 hover:border-[#24324A]/40 bg-white shadow-xs cursor-pointer"
                >
                  <Lock className="h-2.5 w-2.5" /> Submitter: Unlock to add statements
                </button>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/40 text-left max-w-sm mx-auto animate-fadeIn">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-[#24324A]" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#24324A]">
                      Submitter Verification
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSubmitterPinBox(false)}
                    className="text-[9px] text-zinc-500 hover:text-zinc-800 font-bold"
                  >
                    Hide
                  </button>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <p className="text-[10px] text-[#6B7280] leading-tight">
                    Enter your 4-digit PIN to add a statement or response:
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="PIN..."
                      value={posterUnlockPin}
                      onChange={(e) => setPosterUnlockPin(e.target.value.replace(/\D/g, ''))}
                      className="w-16 bg-white border border-zinc-200 text-slate-950 text-xs px-2 py-1 rounded font-mono focus:border-[#24324A] focus:outline-none placeholder:text-zinc-400 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleUnlockPoster}
                      className="px-2.5 py-1 rounded bg-[#24324A] hover:bg-[#1C273A] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                    >
                      Unlock
                    </button>
                  </div>
                  {posterUnlockError && (
                    <p className="text-[9px] text-rose-600 font-bold mt-1">⚠️ {posterUnlockError}</p>
                  )}
                </div>
              </div>
            )
          ) : (
            /* PARTNER SECURE INPUT BOX */
            <div className="space-y-3 p-4 rounded-xl border border-rose-100 bg-rose-50/20 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#B23B3B]/10 text-[#B23B3B]">
                  <Users className="h-3 w-3" />
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B23B3B]">
                  Partner Statement / Response
                </h4>
              </div>

              <form onSubmit={handleAddPartnerStatement} className="space-y-3 animate-fadeIn">
                <p className="text-[10.5px] text-rose-700 font-bold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Partner Access Authenticated
                </p>
                <textarea
                  placeholder="Explain your side of the story, highlight crucial relationship details, or write a direct rebuttal to the submitter's allegations..."
                  value={partnerStatementText}
                  onChange={(e) => setPartnerStatementText(e.target.value)}
                  maxLength={1000}
                  className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-rose-400 min-h-[85px]"
                  required
                />
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-rose-600 font-medium">Your entries will be tagged as "Partner"</span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#B23B3B] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#922D2D] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Partner Response
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: TRIBUNAL CLEAN HANDS CERTIFICATE */}
      {isExpired && isViewerNotGuilty && (
        <div className="relative rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm space-y-4 transition-all duration-300 animate-fadeIn text-left">
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

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
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
                  <div className="pt-1.5 pb-0.5 text-center animate-fadeIn select-all">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-[#B45309] font-black font-sans block mb-1">
                      THIS CREDENTIAL IS PROUDLY ISSUED TO
                    </span>
                    <span className={`font-black text-slate-950 tracking-wider font-serif px-6 block max-w-sm mx-auto border-b border-dashed border-[#C29B38]/30 pb-1 leading-tight ${
                      certFormat === 'story916' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
                    }`}>
                      {isPartnerInvite ? 'Anonymous Partner' : `@${courtCase.author}`}
                    </span>
                  </div>
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        
        {/* Left Side: Active Poll Voting */}
        <div className="md:col-span-5 rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Cast Your Verdict</h3>
          
          {(userVote || isExpired) ? (
            <div className="space-y-2.5">
              {isExpired ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-center text-[#9F5F1B] font-bold mb-1.5 flex items-center justify-center gap-1.5 shadow-xs">
                  <Lock className="h-4 w-4" strokeWidth="2.5" /> final deliberation results sealed!
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-center text-[#2E7D32] font-bold mb-1.5 flex items-center justify-center gap-1.5 shadow-xs">
                  <Check className="h-4 w-4" /> verdict registered! Current court breakdown:
                </div>
              )}

              {[
                { label: "Blame ME", key: 'me', val: courtCase.votes.me, color: 'bg-[#24324A]' },
                { label: "Blame Partner", key: 'partner', val: courtCase.votes.partner, color: 'bg-[#B23B3B]' },
                { label: "Blame Both equally", key: 'both', val: courtCase.votes.both, color: 'bg-[#C9A227]' },
                { label: "Blame Neither", key: 'neither', val: courtCase.votes.neither, color: 'bg-[#9CA3AF]' }
              ].map(opt => {
                const pct = getPercent(opt.val);
                return (
                  <div key={opt.key} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-medium text-[#6B7280]">
                      <span className={userVote === opt.key ? 'text-[#24324A] font-bold' : ''}>
                        {opt.label} {userVote === opt.key && ' (Your Vote)'}
                      </span>
                      <span className="text-[#1F2937] font-bold">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#FAF8F2] overflow-hidden border border-[#E5E7EB]">
                      <div className={`h-full ${opt.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#ECECEC] pt-2.5 text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Leading Perspective</span>
                <span className="text-sm font-bold text-[#C9A227] uppercase bg-[#FFF8E1] px-3 py-1 rounded border border-[#E8D79B] inline-block mt-1 font-mono">
                  {currentVerdict() === 'Me' ? 'I am at fault' : currentVerdict() === 'Partner' ? 'Partner at Fault' : currentVerdict() === 'Both' ? 'Both Share Blame' : 'Mutual Understanding / No Fault'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[#6B7280] leading-relaxed mb-2">Vote anonymously based purely on relationship rules and boundary violations:</p>
              {[
                { label: "I am wrong", key: 'me' },
                { label: "Partner is wrong", key: 'partner' },
                { label: "Both are wrong", key: 'both' },
                { label: "Neither are wrong (Just miscommunication)", key: 'neither' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => onVoteCourt(courtCase.slug, opt.key as any)}
                  className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-xs font-bold text-[#1F2937] hover:border-[#24324A] hover:bg-[#FAF8F2] transition-all flex items-center justify-between shadow-xs cursor-pointer"
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
        <div className="md:col-span-7 space-y-3">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-xs">

            {/* Submit Argument Form */}
            <form id="argument-form" onSubmit={handleArgSubmit} className="space-y-2.5 bg-[#FAF8F2] p-2.5 rounded-xl border border-[#E5E7EB]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-[#6B7280]">Who are you blaming? and Why?</span>
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
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] min-h-[70px] placeholder:text-[10px]"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#24324A] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#1C273A]"
                >
                  <Plus className="h-3.5 w-3.5" /> Register Opinion
                </button>
              </div>
            </form>

            {/* List Opinions */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courtCase.arguments.filter(arg => !reportedArguments.includes(arg.id) && arg.role !== 'Poster' && arg.role !== 'Partner').map(arg => {
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
