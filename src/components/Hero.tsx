import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Society } from '../types';
import heroBgImage from '../assets/images/regenerated_image_1784228757923.png';

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
      prefix: "Are there any",
      highlight: "hidden maintenance costs?",
      highlightClass: "bg-pink-100 text-pink-900 border border-pink-200/90 px-3 py-1 rounded-full font-bold shadow-2xs",
    },
    {
      id: 2,
      prefix: "Is there enough",
      highlight: "visitor parking after 8 PM?",
      highlightClass: "bg-blue-100 text-blue-900 border border-blue-200/90 px-3 py-1 rounded-full font-bold shadow-2xs",
    },
    {
      id: 3,
      prefix: "How severe is the",
      highlight: "summer water shortage?",
      highlightClass: "bg-amber-100 text-amber-900 border border-amber-200/90 px-3 py-1 rounded-full font-bold shadow-2xs",
    },
    {
      id: 4,
      prefix: "Are the amenities actually",
      highlight: "well-maintained and functional?",
      highlightClass: "bg-emerald-100 text-emerald-900 border border-emerald-200/90 px-3 py-1 rounded-full font-bold shadow-2xs",
    },
    {
      id: 5,
      prefix: "Is the area prone to",
      highlight: "monsoon waterlogging?",
      highlightClass: "bg-cyan-100 text-cyan-900 border border-cyan-200/90 px-3 py-1 rounded-full font-bold shadow-2xs",
    },
    {
      id: 6,
      prefix: "Are there strict or unfair",
      highlight: "society committee rules?",
      highlightClass: "bg-indigo-100 text-indigo-900 border border-indigo-200/90 px-3 py-1 rounded-full font-bold shadow-2xs",
    },
  ];

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentQuestionIndex((prev) => (prev + 1) % questionItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered, questionItems.length]);

  const currentItem = questionItems[currentQuestionIndex];

  return (
    <section className="relative pt-5 pb-5 sm:pt-5 sm:pb-5 flex flex-col justify-center overflow-hidden bg-slate-50">
      
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src={heroBgImage}
          alt="Modern Luxury Apartment Towers Plaza"
          className="w-full h-full object-cover object-[center_35%] opacity-70 sm:opacity-65 transition-opacity duration-300 scale-105"
          onError={(e) => {
            // Fallback to /hero-bg.png if asset bundle fails
            const target = e.currentTarget;
            if (target.src !== window.location.origin + '/hero-bg.png') {
              target.src = '/hero-bg.png';
            }
          }}
        />
        {/* Balanced High-Key Gradient Mask for Crisp Image Visibility & Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/55 to-slate-50/95" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-7 px-4">
        
        {/* 1. Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-3xl mx-auto">
          Before You Pay the Token Amount...
        </h1>

        {/* 2. Subheadline with Underlined Buying / Renting */}
        <div className="text-base sm:text-xl md:text-2xl font-semibold text-slate-800 max-w-2xl mx-auto tracking-tight">
          <p>
            Remember,{' '}
            <span className="font-extrabold italic underline decoration-[#EF4444] decoration-[2.5px] underline-offset-4 text-slate-900">
              Buying
            </span>{' '}
            or{' '}
            <span className="font-extrabold italic underline decoration-[#EF4444] decoration-[2.5px] underline-offset-4 text-slate-900">
              Renting
            </span>{' '}
            a wrong flat can cost you lakhs.
          </p>
        </div>

        {/* Supporting Line above Search Bar */}
        <div className="pt-2 pb-1">
          <p className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-slate-900 inline-flex flex-wrap items-center justify-center gap-1.5 bg-blue-50/90 border border-blue-200/90 px-4 py-1.5 rounded-full shadow-2xs">
            <span>Know What Residents Know</span>
            <span className="text-blue-600 font-black">Before Making A Decision.</span>
          </p>
        </div>

        {/* 4. Glassmorphic Elevated Floating Search Bar */}
        <div id="hero-search-container" className="relative max-w-xl mx-auto pt-1">
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
                className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-80 blur-md pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          <form onSubmit={handleSearchSubmit} className="relative z-10">
            <div className={`relative bg-white/95 backdrop-blur-md border rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg shadow-slate-900/5 transition-all flex items-center ${
              isGlowing ? 'border-[#2563EB] ring-4 ring-blue-500/30' : 'border-slate-200/90 hover:border-slate-300 hover:shadow-slate-900/10'
            }`}>
              <div className="pl-3 pr-2 text-slate-400">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
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
                className="w-full text-xs sm:text-sm text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:text-xs sm:placeholder:text-sm font-sans font-normal"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all shadow-sm shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchTerm.trim().length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-left max-h-72 overflow-y-auto">
              {filteredSocieties.length > 0 ? (
                filteredSocieties.map((society) => (
                  <div
                    key={society.id}
                    onClick={() => {
                      onSelectSociety(society);
                      setShowDropdown(false);
                      setSearchTerm('');
                    }}
                    className="p-3.5 sm:p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {society.name}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {society.locality}, {society.city}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#2563EB] text-xs font-semibold rounded-full font-sans">
                        {society.residentProfilesCount} Resident Profiles
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No matching societies found. Try searching for "Lodha Amara" or "Powai".
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Things Most Buyers Find Out Too Late Badge & Dynamic Question */}
        <div className="pt-4 sm:pt-6 space-y-3">
          {/* Yellow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FEF08A] text-slate-900 text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-2xs border border-yellow-300">
            <Sparkles className="w-4 h-4 text-slate-800" />
            <span>THINGS MOST BUYERS FIND OUT TOO LATE</span>
          </div>

          {/* Dynamic Question Display */}
          <div
            className="min-h-[50px] flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-base sm:text-lg md:text-xl font-bold text-slate-900 flex items-center justify-center gap-2 flex-wrap"
              >
                <span>{currentItem.prefix}</span>
                <span className={currentItem.highlightClass}>
                  {currentItem.highlight}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Curved Bottom Arch Transition to Next Section */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-10 sm:h-16 text-[#F7F9FC] fill-current"
        >
          <path d="M0,0 C150,90 350,-40 600,40 C850,120 1050,10 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </div>

    </section>
  );
};



