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
  onOpenSubmit: () => void;
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

export default function SituationScreen({
  situation,
  allStories,
  setScreen,
  onOpenSubmit,
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
    if (score >= 8) return 'text-[#FF5D5D]';
    if (score >= 5.5) return 'text-[#F4B942]';
    return 'text-[#2ECC71]';
  };

  const storiesCountries = Array.from(new Set(situationStories.map(s => s.country)));
  const countriesList = Array.from(new Set([...ALL_WORLD_COUNTRIES, ...storiesCountries])).sort();
  const decisionsList = Array.from(new Set(situationStories.map(s => s.decisionMade)));
  const outcomesList = Array.from(new Set(situationStories.map(s => s.currentOutcome)));

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* BREADCRUMB */}
      <div className="flex items-center space-x-1.5 text-[11px] text-[#AAB2C0] select-none">
        <button onClick={() => setScreen({ type: 'home' })} className="hover:text-white transition-colors">BeforeRegret</button>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <button onClick={() => setScreen({ type: 'explore' })} className="hover:text-white transition-colors">Situations</button>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <span className="text-[#4F8CFF] font-semibold truncate max-w-[200px]">{situation.name}</span>
      </div>

      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-[#30363D] bg-gradient-to-r from-[#161B22] to-[#0D1117] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#4F8CFF] bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-2.5 py-0.5 rounded-full">
              Category: {situation.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {situation.name}
            </h1>
            <p className="text-xs text-[#AAB2C0] max-w-2xl leading-relaxed">
              {situation.description}
            </p>
          </div>
          <button
            onClick={onOpenSubmit}
            className="inline-flex self-start sm:self-center items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" /> Share Your Timeline
          </button>
        </div>
      </div>

      {/* STATISTICS DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Avg Regret Index", val: `${situation.stats.avgRegret}/10`, color: getRegretColor(situation.stats.avgRegret) },
          { label: "Still Unmarried", val: `${situation.stats.stillTogetherPercent}%`, color: "white" },
          { label: "Married %", val: `${situation.stats.marriedPercent}%`, color: "white" },
          { label: "Separated %", val: `${situation.stats.separatedPercent}%`, color: "white" },
          { label: "Avg Relationship", val: situation.stats.avgRelationshipLength, color: "white" }
        ].map((block, idx) => (
          <div key={idx} className="rounded-xl border border-[#30363D] bg-[#161B22] p-4 text-center flex flex-col justify-center">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#AAB2C0] leading-none block mb-2">{block.label}</span>
            <span className={`text-md sm:text-lg font-black leading-none ${block.color}`}>{block.val}</span>
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

      <div className="border-t border-[#30363D]" />

      {/* FILTER & FEED CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-4 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#4F8CFF]" /> Dynamic Filters
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
                  className="text-[10px] text-[#FF5D5D] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Filter Country */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#AAB2C0]">Country of Origin</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full rounded-lg border border-[#30363D] bg-[#0E131B] p-2 text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
              >
                <option value="All">All Countries ({countriesList.length})</option>
                {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Filter Gender */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#AAB2C0]">Gender</label>
              <div className="flex flex-wrap gap-1">
                {['All', 'Female', 'Male'].map(gender => (
                  <button
                    key={gender}
                    onClick={() => setFilterGender(gender)}
                    className={`rounded px-2.5 py-1 text-[10px] font-bold border transition-all ${
                      filterGender === gender ? 'bg-[#4F8CFF]/15 border-[#4F8CFF] text-white' : 'bg-[#0E131B] border-[#30363D] text-[#AAB2C0]'
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
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Timeline Chronicles ({filteredStories.length} matched)
            </h3>
            <span className="text-xs text-[#AAB2C0]">Sorted by votes</span>
          </div>

          {filteredStories.length === 0 ? (
            <div className="text-center rounded-2xl border border-dashed border-[#30363D] p-10 space-y-4 bg-[#161B22]/20">
              {filterCountry !== 'All' ? (
                <>
                  <Globe className="h-8 w-8 text-indigo-400 mx-auto animate-pulse" />
                  <p className="text-sm font-bold text-white">No custom local chronicles recorded yet</p>
                  <p className="text-xs text-[#AAB2C0] max-w-sm mx-auto leading-relaxed">
                    No anonymous timelines matching your criteria have been committed from <b className="text-[#4F8CFF]">{filterCountry}</b> yet. Be the first to share your outcome!
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={onOpenSubmit}
                      className="rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 font-bold px-4 py-2 text-xs text-white transition-all shadow active:scale-95"
                    >
                      Share My Timeline
                    </button>
                    <button
                      onClick={() => setFilterCountry('All')}
                      className="rounded-xl border border-[#30363D] hover:bg-zinc-800 px-4 py-2 text-xs text-[#AAB2C0] hover:text-white transition-all"
                    >
                      Compare Global Entries
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-[#F4B942] mx-auto animate-pulse" />
                  <p className="text-xs text-white font-bold">No exact demographic matches found matching filters.</p>
                  <p className="text-xs text-[#AAB2C0]">Try clearing or widening your constraints to examine comparable outcomes.</p>
                  <button
                    onClick={() => {
                      setFilterCountry('All');
                      setFilterGender('All');
                      setFilterDecision('All');
                      setFilterOutcome('All');
                      setMaxRegret(10);
                      setMinAge(18);
                    }}
                    className="rounded-lg bg-[#30363D] hover:bg-neutral-700 font-semibold px-3.5 py-1.5 text-xs text-white"
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
                  currentUser={currentUser}
                  onGoogleLogin={onGoogleLogin}
                />
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
