import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Sparkles, Building, ArrowRight } from 'lucide-react';
import { Neighborhood } from '../types';
import heroBg from '../assets/images/regenerated_image_1784228757923.png';

interface HeroProps {
  localities: Neighborhood[];
  onSelectLocality: (locality: Neighborhood) => void;
  onBecomeExpertClick: () => void;
  onSearchFocusRef: React.MutableRefObject<HTMLInputElement | null>;
}

interface Regret {
  quote: string;
  author: string;
}

const REGRETS: Regret[] = [
  { quote: "I wish someone had told me about the water shortages.", author: "Homebuyer, Pune" },
  { quote: "We loved the apartment. We hated the commute.", author: "Family, Bengaluru" },
  { quote: "The maintenance doubled within a year.", author: "Apartment Owner, Mumbai" },
  { quote: "We only discovered the construction noise after moving.", author: "Resident, Hyderabad" },
  { quote: "Everything looked perfect during the site visit.", author: "First-time Buyer" },
  { quote: "The seepage in the master bedroom started with the first monsoon.", author: "Tenant, Gurgaon" },
  { quote: "The society rules here are incredibly restrictive for kids and pets.", author: "Mother of two, Noida" },
  { quote: "We paid a premium for the garden view, but a new tower blocked it in six months.", author: "Owner, Chennai" },
  { quote: "The lift stops working at least twice every week.", author: "Senior Citizen, Kolkata" },
  { quote: "The nearby landfill smell becomes unbearable every evening.", author: "Resident, Pune" },
  { quote: "Power backups here don't support heavy appliances like ACs.", author: "Tenant, Bengaluru" },
  { quote: "They promised a fully functioning clubhouse that is still not built after 3 years.", author: "Buyer, Thane" },
  { quote: "Our deposit was withheld for the most absurd reasons.", author: "Bachelor, Mumbai" },
  { quote: "Traffic outside the main gate adds 20 minutes to every single trip.", author: "Commuter, Delhi NCR" },
  { quote: "The water pressure is so low on the higher floors.", author: "Resident, Navi Mumbai" },
  { quote: "Visitor parking is practically non-existent, causing constant disputes.", author: "Resident, Bangalore" },
  { quote: "The cell phone reception inside the lower floor apartments is zero.", author: "Professional, Hyderabad" },
  { quote: "We were promised 24/7 security, but the gates are left open all night.", author: "Homeowner, Noida" },
  { quote: "The nearby drain overflows every single rainy season.", author: "Tenant, Chennai" },
  { quote: "Our neighbors play loud music till 2 AM, and the management does nothing.", author: "Resident, Pune" }
];

export const Hero: React.FC<HeroProps> = ({
  localities,
  onSelectLocality,
  onBecomeExpertClick,
  onSearchFocusRef,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine static and registered suggestions locally
  const combinedSuggestions = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];
    
    return localities.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.pincode.includes(query) ||
        (loc.society && loc.society.toLowerCase().includes(query)) ||
        (loc.apartmentName && loc.apartmentName.toLowerCase().includes(query)) ||
        (loc.landmarks && loc.landmarks.toLowerCase().includes(query))
      );
    });
  }, [localities, searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cycle through regrets
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % REGRETS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSuggestionClick = (loc: Neighborhood) => {
    setSearchQuery(`${loc.name}, ${loc.city}`);
    setShowSuggestions(false);
    onSelectLocality(loc);
  };

  const currentRegret = REGRETS[currentIndex];

  return (
    <section className="relative bg-slate-950 text-white py-12 sm:py-16 border-b border-slate-900 font-sans select-none">
      <style>{`
        @keyframes calmFadeInOut {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          16% {
            opacity: 1;
            transform: translateY(0);
          }
          84% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-8px);
          }
        }

        .animate-calm-fade-io {
          animation: calmFadeInOut 5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
      `}</style>

      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-scroll md:bg-fixed opacity-50 brightness-105 filter contrast-105 saturate-100"
          style={{
            backgroundImage: `url(${heroBg})`,
          }}
        />
        {/* Soft dark linear overlay to ensure pristine contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/2 to-slate-950/5 z-10" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center flex flex-col items-center">
        {/* Combined Static Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
          The Best Advice Lives Next Door.
        </h1>

        {/* Combined Static Subheading */}
        <p className="mt-4 text-slate-300 text-base sm:text-lg md:text-xl font-sans font-medium max-w-xl mx-auto leading-relaxed">
          <span className="text-amber-300 font-semibold underline decoration-amber-400/30 decoration-2 underline-offset-4">Talk to people who already live there</span> before <span className="text-white font-bold underline decoration-red-500 decoration-[3px] underline-offset-4">renting or buying your next home.</span>
        </p>

        {/* Minimalist Search Container */}
        <div ref={containerRef} className="mt-8 w-full max-w-xl relative z-40">
          <div className="bg-white border border-slate-200/80 focus-within:border-blue-500 rounded-xl flex items-center p-1 shadow-xs focus-within:shadow-sm transition-all">
            <div className="pl-2.5 text-slate-400">
               <Search className="w-4 h-4" />
            </div>
            <input
              ref={onSearchFocusRef}
              type="text"
              placeholder="Search locality, neighborhood, society or city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 px-2 py-1.5 text-slate-800 text-xs font-semibold outline-hidden placeholder-slate-400 placeholder:text-[10px] sm:placeholder:text-xs"
            />
            <button
              onClick={() => {
                if (combinedSuggestions.length > 0) {
                  handleSuggestionClick(combinedSuggestions[0]);
                } else {
                  setShowSuggestions(true);
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <span className="hidden sm:inline">Find Residents</span>
              <span className="inline sm:hidden">Find</span>
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {showSuggestions && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-850 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto text-left z-50">
              {combinedSuggestions.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-850 text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center justify-between">
                    <span>Matching Localities, Areas & Gated Societies</span>
                  </div>
                  {combinedSuggestions.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => handleSuggestionClick(loc)}
                      className="px-3 py-2 hover:bg-slate-800/80 cursor-pointer border-b border-slate-800/30 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="bg-slate-800 p-1.5 rounded-lg text-slate-300">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-xs">
                            {loc.name} {loc.society && loc.society !== loc.name ? `(${loc.society})` : ''}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {loc.apartmentName || 'Residential Area'}, {loc.city}, {loc.state} - {loc.pincode}
                          </p>
                        </div>
                      </div>
                      {loc.expertCount > 0 ? (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/30 rounded-full font-bold shrink-0">
                          {loc.expertCount} {loc.expertCount === 1 ? 'Expert' : 'Experts'}
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 border border-blue-900/30 rounded-full font-bold flex items-center gap-1 shrink-0">
                          <MapPin className="w-2.5 h-2.5 text-blue-400" />
                          <span>Details Available</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center space-y-4 bg-slate-900">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-300">No matching areas or societies found.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      We're expanding rapidly. Be the first to represent your neighborhood or society and help homeseekers in your area!
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBecomeExpertClick();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer font-bold shadow-md shadow-amber-400/5"
                  >
                    <span>Become a Local Expert & Earn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Suggestion Cities */}
        <div className="mt-4 flex flex-wrap justify-center items-center gap-2.5 text-xs text-slate-400">
          <span className="font-medium text-slate-500" style={{ color: '#c6c6c6' }}>Popular:</span>
          {['Mumbai', 'Pune', 'Bengaluru', 'Gurugram'].map((city) => (
            <button
              key={city}
              onClick={() => {
                setSearchQuery(city);
                setShowSuggestions(true);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
            >
              {city}
            </button>
          ))}
        </div>

        {/* Subheading above rotating text */}
        <p
          className="font-sans font-medium max-w-md mx-auto leading-relaxed mt-10"
          style={{
            fontSize: '12px',
            fontStyle: 'italic',
            color: '#ffffff',
            textDecorationLine: 'none'
          }}
        >
          Most people only discover the truth after moving in.
        </p>

        {/* Minimal Quote Block (Animated Content) */}
        <div className="mt-3 min-h-[100px] flex items-center justify-center w-full">
          <div
            key={currentIndex}
            className="animate-calm-fade-io text-center max-w-xl px-4"
          >
            <p className="text-lg sm:text-xl md:text-2xl font-serif italic text-amber-200/90 leading-relaxed font-light">
              "{currentRegret.quote}"
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-sans tracking-wide uppercase font-semibold mt-3">
              — {currentRegret.author}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
