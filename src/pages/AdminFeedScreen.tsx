import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, 
  Trash2, 
  ExternalLink, 
  Search, 
  Compass, 
  Gavel, 
  Sparkles, 
  AlertTriangle, 
  Heart, 
  MessageSquare, 
  Calendar, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  CheckCircle, 
  User, 
  ThumbsUp,
  Inbox,
  Lock,
  EyeOff,
  Bell,
  RefreshCw
} from 'lucide-react';
import { Story, StoryComment, CourtCase, Question, RedFlagCase } from '../types';

interface FeedItem {
  id: string;
  type: 'story' | 'comment' | 'court_case' | 'jury_argument' | 'question' | 'advice_answer' | 'advice_comment' | 'red_flag_case' | 'red_flag_comment';
  typeLabel: string;
  categoryLabel: string;
  title: string;
  content: string;
  author: string;
  dateStr: string;
  dateObj: Date;
  slug: string;
  meta?: React.ReactNode;
  onView: () => void;
  onDelete: () => void;
}

interface AdminFeedScreenProps {
  stories: Story[];
  comments: StoryComment[];
  courtCases: CourtCase[];
  questions: Question[];
  redFlagCases: RedFlagCase[];
  isAdmin: boolean;
  setScreen: (screen: { type: string; slug?: string }) => void;
  onDeleteStory: (storyId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteCourtCase: (slug: string) => void;
  onDeleteArgument: (caseSlug: string, argId: string) => void;
  onDeleteQuestion: (slug: string) => void;
  onDeleteAnswer: (qSlug: string, ansId: string) => void;
  onDeleteAnswerComment: (qSlug: string, ansId: string, commentId: string) => void;
  onDeleteRedFlagCase: (caseId: string) => void;
  onDeleteRedFlagComment: (caseId: string, commentId: string) => void;
  onToggleAdmin: (val: boolean) => void;
}

export default function AdminFeedScreen({
  stories,
  comments,
  courtCases,
  questions,
  redFlagCases,
  isAdmin,
  setScreen,
  onDeleteStory,
  onDeleteComment,
  onDeleteCourtCase,
  onDeleteArgument,
  onDeleteQuestion,
  onDeleteAnswer,
  onDeleteAnswerComment,
  onDeleteRedFlagCase,
  onDeleteRedFlagComment,
  onToggleAdmin
}: AdminFeedScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(() => {
    const saved = localStorage.getItem('before_regret_last_feed_check');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  // Save last check timestamp to localStorage on mount or when tab is open
  useEffect(() => {
    localStorage.setItem('before_regret_last_feed_check', Date.now().toString());
  }, []);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'BR1510') {
      onToggleAdmin(true);
      setAuthError(false);
      setPasswordInput('');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 3000);
    }
  };

  // Compile and standardize all real-time submissions into a single chronological feed
  const allFeedItems = useMemo(() => {
    const items: FeedItem[] = [];

    // 1. Stories
    stories.forEach(s => {
      const isUserSubmitted = s.id.startsWith('usr_') || s.caseNumber?.startsWith('S');
      items.push({
        id: `story-${s.id}`,
        type: 'story',
        typeLabel: 'Story',
        categoryLabel: 'Everything Explore',
        title: s.title,
        content: s.fullStory,
        author: s.userName || 'Anonymous Seeker',
        dateStr: s.dateAdded,
        dateObj: new Date(s.dateAdded),
        slug: s.id,
        meta: (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-[#24324A] font-semibold border border-[#E5E7EB]">
              Regret Score: <strong className="text-[#C9A227]">{s.regretScore}/10</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
              Decision: <strong>{s.decisionMade}</strong> ({s.currentOutcome})
            </span>
            {isUserSubmitted && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                User Submission
              </span>
            )}
          </div>
        ),
        onView: () => setScreen({ type: 'regret_stories', slug: s.id }),
        onDelete: () => onDeleteStory(s.id)
      });
    });

    // 2. Comments on Stories
    comments.forEach(c => {
      const story = stories.find(s => s.id === c.storyId);
      const storyTitle = story ? story.title : 'Registry Case Story';
      const isUserSubmitted = c.id.startsWith('comment_');
      items.push({
        id: `comment-${c.id}`,
        type: 'comment',
        typeLabel: 'Registry Comment',
        categoryLabel: 'Regret Registry Feed',
        title: `Comment on Story: "${storyTitle}"`,
        content: c.text,
        author: c.authorName || 'Anonymous Seeker',
        dateStr: c.dateAdded,
        dateObj: new Date(c.dateAdded),
        slug: c.storyId,
        meta: (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB] font-mono">
              Story ID: {c.storyId}
            </span>
            {isUserSubmitted && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                User Submission
              </span>
            )}
          </div>
        ),
        onView: () => setScreen({ type: 'regret_stories', slug: c.storyId }),
        onDelete: () => onDeleteComment(c.id)
      });
    });

    // 3. Court Cases
    courtCases.forEach(cc => {
      const isUserSubmitted = cc.slug.startsWith('case-') || cc.caseNumber?.startsWith('C');
      items.push({
        id: `courtcase-${cc.slug}`,
        type: 'court_case',
        typeLabel: 'Court Trial',
        categoryLabel: 'BR Court Case',
        title: cc.title,
        content: cc.description,
        author: cc.author || 'Court Submitter',
        dateStr: cc.createdAt || cc.postTime,
        dateObj: new Date(cc.createdAt || cc.postTime || Date.now()),
        slug: cc.slug,
        meta: (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-semibold">
              Votes: Me ({cc.votes.me}) | Partner ({cc.votes.partner}) | Both ({cc.votes.both})
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB] font-mono">
              {cc.caseNumber || 'JURY CASE'}
            </span>
            {isUserSubmitted && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                User Submission
              </span>
            )}
          </div>
        ),
        onView: () => setScreen({ type: 'court_case', slug: cc.slug }),
        onDelete: () => onDeleteCourtCase(cc.slug)
      });

      // Jury Arguments
      if (cc.arguments && Array.isArray(cc.arguments)) {
        cc.arguments.forEach(arg => {
          items.push({
            id: `courtarg-${arg.id}`,
            type: 'jury_argument',
            typeLabel: 'Jury Opinion',
            categoryLabel: 'BR Court Opinions',
            title: `Jury Opinion on trial: "${cc.title}"`,
            content: arg.text,
            author: `${arg.author} (${arg.role || 'Juror'})`,
            dateStr: cc.createdAt || cc.postTime,
            dateObj: new Date(cc.createdAt || cc.postTime || Date.now()),
            slug: cc.slug,
            meta: (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 font-semibold">
                  Side: {arg.side}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-100 font-semibold font-mono">
                  Argument Upvotes: {arg.votes}
                </span>
              </div>
            ),
            onView: () => setScreen({ type: 'court_case', slug: cc.slug }),
            onDelete: () => onDeleteArgument(cc.slug, arg.id)
          });
        });
      }
    });

    // 4. Questions
    questions.forEach(q => {
      const isUserSubmitted = q.slug.startsWith('q_');
      items.push({
        id: `question-${q.slug}`,
        type: 'question',
        typeLabel: 'Advice Question',
        categoryLabel: 'Advice Boards',
        title: q.title,
        content: q.description,
        author: 'Advice Board Seeker',
        dateStr: new Date().toISOString(),
        dateObj: new Date(),
        slug: q.slug,
        meta: (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100 font-semibold">
              Category: {q.category}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
              Advice Replies: {q.answers?.length || 0}
            </span>
            {isUserSubmitted && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                User Submission
              </span>
            )}
          </div>
        ),
        onView: () => setScreen({ type: 'question', slug: q.slug }),
        onDelete: () => onDeleteQuestion(q.slug)
      });

      // Advice answers
      if (q.answers && Array.isArray(q.answers)) {
        q.answers.forEach(ans => {
          items.push({
            id: `answer-${ans.id}`,
            type: 'advice_answer',
            typeLabel: 'Board Advice',
            categoryLabel: 'Advice Boards Answers',
            title: `Advice Answer on: "${q.title}"`,
            content: ans.text,
            author: ans.author || 'Anonymous Advisor',
            dateStr: ans.date || new Date().toISOString(),
            dateObj: new Date(ans.date || Date.now()),
            slug: q.slug,
            meta: (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
                <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
                  Support Count: {ans.votes} votes
                </span>
                {ans.isOutcomeVerified && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200/60 uppercase text-[8px] tracking-wider">
                    Outcome Verified
                  </span>
                )}
              </div>
            ),
            onView: () => setScreen({ type: 'question', slug: q.slug }),
            onDelete: () => onDeleteAnswer(q.slug, ans.id)
          });

          // Answer comments
          if (ans.comments && Array.isArray(ans.comments)) {
            ans.comments.forEach(ac => {
              items.push({
                id: `anscomment-${ac.id}`,
                type: 'advice_comment',
                typeLabel: 'Board Answer Reply',
                categoryLabel: 'Advice Boards Comments',
                title: `Comment on advice by @${ans.author} on: "${q.title}"`,
                content: ac.text,
                author: ac.author || 'Discussion Contributor',
                dateStr: ac.date || new Date().toISOString(),
                dateObj: new Date(ac.date || Date.now()),
                slug: q.slug,
                meta: (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2 font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
                      Answer ID: {ans.id}
                    </span>
                  </div>
                ),
                onView: () => setScreen({ type: 'question', slug: q.slug }),
                onDelete: () => onDeleteAnswerComment(q.slug, ans.id, ac.id)
              });
            });
          }
        });
      }
    });

    // 5. Red Flag Cases
    redFlagCases.forEach(rf => {
      const isUserSubmitted = rf.id.startsWith('flag_') || rf.caseNumber?.startsWith('F');
      items.push({
        id: `redflag-${rf.id}`,
        type: 'red_flag_case',
        typeLabel: 'Red Flag',
        categoryLabel: 'Red Flag Meter',
        title: rf.title,
        content: rf.description,
        author: rf.author || 'Dating Observer',
        dateStr: rf.dateAdded,
        dateObj: new Date(rf.dateAdded),
        slug: rf.id,
        meta: (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-100 font-semibold">
              Voted Red: {rf.votes.red} | Green: {rf.votes.green} | Yellow: {rf.votes.yellow}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB] font-mono">
              {rf.caseNumber || 'FLAG KEY'}
            </span>
            {isUserSubmitted && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                User Submission
              </span>
            )}
          </div>
        ),
        onView: () => setScreen({ type: 'red_flag_meter', slug: rf.id }),
        onDelete: () => onDeleteRedFlagCase(rf.id)
      });

      // Red flag comments
      if (rf.comments && Array.isArray(rf.comments)) {
        rf.comments.forEach(com => {
          items.push({
            id: `redflagcomment-${com.id}`,
            type: 'red_flag_comment',
            typeLabel: 'Red Flag Reply',
            categoryLabel: 'Red Flag Meter Replies',
            title: `Comment on Red Flag case: "${rf.title}"`,
            content: com.text,
            author: com.author || 'Flag Analyst',
            dateStr: com.date || new Date().toISOString(),
            dateObj: new Date(com.date || Date.now()),
            slug: rf.id,
            meta: (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2 font-mono">
                <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
                  Flag Case: {rf.id}
                </span>
              </div>
            ),
            onView: () => setScreen({ type: 'red_flag_meter', slug: rf.id }),
            onDelete: () => onDeleteRedFlagComment(rf.id, com.id)
          });
        });
      }
    });

    return items;
  }, [stories, comments, courtCases, questions, redFlagCases, setScreen, onDeleteStory, onDeleteComment, onDeleteCourtCase, onDeleteArgument, onDeleteQuestion, onDeleteAnswer, onDeleteAnswerComment, onDeleteRedFlagCase, onDeleteRedFlagComment]);

  // Filters and search logic
  const filteredAndSortedItems = useMemo(() => {
    let result = [...allFeedItems];

    // Filter by type
    if (selectedType !== 'all') {
      if (selectedType === 'stories') {
        result = result.filter(item => item.type === 'story');
      } else if (selectedType === 'court') {
        result = result.filter(item => item.type === 'court_case' || item.type === 'jury_argument');
      } else if (selectedType === 'board') {
        result = result.filter(item => item.type === 'question' || item.type === 'advice_answer' || item.type === 'advice_comment');
      } else if (selectedType === 'flags') {
        result = result.filter(item => item.type === 'red_flag_case' || item.type === 'red_flag_comment');
      } else if (selectedType === 'registry') {
        result = result.filter(item => item.type === 'comment');
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.content.toLowerCase().includes(q) || 
        item.author.toLowerCase().includes(q) || 
        item.typeLabel.toLowerCase().includes(q)
      );
    }

    // Sort by timestamp
    result.sort((a, b) => {
      const valA = a.dateObj.getTime();
      const valB = b.dateObj.getTime();
      return sortBy === 'newest' ? valB - valA : valA - valB;
    });

    return result;
  }, [allFeedItems, selectedType, searchQuery, sortBy]);

  // Statistics summaries
  const stats = useMemo(() => {
    const storiesCount = stories.length;
    const commentsCount = comments.length;
    const courtCasesCount = courtCases.length;
    const argumentsCount = courtCases.reduce((acc, cc) => acc + (cc.arguments?.length || 0), 0);
    const questionsCount = questions.length;
    const answersCount = questions.reduce((acc, q) => acc + (q.answers?.length || 0), 0);
    const qCommentsCount = questions.reduce((acc, q) => {
      return acc + (q.answers?.reduce((sum, a) => sum + (a.comments?.length || 0), 0) || 0);
    }, 0);
    const flagCasesCount = redFlagCases.length;
    const flagCommentsCount = redFlagCases.reduce((acc, rf) => acc + (rf.comments?.length || 0), 0);

    const totalSubmissions = storiesCount + commentsCount + courtCasesCount + argumentsCount + questionsCount + answersCount + qCommentsCount + flagCasesCount + flagCommentsCount;

    return {
      total: totalSubmissions,
      stories: storiesCount,
      comments: commentsCount,
      court: courtCasesCount + argumentsCount,
      boards: questionsCount + answersCount + qCommentsCount,
      flags: flagCasesCount + flagCommentsCount
    };
  }, [stories, comments, courtCases, questions, redFlagCases]);

  // Highlight items submitted after last feed check time (New Submissions Alert)
  const newSubmissionsCount = useMemo(() => {
    return allFeedItems.filter(item => item.dateObj.getTime() > lastCheckTime).length;
  }, [allFeedItems, lastCheckTime]);

  const formatRelativeTime = (dateObj: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'story': return <Compass className="h-4 w-4 text-blue-500" />;
      case 'comment': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'court_case': return <Gavel className="h-4 w-4 text-purple-500" />;
      case 'jury_argument': return <Gavel className="h-4 w-4 text-purple-400" />;
      case 'question': return <Sparkles className="h-4 w-4 text-teal-500" />;
      case 'advice_answer': return <Sparkles className="h-4 w-4 text-teal-400" />;
      case 'advice_comment': return <MessageSquare className="h-4 w-4 text-zinc-400" />;
      case 'red_flag_case': return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'red_flag_comment': return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      default: return <Inbox className="h-4 w-4 text-[#AAB2C0]" />;
    }
  };

  const handleClearLastCheck = () => {
    setLastCheckTime(Date.now());
    localStorage.setItem('before_regret_last_feed_check', Date.now().toString());
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="admin-feed-dashboard">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A227] font-mono">PLATFORM MONITOR & MODERATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#24324A] tracking-tight mt-1">In-App Activity Feed</h1>
          <p className="text-xs text-zinc-500 max-w-xl leading-relaxed mt-1">
            Real-time visual dashboard of all relationship stories, BR court cases, juror verdicts, advice replies, registry comments, and flag analysis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {newSubmissionsCount > 0 && (
            <button
              onClick={handleClearLastCheck}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Bell className="h-3 w-3 animate-bounce" />
              <span>Mark {newSubmissionsCount} New Read</span>
            </button>
          )}

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F4F1E8] border border-[#E5E7EB] text-[11px] text-zinc-600 font-semibold font-mono">
            <Clock className="h-3 w-3 text-zinc-400" />
            <span>Updates: Live Streamed (Firestore)</span>
          </div>
        </div>
      </div>

      {/* Auth Guard Banner if not Admin */}
      {!isAdmin && (
        <div className="bg-[#FAF8F2] border border-amber-300/60 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[#24324A] uppercase flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" /> Authorization Required for Moderation
            </h3>
            <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
              You are viewing the submission activity feed in read-only audit mode. To gain moderation powers (direct permanent removal of any user-submitted text across all boards), activate Admin Mode with credentials.
            </p>
          </div>
          <form onSubmit={handleAdminAuthSubmit} className="flex gap-2 w-full md:w-auto">
            <input
              type="password"
              placeholder="Admin password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="bg-white border border-[#E5E7EB] hover:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[160px] grow"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#24324A] hover:bg-[#1a2536] text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              Authorize
            </button>
          </form>
        </div>
      )}

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Metric Card 1: Total */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">Total Active Items</span>
            <span className="p-1 rounded-md bg-zinc-100 text-zinc-600">
              <Inbox className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#24324A] font-mono tracking-tight">{stats.total}</div>
            <p className="text-[10px] text-zinc-400 mt-1">Sum of all records in state memory</p>
          </div>
        </div>

        {/* Metric Card 2: Explore & Regret Comments */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">Registry & Stories</span>
            <span className="p-1 rounded-md bg-blue-50 text-blue-600">
              <Compass className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-blue-900 font-mono">{stats.stories + stats.comments}</div>
            <p className="text-[9px] text-zinc-400 mt-0.5">{stats.stories} stories, {stats.comments} comments</p>
          </div>
        </div>

        {/* Metric Card 3: Court Trials & Jury arguments */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">BR Jury Trials</span>
            <span className="p-1 rounded-md bg-purple-50 text-purple-600">
              <Gavel className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-purple-900 font-mono">{stats.court}</div>
            <p className="text-[9px] text-zinc-400 mt-0.5">Court cases + jury statements</p>
          </div>
        </div>

        {/* Metric Card 4: Q&A Board Answers and Replies */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">Advice Q&A</span>
            <span className="p-1 rounded-md bg-teal-50 text-teal-600">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-teal-900 font-mono">{stats.boards}</div>
            <p className="text-[9px] text-zinc-400 mt-0.5">Queries, expert tips, & replies</p>
          </div>
        </div>

        {/* Metric Card 5: Red Flags Cases & Comments */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">Red Flags</span>
            <span className="p-1 rounded-md bg-rose-50 text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-900 font-mono">{stats.flags}</div>
            <p className="text-[9px] text-zinc-400 mt-0.5">Flag cases + warning comments</p>
          </div>
        </div>

      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E7EB]">
        
        {/* Left Side: Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider mr-2">Filter</span>
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              selectedType === 'all' 
                ? 'bg-[#24324A] text-white border-[#24324A]' 
                : 'bg-white text-zinc-600 border-[#E5E7EB] hover:bg-zinc-50'
            }`}
          >
            All Submissions
          </button>
          <button
            onClick={() => setSelectedType('stories')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1 ${
              selectedType === 'stories' 
                ? 'bg-[#24324A] text-white border-[#24324A]' 
                : 'bg-white text-blue-600 border-[#E5E7EB] hover:bg-zinc-50'
            }`}
          >
            <Compass className="h-3 w-3" />
            <span>Stories</span>
          </button>
          <button
            onClick={() => setSelectedType('court')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1 ${
              selectedType === 'court' 
                ? 'bg-[#24324A] text-white border-[#24324A]' 
                : 'bg-white text-purple-600 border-[#E5E7EB] hover:bg-zinc-50'
            }`}
          >
            <Gavel className="h-3 w-3" />
            <span>BR Court</span>
          </button>
          <button
            onClick={() => setSelectedType('board')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1 ${
              selectedType === 'board' 
                ? 'bg-[#24324A] text-white border-[#24324A]' 
                : 'bg-white text-teal-600 border-[#E5E7EB] hover:bg-zinc-50'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Advice Q&A</span>
          </button>
          <button
            onClick={() => setSelectedType('flags')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1 ${
              selectedType === 'flags' 
                ? 'bg-[#24324A] text-white border-[#24324A]' 
                : 'bg-white text-rose-600 border-[#E5E7EB] hover:bg-zinc-50'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Red Flags</span>
          </button>
          <button
            onClick={() => setSelectedType('registry')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1 ${
              selectedType === 'registry' 
                ? 'bg-[#24324A] text-white border-[#24324A]' 
                : 'bg-white text-pink-600 border-[#E5E7EB] hover:bg-zinc-50'
            }`}
          >
            <Heart className="h-3 w-3" />
            <span>Comments</span>
          </button>
        </div>

        {/* Right Side: Search & Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Real-time search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Filter by author/keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white text-xs border border-[#E5E7EB] hover:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24324A]/10 w-full sm:w-[220px]"
            />
          </div>

          {/* Sort trigger toggle */}
          <button
            onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-2 bg-white text-xs font-semibold text-zinc-600 border border-[#E5E7EB] hover:bg-zinc-50 rounded-xl flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
            <span>Sort: {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>

        </div>

      </div>

      {/* Main Submissions Feed List */}
      <div className="space-y-4">
        
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#E5E7EB] bg-white rounded-2xl flex flex-col items-center justify-center space-y-3">
            <Inbox className="h-10 w-10 text-zinc-300" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-[#24324A]">No Submissions Found</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No active entries match your filter or search query. Try switching categories or checking back later!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4" id="moderation-feed-list">
            
            {/* Render submission entries */}
            {filteredAndSortedItems.map((item) => {
              const isNew = item.dateObj.getTime() > lastCheckTime;

              return (
                <div 
                  key={item.id}
                  className={`bg-white border p-5 sm:p-6 rounded-2xl transition-all shadow-2xs relative group flex flex-col justify-between md:flex-row gap-6 ${
                    isNew 
                      ? 'border-amber-400 bg-amber-50/5' 
                      : 'border-[#E5E7EB] hover:border-zinc-300'
                  }`}
                >
                  
                  {/* Item content body */}
                  <div className="space-y-3 flex-1">
                    
                    {/* Header line */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-black tracking-wider text-[#C9A227] bg-[#FAF8F2] px-2 py-0.5 rounded-md border border-[#E5E7EB]/50">
                        {getIconForType(item.type)}
                        <span>{item.typeLabel}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400">•</span>
                      <span className="text-[10px] font-mono text-zinc-500 font-semibold uppercase">{item.categoryLabel}</span>
                      {isNew && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-mono font-bold text-[8px] uppercase tracking-wider animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Content text */}
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black text-[#24324A] leading-snug group-hover:text-[#C9A227] transition-colors duration-200">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-600 leading-relaxed font-sans line-clamp-3 whitespace-pre-line text-left">
                        {item.content}
                      </p>
                    </div>

                    {/* Meta info block */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-100 pt-3 text-[10.5px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-1 shrink-0">
                        <User className="h-3 w-3 text-zinc-400" />
                        <span>Submitted by <strong className="text-[#24324A]">{item.author}</strong></span>
                      </span>
                      <span className="text-zinc-300 hidden xs:inline">•</span>
                      <span className="flex items-center gap-1 text-zinc-400 font-mono shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(item.dateObj)}</span>
                      </span>
                    </div>

                    {/* Rendering extra attributes / metadata badge elements */}
                    {item.meta}

                  </div>

                  {/* Operational moderation buttons */}
                  <div className="flex md:flex-col justify-end items-center md:items-end gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-dashed border-zinc-100">
                    
                    {/* Deep Link to the page */}
                    <button
                      onClick={item.onView}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#24324A] hover:text-[#C9A227] bg-[#FAF8F2] border border-[#E5E7EB] hover:bg-[#F4F1E8] rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                      title="Navigate directly to see item in context"
                    >
                      <span>View Content</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>

                    {/* Delete item if Admin Mode is on */}
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you absolutely sure you want to permanently erase this user submission from the live global database? This action is irreversible.")) {
                            item.onDelete();
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                        title="Moderate and delete this submission permanently"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete Item</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-xl opacity-60 cursor-not-allowed whitespace-nowrap font-mono"
                        title="Authorize in Admin Console to enable moderation deletion overrides"
                      >
                        <EyeOff className="h-3 w-3" />
                        <span>Locked</span>
                      </button>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}
