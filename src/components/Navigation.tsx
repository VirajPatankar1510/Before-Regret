import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, X, Gavel, FileText, User, Sparkles, ChevronRight, Compass, Sun, Moon, BookOpen, Heart, AlertTriangle, Shield } from 'lucide-react';
import { PRESEEDED_SITUATIONS, PRESEEDED_QUESTIONS, COUNTRIES_DATA } from '../data/mockData';
import { Story, CourtCase } from '../types';
import BeforeRegretLogo from './BeforeRegretLogo';

interface NavigationProps {
  currentScreen: { type: string; slug?: string };
  setScreen: (screen: { type: string; slug?: string }) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onCaseRetrieve: (caseNum: string) => void;
  stories: Story[];
  courtCases: CourtCase[];
  newSubmissionsCount?: number;
}

export default function Navigation({ 
  currentScreen, 
  setScreen, 
  darkMode, 
  setDarkMode, 
  onCaseRetrieve,
  stories,
  courtCases,
  newSubmissionsCount = 0
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Search Results matches across situations, stories, court, questions, tags, countries
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: { type: 'situation' | 'court' | 'question' | 'country' | 'tag'; label: string; slug: string }[] = [];

    // Search by Case Number first (high priority)
    courtCases.forEach(c => {
      const caseNum = c.caseNumber || '';
      if (caseNum.toLowerCase().includes(query) || c.title.toLowerCase().includes(query)) {
        results.push({ type: 'court', label: `⚖️ ${caseNum ? `[${caseNum}]` : 'BR Relationship Court'}: ${c.title}`, slug: c.slug });
      }
    });

    stories.forEach(s => {
      const caseNum = s.caseNumber || '';
      const matchesText = caseNum.toLowerCase().includes(query) || s.title.toLowerCase().includes(query);
      const matchesKeywords = s.tags && s.tags.some(t => t.toLowerCase().includes(query));
      if (matchesText || matchesKeywords) {
        results.push({ type: 'situation', label: `📂 ${caseNum ? `[${caseNum}]` : 'Case Story'}: ${s.title}`, slug: s.situationSlug });
      }
    });

    // Search situations
    PRESEEDED_SITUATIONS.forEach(s => {
      if (s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) {
        results.push({ type: 'situation', label: s.name, slug: s.slug });
      }
    });

    // Search questions
    PRESEEDED_QUESTIONS.forEach(q => {
      if (q.title.toLowerCase().includes(query) || q.description.toLowerCase().includes(query)) {
        results.push({ type: 'question', label: `Q&A: ${q.title}`, slug: q.slug });
      }
    });

    // Search countries
    COUNTRIES_DATA.forEach(c => {
      if (c.name.toLowerCase().includes(query)) {
        results.push({ type: 'country', label: `Country: ${c.name}`, slug: c.slug });
      }
    });

    // Extract pre-seeded tags
    const tags = ['marriage', 'cheating', 'long-distance', 'commitment', 'children', 'forgiveness', 'privacy', 'boundaries', 'moving'];
    tags.forEach(t => {
      if (t.toLowerCase().includes(query)) {
        results.push({ type: 'tag', label: `Tag: #${t}`, slug: t });
      }
    });

    return results.slice(0, 7);
  };

  const suggestions = getSuggestions();

  const handleSelectSuggestion = (item: { type: string; slug: string }) => {
    setScreen({ type: item.type, slug: item.slug });
    setSearchQuery('');
    setShowSuggestions(false);
    setIsOpen(false);
  };

  const getNavPath = (screen: { type: string; slug?: string }) => {
    if (screen.type === 'explore') return '/explore';
    if (screen.type === 'court_list') return '/court';
    if (screen.type === 'question_list') return '/boards';
    if (screen.type === 'red_flag_meter') return '/flags';
    if (screen.type === 'regret_stories') return '/regrets';
    if (screen.type === 'guides') return '/guides';
    if (screen.type === 'admin_feed') return '/admin-feed';
    return '/';
  };

  const menuItems = [
    { label: 'Explore', screen: { type: 'explore' }, icon: Compass },
    { label: 'Become a Judge', screen: { type: 'court_list' }, icon: Gavel },
    { label: 'Ask/Give Advice', screen: { type: 'question_list' }, icon: Sparkles },
    { label: 'Red Flag Meter', screen: { type: 'red_flag_meter' }, icon: AlertTriangle },
    { label: 'Regret Registry', screen: { type: 'regret_stories' }, icon: Heart },
    { label: 'Decision Guides', screen: { type: 'guides' }, icon: BookOpen },
  ];

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white text-[#1F2937] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center min-h-[4rem] py-2.5 lg:py-3.5 gap-2.5 lg:gap-3">
          <div className="flex items-center justify-between gap-4 w-full">
            
            {/* Logo */}
            <a 
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setScreen({ type: 'home' });
              }}
              className="flex cursor-pointer items-center space-x-2.5 shrink-0 select-none"
              id="logo-desktop"
            >
              <BeforeRegretLogo showText={false} size={40} lightTheme={true} className="shrink-0" />
              <div className="block">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-[#24324A]">Before<span className="text-[#C9A227]">Regret</span></span>
                <p className="text-[8px] sm:text-[9px] text-[#6B7280] leading-none font-medium">Before you stay. Before you leave.</p>
              </div>
            </a>

            {/* Action Trigger Elements Right */}
            <div className="flex items-center space-x-2 shrink-0">
              
              {/* Topic Search Input with suggestions */}
              <div className="relative hidden md:block" ref={suggestionsRef}>
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E5E7EB] hover:border-[#C9A227]/60 rounded-xl px-2.5 py-1.5 transition-all text-xs focus-within:ring-2 focus-within:ring-[#24324A]/10 shadow-xs">
                  <Search className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="bg-transparent border-none text-[11px] text-[#1F2937] w-36 xl:w-48 focus:outline-none placeholder-zinc-400 font-semibold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = searchQuery.trim();
                        if (val) {
                          const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                          const queryNorm = normalize(val);
                          const matchedSituation = PRESEEDED_SITUATIONS.find(s => normalize(s.name).includes(queryNorm) || normalize(s.slug).includes(queryNorm));
                          if (matchedSituation) {
                            setScreen({ type: 'situation', slug: matchedSituation.slug });
                          } else {
                            setScreen({ type: 'explore', slug: val });
                          }
                          setSearchQuery('');
                          setShowSuggestions(false);
                        }
                      }
                    }}
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-xl z-50 animate-slideDown max-h-80 overflow-y-auto">
                    <div className="px-2 py-1 text-[9px] uppercase font-bold text-[#6B7280] tracking-wider border-b border-[#FAF8F2] mb-1">
                      Suggested Outcomes
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAF8F2] text-[11px] font-semibold text-[#4B5563] hover:text-[#24324A] transition-colors flex items-center justify-between gap-1"
                      >
                        <span className="truncate">{item.label}</span>
                        <ChevronRight className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Finder Input */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E5E7EB] hover:border-[#C9A227]/60 rounded-xl px-2.5 py-1.5 transition-all text-xs focus-within:ring-2 focus-within:ring-[#24324A]/10 shadow-xs">
                <span className="text-[9px] text-[#C9A227] font-mono font-extrabold tracking-wider hidden sm:inline shrink-0 select-none">SEARCH CASE ID</span>
                <input
                  type="text"
                  placeholder="CASE KEY..."
                  className="bg-transparent border-none text-[11px] text-[#1F2937] w-16 sm:w-24 focus:outline-none placeholder-zinc-400 font-mono font-semibold uppercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        onCaseRetrieve(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const val = input.value.trim();
                    if (val) {
                      onCaseRetrieve(val);
                      input.value = '';
                    }
                  }}
                  className="text-[#6B7280] hover:text-[#24324A] transition-colors shrink-0 p-0.5"
                  title="Search Case Reference Code"
                >
                  <Search className="h-3 w-3" />
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#FAF8F2] lg:hidden animate-fadeIn"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Menu Links Desktop */}
          <div className="hidden lg:flex items-center justify-center flex-wrap gap-2.5 pt-2 border-t border-slate-100 w-full">
            {menuItems.map(item => {
              const screenCast = item.screen as { type: string; slug?: string };
              const active = currentScreen.type === screenCast.type && (!screenCast.slug || currentScreen.slug === screenCast.slug);
              return (
                <a
                  key={item.label}
                  href={getNavPath(screenCast)}
                  onClick={(e) => {
                    e.preventDefault();
                    setScreen(item.screen);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    active 
                      ? 'text-[#24324A] bg-[#F4F1E8] border border-[#E5E7EB]' 
                      : 'text-[#6B7280] hover:text-[#24324A] hover:bg-[#FAF8F2]'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? 'text-[#C9A227]' : 'text-[#9CA3AF]'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="border-t border-[#E5E7EB] bg-[#FAF8F2] py-4 lg:hidden px-4 space-y-3 shadow-lg">
          
          {/* Mobile Search input */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs">
              <Search className="h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search topics, tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="bg-transparent border-none text-xs text-[#1F2937] w-full focus:outline-none placeholder-zinc-400 font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = searchQuery.trim();
                    if (val) {
                      const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
                      const queryNorm = normalize(val);
                      const matchedSituation = PRESEEDED_SITUATIONS.find(s => normalize(s.name).includes(queryNorm) || normalize(s.slug).includes(queryNorm));
                      if (matchedSituation) {
                        setScreen({ type: 'situation', slug: matchedSituation.slug });
                      } else {
                        setScreen({ type: 'explore', slug: val });
                      }
                      setSearchQuery('');
                      setIsOpen(false);
                    }
                  }
                }}
              />
            </div>
            {searchQuery.trim() && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSelectSuggestion(item);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#FAF8F2] text-[11px] font-semibold text-[#4B5563] truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  setScreen(item.screen);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280] hover:text-[#24324A] hover:bg-[#F4F1E8] transition-all relative"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-[#C9A227]" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
