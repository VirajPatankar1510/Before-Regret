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
  onDeleteQuestion
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
        className="text-xs text-[#AAB2C0] hover:text-white inline-flex items-center gap-1 font-semibold border border-[#30363D] bg-[#161B22] px-3 py-1.5 rounded-xl transition-all hover:border-zinc-500 hover:scale-[1.01]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Advice Boards
      </button>

      {/* Main Question Body container card */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-md space-y-4">
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-2.5 mb-2 text-xs">
            <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <Shield className="h-3.5 w-3.5 text-[#F4B942] animate-pulse" /> Advice Board Override Console
            </span>
            {showQuestionDeleteConfirm ? (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-red-400 font-bold font-mono text-[11px]">Permanently delete board request?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuestion?.(question.slug);
                    setScreen({ type: 'question_list' });
                  }}
                  className="px-2.5 py-1 rounded bg-red-500 text-white font-extrabold text-[10px] transition-all"
                >
                  Yes, Delete Board
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionDeleteConfirm(false)}
                  className="px-2.5 py-1 rounded bg-zinc-655 text-white font-bold text-[10px] transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowQuestionDeleteConfirm(true)}
                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Request
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10 text-purple-400">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#AAB2C0]">Advice Request</span>
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
          "{question.title}"
        </h1>

        <p className="text-xs sm:text-sm text-neutral-205 leading-relaxed font-serif pl-3 border-l-2 border-purple-500/80 bg-purple-500/5 py-2.5 rounded-r-xl">
          {question.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 border-t border-[#30363D]/40 pt-3">
          {question.tags.map(t => (
            <span key={t} className="text-[10px] bg-[#30363D]/30 border border-[#30363D] text-zinc-400 font-semibold px-2 py-0.5 rounded-md">
              #{t}
            </span>
          ))}
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-400 bg-purple-500/10 py-0.5 px-2 rounded-lg ml-auto">
            {question.category} Advice Core
          </span>
        </div>
      </div>

      {/* Interactive Poll & Answer Blocks split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Dynamic Poll */}
        <div className="lg:col-span-5 rounded-2xl border border-[#30363D] bg-[#161B22] p-5 space-y-4">
          <div className="flex items-center gap-1 text-purple-400">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Community Advice Poll</h3>
          </div>

          {userVote ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-2.5 text-xs text-center text-purple-400 font-semibold mb-2">
                ✓ Your poll response captured! Live metrics:
              </div>

              {question.pollOptions.map(opt => {
                const pct = totalPollVotes > 0 ? Math.round((opt.votes / totalPollVotes) * 100) : 0;
                return (
                  <div key={opt.text} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[#AAB2C0]">
                      <span className={userVote === opt.text ? 'text-white font-extrabold' : ''}>
                        {opt.text} {userVote === opt.text && '(You)'}
                      </span>
                      <span className="text-white">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#0D1117] overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              
              <div className="text-center pt-2 text-[10px] text-zinc-500">
                Total poll database responses: {totalPollVotes.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[#AAB2C0] mb-3">Vote anonymously to express what action the seeker should take:</p>
              {question.pollOptions.map(opt => (
                <button
                  key={opt.text}
                  onClick={() => onVoteQuestionPoll(question.slug, opt.text)}
                  className="w-full text-left rounded-xl border border-[#30363D] bg-[#161B22] p-3 text-xs font-semibold text-white hover:border-purple-500 hover:bg-[#30363D] transition-all flex items-center justify-between"
                >
                  <span className="pr-3 leading-snug">{opt.text}</span>
                  <Vote className="h-4 w-4 text-[#AAB2C0] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: answers columns with inline nested comments */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 space-y-5">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#30363D]/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Experience-Led Survivor Advice</h3>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 font-extrabold px-2 py-0.5 rounded-lg">
                {question.answers.length} Responses
              </span>
            </div>

            {/* Answer editor input */}
            <form onSubmit={handleAnswerSubmit} className="space-y-3 bg-[#0D1117] p-4 rounded-xl border border-[#30363D]">
              <span className="text-[11px] uppercase font-bold text-slate-300 block">Post Anonymous Advice</span>
              <textarea
                placeholder="Share your logical insights here. Have you went through this? State if they should leave, stay, or what you regret most."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                maxLength={900}
                rows={3}
                className="w-full rounded-xl border border-[#30363D] bg-[#161B22] p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-500"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-1.5 text-xs font-black transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Post My Advice
                </button>
              </div>
            </form>

            {/* List answers with user comments nested below each advice */}
            <div className="space-y-4">
              {question.answers.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No advice has been posted on this board yet. Share your experience to help them out!
                </div>
              ) : (
                question.answers.map(ans => (
                  <div key={ans.id} className="rounded-xl border border-[#30363D] bg-[#0E131B] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 font-mono">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-extrabold text-[#4F8CFF]">@{ans.author}</span>
                        {ans.isOutcomeVerified && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-450 px-1.5 py-0.5 rounded border border-emerald-500/15 flex items-center gap-0.5 font-sans font-bold">
                            <Award className="h-2.5 w-2.5" /> Outcome Survivor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span>{ans.date}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteAnswer?.(question.slug, ans.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-1 rounded-md transition-colors"
                            title="Moderator: Delete advice"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-zinc-250 leading-relaxed text-xs sm:text-sm font-serif italic text-[#AAB2C0] pl-2 border-l border-indigo-750">
                      "{ans.text}"
                    </p>

                    <div className="flex items-center justify-between border-t border-[#30363D]/40 pt-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onUpvoteAnswer(question.slug, ans.id)}
                        className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold transition-colors"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({ans.votes})
                      </button>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {(ans.comments || []).length} comments
                      </span>
                    </div>

                    {/* NESTED COMMENTS UNDER THE CURRENT ADVICE */}
                    <div className="bg-[#121824] p-3 rounded-xl border border-[#30363D]/60 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AAB2C0] block">Discussion Comments</span>
                      
                      {/* Comments list */}
                      {(ans.comments || []).length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(ans.comments || []).map(comment => (
                            <div key={comment.id} className="bg-[#161B22]/55 p-2 rounded-lg border border-[#30363D]/40 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5 font-mono">
                                <span className="font-bold text-slate-350">@{comment.author}</span>
                                <span>{comment.date}</span>
                              </div>
                              <p className="text-neutral-200 pl-0.5 font-sans leading-relaxed">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 italic">No feedback comments written yet. Ask a question or share thoughts!</p>
                      )}

                      {/* Comment Input Form */}
                      <form onSubmit={(e) => handleCommentSubmit(e, ans.id)} className="flex gap-2 pt-1 border-t border-[#30363D]/20 mt-2">
                        <input
                          type="text"
                          placeholder="Reply or question this advice anonymously..."
                          value={commentTextState[ans.id] || ''}
                          onChange={(e) => setCommentTextState(prev => ({ ...prev, [ans.id]: e.target.value }))}
                          maxLength={300}
                          className="flex-1 rounded-lg border border-[#30363D] bg-[#161B22] px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                          required
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-0.5 transition-all"
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
