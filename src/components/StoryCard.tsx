import React, { useState } from 'react';
import { Bookmark, Share2, AlertCircle, Heart, Check, Clock, User, Award, PlusCircle, Globe, Sparkles, MessageCircle, Edit, Trash2, Shield, LogIn } from 'lucide-react';
import { Story, StoryUpdate, StoryComment } from '../types';

interface StoryCardProps {
  key?: string | number;
  story: Story;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onVoteHelpful: (id: string) => void;
  onSelectTag: (tag: string) => void;
  onSelectCountry: (country: string) => void;
  darkMode: boolean;
  currentUsername: string;
  isAdmin?: boolean;
  onDeleteStory?: (id: string) => void;
  onEditStory?: (id: string, newTitle: string, newStoryText: string) => void;
  comments?: StoryComment[];
  onAddComment?: (storyId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  highlighted?: boolean;
}

export default function StoryCard({
  story,
  isBookmarked,
  onToggleBookmark,
  onVoteHelpful,
  onSelectTag,
  onSelectCountry,
  darkMode,
  currentUsername,
  isAdmin = false,
  onDeleteStory,
  onEditStory,
  comments = [],
  onAddComment,
  onDeleteComment,
  currentUser,
  onGoogleLogin,
  highlighted = false
}: StoryCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(story.title);
  const [editStoryText, setEditStoryText] = useState(story.fullStory);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  const getRegretColor = (score: number) => {
    if (score >= 8) return 'bg-[#C0392B]/5 text-[#C0392B] border-[#C0392B]/10';
    if (score >= 5) return 'bg-[#D97706]/5 text-[#D97706] border-[#D97706]/10';
    return 'bg-[#2E7D32]/5 text-[#2E7D32] border-[#2E7D32]/10';
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'Left':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Stayed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Married':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moved Together':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-zinc-50 text-[#6B7280] border-[#E5E7EB]';
    }
  };

  const handleShare = () => {
    const url = `https://beforeregret.com/story/${story.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setShowShareModal(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2500);
  };

  const hasUpdates = story.updates && story.updates.length > 0;

  const storyComments = comments.filter(c => c.storyId === story.id);

  return (
    <div 
      id={`story-${story.id}`}
      className={`rounded-2xl border p-5 sm:p-6 shadow-sm transition-all duration-700 hover:shadow-md hover:translate-y-[-2px] ${
        highlighted 
          ? 'border-[#C9A227] bg-[#FAF8F2] ring-2 ring-[#C9A227]/40 shadow-[#C9A227]/10 scale-[1.01]' 
          : 'border-[#E5E7EB] bg-white'
      }`}
    >
      
      {/* Header Info */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E7EB] pb-3 mb-4 text-xs text-[#6B7280]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1F2937]">@{story.userName}</span>
          <span className="text-[10px] bg-[#24324A]/5 text-[#24324A] border border-[#24324A]/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-mono">
             Story ID: #{story.id.slice(0, 5)}
          </span>
          {story.caseNumber && (
            <span className="text-[10px] bg-[#FFF8E1] text-[#C9A227] border border-[#E8D79B] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-mono font-bold">
               ⚖️ {story.caseNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{story.gender} ({story.age})</span>
          <span>•</span>
          <button onClick={() => onSelectCountry(story.country)} className="font-semibold text-[#1F2937] hover:underline hover:text-[#24324A] flex items-center gap-1">
            <Globe className="h-3 w-3" /> {story.country}
          </button>
          <span>•</span>
          <span>{story.regretType === 'Current' ? 'Ongoing Since' : 'Duration'}: {story.relationshipDuration}</span>
        </div>
      </div>

      {/* Admin Quick Options */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F4B942]/5 border border-[#F4B942]/20 rounded-xl p-2.5 mb-4 text-xs">
          <span className="font-bold text-[#F4B942] uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 animate-pulse text-[#F4B942]" /> Administrative override controls
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setEditTitle(story.title);
                setEditStoryText(story.fullStory);
                setShowDeleteConfirm(false);
              }}
              className="px-2.5 py-1 rounded bg-[#F4B942]/10 hover:bg-[#F4B942]/20 text-[#F4B942] border border-[#F4B942]/25 font-bold transition-colors"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Post'}
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 animate-fadeIn">
                <span className="text-red-400 font-bold font-mono">Confirm?</span>
                <button
                  onClick={() => {
                    onDeleteStory?.(story.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-2 py-0.5 rounded bg-red-500 text-white font-extrabold text-[10px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-0.5 rounded bg-zinc-600 text-white font-bold text-[10px]"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold transition-colors"
              >
                Delete Post
              </button>
            )}
          </div>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!editTitle.trim() || !editStoryText.trim()) return;
          onEditStory?.(story.id, editTitle, editStoryText);
          setIsEditing(false);
        }} className="space-y-3 bg-[#0D1117] p-4 rounded-xl border border-zinc-700/50 my-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#AAB2C0] block font-mono">Edit Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-[#30363D] bg-[#161B22] p-2.5 text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#AAB2C0] block font-mono">Edit Narrative Details</label>
            <textarea
              value={editStoryText}
              onChange={(e) => setEditStoryText(e.target.value)}
              className="w-full rounded-xl border border-[#30363D] bg-[#161B22] p-2.5 text-xs text-white focus:outline-none focus:border-[#4F8CFF] min-h-[120px]"
              required
            />
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded bg-zinc-600 text-white font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded bg-[#4F8CFF] text-white font-black"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Main Story Meta and Title */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-[#000000] tracking-tight leading-snug hover:text-[#4F8CFF] cursor-pointer">
              "{story.title}"
            </h3>

            {/* Breakdown Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getDecisionColor(story.decisionMade)}`}>
                Decision: {story.decisionMade}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#30363D] bg-[#0D1117] text-white/90 uppercase tracking-wider">
                Outcome: {story.currentOutcome}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getRegretColor(story.regretScore)}`}>
                Regret: {story.regretScore}/10
              </span>
              {story.regretType && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                  story.regretType === 'Current' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  {story.regretType} Regret
                </span>
              )}
            </div>
          </div>

          {/* Full Body Text */}
          <div className="mt-4 text-base text-[#3c3c3c] leading-relaxed whitespace-pre-wrap pl-1 font-serif max-w-3xl">
            {story.fullStory}
          </div>
        </>
      )}

      {/* Segmented Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(() => {
          const isDemographicOrGenericTag = (tag: string): boolean => {
            const t = tag.toLowerCase().trim();
            if (t === 'male' || t === 'female' || t === 'other' || t === 'non-binary') return true;
            if (t.endsWith('y/o') || t.endsWith('s') || /^\d+$/.test(t)) return true;
            const countries = ['usa', 'india', 'canada', 'uk', 'vietnam', 'australia', 'germany', 'france', 'united states', 'united kingdom'];
            if (countries.includes(t)) return true;
            return false;
          };
          return story.tags.filter(isDemographicOrGenericTag).map(t => (
            <button
              key={t}
              onClick={() => onSelectTag(t)}
              className="text-[10px] font-semibold text-zinc-600 bg-white border border-[#E5E7EB] hover:border-[#4F8CFF] hover:text-[#4F8CFF] px-2 py-0.5 rounded-md transition-colors"
            >
              #{t}
            </button>
          ));
        })()}
      </div>



      {/* Story Footer Controls: Helpful, Comments, Bookmark, Share */}
      <div className="mt-5 border-t border-[#30363D] pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Helpful trigger */}
          <button
            onClick={() => onVoteHelpful(story.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D1117] border border-[#30363D] hover:border-[#2ECC71] hover:text-[#2ECC71] px-3 py-1.5 sm:px-3.5 sm:py-2 text-white font-semibold transition-all group shrink-0 active:scale-95 text-[11px]"
            id={`vote-helpful-${story.id}`}
          >
            <Heart className="h-3.5 w-3.5 text-[#FF5D5D] transition-transform group-hover:scale-125" />
            <span>Helpful ({story.helpfulVotes})</span>
          </button>

          {/* Comments/Responses Toggler */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 sm:px-3.5 sm:py-2 font-semibold transition-all shrink-0 active:scale-95 text-[11px] ${
              showComments 
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' 
                : 'bg-[#0D1117] border-[#30363D] hover:border-[#4F8CFF] hover:text-white text-[#AAB2C0]'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Responses ({storyComments.length})</span>
          </button>

          {/* Bookmark Trigger */}
          <button
            onClick={() => onToggleBookmark(story.id)}
            className={`p-1.5 sm:p-2 rounded-xl border border-[#30363D] bg-[#0D1117] hover:border-[#4F8CFF] transition-all overflow-hidden relative shrink-0 ${
              isBookmarked ? 'text-[#4F8CFF] border-[#4F8CFF]' : 'text-[#AAB2C0]'
            }`}
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Trigger */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-[#6B7280] hover:text-[#24324A] bg-white p-1.5 sm:p-2 rounded-xl border border-[#E5E7EB] text-[11px]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-semibold text-[11px]">Get Link</span>
          </button>

          {/* Report Trigger */}
          <button
            onClick={() => alert("Thank you. An anonymous moderator has queued this post for review within 24 hours.")}
            className="text-zinc-400 hover:text-red-600 p-1.5 sm:p-2"
            title="Flag as False or Personal Data Violations"
          >
            <AlertCircle className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Expanded Comments / Advice Area */}
      {showComments && (
        <div className="mt-4 border-t border-[#E5E7EB] pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#24324A] flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-[#C9A227]" /> Peer Outcome Advice & Responses
            </h4>
            <span className="text-[10px] text-zinc-400 font-mono">
              Safe community guidance space
            </span>
          </div>

          {/* Comment List */}
          {storyComments.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E5E7EB] rounded-xl text-zinc-400 bg-[#FAF8F2]">
              <p className="text-xs font-medium text-[#6B7280]">No peer responses yet for this timeline story.</p>
              <p className="text-[10px] text-zinc-500 mt-1">Be the first to provide helpful guidance or analyze their post-decision logic!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {storyComments.map((c) => (
                <div key={c.id} className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-3 text-xs flex gap-3 shadow-sm">
                  {c.authorPhoto ? (
                    <img src={c.authorPhoto} alt={c.authorName} className="h-6 w-6 rounded-full shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-[#24324A] text-[10px] font-bold flex items-center justify-center text-white shrink-0 uppercase font-mono">
                      {c.authorName.slice(0, 2)}
                    </div>
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#24324A]">@{c.authorName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">{c.dateAdded}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment?.(c.id)}
                            className="bg-red-50 hover:bg-red-100 text-[#C0392B] border border-red-100 p-1 rounded-md transition-colors"
                            title="Moderator: Delete response"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed font-serif whitespace-pre-wrap">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCommentText.trim()) return;
              if (onAddComment) {
                onAddComment(story.id, newCommentText);
              }
              setNewCommentText("");
            }}
            className="flex gap-2 items-end pt-2 border-t border-[#E5E7EB]"
          >
            <div className="flex-1 space-y-1.5">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share your mentoring opinion, cautionary warning, or supportive advice..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#24324A] min-h-[60px]"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#24324A] hover:bg-[#1C273A] px-4 py-2.5 text-xs font-bold text-white shrink-0 shadow-md transition-all h-[44px] flex items-center"
            >
              Respond
            </button>
          </form>
        </div>
      )}

      {/* Share Toast Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setShowShareModal(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-5 text-center text-[#1F2937] shadow-xl" onClick={e => e.stopPropagation()}>
            <Sparkles className="h-8 w-8 mx-auto text-[#C9A227] mb-2" />
            <h4 className="text-sm font-bold text-[#24324A]">Share Decisional Story</h4>
            <p className="text-xs text-[#6B7280] mt-1 mb-4">Direct link generated! Copy and paste this URL to share with others anonymously:</p>
            <div className="rounded-xl bg-[#FAF8F2] p-2 text-xs font-mono select-all break-all border border-[#E5E7EB] mb-4 text-[#24324A] font-semibold">
              https://beforeregret.com/story/{story.id}
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full rounded-xl bg-zinc-200 hover:bg-zinc-300 py-2 text-xs font-bold transition-all text-[#1F2937]"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
