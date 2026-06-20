import React, { useState } from 'react';
import { X, Flag, MessageSquare, ShieldCheck, Heart, User, Clock, Search, ExternalLink, Activity, Info, Sparkles, HelpCircle } from 'lucide-react';
import { Story, RedFlagCase, UserProfile } from '../types';

interface MySubmissionsLedgerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  stories: Story[];
  redFlagCases: RedFlagCase[];
  setScreen: (screen: { type: string; slug?: string }) => void;
  onSelectStory?: (storyId: string) => void;
}

export default function MySubmissionsLedger({
  isOpen,
  onClose,
  user,
  stories,
  redFlagCases,
  setScreen,
  onSelectStory
}: MySubmissionsLedgerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'red_flags' | 'stories'>('all');

  if (!isOpen) return null;

  // Gather user-submitted items
  const userStories = stories.filter(s => {
    const isIdMatch = user.submittedStories?.includes(s.id);
    const isAuthorMatch = s.userName === user.username;
    return isIdMatch || isAuthorMatch;
  });

  const userRedFlags = redFlagCases.filter(r => {
    const isIdMatch = user.submittedRedFlags?.includes(r.id);
    const isAuthorMatch = r.author === user.username;
    return isIdMatch || isAuthorMatch;
  });

  const getPercentages = (votes: { green: number; yellow: number; red: number }) => {
    const total = votes.green + votes.yellow + votes.red;
    if (total === 0) return { green: 0, yellow: 0, red: 0, total };
    
    const greenPct = Math.round((votes.green / total) * 100);
    const yellowPct = Math.round((votes.yellow / total) * 100);
    const redPct = 100 - greenPct - yellowPct;
    
    return { green: greenPct, yellow: yellowPct, red: redPct, total };
  };

  const getConsensusLabel = (votes: { green: number; yellow: number; red: number }) => {
    const total = votes.green + votes.yellow + votes.red;
    if (total === 0) return 'Pending assessments';
    
    const { green, yellow, red } = votes;
    if (green > yellow && green > red) return '🟢 Safe Consensus';
    if (yellow > green && yellow > red) return '🟡 Caution Consensus';
    if (red > green && red > yellow) return '🔴 Red Flag Advisory';
    
    return '🟡 Divided Jury';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background backing shadow backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#121A26]/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn" 
      />

      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 text-center">
        {/* Modal Main Frame */}
        <div className="relative transform overflow-hidden rounded-3xl bg-white border border-[#E5E7EB] text-left shadow-2xl transition-all w-full max-w-4xl p-5 sm:p-7 space-y-6 my-8 animate-scaleIn">
          
          {/* Top Title Section */}
          <div className="flex items-start justify-between border-b border-[#F4F4F4] pb-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-[#C9A227] tracking-widest font-mono flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> SECURE USER REPOSITORY
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#24324A] font-display">
                Anonymous Submission Ledger
              </h2>
              <p className="text-xs text-[#6B7280]">
                Verifiable logs of your lodged relationship behavior assessments and regret outcome timelines.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="rounded-xl border border-[#E5E7EB] p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all shadow-xs cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Quick Metrics Headroom */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F2] border border-[#EBE8DF] p-3.5 rounded-2xl">
            <div className="text-center p-2 rounded-xl bg-white/65">
              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">Dating Persona</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#24324A] block mt-0.5">@{user.username}</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/65">
              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">Outcome Logs</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#24324A] block mt-0.5">{userStories.length} cases</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/65">
              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">Red Flag Audits</span>
              <span className="text-xs sm:text-sm font-extrabold text-[#24324A] block mt-0.5">{userRedFlags.length} cases</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/65">
              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block font-mono">My Account Badges</span>
              <div className="flex flex-wrap justify-center gap-1.5 mt-1.5">
                {user.badges && user.badges.length > 0 ? (
                  user.badges.slice(0, 2).map(b => (
                    <span key={b} className="text-[8px] bg-[#C9A227]/10 text-[#C9A227] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      {b}
                    </span>
                  ))
                ) : (
                  <span className="text-[8px] text-zinc-400 font-semibold font-sans">Incognito Seeker</span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-[#E5E7EB]">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 px-4 text-xs font-extrabold transition-all border-b-2 ${
                activeTab === 'all' 
                  ? 'border-[#24324A] text-[#24324A]' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              All My Cases ({userStories.length + userRedFlags.length})
            </button>
            <button
              onClick={() => setActiveTab('red_flags')}
              className={`pb-2.5 px-4 text-xs font-extrabold transition-all border-b-2 ${
                activeTab === 'red_flags' 
                  ? 'border-rose-500 text-rose-500' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              🚩 Warning Signs ({userRedFlags.length})
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`pb-2.5 px-4 text-xs font-extrabold transition-all border-b-2 ${
                activeTab === 'stories' 
                  ? 'border-[#C9A227] text-[#C9A227]' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              📖 Outcome Registry ({userStories.length})
            </button>
          </div>

          {/* Ledger Lists Content Section */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            
            {activeTab !== 'stories' && userRedFlags.length > 0 && (
              <div className="space-y-3">
                {activeTab === 'all' && (
                  <h3 className="text-[10px] font-bold tracking-widest text-[#6B7280] uppercase font-mono px-1">
                    Red Flag Assessment Cases ({userRedFlags.length})
                  </h3>
                )}
                {userRedFlags.map(rf => {
                  const s = getPercentages(rf.votes);
                  const consensusObj = getConsensusLabel(rf.votes);
                  return (
                    <div 
                      key={rf.id}
                      onClick={() => {
                        setScreen({ type: 'red_flag_meter', slug: rf.id });
                        onClose();
                      }}
                      className="group relative rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3 hover:border-rose-300 hover:bg-[#FFF5F5]/10 hover:shadow-xs transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-rose-50 border border-rose-100 text-rose-600 rounded-md py-0.5 px-2 font-mono font-bold uppercase">
                          {rf.category} • {rf.caseNumber || 'FLAG'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold font-sans">
                          {rf.dateAdded} <Clock className="h-3 w-3" />
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-[#24324A] group-hover:text-rose-600 transition-colors font-serif leading-snug">
                        "{rf.title}"
                      </h4>

                      <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                        {rf.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#FAF8F5]">
                        <div className="flex items-center gap-3 text-xs">
                          {s.total > 0 ? (
                            <div className="flex items-center gap-2">
                              {/* Horizontal miniature gauge visualizer */}
                              <div className="h-2 w-20 rounded bg-[#E5E7EB] flex overflow-hidden border border-[#D1D5DB]/30 shrink-0">
                                <div className="bg-emerald-500 h-full" style={{ width: `${s.green}%` }} />
                                <div className="bg-amber-400 h-full" style={{ width: `${s.yellow}%` }} />
                                <div className="bg-rose-500 h-full" style={{ width: `${s.red}%` }} />
                              </div>
                              <span className="font-bold text-[#24324A] text-[11px] font-mono">
                                {consensusObj} ({s.total} votes)
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1 font-semibold">
                              ⌛ Awaiting community jury verdicts
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-3 text-[11px]">
                          <span className="text-[#24324A] font-bold flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-zinc-400" /> {rf.comments?.length || 0} opinions
                          </span>
                          <span className="text-rose-500 font-bold group-hover:underline inline-flex items-center gap-0.5">
                            Focus Thread <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab !== 'red_flags' && userStories.length > 0 && (
              <div className="space-y-3 pt-1">
                {activeTab === 'all' && (
                  <h3 className="text-[10px] font-bold tracking-widest text-[#6B7280] uppercase font-mono px-1">
                    Outcome timelines & advice registries ({userStories.length})
                  </h3>
                )}
                {userStories.map(story => (
                  <div 
                    key={story.id}
                    onClick={() => {
                      if (onSelectStory) {
                        onSelectStory(story.id);
                      } else {
                        setScreen({ type: 'situation', slug: story.situationSlug });
                      }
                      onClose();
                    }}
                    className="group relative rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3 hover:border-[#C9A227]/40 hover:bg-[#FAF8F2]/20 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] bg-amber-50 border border-amber-100/50 text-[#C9A227] rounded-md py-0.5 px-2 font-mono font-bold uppercase">
                        SITUATION: {story.situationSlug.replace('-', ' ')} • {story.caseNumber || 'STORY'}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold font-sans">
                        {story.dateAdded} <Clock className="h-3 w-3" />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-[#24324A] group-hover:text-[#C9A227] transition-colors font-serif leading-snug">
                      "{story.title}"
                    </h4>

                    <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                      {story.fullStory}
                    </p>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#FAF8F5] text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#24324A] flex items-center gap-1 font-mono">
                          🟢 {story.decisionMade} decision
                        </span>
                        <span>•</span>
                        <span className="text-[#2E7D32] bg-[#2E7D32]/5 border border-[#2E7D32]/10 px-1.5 py-0.5 rounded font-bold font-mono">
                          {story.regretScore}/10 Regret
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-semibold">
                        <span className="text-[#24324A] font-bold flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-zinc-400 group-hover:text-rose-400 transition-colors" /> {story.helpfulVotes} useful
                        </span>
                        <span className="text-[#C9A227] font-bold group-hover:underline inline-flex items-center gap-0.5">
                          View Case <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty States */}
            {activeTab === 'all' && userStories.length === 0 && userRedFlags.length === 0 && (
              <div className="text-center py-12 bg-[#FAF8F5] border border-dashed border-zinc-200 rounded-2xl p-6 space-y-3">
                <Info className="h-8 w-8 text-zinc-300 mx-auto" />
                <h4 className="text-xs font-bold text-[#24324A]">No Submissions Tracked Yet</h4>
                <p className="text-[11px] text-[#6B7280] max-w-sm mx-auto">
                  When you submit relationship behavior warning signs to the **Red Flag Meter** or archive your outcome reports to the **Registry**, they will be logged here securely and anonymously so you can track feedback!
                </p>
                <div className="pt-2 flex justify-center gap-2.5">
                  <button 
                    onClick={() => { setScreen({ type: 'red_flag_meter' }); onClose(); }}
                    className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    🚩 File Red Flag Dilemma
                  </button>
                  <button 
                    onClick={() => { setScreen({ type: 'submit_story' }); onClose(); }}
                    className="text-[10px] bg-[#24324A] hover:bg-[#1C273A] text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    📖 Share Registry Timeline
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'red_flags' && userRedFlags.length === 0 && (
              <div className="text-center py-10 bg-[#FAF8F5] border border-dashed border-zinc-200 rounded-2xl">
                <p className="text-xs text-[#6B7280]">You haven't requested any Red Flag Meter community assessments yet.</p>
                <button 
                  onClick={() => { setScreen({ type: 'red_flag_meter' }); onClose(); }}
                  className="mt-3 text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl"
                >
                  Check Situation Warn Signs
                </button>
              </div>
            )}

            {activeTab === 'stories' && userStories.length === 0 && (
              <div className="text-center py-10 bg-[#FAF8F5] border border-dashed border-zinc-200 rounded-2xl">
                <p className="text-xs text-[#6B7280]">You haven't archived an Outcome / Regret story timeline yet.</p>
                <button 
                  onClick={() => { setScreen({ type: 'submit_story' }); onClose(); }}
                  className="mt-3 text-[10px] bg-[#24324A] hover:bg-[#1C273A] text-white font-bold px-3 py-1.5 rounded-xl"
                >
                  Contribute Outcome Story
                </button>
              </div>
            )}

          </div>

          {/* Footer Ledger Warning */}
          <div className="border-t border-[#F4F4F4] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              🔒 Local Cryptological Profile persistent through active storage.
            </span>
            <span className="text-zinc-500 font-semibold uppercase tracking-wider">
              BeforeRegret Platform Ledger
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
