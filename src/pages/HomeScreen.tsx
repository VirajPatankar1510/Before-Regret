import React, { useState, useEffect } from 'react';
import { Search, Flame, AlertTriangle, ShieldCheck, Heart, Sparkles, MessageSquare, ChevronRight, TrendingUp, Gavel, Globe, Users, Clock, HelpCircle, Compass, BarChart3, Star, ArrowRight, Award, CheckCircle2, Download, ChevronLeft } from 'lucide-react';
import { Situation, Story, CourtCase, Question } from '../types';
import { motion, AnimatePresence } from 'motion/react';
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleManualSlideSelect = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
  };

  const handleManualSlidePrev = () => {
    setIsAutoPlaying(false);
    setCurrentSlide(prev => (prev === 0 ? 2 : prev - 1));
  };

  const handleManualSlideNext = () => {
    setIsAutoPlaying(false);
    setCurrentSlide(prev => (prev + 1) % 3);
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleManualSlideNext();
    } else if (isRightSwipe) {
      handleManualSlidePrev();
    }
  };

  const slides = [
    {
      id: 'certificate',
      bgGradient: 'from-[#14111C] via-[#2D1D3D] to-[#14111C]',
      accentColor: '#C9A227',
      badge: '⚖️ The Relationship Court',
      title: "Your Story Deserves a Verdict...",
      subtitle: "Cleared of blame in your relationship disagreement? Let the public jury listen to your story, vote on the issue, and claim your official exoneration certificate.",
      cta: "Submit Your Case",
      action: () => setScreen({ type: 'court_list' }),
      content: (
        <div className="space-y-3 text-left">
          <p className="text-[12px] text-zinc-300 font-medium font-sans">Get your official innocence certificate in 3 steps:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A227]/20 text-[#C9A227] text-[10px] font-black shrink-0 border border-[#C9A227]/30 mt-0.5">1</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Post Your Case</h4>
                <p className="text-[9px] text-zinc-400 font-sans leading-normal">Submit details and arguments anonymously from both sides.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A227]/20 text-[#C9A227] text-[10px] font-black shrink-0 border border-[#C9A227]/30 mt-0.5">2</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Community Jury Vote</h4>
                <p className="text-[9px] text-zinc-400 font-sans leading-normal">Our peer citizens review details, discuss facts, and cast votes on who is right.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A227]/20 text-[#C9A227] text-[10px] font-black shrink-0 border border-[#C9A227]/30 mt-0.5">3</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Download Your Certificate</h4>
                <p className="text-[9px] text-zinc-400 font-sans leading-normal">Instantly save your custom certificate to share with your partner!</p>
              </div>
            </div>
          </div>
        </div>
      ),
      visual: (
        <div className="relative w-full h-full max-w-[290px] mx-auto bg-[#FFFDF9] border-4 border-double border-[#C9A227] rounded-2xl p-4 shadow-2xl flex flex-col justify-between text-[#24324A] font-serif overflow-hidden select-none">
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <Gavel className="w-28 h-28 text-[#C9A227]" />
          </div>
          
          <div className="text-center space-y-0.5">
            <span className="text-[6px] tracking-widest font-mono text-[#C9A227] uppercase font-black block">The Relationship Court</span>
            <h4 className="text-[11px] font-black tracking-tight uppercase border-b border-[#E8D79B] pb-1 font-sans text-amber-900">Certificate of Innocence</h4>
          </div>

          <div className="my-2.5 text-center space-y-1.5">
            <p className="text-[7px] italic text-zinc-500 leading-normal">This official certificate verifies that our community jury has cleared the bearer of blame in their case.</p>
            <div className="bg-[#FAF8F2] border border-[#E8D79B] py-1 px-1.5 rounded">
              <span className="text-[8px] font-bold text-amber-950 block font-sans tracking-wide">VERDICT: CERTIFIED INNOCENT</span>
              <span className="text-[6px] text-[#C9A227] font-mono block uppercase">Verified Good Partner</span>
            </div>
            <p className="text-[6.5px] text-zinc-500 leading-normal px-1">"Voted innocent of all relationship blame by anonymous peer reviews."</p>
          </div>

          <div className="flex items-center justify-between border-t border-[#E8D79B] pt-1.5 mt-0.5">
            <div className="text-left font-mono text-[5.5px] text-zinc-400 space-y-0.5">
              <div>Community Decided</div>
              <div>Peer Citizen Jury</div>
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-[#C9A227] shadow-xs flex items-center justify-center border border-yellow-300 relative">
                <Star className="w-3 h-3 text-white fill-current" />
                <div className="absolute top-4 left-0.5 w-1.5 h-3 bg-amber-700/80 -rotate-12 transform origin-top" />
                <div className="absolute top-4 right-0.5 w-1.5 h-3 bg-amber-700/80 rotate-12 transform origin-top" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'redflag',
      bgGradient: 'from-[#171A21] via-[#21262D] to-[#171A21]',
      accentColor: '#3B82F6',
      badge: '🚩 Dilemma Meter',
      title: "Red Flag Dilemma Meter",
      subtitle: "Wondering if a partner behavior is a real warning sign? Submit the dilemma anonymously, vote on active cases, and view warning percentages.",
      cta: "Check Red Flags",
      action: () => setScreen({ type: 'red_flag_meter' }),
      content: (
        <div className="space-y-3 text-left">
          <p className="text-[12px] text-zinc-300 font-medium font-sans">Gauge the warning signs before moving forward:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-[#3B82F6] text-[10px] font-black shrink-0 border border-blue-500/30 mt-0.5">1</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Rate behaviors</h4>
                <p className="text-[9px] text-zinc-400 font-sans leading-normal">Vote on whether specific situations are healthy or clear red flags.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-[#3B82F6] text-[10px] font-black shrink-0 border border-blue-500/30 mt-0.5">2</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Compare averages</h4>
                <p className="text-[9px] text-zinc-400 font-sans leading-normal">Check split ratings to see how your boundaries align with peers.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-[#3B82F6] text-[10px] font-black shrink-0 border border-blue-500/30 mt-0.5">3</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Submit warnings</h4>
                <p className="text-[9px] text-zinc-400 font-sans leading-normal">Anonymously share your partner's habits to get objective warning meter scores.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      visual: (
        <div className="w-full max-w-[290px] mx-auto bg-[#0D1117] border border-[#30363D] rounded-2xl p-4 shadow-2xl space-y-3 text-slate-300 font-sans text-left select-none">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[8px] font-mono font-bold tracking-widest text-red-400">RED FLAG METER</span>
            <span className="text-[8px] text-zinc-400 font-mono font-bold font-sans">Active Voting</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-extrabold text-white leading-normal">"Partner hides their phone screen whenever I enter the room."</h4>
          </div>

          <div className="space-y-2 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono font-bold">
                <span>⚠️ Red Flag Behavior</span>
                <span className="text-red-400">82%</span>
              </div>
              <div className="w-full bg-[#21262D] h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-mono font-bold">
                <span>🟢 Normal Boundary</span>
                <span className="text-emerald-400">18%</span>
              </div>
              <div className="w-full bg-[#21262D] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'regret',
      bgGradient: 'from-[#022C22] via-[#064E3B] to-[#022C22]',
      accentColor: '#10B981',
      badge: '📖 Personal Stories',
      title: "Explore Real Decision Timelines",
      subtitle: "Facing a tough relationship crossroads? Read actual story timelines from people who walked similar paths and learn from their outcomes.",
      cta: "Explore Stories",
      action: () => setScreen({ type: 'explore' }),
      content: (
        <div className="space-y-3 text-left">
          <p className="text-[12px] text-emerald-200 font-medium font-sans">Read how others navigated their relationship crossroads:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0 border border-emerald-500/30 mt-0.5">1</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Real situations</h4>
                <p className="text-[9px] text-zinc-300 font-sans leading-normal">Learn what others decided to do when confronting trust issues or major crossroads.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0 border border-emerald-500/30 mt-0.5">2</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Step-by-step paths</h4>
                <p className="text-[9px] text-zinc-300 font-sans leading-normal">Follow how people communicated, sought assistance, or resolved disputes over time.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0 border border-emerald-500/30 mt-0.5">3</span>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-normal font-sans">Honest updates</h4>
                <p className="text-[9px] text-zinc-300 font-sans leading-normal">Read honest, helpful updates on how their decision impacted their happiness months later.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      visual: (
        <div className="w-full max-w-[290px] mx-auto bg-teal-950/40 border border-teal-800/40 rounded-2xl p-4 shadow-2xl space-y-2 text-slate-300 font-sans text-left">
          <div className="flex items-center justify-between border-b border-teal-900 pb-1.5">
            <span className="text-[8px] font-mono font-bold tracking-widest text-[#10B981]">STORY TIMELINE</span>
            <span className="text-[8px] text-zinc-300 font-mono">Decision Roadmap</span>
          </div>

          <div className="space-y-2 pt-1 text-[10px]">
            <div className="flex gap-2">
              <span className="text-emerald-400 font-bold shrink-0 font-mono">Day 1</span>
              <p className="text-zinc-300 font-sans leading-normal">Spoke up directly about my concerns and trust worries.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-400 font-bold shrink-0 font-mono">Month 3</span>
              <p className="text-zinc-300 font-sans leading-normal">We worked together to establish open conversations and boundaries.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[#F4B942] font-bold shrink-0 font-mono">Update</span>
              <p className="text-emerald-100 font-sans font-bold leading-normal">Feeling heard and secure. Working on it made us stronger.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

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
      
      {/* DYNAMIC SLIDING HERO BANNER */}
      <section className="relative rounded-3xl overflow-hidden shadow-lg border border-zinc-800 bg-zinc-950 text-white select-none">
        {/* Carousel Content with Slide Animation */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-full min-h-[500px] md:min-h-[400px] bg-gradient-to-r ${slides[currentSlide].bgGradient} transition-all duration-700 ease-in-out p-6 pb-24 sm:p-10 sm:pb-12 flex flex-col md:flex-row items-center justify-between gap-8 relative`}
        >
          
          {/* Decorative accent background glows */}
          <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Left Column (Content) */}
          <div className="flex-1 space-y-5 text-left z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {slides[currentSlide].badge}
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-display">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {slides[currentSlide].subtitle}
            </p>

            <div className="py-1">
              {slides[currentSlide].content}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={slides[currentSlide].action}
                className="px-5 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-extrabold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 font-sans"
              >
                {slides[currentSlide].cta} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Column (Visual Mockup) */}
          <div className="hidden md:flex flex-1 items-center justify-center z-10 p-2">
            {slides[currentSlide].visual}
          </div>

          {/* Manual Chevron Nav Buttons */}
          <button
            onClick={handleManualSlidePrev}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 items-center justify-center text-white transition-all cursor-pointer hover:scale-105 z-20"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleManualSlideNext}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 items-center justify-center text-white transition-all cursor-pointer hover:scale-105 z-20"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Carousel Indicators / Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleManualSlideSelect(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* SECTION 1.5: THE DILEMMA SELECTOR GRID */}
      <section className="relative rounded-3xl bg-white border border-[#E5E7EB] py-10 px-6 overflow-hidden shadow-sm space-y-8">
        
        {/* Absolute Background Accent Radial glows */}
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#24324A]/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[#C9A227]/5 blur-3xl" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#060606] tracking-tight font-display">
              What Relationship Decision Are You <span className="text-[#C9A227]">Struggling With?</span>
            </h2>
            <p className="text-xs text-[#6B7280] max-w-2xl mx-auto leading-relaxed font-sans">
              Facing a tough relationship crossroads? Explore caring stories, honest advice, and lessons from peers who have walked similar paths.
            </p>
          </div>

          {/* DYNAMIC SEARCH BAR */}
          <div className="max-w-xl mx-auto pb-4 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search issues, e.g. 'boyfriend marriage', 'cheating', 'ignored red flags'..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-24 py-3.5 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/10 rounded-2xl text-sm transition-all shadow-inner focus:outline-hidden text-[#1F2937]"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#24324A] hover:bg-[#1C273A] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer font-sans"
              >
                Search
              </button>
            </form>
          </div>

          {/* Grid of Existing Options (Relationship Dilemmas) */}
          <div className="pt-2 max-w-4xl mx-auto space-y-4">
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
            <p className="text-xs text-[#6B7280]">Step into The Relationship Court, weigh in on real conflicts, and cast your anonymous verdict.</p>
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
                className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-3.5 flex items-center justify-between gap-3 shadow-sm"
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
                className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-3.5 flex items-center justify-between gap-3 shadow-sm"
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
              <h3 className="text-base font-extrabold text-[#24324A] font-display">The Relationship Court Cases</h3>
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
