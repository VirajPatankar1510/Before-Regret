import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Compass, HelpCircle, Heart, ShieldCheck, Gavel, Globe, Clock, PlusCircle, Bookmark, ArrowRight, ChevronRight, AlertTriangle, Monitor, RotateCcw, Share2, Info, X, BookOpen, Copy } from 'lucide-react';

// Reusable custom components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import SubmitStoryForm from './components/SubmitStoryForm';
import RegisterCaseForm from './components/RegisterCaseForm';
import AdminPanel from './components/AdminPanel';

// Simulated screen components
import HomeScreen from './pages/HomeScreen';
import SituationScreen from './pages/SituationScreen';
import CourtScreen from './pages/CourtScreen';
import QuestionScreen from './pages/QuestionScreen';
import ExploreScreen from './pages/ExploreScreen';
import ProfileScreen from './pages/ProfileScreen';
import CountryScreen from './pages/CountryScreen';
import TagScreen from './pages/TagScreen';
// Core State and Seeding
import { getInitialState, saveState } from './data/store';
import { PRESEEDED_SITUATIONS, COUNTRIES_DATA } from './data/mockData';
import { Story, CourtCase, Question, UserProfile, StoryComment } from './types';

// Real Firebase / Firestore Backend Connection
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, db } from './lib/firebase';
import { 
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  saveStoryToFirestore, 
  fetchStoriesFromFirestore, 
  saveCommentToFirestore, 
  fetchCommentsFromFirestore, 
  saveUserProfileToFirestore, 
  fetchUserProfileFromFirestore 
} from './lib/firestoreService';

export default function App() {
  const [store, setStore] = useState(() => getInitialState());
  const [currentScreen, setScreen] = useState<{ type: string; slug?: string }>(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    const slug = params.get('slug') || undefined;
    return { type: page, slug };
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('before_regret_admin_mode') === 'true';
  });

  // Dynamically update document title and URL parameters for SEO and native back/forward behaviors!
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', currentScreen.type);
    if (currentScreen.slug) {
      params.set('slug', currentScreen.slug);
    }
    
    // Set dynamic page title for SEO search crawlers
    let title = "BeforeRegret — See what happened before making the same decision.";
    const displaySlug = currentScreen.slug ? currentScreen.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    
    switch (currentScreen.type) {
      case 'home':
        title = "BeforeRegret — Relationship Decisional Outcomes & Lessons";
        break;
      case 'explore':
        title = "Explore Decisional Outcomes | BeforeRegret";
        break;
      case 'situation':
        title = `Should I ${displaySlug}? Real Outcomes & Data | BeforeRegret`;
        break;

      case 'court_list':
        title = "Peers Jury Tribunal - Give Judgement on Relationship Evidence | BeforeRegret";
        break;
      case 'court':
        title = `Relationship Jury Trial: "${displaySlug}" | BeforeRegret`;
        break;
      case 'question_list':
        title = "Community Advice Boards - Ask Survivor Veterans | BeforeRegret";
        break;
      case 'question':
        title = `Survivor Advice Q&A: "${displaySlug}" | BeforeRegret`;
        break;
      case 'profile':
        title = "My Profile & Peer Advice Logs | BeforeRegret";
        break;
      case 'country':
        title = `Relationship Decisions, Regrets & Outcomes in ${displaySlug} | BeforeRegret`;
        break;
      case 'tag':
        title = `Choice Outcomes matching "${displaySlug}" | BeforeRegret`;
        break;
      case 'submit_story':
        title = "Submit Your Anonymous Relationship Decision Timeline | BeforeRegret";
        break;
    }
    
    document.title = title;

    // Push state so each screen feels like a genuine native webpage with back/forward history!
    const newRelativePathQuery = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      window.history.pushState({ type: currentScreen.type, slug: currentScreen.slug }, '', newRelativePathQuery);
    }
  }, [currentScreen]);

  // Handle auto-scroll to top and focus main section on navigation/screen change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  }, [currentScreen]);

  // Synchronize browser native back & forward button pops directly into the React stack
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.type) {
        setScreen({ type: event.state.type, slug: event.state.slug });
      } else {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'home';
        const slug = params.get('slug') || undefined;
        setScreen({ type: page, slug });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Dynamic Comments and Connected Account Hooks
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [showAuthTroubleshooter, setShowAuthTroubleshooter] = useState<boolean>(false);
  const [guestNickName, setGuestNickName] = useState<string>('Wandering_Seeker');

  // Listen to Google Authentication State and Subscribe to Real-Time Collections
  useEffect(() => {
    // 1. Listen to Authentication State
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        showToast(`👋 Connected to Google Account: ${fbUser.displayName || fbUser.email}`);
        
        try {
          const dbProfile = await fetchUserProfileFromFirestore(fbUser.uid);
          if (dbProfile) {
            setStore(prev => ({
              ...prev,
              user: {
                ...dbProfile,
                username: fbUser.displayName || dbProfile.username || 'Google Seeker'
              }
            }));
          } else {
            const initialProfile: UserProfile = {
              username: fbUser.displayName || 'Google Seeker',
              storiesSubmitted: 0,
              helpfulVotesReceived: 0,
              followers: 0,
              badges: ["Google Connected"],
              savedStories: [],
              followedSituations: [],
              followedTags: [],
              followedQuestions: [],
              recentActivity: [{
                type: 'story_added',
                detail: "Connected Google Account Credentials anonymously",
                date: "Just now"
              }]
            };
            await saveUserProfileToFirestore(fbUser.uid, initialProfile);
            setStore(prev => ({ ...prev, user: initialProfile }));
          }
        } catch (err) {
          console.error("Error loading user profile from Firestore:", err);
        }
      }
    });

    // 2. Real-Time Subscription to Stories
    const storiesCol = collection(db, "stories");
    const qStories = query(storiesCol, orderBy("dateAdded", "desc"));
    const unsubscribeStories = onSnapshot(qStories, (snapshot) => {
      const fsStories: Story[] = [];
      snapshot.forEach((snapDoc) => {
        fsStories.push(snapDoc.data() as Story);
      });
      if (fsStories.length > 0) {
        setStore(prev => {
          const combined = [...fsStories, ...prev.stories];
          const uniqueStories = combined.filter((s, idx, self) => 
            self.findIndex(t => t.id === s.id) === idx
          );
          return { ...prev, stories: uniqueStories };
        });
      }
    }, (error) => {
      console.error("Firestore stories subscription error: ", error);
    });

    // 3. Real-Time Subscription to Comments / Advice Answers
    const commentsCol = collection(db, "comments");
    const qComments = query(commentsCol, orderBy("dateAdded", "asc"));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const fsComments: StoryComment[] = [];
      snapshot.forEach((snapDoc) => {
        fsComments.push(snapDoc.data() as StoryComment);
      });
      if (fsComments.length > 0) {
        setComments(fsComments);
      }
    }, (error) => {
      console.error("Firestore comments subscription error: ", error);
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeAuth();
      unsubscribeStories();
      unsubscribeComments();
    };
  }, []);

  // Live Auto sync Profile alterations back to Firestore
  useEffect(() => {
    if (currentUser) {
      saveUserProfileToFirestore(currentUser.uid, store.user).catch(err => {
        console.error("Error syncing profile updates to Firestore:", err);
      });
    }
  }, [store.user, currentUser]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`🎉 Connected as: ${result.user.displayName || result.user.email}`);
    } catch (e: any) {
      console.error("Sign-in process exception info:", e);
      // Intercept Firebase unauthorized-domain config failures
      if (
        e?.code === 'auth/unauthorized-domain' ||
        e?.message?.includes('unauthorized-domain') ||
        e?.message?.includes('unauthorized domain') ||
        e?.message?.includes('auth/unauthorized')
      ) {
        setShowAuthTroubleshooter(true);
        showToast("🔑 Custom Domain Authorized Required: Displaying Troubleshooting Guide.");
      } else if (
        e?.code === 'auth/popup-closed-by-user' ||
        e?.message?.includes('popup-closed-by-user') ||
        e?.message?.includes('cancelled-by-user')
      ) {
        showToast("ℹ️ Sign-in window was closed. Feel free to login whenever you wish!");
      } else if (
        e?.code === 'auth/popup-blocked' ||
        e?.message?.includes('popup-blocked')
      ) {
        showToast("⚠️ Sign-in popup was blocked by your browser. Please allow popups to connect with Google.");
      } else {
        // Also fallback to showing details if other unauthorized errors occur
        if (e?.message?.includes("unauthorized") || e?.message?.includes("unauth")) {
          setShowAuthTroubleshooter(true);
        }
        showToast(`❌ Authentication aborted: ${e.message || "Please check your connection."}`);
      }
    }
  };

  const handleInstantGuestLogin = () => {
    const finalNickName = guestNickName.trim() || 'Wandering_Seeker';
    const guestUser = {
      uid: `guest-${Date.now()}`,
      displayName: finalNickName,
      email: `${finalNickName.toLowerCase().replace(/[^a-z0-9]/g, '_')}@beforeregret.com`,
      photoURL: "",
      isAnonymous: true,
      isGuest: true
    };
    setCurrentUser(guestUser);
    
    // Create local guest user profile info
    const initialProfile: UserProfile = {
      username: finalNickName,
      storiesSubmitted: 0,
      helpfulVotesReceived: 0,
      followers: 0,
      badges: ["Instant Guest"],
      savedStories: [],
      followedSituations: [],
      followedTags: [],
      followedQuestions: [],
      recentActivity: [{
        type: 'story_added',
        detail: "Connected via Instant Guest Bypass Module",
        date: "Just now"
      }]
    };
    
    // Store in global memory state
    setStore(prev => ({ ...prev, user: initialProfile }));
    setShowAuthTroubleshooter(false);
    showToast(`⚡ Signed in instantly with Guest Avatar: ${finalNickName}!`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStore(prev => ({
        ...prev,
        user: {
          username: "Guest_Seeker",
          storiesSubmitted: 0,
          helpfulVotesReceived: 0,
          followers: 0,
          badges: ["Truth Teller"],
          savedStories: [],
          followedSituations: [],
          followedTags: [],
          followedQuestions: [],
          recentActivity: [
            {
              type: 'story_added',
              detail: "Operating in anonymous browser session",
              date: "Just now"
            }
          ]
        }
      }));
      showToast("🔒 Google account signed out safely.");
    } catch (e: any) {
      console.error(e);
      showToast(`❌ Sign out failed: ${e.message}`);
    }
  };

  const handleAddComment = async (storyId: string, text: string) => {
    if (!currentUser) {
      showToast("🔒 Please login with Google to leave advice responses.");
      return;
    }
    const commentId = 'comment_' + Math.random().toString(36).substring(2, 9);
    const newComment: StoryComment = {
      id: commentId,
      storyId: storyId,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Google Seeker',
      authorPhoto: currentUser.photoURL || undefined,
      text: text,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    await saveCommentToFirestore(newComment);
    setComments(prev => [...prev, newComment]);
    showToast("💬 Response advice registered successfully!");
  };


  const handleToggleAdmin = (status: boolean) => {
    setIsAdmin(status);
    localStorage.setItem('before_regret_admin_mode', String(status));
    if (status) {
      showToast("🔐 Master overriding authorized! Modifying/deletion triggers are now active.");
    } else {
      showToast("🔒 Master override disconnected. Session deauthorized safely.");
    }
  };
  const [darkMode, setDarkMode] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep track of what cases and polls the user has already voted on
  const [userVotedCases, setUserVotedCases] = useState<{ [slug: string]: string }>(() => {
    const saved = localStorage.getItem('before_regret_court_votes');
    return saved ? JSON.parse(saved) : {};
  });

  const [userVotedQuestions, setUserVotedQuestions] = useState<{ [slug: string]: string }>(() => {
    const saved = localStorage.getItem('before_regret_question_votes');
    return saved ? JSON.parse(saved) : {};
  });

  // Sync state changes to storage
  useEffect(() => {
    saveState(store);
  }, [store]);

  useEffect(() => {
    localStorage.setItem('before_regret_court_votes', JSON.stringify(userVotedCases));
  }, [userVotedCases]);

  useEffect(() => {
    localStorage.setItem('before_regret_question_votes', JSON.stringify(userVotedQuestions));
  }, [userVotedQuestions]);

  // Dynamically calculate and merge situation stats with user submissions in real-time!
  const liveSituations = useMemo(() => {
    return PRESEEDED_SITUATIONS.map(sit => {
      const matchingStories = store.stories.filter(s => s.situationSlug === sit.slug);
      if (matchingStories.length === 0) return sit;

      const userCount = matchingStories.length;
      const baseCount = sit.stats.storyCount;
      const totalCount = baseCount + userCount;

      // Calculate new average regret score
      const userAvgRegret = matchingStories.reduce((acc, s) => acc + s.regretScore, 0) / userCount;
      const blendedAvgRegret = Number(((sit.stats.avgRegret * baseCount + userAvgRegret * userCount) / totalCount).toFixed(1));

      // Would Do Again Percent
      const userDoAgainCount = matchingStories.filter(s => s.wouldDoAgain === 'Yes').length;
      const userDoAgainPercent = userCount > 0 ? (userDoAgainCount / userCount) * 100 : 0;
      const blendedDoAgainPercent = Math.round((sit.stats.wouldDoAgainPercent * baseCount + userDoAgainPercent * userCount) / totalCount);

      // Still Together Percent
      const userStillTogether = matchingStories.filter(s => s.currentOutcome === 'Still Together' || s.currentOutcome === 'Married' || s.currentOutcome === 'Engaged').length;
      const userStillTogetherPercent = userCount > 0 ? (userStillTogether / userCount) * 100 : 0;
      const blendedStillTogetherPercent = Math.round((sit.stats.stillTogetherPercent * baseCount + userStillTogetherPercent * userCount) / totalCount);

      // Separated Percent
      const userSeparated = matchingStories.filter(s => s.currentOutcome === 'Separated' || s.currentOutcome === 'Divorced').length;
      const userSeparatedPercent = userCount > 0 ? (userSeparated / userCount) * 100 : 0;
      const blendedSeparatedPercent = Math.round((sit.stats.separatedPercent * baseCount + userSeparatedPercent * userCount) / totalCount);

      return {
        ...sit,
        stats: {
          ...sit.stats,
          storyCount: totalCount,
          avgRegret: blendedAvgRegret,
          wouldDoAgainPercent: blendedDoAgainPercent,
          stillTogetherPercent: blendedStillTogetherPercent,
          separatedPercent: blendedSeparatedPercent
        }
      };
    });
  }, [store.stories]);

  // Toast notifier helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // CORE STATE WORKFLOW CALLBACK ACTIONS //
  const handleAddStory = async (newStory: Story) => {
    if (currentUser) {
      newStory.userId = currentUser.uid;
      newStory.userName = currentUser.displayName || newStory.userName;
    }

    // Save story model securely to cloud firestore database
    await saveStoryToFirestore(newStory);

    setStore(prev => {
      const updatedStories = [newStory, ...prev.stories];
      
      const updatedUser: UserProfile = {
        ...prev.user,
        storiesSubmitted: prev.user.storiesSubmitted + 1,
        recentActivity: [
          {
            type: 'story_added',
            detail: `Archived chronological outcome log for "${newStory.title}"`,
            date: 'Just now'
          },
          ...prev.user.recentActivity
        ]
      };

      // Recalculate badges based on total submissions
      if (updatedUser.storiesSubmitted >= 1 && !updatedUser.badges.includes("Outcome Contributor")) {
        updatedUser.badges.push("Outcome Contributor");
        updatedUser.badges.push("Relationship Veteran");
      }

      return {
        ...prev,
        stories: updatedStories,
        user: updatedUser
      };
    });

    showToast("🎉 Anonymous relationship timeline archived successfully! Peer jurors can now review your outcomes.");
    setScreen({ type: 'situation', slug: newStory.situationSlug });
  };

  const handleVoteHelpful = (storyId: string) => {
    setStore(prev => {
      const storyIdx = prev.stories.findIndex(s => s.id === storyId);
      if (storyIdx === -1) return prev;

      const updatedStories = [...prev.stories];
      const story = updatedStories[storyIdx];
      
      const alreadyVotedKey = `helpful_voted_${storyId}`;
      const hasVoted = localStorage.getItem(alreadyVotedKey);
      
      if (hasVoted) {
        showToast("⚠️ You already upvoted this outcome timeline as helpful.");
        return prev;
      }

      localStorage.setItem(alreadyVotedKey, 'true');
      story.helpfulVotes += 1;

      // Update user metrics
      const updatedUser: UserProfile = {
        ...prev.user,
        helpfulVotesReceived: prev.user.helpfulVotesReceived + (story.userName === prev.user.username ? 1 : 0),
        recentActivity: [
          {
            type: 'helpful_voted',
            detail: `Upvoted outcome timeline for "${story.title}"`,
            date: 'Seconds ago'
          },
          ...prev.user.recentActivity
        ]
      };

      if (updatedUser.helpfulVotesReceived >= 1 && !updatedUser.badges.includes("Top Mentor")) {
        updatedUser.badges.push("Top Mentor");
      }

      showToast("❤️ Upvoted! Thank you for validating the post-decision usefulness of this record.");

      return {
        ...prev,
        stories: updatedStories,
        user: updatedUser
      };
    });
  };

  const handleToggleBookmark = (storyId: string) => {
    setStore(prev => {
      const isSaved = prev.user.savedStories.includes(storyId);
      const updatedSaved = isSaved 
        ? prev.user.savedStories.filter(id => id !== storyId)
        : [...prev.user.savedStories, storyId];

      const detailMsg = isSaved ? "Removed timeline bookmark" : "Bookmarked chronicled timeline";

      const updatedUser: UserProfile = {
        ...prev.user,
        savedStories: updatedSaved,
        recentActivity: [
          {
            type: 'bookmarked',
            detail: `${detailMsg} for case #${storyId}`,
            date: 'Just now'
          },
          ...prev.user.recentActivity
        ]
      };

      showToast(isSaved ? "Bookmark cleared." : "📁 Timeline bookmarked. View from your anonymous profile board.");

      return {
        ...prev,
        user: updatedUser
      };
    });
  };

  const handleAddStoryUpdate = (storyId: string, text: string, regretScore: number, daysAfter: number) => {
    setStore(prev => {
      const storyIdx = prev.stories.findIndex(s => s.id === storyId);
      if (storyIdx === -1) return prev;

      const updatedStories = [...prev.stories];
      const story = updatedStories[storyIdx];

      const newUpdate = {
        daysAfter,
        dateAdded: new Date().toISOString().split('T')[0],
        text,
        regretScore
      };

      story.updates = [newUpdate, ...story.updates];
      // Update story key criteria as well
      story.regretScore = regretScore;

      const updatedUser: UserProfile = {
        ...prev.user,
        recentActivity: [
          {
            type: 'story_updated',
            detail: `Added ${daysAfter} Days Later Update to "${story.title}"`,
            date: 'Just now'
          },
          ...prev.user.recentActivity
        ]
      };

      showToast("📈 Decisional update appended! Your active timeline chart nodes registered the adjustments.");

      return {
        ...prev,
        stories: updatedStories,
        user: updatedUser
      };
    });
  };

  const handleVoteCourtCase = (slug: string, side: 'me' | 'partner' | 'both' | 'neither') => {
    setStore(prev => {
      const idx = prev.courtCases.findIndex(c => c.slug === slug);
      if (idx === -1) return prev;

      const updatedCases = [...prev.courtCases];
      const courtCase = updatedCases[idx];

      // Mutate case metrics
      courtCase.votes[side] += 1;

      return {
        ...prev,
        courtCases: updatedCases
      };
    });

    setUserVotedCases(prev => ({ ...prev, [slug]: side }));
    showToast("⚖️ Verdict logged. You can now analyze peer jury ratios.");
  };

  const handleAddCourtArgument = (slug: string, side: 'Me' | 'Partner' | 'Both' | 'Neither', text: string) => {
    setStore(prev => {
      const idx = prev.courtCases.findIndex(c => c.slug === slug);
      if (idx === -1) return prev;

      const updatedCases = [...prev.courtCases];
      const courtCase = updatedCases[idx];

      const newArg = {
        id: 'arg_' + Date.now().toString(),
        author: prev.user.username,
        side,
        text,
        votes: 0,
        role: (prev.user.storiesSubmitted > 0 ? "Relationship Veteran" : "Truth Teller") as any
      };

      courtCase.arguments = [newArg, ...courtCase.arguments];

      return {
        ...prev,
        courtCases: updatedCases
      };
    });

    showToast("✍️ Jury opinion finalized! Thank you for raising relationship objectivity.");
  };

  const handleRegisterCourtCase = (caseData: { title: string; description: string; tags: string[] }) => {
    const baseSlug = caseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const uniqueSlug = store.courtCases.some(c => c.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const newCase: CourtCase = {
      slug: uniqueSlug,
      title: caseData.title,
      description: caseData.description,
      postTime: new Date().toISOString().split('T')[0],
      author: currentUser ? (currentUser.displayName || currentUser.email || "anonymous_litigant") : "anonymous_seeking",
      votes: {
        me: 0,
        partner: 0,
        both: 0,
        neither: 0
      },
      arguments: [],
      tags: caseData.tags
    };

    setStore(prev => ({
      ...prev,
      courtCases: [newCase, ...prev.courtCases]
    }));

    showToast("⚖️ Court case registered successfully! Jurors can now render verdict opinions.");
  };

  const handleVoteQuestionPoll = (slug: string, optionText: string) => {
    setStore(prev => {
      const idx = prev.questions.findIndex(q => q.slug === slug);
      if (idx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = updatedQuestions[idx];

      const optIdx = question.pollOptions.findIndex(o => o.text === optionText);
      if (optIdx !== -1) {
        question.pollOptions[optIdx].votes += 1;
      }

      return {
        ...prev,
        questions: updatedQuestions
      };
    });

    setUserVotedQuestions(prev => ({ ...prev, [slug]: optionText }));
    showToast("🗳️ Poll opinion registered. Charts refreshed.");
  };

  const handleAddQuestionAnswer = (slug: string, text: string) => {
    setStore(prev => {
      const idx = prev.questions.findIndex(q => q.slug === slug);
      if (idx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = updatedQuestions[idx];

      const newAnswer = {
        id: 'ans_' + Date.now().toString(),
        author: prev.user.username,
        text,
        votes: 0,
        isOutcomeVerified: prev.user.storiesSubmitted > 0,
        date: 'Just now'
      };

      question.answers = [newAnswer, ...question.answers];

      return {
        ...prev,
        questions: updatedQuestions
      };
    });

    showToast("🎓 Answer broadcasted onto peer-help logs!");
  };

  const handleDeleteStory = (storyId: string) => {
    setStore(prev => {
      const updatedStories = prev.stories.filter(s => s.id !== storyId);
      return {
        ...prev,
        stories: updatedStories
      };
    });
    showToast("⚖️ Chronicle story post has been permanently expunged by administrator.");
  };

  const handleEditStory = (storyId: string, newTitle: string, newStoryText: string) => {
    setStore(prev => {
      const updatedStories = prev.stories.map(s => {
        if (s.id === storyId) {
          return {
            ...s,
            title: newTitle,
            fullStory: newStoryText
          };
        }
        return s;
      });
      return {
        ...prev,
        stories: updatedStories
      };
    });
    showToast("✍️ Chronicle story post updated successfully by administrator.");
  };

  const handleDeleteCourtCase = (slug: string) => {
    setStore(prev => {
      const updatedCases = prev.courtCases.filter(c => c.slug !== slug);
      return {
        ...prev,
        courtCases: updatedCases
      };
    });
    showToast("⚖️ Court case trial has been permanently expunged by administrator.");
  };

  const handleDeleteArgument = (caseSlug: string, argId: string) => {
    setStore(prev => {
      const updatedCases = prev.courtCases.map(c => {
        if (c.slug === caseSlug) {
          return {
            ...c,
            arguments: c.arguments.filter(a => a.id !== argId)
          };
        }
        return c;
      });
      return {
        ...prev,
        courtCases: updatedCases
      };
    });
    showToast("⚖️ Juror argument has been permanently expunged by administrator.");
  };

  const handleDeleteQuestion = (slug: string) => {
    setStore(prev => {
      const updatedQuestions = prev.questions.filter(q => q.slug !== slug);
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
    showToast("⚖️ Survival Q&A thread has been permanently expunged by administrator.");
  };

  const handleDeleteAnswer = (qSlug: string, ansId: string) => {
    setStore(prev => {
      const updatedQuestions = prev.questions.map(q => {
        if (q.slug === qSlug) {
          return {
            ...q,
            answers: q.answers.filter(a => a.id !== ansId)
          };
        }
        return q;
      });
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
    showToast("⚖️ Survivor advice answer has been permanently expunged by administrator.");
  };

  return (
    <div className={darkMode ? 'dark bg-[#0D1117] text-white min-h-screen flex flex-col' : 'bg-neutral-50 text-neutral-900 min-h-screen flex flex-col'}>
      
      {/* Primary Top Nav */}
      <Navigation
        currentScreen={currentScreen}
        setScreen={setScreen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSubmit={() => setScreen({ type: 'submit_story' })}
        currentUser={currentUser}
        onGoogleLogin={handleGoogleLogin}
      />

      {/* Floating interactive notification toasts */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm rounded-xl border border-emerald-500/30 bg-[#161B22]/95 p-4 shadow-2xl backdrop-blur-md animate-slideIn flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">✓</span>
          <p className="text-xs font-semibold text-white leading-normal">{toastMessage}</p>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <main id="main-content" tabIndex={-1} className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full outline-none">
        {currentScreen.type === 'home' && (
          <HomeScreen
            situations={liveSituations}
            courtCases={store.courtCases}
            questions={store.questions}
            latestStories={store.stories}
            setScreen={setScreen}
            onOpenSubmit={() => setScreen({ type: 'submit_story' })}
          />
        )}

        {currentScreen.type === 'explore' && (
          <ExploreScreen
            situations={liveSituations}
            setScreen={setScreen}
          />
        )}

        {currentScreen.type === 'situation' && (
          <SituationScreen
            situation={liveSituations.find(s => s.slug === currentScreen.slug) || liveSituations[0]}
            allStories={store.stories}
            setScreen={setScreen}
            onOpenSubmit={() => setScreen({ type: 'submit_story' })}
            onVoteHelpful={handleVoteHelpful}
            onToggleBookmark={handleToggleBookmark}
            onAddUpdate={handleAddStoryUpdate}
            savedStories={store.user.savedStories}
            darkMode={darkMode}
            onSelectTag={(tag) => setScreen({ type: 'tag', slug: tag })}
            onSelectCountry={(country) => setScreen({ type: 'country', slug: country.toLowerCase() })}
            currentUsername={store.user.username}
            isAdmin={isAdmin}
            onDeleteStory={handleDeleteStory}
            onEditStory={handleEditStory}
            comments={comments}
            onAddComment={handleAddComment}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
          />
        )}



        {currentScreen.type === 'court_list' && (
          <div className="space-y-6 pb-16 animate-fadeIn">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Gavel className="h-6 w-6 text-[#F4B942]" /> Become a Judge
              </h1>
              <p className="text-xs text-[#AAB2C0]">Step into our anonymous tribunal. Review relationship evidence, defend sides, and lodge peer verdict opinions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Active Cases Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xs uppercase font-extrabold tracking-wider text-[#AAB2C0] px-1">
                  Active Cases Under Deliberation ({store.courtCases.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {store.courtCases.map(c => (
                    <div
                      key={c.slug}
                      onClick={() => setScreen({ type: 'court', slug: c.slug })}
                      className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 cursor-pointer hover:border-[#F4B942] transition-all hover:scale-[1.01] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] uppercase font-bold text-[#F4B942] bg-[#F4B942]/10 px-2 py-0.5 rounded">
                            Active Deliberation
                          </span>
                          <span className="text-[9px] text-[#AAB2C0] font-mono">
                            ⚖️ {(c.votes.me || 0) + (c.votes.partner || 0) + (c.votes.both || 0) + (c.votes.neither || 0)} votes
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1 leading-snug">"{c.title}"</h3>
                        <p className="text-xs text-[#AAB2C0] line-clamp-3 leading-relaxed mt-1.5 font-serif">{c.description}</p>
                      </div>
                      <div className="mt-4 border-t border-[#30363D]/45 pt-3 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Lodge Verdict →</span>
                        <span className="font-mono">{c.postTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Register Case Panel */}
              <div className="space-y-4">
                <RegisterCaseForm onSubmit={handleRegisterCourtCase} />
              </div>
            </div>
          </div>
        )}

        {currentScreen.type === 'court' && (
          <CourtScreen
            courtCase={store.courtCases.find(c => c.slug === currentScreen.slug) || store.courtCases[0]}
            setScreen={setScreen}
            onVoteCourt={handleVoteCourtCase}
            onAddArgument={handleAddCourtArgument}
            userVotedCases={userVotedCases}
            isAdmin={isAdmin}
            onDeleteArgument={handleDeleteArgument}
            onDeleteCourtCase={handleDeleteCourtCase}
          />
        )}

        {currentScreen.type === 'question_list' && (
          <div className="space-y-6 pb-16 animate-fadeIn">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-purple-400" /> Community Advice Boards
              </h1>
              <p className="text-xs text-[#AAB2C0]">Explore hard relationship questions answered directly by veteran survivors.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {store.questions.map(q => (
                <div
                  key={q.slug}
                  onClick={() => setScreen({ type: 'question', slug: q.slug })}
                  className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 cursor-pointer hover:border-purple-500 transition-all"
                >
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    {q.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2 leading-snug">"{q.title}"</h3>
                  <p className="text-xs text-[#AAB2C0] line-clamp-3 leading-relaxed mt-1.5 font-serif">{q.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentScreen.type === 'question' && (
          <QuestionScreen
            question={store.questions.find(q => q.slug === currentScreen.slug) || store.questions[0]}
            setScreen={setScreen}
            onVoteQuestionPoll={handleVoteQuestionPoll}
            onAddQuestionAnswer={handleAddQuestionAnswer}
            userVotedQuestions={userVotedQuestions}
            isAdmin={isAdmin}
            onDeleteAnswer={handleDeleteAnswer}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {currentScreen.type === 'profile' && (
          <ProfileScreen
            user={store.user}
            allStories={store.stories}
            setScreen={setScreen}
            onRemoveBookmark={handleToggleBookmark}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
            onLogout={handleLogout}
            comments={comments}
          />
        )}

        {currentScreen.type === 'country' && (
          <CountryScreen
            countrySlug={currentScreen.slug || 'usa'}
            allStories={store.stories}
            setScreen={setScreen}
            onVoteHelpful={handleVoteHelpful}
            onToggleBookmark={handleToggleBookmark}
            onAddUpdate={handleAddStoryUpdate}
            savedStories={store.user.savedStories}
            darkMode={darkMode}
            onSelectTag={(tag) => setScreen({ type: 'tag', slug: tag })}
            onSelectCountry={(country) => setScreen({ type: 'country', slug: country.toLowerCase() })}
            currentUsername={store.user.username}
            isAdmin={isAdmin}
            onDeleteStory={handleDeleteStory}
            onEditStory={handleEditStory}
            comments={comments}
            onAddComment={handleAddComment}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {currentScreen.type === 'tag' && (
          <TagScreen
            tagSlug={currentScreen.slug || 'cheating'}
            allStories={store.stories}
            allQuestions={store.questions}
            allCourtCases={store.courtCases}
            setScreen={setScreen}
            onVoteHelpful={handleVoteHelpful}
            onToggleBookmark={handleToggleBookmark}
            onAddUpdate={handleAddStoryUpdate}
            savedStories={store.user.savedStories}
            darkMode={darkMode}
            onSelectTag={(tag) => setScreen({ type: 'tag', slug: tag })}
            onSelectCountry={(country) => setScreen({ type: 'country', slug: country.toLowerCase() })}
            currentUsername={store.user.username}
            isAdmin={isAdmin}
            onDeleteStory={handleDeleteStory}
            onEditStory={handleEditStory}
            comments={comments}
            onAddComment={handleAddComment}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {currentScreen.type === 'submit_story' && (
          <div className="w-full max-w-2xl mx-auto bg-[#161B22] rounded-3xl border border-[#30363D] shadow-2xl p-4 sm:p-6 select-none animate-fadeIn">
            <div className="mb-4 sm:mb-6 border-b border-[#30363D]/60 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-[#4F8CFF]" /> Archive Relationship Timeline
                </h2>
                <p className="text-[11px] text-[#AAB2C0] mt-0.5">Your fully anonymous timeline logs helps others analyze situational regrets before making decisions.</p>
              </div>
              <button
                onClick={() => setScreen({ type: 'home' })}
                className="text-xs font-bold text-zinc-500 hover:text-white px-2 py-1 rounded-lg border border-[#30363D] hover:bg-[#30363D]/30 transition-colors"
              >
                Go Back
              </button>
            </div>
            <SubmitStoryForm
              onClose={() => setScreen({ type: 'home' })}
              onSubmit={handleAddStory}
            />
          </div>
        )}
      </main>

      {/* Persistent platform-wide Footer */}
      <Footer setScreen={setScreen} isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />

      {/* ⚙️ FIREBASE AUTH TROUBLESHOOTING & INSTANT GUEST PASS OVERLAY */}
      {showAuthTroubleshooter && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#161B22] border border-[#30363D] shadow-2xl rounded-3xl overflow-hidden text-left p-6 relative">
            <button 
              onClick={() => setShowAuthTroubleshooter(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-[#30363D]/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 border-b border-[#30363D] pb-4 mb-4">
              <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl text-yellow-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md sm:text-lg font-black text-white uppercase tracking-wider">
                  Firebase Domain Setup
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Google Sign-In configuration required.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
              <p className="leading-relaxed text-zinc-300">
                The domain <code className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono text-xs">{window.location.hostname}</code> is not yet added to your Firebase authorized domains list.
              </p>

              {/* Instructions */}
              <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white uppercase text-xs flex items-center gap-1">
                  <span>🛠️ How to authorize this domain (1-Minute):</span>
                </h4>
                <ol className="list-decimal pl-4.5 space-y-2 text-zinc-400 text-xs leading-relaxed">
                  <li>
                    Open your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#4F8CFF] hover:underline font-bold inline-flex items-center gap-0.5">Firebase Console <BookOpen className="h-3 w-3" /></a> for project <span className="font-mono text-zinc-300 font-semibold bg-[#161B22] px-1 rounded">universal-cogency-hnzsc</span>.
                  </li>
                  <li>
                    Navigate to <strong className="text-zinc-300 font-bold">Authentication</strong> &gt; <strong className="text-zinc-300 font-bold">Settings</strong> (top tab).
                  </li>
                  <li>
                    Select <strong className="text-zinc-300 font-bold">Authorized domains</strong> and click <strong className="text-[#4F8CFF] font-bold">Add domain</strong>.
                  </li>
                  <li>
                    Paste the domain:
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="bg-[#161B22] border border-[#30363D] rounded-xl px-3 py-1.5 text-[#F4B942] select-all font-mono text-[11px] block truncate max-w-[240px] sm:max-w-xs">
                        {window.location.hostname}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          showToast("📋 Copied hostname!");
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-[#30363D] hover:bg-[#30363D] transition-colors text-zinc-400 hover:text-white shrink-0 text-xs font-bold flex items-center gap-1"
                        title="Copy domain name"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Instant Guest mode */}
              <div className="border-t border-[#30363D] pt-4 mt-2">
                <div className="bg-gradient-to-r from-[#4F8CFF]/10 to-indigo-500/10 border border-[#4F8CFF]/25 rounded-2xl p-4">
                  <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-[#4F8CFF]" /> Bypass with Instant Guest Profile
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Don't want to change console settings right now? Create an instant custom local session to submit timelines, voice verdicts, and test Firestore features with real-time sync.
                  </p>

                  <div className="mt-3.5 flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text"
                      value={guestNickName}
                      onChange={(e) => setGuestNickName(e.target.value)}
                      placeholder="Enter seeker nickname..."
                      className="bg-[#0D1117] border border-[#30363D] rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#4F8CFF] flex-1"
                    />
                    <button
                      onClick={handleInstantGuestLogin}
                      className="rounded-xl bg-gradient-to-r from-[#4F8CFF] to-indigo-600 hover:from-[#4F8CFF]/90 hover:to-indigo-600/90 text-xs font-black text-white px-4 py-2.5 shadow-lg shadow-[#4F8CFF]/15 hover:shadow-[#4F8CFF]/25 transition-all text-center shrink-0"
                    >
                      Instant Login ⚡
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowAuthTroubleshooter(false)}
                className="text-xs font-bold text-zinc-400 hover:text-white px-4 py-2 rounded-xl border border-[#30363D] hover:bg-[#30363D] transition-all"
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
