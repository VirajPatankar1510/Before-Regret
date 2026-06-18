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
        className="text-xs text-[#AAB2C0] hover:text-white inline-flex items-center gap-1 font-semibold border border-[#30363D] bg-[#161B22] px-3 py-1.5 rounded-xl transition-all hover:border-zinc-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Courtroom Entries
      </button>

      {/* Primary Dilemma header */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-md space-y-4">
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-2.5 mb-2 text-xs">
            <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <Shield className="h-3.5 w-3.5 text-[#F4B942] animate-pulse" /> Court Case Override Console
            </span>
            {showCaseDeleteConfirm ? (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-red-400 font-bold font-mono text-[11px]">Permanently delete trial?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCourtCase?.(courtCase.slug);
                    setScreen({ type: 'home' });
                  }}
                  className="px-2.5 py-1 rounded bg-red-500 text-white font-extrabold text-[10px] transition-all"
                >
                  Yes, Delete Case
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaseDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded bg-zinc-650 text-white font-bold text-[10px] transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCaseDeleteConfirm(true)}
                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Court Case
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#F4B942]/15 text-[#F4B942]">
            <Gavel className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#F4B942]">Relationship Court Trials</span>
        </div>
        
        <h1 className="text-lg sm:text-xl font-black text-white leading-snug">
          "{courtCase.title}"
        </h1>

        <div className="flex items-center gap-3 text-[11px] text-[#AAB2C0]">
          <span>Judge: @{courtCase.author}</span>
          <span>•</span>
          <span>Case Lodged: {courtCase.postTime}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{totalVotes.toLocaleString()} jurors voted</span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-serif pl-1 border-l-2 border-zinc-700">
          {courtCase.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {courtCase.tags.map(t => (
            <span key={t} className="text-[10px] font-semibold text-[#AAB2C0] bg-[#30363D]/30 border border-[#30363D] px-2 py-0.5 rounded">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* COURT POLL / VOTE OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Active Poll Voting */}
        <div className="md:col-span-5 rounded-2xl border border-[#30363D] bg-[#161B22] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Cast Your Jury Verdict</h3>
          
          {userVote ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/35 p-3 text-xs text-center text-emerald-400 font-semibold mb-2 flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" /> verdict registered! Current court breakdown:
              </div>

              {[
                { label: "Blame Me (Poster)", key: 'me', val: courtCase.votes.me, color: 'bg-[#4F8CFF]' },
                { label: "Blame Partner", key: 'partner', val: courtCase.votes.partner, color: 'bg-[#FF5D5D]' },
                { label: "Blame Both equally", key: 'both', val: courtCase.votes.both, color: 'bg-[#F4B942]' },
                { label: "Blame Neither", key: 'neither', val: courtCase.votes.neither, color: 'bg-[#AAB2C0]' }
              ].map(opt => {
                const pct = getPercent(opt.val);
                return (
                  <div key={opt.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#AAB2C0]">
                      <span className={userVote === opt.key ? 'text-white font-extrabold' : ''}>
                        {opt.label} {userVote === opt.key && ' (Your Vote)'}
                      </span>
                      <span className="text-white">{pct}% ({opt.val})</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#0D1117] overflow-hidden">
                      <div className={`h-full ${opt.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#30363D] pt-3 text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Leading Jury Verdict</span>
                <span className="text-sm font-black text-[#F4B942] uppercase bg-[#F4B942]/10 px-3 py-1 rounded border border-[#F4B942]/20 inline-block mt-1">
                  {currentVerdict() === 'Me' ? 'Guilty Me' : currentVerdict() === 'Partner' ? 'Guilty Partner' : currentVerdict() === 'Both' ? 'Equally Culpable' : 'No Crime committed'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[#AAB2C0] leading-relaxed mb-3">Vote anonymously based purely on relationship rules and boundary violations:</p>
              {[
                { label: "I am wrong", key: 'me' },
                { label: "Partner is wrong", key: 'partner' },
                { label: "Both are wrong (Culpable of friction)", key: 'both' },
                { label: "Neither are wrong (Just miscommunication)", key: 'neither' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => onVoteCourt(courtCase.slug, opt.key as any)}
                  className="w-full text-left rounded-xl border border-[#30363D] bg-[#161B22] p-3 text-xs font-semibold text-white hover:border-[#4F8CFF] hover:bg-[#30363D] transition-all flex items-center justify-between"
                  id={`court-vote-${opt.key}`}
                >
                  <span>{opt.label}</span>
                  <Vote className="h-4 w-4 text-[#AAB2C0] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Juror Arguments List & Input */}
        <div className="md:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Jury Deliberation Opinions</h3>

            {/* Submit Argument Form */}
            <form onSubmit={handleArgSubmit} className="space-y-3 bg-[#0D1117] p-3 rounded-xl border border-[#30363D]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-[#AAB2C0]">Who are you blaming?</span>
                <div className="flex gap-1 text-[10px]">
                  {['Me', 'Partner', 'Both', 'Neither'].map(side => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setSelectedSide(side as any)}
                      className={`px-2.5 py-1 rounded font-bold border ${
                        selectedSide === side ? 'bg-[#F4B942]/15 border-[#F4B942] text-white' : 'bg-[#161B22] border-transparent text-[#AAB2C0]'
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
                className="w-full rounded-xl border border-[#30363D] bg-[#161B22] p-2.5 text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#F4B942] text-zinc-900 px-3.5 py-1.5 text-xs font-black hover:bg-[#F4B942]/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Register Argument
                </button>
              </div>
            </form>

            {/* List Opinions */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courtCase.arguments.map(arg => {
                const badgeColor = 
                  arg.side === 'Me' ? 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/20' :
                  arg.side === 'Partner' ? 'bg-[#FF5D5D]/10 text-[#FF5D5D] border-[#FF5D5D]/20' :
                  arg.side === 'Both' ? 'bg-[#F4B942]/10 text-[#F4B942] border-[#F4B942]/20' :
                  'bg-zinc-700/10 text-zinc-300 border-zinc-700/20';

                return (
                  <div key={arg.id} className="rounded-xl border border-[#30363D] bg-[#0E131B] p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="font-bold text-white">@{arg.author}</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded">
                          {arg.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${badgeColor}`}>
                          Blamed: {arg.side}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteArgument?.(courtCase.slug, arg.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-1 rounded-md transition-colors"
                            title="Moderator: Delete opinion"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[#AAB2C0] leading-relaxed font-serif text-[12.5px]">"{arg.text}"</p>
                    <div className="flex justify-end gap-3 text-[10px] text-zinc-500 mt-2">
                       <span>Was this analysis helpful?</span>
                       <button 
                         type="button"
                         onClick={() => alert("Opinion upvoted!")}
                         className="text-[#4F8CFF] hover:underline"
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
