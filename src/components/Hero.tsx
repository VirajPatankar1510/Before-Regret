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

  // Filter localities based on query
  const filteredSuggestions = localities.filter((loc) => {
    const query = searchQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(query) ||
      loc.city.toLowerCase().includes(query) ||
      loc.pincode.includes(query) ||
      (loc.society && loc.society.toLowerCase().includes(query)) ||
      (loc.apartmentName && loc.apartmentName.toLowerCase().includes(query))
    );
  });

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
    <section className="bg-white py-10 sm:py-16 border-b border-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Trust Highlight Badge */}
        <div className="inline-flex items-center gap-1.5 bg-blue-50/70 border border-blue-100/50 text-blue-700 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full mb-4 sm:mb-6 font-mono tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
          <span>Before Regret: 100% Unbiased Indian Resident Network</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-slate-900 leading-tight">
          Talk to Someone Who <br className="hidden sm:inline" /> Already Lives There
        </h1>

        {/* Subheading */}
        <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
          Thinking about moving, renting or buying? <br className="hidden sm:inline" />
          Ask local residents before making one of life's biggest decisions.
        </p>

        {/* Minimalist Search Container */}
        <div ref={containerRef} className="mt-6 max-w-xl mx-auto relative z-40">
          <div className="bg-white border border-slate-200/80 focus-within:border-blue-600 rounded-xl flex items-center p-1 shadow-xs focus-within:shadow-sm transition-all">
            <div className="pl-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={onSearchFocusRef}
              type="text"
              placeholder="Search society or city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 px-2 py-1.5 text-slate-800 text-xs font-medium outline-hidden"
            />
            <button
              onClick={() => {
                if (filteredSuggestions.length > 0) {
                  handleSuggestionClick(filteredSuggestions[0]);
                } else {
                  setShowSuggestions(true);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0"
            >
              <span className="hidden sm:inline">Find Residents</span>
              <span className="inline sm:hidden">Find</span>
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {showSuggestions && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto text-left">
              {filteredSuggestions.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                    Matching Societies & Localities
                  </div>
                  {filteredSuggestions.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => handleSuggestionClick(loc)}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100/50 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {loc.name} {loc.society ? `(${loc.society})` : ''}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {loc.apartmentName || 'Residential Area'}, {loc.city}, {loc.state} - {loc.pincode}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full font-bold">
                        {loc.expertCount} {loc.expertCount === 1 ? 'Expert' : 'Experts'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching localities or societies found. Try searching for 'Mumbai', 'Bimbisar', 'Prestige', or 'DLF'.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Suggestion Cities */}
        <div className="mt-4 flex flex-wrap justify-center items-center gap-2.5 text-xs text-slate-400">
          <span className="font-medium">Popular:</span>
          {['Mumbai', 'Pune', 'Bengaluru', 'Gurugram'].map((city) => (
            <button
              key={city}
              onClick={() => {
                setSearchQuery(city);
                setShowSuggestions(true);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
          <button
            onClick={() => {
              if (onSearchFocusRef.current) {
                onSearchFocusRef.current.focus();
              }
            }}
            className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            Find Local Residents
          </button>
          <button
            onClick={onBecomeExpertClick}
            className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Become a Resident</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>
    </section>
  );
};
