import React, { useState } from 'react';
import { Gavel, Users, Clock, Vote, Check, ShieldAlert, Award, MessageSquare, Plus, ArrowLeft, Shield, Trash2 } from 'lucide-react';
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

      {/* COURT POLL / VOTE OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Active Poll Voting */}
        <div className="md:col-span-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Cast Your Jury Perspective</h3>
          
          {userVote ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-center text-[#2E7D32] font-bold mb-2 flex items-center justify-center gap-1.5 shadow-sm">
                <Check className="h-4 w-4" /> verdict registered! Current court breakdown:
              </div>

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
                  className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-3 text-xs font-bold text-[#1F2937] hover:border-[#24324A] hover:bg-[#FAF8F2] transition-all flex items-center justify-between shadow-sm"
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
