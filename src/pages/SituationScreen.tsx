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

  // Gather stories whose situationSlug matches the situation's slug
  let situationStories = allStories.filter(s => s.situationSlug === situation.slug);

  // Smart fallback: if a custom query or situation doesn't have direct preseeded slug matches,
  // search all available stories in the database for overlapping keywords to serve as relevant examples.
  if (situationStories.length === 0) {
    const keywords = situation.name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'the', 'for', 'with', 'but', 'not', 'your', 'from'].includes(w));
    
    if (keywords.length > 0) {
      situationStories = allStories.filter(s => {
        const textToSearch = `${s.title} ${s.situationName || ''} ${s.fullStory} ${(s.tags || []).join(' ')}`.toLowerCase();
        return keywords.some(keyword => textToSearch.includes(keyword));
      });
    }

    // Default global fallback if still empty so the user never sees an completely blank portal
    if (situationStories.length === 0) {
      situationStories = allStories.slice(0, 3);
    }
  }

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

      {/* PEER REGRET LOG PRECEDENTS (MERGE OUTCOME INTEL DIRECTORY WITH REGRET REGISTRY) */}
      {situationStories.length > 0 && (
        <div className="bg-[#111827] text-white rounded-3xl border border-zinc-800 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-[#F4B942] bg-[#F4B942]/10 border border-[#F4B942]/20 px-2.5 py-0.5 rounded-md inline-block">
                Registry-Mapped Outcomes
              </span>
              <h3 className="text-md font-bold text-white flex items-center gap-1.5 font-serif">
                Real-Life Submissions Backing the Analytical Charts
              </h3>
              <p className="text-[11px] text-[#AAB2C0] font-sans font-medium">
                These are real peer-submitted stories contributing in real-time to the percentages and averages graphed above.
              </p>
            </div>
            <button
              onClick={() => {
                const element = document.getElementById("peer-stories-title");
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-xs font-bold text-[#4F8CFF] hover:text-white transition-colors flex items-center gap-1 shrink-0 font-mono"
            >
              Browse All Match Feeds &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {situationStories.slice(0, 3).map((story) => {
              const previewText = story.fullStory.length > 130 
                ? story.fullStory.substring(0, 130) + '...'
                : story.fullStory;
              
              const quoteClass = story.regretScore >= 8 
                ? 'border-l-2 border-rose-500 bg-rose-500/5' 
                : story.regretScore >= 5.5 
                  ? 'border-l-2 border-amber-500 bg-amber-500/5' 
                  : 'border-l-2 border-emerald-500 bg-emerald-500/5';

              return (
                <div 
                  key={story.id} 
                  className="bg-[#161B22] border border-[#30363D] hover:border-[#4F8CFF] p-4.5 rounded-2xl flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold font-mono text-[#AAB2C0]">
                        #{story.id.slice(0, 5)} · {story.gender === 'Female' ? 'F' : 'M'}, {story.age}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono ${
                        story.regretScore >= 8 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        story.regretScore >= 5.5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        Regret: {story.regretScore}/10
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {story.title}
                      </p>
                      <div className={`p-3 rounded-xl text-[11px] text-[#AAB2C0] italic leading-relaxed ${quoteClass} line-clamp-3`}>
                        "{previewText}"
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#30363D] flex items-center justify-between text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-[#8491A5] uppercase font-mono leading-none">Decision Outcome</span>
                      <span className="font-bold text-white leading-tight mt-1">{story.decisionMade} &rarr; {story.currentOutcome}</span>
                    </div>
                    <button
                      onClick={() => {
                        const targetCard = document.getElementById(`story-${story.id}`);
                        if (targetCard) {
                          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Highlight the card temporarily
                          targetCard.classList.add('ring-4', 'ring-[#C9A227]/40');
                          setTimeout(() => {
                            targetCard.classList.remove('ring-4', 'ring-[#C9A227]/40');
                          }, 3000);
                        } else {
                          // Fallback scroll to stories feed
                          const element = document.getElementById("peer-stories-title");
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                      className="bg-[#21262D] hover:bg-[#30363D] text-white border border-[#30363D] hover:border-[#4F8CFF] rounded-xl px-3 py-1.5 transition-all text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Inspect Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            <h3 id="peer-stories-title" className="text-sm font-bold text-[#24324A] uppercase tracking-wider font-mono">
              Timeline Stories ({filteredStories.length} matched)
            </h3>
            <span className="text-xs text-[#6B7280] font-medium">Sorted by votes</span>
          </div>

          {filteredStories.length === 0 ? (
            <div className="text-center rounded-2xl border border-dashed border-[#E5E7EB] p-10 space-y-4 bg-white shadow-sm">
              {filterCountry !== 'All' ? (
                <>
                  <Globe className="h-8 w-8 text-[#C9A227] mx-auto animate-pulse" />
                  <p className="text-sm font-bold text-[#24324A]">No custom local stories recorded yet</p>
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
