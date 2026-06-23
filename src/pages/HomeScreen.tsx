import React, { useState } from 'react';
import { Search, Flame, AlertTriangle, ShieldCheck, Heart, Sparkles, MessageSquare, ChevronRight, TrendingUp, Gavel, Globe, Users, Clock, HelpCircle, Compass, BarChart3, Star, ArrowRight } from 'lucide-react';
import { Situation, Story, CourtCase, Question } from '../types';
import { MOST_REGRETTED_DECISIONS, MOST_SUCCESSFUL_DECISIONS, POPULAR_SEARCHES, PRESEEDED_SITUATIONS } from '../data/mockData';
import AdSenseWidget from '../components/AdSenseWidget';

interface HomeScreenProps {
  situations: Situation[];
  courtCases: CourtCase[];
  questions: Question[];
  latestStories: Story[];
  setScreen: (screen: { type: string; slug?: string }) => void;
  onCaseRetrieve?: (caseNum: string) => void;
}

export default function HomeScreen({ situations, courtCases, questions, latestStories, setScreen, onCaseRetrieve }: HomeScreenProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    
    // Intercept Case Reference IDs typed in landing search bar (e.g. CASE-S1234, S1234, C2002, F3001, 8583)
    const isCaseQuery = query.toUpperCase().startsWith('CASE-') || 
                        /^[SCF]\d+$/i.test(query) || 
                        (/^\d+$/.test(query) && query.length >= 4);

    if (isCaseQuery && onCaseRetrieve) {
      onCaseRetrieve(query);
      setSearchInput('');
      return;
    }
    
    // Check if the query matches any PRESEEDED_SITUATIONS directly by name
    const queryLower = query.toLowerCase();
    const matchedSituation = PRESEEDED_SITUATIONS.find(s => 
      s.name.toLowerCase().includes(queryLower) || s.slug.toLowerCase().includes(queryLower)
    );

    if (matchedSituation) {
      setScreen({ type: 'situation', slug: matchedSituation.slug });
    } else {
      // Redirect to explore page with search filter
      setScreen({ type: 'explore', slug: query });
    }
  };

  const getRegretLevelString = (score: number) => {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Moderate';
    return 'Low';
  };

  const getRegretColor = (score: number) => {
    if (score >= 8) return 'text-[#C0392B] bg-[#C0392B]/5 border-[#C0392B]/10';
    if (score >= 6) return 'text-[#D97706] bg-[#D97706]/5 border-[#D97706]/10';
    return 'text-[#2E7D32] bg-[#2E7D32]/5 border-[#2E7D32]/10';
  };

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* SECTION 1: HERO CONTAINER */}
      <section className="relative rounded-3xl bg-white border border-[#E5E7EB] py-14 px-6 text-center overflow-hidden shadow-sm">
        
        {/* Absolute Background Accent Radial glows */}
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#24324A]/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[#C9A227]/5 blur-3xl" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#24324A]/5 border border-[#24324A]/10 px-3 py-1 text-[11px] font-bold text-[#24324A]">
            <Sparkles className="h-3 w-3 text-[#C9A227]" /> Learn From Those Who Already Lived Your Choice.
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#060606] tracking-tight leading-tight select-none font-display">
            What Relationship Decision Are You <span className="text-[#C9A227]">Struggling With?</span>
          </h1>

          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed max-w-2xl mx-auto font-medium">
            Explore relationship outcomes and regrets before making a decision you'll live with for years.
          </p>

          {/* Large Hero Search bar input */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mt-4 space-y-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <input
                type="text"
                placeholder="My boyfriend doesn't want marriage..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-white py-4 pl-11 pr-4 text-xs sm:text-sm text-[#1F2937] placeholder-zinc-400 focus:border-[#24324A] focus:outline-none focus:ring-4 focus:ring-[#24324A]/5 transition-all text-left shadow-inner"
              />
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full sm:w-auto min-w-[200px] rounded-xl bg-[#24324A] hover:bg-[#1C273A] py-3.5 px-6 text-xs sm:text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md shadow-zinc-200 active:scale-95"
              >
                Search Outcomes
              </button>
            </div>
          </form>

          {/* Popular Searches triggers */}
          <div className="pt-2 text-xs text-left max-w-xl mx-auto">
            <span className="text-[#6B7280] font-bold block mb-1.5 text-[10px] uppercase tracking-wider">Popular Searches:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCHES.map(term => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchInput(term);
                    setScreen({ type: 'situation', slug: term.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '') });
                  }}
                  className="rounded-lg bg-[#F4F1E8] border border-[#E5E7EB] px-2.5 py-1 text-[11px] text-[#6B7280] hover:text-[#24324A] hover:border-[#24324A] hover:bg-white transition-all font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* SECTION: RED FLAG METER PROMO BANNER */}
      <section 
        onClick={() => setScreen({ type: 'red_flag_meter' })}
        className="rounded-2xl border-2 border-dashed border-rose-200 bg-gradient-to-r from-rose-50/50 to-amber-50/30 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all animate-fadeIn"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 bg-rose-500 text-white rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono">
            🔥 Fresh Release
          </div>
          <h2 className="text-lg font-extrabold text-[#24324A] font-display">
            The Community <span className="text-rose-500">Red Flag Meter</span>
          </h2>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-2xl font-medium">
            "My boyfriend still talks to his ex every day." Green Flag? Yellow Flag? Red Flag? Cast anonymous assessments and evaluate live consensus statistics on questionable dating behaviors.
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScreen({ type: 'red_flag_meter' });
          }}
          className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all shadow-sm shrink-0 uppercase tracking-widest font-mono"
        >
          Check warning flags <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* Google Ad Unit */}
      <AdSenseWidget slot="2666879134" />

      {/* SECTION 3: TRENDING SITUATIONS CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#24324A] flex items-center gap-2">
              <Flame className="h-5 w-5 text-[#C0392B]" /> Trending Relationship Situations
            </h2>
            <p className="text-xs text-[#6B7280]">Compare metrics of individuals who faced identical crises recently.</p>
          </div>
          <button
            onClick={() => setScreen({ type: 'explore' })}
            className="text-xs font-bold text-[#24324A] hover:underline flex items-center gap-0.5"
          >
            All Situations <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESEEDED_SITUATIONS.map(situation => (
            <div
              key={situation.slug}
              onClick={() => setScreen({ type: 'situation', slug: situation.slug })}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-5 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
              id={`situation-card-${situation.slug}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#24324A] bg-[#24324A]/5 px-2 py-0.5 rounded">
                  {situation.category}
                </span>
                <h3 className="text-sm font-bold text-[#1F2937] pt-1 line-clamp-2 leading-snug">{situation.name}</h3>
                <p className="text-[11px] text-[#6B7280] line-clamp-3 leading-relaxed mt-1.5">{situation.description}</p>
              </div>

              <div className="border-t border-[#ECECEC] mt-4 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280] font-medium">Avg Regret Ratio</span>
                  <span className={`px-2 py-0.5 border rounded-lg text-[10px] font-black ${getRegretColor(situation.stats.avgRegret)}`}>
                    {situation.stats.avgRegret}/10 ({getRegretLevelString(situation.stats.avgRegret)})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: DECISION RANKINGS: REGRETTED VS SUCCESSFUL */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Most Regret Cards */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4">
          <div>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#C0392B]/10 text-[#C0392B]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-[#24324A] block mt-2 font-display">Most Regretted Decisions</h3>
            <p className="text-xs text-[#6B7280]">Actions that resulted in the highest statistical grief over a 5-year log cycle.</p>
          </div>

          <div className="space-y-2.5">
            {MOST_REGRETTED_DECISIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setScreen({ type: 'tag', slug: item.title.toLowerCase().replace(/\s+/g, '-') })}
                className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white hover:border-[#C0392B]/30 transition-all shadow-sm"
                id={`regret-decision-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#C0392B]">#0{idx+1}</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#1F2937]">{item.title}</h4>
                    <p className="text-[10px] text-[#6B7280] leading-normal">{item.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Regret Level</span>
                  <span className="text-xs font-black text-[#C0392B]">{item.avgRegret}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Successful Decisions */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] space-y-4">
          <div>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#2E7D32]/10 text-[#2E7D32]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-[#24324A] block mt-2 font-display">Most Successful Decisions</h3>
            <p className="text-xs text-[#6B7280]">Decisions showing excellent adaptation, low downstream fatigue, and healthy recovery rates.</p>
          </div>

          <div className="space-y-2.5">
            {MOST_SUCCESSFUL_DECISIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setScreen({ type: 'tag', slug: 'successful-stories' })}
                className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white hover:border-[#2E7D32]/30 transition-all shadow-sm"
                id={`success-decision-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#2E7D32]">#0{idx+1}</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#1F2937]">{item.title}</h4>
                    <p className="text-[10px] text-[#6B7280] leading-normal">{item.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Success Rate</span>
                  <span className="text-xs font-black text-[#2E7D32]">{item.successRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* SECTION 5: RELATIONSHIP COURT SPLIT SECTION */}
      <section className="rounded-2xl border border-[#E8D79B] bg-gradient-to-br from-white to-[#FFF8E1]/40 p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#FFF8E1] text-[#C9A227]">
              <Gavel className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#24324A] font-display">BR Court Cases</h3>
              <p className="text-xs text-[#6B7280]">Anonymously vote on active relationship dilemmas. Who is wrong?</p>
            </div>
          </div>
          <button
            onClick={() => setScreen({ type: 'court_list' })}
            className="text-xs font-bold text-[#24324A] hover:underline"
          >
            Open All Cases
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courtCases.map(c => {
            const total = c.votes.me + c.votes.partner + c.votes.both + c.votes.neither;
            const mePct = total > 0 ? Math.round((c.votes.me / total) * 100) : 0;
            const partnerPct = total > 0 ? Math.round((c.votes.partner / total) * 100) : 0;
            return (
              <div
                key={c.slug}
                onClick={() => setScreen({ type: 'court', slug: c.slug })}
                className="rounded-xl border border-[#E5E7EB] bg-white p-4 cursor-pointer hover:border-[#C9A227] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase font-mono text-[#C9A227] font-bold">
                    {c.caseNumber || 'CASE-C2011'} • Jury Deliberation
                  </span>
                  <h4 className="text-sm font-bold text-[#1F2937] line-clamp-2 leading-snug">"{c.title}"</h4>
                  <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed font-serif">{c.description}</p>
                </div>

                <div className="border-t border-[#ECECEC] mt-4 pt-3">
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-[#FAF8F2] p-1.5 rounded flex items-center justify-between">
                      <span className="text-[#6B7280]">Blame Me</span>
                      <span className="font-extrabold text-[#24324A]">{mePct}%</span>
                    </div>
                    <div className="bg-[#FAF8F2] p-1.5 rounded flex items-center justify-between">
                      <span className="text-[#6B7280]">Blame Partner</span>
                      <span className="font-extrabold text-[#C0392B]">{partnerPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: QUESTIONS BOARD LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#24324A] flex items-center gap-1.5 font-display">
              <MessageSquare className="h-5 w-5 text-[#24324A]" /> Need suggestions for your situation?
            </h2>
            <p className="text-xs text-[#6B7280]">Answering the hard questions: 'Should I? How long? Is it a warning?'</p>
          </div>
          <button
            onClick={() => setScreen({ type: 'question_list' })}
            className="text-xs font-bold text-[#24324A] hover:underline"
          >
            All Questions
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {questions.map(q => (
            <div
              key={q.slug}
              onClick={() => setScreen({ type: 'question', slug: q.slug })}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 cursor-pointer hover:border-[#24324A]/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-[#24324A] bg-[#24324A]/5 px-1.5 py-0.5 rounded">
                  {q.category}
                </span>
                <h4 className="text-xs font-bold text-[#1F2937] leading-normal line-clamp-2">"{q.title}"</h4>
                <p className="text-[11px] text-[#6B7280] line-clamp-3 leading-normal font-serif">{q.description}</p>
              </div>

              <div className="border-t border-[#ECECEC] mt-4 pt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
                <span>{q.pollOptions.reduce((acc, x) => acc + x.votes, 0).toLocaleString()} poll responses</span>
                <span className="text-[#24324A] font-semibold">{q.answers.length} community answers</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
