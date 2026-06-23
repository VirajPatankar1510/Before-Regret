import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ThumbsUp, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  Filter, 
  ArrowUpDown, 
  User, 
  Calendar, 
  MapPin, 
  FileText,
  Frown,
  CheckCircle,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { Story, Situation } from '../types';
import SubmitStoryForm from '../components/SubmitStoryForm';

interface RegretStoriesScreenProps {
  stories: Story[];
  situations: Situation[];
  onVoteHelpful: (id: string) => void;
  onSubmitStory: (story: Story) => void;
  setScreen: (screen: { type: string; slug?: string }) => void;
  isAdmin?: boolean;
  onDeleteStory?: (id: string) => void;
  initialSituationSlug?: string;
  initialStoryId?: string;
}

export default function RegretStoriesScreen({
  stories,
  situations,
  onVoteHelpful,
  onSubmitStory,
  setScreen,
  isAdmin = false,
  onDeleteStory,
  initialSituationSlug = 'All',
  initialStoryId
}: RegretStoriesScreenProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDecision, setFilterDecision] = useState<string>('All');
  const [filterSituation, setFilterSituation] = useState<string>(initialSituationSlug || 'All');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');

  useEffect(() => {
    if (initialSituationSlug && initialSituationSlug !== 'All') {
      setFilterSituation(initialSituationSlug);
    }
  }, [initialSituationSlug]);

  // Track open/collapsed state of full stories
  const [expandedStories, setExpandedStories] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (initialStoryId) {
      setExpandedStories(prev => ({ ...prev, [initialStoryId]: true }));
      setTimeout(() => {
        const element = document.getElementById(`story-card-${initialStoryId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [initialStoryId]);

  // Track admin delete state
  const [storyIdToDeleteConfirm, setStoryIdToDeleteConfirm] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const isCurrentlyExpanded = !!expandedStories[id];
    setExpandedStories(prev => ({ ...prev, [id]: !prev[id] }));
    if (!isCurrentlyExpanded) {
      setScreen({ type: 'regret_stories', slug: id });
    } else {
      setScreen({ type: 'regret_stories' });
    }
  };

  // Get unique categories for filtering
  const categories = ['All', ...new Set(stories.map(s => s.tags[0] || 'other'))].map(c => 
    c.charAt(0).toUpperCase() + c.slice(1)
  );

  // Compute analytics from current stories
  const totalStoriesCount = stories.length;
  const avgRegretScore = totalStoriesCount > 0 
    ? (stories.reduce((acc, s) => acc + s.regretScore, 0) / totalStoriesCount).toFixed(1) 
    : '0';

  // Filter and Sort Stories
  const filteredStories = stories.filter(story => {
    const mainTag = story.tags[0] || 'other';
    const matchesCategory = filterCategory === 'All' || mainTag.toLowerCase() === filterCategory.toLowerCase();
    
    const decision = story.decisionMade || 'other';
    const matchesDecision = filterDecision === 'All' || decision.toLowerCase() === filterDecision.toLowerCase();

    const matchesSituation = filterSituation === 'All' || story.situationSlug === filterSituation;

    return matchesCategory && matchesDecision && matchesSituation;
  });

  const sortedStories = [...filteredStories].sort((a, b) => {
    if (sortBy === 'recent') {
      const dateA = a.dateAdded || '';
      const dateB = b.dateAdded || '';
      return dateB.localeCompare(dateA);
    }
    if (sortBy === 'highest') {
      return b.regretScore - a.regretScore;
    }
    if (sortBy === 'lowest') {
      return a.regretScore - b.regretScore;
    }
    if (sortBy === 'helpful') {
      return b.helpfulVotes - a.helpfulVotes;
    }
    return 0;
  });

  const getRegretString = (score: number) => {
    if (score >= 8) return { label: 'CRITICAL', color: 'text-[#C0392B] bg-[#C0392B]/5 border-[#C0392B]/10' };
    if (score >= 5) return { label: 'HIGH', color: 'text-[#D97706] bg-[#D97706]/5 border-[#D97706]/10' };
    return { label: 'MODERATE', color: 'text-[#2E7D32] bg-[#2E7D32]/5 border-[#2E7D32]/10' };
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* 🚀 Header Overview Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5E7EB] p-5 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#24324A]/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#24324A] bg-[#24324A]/5 px-2 py-0.5 rounded-md font-mono">Anonymous Stories</span>
          <h1 className="text-xl sm:text-2xl font-black text-[#24324A] flex items-center gap-2 mt-1 uppercase tracking-tight font-display">
            <Heart className="h-6 w-6 text-[#C0392B] fill-[#C0392B]/10" /> Shared Regrets Registry
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 pr-6 font-medium">
            Explore crowd-submitted timelines with certified regret metric logs. Learn what spouses wished they did differently.
          </p>
        </div>
        {!showSubmitModal && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="rounded-xl bg-[#24324A] hover:bg-[#1C273A] font-bold text-xs text-white px-4 py-2.5 shadow-sm transition-all active:scale-[0.98] self-start sm:self-center flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="h-4 w-4" /> Share My Regret & Score
          </button>
        )}
      </div>

      {/* 📊 Living Statistics Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#24324A]/5 border border-[#24324A]/10 flex items-center justify-center shrink-0 text-[#24324A]">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">STORIES</span>
            <span className="text-md sm:text-xl font-bold text-[#24324A]">{totalStoriesCount} Submitted</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#FFF8E1] border border-[#E8D79B] flex items-center justify-center shrink-0 text-[#C9A227]">
            <Frown className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">AVG REGRET</span>
            <span className="text-md sm:text-xl font-bold text-[#C9A227]">{avgRegretScore} / 10</span>
          </div>
        </div>

      </div>

      {/* 📝 Inline User Submission Form (Expandable) */}
      {showSubmitModal && (
        <div className="border border-[#E5E7EB] bg-white p-5 sm:p-6 rounded-3xl shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#24324A] uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="text-[#C9A227] h-5.5 w-5.5 animate-pulse" /> Register Your Regret Story
              </h2>
              <p className="text-xs text-[#6B7280]">Explain your timeline milestones, final choices, and live regret score anonymously.</p>
            </div>
            <button
              onClick={() => setShowSubmitModal(false)}
              className="text-xs font-bold text-[#6B7280] hover:text-[#24324A] px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white"
            >
              Cancel Form
            </button>
          </div>
          <SubmitStoryForm
            onClose={() => setShowSubmitModal(false)}
            onSubmit={(newStory) => {
              onSubmitStory(newStory);
            }}
          />
        </div>
      )}

      {/* 🎛️ Filter and Sort Bar Dashboard */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        
        {/* Dynamic Select Filters */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider hidden sm:inline">Situation:</span>
            <select
              value={filterSituation}
              onChange={(e) => setFilterSituation(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] focus:ring-4 focus:ring-[#24324A]/5 font-semibold max-w-[180px] sm:max-w-[220px] truncate"
            >
              <option value="All">All Situations</option>
              {situations.map(sit => (
                <option key={sit.slug} value={sit.slug}>{sit.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider hidden sm:inline">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] focus:ring-4 focus:ring-[#24324A]/5 font-semibold"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider hidden sm:inline">Decision:</span>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] focus:ring-4 focus:ring-[#24324A]/5 font-semibold"
            >
              <option value="All">All Decisions</option>
              <option value="Stayed">Option: Stayed</option>
              <option value="Left">Option: Left</option>
              <option value="Married">Option: Married</option>
              <option value="Moved Together">Option: Moved Together</option>
              <option value="Other">Option: Other</option>
            </select>
          </div>

        </div>

        {/* Sorting option tabs */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#E5E7EB] pt-2.5 md:pt-0">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Sort:</span>
          </div>
          <div className="flex bg-[#FAF8F2] rounded-xl border border-[#E5E7EB] p-1 gap-1">
            {[
              { id: 'recent', label: 'Recent' },
              { id: 'highest', label: 'Max Regret' },
              { id: 'lowest', label: 'Min Regret' },
              { id: 'helpful', label: 'Upvotes' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id as any)}
                className={`px-3 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all ${
                  sortBy === tab.id ? 'bg-[#24324A] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#24324A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 📂 Render Stories Registry Feed */}
      <div className="space-y-4">
        {sortedStories.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white py-12 text-center text-xs text-[#6B7280] shadow-sm">
            No regret stories match your filter criteria. Share your timeline or select another option filter.
          </div>
        ) : (
          sortedStories.map(story => {
            const regret = getRegretString(story.regretScore);
            const isExpanded = !!expandedStories[story.id];
            const isHighlighted = initialStoryId === story.id;
            return (
              <div 
                key={story.id} 
                id={`story-card-${story.id}`}
                className={`rounded-2xl border transition-all duration-300 relative p-5 sm:p-6 ${
                  isHighlighted 
                    ? 'border-[#C9A227] ring-4 ring-[#C9A227]/15 bg-[#FAF8F2] shadow-md scale-[1.01]' 
                    : 'border-[#E5E7EB] bg-white shadow-sm hover:shadow-md hover:translate-y-[-1px]'
                }`}
              >
                
                {/* Upper row: Case number, Category tag and regret level badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECECEC] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#6B7280] bg-[#FAF8F2] border border-[#E5E7EB] px-2 py-0.5 rounded uppercase tracking-wider select-none">
                      {story.caseNumber || `CASE-S${story.id.slice(0, 4).toUpperCase()}`}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#24324A] uppercase tracking-wider bg-[#24324A]/5 px-2 py-0.5 rounded">
                      {story.tags[0] || 'Relationship'}
                    </span>
                    {isHighlighted && (
                      <span className="animate-pulse bg-[#C9A227] text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                        🎯 Searched Case Match
                      </span>
                    )}
                  </div>
                  
                  {/* Regret Score Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black font-mono border px-2.5 py-0.5 rounded-lg tracking-wider ${regret.color}`}>
                      REGRET: {story.regretScore}/10 ({regret.label})
                    </span>
                  </div>
                </div>

                {/* Main section context info */}
                <div className="space-y-4">
                  
                  <div>
                    <h3 className="text-base font-bold text-[#24324A] leading-snug font-serif">
                      "{story.title}"
                    </h3>
                    
                    {/* Demographic items */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280] mt-1.5 font-sans font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-[#24324A]" /> {story.gender}, {story.age}y/o
                      </span>
                      <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#24324A]" /> {story.relationshipDuration} Duration
                      </span>
                      <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#24324A]" /> {story.country}
                      </span>
                    </div>
                  </div>

                  {/* Decision Path Map Callout */}
                  <div className="grid grid-cols-2 gap-3 bg-[#FAF8F2] border border-[#E5E7EB] p-3 rounded-xl text-xs font-medium">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 block mb-0.5">Decision Path</span>
                      <span className="font-bold text-[#B23B3B] uppercase">{story.decisionMade || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 block mb-0.5">Present Outcome</span>
                      <span className="font-bold text-[#2E7D32] uppercase">{story.currentOutcome || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Timeline Text Narrative */}
                  <div className="space-y-2">
                    <p className={`text-base text-[#374151] leading-relaxed font-serif pl-3 border-l-2 border-[#C9A227] bg-[#FAF8F2]/50 not-italic pr-2 py-2 rounded-r-xl ${!isExpanded ? 'line-clamp-4' : ''}`}>
                      "{story.fullStory}"
                    </p>
                    
                    {story.fullStory.length > 250 && (
                      <button
                        onClick={() => toggleExpand(story.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#C9A227] hover:text-[#24324A] font-bold transition-colors mt-1 hover:underline"
                      >
                        {isExpanded ? (
                          <>Collapse Story <ChevronUp className="h-3.5 w-3.5" /></>
                        ) : (
                          <>Read Full Regret Story <ChevronDown className="h-3.5 w-3.5" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Helpful Vote CTA & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#ECECEC] text-[11px] text-zinc-400 font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onVoteHelpful(story.id)}
                        className="inline-flex items-center gap-1.5 bg-white border border-[#E5E7EB] hover:border-[#24324A] hover:bg-neutral-50 px-3 py-1.5 rounded-lg text-[#1F2937] font-semibold transition-all cursor-pointer"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 text-[#C0392B]" /> Helpful Outcome Review ({story.helpfulVotes})
                      </button>

                      {isAdmin && onDeleteStory && (
                        storyIdToDeleteConfirm === story.id ? (
                          <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 p-0.5 rounded-lg">
                            <span className="text-[10px] text-red-700 px-1.5 font-bold">Are you sure?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteStory(story.id);
                                setStoryIdToDeleteConfirm(null);
                              }}
                              className="px-2 py-1 rounded bg-[#C0392B] text-white font-extrabold hover:bg-red-700 text-[10px] cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setStoryIdToDeleteConfirm(null)}
                              className="px-2 py-1 rounded bg-zinc-200 text-zinc-700 font-bold hover:bg-zinc-300 text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStoryIdToDeleteConfirm(story.id)}
                            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[#C0392B] border border-red-100 px-3 py-1.5 rounded-lg font-bold transition-all shadow-2xs cursor-pointer"
                            title="Administrator Override: Delete Story"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )
                      )}
                    </div>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3.5 w-3.5" /> Filed: {story.dateAdded || 'Archived'}
                    </span>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
