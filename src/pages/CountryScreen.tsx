import React from 'react';
import { Globe, ArrowLeft, Heart, AlertTriangle, FileText, ChevronRight, BarChart2 } from 'lucide-react';
import { Story, Situation, StoryComment } from '../types';
import { COUNTRIES_DATA } from '../data/mockData';
import StoryCard from '../components/StoryCard';

interface CountryScreenProps {
  countrySlug: string;
  allStories: Story[];
  setScreen: (screen: { type: string; slug?: string }) => void;
  onVoteHelpful: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onAddUpdate: (storyId: string, text: string, regretScore: number, daysAfter: number) => void;
  savedStories: string[];
  darkMode: boolean;
  onSelectTag: (tag: string) => void;
  onSelectCountry: (country: string) => void;
  currentUsername: string;
  isAdmin?: boolean;
  onDeleteStory?: (id: string) => void;
  onEditStory?: (id: string, title: string, text: string) => void;
  comments?: StoryComment[];
  onAddComment?: (storyId: string, text: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
}

export default function CountryScreen({
  countrySlug,
  allStories,
  setScreen,
  onVoteHelpful,
  onToggleBookmark,
  onAddUpdate,
  savedStories,
  darkMode,
  onSelectTag,
  onSelectCountry,
  currentUsername,
  isAdmin = false,
  onDeleteStory,
  onEditStory,
  comments = [],
  onAddComment,
  currentUser,
  onGoogleLogin
}: CountryScreenProps) {
  
  // Dynamic country info resolution supporting all countries of the world beautifully
  let countryInfo = COUNTRIES_DATA.find(c => c.slug === countrySlug);
  if (!countryInfo) {
    const name = countrySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    countryInfo = {
      slug: countrySlug,
      name: name,
      topSituations: ["Boyfriend Doesn't Want Marriage", "Stayed After Cheating", "Long Distance Relationship"],
      topRegrets: [
        "Neglecting early boundary alignment",
        "postponing crucial values alignment talks",
        "Snooping checks instead of transparent discussion"
      ],
      commonOutcomes: `Custom cultural logs for partners in ${name} emphasize that early expectations mapping avoids long-term timeline regret.`,
      storiesCount: allStories.filter(s => s.country.toLowerCase() === name.toLowerCase()).length || 0
    };
  }

  // Filter stories matching country
  const countryStories = allStories.filter(s => s.country.toLowerCase() === countryInfo!.name.toLowerCase());

  return (
    <div className="space-y-6 pb-16 animate-fadeIn text-white">
      
      {/* Return */}
      <button
        onClick={() => setScreen({ type: 'explore' })}
        className="text-xs text-[#AAB2C0] hover:text-white inline-flex items-center gap-1 font-semibold border border-[#30363D] bg-[#161B22] px-3 py-1.5 rounded-xl transition-all"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Cultural Directories
      </button>

      {/* Hero Display */}
      <div className="rounded-2xl border border-[#30363D] bg-gradient-to-r from-teal-900/10 to-[#161B22] p-5 sm:p-6 shadow-md relative">
        <div className="relative max-w-xl space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#2ECC71]">Geo-Cultural Dossier</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{countryInfo.name} Relationship Outcomes</h1>
          <p className="text-xs text-[#AAB2C0] leading-relaxed">
            Examining localized relationship and marital frameworks, familial approval ratios, and post-divorce or post-split support systems.
          </p>
        </div>
      </div>

      {/* Metrics breakdown details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Top Situations list */}
        <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Top Reported Situations</h3>
          <ul className="space-y-2">
            {countryInfo.topSituations.map((sit, i) => (
              <li 
                key={i}
                onClick={() => setScreen({ type: 'situation', slug: sit.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '') })}
                className="rounded bg-[#0D1117] p-2 text-xs font-medium hover:text-[#4F8CFF] cursor-pointer hover:border-[#4F8CFF]/50 border border-transparent transition-all flex items-center justify-between"
              >
                <span>{sit}</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
              </li>
            ))}
          </ul>
        </div>

        {/* Top Regrets */}
        <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Most Prominent Local Regrets</h3>
          <ul className="space-y-2">
            {countryInfo.topRegrets.map((reg, i) => (
              <li key={i} className="rounded bg-[#0D1117] p-2 text-xs flex items-start gap-1.5 leading-normal text-[#AAB2C0]">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{reg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Outcomes Ratio */}
        <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4B942]">Statistically Common Outcomes</h3>
          <div className="rounded bg-[#0D1117] p-3 border border-[#30363D]/60 text-xs leading-relaxed text-[#AAB2C0] font-serif">
            "{countryInfo.commonOutcomes}"
          </div>
          <div className="text-[10px] text-zinc-500 leading-normal">
            *Ratios derived automatically from active BeforeRegret anonymous timeline logs across the region.
          </div>
        </div>

      </div>

      {/* Local Stories */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Latest Chronicles from {countryInfo.name}</h3>

        {countryStories.length === 0 ? (
          <div className="text-center rounded-xl border border-dashed border-[#30363D] p-10 text-zinc-500">
            <p className="text-xs font-bold">No active stories submitted from {countryInfo.name} yet.</p>
            <p className="text-[10px] text-zinc-600 mt-1">Be the first to share your timeline outcome to help other citizens.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {countryStories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                isBookmarked={savedStories.includes(story.id)}
                onToggleBookmark={onToggleBookmark}
                onVoteHelpful={onVoteHelpful}
                onSelectTag={onSelectTag}
                onSelectCountry={onSelectCountry}
                darkMode={darkMode}
                currentUsername={currentUsername}
                isAdmin={isAdmin}
                onDeleteStory={onDeleteStory}
                onEditStory={onEditStory}
                comments={comments}
                onAddComment={onAddComment}
                currentUser={currentUser}
                onGoogleLogin={onGoogleLogin}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
