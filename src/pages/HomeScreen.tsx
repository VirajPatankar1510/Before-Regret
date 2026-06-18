import React, { useState } from 'react';
import { Search, Flame, AlertTriangle, ShieldCheck, Heart, Sparkles, MessageSquare, ChevronRight, TrendingUp, Gavel, Globe, Users, Clock, HelpCircle, Compass, BarChart3, Star, ArrowRight } from 'lucide-react';
import { Situation, Story, CourtCase, Question } from '../types';
import { MOST_REGRETTED_DECISIONS, MOST_SUCCESSFUL_DECISIONS, POPULAR_SEARCHES, PRESEEDED_SITUATIONS } from '../data/mockData';
import DecisionalCompass from '../components/DecisionalCompass';

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
  const [myCases, setMyCases] = useState<{ caseNumber: string; title: string; slug?: string; situationSlug?: string; type: 'story' | 'court' }[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('beforeregret_my_cases');
        return saved ? JSON.parse(saved) : [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    
    // Intercept Case Reference IDs typed in landing search bar
    if ((query.toUpperCase().startsWith('CASE-') || /^[SC]\d{4}$/i.test(query)) && onCaseRetrieve) {
      onCaseRetrieve(query);
      setSearchInput('');
      return;
    }
    
    // Redirect to explore page with search filter
    setScreen({ type: 'explore' });
  };

  const getRegretLevelString = (score: number) => {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Moderate';
    return 'Low';
  };

  const getRegretColor = (score: number) => {
    if (score >= 8) return 'text-[#FF5D5D] bg-[#FF5D5D]/10 border-[#FF5D5D]/20';
    if (score >= 6) return 'text-[#F4B942] bg-[#F4B942]/10 border-[#F4B942]/20';
    return 'text-[#2ECC71] bg-[#2ECC71]/10 border-[#2ECC71]/20';
  };

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* SECTION 1: HERO CONTAINER */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#161B22] to-[#0D1117] border border-[#30363D] py-14 px-6 text-center overflow-hidden">
        
        {/* Absolute Background Accent Radial glows */}
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#4F8CFF]/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-pink-500/5 blur-3xl" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[11px] font-bold text-indigo-400">
            <Sparkles className="h-3 w-3 text-[#F4B942]" /> Learn From Those Who Already Lived Your Choice.
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight select-none font-sans">
            What Relationship Decision Are You <span className="text-[#4F8CFF] bg-clip-text">Struggling With?</span>
          </h1>

          <p className="text-sm sm:text-base text-[#AAB2C0] leading-relaxed max-w-2xl mx-auto">
            Explore relationship outcomes and regrets before making a decision you'll live with for years.
          </p>

          {/* Large Hero Search bar input */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mt-4 space-y-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-[#AAB2C0]" />
              </div>
              <input
                type="text"
                placeholder="My boyfriend doesn't want marriage..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#30363D] bg-[#161B22] py-4 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-[#4F8CFF] focus:outline-none focus:ring-4 focus:ring-[#4F8CFF]/15 transition-all text-left"
              />
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-full sm:w-auto min-w-[200px] rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/80 py-3.5 px-6 text-xs sm:text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg hover:shadow-[#4F8CFF]/10 active:scale-95"
              >
                Search Outcomes
              </button>
            </div>
          </form>

          {/* Popular Searches triggers */}
          <div className="pt-2 text-xs text-left max-w-xl mx-auto">
            <span className="text-[#AAB2C0] font-semibold block mb-1.5 text-[10px] uppercase tracking-wider">Popular Searches:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCHES.map(term => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchInput(term);
                    setScreen({ type: 'situation', slug: term.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '') });
                  }}
                  className="rounded-lg bg-[#30363D]/40 border border-[#30363D] px-2.5 py-1 text-[11px] text-[#AAB2C0] hover:text-white hover:border-[#4F8CFF] hover:bg-[#161B22] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* SECTION 1.5: 🔒 YOUR DEVICE SECURE CASE REGISTRY */}
      {myCases.length > 0 && (
        <section className="space-y-4 animate-slideIn">
          <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400 animate-pulse" />
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 uppercase tracking-wider font-sans">
                  🔒 Private Dispute Registry
                </h2>
                <p className="text-xs text-[#AAB2C0]">
                  Cases created on this browser. These are saved completely offline inside your browser for premium secrecy.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Clear local device case index? This will forget list logs on this screen but does not delete them online.")) {
                  localStorage.removeItem('beforeregret_my_cases');
                  setMyCases([]);
                }
              }}
              className="text-[10px] text-zinc-500 hover:text-red-400 uppercase tracking-widest font-black transition-colors"
            >
              Forget List
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myCases.map(item => (
              <div 
                key={item.caseNumber}
                className="bg-[#161B22] border-2 border-[#30363D] hover:border-[#F4B942]/45 rounded-2xl p-4 flex flex-col justify-between transition-all group scale-100 active:scale-[0.99] cursor-pointer"
                onClick={() => {
                  if (item.type === 'story') {
                    setScreen({ type: 'situation', slug: item.situationSlug });
                    if (onCaseRetrieve) {
                      onCaseRetrieve(item.caseNumber);
                    }
                  } else {
                    setScreen({ type: 'court', slug: item.slug });
                  }
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                    <span className="font-mono text-[#F4B942] bg-[#F4B942]/10 px-2.5 py-0.5 rounded-lg tracking-wider border border-[#F4B942]/15">
                      {item.caseNumber}
                    </span>
                    <span className="uppercase text-zinc-400">
                      {item.type === 'court' ? '⚖️ Jury Court' : '📂 Chronicle'}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white mt-3 group-hover:text-[#4F8CFF] transition-colors leading-relaxed line-clamp-2">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between border-t border-[#30363D]/60 mt-4 pt-2.5 text-[10px] font-bold text-[#4F8CFF] group-hover:translate-x-0.5 transition-transform">
                  <span>Retrieve Dossier</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NEW: PERSONALIZED MOOD CONCERT / INTERACTIVE DECISION COMPASS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">Personalized Outcome Diagnostic</h2>
            <p className="text-xs text-[#AAB2C0]">Not sure what dossier applies to you? Navigate our archives dynamically using our advisor engine.</p>
          </div>
        </div>
        <DecisionalCompass setScreen={setScreen} stories={latestStories} />
      </section>

      {/* SECTION 3: TRENDING SITUATIONS CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-400" /> Trending Relationship Situations
            </h2>
            <p className="text-xs text-[#AAB2C0]">Compare metrics of individuals who faced identical crises recently.</p>
          </div>
          <button
            onClick={() => setScreen({ type: 'explore' })}
            className="text-xs font-bold text-[#4F8CFF] hover:underline flex items-center gap-0.5"
          >
            All Situations <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESEEDED_SITUATIONS.map(situation => (
            <div
              key={situation.slug}
              onClick={() => setScreen({ type: 'situation', slug: situation.slug })}
              className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 cursor-pointer shadow-sm hover:border-[#4F8CFF]/50 transition-all hover:scale-[1.01] flex flex-col justify-between"
              id={`situation-card-${situation.slug}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#4F8CFF] bg-[#4F8CFF]/10 px-2 py-0.5 rounded">
                  {situation.category}
                </span>
                <h3 className="text-sm font-bold text-white pt-1 line-clamp-2 leading-snug">{situation.name}</h3>
                <p className="text-[11px] text-[#AAB2C0] line-clamp-3 leading-relaxed mt-1.5">{situation.description}</p>
              </div>

              <div className="border-t border-[#30363D] mt-4 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Avg Regret Ratio</span>
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
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm space-y-4">
          <div>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#FF5D5D]/10 text-[#FF5D5D]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-white block mt-2">Most Regretted Decisions</h3>
            <p className="text-xs text-[#AAB2C0]">Actions that resulted in the highest statistical grief over a 5-year log cycle.</p>
          </div>

          <div className="space-y-2.5">
            {MOST_REGRETTED_DECISIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setScreen({ type: 'tag', slug: item.title.toLowerCase().replace(/\s+/g, '-') })}
                className="rounded-xl border border-[#30363D] bg-[#0D1117] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-[#FF5D5D]/40 transition-colors"
                id={`regret-decision-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#FF5D5D]">#0{idx+1}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[10px] text-[#AAB2C0] leading-normal">{item.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#AAB2C0] block">Regret Level</span>
                  <span className="text-xs font-black text-[#FF5D5D]">{item.avgRegret}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Successful Decisions */}
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm space-y-4">
          <div>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#2ECC71]/10 text-[#2ECC71]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold text-white block mt-2">Most Successful Decisions</h3>
            <p className="text-xs text-[#AAB2C0]">Decisions showing excellent adaptation, low downstream fatigue, and healthy recovery rates.</p>
          </div>

          <div className="space-y-2.5">
            {MOST_SUCCESSFUL_DECISIONS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setScreen({ type: 'tag', slug: 'successful-stories' })}
                className="rounded-xl border border-[#30363D] bg-[#0D1117] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-[#2ECC71]/40 transition-colors"
                id={`success-decision-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#2ECC71]">#0{idx+1}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[10px] text-[#AAB2C0] leading-normal">{item.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#AAB2C0] block">Success Rate</span>
                  <span className="text-xs font-black text-[#2ECC71]">{item.successRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* SECTION 5: RELATIONSHIP COURT SPLIT SECTION */}
      <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#F4B942]/10 text-[#F4B942]">
              <Gavel className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white">Relationship Court Cases</h3>
              <p className="text-xs text-[#AAB2C0]">Anonymously vote on active relationship dilemmas. Who is the asshole?</p>
            </div>
          </div>
          <button
            onClick={() => setScreen({ type: 'court_list' })}
            className="text-xs font-bold text-[#4F8CFF] hover:underline"
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
                className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 cursor-pointer hover:border-[#F4B942]/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase font-mono text-[#F4B942]">Jury Deliberation</span>
                  <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">"{c.title}"</h4>
                  <p className="text-xs text-[#AAB2C0] line-clamp-3 leading-relaxed font-serif">{c.description}</p>
                </div>

                <div className="border-t border-[#30363D] mt-4 pt-3">
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-[#161B22] p-1.5 rounded flex items-center justify-between">
                      <span className="text-zinc-400">Blame Me</span>
                      <span className="font-extrabold text-[#4F8CFF]">{mePct}%</span>
                    </div>
                    <div className="bg-[#161B22] p-1.5 rounded flex items-center justify-between">
                      <span className="text-zinc-400">Blame Partner</span>
                      <span className="font-extrabold text-[#FF5D5D]">{partnerPct}%</span>
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
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="h-5 w-5 text-purple-400" /> Community Q&A Panels
            </h2>
            <p className="text-xs text-[#AAB2C0]">Answering the hard questions: 'Should I? How long? Is it a warning?'</p>
          </div>
          <button
            onClick={() => setScreen({ type: 'question_list' })}
            className="text-xs font-bold text-[#4F8CFF] hover:underline"
          >
            All Questions
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {questions.map(q => (
            <div
              key={q.slug}
              onClick={() => setScreen({ type: 'question', slug: q.slug })}
              className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 cursor-pointer hover:border-purple-500/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                  {q.category}
                </span>
                <h4 className="text-xs font-bold text-white leading-normal line-clamp-2">"{q.title}"</h4>
                <p className="text-[11px] text-[#AAB2C0] line-clamp-3 leading-normal font-serif">{q.description}</p>
              </div>

              <div className="border-t border-[#30363D] mt-4 pt-2 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{q.pollOptions.reduce((acc, x) => acc + x.votes, 0).toLocaleString()} poll responses</span>
                <span className="text-purple-400 font-semibold">{q.answers.length} community answers</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
