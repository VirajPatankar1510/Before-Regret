import React, { useState } from 'react';
import { HelpCircle, Vote, MessageSquare, ArrowLeft, CheckCircle, Sparkles, Plus, Award, Shield, Trash2 } from 'lucide-react';
import { Question } from '../types';

interface QuestionProps {
  question: Question;
  setScreen: (screen: { type: string; slug?: string }) => void;
  onVoteQuestionPoll: (slug: string, optionText: string) => void;
  onAddQuestionAnswer: (slug: string, text: string) => void;
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
  userVotedQuestions,
  isAdmin = false,
  onDeleteAnswer,
  onDeleteQuestion
}: QuestionProps) {
  const [answerContent, setAnswerContent] = useState('');
  const [showQuestionDeleteConfirm, setShowQuestionDeleteConfirm] = useState(false);
  
  const userVote = userVotedQuestions[question.slug];
  const totalPollVotes = question.pollOptions.reduce((acc, o) => acc + o.votes, 0);

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    onAddQuestionAnswer(question.slug, answerContent);
    setAnswerContent('');
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      
      {/* Return back to categories button */}
      <button
        onClick={() => setScreen({ type: 'home' })}
        className="text-xs text-[#AAB2C0] hover:text-white inline-flex items-center gap-1 font-semibold border border-[#30363D] bg-[#161B22] px-3 py-1.5 rounded-xl transition-all hover:border-zinc-500 hover:scale-[1.01]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Return to Q&A Board
      </button>

      {/* Main Question Body container card */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-md space-y-4">
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-2.5 mb-2 text-xs">
            <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <Shield className="h-3.5 w-3.5 text-[#F4B942] animate-pulse" /> Q&A Override Console
            </span>
            {showQuestionDeleteConfirm ? (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-red-400 font-bold font-mono text-[11px]">Permanently delete question?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuestion?.(question.slug);
                    setScreen({ type: 'home' });
                  }}
                  className="px-2.5 py-1 rounded bg-red-500 text-white font-extrabold text-[10px] transition-all"
                >
                  Yes, Delete Q&A
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
                <Trash2 className="h-3.5 w-3.5" /> Delete Question
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10 text-purple-400">
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#AAB2C0]">Relationship Queries</span>
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
          "{question.title}"
        </h1>

        <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-serif pl-1 border-l-2 border-indigo-700">
          {question.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 border-t border-[#30363D]/40 pt-3">
          {question.tags.map(t => (
            <span key={t} className="text-[10px] bg-[#30363D]/30 border border-[#30363D] text-zinc-400 font-semibold px-2 py-0.5 rounded-md">
              #{t}
            </span>
          ))}
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 py-0.5 px-2 rounded ml-auto">
            Verified stats linked: {question.storiesCount.toLocaleString()} story outcomes
          </span>
        </div>
      </div>

      {/* Interactive Poll & Answer Blocks split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Dynamic Poll */}
        <div className="md:col-span-5 rounded-2xl border border-[#30363D] bg-[#161B22] p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Community Opinion Poll</h3>

          {userVote ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-2.5 text-xs text-center text-purple-400 font-semibold mb-2">
                ✓ Poll opinion captured! Live community metrics:
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
              <p className="text-[11px] text-[#AAB2C0] mb-3">Vote anonymously to express what decision the poster should enact:</p>
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

        {/* Right Side: answers columns */}
        <div className="md:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Community Experience-Led Answers</h3>
              <span className="text-[10px] text-[#AAB2C0]">Verified outcomes marked first</span>
            </div>

            {/* Answer editor input */}
            <form onSubmit={handleAnswerSubmit} className="space-y-3 bg-[#0D1117] p-3 rounded-xl border border-[#30363D]">
              <span className="text-[10px] uppercase font-bold text-[#AAB2C0] block">Provide Your Response Advice</span>
              <textarea
                placeholder="Share your logical insights here. Have you survived this? State if you left, stayed, or what you regret most."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                maxLength={900}
                className="w-full rounded-xl border border-[#30363D] bg-[#161B22] p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-500 text-white px-3.5 py-1.5 text-xs font-black hover:bg-purple-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Submit Answer
                </button>
              </div>
            </form>

            {/* List answers */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {question.answers.map(ans => (
                <div key={ans.id} className="rounded-xl border border-[#30363D] bg-[#0E131B] p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className="font-bold text-white">@{ans.author}</span>
                      {ans.isOutcomeVerified && (
                        <span className="text-[10px] bg-emerald-500/15 text-[#2ECC71] px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                          <Award className="h-2.5 w-2.5" /> Contributed Outcome
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500">{ans.date}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteAnswer?.(question.slug, ans.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-1 rounded-md transition-colors"
                          title="Moderator: Delete answer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[#AAB2C0] leading-relaxed text-xs sm:text-xs font-serif">"{ans.text}"</p>
                  <div className="flex justify-end gap-2 text-[10px] mt-2 text-zinc-500">
                    <span>Vote helpful:</span>
                    <button
                      type="button"
                      onClick={() => alert("Answer voted helpful!")}
                      className="text-purple-400 hover:underline"
                    >
                      Upvote ({ans.votes})
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
