import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Sparkles, Building, ArrowRight } from 'lucide-react';
import { Neighborhood } from '../types';

interface HeroProps {
  localities: Neighborhood[];
  onSelectLocality: (locality: Neighborhood) => void;
  onBecomeExpertClick: () => void;
  onSearchFocusRef: React.MutableRefObject<HTMLInputElement | null>;
}

export const Hero: React.FC<HeroProps> = ({
  localities,
  onSelectLocality,
  onBecomeExpertClick,
  onSearchFocusRef,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSuggestionClick = (loc: Neighborhood) => {
    setSearchQuery(`${loc.name}, ${loc.city}`);
    setShowSuggestions(false);
    onSelectLocality(loc);
  };

  return (
    <section className="relative bg-slate-950 text-white py-12 sm:py-20 border-b border-slate-900 font-sans">
      {/* Background Image with high-end building bokeh lights */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury apartment bokeh background"
          className="w-full h-full object-cover opacity-45 mix-blend-lighten"
          referrerPolicy="no-referrer"
        />
        {/* Dark radial and linear overlay to ensure the text remains pristine and highly visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950/95" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/80" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Trust Highlight Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full mb-4 sm:mb-6 font-mono tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 fill-blue-500/10" />
          <span>One Conversation Could Save You Years of Regret.</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white leading-tight">
          Talk to Someone Who <br className="hidden sm:inline" /> Already Lives There
        </h1>

        {/* Subheading */}
        <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-medium">
          Thinking about moving, renting or buying? <br className="hidden sm:inline" />
          Ask local residents before making one of life's biggest decisions.
        </p>

        {/* Minimalist Search Container */}
        <div ref={containerRef} className="mt-6 max-w-xl mx-auto relative z-40">
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
          <span className="font-medium text-slate-500">Popular:</span>
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


      </div>
    </section>
  );
};
