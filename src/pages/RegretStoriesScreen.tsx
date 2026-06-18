import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { Story, Situation } from '../types';
import SubmitStoryForm from '../components/SubmitStoryForm';

interface RegretStoriesScreenProps {
  stories: Story[];
  situations: Situation[];
  onVoteHelpful: (id: string) => void;
  onSubmitStory: (story: Story) => void;
  setScreen: (screen: { type: string; slug?: string }) => void;
}

export default function RegretStoriesScreen({
  stories,
  situations,
  onVoteHelpful,
  onSubmitStory,
  setScreen
}: RegretStoriesScreenProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDecision, setFilterDecision] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');
  
  // Track open/collapsed state of full stories
  const [expandedStories, setExpandedStories] = useState<{ [id: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpandedStories(prev => ({ ...prev, [id]: !prev[id] }));
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

    return matchesCategory && matchesDecision;
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
    if (score >= 8) return { label: 'CRITICAL', color: 'text-red-400 bg-red-950/40 border-red-500/30' };
    if (score >= 5) return { label: 'HIGH', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
    return { label: 'MODERATE', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* 🚀 Header Overview Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] border border-[#30363D] p-5 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#4F8CFF] bg-[#4F8CFF]/10 px-2 py-0.5 rounded-md font-mono">Anonymous Chronicles</span>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1 uppercase tracking-tight">
            <Heart className="h-6 w-6 text-pink-500 fill-pink-500/20" /> Shared Regrets Registry
          </h1>
          <p className="text-xs text-[#AAB2C0] mt-1 pr-6">
            Explore crowd-submitted timelines with certified regret metric logs. Learn what spouses wished they did differently.
          </p>
        </div>
        {!showSubmitModal && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 font-extrabold text-xs text-white px-4 py-2.5 shadow-lg shadow-pink-500/15 transition-all active:scale-[0.98] self-start sm:self-center flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" /> Share My Regret & Score
          </button>
        )}
      </div>

      {/* 📊 Living Statistics Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22]/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 flex items-center justify-center shrink-0 text-[#4F8CFF]">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">CHRONICLES</span>
            <span className="text-md sm:text-xl font-black text-white">{totalStoriesCount} Submitted</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#30363D] bg-[#161B22]/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0 text-pink-400">
            <Frown className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">AVG REGRET</span>
            <span className="text-md sm:text-xl font-black text-white">{avgRegretScore} / 10</span>
          </div>
        </div>

      </div>

      {/* 📝 Inline User Submission Form (Expandable) */}
      {showSubmitModal && (
        <div className="border border-pink-500/30 bg-[#161B22] p-5 sm:p-6 rounded-3xl shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#30363D]/65">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="text-pink-500 h-5.5 w-5.5 animate-pulse" /> Register Your Regret Chronicle
              </h2>
              <p className="text-xs text-[#AAB2C0]">Explain your timeline milestones, final choices, and live regret score anonymously.</p>
            </div>
            <button
              onClick={() => setShowSubmitModal(false)}
              className="text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#30363D]"
            >
              Cancel Form
            </button>
          </div>
          <SubmitStoryForm
            onClose={() => setShowSubmitModal(false)}
            onSubmit={(newStory) => {
              onSubmitStory(newStory);
              setShowSubmitModal(false);
            }}
          />
        </div>
      )}

      {/* 🎛️ Filter and Sort Bar Dashboard */}
      <div className="bg-[#12161A] border border-[#30363D] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Dynamic Select Filters */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 font-semibold"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">Decision:</span>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="rounded-xl border border-[#30363D] bg-[#161B22] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500 font-semibold"
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
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#30363D]/50 pt-2.5 md:pt-0">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sort:</span>
          </div>
          <div className="flex bg-[#161B22] rounded-xl border border-[#30363D] p-1 gap-1">
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
                  sortBy === tab.id ? 'bg-indigo-650 text-white shadow' : 'text-zinc-500 hover:text-white'
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
          <div className="rounded-2xl border border-zinc-500/10 bg-zinc-500/5 py-12 text-center text-xs text-zinc-500">
            No regret chronicles match your filter criteria. Share your timeline or select another option filter.
          </div>
        ) : (
          sortedStories.map(story => {
            const regret = getRegretString(story.regretScore);
            const isExpanded = !!expandedStories[story.id];
            return (
              <div 
                key={story.id} 
                className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-sm hover:border-[#38444d]/85 transition-colors relative"
              >
                
                {/* Upper row: Case number, Category tag and regret level badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363D]/40 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-400/5 border border-zinc-500/10 px-2 py-0.5 rounded uppercase tracking-wider select-none">
                      {story.caseNumber || `CASE-S${story.id.slice(0, 4).toUpperCase()}`}
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded">
                      {story.tags[0] || 'Relationship'}
                    </span>
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
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      "{story.title}"
                    </h3>
                    
                    {/* Demographic items */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#AAB2C0] mt-1.5 font-sans">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-[#4F8CFF]" /> {story.gender}, {story.age}y/o
                      </span>
                      <span className="h-1 w-1 bg-zinc-650 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#4F8CFF]" /> {story.relationshipDuration} Duration
                      </span>
                      <span className="h-1 w-1 bg-zinc-650 rounded-full" />
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#4F8CFF]" /> {story.country}
                      </span>
                    </div>
                  </div>

                  {/* Decision Path Map Callout */}
                  <div className="grid grid-cols-2 gap-3 bg-[#0E131B] border border-[#30363D] p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-0.5">Decision Path</span>
                      <span className="font-extrabold text-pink-400 uppercase">{story.decisionMade || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block mb-0.5">Present Outcome</span>
                      <span className="font-extrabold text-emerald-400 uppercase">{story.currentOutcome || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Timeline Text Narrative */}
                  <div className="space-y-2">
                    <p className={`text-xs sm:text-sm text-[#AAB2C0] leading-relaxed font-serif pl-3 border-l-2 border-indigo-500/40 bg-zinc-900/40 py-2 rounded-r-xl ${!isExpanded ? 'line-clamp-4' : ''}`}>
                      "{story.fullStory}"
                    </p>
                    
                    {story.fullStory.length > 250 && (
                      <button
                        onClick={() => toggleExpand(story.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-white font-extrabold transition-colors mt-1 hover:underline"
                      >
                        {isExpanded ? (
                          <>Collapse Chronicle <ChevronUp className="h-3.5 w-3.5" /></>
                        ) : (
                          <>Read Full Regret Chronicle <ChevronDown className="h-3.5 w-3.5" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Helpful Vote CTA & Timestamp */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#30363D]/30 text-[11px] text-zinc-500">
                    <button
                      onClick={() => onVoteHelpful(story.id)}
                      className="inline-flex items-center gap-1.5 bg-[#161B22] border border-[#30363D] hover:border-pink-500/45 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-all"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-pink-400" /> Helpful Outcome Review ({story.helpfulVotes})
                    </button>
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
