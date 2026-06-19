import React, { useState } from 'react';
import { HelpCircle, Vote, MessageSquare, ArrowLeft, CheckCircle, Sparkles, Plus, Award, Shield, Trash2, ThumbsUp, Send } from 'lucide-react';
import { Question } from '../types';

interface QuestionProps {
  question: Question;
  setScreen: (screen: { type: string; slug?: string }) => void;
  onVoteQuestionPoll: (slug: string, optionText: string) => void;
  onAddQuestionAnswer: (slug: string, text: string) => void;
  onAddAnswerComment: (slug: string, ansId: string, text: string) => void;
  onUpvoteAnswer: (slug: string, ansId: string) => void;
  userVotedQuestions: { [slug: string]: string };
  isAdmin?: boolean;
  onDeleteAnswer?: (qSlug: string, ansId: string) => void;
  onDeleteQuestion?: (qSlug: string) => void;
  onDeleteAnswerComment?: (qSlug: string, ansId: string, commentId: string) => void;
}

export default function QuestionScreen({ 
  question, 
  setScreen, 
  onVoteQuestionPoll, 
  onAddQuestionAnswer, 
  onAddAnswerComment,
  onUpvoteAnswer,
  userVotedQuestions,
  isAdmin = false,
  onDeleteAnswer,
  onDeleteQuestion,
  onDeleteAnswerComment
}: QuestionProps) {
  const [answerContent, setAnswerContent] = useState('');
  const [showQuestionDeleteConfirm, setShowQuestionDeleteConfirm] = useState(false);
  const [commentTextState, setCommentTextState] = useState<{ [ansId: string]: string }>({});
  
  const userVote = userVotedQuestions[question.slug];
  const totalPollVotes = question.pollOptions.reduce((acc, o) => acc + o.votes, 0);

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    onAddQuestionAnswer(question.slug, answerContent);
    setAnswerContent('');
  };

  const handleCommentSubmit = (e: React.FormEvent, ansId: string) => {
    e.preventDefault();
    const txt = commentTextState[ansId]?.trim();
    if (!txt) return;
    onAddAnswerComment(question.slug, ansId, txt);
    setCommentTextState(prev => ({ ...prev, [ansId]: '' }));
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Return back to categories button */}
      <button
        onClick={() => setScreen({ type: 'question_list' })}
        className="text-xs text-[#6B7280] hover:text-[#24324A] inline-flex items-center gap-1 font-semibold border border-[#E5E7EB] bg-white px-3 py-1.5 rounded-xl transition-all hover:border-zinc-300 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Advice Boards
      </button>

      {/* Main Question Body container card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-2 text-xs">
            <span className="font-bold text-red-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <Shield className="h-3.5 w-3.5 text-[#C9A227] animate-pulse" /> Advice Board Override Console
            </span>
            {showQuestionDeleteConfirm ? (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-red-700 font-bold font-mono text-[11px]">Permanently delete board request?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuestion?.(question.slug);
                    setScreen({ type: 'question_list' });
                  }}
                  className="px-2.5 py-1 rounded bg-red-655 text-white font-extrabold text-[10px] bg-red-600 transition-all shadow-2xs"
                >
                  Yes, Delete Board
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded bg-zinc-200 text-zinc-700 font-bold text-[10px] transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowQuestionDeleteConfirm(true)}
                className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-[#C0392B] border border-red-200 font-bold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Request
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-50 text-purple-600">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280] font-mono">Advice Request</span>
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-[#24324A] leading-snug font-serif">
          "{question.title}"
        </h1>

        <p className="text-base text-[#374151] leading-relaxed font-serif pl-3 border-l-2 border-purple-500 bg-purple-50/50 py-2.5 rounded-r-xl not-italic">
          {question.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 border-t border-[#ECECEC] pt-3">
          {question.tags.map(t => (
            <span key={t} className="text-[10px] bg-[#F4F1E8] border border-[#E5E7EB] text-[#6B7280] font-semibold px-2 py-0.5 rounded-md">
              #{t}
            </span>
          ))}
          <span className="text-[10px] uppercase tracking-wider font-bold text-purple-600 bg-purple-50 py-0.5 px-2 rounded-lg ml-auto font-mono">
            {question.category} Advice Core
          </span>
        </div>
      </div>

      {/* Interactive Poll & Answer Blocks split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Dynamic Poll */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-1 text-purple-600">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A] font-mono">Community Advice Poll</h3>
          </div>

          {userVote ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-2.5 text-xs text-center text-purple-700 font-bold mb-2">
                ✓ Your poll response captured! Live metrics:
              </div>

              {question.pollOptions.map(opt => {
                const pct = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                return (
                  <div key={opt.text} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[#6B7280]">
                      <span className={userVote === opt.text ? 'text-[#24324A] font-bold' : ''}>
                        {opt.text} {userVote === opt.text && '(You)'}
                      </span>
                      <span className="text-[#1F2937] font-bold font-mono">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#FAF8F2] overflow-hidden border border-[#E5E7EB]">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              
              <div className="text-center pt-2 text-[10px] text-zinc-400 font-mono font-bold">
                Total poll database responses: {totalPollVotes.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[#6B7280] mb-3">Vote anonymously to express what action the seeker should take:</p>
              {question.pollOptions.map(opt => (
                <button
                  key={opt.text}
                  onClick={() => onVoteQuestionPoll(question.slug, opt.text)}
                  className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-3 text-xs font-bold text-[#1F2937] hover:border-purple-500 hover:bg-[#FAF8F2] transition-all flex items-center justify-between shadow-xs"
                >
                  <span className="pr-3 leading-snug">{opt.text}</span>
                  <Vote className="h-4 w-4 text-[#6B7280] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: answers columns with inline nested comments */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-5 shadow-sm">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC]">
              <div className="flex items-center gap-2 font-mono">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#24324A]">Survivor Advice Forum</h3>
              </div>
              <span className="text-[10px] bg-purple-55 bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-lg border border-purple-100">
                {question.answers.length} Responses
              </span>
            </div>

            {/* Answer editor input */}
            <form onSubmit={handleAnswerSubmit} className="space-y-3 bg-[#FAF8F2] p-4 rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] uppercase font-bold text-[#24324A] block font-mono">Post Anonymous Advice</span>
              <textarea
                placeholder="Share your logical insights here. Have you went through this? State if they should leave, stay, or what you regret most."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                maxLength={900}
                rows={3}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-xs text-[#1F2937] focus:outline-none focus:border-purple-600 placeholder-zinc-400 font-medium"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#24324A] hover:bg-[#1C273A] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Post My Advice
                </button>
              </div>
            </form>

            {/* List answers with user comments nested below each advice */}
            <div className="space-y-4">
              {question.answers.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400 font-semibold bg-[#FAF8F2] rounded-xl">
                  No advice has been posted on this board yet. Share your experience to help them out!
                </div>
              ) : (
                question.answers.map(ans => (
                  <div key={ans.id} className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F2] p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-3 font-mono">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-extrabold text-[#24324A]">@{ans.author}</span>
                        {ans.isOutcomeVerified && (
                          <span className="text-[9px] bg-emerald-50 text-[#2E7D32] px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 font-sans font-bold shadow-2xs">
                            <Award className="h-2.5 w-2.5" /> Outcome Survivor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                        <span>{ans.date}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteAnswer?.(question.slug, ans.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-655 text-red-600 border border-red-100 p-1 rounded-md transition-colors"
                            title="Moderator: Delete advice"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[#374151] leading-relaxed text-sm font-serif not-italic pl-2 border-l-2 border-purple-400">
                      "{ans.text}"
                    </p>

                    <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => onUpvoteAnswer(question.slug, ans.id)}
                        className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-extrabold transition-colors"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({ans.votes})
                      </button>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {(ans.comments || []).length} comments
                      </span>
                    </div>

                    {/* NESTED COMMENTS UNDER THE CURRENT ADVICE */}
                    <div className="bg-white p-3 rounded-xl border border-[#E5E7EB] space-y-2 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">Discussion Comments</span>
                      
                      {/* Comments list */}
                      {(ans.comments || []).length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(ans.comments || []).map(comment => (
                            <div key={comment.id} className="bg-[#FAF8F2] p-2 rounded-lg border border-[#E5E7EB] text-xs">
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5 font-mono">
                                <span className="font-bold text-[#1F2937]">@{comment.author}</span>
                                <div className="flex items-center gap-1.5">
                                  <span>{comment.date}</span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteAnswerComment?.(question.slug, ans.id, comment.id)}
                                      className="bg-red-50 hover:bg-red-100 text-[#C0392B] border border-red-100 p-0.5 rounded transition-colors"
                                      title="Moderator: Delete comment"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[#374151] pl-0.5 font-sans leading-relaxed">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-400 italic font-medium">No feedback comments written yet. Ask a question or share thoughts!</p>
                      )}

                      {/* Comment Input Form */}
                      <form onSubmit={(e) => handleCommentSubmit(e, ans.id)} className="flex gap-2 pt-1 border-t border-[#ECECEC] mt-2 font-semibold">
                        <input
                          type="text"
                          placeholder="Reply or question this advice anonymously..."
                          value={commentTextState[ans.id] || ''}
                          onChange={(e) => setCommentTextState(prev => ({ ...prev, [ans.id]: e.target.value }))}
                          maxLength={300}
                          className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs text-[#1F2937] placeholder-zinc-400 focus:outline-none focus:border-purple-600 font-medium"
                          required
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 text-[10px] font-bold flex items-center gap-0.5 transition-all shadow-2xs"
                        >
                          <Send className="h-2.5 w-2.5" /> Submit
                        </button>
                      </form>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
