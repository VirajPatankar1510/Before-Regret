import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, X, PlusCircle, Gavel, FileText, User, Sparkles, LogIn, ChevronRight, Compass, Sun, Moon, BookOpen, Heart, AlertTriangle } from 'lucide-react';
import { PRESEEDED_SITUATIONS, PRESEEDED_COURT_CASES, PRESEEDED_QUESTIONS, COUNTRIES_DATA } from '../data/mockData';

interface NavigationProps {
  currentScreen: { type: string; slug?: string };
  setScreen: (screen: { type: string; slug?: string }) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenSubmit: () => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
}

export default function Navigation({ 
  currentScreen, 
  setScreen, 
  darkMode, 
  setDarkMode, 
  onOpenSubmit,
  currentUser,
  onGoogleLogin
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

    const query = searchQuery.toLowerCase();
    const results: { type: 'situation' | 'court' | 'question' | 'country' | 'tag'; label: string; slug: string }[] = [];

    // Search situations
    PRESEEDED_SITUATIONS.forEach(s => {
      if (s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) {
        results.push({ type: 'situation', label: s.name, slug: s.slug });
      }
    });

    // Search court cases
    PRESEEDED_COURT_CASES.forEach(c => {
      if (c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)) {
        results.push({ type: 'court', label: `Court: ${c.title}`, slug: c.slug });
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
    { label: 'Low regret stories', screen: { type: 'tag', slug: 'successful-stories' }, icon: Heart },
    { label: 'High Regret stories', screen: { type: 'tag', slug: 'cheating' }, icon: AlertTriangle },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#30363D] bg-[#0D1117] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setScreen({ type: 'home' })}
            className="flex cursor-pointer items-center space-x-2 shrink-0 select-none"
            id="logo-desktop"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-pink-500 font-extrabold text-white text-xl">
              BR
            </div>
            <div className="block">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white">Before<span className="text-[#4F8CFF]">Regret</span></span>
              <p className="text-[8px] sm:text-[9px] text-[#AAB2C0] leading-none">Before you stay. Before you leave.</p>
            </div>
          </div>

          {/* Navigation Menu Links Desktop */}
          <div className="hidden lg:flex items-center space-x-1 shrink-0">
            {menuItems.slice(0, 3).map(item => {
              const active = currentScreen.type === item.screen.type && (!item.screen.slug || currentScreen.slug === item.screen.slug);
              return (
                <button
                  key={item.label}
                  onClick={() => setScreen(item.screen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active ? 'text-[#4F8CFF] bg-[#161B22]' : 'text-[#AAB2C0] hover:text-white hover:bg-[#161B22]/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>



          {/* Action Trigger Elements Right */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* Google Login / Profile Avatar trigger */}
            {currentUser ? (
              <button
                onClick={() => setScreen({ type: 'profile' })}
                className={`p-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  currentScreen.type === 'profile' ? 'text-[#4F8CFF] bg-[#161B22]' : 'text-[#AAB2C0] hover:text-white hover:bg-[#161B22]'
                }`}
                title={`Logged in as ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden sm:inline text-xs font-bold">My Profile & Replies</span>
              </button>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="p-1 px-2 sm:p-2 sm:px-3 rounded-xl flex items-center gap-1.1 sm:gap-1.5 text-[#F4B942] hover:text-white hover:bg-[#161B22] border border-[#F4B942]/40 hover:border-[#F4B942] transition-colors"
                title="Google Login"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs font-bold">Google Login</span>
                <span className="inline sm:hidden text-xs font-bold">Login</span>
              </button>
            )}

            {/* Submit CTA */}
            <button
              onClick={onOpenSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-[#4F8CFF]/15 hover:from-[#4F8CFF]/90 hover:to-indigo-600/90 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Submit Story</span>
              <span className="inline sm:hidden">Submit</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-[#AAB2C0] hover:text-white hover:bg-[#161B22] lg:hidden"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="border-t border-[#30363D] bg-[#0E131B] py-3 lg:hidden px-4 space-y-3">
          
          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  setScreen(item.screen);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#161B22] px-3 py-2.5 text-left text-xs font-semibold text-[#AAB2C0] hover:text-white hover:bg-[#30363D] transition-all"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-[#4F8CFF]" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

           {currentUser && (
            <div className="border-t border-[#30363D] pt-3 flex items-center justify-between">
              <span className="text-[11px] text-[#AAB2C0]">
                Connected: {currentUser.displayName || currentUser.email}
              </span>
              <span className="inline-block h-2 w-2 rounded-full animate-pulse bg-emerald-400" />
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
