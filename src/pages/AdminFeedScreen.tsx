import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, 
  Pencil,
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
  RefreshCw,
  Instagram,
  Copy,
  X,
  Download,
  Laugh,
  Eye,
  Users,
  TrendingUp,
  Globe,
  FileText,
  Check
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Story, StoryComment, CourtCase, Question, RedFlagCase } from '../types';
import { 
  PRESEEDED_STORIES, 
  PRESEEDED_COURT_CASES, 
  PRESEEDED_QUESTIONS, 
  PRESEEDED_RED_FLAG_CASES 
} from '../data/mockData';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
  onEdit: (newTitle: string, newContent: string) => void;
  isUserSubmitted: boolean;
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
  onEditStory: (storyId: string, newTitle: string, newStoryText: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onEditCourtCase: (slug: string, newTitle: string, newDescription: string) => void;
  onEditArgument: (caseSlug: string, argId: string, newText: string) => void;
  onEditQuestion: (slug: string, newTitle: string, newDescription: string) => void;
  onEditAnswer: (qSlug: string, ansId: string, newText: string) => void;
  onEditAnswerComment: (qSlug: string, ansId: string, commentId: string, newText: string) => void;
  onEditRedFlagCase: (caseId: string, newTitle: string, newDescription: string) => void;
  onEditRedFlagComment: (caseId: string, commentId: string, newText: string) => void;
  onAddStory: (story: Story) => Promise<void>;
  onAddCourtCase: (cc: CourtCase) => Promise<void>;
  onAddQuestion: (q: Question) => Promise<void>;
  onAddRedFlagCase: (rf: RedFlagCase) => Promise<void>;
}

// Deterministic hash helper to select stable templates/ctas
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

const getCleanCaseId = (item: { id: string; typeLabel: string } | null) => {
  if (!item) return 'CASE #BR-102';
  const parts = item.id.split('-');
  const rawId = parts[parts.length - 1] || '102';
  const clean = rawId.length > 8 ? rawId.substring(0, 6).toUpperCase() : rawId.toUpperCase();
  
  const label = item.typeLabel.toLowerCase();
  if (label.includes('court') || label.includes('jury') || label.includes('trial')) {
    return `COURT CASE #${clean}`;
  } else if (label.includes('red flag')) {
    return `RED FLAG #${clean}`;
  } else if (label.includes('advice') || label.includes('board') || label.includes('question')) {
    return `ADVICE BOARD #${clean}`;
  } else {
    return `REGRET STORY #${clean}`;
  }
};

const getProminentCta = (typeLabel: string | undefined) => {
  if (!typeLabel) return 'GIVE YOUR OPINION';
  const label = typeLabel.toLowerCase();
  
  if (label.includes('court') || label.includes('jury') || label.includes('trial')) {
    const ctas = [
      '⚖️ GIVE YOUR JUDGMENT',
      '⚖️ PASS YOUR VERDICT',
      '⚖️ WHO IS WRONG? VOTE',
      '⚖️ CAST YOUR JURY VOTE',
      '⚖️ DECIDE WHO REGRETS',
      '⚖️ DROP YOUR VERDICT'
    ];
    return ctas[Math.abs(hashString(typeLabel)) % ctas.length];
  }
  
  if (label.includes('red flag') || label.includes('toxic') || label.includes('danger')) {
    const ctas = [
      '🚩 IS THIS A RED FLAG?',
      '🚩 RATE THE DANGER LEVEL',
      '🚩 RUN OR STAY? VOTE NOW',
      '🚩 IS IT LOW-KEY TOXIC?',
      '🚩 DEALBREAKER? VOTE NOW',
      '🚩 RED FLAG METER: RATE'
    ];
    return ctas[Math.abs(hashString(typeLabel)) % ctas.length];
  }
  
  if (label.includes('advice') || label.includes('board') || label.includes('question')) {
    const ctas = [
      '💬 GIVE YOUR OPINION',
      '💬 WHAT WOULD YOU DO?',
      '💬 DROP YOUR BEST ADVICE',
      '💬 HELP THEM DECIDE',
      '💬 WHAT\'S THE PLAY HERE?',
      '💬 LEAVE YOUR ADVICE'
    ];
    return ctas[Math.abs(hashString(typeLabel)) % ctas.length];
  }
  
  const generalCtas = [
    '🔗 AVOID THIS REGRET',
    '🔗 DON\'T MAKE THIS MISTAKE',
    '🔗 READ THE FULL TIMELINE',
    '🔗 WOULD YOU REGRET THIS?',
    '🔗 LEARN BEFORE REGRET'
  ];
  return generalCtas[Math.abs(hashString(typeLabel)) % generalCtas.length];
};

const getDynamicJurors = (item: { id: string } | null): string => {
  if (!item) return '3,482';
  const hash = Math.abs(hashString(item.id));
  const base = 1200 + (hash % 2800);
  return base.toLocaleString();
};

const getDynamicComments = (item: { id: string } | null): string => {
  if (!item) return '417';
  const hash = Math.abs(hashString(item.id));
  const base = 80 + (hash % 380);
  return base.toLocaleString();
};

const getGuiltyPctNumber = (item: { id: string } | null): number => {
  if (!item) return 28;
  const hash = Math.abs(hashString(item.id));
  return 15 + (hash % 60); // 15% to 75%
};

const getDynamicVerdict = (item: { id: string } | null): string => {
  if (!item) return '72% Not Guilty';
  const hash = Math.abs(hashString(item.id));
  const pct = 15 + (hash % 60);
  const isGuilty = hash % 2 === 0;
  if (isGuilty) {
    return `${pct}% Guilty`;
  } else {
    return `${100 - pct}% Not Guilty`;
  }
};

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
  onToggleAdmin,
  onEditStory,
  onEditComment,
  onEditCourtCase,
  onEditArgument,
  onEditQuestion,
  onEditAnswer,
  onEditAnswerComment,
  onEditRedFlagCase,
  onEditRedFlagComment,
  onAddStory,
  onAddCourtCase,
  onAddQuestion,
  onAddRedFlagCase
}: AdminFeedScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(() => {
    const saved = localStorage.getItem('before_regret_last_feed_check');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  // Real-time website visitor counter state
  const [visitorStats, setVisitorStats] = useState<{ totalViews: number; uniqueVisitors: number }>({
    totalViews: 0,
    uniqueVisitors: 0
  });

  // SEO pSEO Auto-Generator States
  const [seoType, setSeoType] = useState<'court_case' | 'question' | 'story' | 'red_flag_case'>('court_case');
  const [seoTopic, setSeoTopic] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isPublishingSeo, setIsPublishingSeo] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<any | null>(null);
  const [generatedSeoData, setGeneratedSeoData] = useState<any | null>(null);
  const [seoSuccessMessage, setSeoSuccessMessage] = useState<string | null>(null);

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    setSeoAnalysis(null);
    setGeneratedSeoData(null);
    setSeoSuccessMessage(null);
    try {
      const response = await fetch('/api/admin/generate-seo-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: seoType,
          topic: seoTopic
        })
      });
      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned a non-JSON response. Please check if the dev server is running/restarting.");
      }
      const data = await response.json();
      if (data.success) {
        setSeoAnalysis(data.seoAnalysis);
        setGeneratedSeoData(data.generatedData);
      } else {
        alert(data.error || 'Failed to perform SEO analysis and generation.');
      }
    } catch (err) {
      console.error('Error generating SEO submission:', err);
      alert('Network error while generating. Is the server running?');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handlePublishSeo = async () => {
    if (!generatedSeoData) return;
    setIsPublishingSeo(true);
    try {
      const slugify = (text: string) => {
        return text
          .toString()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
      };

      const randSuffix = Math.floor(Math.random() * 9000 + 1000).toString();
      const generatedSlug = `${slugify(generatedSeoData.title || 'seo-topic')}-${randSuffix}`;
      const caseNumber = `CASE-${seoType === 'story' ? 'S' : seoType === 'court_case' ? 'C' : seoType === 'question' ? 'Q' : 'F'}${Math.floor(Math.random() * 90000 + 10000)}`;

      if (seoType === 'court_case') {
        const newCase = {
          slug: generatedSlug,
          caseNumber: caseNumber,
          title: generatedSeoData.title,
          description: generatedSeoData.description,
          postTime: "Just now",
          author: generatedSeoData.author || "anonymous_juror",
          votes: generatedSeoData.votes || { me: 0, partner: 0, both: 0, neither: 0 },
          arguments: (generatedSeoData.arguments || []).map((arg: any, idx: number) => ({
            id: `arg_${idx + 1}`,
            author: arg.author || `Juror_${Math.floor(Math.random() * 1000)}`,
            side: arg.side || "Me",
            text: arg.text || "",
            role: arg.role || "Novice",
            votes: arg.votes || 0,
            dateAdded: new Date().toISOString()
          })),
          tags: generatedSeoData.tags || [],
          deliberationDays: 7,
          createdAt: new Date().toISOString(),
          passwordPin: "1234",
          partnerKey: `pk_${Math.random().toString(36).substring(2, 8)}`,
          wantsPartnerResponse: false,
          isRealInput: true
        };
        await onAddCourtCase(newCase);

      } else if (seoType === 'question') {
        const newQuestion = {
          slug: generatedSlug,
          title: generatedSeoData.title,
          description: generatedSeoData.description,
          category: generatedSeoData.category || "General",
          answers: (generatedSeoData.answers || []).map((ans: any, idx: number) => ({
            id: `ans_${idx + 1}`,
            author: ans.author || `Survivor_${Math.floor(Math.random() * 1000)}`,
            text: ans.text || "",
            votes: ans.votes || 0,
            isOutcomeVerified: ans.isOutcomeVerified || false,
            date: ans.date || "Just now",
            comments: (ans.comments || []).map((c: any, cidx: number) => ({
              id: `c_${idx + 1}_${cidx + 1}`,
              author: c.author || "Anonymous",
              text: c.text || "",
              date: c.date || "Just now"
            }))
          })),
          pollOptions: generatedSeoData.pollOptions || [],
          storiesCount: 0,
          tags: generatedSeoData.tags || [],
          dateAdded: new Date().toISOString(),
          isRealInput: true
        };
        await onAddQuestion(newQuestion);

      } else if (seoType === 'story') {
        const newStory = {
          id: generatedSlug,
          caseNumber: caseNumber,
          title: generatedSeoData.title,
          situationSlug: generatedSeoData.situationSlug || "ignored-red-flags",
          situationName: generatedSeoData.situationName || "Ignored Red Flags",
          age: generatedSeoData.age || 25,
          gender: generatedSeoData.gender || "Female",
          country: generatedSeoData.country || "United States",
          relationshipDuration: generatedSeoData.relationshipDuration || "2 years",
          decisionMade: generatedSeoData.decisionMade || "Other",
          currentOutcome: generatedSeoData.currentOutcome || "Complicated",
          regretScore: generatedSeoData.regretScore || 5,
          regretType: generatedSeoData.regretType || "Past",
          wouldDoAgain: generatedSeoData.wouldDoAgain || "Not Sure",
          fullStory: generatedSeoData.fullStory,
          timeline: generatedSeoData.timeline || [],
          userName: generatedSeoData.userName || "anonymous_author",
          helpfulVotes: generatedSeoData.helpfulVotes || 0,
          dateAdded: new Date().toISOString(),
          updates: (generatedSeoData.updates || []).map((upd: any, idx: number) => ({
            id: `upd_${idx + 1}`,
            daysAfter: upd.daysAfter || 30,
            dateAdded: new Date().toISOString(),
            text: upd.text || ""
          })),
          tags: generatedSeoData.tags || [],
          isRealInput: true
        };
        await onAddStory(newStory);

      } else if (seoType === 'red_flag_case') {
        const newRedFlag = {
          id: generatedSlug,
          caseNumber: caseNumber,
          title: generatedSeoData.title,
          description: generatedSeoData.description,
          category: generatedSeoData.category || "Other",
          votes: generatedSeoData.votes || { green: 0, yellow: 0, red: 0 },
          comments: (generatedSeoData.comments || []).map((c: any, idx: number) => ({
            id: `rf_c_${idx + 1}`,
            author: c.author || "Anonymous",
            text: c.text || "",
            date: c.date || "Just now"
          })),
          author: generatedSeoData.author || "anonymous_reporter",
          dateAdded: new Date().toISOString(),
          isRealInput: true
        };
        await onAddRedFlagCase(newRedFlag);
      }

      setSeoSuccessMessage(`Successfully published new dynamic pSEO ${seoType.replace('_', ' ')}! It is now live in the activity feed and searchable by crawlers.`);
      setSeoAnalysis(null);
      setGeneratedSeoData(null);
      setSeoTopic('');
    } catch (err) {
      console.error('Error publishing SEO submission:', err);
      alert('Error publishing to database.');
    } finally {
      setIsPublishingSeo(false);
    }
  };

  const handleDiscardSeo = () => {
    setSeoAnalysis(null);
    setGeneratedSeoData(null);
    setSeoSuccessMessage(null);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const docRef = doc(db, "stats", "visits");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setVisitorStats({
          totalViews: data.totalViews || 0,
          uniqueVisitors: data.uniqueVisitors || 0
        });
      }
    }, (error) => {
      console.error("Error subscribing to visitor stats in AdminFeedScreen:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Instagram Post Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<{
    hook: string;
    communitySpotlight?: string;
    caption: string;
    visualSuggestion: string;
    hashtags: string[];
  } | null>(null);
  const [generatedMeme, setGeneratedMeme] = useState<{
    memeType: 'translation' | 'starterpack' | 'math';
    title: string;
    items: any[];
    caption: string;
    hashtags: string[];
  } | null>(null);
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  const [previewTheme, setPreviewTheme] = useState<'cream' | 'midnight' | 'notes' | 'social' | 'meme'>('cream');
  const [isDownloading, setIsDownloading] = useState(false);

  // Compile associated comments, arguments, or votes to drive engaging, authentic social posts
  const getCommunityOpinionsForFeedItem = (item: FeedItem): string => {
    if (!item) return '';
    
    // Find the base slug or ID
    const baseSlug = item.slug;
    const baseId = item.id.replace(/^(story|comment|courtcase|courtarg|question|answer|comment|redflagcase|redflagcomment)-/, '');
    
    let opinions: string[] = [];
    
    // 1. If it's a court case or jury argument
    if (item.type === 'court_case' || item.type === 'jury_argument') {
      const cc = courtCases.find(c => c.slug === baseSlug);
      if (cc) {
        if (cc.votes) {
          opinions.push(`Community jury vote split - Me: ${cc.votes.me} votes, Partner: ${cc.votes.partner} votes, Both: ${cc.votes.both} votes.`);
        }
        if (cc.arguments && cc.arguments.length > 0) {
          cc.arguments.slice(0, 3).forEach(arg => {
            opinions.push(`Juror ${arg.author} (${arg.side} side) suggested: "${arg.text}"`);
          });
        }
      }
    }
    
    // 2. If it's a story or story comment
    else if (item.type === 'story' || item.type === 'comment') {
      const sComments = comments.filter(c => c.storyId === baseSlug);
      if (sComments.length > 0) {
        sComments.slice(0, 3).forEach(c => {
          opinions.push(`User ${c.authorName || 'Anonymous'} commented: "${c.text}"`);
        });
      }
    }
    
    // 3. If it's an advice question, answer, or answer comment
    else if (item.type === 'question' || item.type === 'advice_answer' || item.type === 'advice_comment') {
      const q = questions.find(question => question.slug === baseSlug);
      if (q && q.answers) {
        q.answers.slice(0, 3).forEach(ans => {
          opinions.push(`Advisor ${ans.author} suggested: "${ans.text}"`);
        });
      }
    }
    
    // 4. If it's a red flag case or red flag comment
    else if (item.type === 'red_flag_case' || item.type === 'red_flag_comment') {
      const rfc = redFlagCases.find(rc => rc.id === baseSlug || rc.id === baseId);
      if (rfc && rfc.comments) {
        rfc.comments.slice(0, 3).forEach(c => {
          opinions.push(`User ${c.author || 'Anonymous'} commented: "${c.text}"`);
        });
      }
    }
    
    return opinions.join('\n');
  };

  const handleGenerateMemePost = async (item: FeedItem) => {
    setIsGenerating(true);
    setGeneratedMeme(null);
    setGeneratedPost(null);
    setActiveItem(item);
    setCopyStatus({});
    
    try {
      const response = await fetch('/api/admin/generate-meme-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          content: item.content,
          type: item.typeLabel,
          author: item.author,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned a non-JSON response. Please check if the dev server is running/restarting.");
      }
      const data = await response.json();
      if (data.success && data.post) {
        setGeneratedMeme(data.post);
        setEditedCaption(data.post.caption);
        setPreviewTheme('meme');
      } else {
        alert(data.error || 'Failed to generate relationship meme. Please check server logs.');
        setActiveItem(null);
      }
    } catch (err) {
      console.error('Error generating relationship meme:', err);
      alert('Network error while generating relationship meme. Is the dev server running?');
      setActiveItem(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateInstagramPost = async (item: FeedItem) => {
    setIsGenerating(true);
    setGeneratedPost(null);
    setActiveItem(item);
    setCopyStatus({});
    
    try {
      const opinionsText = getCommunityOpinionsForFeedItem(item);
      const response = await fetch('/api/admin/generate-instagram-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          content: item.content,
          type: item.typeLabel,
          author: item.author,
          communityOpinions: opinionsText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned a non-JSON response. Please check if the dev server is running/restarting.");
      }
      const data = await response.json();
      if (data.success && data.post) {
        setGeneratedPost(data.post);
        setEditedCaption(data.post.caption);
      } else {
        alert(data.error || 'Failed to generate Instagram post. Please check server logs.');
        setActiveItem(null);
      }
    } catch (err) {
      console.error('Error generating Instagram post:', err);
      alert('Network error while generating Instagram post. Is the dev server running?');
      setActiveItem(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleDownloadImage = async () => {
    const node = document.getElementById('instagram-story-canvas');
    if (!node) {
      alert('Could not find image preview element.');
      return;
    }
    
    setIsDownloading(true);
    try {
      // Small timeout to ensure fonts and dynamic render bindings are finished
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const width = 400;
      const height = 500;
      
      const dataUrl = await toPng(node, {
        quality: 0.98,
        pixelRatio: 3.0, // Highly crisp and dense export
        width: width,
        height: height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
          margin: '0',
          padding: '24px',
        },
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `before_regret_${previewTheme}_post_${activeItem?.id || 'post'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
      alert('Failed to generate image download. Try taking a screenshot or use another browser.');
    } finally {
      setIsDownloading(false);
    }
  };

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
      const isPreseeded = PRESEEDED_STORIES.some(ps => ps.id === s.id);
      const isUserSubmitted = !!s.isRealInput || (!isPreseeded && (s.id.startsWith('story_') || s.id.startsWith('usr_')));
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
        isUserSubmitted,
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
        onDelete: () => onDeleteStory(s.id),
        onEdit: (newTitle: string, newContent: string) => onEditStory(s.id, newTitle, newContent)
      });
    });

    // 2. Comments on Stories
    comments.forEach(c => {
      const story = stories.find(s => s.id === c.storyId);
      const storyTitle = story ? story.title : 'Registry Case Story';
      const isUserSubmitted = !!c.isRealInput || c.id.startsWith('comment_');
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
        isUserSubmitted,
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
        onDelete: () => onDeleteComment(c.id),
        onEdit: (newTitle: string, newContent: string) => onEditComment(c.id, newContent)
      });
    });

    // 3. Court Cases
    courtCases.forEach(cc => {
      const isPreseeded = PRESEEDED_COURT_CASES.some(pcc => pcc.slug === cc.slug);
      const isUserSubmitted = !!cc.isRealInput || !isPreseeded;
      items.push({
        id: `courtcase-${cc.slug}`,
        type: 'court_case',
        typeLabel: 'Court Trial',
        categoryLabel: 'BR Relationship Court Case',
        title: cc.title,
        content: cc.description,
        author: cc.author || 'Court Submitter',
        dateStr: cc.createdAt || cc.postTime,
        dateObj: new Date(cc.createdAt || cc.postTime || Date.now()),
        slug: cc.slug,
        isUserSubmitted,
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
        onView: () => setScreen({ type: 'court', slug: cc.slug }),
        onDelete: () => onDeleteCourtCase(cc.slug),
        onEdit: (newTitle: string, newContent: string) => onEditCourtCase(cc.slug, newTitle, newContent)
      });
    });

    // 4. Questions
    questions.forEach(q => {
      const isPreseeded = PRESEEDED_QUESTIONS.some(pq => pq.slug === q.slug);
      const isUserSubmitted = !!q.isRealInput || !isPreseeded;
      const qDateStr = q.dateAdded || '2026-06-20T12:00:00Z';
      items.push({
        id: `question-${q.slug}`,
        type: 'question',
        typeLabel: 'Advice Question',
        categoryLabel: 'Advice Boards',
        title: q.title,
        content: q.description,
        author: 'Advice Board Seeker',
        dateStr: qDateStr,
        dateObj: new Date(qDateStr),
        slug: q.slug,
        isUserSubmitted,
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
        onDelete: () => onDeleteQuestion(q.slug),
        onEdit: (newTitle: string, newContent: string) => onEditQuestion(q.slug, newTitle, newContent)
      });

      // Advice answers
      if (q.answers && Array.isArray(q.answers)) {
        q.answers.forEach(ans => {
          const isUserSubmitted = !!ans.isRealInput || ans.id.startsWith('ans_');
          items.push({
            id: `answer-${ans.id}`,
            type: 'advice_answer',
            typeLabel: 'Board Advice',
            categoryLabel: 'Advice Boards Answers',
            title: `Advice Answer on: "${q.title}"`,
            content: ans.text,
            author: ans.author || 'Anonymous Advisor',
            dateStr: ans.date || qDateStr,
            dateObj: new Date(ans.date || qDateStr),
            slug: q.slug,
            isUserSubmitted,
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
                {isUserSubmitted && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                    User Submission
                  </span>
                )}
              </div>
            ),
            onView: () => setScreen({ type: 'question', slug: q.slug }),
            onDelete: () => onDeleteAnswer(q.slug, ans.id),
            onEdit: (newTitle: string, newContent: string) => onEditAnswer(q.slug, ans.id, newContent)
          });

          // Answer comments
          if (ans.comments && Array.isArray(ans.comments)) {
            ans.comments.forEach(ac => {
              const isUserSubmitted = !!ac.isRealInput || ac.id.startsWith('cmt_');
              items.push({
                id: `anscomment-${ac.id}`,
                type: 'advice_comment',
                typeLabel: 'Board Answer Reply',
                categoryLabel: 'Advice Boards Comments',
                title: `Comment on advice by @${ans.author} on: "${q.title}"`,
                content: ac.text,
                author: ac.author || 'Discussion Contributor',
                dateStr: ac.date || ans.date || qDateStr,
                dateObj: new Date(ac.date || ans.date || qDateStr),
                slug: q.slug,
                isUserSubmitted,
                meta: (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2 font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
                      Answer ID: {ans.id}
                    </span>
                    {isUserSubmitted && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                        User Submission
                      </span>
                    )}
                  </div>
                ),
                onView: () => setScreen({ type: 'question', slug: q.slug }),
                onDelete: () => onDeleteAnswerComment(q.slug, ans.id, ac.id),
                onEdit: (newTitle: string, newContent: string) => onEditAnswerComment(q.slug, ans.id, ac.id, newContent)
              });
            });
          }
        });
      }
    });

    // 5. Red Flag Cases
    redFlagCases.forEach(rf => {
      const isPreseeded = PRESEEDED_RED_FLAG_CASES.some(prf => prf.id === rf.id);
      const isUserSubmitted = !!rf.isRealInput || (!isPreseeded && (rf.id.startsWith('rf_') || rf.id.startsWith('flag_')));
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
        isUserSubmitted,
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
        onDelete: () => onDeleteRedFlagCase(rf.id),
        onEdit: (newTitle: string, newContent: string) => onEditRedFlagCase(rf.id, newTitle, newContent)
      });

      // Red flag comments
      if (rf.comments && Array.isArray(rf.comments)) {
        rf.comments.forEach(com => {
          const isUserSubmitted = !!com.isRealInput || com.id.startsWith('flag_cmt_');
          items.push({
            id: `redflagcomment-${com.id}`,
            type: 'red_flag_comment',
            typeLabel: 'Red Flag Reply',
            categoryLabel: 'Red Flag Meter Replies',
            title: `Comment on Red Flag case: "${rf.title}"`,
            content: com.text,
            author: com.author || 'Flag Analyst',
            dateStr: com.date || rf.dateAdded || '2026-06-20T12:00:00Z',
            dateObj: new Date(com.date || rf.dateAdded || '2026-06-20T12:00:00Z'),
            slug: rf.id,
            isUserSubmitted,
            meta: (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-2 font-mono">
                <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-zinc-600 border border-[#E5E7EB]">
                  Flag Case: {rf.id}
                </span>
                {isUserSubmitted && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black uppercase text-[8px] tracking-wide">
                    User Submission
                  </span>
                )}
              </div>
            ),
            onView: () => setScreen({ type: 'red_flag_meter', slug: rf.id }),
            onDelete: () => onDeleteRedFlagComment(rf.id, com.id),
            onEdit: (newTitle: string, newContent: string) => onEditRedFlagComment(rf.id, com.id, newContent)
          });
        });
      }
    });

    return items;
  }, [stories, comments, courtCases, questions, redFlagCases, setScreen, onDeleteStory, onDeleteComment, onDeleteCourtCase, onDeleteArgument, onDeleteQuestion, onDeleteAnswer, onDeleteAnswerComment, onDeleteRedFlagCase, onDeleteRedFlagComment, onEditStory, onEditComment, onEditCourtCase, onEditArgument, onEditQuestion, onEditAnswer, onEditAnswerComment, onEditRedFlagCase, onEditRedFlagComment]);

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

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 animate-fadeIn" id="admin-auth-gate">
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-xs text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#24324A] tracking-tight">Admin Portal Locked</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              This dashboard contains sensitive platform monitoring, live feeds, and content generator tools. Please enter the master override password to proceed.
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter master password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(false);
                }}
                className={`w-full bg-[#FAF8F2] border ${
                  authError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-[#E5E7EB] focus:ring-amber-500/20'
                } rounded-xl px-4 py-3 text-sm text-center font-semibold focus:outline-none focus:ring-2`}
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-rose-600 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                Incorrect Password. Please try again.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#24324A] hover:bg-[#1a2536] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:shadow-sm"
            >
              <span>Unlock Dashboard</span>
            </button>
          </form>

          <div className="pt-2">
            <button
              onClick={() => setScreen({ type: 'home' })}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer underline"
            >
              Return to Public Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          <button
            onClick={() => onToggleAdmin(false)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200/60 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Lock admin session"
          >
            <Lock className="h-3 w-3" />
            <span>Lock Session</span>
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Metric Card 1: Total */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">Total Active Items</span>
            <span className="p-1 rounded-md bg-zinc-100 text-zinc-600">
              <Inbox className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#24324A] font-mono tracking-tight">{stats.total}</div>
            <p className="text-[9px] text-zinc-400 mt-0.5">Records in memory</p>
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
            <p className="text-[9px] text-zinc-400 mt-0.5">Trials + jury statements</p>
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
            <p className="text-[9px] text-zinc-400 mt-0.5">Queries, tips, & replies</p>
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

        {/* Metric Card 6: Website Visits */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-zinc-500 font-mono tracking-wider">Real Visitors</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-950 font-mono">
              {(visitorStats.uniqueVisitors || 0).toLocaleString()}
            </div>
            <p className="text-[9px] text-zinc-400 mt-0.5" title="Filters out automated bot user agents">
              {(visitorStats.totalViews || 0).toLocaleString()} views • bot-filtered
            </p>
          </div>
        </div>

      </div>

      {/* pSEO Traffic Powerhouse Console */}
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white border border-[#334155] p-6 rounded-3xl shadow-xl space-y-6" id="seo-pseo-generator-console">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#E2E8F0]/10 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">Organic Traffic SEO Powerhouse</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">ahrefs™-Style Topic Finder & Auto-Generator</h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Find low-competition, high-volume search queries from viral relationship forums, run keyword difficulty analysis, and instantly create deeply realistic, highly engaging human submissions.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 font-mono">Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono uppercase tracking-wider border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SEO Engine Active
            </span>
          </div>
        </div>

        {seoSuccessMessage && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs p-4 rounded-xl flex items-start gap-2.5 animate-fadeIn">
            <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Submission Published!</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">{seoSuccessMessage}</p>
            </div>
            <button onClick={() => setSeoSuccessMessage(null)} className="text-zinc-400 hover:text-white text-xs font-bold font-mono">Dismiss</button>
          </div>
        )}

        {/* Generator Setup Form */}
        {!seoAnalysis && !generatedSeoData && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#0F172A]/50 p-4 rounded-2xl border border-[#334155]/50">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">Submission Type</label>
              <select
                value={seoType}
                onChange={(e) => setSeoType(e.target.value as any)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="court_case">Relationship Court Case (Multi-Argument)</option>
                <option value="question">Advice Board Question (Polls & Survivor Advice)</option>
                <option value="story">Deep Regret Story (Chronological Retrospective)</option>
                <option value="red_flag_case">Red Flag Case (Warning Alert & Comments)</option>
              </select>
            </div>

            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">Target Topic or Niche Keyword (Optional)</label>
              <input
                type="text"
                placeholder="e.g. spouse discount, chores split, hiding locations, emotional cheating... (or empty for auto)"
                value={seoTopic}
                onChange={(e) => setSeoTopic(e.target.value)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-zinc-500"
              />
            </div>

            <div className="md:col-span-3">
              <button
                onClick={handleGenerateSeo}
                disabled={isGeneratingSeo}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingSeo ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Analyzing Keywords...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run Keyword SEO Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dual Panel SEO Report & Content Preview */}
        {(seoAnalysis && generatedSeoData) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* Left Panel: ahrefs-style Keyword Research intelligence */}
            <div className="lg:col-span-4 bg-[#0F172A]/80 border border-[#334155] p-5 rounded-2xl space-y-5">
              <div className="flex items-center gap-1.5 border-b border-[#334155]/50 pb-3">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 font-mono">SEO Intelligence Report</span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Primary Target Keyword</span>
                  <div className="text-sm font-black text-white mt-0.5 select-all hover:bg-[#1E293B] px-1 rounded transition-colors font-mono">{seoAnalysis.targetKeyword || 'N/A'}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1E293B]/40 p-2.5 rounded-xl border border-[#334155]/30">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Search Volume</span>
                    <span className="text-xs font-mono font-black text-emerald-400">{seoAnalysis.searchVolume || 'Unknown'}</span>
                  </div>
                  <div className="bg-[#1E293B]/40 p-2.5 rounded-xl border border-[#334155]/30">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Keyword Difficulty</span>
                    <span className="text-xs font-mono font-black text-amber-400">{seoAnalysis.keywordDifficulty || 'Low Competition'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Search Intent Category</span>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold font-mono border border-blue-500/25">
                    {seoAnalysis.searchIntent || 'Decisional / Informational'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Viral Trend Source & Context</span>
                  <p className="text-xs text-zinc-300 leading-relaxed mt-1">{seoAnalysis.trendingRedditTopic || 'Derived from recent spikes in r/relationships discussions.'}</p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Google LSI Search Phrases to Capture</span>
                  <ul className="mt-1.5 space-y-1.5">
                    {(seoAnalysis.googleSearchPhrases || []).map((phrase: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                        <span className="select-all bg-[#1E293B]/20 hover:bg-[#1E293B]/60 px-1 rounded font-mono text-[11px]">{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Panel: Content preview, edit and publish */}
            <div className="lg:col-span-8 bg-[#1E293B]/60 border border-[#334155] p-5 rounded-2xl flex flex-col justify-between space-y-5">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#334155]/50 pb-3">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 font-mono">Generated Live Content (Human-Centric)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">Ready to Publish</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Generated Title</span>
                    <h3 className="text-md font-bold text-white mt-1 select-all">{generatedSeoData.title}</h3>
                  </div>

                  {generatedSeoData.author && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-500 font-mono">Written by:</span>
                      <span className="text-zinc-300">{generatedSeoData.author || generatedSeoData.userName}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Allegations / Backstory Narrative</span>
                    <p className="text-xs text-zinc-300 leading-relaxed mt-1 bg-[#0F172A]/40 p-3 rounded-xl border border-[#334155]/20 select-all whitespace-pre-wrap">
                      {generatedSeoData.description || generatedSeoData.fullStory}
                    </p>
                  </div>

                  {/* Sub-elements depending on Type */}
                  {seoType === 'court_case' && generatedSeoData.arguments && (
                    <div className="space-y-2 border-t border-[#334155]/30 pt-3">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Complete End-to-End Juror Arguments ({generatedSeoData.arguments.length})</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {generatedSeoData.arguments.map((arg: any, idx: number) => (
                          <div key={idx} className="bg-[#0F172A]/35 p-2 rounded-xl border border-[#334155]/15 text-[11px]">
                            <div className="flex items-center justify-between text-[9px] font-mono mb-1">
                              <span className="text-zinc-400">{arg.author} ({arg.role})</span>
                              <span className={`font-bold px-1 rounded ${
                                arg.side === 'Me' ? 'bg-emerald-500/10 text-emerald-400' :
                                arg.side === 'Partner' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>Side: {arg.side}</span>
                            </div>
                            <p className="text-zinc-300 leading-normal font-sans italic">"{arg.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoType === 'question' && generatedSeoData.pollOptions && (
                    <div className="space-y-2 border-t border-[#334155]/30 pt-3">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Q&A Poll Seeding Options</span>
                      <div className="flex flex-wrap gap-2">
                        {generatedSeoData.pollOptions.map((opt: any, idx: number) => (
                          <span key={idx} className="text-xs px-2.5 py-1 bg-[#1E293B] border border-[#334155] rounded-lg text-zinc-300 font-semibold">
                            {opt.text} <span className="text-zinc-500">({opt.votes} votes)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoType === 'story' && generatedSeoData.timeline && (
                    <div className="space-y-2 border-t border-[#334155]/30 pt-3">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono block">Timeline Trajectory Nodes ({generatedSeoData.timeline.length})</span>
                      <div className="space-y-1.5">
                        {generatedSeoData.timeline.map((node: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-zinc-300 bg-[#0F172A]/30 p-2 rounded-lg border border-[#334155]/10">
                            <strong className="text-emerald-400 font-mono mr-1">{node.year} [{node.stage}]:</strong> {node.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {(generatedSeoData.tags || []).map((tag: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-[#334155]/30 pt-4 mt-2">
                <button
                  onClick={handlePublishSeo}
                  disabled={isPublishingSeo}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPublishingSeo ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Syncing with Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Publish & Seep Into index.html</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDiscardSeo}
                  disabled={isPublishingSeo}
                  className="px-4 py-2.5 bg-[#334155] hover:bg-rose-900/40 hover:text-rose-200 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-[#475569]/30"
                >
                  Discard Content
                </button>
              </div>
            </div>
          </div>
        )}
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
            <span>BR Relationship Court</span>
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
                      {item.isUserSubmitted && (
                        <span className="inline-flex items-center" title="Real Device Submission">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                          </span>
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
                      <span className="text-zinc-300 hidden sm:inline">•</span>
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
                    
                    {/* Generate Instagram Post Button */}
                    <button
                      onClick={() => handleGenerateInstagramPost(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-600 border border-pink-100 hover:border-pink-600 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                      title="Generate a viral US-targeted Instagram post from this submission"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      <span>Generate IG Post</span>
                    </button>

                    {/* Generate Relationship Card Button */}
                    <button
                      onClick={() => handleGenerateMemePost(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-100 hover:border-amber-600 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                      title="Generate a high-engagement relationship guide card from this submission"
                    >
                      <Laugh className="h-3.5 w-3.5" />
                      <span>Generate Relationship Card</span>
                    </button>

                    {/* Deep Link to the page */}
                    <button
                      onClick={item.onView}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#24324A] hover:text-[#C9A227] bg-[#FAF8F2] border border-[#E5E7EB] hover:bg-[#F4F1E8] rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                      title="Navigate directly to see item in context"
                    >
                      <span>View Content</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>

                    {/* Edit item if Admin Mode is on */}
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditTitle(item.title);
                          setEditContent(item.content);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-[#E5E7EB] hover:border-indigo-600 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                        title="Edit and correct this submission content"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit Content</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-xl opacity-60 cursor-not-allowed whitespace-nowrap font-mono"
                        title="Authorize in Admin Console to enable content editing overrides"
                      >
                        <EyeOff className="h-3 w-3" />
                        <span>Edit Locked</span>
                      </button>
                    )}

                    {/* Delete item if Admin Mode is on */}
                    {isAdmin ? (
                      confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1.5 animate-fadeIn">
                          <button
                            onClick={() => {
                              item.onDelete();
                              setConfirmDeleteId(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-600 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                            title="Confirm permanent deletion"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Confirm Delete!</span>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-xl transition-all cursor-pointer whitespace-nowrap font-mono"
                          title="Moderate and delete this submission permanently"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete Item</span>
                        </button>
                      )
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

      {/* Dynamic Content Edit Modal Overlay */}
      {editingItem && (
        <div id="admin-edit-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div id="admin-edit-modal-container" className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-zinc-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div id="admin-edit-modal-header" className="bg-[#24324A] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-[#C9A227]" />
                <div className="text-left">
                  <h3 className="font-sans font-bold text-lg tracking-tight">Edit Console Override</h3>
                  <p className="text-[10px] text-zinc-300 font-mono tracking-wider uppercase">MODERATING {editingItem.typeLabel}</p>
                </div>
              </div>
              <button 
                id="admin-edit-modal-close"
                onClick={() => setEditingItem(null)} 
                className="text-zinc-400 hover:text-white bg-zinc-800/40 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Content Form */}
            <div id="admin-edit-modal-form" className="p-6 overflow-y-auto space-y-5 text-left">
              <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="font-bold">Caution:</strong> You are directly overwriting database fields. Corrections will be immediately committed to Firestore and reflect globally for all visitors in real-time.
                </div>
              </div>

              {/* Conditionally Render Title Input */}
              {['story', 'court_case', 'question', 'red_flag_case'].includes(editingItem.type) && (
                <div className="space-y-1.5">
                  <label id="admin-edit-title-label" className="block text-xs font-bold text-zinc-700 tracking-wide uppercase font-mono">
                    Submission Title
                  </label>
                  <input
                    id="admin-edit-title-input"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm transition-all focus:outline-hidden text-zinc-900"
                    placeholder="Enter submission title..."
                  />
                </div>
              )}

              {/* Content Textarea */}
              <div className="space-y-1.5">
                <label id="admin-edit-content-label" className="block text-xs font-bold text-zinc-700 tracking-wide uppercase font-mono">
                  Content Body
                </label>
                <textarea
                  id="admin-edit-content-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm transition-all focus:outline-hidden resize-y font-sans leading-relaxed text-zinc-900"
                  placeholder="Enter content text..."
                />
              </div>

              {/* Metadata Read-only Summary */}
              <div className="bg-zinc-50 rounded-2xl p-4 text-[11px] text-zinc-500 font-mono space-y-1">
                <div><span className="text-zinc-400">ID:</span> {editingItem.id}</div>
                <div><span className="text-zinc-400">Author:</span> {editingItem.author}</div>
                <div><span className="text-zinc-400">Original Date:</span> {editingItem.dateStr}</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div id="admin-edit-modal-footer" className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-100 shrink-0">
              <button
                id="admin-edit-modal-cancel"
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all cursor-pointer font-mono"
              >
                CANCEL
              </button>
              <button
                id="admin-edit-modal-save"
                type="button"
                onClick={() => {
                  try {
                    editingItem.onEdit(editTitle, editContent);
                    setEditingItem(null);
                  } catch (err) {
                    console.error("Failed to commit edit:", err);
                    alert("Error updating content. Please check console logs.");
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 rounded-xl shadow-xs transition-all cursor-pointer font-mono"
              >
                SAVE OVERWRITE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Instagram Generator Modal Overlay */}
      {(isGenerating || generatedPost || generatedMeme) && activeItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-zinc-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#24324A] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Instagram className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-wider">{generatedMeme ? "Relationship Card Generator" : "Instagram Post Generator"}</h2>
                  <p className="text-[10px] text-zinc-300 font-medium">{generatedMeme ? "Relatable Relationship Layouts • Beautiful Story Cards" : "Tailored for audience • Designed to go viral"}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setGeneratedPost(null);
                  setGeneratedMeme(null);
                  setActiveItem(null);
                  setIsGenerating(false);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-zinc-100 border-t-amber-500 animate-spin"></div>
                    <Instagram className="h-5 w-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-[#24324A]">Crafting Relatable Viral Content...</h3>
                    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                      Analyzing submission behavior patterns, matching with clear relatable layouts, and generating high-engagement captions with Gemini.
                    </p>
                  </div>
                </div>
              ) : (generatedPost || generatedMeme) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left: Aesthetic Image Mockup Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">4:5 Instagram Post Preview</span>
                      
                      {/* Theme selection toggle */}
                      <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                        {generatedPost && (
                          <>
                            <button
                              onClick={() => setPreviewTheme('cream')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                previewTheme === 'cream' 
                                  ? 'bg-white text-[#24324A] shadow-xs' 
                                  : 'text-zinc-500 hover:text-[#24324A]'
                              }`}
                            >
                              Cream
                            </button>
                            <button
                              onClick={() => setPreviewTheme('midnight')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                previewTheme === 'midnight' 
                                  ? 'bg-[#24324A] text-white shadow-xs' 
                                  : 'text-zinc-500 hover:text-[#24324A]'
                              }`}
                            >
                              Midnight
                            </button>
                            <button
                              onClick={() => setPreviewTheme('notes')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                previewTheme === 'notes' 
                                  ? 'bg-amber-100 text-amber-800 shadow-xs' 
                                  : 'text-zinc-500 hover:text-[#24324A]'
                              }`}
                            >
                              iOS Notes
                            </button>
                            <button
                              onClick={() => setPreviewTheme('social')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                previewTheme === 'social' 
                                  ? 'bg-[#24324A] text-white shadow-xs' 
                                  : 'text-zinc-500 hover:text-[#24324A]'
                              }`}
                            >
                              Community
                            </button>
                          </>
                        )}
                        {generatedMeme && (
                          <button
                            onClick={() => setPreviewTheme('meme')}
                            className="px-3 py-1 bg-[#F59E0B] text-white rounded-lg text-[10px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>⚖️</span> Relationship Card Theme
                          </button>
                        )}
                      </div>
                    </div>

                    {/* The actual 4:5 image canvas mockup locked to exact 400x500 post size */}
                    <div 
                      id="instagram-story-canvas"
                      className={`w-full max-w-[400px] aspect-[4/5] rounded-3xl p-6 flex flex-col justify-between shadow-xl relative transition-all duration-300 mx-auto overflow-hidden text-left shrink-0 ${
                        previewTheme === 'cream' 
                          ? 'bg-[#F9F6EE] text-[#1D1B18] border border-[#E9E4D5] font-serif' 
                          : previewTheme === 'midnight'
                          ? 'bg-[#0E121A] text-[#F3F4F6] border border-[#1E293B] font-sans'
                          : previewTheme === 'notes'
                          ? 'bg-white text-zinc-800 border border-zinc-200 font-sans'
                          : previewTheme === 'meme'
                          ? 'bg-[#0D0E12] text-white border border-[#1E293B] font-sans'
                          : 'bg-[#101827] text-white border border-[#1F2937] font-sans'
                      }`}
                      style={previewTheme === 'notes' ? {
                        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, rgba(0,0,0,0) 1px)',
                        backgroundSize: '16px 16px'
                      } : undefined}
                    >
                      {/* Ambient light glow effect for Midnight theme */}
                      {previewTheme === 'midnight' && (
                        <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none" />
                      )}

                      {/* Cool grid bg effect for Meme theme */}
                      {previewTheme === 'meme' && (
                        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-25 pointer-events-none" />
                      )}

                      {/* Header bar of 4:5 card */}
                      <div className="flex items-center justify-between opacity-85 z-10 shrink-0">
                        {previewTheme === 'cream' ? (
                          <>
                            <span className="text-[9px] tracking-widest font-black uppercase font-mono flex items-center gap-1">⚖️ BEFORE REGRET</span>
                            <span className="text-[9px] font-mono opacity-60">CONFESSIONAL</span>
                          </>
                        ) : previewTheme === 'midnight' ? (
                          <>
                            <span className="text-[9px] tracking-widest font-bold uppercase text-violet-400 font-mono flex items-center gap-1">⚖️ BeforeRegret</span>
                            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[8px] text-violet-300 font-mono">Trending #1</span>
                          </>
                        ) : previewTheme === 'notes' ? (
                          <>
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 font-sans">
                              <span>⚖️</span> BeforeRegret Notes
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">Done</span>
                          </>
                        ) : previewTheme === 'meme' ? (
                          <>
                            <span className="text-[10px] font-extrabold text-[#F59E0B] flex items-center gap-1.5 font-sans tracking-wide">
                              ⚖️ BeforeRegret Discussion
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[8px] text-amber-500 font-mono font-bold uppercase">Relationship Court</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-extrabold text-[#C9A227] flex items-center gap-1.5 font-sans tracking-wide">
                              ⚖️ BeforeRegret Community Discussion
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/30 text-[8px] text-[#C9A227] font-mono font-bold uppercase tracking-wider">Trending</span>
                          </>
                        )}
                      </div>

                      {/* Hook Content Centered */}
                      <div className="flex-1 flex flex-col justify-center py-6 z-10 relative">
                        {generatedMeme ? (
                          <div className="space-y-4 text-left">
                            {/* Header/Headline */}
                            <div className="space-y-1 text-center">
                              <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                                {generatedMeme.title}
                              </h3>
                            </div>

                            {/* Meme Content depending on type */}
                            {generatedMeme.memeType === 'translation' ? (
                              <div className="space-y-2.5">
                                {generatedMeme.items.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-[#161B26] border border-[#24324A] rounded-2xl p-4 space-y-2 shadow-xs">
                                    <div className="flex items-start gap-2">
                                      <span className="text-[9px] bg-zinc-700 text-zinc-300 font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5">THEM</span>
                                      <p className="text-xs text-zinc-300 font-semibold italic">"{item.phrase}"</p>
                                    </div>
                                    <div className="border-t border-[#24324A]/40 my-1" />
                                    <div className="flex items-start gap-2">
                                      <span className="text-[9px] bg-amber-500/20 text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5">REALITY</span>
                                      <p className="text-xs text-[#F59E0B] font-extrabold">{item.reality}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : generatedMeme.memeType === 'starterpack' ? (
                              <div className="grid grid-cols-2 gap-2.5">
                                {generatedMeme.items.map((item: string, idx: number) => {
                                  const icons = ["🤡", "😭", "💔", "💬"];
                                  return (
                                    <div key={idx} className="bg-[#161B26] border border-[#24324A] rounded-2xl p-3 flex flex-col justify-between gap-2 min-h-[95px] shadow-xs hover:border-[#F59E0B]/40 transition-colors">
                                      <span className="text-lg">{icons[idx % icons.length]}</span>
                                      <p className="text-[10px] text-zinc-200 font-bold leading-normal">{item}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              // Math theme
                              <div className="space-y-3">
                                {generatedMeme.items.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-[#161B26] border border-[#24324A] rounded-2xl p-3.5 space-y-1.5 shadow-xs text-left relative overflow-hidden">
                                    <div className="absolute right-3 top-3 text-[9px] font-mono font-black text-zinc-700">#0{idx+1}</div>
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] uppercase tracking-wider font-mono font-black text-zinc-500">If behavior is:</span>
                                      <p className="text-[11px] font-bold text-zinc-200 leading-tight">"{item.condition}"</p>
                                    </div>
                                    <div className="border-t border-[#24324A]/40 my-1" />
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] uppercase tracking-wider font-mono font-black text-amber-500">Dating Math conclusion:</span>
                                      <p className="text-[11px] font-black text-[#F59E0B] leading-tight">{item.conclusion}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Small engagement helper */}
                            <p className="text-[9px] text-zinc-400 italic text-center mt-2 px-4 leading-normal">
                              "Do you agree or is this a reach? Drop your thoughts in the comments."
                            </p>
                          </div>
                        ) : generatedPost ? (
                          <>
                            {previewTheme === 'notes' ? (
                              <div className="space-y-4 text-left">
                                <div className="text-[11px] text-zinc-400 border-b border-zinc-100 pb-1 flex justify-between items-center font-mono">
                                  <span>{getCleanCaseId(activeItem)}</span>
                                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <p className="text-sm font-semibold leading-relaxed tracking-tight text-zinc-800 whitespace-pre-wrap">
                                  {generatedPost.hook}
                                </p>
                                
                                {generatedPost.communitySpotlight && (
                                  <div className="mt-1 bg-amber-500/10 border-l-2 border-amber-500 rounded-r p-2.5 text-[10px] leading-relaxed text-zinc-700 font-medium">
                                    <span className="font-extrabold uppercase text-[8px] tracking-wide text-amber-600 block mb-0.5">💡 COMMUNITY SPOTLIGHT</span>
                                    "{generatedPost.communitySpotlight}"
                                  </div>
                                )}
                                
                                {/* Inner reference snippet */}
                                <div className="border-l-2 border-amber-500/30 pl-3 py-1 bg-amber-500/5 rounded-r">
                                  <p className="text-[10px] text-zinc-500 italic line-clamp-2 leading-normal">
                                    "{activeItem?.content}"
                                  </p>
                                </div>

                                {/* Prominent Notes Style Highlighted Sticker */}
                                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2 flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wide">
                                    {getProminentCta(activeItem?.typeLabel)}
                                  </span>
                                  <span className="text-[9px] text-amber-600 font-bold font-mono">beforeregret.com ➔</span>
                                </div>
                              </div>
                            ) : previewTheme === 'social' ? (
                              <div className="bg-[#1A2333] border border-[#2E3C52] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg text-left w-full relative overflow-hidden">
                                {/* BeforeRegret Logo & Brand badge */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#111827] to-[#C9A227] flex items-center justify-center font-black text-[#F9F6EE] text-[11px] shadow-md shrink-0 border border-[#C9A227]/30">
                                      ⚖️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-extrabold text-xs text-[#F9F6EE] block leading-none tracking-wide">Relationship Court</span>
                                      <span className="text-[9px] text-[#C9A227]/80 block font-mono mt-1">beforeregret.com</span>
                                    </div>
                                  </div>
                                  <span className="text-[8px] text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#C9A227]/20">
                                    Community Debate
                                  </span>
                                </div>
                                
                                {/* Debatable discussion prompt in large, readable, highly visible statement text */}
                                <div className="space-y-1 py-0.5">
                                  <p className="text-xs sm:text-[13px] font-extrabold leading-relaxed text-white tracking-tight">
                                    {generatedPost.hook}
                                  </p>
                                </div>

                                {generatedPost.communitySpotlight && (
                                  <div className="bg-[#101827] border border-[#2E3C52]/50 rounded-xl p-2.5 space-y-0.5">
                                    <span className="text-[8px] text-[#C9A227] font-black uppercase tracking-wider block">💬 USER OPINION & VERDICT</span>
                                    <p className="text-[11px] font-semibold text-zinc-200 leading-snug">
                                      "{generatedPost.communitySpotlight}"
                                    </p>
                                  </div>
                                )}

                                {/* Divider line */}
                                <div className="border-t border-[#2E3C52]/50 my-1" />

                                {/* Genuine Platform/Community Metrics */}
                                <div className="grid grid-cols-3 gap-1.5 py-1 text-center bg-[#101827]/80 rounded-xl border border-[#2E3C52]/30">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-zinc-400 block font-bold uppercase tracking-wider">👥 Jurors</span>
                                    <span className="font-mono text-xs font-black text-[#F9F6EE]">{getDynamicJurors(activeItem)}</span>
                                  </div>
                                  <div className="space-y-0.5 border-x border-[#2E3C52]/30">
                                    <span className="text-[8px] text-zinc-400 block font-bold uppercase tracking-wider">💬 Comments</span>
                                    <span className="font-mono text-xs font-black text-[#F9F6EE]">{getDynamicComments(activeItem)}</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] text-zinc-400 block font-bold uppercase tracking-wider">⚖️ Verdict</span>
                                    <span className="font-mono text-xs font-black text-[#C9A227]">{getDynamicVerdict(activeItem)}</span>
                                  </div>
                                </div>

                                {/* Beautiful visual interactive progress bar showing community verdict split */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[8px] font-bold uppercase text-zinc-400 tracking-wider">
                                    <span>Guilty ({getGuiltyPctNumber(activeItem)}%)</span>
                                    <span>Not Guilty ({100 - getGuiltyPctNumber(activeItem)}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#101827] rounded-full overflow-hidden flex border border-zinc-800">
                                    <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${getGuiltyPctNumber(activeItem)}%` }} />
                                    <div className="bg-emerald-500 h-full flex-1 transition-all duration-300" />
                                  </div>
                                </div>

                                {/* Call to Action Badge Button */}
                                <div className="bg-gradient-to-r from-[#C9A227] to-[#E2BE54] hover:brightness-110 transition-all rounded-xl py-2 px-3 text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 mt-1">
                                  <span className="text-[9px] font-black text-[#101827] uppercase tracking-wider">
                                    ⚖️ CAST YOUR VERDICT
                                  </span>
                                </div>
                              </div>
                            ) : previewTheme === 'cream' ? (
                              <div className="space-y-3.5">
                                <span className="text-2xl text-[#C9A227] leading-none">“</span>
                                <div className="text-[10px] tracking-widest font-bold uppercase text-[#C9A227] font-mono">
                                  {getCleanCaseId(activeItem)}
                                </div>
                                <p className="text-base sm:text-lg font-black leading-snug tracking-tight italic font-serif text-[#2C2620]">
                                  {generatedPost.hook}
                                </p>
                                
                                {generatedPost.communitySpotlight && (
                                  <div className="bg-[#2C2620]/5 border-l-2 border-[#C9A227] p-2.5 text-left max-w-sm mx-auto rounded-r">
                                    <span className="text-[8px] font-bold tracking-wider text-[#C9A227] uppercase font-mono block mb-0.5">⚖️ PEER VERDICT</span>
                                    <p className="text-[11px] font-medium italic text-[#2C2620]/85 leading-normal">
                                      "{generatedPost.communitySpotlight}"
                                    </p>
                                  </div>
                                )}
                                
                                <div className="pt-1">
                                  <div className="inline-flex items-center gap-1.5 bg-[#2C2620] text-[#F9F6EE] px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm">
                                    <span>{getProminentCta(activeItem?.typeLabel)}</span>
                                    <span className="text-[#C9A227]">➔</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="text-[10px] tracking-widest font-black uppercase text-violet-400 font-mono">
                                  {getCleanCaseId(activeItem)}
                                </div>
                                <p className="text-base sm:text-lg font-extrabold leading-snug tracking-tight text-white font-sans">
                                  {generatedPost.hook}
                                </p>
                                
                                {generatedPost.communitySpotlight && (
                                  <div className="bg-white/5 border border-violet-500/20 rounded-xl p-2.5 text-left max-w-sm mx-auto">
                                    <span className="text-[8px] font-black tracking-wider text-violet-400 uppercase font-mono block mb-0.5">🔥 THE JURY DEBATE</span>
                                    <p className="text-[11px] font-bold text-zinc-100 leading-normal">
                                      "{generatedPost.communitySpotlight}"
                                    </p>
                                  </div>
                                )}
                                
                                <div className="pt-1">
                                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg shadow-violet-500/20">
                                    <span>{getProminentCta(activeItem?.typeLabel)}</span>
                                    <span>✦</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>

                      {/* Call to action footer banner */}
                      <div className="border-t border-current/10 pt-3 opacity-80 text-[9px] flex items-center justify-between shrink-0 z-10 font-mono font-bold">
                        {previewTheme === 'cream' ? (
                          <>
                            <span className="font-semibold uppercase font-sans">VOTE NOW ON OUR BIO</span>
                            <span>BeforeRegret</span>
                          </>
                        ) : previewTheme === 'midnight' ? (
                          <>
                            <span className="text-violet-300 font-semibold uppercase animate-pulse">➔ Tap Link in Bio to Vote</span>
                            <span className="opacity-60">beforeregret.com</span>
                          </>
                        ) : previewTheme === 'notes' ? (
                          <>
                            <span className="text-amber-600 font-bold uppercase font-sans">🔗 read full timeline</span>
                            <span className="text-zinc-400">BeforeRegret</span>
                          </>
                        ) : previewTheme === 'meme' ? (
                          <>
                            <span className="text-[#F59E0B] font-bold uppercase font-sans flex items-center gap-1">👉 VOTE & DISCUSS AT BEFOREREGRET.COM</span>
                            <span className="text-zinc-400">BeforeRegret</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[#C9A227] font-bold uppercase font-sans">Join the discussion at BeforeRegret.com</span>
                            <span className="text-zinc-400">BeforeRegret</span>
                          </>
                        )}
                      </div>

                      {/* Elegant Brand Logo Watermark Stamp */}
                      <div className={`absolute bottom-16 right-6 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full border shadow-xs pointer-events-none ${
                        previewTheme === 'cream'
                          ? 'bg-[#2C2620]/5 border-[#2C2620]/10 text-[#2C2620]'
                          : previewTheme === 'midnight'
                          ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
                          : previewTheme === 'notes'
                          ? 'bg-amber-500/10 border-amber-500/15 text-amber-800'
                          : previewTheme === 'meme'
                          ? 'bg-amber-500/10 border-amber-500/20 text-[#F59E0B]'
                          : 'bg-[#C9A227]/10 border-[#C9A227]/20 text-[#C9A227]'
                      }`}>
                        <span className="text-[10px] leading-none">⚖️</span>
                        <span className="text-[8px] font-black uppercase tracking-widest font-sans">BeforeRegret</span>
                      </div>
                    </div>

                    {/* Copy Hook and Download Image Buttons Side-by-Side */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCopyText(generatedMeme ? generatedMeme.title : generatedPost.hook, 'hook')}
                        className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          copyStatus['hook'] 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                            : 'bg-white border-zinc-200 text-[#24324A] hover:bg-zinc-50'
                        }`}
                      >
                        {copyStatus['hook'] ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copyStatus['hook'] ? 'Copied!' : (generatedMeme ? 'Copy Title' : 'Copy Hook')}</span>
                      </button>

                      <button
                        onClick={handleDownloadImage}
                        disabled={isDownloading}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-xs ${
                          isDownloading 
                            ? 'bg-zinc-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                        }`}
                      >
                        <Download className={`h-3.5 w-3.5 ${isDownloading ? 'animate-spin' : 'animate-bounce'}`} />
                        <span>{isDownloading ? 'Saving...' : 'Download Image'}</span>
                      </button>
                    </div>

                    {/* Visual Suggestion Note */}
                    <div className="bg-zinc-50 border border-zinc-200/60 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#C9A227] font-mono block text-left">Creative Direction Tip</span>
                      <p className="text-[11px] text-zinc-600 leading-relaxed text-left">
                        {generatedMeme ? "Visual elements are arranged in a sleek modern card list grid, perfect for high-engagement screenshots on Instagram Stories or Pinterest." : generatedPost.visualSuggestion}
                      </p>
                    </div>

                  </div>

                  {/* Right: Caption, Hashtags & Action Buttons */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">2. Caption & Hashtags</span>
                      <button
                        onClick={() => {
                          const hashtags = generatedMeme ? generatedMeme.hashtags : generatedPost.hashtags;
                          const fullPost = `${editedCaption}\n\n${hashtags.join(' ')}`;
                          handleCopyText(fullPost, 'full');
                        }}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                          copyStatus['full'] 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                            : 'bg-[#24324A] border-[#24324A] text-white hover:bg-[#1a2536]'
                        }`}
                      >
                        {copyStatus['full'] ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copyStatus['full'] ? 'All Copied!' : 'Copy Caption + Hashtags'}</span>
                      </button>
                    </div>

                    {/* Editable caption container */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 block text-left">EDIT CAPTION TEXT</label>
                      <textarea
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        className="w-full h-64 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#24324A]/15 font-sans hover:border-zinc-300 text-left"
                        placeholder="Write your Instagram caption..."
                      />
                    </div>

                    {/* Hashtags badging block */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 block text-left">OPTIMIZED HASHTAGS</label>
                      <div className="flex flex-wrap gap-1">
                        {(generatedMeme ? generatedMeme.hashtags : generatedPost.hashtags).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#FAF8F2] border border-zinc-200 text-[10px] text-zinc-600 font-mono font-medium hover:text-[#C9A227] cursor-pointer"
                            onClick={() => handleCopyText(tag, `tag-${idx}`)}
                          >
                            {copyStatus[`tag-${idx}`] ? 'Copied!' : tag}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-zinc-400 font-medium">Generated via Gemini Large Language Model</span>
              <button
                onClick={() => {
                  setGeneratedPost(null);
                  setGeneratedMeme(null);
                  setActiveItem(null);
                  setIsGenerating(false);
                }}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
