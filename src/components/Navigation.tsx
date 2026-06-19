import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, X, Gavel, FileText, User, Sparkles, ChevronRight, Compass, Sun, Moon, BookOpen, Heart, AlertTriangle } from 'lucide-react';
import { PRESEEDED_SITUATIONS, PRESEEDED_QUESTIONS, COUNTRIES_DATA } from '../data/mockData';
import { Story, CourtCase } from '../types';

interface NavigationProps {
  currentScreen: { type: string; slug?: string };
  setScreen: (screen: { type: string; slug?: string }) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onCaseRetrieve: (caseNum: string) => void;
  stories: Story[];
  courtCases: CourtCase[];
}

export default function Navigation({ 
  currentScreen, 
  setScreen, 
  darkMode, 
  setDarkMode, 
  onCaseRetrieve,
  stories,
  courtCases
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
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
        results.push({ type: 'court', label: `⚖️ ${caseNum ? `[${caseNum}]` : 'Court'}: ${c.title}`, slug: c.slug });
      }
    });

    stories.forEach(s => {
      const caseNum = s.caseNumber || '';
      if (caseNum.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)) {
        results.push({ type: 'situation', label: `📂 ${caseNum ? `[${caseNum}]` : 'Chronicle'}: ${s.title}`, slug: s.situationSlug });
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

  const menuItems = [
    { label: 'Explore', screen: { type: 'explore' }, icon: Compass },
    { label: 'Become a Judge', screen: { type: 'court_list' }, icon: Gavel },
    { label: 'Advice Boards', screen: { type: 'question_list' }, icon: Sparkles },
    { label: 'Red Flag Meter', screen: { type: 'red_flag_meter' }, icon: AlertTriangle },
    { label: 'Regret Registry', screen: { type: 'regret_stories' }, icon: Heart },
    { label: 'My Profile', screen: { type: 'profile' }, icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white text-[#1F2937] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setScreen({ type: 'home' })}
            className="flex cursor-pointer items-center space-x-2.5 shrink-0 select-none"
            id="logo-desktop"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24324A] font-extrabold text-[#F7E9B4] text-lg shadow-inner">
              BR
            </div>
            <div className="block">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight text-[#24324A]">Before<span className="text-[#C9A227]">Regret</span></span>
              <p className="text-[8px] sm:text-[9px] text-[#6B7280] leading-none font-medium">Before you stay. Before you leave.</p>
            </div>
          </div>

          {/* Navigation Menu Links Desktop */}
          <div className="hidden lg:flex items-center space-x-3 shrink-0">
            {menuItems.map(item => {
              const screenCast = item.screen as { type: string; slug?: string };
              const active = currentScreen.type === screenCast.type && (!screenCast.slug || currentScreen.slug === screenCast.slug);
              return (
                <button
                  key={item.label}
                  onClick={() => setScreen(item.screen)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                    active 
                      ? 'text-[#24324A] bg-[#F4F1E8] border border-[#E5E7EB]' 
                      : 'text-[#6B7280] hover:text-[#24324A] hover:bg-[#FAF8F2]'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? 'text-[#C9A227]' : 'text-[#9CA3AF]'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Action Trigger Elements Right */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* 🔑 Cryptographic Case Retrieval Input */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F2] border border-[#E5E7EB] hover:border-[#C9A227]/60 rounded-xl px-2.5 py-1.5 transition-all text-xs focus-within:ring-2 focus-within:ring-[#24324A]/10">
              <span className="text-[9px] text-[#C9A227] font-mono font-extrabold tracking-widest hidden sm:inline shrink-0 select-none">RETRIEVE CASE</span>
              <input
                type="text"
                placeholder="CASE ID..."
                className="bg-transparent border-none text-[11px] text-[#1F2937] w-[75px] xs:w-[90px] focus:outline-none placeholder-zinc-400 font-mono font-extrabold uppercase"
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
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="border-t border-[#E5E7EB] bg-[#FAF8F2] py-4 lg:hidden px-4 space-y-3 shadow-lg">
          
          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  setScreen(item.screen);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280] hover:text-[#24324A] hover:bg-[#F4F1E8] transition-all"
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
