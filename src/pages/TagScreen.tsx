import React from 'react';
import { Tag, ArrowLeft, HelpCircle, FileText, Sparkles, MessageCircle, Gavel } from 'lucide-react';
import { Story, Question, CourtCase, StoryComment } from '../types';
import StoryCard from '../components/StoryCard';

interface TagScreenProps {
  tagSlug: string;
  allStories: Story[];
  allQuestions: Question[];
  allCourtCases: CourtCase[];
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
}

export default function TagScreen({
  tagSlug,
  allStories,
  allQuestions,
  allCourtCases,
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
  onGoogleLogin
}: TagScreenProps) {
  
  const tagLabel = tagSlug.toLowerCase();

  // Filter items matching tag
  const taggedStories = allStories.filter(s => s.tags.includes(tagLabel) || s.situationSlug.includes(tagLabel));
  const taggedQuestions = allQuestions.filter(q => q.tags.includes(tagLabel) || q.slug.includes(tagLabel));
  const taggedCourtCases = allCourtCases.filter(c => c.tags.includes(tagLabel) || c.slug.includes(tagLabel));

  // Compute stats
  const totalCount = taggedStories.length;
  const avgRegret = totalCount > 0 ? (taggedStories.reduce((acc, s) => acc + s.regretScore, 0) / totalCount).toFixed(1) : "5.0";

  const relatedTags = ['marriage', 'cheating', 'long-distance', 'commitment', 'children', 'privacy', 'forgiveness'].filter(t => t !== tagLabel);

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Back button */}
      <button
        onClick={() => setScreen({ type: 'home' })}
        className="text-xs text-[#6B7280] hover:text-[#24324A] inline-flex items-center gap-1 font-semibold border border-[#E5E7EB] bg-white px-3 py-1.5 rounded-xl transition-all hover:border-zinc-300 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Board Home
      </button>

      {/* Hero Display header */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-600">
              <Tag className="h-5 w-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest leading-none font-mono">Tag Directory Archives</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#24324A] font-serif">#{tagLabel} Archive Indexes</h1>
            <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
              Consolidating community situations, active poll questions, jury trials, and multi-year outcomes associated with this relationship keyword.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0 font-semibold font-mono">
            <div className="bg-[#FAF8F2] rounded-xl border border-[#E5E7EB] px-3.5 py-2 text-center shadow-xs">
              <span className="text-[9px] text-[#6B7280] block uppercase font-bold">Matched Cases</span>
              <span className="text-xs font-bold text-[#24324A]">{totalCount} dossiers</span>
            </div>
            <div className="bg-[#FAF8F2] rounded-xl border border-[#E5E7EB] px-3.5 py-2 text-center shadow-xs">
              <span className="text-[9px] text-[#6B7280] block uppercase font-bold">Avg Regret index</span>
              <span className="text-xs font-bold text-[#C0392B]">{avgRegret}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Stories, Questions, Related tags */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Filter feed */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#24324A] font-serif">Stories Indexed under #{tagLabel}</h3>

          {taggedStories.length === 0 ? (
            <div className="text-center rounded-xl border border-dashed border-[#E5E7EB] p-10 text-zinc-400 bg-white shadow-xs font-semibold">
              <p className="text-xs font-bold text-[#24324A] font-serif">No active stories found matching #{tagLabel} currently.</p>
              <p className="text-[10px] text-zinc-500 mt-1">Submit your situation timeline first to pre-seed this archive tag.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {taggedStories.map(story => (
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Linked Questions or Related tags */}
        <div className="lg:col-span-4 space-y-4 font-semibold">
          
          {/* Tagged Court trials */}
          {taggedCourtCases.length > 0 && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A227] flex items-center gap-1 font-mono">
                <Gavel className="h-4 w-4" /> Related Court Trials
              </h3>
              <div className="space-y-2">
                {taggedCourtCases.map(c => (
                  <div
                    key={c.slug}
                    onClick={() => setScreen({ type: 'court', slug: c.slug })}
                    className="rounded bg-[#FAF8F2] p-2.5 text-xs text-[#1F2937] hover:text-[#C9A227] cursor-pointer hover:border-zinc-300 border border-[#E5E7EB] transition-all font-serif italic"
                  >
                    "{c.title}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tagged Questions */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1 font-mono">
              <HelpCircle className="h-4 w-4" /> Related Advice Questions
            </h3>
            {taggedQuestions.length === 0 ? (
              <p className="text-[10px] text-[#6B7280] font-mono">No questions found tagged #{tagLabel} yet.</p>
            ) : (
              <div className="space-y-2.5">
                {taggedQuestions.map(q => (
                  <div
                    key={q.slug}
                    onClick={() => setScreen({ type: 'question', slug: q.slug })}
                    className="rounded bg-[#FAF8F2] p-2.5 text-xs text-[#1F2937] cursor-pointer hover:text-purple-600 border border-[#E5E7EB] transition-all font-serif italic"
                  >
                    "{q.title}"
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related tags array */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] font-mono">Compare Related Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {relatedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className="rounded-lg bg-[#FAF8F2] border border-[#E5E7EB] hover:border-[#24324A] text-[11px] text-[#6B7280] hover:text-[#1F2937] px-2.5 py-1 transition-all"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
