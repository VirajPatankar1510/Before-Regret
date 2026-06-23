import React, { useState, useEffect } from 'react';
import { Flag, ArrowLeft, MessageSquare, Search, Plus, Check, Clock, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { RedFlagCase, RedFlagComment } from '../types';

interface RedFlagMeterScreenProps {
  redFlagCases: RedFlagCase[];
  setScreen: (screen: { type: string; slug?: string }) => void;
  onVoteFlag: (caseId: string, flagType: 'green' | 'yellow' | 'red') => void;
  onAddFlagComment: (caseId: string, text: string) => void;
  onAddFlagCase: (title: string, description: string, category: 'Communication' | 'Exes & Socials' | 'Trust & Privacy' | 'Control & Habits' | 'Other') => void;
  userVotedFlags: { [caseId: string]: 'green' | 'yellow' | 'red' };
  currentUser?: any;
  onGoogleLogin?: () => void;
  initialCaseId?: string;
}

export default function RedFlagMeterScreen({
  redFlagCases,
  setScreen,
  onVoteFlag,
  onAddFlagComment,
  onAddFlagCase,
  userVotedFlags,
  currentUser,
  onGoogleLogin,
  initialCaseId
}: RedFlagMeterScreenProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCaseId(initialCaseId || null);
  }, [initialCaseId]);
  
  // Search and Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Submissions State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Communication' | 'Exes & Socials' | 'Trust & Privacy' | 'Control & Habits' | 'Other'>('Communication');
  
  // Comments State
  const [commentText, setCommentText] = useState('');

  const activeCase = redFlagCases.find(c => c.id === selectedCaseId);

  // Filtered List
  const filteredCases = redFlagCases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPercentages = (votes: { green: number; yellow: number; red: number }) => {
    const total = votes.green + votes.yellow + votes.red;
    if (total === 0) return { green: 33, yellow: 33, red: 34, total };
    
    const greenPct = Math.round((votes.green / total) * 100);
    const yellowPct = Math.round((votes.yellow / total) * 100);
    const redPct = 100 - greenPct - yellowPct; // ensure strict 100% sum
    
    return { green: greenPct, yellow: yellowPct, red: redPct, total };
  };

  const currentConsensus = (votes: { green: number; yellow: number; red: number }) => {
    const { green, yellow, red } = votes;
    if (green === 0 && yellow === 0 && red === 0) return 'Undecided';
    
    if (green > yellow && green > red) return '🟢 Safe / Green Flag';
    if (yellow > green && yellow > red) return '🟡 Caution / Yellow Flag';
    if (red > green && red > yellow) return '🔴 Unsafe / Red Flag';
    
    return '🟡 Conflicting Jury';
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    onAddFlagCase(newTitle.trim(), newDesc.trim(), newCategory);
    setNewTitle('');
    setNewDesc('');
    setIsSubmitOpen(false);
  };

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedCaseId) return;
    onAddFlagComment(selectedCaseId, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* HEADER BREADCRUMB */}
      <div className="flex items-center space-x-1.5 text-[11px] text-[#6B7280] select-none font-medium font-mono">
        <button onClick={() => setScreen({ type: 'home' })} className="hover:text-[#24324A] transition-colors">BeforeRegret</button>
        <span className="text-zinc-300">/</span>
        <span className="text-[#C9A227] font-semibold">Red Flag Meter</span>
      </div>

      {activeCase ? (
        /* ================= DETAIL VIEW ================= */
        <div className="space-y-6">
          <button
            onClick={() => setScreen({ type: 'red_flag_meter' })}
            className="text-xs text-[#6B7280] hover:text-[#24324A] inline-flex items-center gap-1.5 font-semibold border border-[#E5E7EB] bg-white px-3 py-1.5 rounded-xl transition-all hover:border-zinc-300 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Red Flag Meter Entries
          </button>

          {/* MAIN CARD DETAIL */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-[#F4F4F4] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-rose-50 text-rose-500">
                  <Flag className="h-4 w-4" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280] font-mono">
                  {activeCase.category} • {activeCase.caseNumber}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Added {activeCase.dateAdded}</span>
            </div>

            <h1 className="text-lg sm:text-2xl font-bold text-[#24324A] leading-snug font-serif">
              "{activeCase.title}"
            </h1>

            <p className="text-sm sm:text-base text-[#374151] leading-relaxed font-serif pl-3.5 border-l-3 border-rose-500 bg-rose-50/20 py-3 rounded-r-xl">
              {activeCase.description}
            </p>

            <div className="text-xs text-[#6B7280] font-medium">
              Submitted by: <span className="text-[#24324A] font-bold">@{activeCase.author}</span>
            </div>
          </div>

          {/* VOTE INTERACTIVE COMPONENT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: VOTING INTERACTIVITY */}
            <div className="lg:col-span-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] border-b border-[#F4F4F4] pb-2 font-mono">
                Flag Assessment
              </h3>

              {(() => {
                const votedType = userVotedFlags[activeCase.id];
                const stats = getPercentages(activeCase.votes);

                if (votedType) {
                  return (
                    <div className="space-y-5">
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5 shadow-xs">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" /> Your vote registered!
                      </div>

                      {/* Stacked single progress bar representing spectrum */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-mono">Flag Spectrum</label>
                        <div className="h-7 w-full rounded-2xl flex overflow-hidden border border-[#E5E7EB] shadow-xs">
                          {stats.green > 0 && (
                            <div 
                              className="bg-emerald-500 h-full flex items-center justify-center text-white text-[10px] font-extrabold transition-all duration-500"
                              style={{ width: `${stats.green}%` }}
                              title={`Green Flag: ${stats.green}%`}
                            >
                              {stats.green}%
                            </div>
                          )}
                          {stats.yellow > 0 && (
                            <div 
                              className="bg-amber-400 h-full flex items-center justify-center text-zinc-900 text-[10px] font-extrabold transition-all duration-500"
                              style={{ width: `${stats.yellow}%` }}
                              title={`Yellow Flag: ${stats.yellow}%`}
                            >
                              {stats.yellow}%
                            </div>
                          )}
                          {stats.red > 0 && (
                            <div 
                              className="bg-rose-500 h-full flex items-center justify-center text-white text-[10px] font-extrabold transition-all duration-500"
                              style={{ width: `${stats.red}%` }}
                              title={`Red Flag: ${stats.red}%`}
                            >
                              {stats.red}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Multi-line detailed results */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                          <span className="font-bold text-emerald-700 flex items-center gap-1">🟢 Green Flag</span>
                          <span className="font-mono text-zinc-700">{stats.green}% ({activeCase.votes.green} votes)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                          <span className="font-bold text-amber-700 flex items-center gap-1">🟡 Yellow Flag</span>
                          <span className="font-mono text-zinc-700">{stats.yellow}% ({activeCase.votes.yellow} votes)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-50/50 border border-rose-100">
                          <span className="font-bold text-rose-700 flex items-center gap-1">🔴 Red Flag</span>
                          <span className="font-mono text-zinc-700">{stats.red}% ({activeCase.votes.red} votes)</span>
                        </div>
                      </div>

                      <div className="bg-[#FAF8F5] border border-[#F0ECE5] rounded-xl p-3 text-center">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#6B7280] block font-mono">Community Verdict</span>
                        <div className="text-sm font-bold text-[#24324A] mt-1">
                          {currentConsensus(activeCase.votes)}
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-0.5 block">Based on {stats.total} total assessments</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-4">
                      <p className="text-xs text-[#6B7280] leading-relaxed">
                        Is this behavior healthy, slightly concerning, or a major relationship threat? Vote anonymously to establish community statistics.
                      </p>

                      <button
                        onClick={() => onVoteFlag(activeCase.id, 'green')}
                        className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-3 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                            🟢
                          </span>
                          <div className="text-left">
                            <span className="block text-xs font-bold text-[#24324A]">Green Flag</span>
                            <span className="block text-[10px] text-[#6B7280]">Totally normal, healthy, or innocent friendly behavior.</span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => onVoteFlag(activeCase.id, 'yellow')}
                        className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-3 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                            🟡
                          </span>
                          <div className="text-left">
                            <span className="block text-xs font-bold text-[#24324A]">Yellow Flag</span>
                            <span className="block text-[10px] text-[#6B7280]">Proceed with caution. Clear boundaries or discussions needed.</span>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => onVoteFlag(activeCase.id, 'red')}
                        className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-3 hover:border-rose-500 hover:bg-rose-50/30 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                            🔴
                          </span>
                          <div className="text-left">
                            <span className="block text-xs font-bold text-[#24324A]">Red Flag</span>
                            <span className="block text-[10px] text-[#6B7280]">Dealbreaker / high warning warning signs. Unhealthy behavior.</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }
              })()}
            </div>

            {/* RIGHT COLUMN: DISCUSSION BOARDS */}
            <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] border-b border-[#F4F4F4] pb-2 font-mono">
                Debating Comments ({activeCase.comments?.length || 0})
              </h3>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {activeCase.comments && activeCase.comments.length > 0 ? (
                  activeCase.comments.map(c => (
                    <div key={c.id} className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-sans font-semibold">
                        <span className="text-[#24324A]">@{c.author}</span>
                        <span>{c.date}</span>
                      </div>
                      <p className="text-[#374151] leading-relaxed">{c.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#6B7280] text-xs">
                    No assessments discussed yet. Be the first to explain your rationale!
                  </div>
                )}
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleCreateComment} className="border-t border-[#F0ECE5] pt-4 space-y-2">
                <textarea
                  placeholder="Share your reasoning behind your vote..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5E7EB] placeholder-zinc-400 focus:outline-none focus:border-[#24324A] focus:ring-2 focus:ring-[#24324A]/5 min-h-[60px]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400">Commenting anonymously</span>
                  <button
                    type="submit"
                    className="bg-[#24324A] hover:bg-[#1C273A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    Post Opinion
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIST MAIN SCREEN ================= */
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-[#E5E7EB] p-6 lg:p-8 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-rose-50 blur-3xl" />
            <div className="relative space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-3 py-0.5 text-[10px] font-bold text-rose-700 uppercase font-mono">
                <Flag className="h-3 w-3 text-rose-500 animate-pulse" /> Live Assessment Board
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24324A] tracking-tight leading-tight font-display">
                The Community <span className="text-rose-500">Red Flag Meter</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-medium">
                Dating culture can be complex. Paste relationship behaviors and let anonymous jurors vote whether it's a completely safe **Green Flag**, cautious **Yellow Flag**, or total **Red Flag**.
              </p>
            </div>
          </div>

          {/* SEARCH, CATEGORY FILTERS, SUBMIT BUTTON ROW */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Communication', 'Exes & Socials', 'Trust & Privacy', 'Control & Habits', 'Other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-rose-500 text-white border-rose-600' 
                      : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-zinc-300'
                  }`}
                >
                  {cat === 'All' ? '📌 All Topics' : cat}
                </button>
              ))}
            </div>

            {/* Submit Button & Search */}
            <div className="flex items-center gap-2">
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-[#9CA3AF]" />
                </span>
                <input
                  type="text"
                  placeholder="Search dilemmas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#1F2937] placeholder-zinc-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={() => setIsSubmitOpen(!isSubmitOpen)}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-[1.02] cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" /> Check Your Situation
              </button>
            </div>
          </div>

          {/* SUBMISSION FORM PANEL (IF EXPANDED) */}
          {isSubmitOpen && (
            <form onSubmit={handleCreateCase} className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/10 p-5 space-y-4 animate-slideDown">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1 uppercase font-mono">
                  <Sparkles className="h-4 w-4" /> File Warning Sign Assessment
                </span>
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-1">
                  <label className="text-[10px] text-[#6B7280] font-bold uppercase font-mono">Dilemma Behavior / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., My boyfriend refuses to delete his ex-girlfriend on instagram..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-[#E5E7EB] bg-white placeholder-zinc-400 font-serif font-semibold"
                  />
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] text-[#6B7280] font-bold uppercase font-mono">Behavior Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-[#E5E7EB] bg-white font-bold text-[#24324A]"
                  >
                    <option value="Communication">Communication</option>
                    <option value="Exes & Socials">Exes & Socials</option>
                    <option value="Trust & Privacy">Trust & Privacy</option>
                    <option value="Control & Habits">Control & Habits</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#6B7280] font-bold uppercase font-mono">Detailed Context / Interaction history</label>
                <textarea
                  required
                  placeholder="Provide essential backstory. Are they being sneaky? Does it happen recurrently? How long have you been dating? This helps jurors understand the complete dynamics."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5E7EB] bg-white placeholder-zinc-400 min-h-[100px] leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-[#6B7280]">
                  Your post will be randomized under a preselected case number immediately.
                </span>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Open Jury Voting
                </button>
              </div>
            </form>
          )}

          {/* CRITICAL FLAGS GRID LISTING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCases.length > 0 ? (
              filteredCases.map(c => {
                const stats = getPercentages(c.votes);
                const hasVoted = !!userVotedFlags[c.id];

                return (
                  <div 
                    key={c.id} 
                    onClick={() => setScreen({ type: 'red_flag_meter', slug: c.id })}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-4.5 space-y-3 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase font-mono">
                        <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50">
                          {c.category}
                        </span>
                        <span>{c.caseNumber}</span>
                      </div>

                      <h3 className="text-sm font-bold text-[#24324A] group-hover:text-rose-600 transition-colors leading-snug font-serif line-clamp-2">
                        "{c.title}"
                      </h3>

                      <p className="text-xs text-[#6B7280] font-sans font-medium line-clamp-3">
                        {c.description}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-[#FAF8F5] pt-3 mt-1">
                      {/* Interactive miniature preview flag meter */}
                      <div className="relative">
                        <div className="h-2 w-full rounded-md bg-[#F4F1E8] flex overflow-hidden border border-[#ECEAEA]">
                          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.green}%` }} />
                          <div className="bg-amber-400 h-full transition-all" style={{ width: `${stats.yellow}%` }} />
                          <div className="bg-rose-500 h-full transition-all" style={{ width: `${stats.red}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-[#6B7280] font-bold pt-1.5 font-mono">
                          <span className="text-rose-600">🔴 {stats.red}% Red</span>
                          <span className="text-emerald-700">🟢 {stats.green}% Green</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-medium pt-1">
                        <span className="text-[#24324A] font-bold flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-zinc-400" /> {c.comments?.length || 0} opinions
                        </span>
                        <span className="text-xs font-bold text-rose-500 uppercase flex items-center gap-1">
                          {hasVoted ? '✓ assessed' : 'Vote now'} ➔
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 rounded-2xl border border-[#E5E7EB] bg-white text-[#6B7280] text-xs">
                No flagged situations match your criteria found. Be the first to register a behavior!
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
