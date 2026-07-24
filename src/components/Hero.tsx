import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Society } from '../types';

interface HeroProps {
  onSearch: (query: string) => void;
  onSelectSociety: (society: Society) => void;
  societies: Society[];
  onBecomeContributor: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSearch,
  onSelectSociety,
  societies,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    const handleTriggerGlow = () => {
      setIsGlowing(true);
      const timer = setTimeout(() => {
        setIsGlowing(false);
      }, 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('trigger-hero-search-glow', handleTriggerGlow);
    return () => window.removeEventListener('trigger-hero-search-glow', handleTriggerGlow);
  }, []);

  const filteredSocieties = societies.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.locality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  const questionItems = [
    {
      id: 1,
      tag: "PARKING ISSUE",
      question: "Is visitor parking available after 8 PM?",
      highlight: "visitor parking",
      highlightClass: "bg-blue-100 text-[#2563EB] border border-blue-200/90 px-2 py-0.5 rounded-lg font-extrabold shadow-2xs",
    },
    {
      id: 2,
      tag: "WATER SUPPLY",
      question: "Is there water shortage during summer?",
      highlight: "water shortage",
      highlightClass: "bg-amber-100 text-amber-900 border border-amber-200/90 px-2 py-0.5 rounded-lg font-extrabold shadow-2xs",
    },
    {
      id: 3,
      tag: "HIDDEN COSTS",
      question: "Are there any hidden maintenance costs?",
      highlight: "hidden maintenance costs",
      highlightClass: "bg-rose-100 text-rose-800 border border-rose-200/90 px-2 py-0.5 rounded-lg font-extrabold shadow-2xs",
    },
    {
      id: 4,
      tag: "AMENITIES",
      question: "Are the amenities actually maintained and in working condition?",
      highlight: "amenities",
      highlightClass: "bg-emerald-100 text-emerald-900 border border-emerald-200/90 px-2 py-0.5 rounded-lg font-extrabold shadow-2xs",
    },
    {
      id: 5,
      tag: "SOCIETY RULES",
      question: "Is the society committee helpful and cooperative?",
      highlight: "society committee",
      highlightClass: "bg-indigo-100 text-indigo-900 border border-indigo-200/90 px-2 py-0.5 rounded-lg font-extrabold shadow-2xs",
    },
    {
      id: 6,
      tag: "MONSOON FLOODING",
      question: "Does the area experience flooding during monsoon?",
      highlight: "flooding",
      highlightClass: "bg-cyan-100 text-cyan-900 border border-cyan-200/90 px-2 py-0.5 rounded-lg font-extrabold shadow-2xs",
    },
  ];

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentQuestionIndex((prev) => (prev + 1) % questionItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, questionItems.length]);

  const currentItem = questionItems[currentQuestionIndex];

  const renderQuestionWithHighlight = (item: typeof questionItems[0]) => {
    const parts = item.question.split(item.highlight);
    if (parts.length === 2) {
      return (
        <span className="inline leading-relaxed">
          {parts[0]}
          <motion.span
            key={`highlight-${item.id}`}
            initial={{ scale: 0.75, opacity: 0, rotate: -2 }}
            animate={{ scale: [0.75, 1.12, 1], opacity: 1, rotate: 0 }}
            transition={{ delay: 0.12, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className={`inline-block mx-1 transform -translate-y-0.5 ${item.highlightClass}`}
          >
            {item.highlight}
          </motion.span>
          {parts[1]}
        </span>
      );
    }
    return item.question;
  };

  return (
    <section className="relative pt-8 pb-10 sm:pt-10 sm:pb-12 md:pt-14 md:pb-16 px-3.5 sm:px-6 overflow-hidden bg-white border-b border-[#E4E4E7]">
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
        
        {/* 1. Large Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-3xl mx-auto px-2">
          Before You Pay the Token Amount...
        </h1>

        {/* 2. Subheading */}
        <div className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 max-w-2xl mx-auto tracking-tight space-y-2 px-2">
          <p className="text-slate-700">Remember, <span className="italic underline decoration-red-500 decoration-2 underline-offset-4 font-bold text-slate-900">Buying</span> or <span className="italic underline decoration-red-500 decoration-2 underline-offset-4 font-bold text-slate-900">Renting</span> a wrong flat can cost you lakhs.</p>
        </div>

        {/* 3. Supporting Paragraphs */}
        <div className="text-slate-600 max-w-xl mx-auto font-normal leading-relaxed px-2 flex flex-col items-center justify-center gap-1">
          <p className="text-center text-[14px]">Know what residents know before you decide.</p>
          <p className="text-center font-medium text-slate-700 text-[14px]">Get real answers from real residents.</p>
        </div>

        {/* 4. Minimal & Elegant Search Bar Container */}
        <div id="hero-search-container" className="relative max-w-xl mx-auto pt-0.5 px-1">
          <AnimatePresence>
            {isGlowing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{
                  opacity: [0, 1, 0.85, 0],
                  scale: [0.96, 1.03, 1.02, 1]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-80 blur-md pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          <form onSubmit={handleSearchSubmit} className="relative z-10 flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="hero-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search any society..."
                className={`block w-full pl-10 pr-24 sm:pr-28 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 bg-white border rounded-xl shadow-xs transition-all placeholder:text-slate-400 placeholder:text-xs font-sans ${
                  isGlowing
                    ? 'border-[#2563EB] ring-4 ring-blue-500/40 shadow-lg shadow-blue-500/20'
                    : 'border-slate-200/90 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/80 focus:border-transparent'
                }`}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3.5 sm:px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer z-10"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchTerm.trim().length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-left max-h-72 overflow-y-auto">
              {filteredSocieties.length > 0 ? (
                filteredSocieties.map((society) => (
                  <div
                    key={society.id}
                    onClick={() => {
                      onSelectSociety(society);
                      setShowDropdown(false);
                      setSearchTerm('');
                    }}
                    className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {society.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {society.locality}, {society.city}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-[#2563EB] text-[10px] sm:text-[11px] font-semibold rounded-full font-sans">
                        {society.residentProfilesCount} Profiles
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 text-center text-xs text-slate-500">
                  No matching societies found. Try searching for "Lodha Amara" or "Powai".
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 5. TikTok Style Fancy Dynamic Question */}
      <div className="mt-6 sm:mt-8 max-w-xl mx-auto space-y-2 px-1">
        {/* Section Heading with Yellow Highlighter Stroke */}
        <div className="text-center">
          <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase inline-block">
            <span className="relative inline-block px-2.5 py-1 text-slate-950">
              <span className="absolute inset-0 bg-[#f7ff8c] -rotate-1 -skew-x-3 rounded-sm shadow-2xs z-0 transform scale-x-[1.04] scale-y-[0.92]" />
              <span className="relative z-10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Things Most Buyers Find Out Too Late</span>
              </span>
            </span>
          </h3>
        </div>

        {/* Dynamic Zoom & Pop Motion Container without Card BG/Border */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative overflow-visible min-h-[50px] sm:min-h-[46px] flex items-center justify-center px-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, scale: 0.82, y: 24, rotate: -2, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.15, y: -20, rotate: 2, filter: 'blur(8px)' }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                className="w-full text-center select-none py-2 px-2"
              >
                {/* Question Text with Zoom Pop Highlight */}
                <p className="text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-relaxed tracking-tight text-center">
                  {renderQuestionWithHighlight(currentItem)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};


