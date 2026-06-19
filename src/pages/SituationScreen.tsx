import React, { useState } from 'react';
import { ChevronRight, ArrowLeft, SlidersHorizontal, PlusCircle, Bookmark, Share2, HelpCircle, FileText, AlertCircle, RefreshCw, BarChart2, Globe, Users, Clock, Info } from 'lucide-react';
import { Situation, Story, StoryUpdate, StoryComment } from '../types';
import StoryCard from '../components/StoryCard';
import ChartsComponent from '../components/ChartsComponent';

const ALL_WORLD_COUNTRIES = [
  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", 
  "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", 
  "Indonesia", "Ireland", "Italy", "Japan", "Malaysia", "Mexico", "Netherlands", 
  "New Zealand", "Norway", "Philippines", "Poland", "Portugal", "Saudi Arabia", "Singapore", 
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", 
  "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
];

interface SituationScreenProps {
  situation: Situation;
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
  onDeleteComment?: (commentId: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  highlightedStoryId?: string | null;
}

export default function SituationScreen({
  situation,
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
  onDeleteComment,
  currentUser,
  onGoogleLogin,
  highlightedStoryId = null
}: SituationScreenProps) {
  
  // Sidebar Filters states
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterDecision, setFilterDecision] = useState('All');
  const [filterOutcome, setFilterOutcome] = useState('All');
  const [maxRegret, setMaxRegret] = useState(10);
  const [minAge, setMinAge] = useState(18);

  const situationStories = allStories.filter(s => s.situationSlug === situation.slug);

  // Apply Sidebar Filters
  const filteredStories = situationStories.filter(s => {
    if (filterCountry !== 'All' && s.country !== filterCountry) return false;
    if (filterGender !== 'All' && s.gender !== filterGender) return false;
    if (filterDecision !== 'All' && s.decisionMade !== filterDecision) return false;
    if (filterOutcome !== 'All' && s.currentOutcome !== filterOutcome) return false;
    if (s.regretScore > maxRegret) return false;
    if (s.age < minAge) return false;
    return true;
  });

  const getRegretColor = (score: number) => {
    if (score >= 8) return 'text-[#C0392B]';
    if (score >= 5.5) return 'text-[#D97706]';
    return 'text-[#2E7D32]';
  };

  const storiesCountries = Array.from(new Set(situationStories.map(s => s.country)));
  const countriesList = Array.from(new Set([...ALL_WORLD_COUNTRIES, ...storiesCountries])).sort();
  const decisionsList = Array.from(new Set(situationStories.map(s => s.decisionMade)));
  const outcomesList = Array.from(new Set(situationStories.map(s => s.currentOutcome)));

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* BREADCRUMB */}
      <div className="flex items-center space-x-1.5 text-[11px] text-[#6B7280] select-none font-medium font-mono">
        <button onClick={() => setScreen({ type: 'home' })} className="hover:text-[#24324A] transition-colors">BeforeRegret</button>
        <ChevronRight className="h-3 w-3 text-zinc-300" />
        <button onClick={() => setScreen({ type: 'explore' })} className="hover:text-[#24324A] transition-colors">Situations</button>
        <ChevronRight className="h-3 w-3 text-zinc-300" />
        <span className="text-[#C9A227] font-semibold truncate max-w-[200px]">{situation.name}</span>
      </div>

      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#24324A] bg-[#24324A]/5 border border-[#24324A]/10 px-2.5 py-0.5 rounded-full inline-block">
              Category: {situation.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#24324A] tracking-tight leading-snug font-serif">
              {situation.name}
            </h1>
            <p className="text-xs text-[#6B7280] max-w-2xl leading-relaxed font-sans font-medium">
              {situation.description}
            </p>
          </div>
          <button
            onClick={() => setScreen({ type: 'question_list' })}
            className="inline-flex self-start sm:self-center items-center gap-1.5 rounded-xl bg-[#24324A] hover:bg-[#1C273A] px-4 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all shrink-0"
          >
            <HelpCircle className="h-4 w-4" /> Seek Community Advice
          </button>
        </div>
      </div>

      {/* STATISTICS DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-semibold font-sans">
        {[
          { label: "Avg Regret Index", val: `${situation.stats.avgRegret}/10`, color: getRegretColor(situation.stats.avgRegret) },
          { label: "Still Unmarried", val: `${situation.stats.stillTogetherPercent}%`, color: "text-[#1F2937]" },
          { label: "Married %", val: `${situation.stats.marriedPercent}%`, color: "text-[#1F2937]" },
          { label: "Separated %", val: `${situation.stats.separatedPercent}%`, color: "text-[#1F2937]" },
          { label: "Avg Relationship", val: situation.stats.avgRelationshipLength, color: "text-[#1F2937]" }
        ].map((block, idx) => (
          <div key={idx} className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-center flex flex-col justify-center shadow-xs">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#6B7280] leading-none block mb-2 font-mono">{block.label}</span>
            <span className={`text-md sm:text-lg font-bold leading-none ${block.color}`}>{block.val}</span>
          </div>
        ))}
      </div>

      {/* VISUAL CHARTS SECTION */}
      <ChartsComponent
        decisionData={situation.decisionBreakdown}
        outcomeData={situation.outcomeBreakdown}
        regretData={situation.regretOverTime}
        countryData={situation.countryBreakdown}
      />

      <div className="border-t border-[#ECECEC]" />

      {/* FILTER & FEED CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
              <span className="text-xs font-bold text-[#24324A] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#24324A]" /> Dynamic Filters
              </span>
              {(filterCountry !== 'All' || filterGender !== 'All') && (
                <button
                  onClick={() => {
                    setFilterCountry('All');
                    setFilterGender('All');
                    setFilterDecision('All');
                    setFilterOutcome('All');
                    setMaxRegret(10);
                    setMinAge(18);
                  }}
                  className="text-[10px] text-[#C0392B] hover:underline font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Filter Country */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#6B7280] font-mono">Country of Origin</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white p-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] font-semibold"
              >
                <option value="All">All Countries ({countriesList.length})</option>
                {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Filter Gender */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#6B7280] font-mono">Gender</label>
              <div className="flex flex-wrap gap-1">
                {['All', 'Female', 'Male'].map(gender => (
                  <button
                    key={gender}
                    onClick={() => setFilterGender(gender)}
                    className={`rounded px-2.5 py-1 text-[10px] font-bold border transition-all ${
                      filterGender === gender 
                        ? 'bg-[#FFF8E1] border-[#C9A227] text-[#C9A227]' 
                        : 'bg-white border-[#E5E7EB] text-[#6B7280]'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Feed Columns */}
        <div className="lg:col-span-9 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#24324A] uppercase tracking-wider font-mono">
              Timeline Chronicles ({filteredStories.length} matched)
            </h3>
            <span className="text-xs text-[#6B7280] font-medium">Sorted by votes</span>
          </div>

          {filteredStories.length === 0 ? (
            <div className="text-center rounded-2xl border border-dashed border-[#E5E7EB] p-10 space-y-4 bg-white shadow-sm">
              {filterCountry !== 'All' ? (
                <>
                  <Globe className="h-8 w-8 text-[#C9A227] mx-auto animate-pulse" />
                  <p className="text-sm font-bold text-[#24324A]">No custom local chronicles recorded yet</p>
                  <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed font-medium">
                    No anonymous timelines matching your criteria have been committed from <b className="text-[#24324A]">{filterCountry}</b> yet. Be the first to share your outcome!
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => setScreen({ type: 'question_list' })}
                      className="rounded-xl bg-[#24324A] hover:bg-[#1C273A] font-bold px-4 py-2 text-xs text-white transition-all shadow-xs"
                    >
                      Get Community Advice
                    </button>
                    <button
                      onClick={() => setFilterCountry('All')}
                      className="rounded-xl border border-[#E5E7EB] hover:bg-neutral-50 px-4 py-2 text-xs text-[#6B7280] transition-all font-bold"
                    >
                      Compare Global Entries
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-[#C9A227] mx-auto" />
                  <p className="text-xs text-[#24324A] font-bold">No exact demographic matches found matching filters.</p>
                  <p className="text-xs text-[#6B7280] font-medium">Try clearing or widening your constraints to examine comparable outcomes.</p>
                  <button
                    onClick={() => {
                      setFilterCountry('All');
                      setFilterGender('All');
                      setFilterDecision('All');
                      setFilterOutcome('All');
                      setMaxRegret(10);
                      setMinAge(18);
                    }}
                    className="rounded-lg bg-[#24324A] hover:bg-[#1C273A] font-bold px-3.5 py-1.5 text-xs text-white shadow-xs"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {filteredStories.map(story => (
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
                  onDeleteComment={onDeleteComment}
                  currentUser={currentUser}
                  onGoogleLogin={onGoogleLogin}
                  highlighted={story.id === highlightedStoryId}
                />
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
