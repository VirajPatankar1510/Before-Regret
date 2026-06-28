import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Compass, HelpCircle, Heart, ShieldCheck, Gavel, Globe, Clock, PlusCircle, Bookmark, ArrowRight, ChevronRight, AlertTriangle, Monitor, RotateCcw, Share2, Info, X, BookOpen, Copy, Plus } from 'lucide-react';

// Reusable custom components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import SubmitStoryForm from './components/SubmitStoryForm';
import SubmitQuestionForm from './components/SubmitQuestionForm';
import RegisterCaseForm from './components/RegisterCaseForm';
import AdminPanel from './components/AdminPanel';

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
import HubScreen from './pages/HubScreen';
import AdminFeedScreen from './pages/AdminFeedScreen';
import LegalScreen from './pages/LegalScreen';
import GuidesScreen from './pages/GuidesScreen';
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
  onSnapshot,
  doc,
  deleteDoc
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
  fetchQuestionsFromFirestore,
  saveCourtCaseToFirestore,
  saveRedFlagCaseToFirestore,
  deleteCourtCaseFromFirestore,
  deleteQuestionFromFirestore
} from './lib/firestoreService';

// RESTful Route Pathname Helpers for Clean Semantic Dynamic pSEO
export function getSEOHeadingForSituation(slug: string, fallbackName: string): string {
  switch (slug) {
    case 'boyfriend-doesnt-want-marriage':
      return "Will I Regret Staying If My Boyfriend Doesn't Want Marriage?";
    case 'stayed-after-cheating':
      return "Will I Regret Staying After Cheating? Forgiveness Statistics & Outcomes";
    case 'partner-doesnt-want-kids':
      return "Will I Regret Staying With a Partner Who Doesn't Want Kids?";
    case 'moved-for-love':
      return "Should I Move for Love? Relocation Regrets & Survival Rates";
    case 'long-distance-relationship':
      return "Are Long Distance Relationships Worth It? Split Rates & Regret Curves";
    case 'different-religion-marriage':
      return "Do Interfaith Marriages Work? Religion Friction & Outcome Statistics";
    case 'marriage-ultimatum':
      return "Do Marriage Ultimatums Work? Resentment Rates & Divorce Statistics";
    case 'ignored-red-flags':
      return "Will I Regret Ignoring Red Flags? Relationship Warning Outcomes";
    default:
      return `Should I ${fallbackName}? Real Outcomes & Regret Metrics`;
  }
}

export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  if (slug.includes('-')) {
    const parts = slug.split('-');
    const prefix = parts[0];
    const isPreseededStory = /^s\d+$/.test(prefix);
    const isCustomStory = prefix.startsWith('story_');
    const isRedFlag = prefix.startsWith('rf_');
    
    if (isPreseededStory || isCustomStory || isRedFlag) {
      return prefix;
    }
  }
  return slug;
}

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
  if (
    first === 'should-i-leave' || 
    first === 'will-i-regret' || 
    first === 'red-flags' || 
    first === 'relationship-regrets' || 
    first === 'commitment-issues' ||
    first === 'trust-issues' ||
    first === 'signs-he-doesnt-want-marriage' ||
    first === 'should-i-forgive-cheating' ||
    first === 'will-i-regret-divorce' ||
    first === 'red-flags-i-ignored' ||
    first === 'relationship-ultimatum'
  ) {
    return { type: 'hub', slug: first };
  }
  if (first === 'regrets') {
    if (parts[1]) {
      return { type: 'regret_stories', slug: extractIdFromSlug(parts[1]) };
    }
    return { type: 'regret_stories' };
  }
  if (first === 'flags' || first === 'redflags' || first === 'red-flags' || first === 'red-flag-meter') {
    if (parts[1]) {
      return { type: 'red_flag_meter', slug: extractIdFromSlug(parts[1]) };
    }
    return { type: 'red_flag_meter' };
  }
  if (first === 'country') {
    return { type: 'country', slug: parts[1] || 'usa' };
  }
  if (first === 'guides' || first === 'decision-guides' || first === 'editorial' || first === 'articles') {
    if (parts[1]) {
      return { type: 'guides', slug: parts[1] };
    }
    return { type: 'guides' };
  }
  if (first === 'tag') {
    return { type: 'tag', slug: parts[1] || 'cheating' };
  }
  if (first === 'legal') {
    return { type: 'legal', slug: parts[1] || 'disclaimer' };
  }
  if (first === 'privacy' || first === 'privacy-policy') {
    return { type: 'legal', slug: 'privacy' };
  }
  if (first === 'terms' || first === 'terms-of-use') {
    return { type: 'legal', slug: 'terms' };
  }
  if (first === 'disclaimer' || first === 'legal-disclaimer') {
    return { type: 'legal', slug: 'disclaimer' };
  }
  if (first === 'lodge' || first === 'submit' || first === 'submit-story') {
    return { type: 'question_list' };
  }

  // Fallback
  return { type: 'home' };
}

export function getRelativePath(screen: { type: string; slug?: string }, store?: any): string {
  switch (screen.type) {
    case 'home':
      return '/';
    case 'explore':
      return '/explore';
    case 'hub':
      return `/${screen.slug}`;
    case 'regret_stories':
      if (screen.slug) {
        if (store && store.stories) {
          const storyObj = store.stories.find((s: any) => s.id === screen.slug);
          if (storyObj && storyObj.title) {
            const titleSlug = storyObj.title
              .toLowerCase()
              .replace(/['"’]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            return `/regrets/${screen.slug}-${titleSlug}`;
          }
        }
        return `/regrets/${screen.slug}`;
      }
      return '/regrets';
    case 'red_flag_meter':
      if (screen.slug) {
        if (store && store.redFlagCases) {
          const redFlagObj = store.redFlagCases.find((rf: any) => rf.id === screen.slug);
          if (redFlagObj && redFlagObj.title) {
            const titleSlug = redFlagObj.title
              .toLowerCase()
              .replace(/['"’]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            return `/flags/${screen.slug}-${titleSlug}`;
          }
        }
        return `/flags/${screen.slug}`;
      }
      return '/flags';
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
    case 'guides':
      if (screen.slug) {
        return `/guides/${screen.slug}`;
      }
      return '/guides';
    case 'legal':
      return `/legal/${screen.slug || 'disclaimer'}`;
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
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Dynamically update document title and URL parameters for SEO and native back/forward behaviors!
  useEffect(() => {
    // Determine dynamic page metadata based on clean routes
    let title = "BeforeRegret — Relationship Decisions Before Regret";
    let description = "BeforeRegret is the ultimate decision intelligence platform for relationship regrets. Read crowdsourced anonymous story timelines, citizen jury verdicts, and red flag warnings before making life-altering choices.";
    const displaySlug = currentScreen.slug ? currentScreen.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    
    switch (currentScreen.type) {
      case 'home':
        title = "BeforeRegret — Relationship Decisions Before Regret | Relationship Court & Regrets";
        description = "Analyze crowdsourced anonymous timeline stories on marriage, cheating, cohabitation, and family commitments before making major life decisions. Vote on Red Flag warnings, hear jury trials, and write survivor guidelines.";
        break;
      case 'explore':
        title = "Explore Decisional Outcomes | BeforeRegret";
        description = "Browse real relationship categories and outcome dossiers grouped by decision, gender, age, and country.";
        break;
      case 'hub': {
        if (currentScreen.slug === 'should-i-leave') {
          title = "Should I Leave My Relationship? Breakup & Marriage Doubts | BeforeRegret";
          description = "Should I stay or should I leave my partner? Reflect on breakup decisions, marriage doubts, and read raw outcome stories from other couples facing relationship fatigue.";
        } else if (currentScreen.slug === 'will-i-regret') {
          title = "Will I Regret Leaving My Husband or Partner? Outcomes | BeforeRegret";
          description = "Will I regret leaving my husband, ending my relationship, or relocating for love? Browse real-life perspectives and 1-year later outcome timelines.";
        } else if (currentScreen.slug === 'red-flags') {
          title = "Relationship Red Flags: Warning Signs & Partner Patterns | BeforeRegret";
          description = "Is it a red flag if he still talks to his ex? Spot warning signs in dating, secretive phone habits, stonewalling, and emotional isolation patterns.";
        } else if (currentScreen.slug === 'relationship-regrets') {
          title = "Relationship Regrets Registry: Stories & Breakup Lessons | BeforeRegret";
          description = "Read real, anonymous relationship regrets and success stories. Find perspective on staying for the kids, divorce adjustment, and life-defining lessons.";
        } else if (currentScreen.slug === 'commitment-issues') {
          title = "Commitment Issues, Marriage Delays & Ultimatums | BeforeRegret";
          description = "Waiting for a proposal or wondering why your boyfriend won't marry you? Navigate commitment problems, marriage ultimatums, or children desire mismatches.";
        } else if (currentScreen.slug === 'trust-issues') {
          title = "Trust Issues: Secret Phones, Lies & Emotional Cheating | BeforeRegret";
          description = "Is your partner hiding things, keeping a secret phone, or emotionally cheating? Explore community wisdom on rebuilding trust or walking away after lies.";
        } else if (currentScreen.slug === 'signs-he-doesnt-want-marriage') {
          title = "Signs He Doesn't Want Marriage & Won't Propose | BeforeRegret";
          description = "How long should you wait for a proposal? Learn key signs he doesn't want to get married and the actual outcomes of giving a marriage ultimatum.";
        } else if (currentScreen.slug === 'should-i-forgive-cheating') {
          title = "Should I Forgive Cheating or Leave After Infidelity? | BeforeRegret";
          description = "Deciding whether to stay or leave after cheating? Read shared experiences from real couples who tried to forgive, restore trust, or chose to walk away.";
        } else if (currentScreen.slug === 'will-i-regret-divorce') {
          title = "Will I Regret Divorce? Doubts, Relief & Real Timelines | BeforeRegret";
          description = "Are you facing divorce doubts and wondering if you'll regret leaving? Explore real outcome curves, adjustment timelines, and stories 1 year later.";
        } else if (currentScreen.slug === 'red-flags-i-ignored') {
          title = "The Biggest Relationship Red Flags I Ignored: Real Stories | BeforeRegret";
          description = "Read authentic stories of red flags partners wish they hadn't ignored, from hidden bank accounts to emotional withholding in dating.";
        } else if (currentScreen.slug === 'relationship-ultimatum') {
          title = "Relationship Ultimatums: Do They Work or Cause Resentment? | BeforeRegret";
          description = "Thinking of giving an ultimatum about marriage, commitment, or moving? Read outcomes and discover healthy ways to discuss dealbreakers.";
        }
        break;
      }
      case 'situation': {
        const currentSit = PRESEEDED_SITUATIONS.find(s => s.slug === currentScreen.slug);
        const sName = currentSit ? currentSit.name : (displaySlug || 'Relationship Decision');
        const seoHeading = getSEOHeadingForSituation(currentScreen.slug || '', sName);
        title = `${seoHeading} | BeforeRegret`;
        description = `Access community-sourced perspectives, guidance points, and anonymous reflective stories on "${sName}".`;
        break;
      }
      case 'compare': {
        const parts = (currentScreen.slug || 'boyfriend-doesnt-want-marriage-vs-stayed-after-cheating').split('-vs-');
        const d1 = parts[0]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Decision Alpha';
        const d2 = parts[1]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Decision Beta';
        title = `Compare ${d1} vs ${d2} | Relationship Decision Perspectives`;
        description = `Read side-by-side comparative perspectives of ${d1} vs ${d2}. Browse shared stories and reflective qualitative insight.`;
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
        title = "Community Ask/Give Advice - Ask Survivor Veterans | BeforeRegret";
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
      case 'regret_stories': {
        if (currentScreen.slug) {
          const storyObj = store.stories.find(s => s.id === currentScreen.slug);
          const sTitle = storyObj ? storyObj.title : (displaySlug || 'Relationship Outcome');
          title = `Regret Story: "${sTitle}" | BeforeRegret`;
          description = storyObj ? storyObj.fullStory.slice(0, 155) + "..." : `Read the 100% anonymous regret story and outcomes timeline for this relationship decision.`;
        } else {
          title = "BeforeRegret Relationship Story Ledger & Regrets";
          description = "Read full timeline stories, interactive outcome statistics, and veteran survivors reports of relationship regrets.";
        }
        break;
      }
      case 'red_flag_meter': {
        if (currentScreen.slug) {
          const redFlagObj = store.redFlagCases.find(rf => rf.id === currentScreen.slug);
          const rfTitle = redFlagObj ? redFlagObj.title : (displaySlug || 'Relationship Warning');
          title = `Red Flag Dilemma: "${rfTitle}" | BeforeRegret`;
          description = redFlagObj ? redFlagObj.description.slice(0, 155) + "..." : `Cast your citizen vote on this red flag dilemma and review comments.`;
        } else {
          title = "Red Flag Dilemma Meter - Citizen Vote on Warnings | BeforeRegret";
          description = "Audit and vote on red, yellow, and green flag relationship warnings submitted anonymously by real partners.";
        }
        break;
      }
      case 'guides': {
        if (currentScreen.slug) {
          title = "Accredited Relationship Guide | BeforeRegret";
          description = "Read deep long-form editorial guides written by certified psychologists, clinical mediators, and relationship researchers.";
        } else {
          title = "Accredited Relationship Decision Guides & Science | BeforeRegret";
          description = "Read deep long-form editorial guides written by certified psychologists, clinical mediators, and relationship researchers. Learn the math of trust rebuilding and red flags.";
        }
        break;
      }
      case 'legal': {
        if (currentScreen.slug === 'privacy') {
          title = "Privacy Policy — Cookie-Free & Anonymous | BeforeRegret";
          description = "Review our strict privacy-first policy. We do not use tracking cookies or sell your relationship data. Your anonymous stories are fully secured.";
        } else if (currentScreen.slug === 'terms') {
          title = "Terms of Use — User Rules & Section 230 Protected | BeforeRegret";
          description = "Browse our terms of use, age requirements, defamation prohibition, and content license guidelines. Your stories are protected anonymously.";
        } else {
          title = "Legal Disclaimer — Professional Counseling Exclusions | BeforeRegret";
          description = "Review our binding legal disclaimer. BeforeRegret offers peer perspectives and citizen juries, not licensed therapist counseling or legal advice.";
        }
        break;
      }
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

    const path = getRelativePath(currentScreen, store);
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

    // Programmatic SEO: Inject dynamic JSON-LD structured data for rich search engine snippets (FAQ, Q&A, BlogPosting)
    let schemaJson: any = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "BeforeRegret",
      "url": origin,
      "description": "The ultimate crowdsourced decision intelligence platform for relationships. View timelines, jury trials, and red flags before making life-altering decisions."
    };

    if (currentScreen.type === 'court') {
      const courtCaseObj = store.courtCases.find((c: any) => c.slug === currentScreen.slug);
      if (courtCaseObj) {
        schemaJson = {
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          "headline": courtCaseObj.title,
          "description": courtCaseObj.description,
          "datePublished": courtCaseObj.postTime,
          "author": {
            "@type": "Person",
            "name": courtCaseObj.author || "Anonymous Juror"
          },
          "interactionStatistic": {
            "@type": "InteractionCounter",
            "interactionType": "https://schema.org/LikeAction",
            "userInteractionCount": (courtCaseObj.votes?.me || 0) + (courtCaseObj.votes?.partner || 0)
          }
        };
      }
    } else if (currentScreen.type === 'question') {
      const questionObj = store.questions.find((q: any) => q.slug === currentScreen.slug);
      if (questionObj) {
        schemaJson = {
          "@context": "https://schema.org",
          "@type": "QAPage",
          "mainEntity": {
            "@type": "Question",
            "name": questionObj.title,
            "text": questionObj.description || questionObj.title,
            "answerCount": questionObj.answers?.length || 0,
            "dateCreated": questionObj.postTime || "2026-06-23",
            "author": {
              "@type": "Person",
              "name": questionObj.author || "Anonymous Citizen"
            }
          }
        };
      }
    } else if (currentScreen.type === 'regret_stories' && currentScreen.slug) {
      const storyObj = store.stories.find((s: any) => s.id === currentScreen.slug);
      if (storyObj) {
        schemaJson = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": storyObj.title,
          "description": storyObj.fullStory.slice(0, 160) + "...",
          "datePublished": storyObj.dateAdded,
          "author": {
            "@type": "Person",
            "name": storyObj.userName || "Anonymous Writer"
          }
        };
      }
    }

    let schemaScript = document.getElementById('seo-jsonld-schema');
    if (schemaScript) {
      schemaScript.textContent = JSON.stringify(schemaJson);
    } else {
      schemaScript = document.createElement('script');
      schemaScript.id = 'seo-jsonld-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.textContent = JSON.stringify(schemaJson);
      document.head.appendChild(schemaScript);
    }

    // Push states to native HTML5 REST history pathnames
    if (window.location.pathname !== path) {
      window.history.pushState({ type: currentScreen.type, slug: currentScreen.slug }, '', path);
    }
  }, [currentScreen]);

  // Handle auto-scroll to top and focus main section on navigation/screen change
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
    // Handle layout adjustments/loading lag
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentScreen]);

  // Initialize feed check time for live alerts
  useEffect(() => {
    if (!localStorage.getItem('before_regret_last_feed_check')) {
      // Set to 6 hours ago so there are some "new" items to show first-time visitors
      const initialTime = Date.now() - 6 * 3600 * 1000;
      localStorage.setItem('before_regret_last_feed_check', initialTime.toString());
    }
  }, []);

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

  // Initialize local guest user session on mount
  useEffect(() => {
    let localUserId = localStorage.getItem('beforeregret_guest_uid');
    if (!localUserId) {
      localUserId = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem('beforeregret_guest_uid', localUserId);
    }
    const finalUserName = store.user.username || 'Anonymous Seeker';
    setCurrentUser({
      uid: localUserId,
      displayName: finalUserName,
      email: `${finalUserName.toLowerCase().replace(/[^a-z0-9]/g, '_')}@beforeregret.com`,
      isAnonymous: true,
      isGuest: true
    });
  }, []);

  // Listen to Authentication State and Subscribe to Real-Time Collections
  useEffect(() => {
    // 1. Real-Time Subscription to Stories
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

    // 2. Real-Time Subscription to Comments / Advice Answers
    const commentsCol = collection(db, "comments");
    const qComments = query(commentsCol, orderBy("dateAdded", "asc"));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const fsComments: StoryComment[] = [];
      snapshot.forEach((snapDoc) => {
        fsComments.push(snapDoc.data() as StoryComment);
      });
      setComments(fsComments);
    }, (error) => {
      console.error("Firestore comments subscription error: ", error);
    });

    // 3. Real-Time Subscription to Questions / Advice Requests
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

    // 4. Real-Time Subscription to Court Cases
    const courtCasesCol = collection(db, "courtCases");
    const unsubscribeCourtCases = onSnapshot(courtCasesCol, (snapshot) => {
      const fsCourtCases: CourtCase[] = [];
      snapshot.forEach((snapDoc) => {
        fsCourtCases.push(snapDoc.data() as CourtCase);
      });
      setStore(prev => {
        const preseeded = prev.courtCases.filter(c => !c.caseNumber || parseInt(c.caseNumber.replace(/[^0-9]/g, ''), 10) <= 2012);
        const combined = [...fsCourtCases, ...preseeded];
        const unique = combined.filter((c, idx, self) =>
          self.findIndex(t => t.slug === c.slug) === idx
        );
        return { ...prev, courtCases: unique };
      });
    }, (error) => {
      console.error("Firestore courtCases subscription error: ", error);
    });

    // 5. Real-Time Subscription to Red Flag Cases
    const redFlagCasesCol = collection(db, "redFlagCases");
    const unsubscribeRedFlagCases = onSnapshot(redFlagCasesCol, (snapshot) => {
      const fsRedFlagCases: RedFlagCase[] = [];
      snapshot.forEach((snapDoc) => {
        fsRedFlagCases.push(snapDoc.data() as RedFlagCase);
      });
      setStore(prev => {
        const preseeded = prev.redFlagCases.filter(f => !f.caseNumber || parseInt(f.caseNumber.replace(/[^0-9]/g, ''), 10) <= 3004);
        const combined = [...fsRedFlagCases, ...preseeded];
        const unique = combined.filter((f, idx, self) =>
          self.findIndex(t => t.id === f.id) === idx
        );
        return { ...prev, redFlagCases: unique };
      });
    }, (error) => {
      console.error("Firestore redFlagCases subscription error: ", error);
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeStories();
      unsubscribeComments();
      unsubscribeQuestions();
      unsubscribeCourtCases();
      unsubscribeRedFlagCases();
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
    const authorPhoto = currentUser ? (currentUser.photoURL || null) : null;

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

    const cleaned = trimmed.replace('CASE-', '');
    const matchNumber = cleaned.match(/\d+/);
    const hasNum = matchNumber ? matchNumber[0] : '';

    const hasS = cleaned.includes('S');
    const hasC = cleaned.includes('C');
    const hasF = cleaned.includes('F');

    // 1. Check Stories / Regrets Registry
    const foundStory = store.stories.find(s => {
      const sNum = (s.caseNumber || '').toUpperCase();
      return sNum === trimmed || 
             sNum === `CASE-${trimmed}` || 
             (hasNum && sNum === `CASE-S${hasNum}` && (hasS || (!hasC && !hasF && sNum.includes(hasNum))));
    });

    if (foundStory) {
      setScreen({ type: 'regret_stories', slug: foundStory.id });
      setHighlightedStoryId(foundStory.id);
      showToast(`📂 Regret Case ${foundStory.caseNumber} retrieved from Registry!`);
      return;
    }

    // 2. Check Court Cases / Relationship Court
    const foundCourt = store.courtCases.find(c => {
      const cNum = (c.caseNumber || '').toUpperCase();
      const cSlug = (c.slug || '').toUpperCase();
      return cNum === trimmed || 
             cNum === `CASE-${trimmed}` || 
             cSlug === trimmed ||
             (hasNum && cNum === `CASE-C${hasNum}` && (hasC || (!hasS && !hasF && cNum.includes(hasNum))));
    });

    if (foundCourt) {
      setScreen({ type: 'court', slug: foundCourt.slug });
      showToast(`⚖️ Tribunal Case ${foundCourt.caseNumber} retrieved successfully!`);
      return;
    }

    // 3. Check Red Flag Cases
    const foundFlag = store.redFlagCases.find(f => {
      const fNum = (f.caseNumber || '').toUpperCase();
      const fId = (f.id || '').toUpperCase();
      return fNum === trimmed || 
             fNum === `CASE-${trimmed}` || 
             fId === trimmed ||
             (hasNum && fNum === `CASE-F${hasNum}` && (hasF || (!hasS && !hasC && fNum.includes(hasNum))));
    });

    if (foundFlag) {
      setScreen({ type: 'red_flag_meter', slug: foundFlag.id });
      showToast(`🏁 Red Flag Dilemma ${foundFlag.caseNumber} retrieved successfully!`);
      return;
    }

    // 4. Fallback search by title or keyword
    const queryStr = trimmed.toLowerCase();
    
    const fallbackCourt = store.courtCases.find(
      c => c.title.toLowerCase().includes(queryStr) || (c.caseNumber && c.caseNumber.toLowerCase().includes(queryStr))
    );
    if (fallbackCourt) {
      setScreen({ type: 'court', slug: fallbackCourt.slug });
      showToast(`⚖️ Court Case ${fallbackCourt.caseNumber} retrieved!`);
      return;
    }

    const fallbackStory = store.stories.find(
      s => s.title.toLowerCase().includes(queryStr) || (s.caseNumber && s.caseNumber.toLowerCase().includes(queryStr))
    );
    if (fallbackStory) {
      setScreen({ type: 'regret_stories', slug: fallbackStory.id });
      setHighlightedStoryId(fallbackStory.id);
      showToast(`📂 Regret Case ${fallbackStory.caseNumber} retrieved from Registry!`);
      return;
    }

    const fallbackRedFlag = store.redFlagCases.find(
      f => f.title.toLowerCase().includes(queryStr) || (f.caseNumber && f.caseNumber.toLowerCase().includes(queryStr))
    );
    if (fallbackRedFlag) {
      setScreen({ type: 'red_flag_meter', slug: fallbackRedFlag.id });
      showToast(`🏁 Red Flag Dilemma ${fallbackRedFlag.caseNumber} retrieved!`);
      return;
    }

    showToast(`❌ Case ID or term "${caseNum}" not found in our indices.`);
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
  const [newlyLodgedCase, setNewlyLodgedCase] = useState<{ 
    title: string; 
    caseNumber: string; 
    type: 'story' | 'court';
    id?: string;
    slug?: string;
    passwordPin?: string;
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
    let updatedCaseToSave: CourtCase | null = null;
    setStore(prev => {
      const idx = prev.courtCases.findIndex(c => c.slug === slug);
      if (idx === -1) return prev;

      const updatedCases = [...prev.courtCases];
      const courtCase = { 
        ...updatedCases[idx], 
        votes: { ...updatedCases[idx].votes } 
      };

      // Mutate case metrics
      courtCase.votes[side] += 1;
      updatedCases[idx] = courtCase;
      updatedCaseToSave = courtCase;

      return {
        ...prev,
        courtCases: updatedCases
      };
    });

    setUserVotedCases(prev => ({ ...prev, [slug]: side }));
    showToast("⚖️ Verdict logged. You can now analyze peer jury ratios.");
    if (updatedCaseToSave) {
      saveCourtCaseToFirestore(updatedCaseToSave).catch(err => {
        console.error("Error saving voted courtcase to Firestore:", err);
      });
    }
  };

  const handleVoteFlag = (caseId: string, flagType: 'green' | 'yellow' | 'red') => {
    let updatedFlagToSave: RedFlagCase | null = null;
    setStore(prev => {
      const idx = prev.redFlagCases.findIndex(c => c.id === caseId);
      if (idx === -1) return prev;

      const updated = [...prev.redFlagCases];
      const redFlagCase = {
        ...updated[idx],
        votes: {
          ...updated[idx].votes,
          [flagType]: (updated[idx].votes[flagType] || 0) + 1
        }
      };
      updated[idx] = redFlagCase;
      updatedFlagToSave = redFlagCase;

      return {
        ...prev,
        redFlagCases: updated
      };
    });

    setUserVotedFlags(prev => ({ ...prev, [caseId]: flagType }));
    showToast("🏁 Flag vote registered! Viewing live statistics.");
    if (updatedFlagToSave) {
      saveRedFlagCaseToFirestore(updatedFlagToSave).catch(err => {
        console.error("Error saving red flag vote to Firestore:", err);
      });
    }
  };

  const handleAddFlagComment = (caseId: string, text: string) => {
    let updatedFlagToSave: RedFlagCase | null = null;
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

      const redFlagCase = {
        ...updated[idx],
        comments: [...(updated[idx].comments || []), commentObj]
      };
      updated[idx] = redFlagCase;
      updatedFlagToSave = redFlagCase;

      return {
        ...prev,
        redFlagCases: updated
      };
    });
    showToast("💬 Comment posted to Warning board.");
    if (updatedFlagToSave) {
      saveRedFlagCaseToFirestore(updatedFlagToSave).catch(err => {
        console.error("Error saving red flag comment to Firestore:", err);
      });
    }
  };

  const handleAddFlagCase = (
    title: string, 
    description: string, 
    category: 'Communication' | 'Exes & Socials' | 'Trust & Privacy' | 'Control & Habits' | 'Other'
  ) => {
    const caseId = 'rf_' + Date.now().toString();
    const randomNum = Math.floor(1000 + Math.random() * 9000); 
    const caseNumber = `CASE-F${randomNum}`;
    
    const newCase: RedFlagCase = {
      id: caseId,
      caseNumber,
      title,
      description,
      category,
      votes: { green: 0, yellow: 0, red: 0 },
      comments: [],
      author: store.user.username,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    setStore(prev => {
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

    showToast(`🏁 Lodged Category ${category} Dilemma: ${caseNumber}`);

    saveRedFlagCaseToFirestore(newCase).catch(err => {
      console.error("Error saving newly submitted red flag case to Firestore:", err);
    });
  };

  const handleAddCourtArgument = (slug: string, side: 'Me' | 'Partner' | 'Both' | 'Neither', text: string) => {
    let updatedCaseToSave: CourtCase | null = null;
    setStore(prev => {
      const idx = prev.courtCases.findIndex(c => c.slug === slug);
      if (idx === -1) return prev;

      const updatedCases = [...prev.courtCases];
      const courtCase = { 
        ...updatedCases[idx],
        arguments: [...(updatedCases[idx].arguments || [])]
      };

      const newArg = {
        id: 'arg_' + Date.now().toString(),
        author: prev.user.username,
        side,
        text,
        votes: 0,
        role: (prev.user.storiesSubmitted > 0 ? "Relationship Veteran" : "Truth Teller") as any
      };

      courtCase.arguments = [newArg, ...courtCase.arguments];
      updatedCases[idx] = courtCase;
      updatedCaseToSave = courtCase;

      return {
        ...prev,
        courtCases: updatedCases
      };
    });

    showToast("✍️ Jury opinion finalized! Thank you for raising relationship objectivity.");
    if (updatedCaseToSave) {
      saveCourtCaseToFirestore(updatedCaseToSave).catch(err => {
        console.error("Error saving added argument courtcase to Firestore:", err);
      });
    }
  };

  const handleRegisterCourtCase = (caseData: { title: string; description: string; tags: string[]; deliberationDays: number }) => {
    const baseSlug = caseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const uniqueSlug = store.courtCases.some(c => c.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `CASE-C${randomNum}`;
    const passwordPin = Math.floor(1000 + Math.random() * 9000).toString();

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
      tags: caseData.tags,
      deliberationDays: caseData.deliberationDays || 3,
      createdAt: new Date().toISOString(),
      passwordPin: passwordPin
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
      slug: newCase.slug,
      passwordPin: passwordPin
    });
    showToast(`⚖️ Court case registered successfully under Case Key: ${caseNumber}!`);
    setIsRegisterModalOpen(false);

    saveCourtCaseToFirestore(newCase).catch(err => {
      console.error("Error saving registered court case to Firestore:", err);
    });
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
      answers: [],
      dateAdded: new Date().toISOString()
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
    deleteCourtCaseFromFirestore(slug).catch(err => {
      console.error("Firestore court case delete error:", err);
    });
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
    deleteQuestionFromFirestore(slug).catch(err => {
      console.error("Firestore question delete error:", err);
    });
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

  const handleDeleteRedFlagCase = (caseId: string) => {
    deleteDoc(doc(db, "redFlagCases", caseId)).catch(err => {
      console.error("Firestore red flag case delete error:", err);
    });
    setStore(prev => {
      const updated = (prev.redFlagCases || []).filter(c => c.id !== caseId);
      const newState = { ...prev, redFlagCases: updated };
      saveState(newState);
      return newState;
    });
    showToast("🗑️ Red flag warning case deleted by administrator.");
  };

  const handleDeleteRedFlagComment = (caseId: string, commentId: string) => {
    setStore(prev => {
      const idx = (prev.redFlagCases || []).findIndex(c => c.id === caseId);
      if (idx === -1) return prev;
      const updated = [...prev.redFlagCases];
      const flagCase = { ...updated[idx] };
      flagCase.comments = (flagCase.comments || []).filter(c => c.id !== commentId);
      updated[idx] = flagCase;

      saveRedFlagCaseToFirestore(flagCase).catch(err => {
        console.error("Firestore red flag comment delete error:", err);
      });

      const newState = { ...prev, redFlagCases: updated };
      saveState(newState);
      return newState;
    });
    showToast("🗑️ Red flag discussion comment deleted.");
  };

  const newSubmissionsCount = useMemo(() => {
    const lastCheck = parseInt(localStorage.getItem('before_regret_last_feed_check') || '0', 10);
    if (!lastCheck) return 0;

    let count = 0;
    // Count new stories
    store.stories.forEach(s => {
      if (new Date(s.dateAdded).getTime() > lastCheck) count++;
    });
    // Count new comments
    comments.forEach(c => {
      if (new Date(c.dateAdded).getTime() > lastCheck) count++;
    });
    // Count new court cases
    store.courtCases.forEach(cc => {
      const caseTime = new Date(cc.createdAt || cc.postTime || 0).getTime();
      if (caseTime > lastCheck) count++;
    });
    // Count new red flag cases
    if (store.redFlagCases) {
      store.redFlagCases.forEach(rf => {
        if (new Date(rf.dateAdded).getTime() > lastCheck) count++;
      });
    }

    return count;
  }, [store.stories, comments, store.courtCases, store.redFlagCases]);

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
        newSubmissionsCount={newSubmissionsCount}
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

        {currentScreen.type === 'hub' && (
          <HubScreen
            slug={currentScreen.slug || ''}
            stories={store.stories}
            courtCases={store.courtCases}
            questions={store.questions}
            redFlagCases={store.redFlagCases || []}
            setScreen={setScreen}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161B22] border border-[#30363D] p-5 sm:p-6 rounded-3xl shadow-sm">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <Gavel className="h-6 w-6 text-[#F4B942]" /> BR Court
                </h1>
                <p className="text-xs text-[#AAB2C0]">Step into our anonymous space. Review relationship evidence, defend sides, and cast peer perspective votes.</p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="shrink-0 bg-[#F4B942] hover:bg-[#E0A52D] text-[#0D1117] font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                id="open-register-case"
              >
                <Plus className="h-4 w-4" /> Submit Your Case
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-[#AAB2C0] px-1 flex items-center justify-between">
                <span>Active Cases Under Deliberation ({store.courtCases.length})</span>
                <span className="text-[10px] text-zinc-500 font-mono normal-case">Deliberation duration: 3 to 14 days</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.courtCases.map(c => {
                  const isExpired = !c.createdAt || (new Date(c.createdAt).getTime() + (c.deliberationDays || 3) * 24 * 60 * 60 * 1000) <= Date.now();
                  return (
                    <div
                      key={c.slug}
                      onClick={() => setScreen({ type: 'court', slug: c.slug })}
                      className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 cursor-pointer hover:border-[#F4B942] transition-all hover:scale-[1.01] flex flex-col justify-between shadow-sm animate-fadeIn"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] uppercase font-mono font-bold text-[#F4B942] bg-[#F4B942]/10 px-2 py-0.5 rounded">
                              {c.caseNumber || 'CASE-C2011'}
                            </span>
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="h-1 w-1 rounded-full bg-rose-500" />
                                Ended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-[#AAB2C0] font-mono">
                            ⚖️ {(c.votes.me || 0) + (c.votes.partner || 0) + (c.votes.both || 0) + (c.votes.neither || 0)} votes
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1 leading-snug">"{c.title}"</h3>
                        <p className="text-xs text-[#AAB2C0] line-clamp-3 leading-relaxed mt-1.5 font-serif">{c.description}</p>
                      </div>
                      <div className="mt-4 border-t border-[#30363D]/45 pt-3 flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="text-[#F4B942] font-semibold">Cast Vote →</span>
                        <span className="font-mono">{c.postTime}</span>
                      </div>
                    </div>
                  );
                })}
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
                  <HelpCircle className="h-6 w-6 text-purple-400" /> Ask/Give Advice Hub
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
                    Back to Ask/Give Advice
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

        {currentScreen.type === 'regret_stories' && (() => {
          const isStoryId = currentScreen.slug && store.stories.some(s => s.id === currentScreen.slug);
          return (
            <RegretStoriesScreen
              stories={store.stories}
              situations={liveSituations}
              onVoteHelpful={handleVoteHelpful}
              onSubmitStory={handleAddStory}
              setScreen={setScreen}
              isAdmin={isAdmin}
              onDeleteStory={handleDeleteStory}
              initialSituationSlug={isStoryId ? 'All' : currentScreen.slug}
              initialStoryId={isStoryId ? currentScreen.slug : undefined}
            />
          );
        })()}

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

        {currentScreen.type === 'admin_feed' && (
          <AdminFeedScreen
            stories={store.stories}
            comments={comments}
            courtCases={store.courtCases}
            questions={store.questions}
            redFlagCases={store.redFlagCases || []}
            isAdmin={isAdmin}
            setScreen={setScreen}
            onDeleteStory={handleDeleteStory}
            onDeleteComment={handleDeleteComment}
            onDeleteCourtCase={handleDeleteCourtCase}
            onDeleteArgument={handleDeleteArgument}
            onDeleteQuestion={handleDeleteQuestion}
            onDeleteAnswer={handleDeleteAnswer}
            onDeleteAnswerComment={handleDeleteAnswerComment}
            onDeleteRedFlagCase={handleDeleteRedFlagCase}
            onDeleteRedFlagComment={handleDeleteRedFlagComment}
            onToggleAdmin={handleToggleAdmin}
          />
        )}

        {currentScreen.type === 'legal' && (
          <LegalScreen
            initialTab={currentScreen.slug as any || 'disclaimer'}
            setScreen={setScreen}
          />
        )}

        {currentScreen.type === 'guides' && (
          <GuidesScreen
            setScreen={setScreen}
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
            <div className="my-4 bg-[#0D1117] border border-[#30363D] rounded-xl p-3">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest font-mono block mb-1">YOUR UNIQUE CASE ID</span>
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <code className="text-base font-black text-[#F4B942] font-mono tracking-wider select-all">
                  {newlyLodgedCase.caseNumber}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyLodgedCase.caseNumber);
                    showToast("📋 Case Number Copied!");
                  }}
                  className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#30363D] text-zinc-400 hover:text-white border border-[#30363D] transition-all"
                  title="Copy Case Number"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>

              {newlyLodgedCase.passwordPin && (
                <>
                  <div className="border-t border-[#30363D]/60 pt-2.5">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest font-mono block mb-1">YOUR CASE PIN (PASSWORD)</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <code className="text-base font-black text-emerald-400 font-mono tracking-widest select-all">
                        {newlyLodgedCase.passwordPin}
                      </code>
                      <button
                        onClick={() => {
                          const copyText = newlyLodgedCase.passwordPin || '';
                          navigator.clipboard.writeText(copyText);
                          showToast("📋 Case PIN Copied!");
                        }}
                        className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#30363D] text-zinc-400 hover:text-white border border-[#30363D] transition-all"
                        title="Copy Case PIN"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-[9px] font-bold text-[#E0A52D] leading-tight block mt-2 px-1">
                      ⚠️ Write down this PIN now! For absolute privacy, this cannot be retrieved or reset if lost. You need it to customize your name on the certificate.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#1C2128] border border-[#30363D]/60 rounded-xl p-3 text-left text-[10px] text-zinc-400 leading-relaxed mb-4">
              <p className="font-bold text-zinc-200">💡 Registry Guidelines:</p>
              <p className="mt-1">
                To protect privacy, profiles are not stored. Write down your case ID. You can find your case page using the <strong className="text-white font-bold">RETRIEVE CASE</strong> option in the top bar. Use the PIN to lock in your custom name on your certificate.
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

      {/* GLOBAL REGISTER CASE MODAL OVERLAY */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-[540px] bg-[#161B22] border-2 border-[#30363D] rounded-3xl p-5 shadow-2xl space-y-3.5 overflow-hidden">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-[#30363D] transition-all cursor-pointer"
              id="close-registration-modal"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Gavel className="h-4.5 w-4.5 text-[#F4B942]" /> Submit Case to Court
              </h2>
              <p className="text-[11px] text-[#AAB2C0] mt-0.5 font-sans leading-normal">
                Register your relationship dispute anonymously. Peers will deliberate, debate evidence, and deliver an objective perspective.
              </p>
            </div>
            <div className="pt-1">
              <RegisterCaseForm onSubmit={handleRegisterCourtCase} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
