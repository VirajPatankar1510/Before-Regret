import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Compass, HelpCircle, Heart, ShieldCheck, Gavel, Globe, Clock, PlusCircle, Bookmark, ArrowRight, ChevronRight, AlertTriangle, Monitor, RotateCcw, Share2, Info, X, BookOpen, Copy } from 'lucide-react';

// Reusable custom components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import SubmitStoryForm from './components/SubmitStoryForm';
import SubmitQuestionForm from './components/SubmitQuestionForm';
import RegisterCaseForm from './components/RegisterCaseForm';
import AdminPanel from './components/AdminPanel';
import MySubmissionsLedger from './components/MySubmissionsLedger';

// Simulated screen components
import HomeScreen from './pages/HomeScreen';
import SituationScreen from './pages/SituationScreen';
import CourtScreen from './pages/CourtScreen';
import QuestionScreen from './pages/QuestionScreen';
import ExploreScreen from './pages/ExploreScreen';
import CountryScreen from './pages/CountryScreen';
import TagScreen from './pages/TagScreen';
import CompareScreen from './pages/CompareScreen';
import RegretStoriesScreen from './pages/RegretStoriesScreen';
import RedFlagMeterScreen from './pages/RedFlagMeterScreen';
// Core State and Seeding
import { getInitialState, saveState } from './data/store';
import { PRESEEDED_SITUATIONS, COUNTRIES_DATA } from './data/mockData';
import { Story, CourtCase, Question, UserProfile, StoryComment, RedFlagCase } from './types';

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
  deleteCommentFromFirestore,
  saveUserProfileToFirestore, 
  fetchUserProfileFromFirestore,
  deleteStoryFromFirestore,
  saveQuestionToFirestore,
  fetchQuestionsFromFirestore
} from './lib/firestoreService';

// RESTful Route Pathname Helpers for Clean Semantic Dynamic pSEO
export function parsePath(pathname: string): { type: string; slug?: string } {
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length === 0) {
    return { type: 'home' };
  }
  
  const first = parts[0].toLowerCase();
  
  if (first === 'explore') {
    return { type: 'explore' };
  }
  if (first === 'decision') {
    return { type: 'situation', slug: parts[1] || 'boyfriend-doesnt-want-marriage' };
  }
  if (first === 'compare') {
    return { type: 'compare', slug: parts[1] || 'boyfriend-doesnt-want-marriage-vs-stayed-after-cheating' };
  }
  if (first === 'court') {
    if (parts[1]) {
      return { type: 'court', slug: parts[1] };
    }
    return { type: 'court_list' };
  }
  if (first === 'boards') {
    if (parts[1]) {
      return { type: 'question', slug: parts[1] };
    }
    return { type: 'question_list' };
  }
  if (first === 'regrets') {
    return { type: 'regret_stories' };
  }
  if (first === 'country') {
    return { type: 'country', slug: parts[1] || 'usa' };
  }
  if (first === 'tag') {
    return { type: 'tag', slug: parts[1] || 'cheating' };
  }
  if (first === 'lodge' || first === 'submit' || first === 'submit-story') {
    return { type: 'question_list' };
  }

  // Fallback
  return { type: 'home' };
}

export function getRelativePath(screen: { type: string; slug?: string }): string {
  switch (screen.type) {
    case 'home':
      return '/';
    case 'explore':
      return '/explore';
    case 'regret_stories':
      return '/regrets';
    case 'situation':
      return `/decision/${screen.slug || 'boyfriend-doesnt-want-marriage'}`;
    case 'compare':
      return `/compare/${screen.slug || 'boyfriend-doesnt-want-marriage-vs-stayed-after-cheating'}`;
    case 'court_list':
      return '/court';
    case 'court':
      return `/court/${screen.slug}`;
    case 'question_list':
      return '/boards';
    case 'question':
      return `/boards/${screen.slug}`;
    case 'country':
      return `/country/${screen.slug || 'usa'}`;
    case 'tag':
      return `/tag/${screen.slug || 'cheating'}`;
    case 'submit_story':
      return '/boards';
    default:
      return '/';
  }
}

export default function App() {
  const [store, setStore] = useState(() => getInitialState());
  const [currentScreen, setScreen] = useState<{ type: string; slug?: string }>(() => {
    return parsePath(window.location.pathname);
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('before_regret_admin_mode') === 'true';
  });

  // Dynamically update document title and URL parameters for SEO and native back/forward behaviors!
  useEffect(() => {
    // Determine dynamic page metadata based on clean routes
    let title = "BeforeRegret — See what happened before making the same decision.";
    let description = "BeforeRegret is an interactive ledger of crowdsourced anonymous relationship timeline stories on marriage, cheating, and commitment regrets.";
    const displaySlug = currentScreen.slug ? currentScreen.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    
    switch (currentScreen.type) {
      case 'home':
        title = "BeforeRegret — Relationship Decisional Outcomes & Lessons";
        description = "Analyze crowd-sourced anonymous timeline stories on marriage, cheating, cohabitation, and family commitments before making major life decisions.";
        break;
      case 'explore':
        title = "Explore Decisional Outcomes | BeforeRegret";
        description = "Browse real relationship categories and outcome dossiers grouped by decision, gender, age, and country.";
        break;
      case 'situation': {
        const currentSit = PRESEEDED_SITUATIONS.find(s => s.slug === currentScreen.slug);
        const sName = currentSit ? currentSit.name : (displaySlug || 'Relationship Decision');
        title = `Should I ${sName}? Real Outcomes & Regrets | BeforeRegret`;
        description = `Access crowd-sourced demographics, average regret curves, and 100% anonymous stories on "${sName}".`;
        break;
      }
      case 'compare': {
        const parts = (currentScreen.slug || 'boyfriend-doesnt-want-marriage-vs-stayed-after-cheating').split('-vs-');
        const d1 = parts[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Decision Alpha';
        const d2 = parts[1]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Decision Beta';
        title = `Compare ${d1} vs ${d2} | Relationship Decision Ledger`;
        description = `Raw side-by-side comparative analysis of ${d1} vs ${d2}. Check relationship split rates, average regret ratings, and demographic stats.`;
        break;
      }
      case 'court_list':
        title = "Peers Jury Tribunal - Give Judgement on Relationship Evidence | BeforeRegret";
        description = "Deliberate and vote on user-lodged relationship conflict trials. Defend arguments as an anonymous juror citizen.";
        break;
      case 'court': {
        const courtCaseObj = store.courtCases.find(c => c.slug === currentScreen.slug);
        const cTitle = courtCaseObj ? courtCaseObj.title : (displaySlug || 'Relationship Case');
        title = `Relationship Jury Trial: "${cTitle}" | BeforeRegret`;
        description = `Review active relationship trial: "${cTitle}" in the public citizens tribunal. Vote on verdict options and write arguments.`;
        break;
      }
      case 'question_list':
        title = "Community Advice Boards - Ask Survivor Veterans | BeforeRegret";
        description = "Browse advice and questions from individuals facing major relationship crises answered by veteran survivors.";
        break;
      case 'question': {
        const questionObj = store.questions.find(q => q.slug === currentScreen.slug);
        const qTitle = questionObj ? questionObj.title : (displaySlug || 'Relationship Board');
        title = `Survivor Q&A advice: "${qTitle}" | BeforeRegret`;
        description = `Ask seasoned survivors and read Q&A advice for: "${qTitle}". Read community responses and view active polls.`;
        break;
      }
      case 'country': {
        const countryName = currentScreen.slug ? currentScreen.slug.toUpperCase() : 'Global';
        title = `Relationship Decisions, Regrets & Outcomes in ${countryName} | BeforeRegret`;
        description = `Explore demographic logs, regret curves, and relationship split rates from citizens facing relationship decisions in ${countryName}.`;
        break;
      }
      case 'tag':
        title = `Choice Outcomes matching "${displaySlug}" | BeforeRegret`;
        description = `Analyze community outcomes, average regrets, and survivor guidelines classified under dynamic category keyword: #${displaySlug}.`;
        break;
      case 'submit_story':
        title = "Lodge Relationship Advice Board Request | BeforeRegret";
        description = "Get constructive, real-world advice comments from timeline survivors anonymous and secure.";
        break;
    }
    
    document.title = title;

    // Set Programmatic SEO meta tags for search engine crawlers
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      const el = document.createElement('meta');
      el.name = 'description';
      el.content = description;
      document.head.appendChild(el);
    }

    const setOgTag = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (el) {
        el.setAttribute('content', content);
      } else {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        el.setAttribute('content', content);
        document.head.appendChild(el);
      }
    };

    const path = getRelativePath(currentScreen);
    const origin = window.location.origin || 'https://beforeregret.org';
    const canonicalUrl = `${origin}${path}`;

    setOgTag('og:title', title);
    setOgTag('og:description', description);
    setOgTag('og:url', canonicalUrl);
    setOgTag('og:type', 'website');
    setOgTag('og:site_name', 'BeforeRegret');

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // Push states to native HTML5 REST history pathnames
    if (window.location.pathname !== path) {
      window.history.pushState({ type: currentScreen.type, slug: currentScreen.slug }, '', path);
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
        setScreen(parsePath(window.location.pathname));
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
  const [showSubmitQuestion, setShowSubmitQuestion] = useState<boolean>(false);
  const [isQuestionsLoaded, setIsQuestionsLoaded] = useState<boolean>(false);

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
              submittedStories: [],
              submittedRedFlags: [],
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
      setStore(prev => {
        // Keep ONLY local preseeded stories that do not start with 'usr_'
        const preseededStories = prev.stories.filter(s => !s.id.startsWith('usr_'));
        // Standard user-submitted stories from Firestore are merged cleanly
        const combined = [...fsStories, ...preseededStories];
        const uniqueStories = combined.filter((s, idx, self) => 
          self.findIndex(t => t.id === s.id) === idx
        );
        return { ...prev, stories: uniqueStories };
      });
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

    // 4. Real-Time Subscription to Questions / Advice Requests
    const questionsCol = collection(db, "questions");
    const unsubscribeQuestions = onSnapshot(questionsCol, (snapshot) => {
      const fsQuestions: Question[] = [];
      snapshot.forEach((snapDoc) => {
        fsQuestions.push(snapDoc.data() as Question);
      });
      if (snapshot.empty) {
        import('./data/mockData').then(({ PRESEEDED_QUESTIONS }) => {
          PRESEEDED_QUESTIONS.forEach(q => {
            saveQuestionToFirestore(q).catch(err => console.error("Seed error:", err));
          });
        });
      }
      setStore(prev => {
        const combined = [...fsQuestions, ...prev.questions];
        const uniqueQuestions = combined.filter((q, idx, self) => 
          self.findIndex(t => t.slug === q.slug) === idx
        );
        return { ...prev, questions: uniqueQuestions };
      });
      setIsQuestionsLoaded(true);
    }, (error) => {
      console.error("Firestore questions subscription error: ", error);
      setIsQuestionsLoaded(true);
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeAuth();
      unsubscribeStories();
      unsubscribeComments();
      unsubscribeQuestions();
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
      submittedStories: [],
      submittedRedFlags: [],
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
    const commentId = 'comment_' + Math.random().toString(36).substring(2, 9);
    const authorId = currentUser ? currentUser.uid : 'guest_' + Math.random().toString(36).substring(2, 9);
    const authorName = currentUser ? (currentUser.displayName || 'Google Seeker') : `@${guestNickName.trim() || 'Wandering_Seeker'}`;
    const authorPhoto = currentUser ? (currentUser.photoURL || undefined) : undefined;

    const newComment: StoryComment = {
      id: commentId,
      storyId: storyId,
      authorId: authorId,
      authorName: authorName,
      authorPhoto: authorPhoto,
      text: text,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    await saveCommentToFirestore(newComment);
    setComments(prev => {
      const filtered = prev.filter(c => c.id !== newComment.id);
      return [...filtered, newComment];
    });
    showToast("💬 Response advice registered successfully!");
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentFromFirestore(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast("🗑️ Response advice comment deleted!");
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      showToast(`❌ Delete failed: ${err.message}`);
    }
  };


  const handleCaseRetrieve = (caseNum: string) => {
    const trimmed = caseNum.trim().toUpperCase().replace(/\s+/g, '');
    if (!trimmed) return;

    // Direct exact matches first
    const exactCourt = store.courtCases.find(
      c => c.caseNumber?.toUpperCase() === trimmed || c.slug?.toUpperCase() === trimmed
    );
    if (exactCourt) {
      setScreen({ type: 'court', slug: exactCourt.slug });
      showToast(`⚖️ Court Case ${exactCourt.caseNumber} retrieved successfully!`);
      return;
    }

    const exactStory = store.stories.find(
      s => s.caseNumber?.toUpperCase() === trimmed || s.id?.toUpperCase() === trimmed
    );
    if (exactStory) {
      setScreen({ type: 'situation', slug: exactStory.situationSlug });
      setHighlightedStoryId(exactStory.id);
      showToast(`📂 Case ${exactStory.caseNumber} retrieved! viewing inside folder.`);
      
      // Attempt smooth scroll
      setTimeout(() => {
        const element = document.getElementById(`story-${exactStory.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return;
    }

    // Now do smart fuzzy/shorthand matches
    // E.g., someone types "S1234", "C2001", "F3001", "1234", "CASE-S1234", "CASE-C2001", "CASE-F3001"
    const cleaned = trimmed.replace('CASE-', ''); // Remove CASE- prefix if present. e.g. "S1234", "C2001", "1234", "F3001"
    
    // If it starts with S or is numeric and corresponds to stories (since preseeded stories are S1001-S1030 vs court C2001-C2010 etc)
    const isStoryPattern = cleaned.startsWith('S') || (/^\d+$/.test(cleaned) && parseInt(cleaned, 10) < 2000);
    const isCourtPattern = cleaned.startsWith('C') || (/^\d+$/.test(cleaned) && parseInt(cleaned, 10) >= 2000 && parseInt(cleaned, 10) < 3000);
    const isRedFlagPattern = cleaned.startsWith('F') || (/^\d+$/.test(cleaned) && parseInt(cleaned, 10) >= 3000);

    const numericPart = cleaned.replace(/^[SCF]/, ''); // e.g. "1234"

    if (isCourtPattern) {
      const foundCourt = store.courtCases.find(c => {
        const cNumClean = (c.caseNumber || '').toUpperCase().replace('CASE-', '').replace('C', '');
        return cNumClean === numericPart;
      });
      if (foundCourt) {
        setScreen({ type: 'court', slug: foundCourt.slug });
        showToast(`⚖️ Court Case ${foundCourt.caseNumber} retrieved successfully!`);
        return;
      }
    }

    if (isStoryPattern) {
      const foundStory = store.stories.find(s => {
        const sNumClean = (s.caseNumber || '').toUpperCase().replace('CASE-', '').replace('S', '');
        return sNumClean === numericPart;
      });
      if (foundStory) {
        setScreen({ type: 'situation', slug: foundStory.situationSlug });
        setHighlightedStoryId(foundStory.id);
        showToast(`📂 Case ${foundStory.caseNumber} retrieved! viewing inside folder.`);
        
        // Attempt smooth scroll
        setTimeout(() => {
          const element = document.getElementById(`story-${foundStory.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
        return;
      }
    }

    if (isRedFlagPattern) {
      const foundFlag = store.redFlagCases.find(f => {
        const fNumClean = (f.caseNumber || '').toUpperCase().replace('CASE-', '').replace('F', '');
        return fNumClean === numericPart;
      });
      if (foundFlag) {
        setScreen({ type: 'red_flag_meter', slug: foundFlag.id });
        showToast(`🏁 Red Flag Dilemma ${foundFlag.caseNumber} retrieved successfully!`);
        return;
      }
    }

    // Fallback: search any case containing the input
    const fallbackCourt = store.courtCases.find(
      c => c.caseNumber?.toUpperCase().includes(cleaned) || c.title.toLowerCase().includes(cleaned.toLowerCase())
    );
    if (fallbackCourt) {
      setScreen({ type: 'court', slug: fallbackCourt.slug });
      showToast(`⚖️ Court Case ${fallbackCourt.caseNumber} retrieved successfully!`);
      return;
    }

    const fallbackStory = store.stories.find(
      s => s.caseNumber?.toUpperCase().includes(cleaned) || s.title.toLowerCase().includes(cleaned.toLowerCase())
    );
    if (fallbackStory) {
      setScreen({ type: 'situation', slug: fallbackStory.situationSlug });
      setHighlightedStoryId(fallbackStory.id);
      showToast(`📂 Case ${fallbackStory.caseNumber} retrieved!`);
      
      setTimeout(() => {
        const element = document.getElementById(`story-${fallbackStory.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return;
    }

    const fallbackRedFlag = store.redFlagCases.find(
      f => f.caseNumber?.toUpperCase().includes(cleaned) || f.title.toLowerCase().includes(cleaned.toLowerCase())
    );
    if (fallbackRedFlag) {
      setScreen({ type: 'red_flag_meter', slug: fallbackRedFlag.id });
      showToast(`🏁 Red Flag Dilemma ${fallbackRedFlag.caseNumber} retrieved!`);
      return;
    }

    showToast(`❌ Case ID "${caseNum}" not found. Verify character spelling.`);
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
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newlyLodgedCase, setNewlyLodgedCase] = useState<{ 
    title: string; 
    caseNumber: string; 
    type: 'story' | 'court';
    id?: string;
    slug?: string;
  } | null>(null);
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(null);

  // Keep track of what cases and polls the user has already voted on
  const [userVotedCases, setUserVotedCases] = useState<{ [slug: string]: string }>(() => {
    const saved = localStorage.getItem('before_regret_court_votes');
    return saved ? JSON.parse(saved) : {};
  });

  const [userVotedQuestions, setUserVotedQuestions] = useState<{ [slug: string]: string }>(() => {
    const saved = localStorage.getItem('before_regret_question_votes');
    return saved ? JSON.parse(saved) : {};
  });

  const [userVotedFlags, setUserVotedFlags] = useState<{ [caseId: string]: 'green' | 'yellow' | 'red' }>(() => {
    const saved = localStorage.getItem('before_regret_flag_votes');
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

  useEffect(() => {
    localStorage.setItem('before_regret_flag_votes', JSON.stringify(userVotedFlags));
  }, [userVotedFlags]);

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
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `CASE-S${randomNum}`;
    
    newStory.id = newStory.id || 'story_' + Math.random().toString(36).substring(2, 9);
    newStory.caseNumber = caseNumber;

    // Save to local storage private list
    try {
      const myCases = JSON.parse(localStorage.getItem('beforeregret_my_cases') || '[]');
      myCases.push({
        caseNumber: caseNumber,
        title: newStory.title,
        slug: newStory.situationSlug,
        type: 'story'
      });
      localStorage.setItem('beforeregret_my_cases', JSON.stringify(myCases));
    } catch (e) {
      console.error(e);
    }

    // Save story model securely to cloud firestore database
    await saveStoryToFirestore(newStory);

    setStore(prev => {
      const combined = [newStory, ...prev.stories];
      const updatedStories = combined.filter((s, idx, self) => 
        self.findIndex(t => t.id === s.id) === idx
      );
      
      const updatedUser: UserProfile = {
        ...prev.user,
        storiesSubmitted: prev.user.storiesSubmitted + 1,
        submittedStories: [...(prev.user.submittedStories || []), newStory.id],
        recentActivity: [
          {
            type: 'story_added',
            detail: `Archived dynamic outcome log for "${newStory.title}" as Case ${caseNumber}`,
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

    showToast(`🎉 Your regret story was successfully submitted to the registry.`);
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

      const detailMsg = isSaved ? "Removed timeline bookmark" : "Bookmarked timeline story";

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

      showToast(isSaved ? "Bookmark cleared." : "📁 Timeline bookmarked successfully.");

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

  const handleVoteFlag = (caseId: string, flagType: 'green' | 'yellow' | 'red') => {
    setStore(prev => {
      const idx = prev.redFlagCases.findIndex(c => c.id === caseId);
      if (idx === -1) return prev;

      const updated = [...prev.redFlagCases];
      updated[idx] = {
        ...updated[idx],
        votes: {
          ...updated[idx].votes,
          [flagType]: updated[idx].votes[flagType] + 1
        }
      };

      return {
        ...prev,
        redFlagCases: updated
      };
    });

    setUserVotedFlags(prev => ({ ...prev, [caseId]: flagType }));
    showToast("🏁 Flag vote registered! Viewing live statistics.");
  };

  const handleAddFlagComment = (caseId: string, text: string) => {
    setStore(prev => {
      const idx = prev.redFlagCases.findIndex(c => c.id === caseId);
      if (idx === -1) return prev;

      const updated = [...prev.redFlagCases];
      const commentObj = {
        id: 'flag_cmt_' + Date.now().toString(),
        author: prev.user.username,
        text,
        date: new Date().toISOString().split('T')[0]
      };

      updated[idx] = {
        ...updated[idx],
        comments: [...(updated[idx].comments || []), commentObj]
      };

      return {
        ...prev,
        redFlagCases: updated
      };
    });
    showToast("💬 Comment posted to Warning board.");
  };

  const handleAddFlagCase = (
    title: string, 
    description: string, 
    category: 'Communication' | 'Exes & Socials' | 'Trust & Privacy' | 'Control & Habits' | 'Other'
  ) => {
    setStore(prev => {
      const caseId = 'rf_' + Date.now().toString();
      const nextNum = 3001 + prev.redFlagCases.length;
      const caseNumber = `CASE-F${nextNum}`;
      
      const newCase: RedFlagCase = {
        id: caseId,
        caseNumber,
        title,
        description,
        category,
        votes: { green: 0, yellow: 0, red: 0 },
        comments: [],
        author: prev.user.username,
        dateAdded: new Date().toISOString().split('T')[0]
      };

      showToast(`🏁 Lodged Category ${category} Dilemma: ${caseNumber}`);

      const updatedUser: UserProfile = {
        ...prev.user,
        submittedRedFlags: [...(prev.user.submittedRedFlags || []), caseId],
        recentActivity: [
          {
            type: 'story_added',
            detail: `Filed Red Flag Assessment for "${title}" as Case ${caseNumber}`,
            date: 'Just now'
          },
          ...prev.user.recentActivity
        ]
      };

      return {
        ...prev,
        redFlagCases: [newCase, ...prev.redFlagCases],
        user: updatedUser
      };
    });
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

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `CASE-C${randomNum}`;

    const newCase: CourtCase = {
      slug: uniqueSlug,
      caseNumber: caseNumber,
      title: caseData.title,
      description: caseData.description,
      postTime: new Date().toISOString().split('T')[0],
      author: "anonymous_litigant",
      votes: {
        me: 0,
        partner: 0,
        both: 0,
        neither: 0
      },
      arguments: [],
      tags: caseData.tags
    };

    // Save to local storage private list
    try {
      const myCases = JSON.parse(localStorage.getItem('beforeregret_my_cases') || '[]');
      myCases.push({
        caseNumber: caseNumber,
        title: newCase.title,
        slug: newCase.slug,
        type: 'court'
      });
      localStorage.setItem('beforeregret_my_cases', JSON.stringify(myCases));
    } catch (e) {
      console.error(e);
    }

    setStore(prev => ({
      ...prev,
      courtCases: [newCase, ...prev.courtCases]
    }));

    setNewlyLodgedCase({ 
      title: newCase.title, 
      caseNumber: caseNumber, 
      type: 'court',
      slug: newCase.slug
    });
    showToast(`⚖️ Court case registered successfully under Case Key: ${caseNumber}!`);
  };

  const handleVoteQuestionPoll = (slug: string, optionText: string) => {
    setStore(prev => {
      const idx = prev.questions.findIndex(q => q.slug === slug);
      if (idx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[idx] };

      const optIdx = question.pollOptions.findIndex(o => o.text === optionText);
      if (optIdx !== -1) {
        const updatedPoll = [...question.pollOptions];
        updatedPoll[optIdx] = { ...updatedPoll[optIdx], votes: updatedPoll[optIdx].votes + 1 };
        question.pollOptions = updatedPoll;
      }

      updatedQuestions[idx] = question;

      saveQuestionToFirestore(question).catch(err => {
        console.error("Firestore poll vote save error:", err);
      });

      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });

    setUserVotedQuestions(prev => ({ ...prev, [slug]: optionText }));
    showToast("🗳️ Poll opinion registered. Charts refreshed.");
  };

  const handleAddQuestionAnswer = (slug: string, text: string) => {
    setStore(prev => {
      const idx = prev.questions.findIndex(q => q.slug === slug);
      if (idx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[idx] };

      const newAnswer = {
        id: 'ans_' + Date.now().toString(),
        author: prev.user.username,
        text,
        votes: 0,
        isOutcomeVerified: prev.user.storiesSubmitted > 0,
        date: 'Just now'
      };

      question.answers = [newAnswer, ...question.answers];
      updatedQuestions[idx] = question;

      saveQuestionToFirestore(question).catch(err => {
        console.error("Firestore advice answer save error:", err);
      });

      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });

    showToast("🎓 Answer broadcasted onto peer-help logs!");
  };

  const handleAddAnswerComment = (qSlug: string, ansId: string, text: string) => {
    setStore(prev => {
      const qIdx = prev.questions.findIndex(q => q.slug === qSlug);
      if (qIdx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[qIdx] };

      const ansIdx = question.answers.findIndex(a => a.id === ansId);
      if (ansIdx === -1) return prev;

      const answer = { ...question.answers[ansIdx] };
      const comments = answer.comments ? [...answer.comments] : [];

      const newComment = {
        id: 'cmt_' + Date.now().toString(),
        author: prev.user.username,
        text,
        date: 'Just now'
      };

      answer.comments = [...comments, newComment];
      question.answers = [...question.answers];
      question.answers[ansIdx] = answer;
      updatedQuestions[qIdx] = question;

      saveQuestionToFirestore(question).catch(err => {
        console.error("Firestore reply comment save error:", err);
      });

      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });

    showToast("💬 Discussion comment posted under advice!");
  };

  const handleUpvoteAnswer = (qSlug: string, ansId: string) => {
    setStore(prev => {
      const qIdx = prev.questions.findIndex(q => q.slug === qSlug);
      if (qIdx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[qIdx] };

      const ansIdx = question.answers.findIndex(a => a.id === ansId);
      if (ansIdx === -1) return prev;

      const answer = { ...question.answers[ansIdx] };
      answer.votes += 1;

      question.answers = [...question.answers];
      question.answers[ansIdx] = answer;
      updatedQuestions[qIdx] = question;

      saveQuestionToFirestore(question).catch(err => {
        console.error("Firestore answer upvote save error:", err);
      });

      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });

    showToast("👍 Upvote saved!");
  };

  const handleCreateQuestion = (newQuestion: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    pollOptions: string[];
  }) => {
    const slug = newQuestion.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const formattedPollOptions = newQuestion.pollOptions.map(o => ({ text: o, votes: 0 }));

    const questionObj: Question = {
      slug,
      title: newQuestion.title,
      description: newQuestion.description,
      category: newQuestion.category,
      storiesCount: 0,
      tags: newQuestion.tags.length > 0 ? newQuestion.tags : ["user-submitted", newQuestion.category.toLowerCase().replace(/\s+/g, '-')],
      pollOptions: formattedPollOptions,
      answers: []
    };

    saveQuestionToFirestore(questionObj).catch(err => {
      console.error("Firestore custom question create error:", err);
    });

    setStore(prev => {
      const updatedQuestions = [questionObj, ...prev.questions];
      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });

    showToast("✓ Advice request successfully broadcasted!");
  };

  const handleDeleteStory = (storyId: string) => {
    // Delete from Firestore storage
    deleteStoryFromFirestore(storyId).catch(err => {
      console.error("Firestore story delete error:", err);
    });

    setStore(prev => {
      const updatedStories = prev.stories.filter(s => s.id !== storyId);
      const newState = {
        ...prev,
        stories: updatedStories
      };
      saveState(newState);
      return newState;
    });
    showToast("⚖️ User story post has been permanently expunged by administrator.");
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
      const newState = {
        ...prev,
        stories: updatedStories
      };
      saveState(newState);
      return newState;
    });
    showToast("✍️ User story post updated successfully by administrator.");
  };

  const handleDeleteCourtCase = (slug: string) => {
    setStore(prev => {
      const updatedCases = prev.courtCases.filter(c => c.slug !== slug);
      const newState = {
        ...prev,
        courtCases: updatedCases
      };
      saveState(newState);
      return newState;
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
      const newState = {
        ...prev,
        courtCases: updatedCases
      };
      saveState(newState);
      return newState;
    });
    showToast("⚖️ Juror argument has been permanently expunged by administrator.");
  };

  const handleDeleteQuestion = (slug: string) => {
    setStore(prev => {
      const updatedQuestions = prev.questions.filter(q => q.slug !== slug);
      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });
    showToast("⚖️ Survival Q&A thread has been permanently expunged by administrator.");
  };

  const handleDeleteAnswer = (qSlug: string, ansId: string) => {
    setStore(prev => {
      const qIdx = prev.questions.findIndex(q => q.slug === qSlug);
      if (qIdx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[qIdx] };
      question.answers = question.answers.filter(a => a.id !== ansId);
      updatedQuestions[qIdx] = question;

      saveQuestionToFirestore(question).catch(err => {
        console.error("Firestore advice answer delete error:", err);
      });

      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });
    showToast("⚖️ Survivor advice answer has been permanently expunged by administrator.");
  };

  const handleDeleteAnswerComment = (qSlug: string, ansId: string, commentId: string) => {
    setStore(prev => {
      const qIdx = prev.questions.findIndex(q => q.slug === qSlug);
      if (qIdx === -1) return prev;

      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[qIdx] };

      const ansIdx = question.answers.findIndex(a => a.id === ansId);
      if (ansIdx === -1) return prev;

      const answer = { ...question.answers[ansIdx] };
      answer.comments = (answer.comments || []).filter(c => c.id !== commentId);
      
      question.answers = [...question.answers];
      question.answers[ansIdx] = answer;
      updatedQuestions[qIdx] = question;

      saveQuestionToFirestore(question).catch(err => {
        console.error("Firestore reply comment delete error:", err);
      });

      const newState = {
        ...prev,
        questions: updatedQuestions
      };
      saveState(newState);
      return newState;
    });
    showToast("🗑️ Discussion comment deleted by administrator.");
  };

  return (
    <div className="bg-[#FAF8F2] text-[#1F2937] min-h-screen flex flex-col font-sans">
      
      {/* Primary Top Nav */}
      <Navigation
        currentScreen={currentScreen}
        setScreen={setScreen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onCaseRetrieve={handleCaseRetrieve}
        stories={store.stories}
        courtCases={store.courtCases}
        onOpenLedger={() => setIsLedgerOpen(true)}
      />

      {/* Anonymous Submissions Ledger Modal */}
      <MySubmissionsLedger
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        user={store.user}
        stories={store.stories}
        redFlagCases={store.redFlagCases}
        setScreen={setScreen}
        onSelectStory={(storyId) => {
          const found = store.stories.find(s => s.id === storyId);
          if (found) {
            setScreen({ type: 'situation', slug: found.situationSlug });
            setHighlightedStoryId(storyId);
            setTimeout(() => {
              const el = document.getElementById(`story-${storyId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 600);
          }
        }}
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
            onCaseRetrieve={handleCaseRetrieve}
          />
        )}

        {currentScreen.type === 'explore' && (
          <ExploreScreen
            situations={liveSituations}
            stories={store.stories}
            courtCases={store.courtCases}
            setScreen={setScreen}
            onCaseRetrieve={handleCaseRetrieve}
            initialSearchTerm={currentScreen.slug}
          />
        )}

        {currentScreen.type === 'situation' && (
          <SituationScreen
            situation={liveSituations.find(s => s.slug === currentScreen.slug) || liveSituations[0]}
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
            onDeleteComment={handleDeleteComment}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
            highlightedStoryId={highlightedStoryId}
          />
        )}

        {currentScreen.type === 'compare' && (
          <CompareScreen
            slug1={(currentScreen.slug || '').split('-vs-')[0] || 'boyfriend-doesnt-want-marriage'}
            slug2={(currentScreen.slug || '').split('-vs-')[1] || 'stayed-after-cheating'}
            situations={liveSituations}
            setScreen={setScreen}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] border border-[#30363D] p-5 rounded-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-purple-400" /> Community Advice Boards
                </h1>
                <p className="text-xs text-[#AAB2C0]">Explore hard relationship questions answered directly by veteran survivors or submit your own dilemma.</p>
              </div>
              {!showSubmitQuestion && (
                <button
                  onClick={() => setShowSubmitQuestion(true)}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 font-extrabold text-xs text-white px-4 py-2.5 shadow-lg shadow-purple-500/10 transition-all active:scale-[0.98] self-start sm:self-center"
                >
                  + Post Advice Request
                </button>
              )}
            </div>

            {showSubmitQuestion ? (
              <SubmitQuestionForm
                onClose={() => setShowSubmitQuestion(false)}
                onSubmit={(newQ) => {
                  handleCreateQuestion(newQ);
                  setShowSubmitQuestion(false);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {store.questions.map(q => (
                  <div
                    key={q.slug}
                    onClick={() => setScreen({ type: 'question', slug: q.slug })}
                    className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 cursor-pointer hover:border-purple-500 transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between h-48"
                  >
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        {q.category}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">"{q.title}"</h3>
                      <p className="text-xs text-[#AAB2C0] line-clamp-3 leading-relaxed font-serif">{q.description}</p>
                    </div>
                    <div className="border-t border-[#30363D]/40 pt-2.5 mt-2 flex items-center justify-between text-[10px] text-zinc-550">
                      <span>{q.answers.length} community advices</span>
                      <span className="text-purple-400 font-semibold">View thread →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentScreen.type === 'question' && (() => {
          const found = store.questions.find(q => q.slug === currentScreen.slug);
          if (!found) {
            if (!isQuestionsLoaded) {
              return (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-zinc-400 font-medium font-mono">Connecting with database registry...</p>
                </div>
              );
            } else {
              return (
                <div className="flex flex-col items-center justify-center p-16 text-center space-y-6 max-w-md mx-auto">
                  <div className="h-14 w-14 rounded-full bg-red-400/10 text-red-500 flex items-center justify-center">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">Advice Board Request Expired</h2>
                    <p className="text-xs text-[#AAB2C0]/85 mt-2">The requested timeline advice dilemma does not exist or has been deleted by an administrator.</p>
                  </div>
                  <button
                    onClick={() => setScreen({ type: 'question_list' })}
                    className="px-4 py-2 text-xs font-bold bg-[#1e142e] border border-purple-500/20 text-purple-400 rounded-xl hover:border-purple-500/40 transition-colors"
                  >
                    Back to Advice Boards
                  </button>
                </div>
              );
            }
          }
          return (
            <QuestionScreen
              question={found}
              setScreen={setScreen}
              onVoteQuestionPoll={handleVoteQuestionPoll}
              onAddQuestionAnswer={handleAddQuestionAnswer}
              onAddAnswerComment={handleAddAnswerComment}
              onUpvoteAnswer={handleUpvoteAnswer}
              userVotedQuestions={userVotedQuestions}
              isAdmin={isAdmin}
              onDeleteAnswer={handleDeleteAnswer}
              onDeleteQuestion={handleDeleteQuestion}
              onDeleteAnswerComment={handleDeleteAnswerComment}
            />
          );
        })()}

        {currentScreen.type === 'regret_stories' && (
          <RegretStoriesScreen
            stories={store.stories}
            situations={liveSituations}
            onVoteHelpful={handleVoteHelpful}
            onSubmitStory={handleAddStory}
            setScreen={setScreen}
            isAdmin={isAdmin}
            onDeleteStory={handleDeleteStory}
            initialSituationSlug={currentScreen.slug}
          />
        )}

        {currentScreen.type === 'red_flag_meter' && (
          <RedFlagMeterScreen
            redFlagCases={store.redFlagCases || []}
            setScreen={setScreen}
            onVoteFlag={handleVoteFlag}
            onAddFlagComment={handleAddFlagComment}
            onAddFlagCase={handleAddFlagCase}
            userVotedFlags={userVotedFlags}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
            initialCaseId={currentScreen.slug}
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
            onDeleteComment={handleDeleteComment}
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
            onDeleteComment={handleDeleteComment}
            currentUser={currentUser}
            onGoogleLogin={handleGoogleLogin}
          />
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
      {/* ⚖️ Newly Lodged Case Success Modal */}
      {newlyLodgedCase && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-zinc-300">
          <div className="w-full max-w-sm bg-[#161B22] border-2 border-[#F4B942]/30 shadow-2xl rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#F4B942] to-amber-500" />
            
            <div className="mx-auto w-14 h-14 bg-[#F4B942]/10 border border-[#F4B942]/30 rounded-2xl flex items-center justify-center text-[#F4B942] mb-4">
              <Gavel className="h-6 w-6" />
            </div>

            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
              Dispute Lodged in Registry
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Your case has been logged securely. Your extreme privacy is 100% protected.
            </p>

            {/* Case Number Badge */}
            <div className="my-5 bg-[#0D1117] border border-[#30363D] rounded-xl p-3.5">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest font-mono block mb-1">YOUR UNIQUE CASE ID</span>
              <div className="flex items-center justify-center gap-1.5">
                <code className="text-lg font-black text-[#F4B942] font-mono tracking-wider select-all">
                  {newlyLodgedCase.caseNumber}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyLodgedCase.caseNumber);
                    showToast("📋 Case Number Copied to Clipboard!");
                  }}
                  className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#30363D] text-zinc-400 hover:text-white border border-[#30363D] transition-all"
                  title="Copy Case Number"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-[#1C2128] border border-[#30363D]/60 rounded-xl p-3 text-left text-[10px] text-zinc-400 leading-relaxed mb-4">
              <p className="font-bold text-zinc-200">💡 No Logins or Passwords Required:</p>
              <p className="mt-1">
                To protect complete privacy, accounts are not used. Write down or copy your case ID. You can put this in the <strong className="text-white font-bold">RETRIEVE CASE</strong> search bar in the top navigation anytime to locate your case in an instant.
              </p>
            </div>

            <button
              onClick={() => {
                const temp = newlyLodgedCase;
                setNewlyLodgedCase(null);
                if (temp.type === 'story') {
                  setScreen({ type: 'situation', slug: temp.slug || 'boyfriend-doesnt-want-marriage' });
                  if (temp.id) {
                    setHighlightedStoryId(temp.id);
                    setTimeout(() => {
                      const element = document.getElementById(`story-${temp.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 600);
                  }
                } else {
                  setScreen({ type: 'court', slug: temp.slug || 'court_list' });
                }
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-black text-white transition-all uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer"
            >
              Go to My Submitted Case Dossier ➔
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
