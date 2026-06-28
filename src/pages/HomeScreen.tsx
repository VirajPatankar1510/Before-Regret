import React, { useState } from 'react';
import { Search, Flame, AlertTriangle, ShieldCheck, Heart, Sparkles, MessageSquare, ChevronRight, TrendingUp, Gavel, Globe, Users, Clock, HelpCircle, Compass, BarChart3, Star, ArrowRight } from 'lucide-react';
import { Situation, Story, CourtCase, Question } from '../types';
import { MOST_REGRETTED_DECISIONS, MOST_SUCCESSFUL_DECISIONS, POPULAR_SEARCHES, PRESEEDED_SITUATIONS } from '../data/mockData';
import { PRESEEDED_RELATIONSHIP_PROBLEMS } from '../data/relationshipProblems';
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

    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    const queryNorm = normalize(query);

    // 1. Direct or normalized match in PRESEEDED_SITUATIONS
    let matchedSituation = PRESEEDED_SITUATIONS.find(s => {
      const nameNorm = normalize(s.name);
      const slugNorm = normalize(s.slug);
      return nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm) || 
             slugNorm.includes(queryNorm) || queryNorm.includes(slugNorm);
    });

    // 2. If no direct situation matched, check against PRESEEDED_RELATIONSHIP_PROBLEMS keywords & categories
    if (!matchedSituation) {
      const matchedProblem = PRESEEDED_RELATIONSHIP_PROBLEMS.find(p => {
        const pNameNorm = normalize(p.name);
        const pIdNorm = normalize(p.id);
        if (pNameNorm.includes(queryNorm) || queryNorm.includes(pNameNorm) || pIdNorm.includes(queryNorm) || queryNorm.includes(pIdNorm)) {
          return true;
        }
        return p.keywords.some(kw => {
          const kwNorm = normalize(kw);
          return kwNorm.includes(queryNorm) || queryNorm.includes(kwNorm);
        });
      });

      if (matchedProblem) {
        // Map the matched problem ID/slug back to a preseeded situation if it exists
        const mappedSit = PRESEEDED_SITUATIONS.find(s => normalize(s.slug) === normalize(matchedProblem.id));
        if (mappedSit) {
          matchedSituation = mappedSit;
        }
      }
    }

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

          {/* Grid of Existing Options (Relationship Dilemmas) */}
          <div className="pt-6 max-w-4xl mx-auto space-y-4">
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider text-center select-none">
              Select a Relationship Dilemma to Explore Real Outcomes
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { 
                  name: "Boyfriend Doesn't Want Marriage", 
                  slug: "boyfriend-doesnt-want-marriage", 
                  desc: "Postponing, rejecting, or waiting on marital commitment.",
                  icon: Gavel,
                  color: "border-amber-200/60 hover:border-amber-400 bg-amber-50/10 text-amber-700" 
                },
                { 
                  name: "Stayed After Cheating", 
                  slug: "stayed-after-cheating", 
                  desc: "Forgiving physical/emotional infidelity and rebuilding trust.",
                  icon: Heart,
                  color: "border-rose-200/60 hover:border-rose-400 bg-rose-50/10 text-rose-700" 
                },
                { 
                  name: "Partner Doesn't Want Kids", 
                  slug: "partner-doesnt-want-kids", 
                  desc: "Navigating mismatch in parenting desires and timelines.",
                  icon: Users,
                  color: "border-sky-200/60 hover:border-sky-400 bg-sky-50/10 text-sky-700" 
                },
                { 
                  name: "Moved For Love", 
                  slug: "moved-for-love", 
                  desc: "Relocating, sacrificing career or friends for a partner.",
                  icon: Compass,
                  color: "border-emerald-200/60 hover:border-emerald-400 bg-emerald-50/10 text-emerald-700" 
                },
                { 
                  name: "Long Distance Relationship", 
                  slug: "long-distance-relationship", 
                  desc: "Managing separation and closing the distance gap.",
                  icon: Globe,
                  color: "border-indigo-200/60 hover:border-indigo-400 bg-indigo-50/10 text-indigo-700" 
                },
                { 
                  name: "Different Religion Marriage", 
                  slug: "different-religion-marriage", 
                  desc: "Interfaith relationships and family expectations.",
                  icon: Sparkles,
                  color: "border-purple-200/60 hover:border-purple-400 bg-purple-50/10 text-purple-700" 
                },
                { 
                  name: "Marriage Ultimatum", 
                  slug: "marriage-ultimatum", 
                  desc: "Giving a timeline to marry or go separate ways.",
                  icon: Clock,
                  color: "border-orange-200/60 hover:border-orange-400 bg-orange-50/10 text-orange-700" 
                },
                { 
                  name: "Ignored Red Flags", 
                  slug: "ignored-red-flags", 
                  desc: "Overlooking warning signs in months 1-6.",
                  icon: AlertTriangle,
                  color: "border-red-200/60 hover:border-red-400 bg-red-50/10 text-red-700" 
                },
                { 
                  name: "Friend Zone Limbo", 
                  slug: "friend-zone", 
                  desc: "Staying platonic vs confessing feelings.",
                  icon: HelpCircle,
                  color: "border-teal-200/60 hover:border-teal-400 bg-teal-50/10 text-teal-700" 
                },
                {
                  name: "Become a Judge",
                  slug: "become-a-judge",
                  desc: "Step into the Relationship Court, weigh actual dilemmas, and cast your verdict.",
                  icon: Gavel,
                  color: "",
                  action: () => setScreen({ type: 'court_list' }),
                  highlighted: true
                }
              ].map(opt => (
                <button
                  key={opt.slug}
                  onClick={opt.action ? opt.action : () => setScreen({ type: 'situation', slug: opt.slug })}
                  className={`flex flex-col text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all group active:scale-[0.98] ${
                    opt.highlighted 
                      ? "bg-gradient-to-br from-[#24324A] to-[#1C273A] border-[#C9A227] hover:from-[#1F2B40] hover:to-[#17202E] text-white shadow-md shadow-[#C9A227]/10 ring-2 ring-[#C9A227]/30 col-span-2 md:col-span-1" 
                      : `bg-white hover:bg-slate-50/50 shadow-xs hover:shadow-sm ${opt.color.split(" ")[0]} ${opt.color.split(" ")[1]}`
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1.5 min-w-0 w-full">
                    <div className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl border shrink-0 group-hover:scale-105 transition-transform mt-0.5 ${
                      opt.highlighted 
                        ? "bg-[#C9A227] border-[#C9A227] text-[#24324A]" 
                        : "bg-white border-[#E5E7EB]"
                    }`}>
                      <opt.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <span className={`font-extrabold text-[11px] sm:text-[13px] leading-tight transition-colors flex-1 ${
                      opt.highlighted 
                        ? "text-white group-hover:text-[#C9A227]" 
                        : "text-[#24324A] group-hover:text-[#C9A227]"
                    }`}>{opt.name}</span>
                  </div>
                  <p className={`text-[10px] sm:text-[11px] leading-normal sm:leading-relaxed line-clamp-2 ${
                    opt.highlighted ? "text-slate-300 font-medium" : "text-[#6B7280]"
                  }`}>{opt.desc}</p>
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

      {/* SECTION 3: TRENDING PEER COURT DEBATES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#24324A] flex items-center gap-2">
              <Gavel className="h-5 w-5 text-[#C9A227]" /> Trending Relationship Court Debates
            </h2>
            <p className="text-xs text-[#6B7280]">Step into the citizen court, weigh in on real conflicts, and cast your anonymous verdict.</p>
          </div>
          <button
            onClick={() => setScreen({ type: 'court_list' })}
            className="text-xs font-bold text-[#24324A] hover:underline flex items-center gap-0.5"
          >
            Enter Courtroom <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(courtCases || []).slice(0, 3).map(c => {
            const totalVotes = (c.votes?.me || 0) + (c.votes?.partner || 0) + (c.votes?.both || 0) + (c.votes?.neither || 0);
            return (
              <div
                key={c.slug}
                onClick={() => setScreen({ type: 'court', slug: c.slug })}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
                id={`court-card-${c.slug}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-[#24324A] font-mono">
                    <span className="bg-[#24324A]/5 px-2 py-0.5 rounded uppercase">
                      {c.tags?.[0] || 'Relationship Dispute'}
                    </span>
                    {c.caseNumber && (
                      <span className="text-[#C9A227]">
                        #{c.caseNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#1F2937] line-clamp-2 leading-snug hover:text-[#C9A227] transition-colors">{c.title}</h3>
                  <p className="text-[11px] text-[#6B7280] line-clamp-3 leading-relaxed mt-1">{c.description}</p>
                </div>

                <div className="border-t border-[#ECECEC] mt-4 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-zinc-500 font-semibold">
                      <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{c.arguments?.length || 0} Opinions</span>
                    </div>
                    <span className="text-[11px] bg-amber-50 text-[#C9A227] px-2 py-0.5 border border-amber-200/50 rounded-lg font-black shrink-0">
                      {totalVotes} Juror Votes
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* SECTION 4.5: ACCREDITED DECISION GUIDES */}
      <section className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#C9A227] select-none">
              <Star className="h-3 w-3 fill-current" /> Expert Perspectives
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#24324A] font-display">Accredited Decision Guides</h2>
            <p className="text-xs text-[#6B7280]">Read clinical analysis on trust rebuilding, commitment anxieties, and partners red flags.</p>
          </div>
          <button
            onClick={() => setScreen({ type: 'guides' })}
            className="text-xs font-extrabold text-[#C9A227] hover:underline flex items-center gap-0.5 shrink-0 self-start sm:self-center"
          >
            Browse All Guides <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            onClick={() => setScreen({ type: 'guides' })}
            className="border border-[#E5E7EB] rounded-2xl p-4 cursor-pointer hover:border-[#C9A227] hover:bg-[#FAF8F2]/30 transition-all flex items-start gap-4"
          >
            <div className="p-2.5 rounded-xl bg-[#FAF8F2] text-[#C9A227] shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#24324A]">Infidelity &amp; Reconciliation: Rebuilding Trust</h4>
              <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">Learn the structural pillars required to survive cheating and calculate the emotional load of hypervigilance.</p>
              <span className="text-[10px] font-bold text-[#C9A227] inline-flex items-center gap-0.5 pt-1">Read Guide <ArrowRight className="h-3 w-3" /></span>
            </div>
          </div>

          <div 
            onClick={() => setScreen({ type: 'guides' })}
            className="border border-[#E5E7EB] rounded-2xl p-4 cursor-pointer hover:border-[#C9A227] hover:bg-[#FAF8F2]/30 transition-all flex items-start gap-4"
          >
            <div className="p-2.5 rounded-xl bg-[#FAF8F2] text-[#C9A227] shrink-0">
              <Gavel className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#24324A]">The Ultimatum Protocol: Commitment Deadlocks</h4>
              <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">Why pressure tactics trigger defensiveness and how to establish healthy self-boundaries.</p>
              <span className="text-[10px] font-bold text-[#C9A227] inline-flex items-center gap-0.5 pt-1">Read Guide <ArrowRight className="h-3 w-3" /></span>
            </div>
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
            const isExpired = !c.createdAt || (new Date(c.createdAt).getTime() + (c.deliberationDays || 3) * 24 * 60 * 60 * 1000) <= Date.now();
            return (
              <div
                key={c.slug}
                onClick={() => setScreen({ type: 'court', slug: c.slug })}
                className="rounded-xl border border-[#E5E7EB] bg-white p-4 cursor-pointer hover:border-[#C9A227] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase font-mono text-[#C9A227] font-bold">
                      {c.caseNumber || 'CASE-C2011'} • Jury Deliberation
                    </span>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider font-mono bg-rose-50 text-rose-600 border border-rose-200">
                        <span className="h-1 w-1 rounded-full bg-rose-500" />
                        Ended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider font-mono bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
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
