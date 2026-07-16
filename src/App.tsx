import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { IntroStoryHero } from './components/IntroStoryHero';
import { FeaturedResidents } from './components/FeaturedResidents';
import { ResidentProfile } from './components/ResidentProfile';
import { AskQuestion } from './components/AskQuestion';
import { Dashboards } from './components/Dashboards';
import { Messaging } from './components/Messaging';
import { Onboarding } from './components/Onboarding';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { Policies } from './components/Policies';
import { RegretFiles, ARTICLES } from './components/RegretFiles';
import { INITIAL_LOCALITIES, INITIAL_EXPERTS, INITIAL_REVIEWS } from './data';
import { Neighborhood, ExpertProfile, DirectQuery, Review } from './types';
import { Building, MapPin, Search, Sparkles, Filter, Award, ChevronRight } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { triggerTestPushNotification } from './lib/notificationService';

export default function App() {
  const { user, activeRole, setActiveRole, setExpertProfile } = useAuth();

  // Navigation & Simulation Perspective State
  const [currentView, setView] = useState<string>('home'); // home, explore, profile, ask, buyer_dashboard, expert_dashboard, messaging, become_expert, policies
  const [policiesTab, setPoliciesTab] = useState<'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact' | 'disclaimer'>('disclaimer');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Helper to open a specific policy tab
  const handleNavigateToPolicy = (tab: 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact' | 'disclaimer') => {
    setPoliciesTab(tab);
    setView('policies');
    window.scrollTo(0, 0);
  };

  // Core Database Collections State
  const [localities, setLocalities] = useState<Neighborhood[]>(() => {
    const saved = localStorage.getItem('br_localities');
    return saved ? JSON.parse(saved) : INITIAL_LOCALITIES;
  });
  const [experts, setExperts] = useState<ExpertProfile[]>(() => {
    const saved = localStorage.getItem('br_experts');
    return saved ? JSON.parse(saved) : INITIAL_EXPERTS;
  });
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('br_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });
  const [queries, setQueries] = useState<DirectQuery[]>(() => {
    const saved = localStorage.getItem('br_queries');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'q_mock_1',
        buyerId: 'mock_buyer_amit',
        buyerName: 'Amit Kumar',
        expertId: 'exp_priya',
        expertName: 'Priya',
        localityId: 'loc_bimbisar_nagar',
        localityName: 'Bimbisar Nagar, Jogeshwari',
        queryText: "Hello Priya, I'm planning to rent a flat in Block C next month. How is the water supply during high summers? Also, are there restrictive society rules for bachelors or late-night arrivals? Thank you!",
        status: 'ACCEPTED',
        pricePaid: 199,
        expertEarnings: 179,
        createdAt: '2026-07-10T12:00:00Z',
        packageOption: 'BUNDLE'
      }
    ];
  });

  // Selected entities for detailed views
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<Neighborhood | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<'QUICK' | 'BUNDLE' | 'LIVE_CHAT'>('QUICK');
  const [activeQuery, setActiveQuery] = useState<DirectQuery | null>(null);
  const [messagingBackView, setMessagingBackView] = useState<string>('');

  // User list saves
  const [savedExpertIds, setSavedExpertIds] = useState<string[]>(['exp_priya']);

  // Search input focus ref
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically scroll to top on any view transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Track if initial server-side load has completed to avoid overwriting database
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);

  // Load from server database on mount
  useEffect(() => {
    const loadServerData = async () => {
      try {
        const [locRes, expRes, revRes, qRes] = await Promise.all([
          fetch('/api/localities'),
          fetch('/api/experts'),
          fetch('/api/reviews'),
          fetch('/api/queries')
        ]);
        if (locRes.ok) {
          const lData = await locRes.json();
          setLocalities(lData);
        }
        if (expRes.ok) {
          const eData = await expRes.json();
          setExperts(eData);
        }
        if (revRes.ok) {
          const rData = await revRes.json();
          setReviews(rData);
        }
        if (qRes.ok) {
          const qData = await qRes.json();
          setQueries(qData);
        }
        setHasLoadedFromServer(true);
      } catch (err) {
        console.error("Failed to fetch server database, using local offline storage fallback:", err);
        setHasLoadedFromServer(true);
      }
    };
    loadServerData();
  }, []);

  // Sync state collections to local storage and server
  useEffect(() => {
    localStorage.setItem('br_localities', JSON.stringify(localities));
    if (hasLoadedFromServer) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localities })
      }).catch(err => console.error("Locality server sync error:", err));
    }
  }, [localities, hasLoadedFromServer]);

  useEffect(() => {
    localStorage.setItem('br_experts', JSON.stringify(experts));
    if (hasLoadedFromServer) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experts })
      }).catch(err => console.error("Experts server sync error:", err));
    }
  }, [experts, hasLoadedFromServer]);

  useEffect(() => {
    localStorage.setItem('br_reviews', JSON.stringify(reviews));
    if (hasLoadedFromServer) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews })
      }).catch(err => console.error("Reviews server sync error:", err));
    }
  }, [reviews, hasLoadedFromServer]);

  useEffect(() => {
    localStorage.setItem('br_queries', JSON.stringify(queries));
    if (hasLoadedFromServer) {
      fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries })
      }).catch(err => console.error("Queries server sync error:", err));
    }
  }, [queries, hasLoadedFromServer]);

  // Handle popstate (browser back/forward or direct landing on URL)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const p = path.replace(/\/$/, '') || '/';

      if (p === '/') {
        setView('home');
        setSelectedArticleId(null);
        setSelectedExpert(null);
        setSelectedLocality(null);
      } else if (p === '/explore' || p === '/societies') {
        setView('explore');
        setSelectedArticleId(null);
      } else if (p === '/become-expert') {
        setView('become_expert');
        setSelectedArticleId(null);
      } else if (p === '/disclaimer' || p === '/legal-disclaimer') {
        setView('policies');
        setSelectedArticleId(null);
        setPoliciesTab('disclaimer');
      } else if (p === '/terms' || p === '/terms-and-conditions') {
        setView('policies');
        setSelectedArticleId(null);
        setPoliciesTab('terms');
      } else if (p === '/privacy' || p === '/privacy-policy') {
        setView('policies');
        setSelectedArticleId(null);
        setPoliciesTab('privacy');
      } else if (p === '/refunds' || p === '/refund-policy') {
        setView('policies');
        setSelectedArticleId(null);
        setPoliciesTab('refunds');
      } else if (p === '/shipping' || p === '/shipping-policy') {
        setView('policies');
        setSelectedArticleId(null);
        setPoliciesTab('shipping');
      } else if (p === '/contact' || p === '/contact-us') {
        setView('policies');
        setSelectedArticleId(null);
        setPoliciesTab('contact');
      } else if (p === '/policies' || p.startsWith('/policies/')) {
        setView('policies');
        setSelectedArticleId(null);
        const parts = p.split('/');
        if (parts[2]) {
          const tab = parts[2] as 'terms' | 'privacy' | 'refunds' | 'shipping' | 'contact' | 'disclaimer';
          setPoliciesTab(tab);
        } else {
          setPoliciesTab('disclaimer');
        }
      } else if (p === '/dashboard/buyer') {
        setView('buyer_dashboard');
        setSelectedArticleId(null);
      } else if (p === '/dashboard/expert') {
        setView('expert_dashboard');
        setSelectedArticleId(null);
      } else if (p === '/admin') {
        setView('admin_panel');
        setSelectedArticleId(null);
      } else if (p === '/stories' || p === '/regret-files') {
        setView('regret_files');
        setSelectedArticleId(null);
      } else if (p.startsWith('/stories/') || p.startsWith('/regret-files/')) {
        const parts = p.split('/');
        const storyId = parts[2];
        setView('regret_files');
        setSelectedArticleId(storyId);
      } else if (p.startsWith('/expert/')) {
        const parts = p.split('/');
        const expertId = parts[2];
        const isAsk = parts[3] === 'ask';
        const expert = experts.find(e => e.id === expertId);
        if (expert) {
          const loc = localities.find(l => l.id === expert.localityId) || localities[0];
          setSelectedExpert(expert);
          setSelectedLocality(loc);
          setView(isAsk ? 'ask_question' : 'profile');
        } else {
          setView('home');
        }
      } else if (p.startsWith('/locality/')) {
        const parts = p.split('/');
        const locId = parts[2];
        const loc = localities.find(l => l.id === locId);
        if (loc) {
          setSelectedLocality(loc);
          const matchedExpert = experts.find((e) => e.localityId === loc.id);
          if (matchedExpert) {
            setSelectedExpert(matchedExpert);
            setView('profile');
          } else {
            setView('explore');
          }
        } else {
          setView('explore');
        }
      } else if (p.startsWith('/city/')) {
        const parts = p.split('/');
        const cityName = parts[2];
        setView('explore');
        const foundLoc = localities.find(l => l.city.toLowerCase() === cityName.toLowerCase());
        if (foundLoc) {
          setSelectedLocality(foundLoc);
        } else {
          setSelectedLocality(null);
        }
      }
    };

    // Run initial sync on mount
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [localities, experts]);

  // Synchronize browser URL history whenever view, story, expert or query changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    let targetPath = '/';

    if (currentView === 'home') {
      targetPath = '/';
    } else if (currentView === 'explore') {
      targetPath = '/explore';
    } else if (currentView === 'regret_files') {
      targetPath = selectedArticleId ? `/stories/${selectedArticleId}` : '/stories';
    } else if (currentView === 'profile' && selectedExpert) {
      targetPath = `/expert/${selectedExpert.id}`;
    } else if (currentView === 'ask_question' && selectedExpert) {
      targetPath = `/expert/${selectedExpert.id}/ask`;
    } else if (currentView === 'become_expert') {
      targetPath = '/become-expert';
    } else if (currentView === 'policies') {
      if (policiesTab === 'disclaimer') targetPath = '/legal-disclaimer';
      else if (policiesTab === 'terms') targetPath = '/terms-and-conditions';
      else if (policiesTab === 'privacy') targetPath = '/privacy-policy';
      else if (policiesTab === 'refunds') targetPath = '/refund-policy';
      else if (policiesTab === 'shipping') targetPath = '/shipping-policy';
      else if (policiesTab === 'contact') targetPath = '/contact-us';
      else targetPath = '/legal-disclaimer';
    } else if (currentView === 'buyer_dashboard') {
      targetPath = '/dashboard/buyer';
    } else if (currentView === 'expert_dashboard') {
      targetPath = '/dashboard/expert';
    } else if (currentView === 'messaging' && activeQuery) {
      targetPath = `/messaging/${activeQuery.id}`;
    } else if (currentView === 'admin_panel') {
      targetPath = '/admin';
    }

    if (currentPath !== targetPath) {
      try {
        window.history.pushState(null, '', targetPath);
      } catch (err) {
        console.warn("Could not update browser history path via pushState:", err);
      }
    }
  }, [currentView, selectedArticleId, selectedExpert?.id, activeQuery?.id, policiesTab]);

  // Update page title & meta elements dynamically for premium SEO crawlability
  useEffect(() => {
    try {
      let title = "BeforeRegret | Verified Resident Insider Consultations for Gated Societies";
      let description = "Read real, anonymous gated society confessions, water issues, power cut histories, and contact long-term residents directly before renting or buying a home in India.";

      if (currentView === 'explore') {
        title = "Explore Gated Societies in India | BeforeRegret Residential Directory";
        description = "Browse premium apartments and housing societies in Bangalore, Mumbai, Gurugram, Thane. Filter water dependencies and rules.";
      } else if (currentView === 'regret_files') {
        if (selectedArticleId) {
          const art = ARTICLES.find(a => a.id === selectedArticleId);
          if (art) {
            title = `${art.title} | BeforeRegret Stories`;
            description = art.excerpt;
          } else {
            title = "Gated Society Cautionary Tales & Confessions | The Regret Files";
          }
        } else {
          title = "The Regret Files Editorial | Real Gated Society Cautionary Tales";
          description = "Read unvarnished confessions and hard lessons from home buyers who regretted their ₹1 Crore+ purchases before checking utilities and resident reviews.";
        }
      } else if (currentView === 'profile' && selectedExpert) {
        title = `Consult ${selectedExpert.fullName} - ${selectedExpert.localityName} Resident Expert`;
        description = `Ask ${selectedExpert.fullName} about water hardness, power back-up, committee rules, and maid charges in ${selectedExpert.localityName} before you decide.`;
      } else if (currentView === 'become_expert') {
        title = "Earn as a Verified Local Resident Expert | BeforeRegret Onboarding";
        description = "Help prospective buyers and tenants make informed decisions about your society. Share honest reviews and earn per consultation.";
      } else if (currentView === 'policies') {
        if (policiesTab === 'disclaimer') {
          title = "Comprehensive Legal Disclaimer & Waiver of Liability | BeforeRegret";
          description = "Review the BeforeRegret legal disclaimer and liability waiver covering unverified crowdsourced resident feedback and Indian property laws.";
        } else if (policiesTab === 'terms') {
          title = "Terms of Service & Platform Guidelines | BeforeRegret";
          description = "Read our standard user agreement, code of conduct, intermediary safe harbor conditions, and binding arbitration details.";
        } else if (policiesTab === 'privacy') {
          title = "Privacy Policy & Resident Anonymity Statement | BeforeRegret";
          description = "We protect our local experts and seeker identities with end-to-end masked databases. Read our comprehensive data privacy standard.";
        } else if (policiesTab === 'refunds') {
          title = "Refund and Cancellation Policy | BeforeRegret";
          description = "Learn about our 100% moneyback guarantee on peer consultation bookings if the resident expert fails to connect within 48 hours.";
        } else if (policiesTab === 'shipping') {
          title = "Service Fulfillment Policy | BeforeRegret";
          description = "Understand peer-to-peer delivery structures, electronic chats, and service timeline completions for gated society consulting.";
        } else if (policiesTab === 'contact') {
          title = "Official Contact & Support desk | BeforeRegret";
          description = "Get in touch with Atmostellar regarding billing, corporate partnership, grievance redressal, or RWA complaints.";
        } else {
          title = "BeforeRegret Policies and Legal Compliance Center";
          description = "Review our Terms of Service, Privacy Policy, Refund policy, and Disclaimer for neighborhood research.";
        }
      } else if (currentView === 'buyer_dashboard') {
        title = "Home Buyer Consulting Dashboard | BeforeRegret";
      } else if (currentView === 'expert_dashboard') {
        title = "Resident Expert Consultant Dashboard | BeforeRegret";
      }

      document.title = title;

      // Update meta description safely without querySelector attribute selectors
      const metaElements = Array.from(document.getElementsByTagName('meta'));
      let metaDesc = metaElements.find(m => m.getAttribute('name') === 'description');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // Update OpenGraph meta tags safely (colons in selectors can throw in some iframe/webview sandboxes)
      let ogTitle = metaElements.find(m => m.getAttribute('property') === 'og:title');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', title);

      let ogDesc = metaElements.find(m => m.getAttribute('property') === 'og:description');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', description);

      // 1. Dynamic Canonical Link injection safely
      const currentPath = window.location.pathname;
      const linkElements = Array.from(document.getElementsByTagName('link'));
      let canonical = linkElements.find(l => l.getAttribute('rel') === 'canonical');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://beforeregret.com${currentPath}`);

      // 2. Structured Schema JSON-LD Data Injection (for visual rich results in Google Search)
      let schemaScript = document.getElementById('jsonld-schema');
      if (schemaScript) {
        schemaScript.remove();
      }

      let schemaData: any = null;

      if (currentView === 'regret_files' && selectedArticleId) {
        const art = ARTICLES.find(a => a.id === selectedArticleId);
        if (art) {
          schemaData = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": art.title,
            "description": art.excerpt,
            "datePublished": "2026-07-14T12:00:00Z",
            "author": {
              "@type": "Person",
              "name": art.author.name
            },
            "publisher": {
              "@type": "Organization",
              "name": "BeforeRegret",
              "logo": {
                "@type": "ImageObject",
                "url": "https://beforeregret.com/favicon.svg"
              }
            }
          };
        }
      } else if (currentView === 'profile' && selectedExpert) {
        schemaData = {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "mainEntity": {
            "@type": "Person",
            "name": selectedExpert.fullName,
            "description": selectedExpert.bio,
            "jobTitle": "Verified Gated Society Resident Expert",
            "knowsAbout": selectedExpert.expertiseTags,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": selectedExpert.localityName,
              "addressRegion": selectedExpert.city,
              "addressCountry": "IN"
            }
          }
        };
      }

      if (schemaData) {
        const script = document.createElement('script');
        script.id = 'jsonld-schema';
        script.type = 'application/ld+json';
        script.innerHTML = JSON.stringify(schemaData);
        document.head.appendChild(script);
      }
    } catch (err) {
      console.warn("Dynamic SEO and meta tag update failed safely:", err);
    }
  }, [currentView, selectedArticleId, selectedExpert]);

  // Navigation handlers
  const handleSelectExpert = (expert: ExpertProfile) => {
    const loc = localities.find((l) => l.id === expert.localityId) || localities[0];
    setSelectedExpert(expert);
    setSelectedLocality(loc);
    setView('profile');
    window.scrollTo(0, 0);
  };

  const handleSelectLocality = (locality: Neighborhood) => {
    setLocalities((prev) => {
      const exists = prev.some((l) => l.id === locality.id);
      if (!exists) {
        return [locality, ...prev];
      }
      return prev;
    });

    setSelectedLocality(locality);
    const matchedExpert = experts.find((e) => e.localityId === locality.id);
    if (matchedExpert) {
      handleSelectExpert(matchedExpert);
    } else {
      setView('explore');
      window.scrollTo(0, 0);
    }
  };

  const handleClearLocalityFilter = () => {
    setSelectedLocality(null);
  };

  const handleToggleSaveExpert = (expertId: string) => {
    if (savedExpertIds.includes(expertId)) {
      setSavedExpertIds(savedExpertIds.filter((id) => id !== expertId));
    } else {
      setSavedExpertIds([...savedExpertIds, expertId]);
    }
  };

  const handleUpdateExpert = (updated: ExpertProfile) => {
    setExperts((prev) => prev.map((e) => e.id === updated.id ? updated : e));
  };

  // Submit new inquiry wizard
  const handleSubmitQuestion = (queryText: string, packageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT', bookedSlot?: string) => {
    if (!selectedExpert) return;

    if (!user) {
      alert("Error: You must be signed in to submit a question.");
      return;
    }

    if (user && selectedExpert && user.uid === selectedExpert.userId) {
      alert("Error: You cannot submit questions or consult on your own listing.");
      return;
    }

    const newQuery: DirectQuery = {
      id: `q_${Date.now()}`,
      buyerId: user.uid,
      buyerName: user.displayName || user.email || 'Anonymous',
      expertId: selectedExpert.id,
      expertName: selectedExpert.fullName,
      localityId: selectedExpert.localityId,
      localityName: selectedExpert.localityName,
      queryText,
      status: 'ACCEPTED', // Pre-accepted for high-fidelity simulation
      pricePaid: packageId === 'QUICK' ? 99 : packageId === 'BUNDLE' ? 199 : 299,
      expertEarnings: packageId === 'QUICK' ? 89 : packageId === 'BUNDLE' ? 179 : 269,
      createdAt: new Date().toISOString(),
      packageOption: packageId,
      bookedSlot: bookedSlot
    };

    setQueries([newQuery, ...queries]);
    setActiveRole('buyer');
    setView('buyer_dashboard');
    window.scrollTo(0, 0);

    // Trigger instant background push notification alert to the expert
    triggerTestPushNotification(
      selectedExpert.id,
      'New Resident Audit Request! 📣',
      `A buyer requested water and rule details for ${selectedExpert.localityName}: "${queryText.substring(0, 50)}..."`,
      'expert_dashboard'
    ).catch(err => console.error('FCM dispatch failed:', err));
  };

  // Submit expert's final answer
  const handleSubmitAnswer = (queryId: string, answerText: string) => {
    const matchedQuery = queries.find((q) => q.id === queryId);

    const updated = queries.map((q) => {
      if (q.id === queryId) {
        return {
          ...q,
          status: 'ANSWERED' as const,
          answerText,
          answeredAt: new Date().toISOString()
        };
      }
      return q;
    });
    setQueries(updated);
    setView('expert_dashboard');
    window.scrollTo(0, 0);

    // Trigger instant background push notification alert to the buyer
    if (matchedQuery) {
      triggerTestPushNotification(
        matchedQuery.buyerId,
        'Resident Audit Completed! 🌟',
        `Your resident report for ${matchedQuery.localityName} has been fully completed by local expert ${matchedQuery.expertName}!`,
        'buyer_dashboard'
      ).catch(err => console.error('FCM dispatch failed:', err));
    }
  };

  // Star rating reviews submission
  const handleLeaveReview = (query: DirectQuery) => {
    const ratingInput = prompt('Enter star rating (1 to 5):', '5');
    const starRating = parseInt(ratingInput || '5');
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      alert('Invalid rating stars.');
      return;
    }

    const comment = prompt('Enter your feedback comment:', 'Amazing, direct insight into Bimbisar Nagar society water limitations! Highly recommend!');
    if (!comment) return;

    const newReview: Review = {
      id: `rev_${Date.now()}`,
      queryId: query.id,
      buyerName: user ? (user.displayName || user.email || 'Anonymous') : 'Rohan Deshmukh',
      expertId: query.expertId,
      rating: starRating,
      comment,
      createdAt: new Date().toISOString()
    };

    setReviews([newReview, ...reviews]);

    // Set the query status as fully cleared
    const updated = queries.map((q) => {
      if (q.id === query.id) {
        return { ...q, status: 'ANSWERED' as const };
      }
      return q;
    });
    setQueries(updated);
    alert('Thank you! Your rating has been published successfully.');
  };

  const handleAddExpertFromOnboarding = (newExpert: ExpertProfile, newLocality?: Neighborhood) => {
    setExperts([newExpert, ...experts]);
    if (newLocality) {
      const exists = localities.some(loc => loc.id === newLocality.id || loc.name.toLowerCase() === newLocality.name.toLowerCase());
      if (!exists) {
        setLocalities([...localities, newLocality]);
      } else {
        setLocalities(localities.map(loc => {
          if (loc.id === newLocality.id || loc.name.toLowerCase() === newLocality.name.toLowerCase()) {
            return {
              ...loc,
              expertCount: (loc.expertCount || 0) + 1,
              landmarks: loc.landmarks || newLocality.landmarks,
              detailedAddress: loc.detailedAddress || newLocality.detailedAddress
            };
          }
          return loc;
        }));
      }
    }
    setActiveRole('expert');
    setExpertProfile(newExpert);
  };

  const handleOpenChat = (query: DirectQuery) => {
    setActiveQuery(query);
    setMessagingBackView(activeRole === 'buyer' ? 'buyer_dashboard' : 'expert_dashboard');
    setView('messaging');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-blue-500 selection:text-white antialiased font-sans">
      
      {/* Navigation bar with dynamic simulation persona toggle */}
      <Navbar
        currentView={currentView}
        setView={setView}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onSearchFocus={() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }}
      />

      {/* CORE VIEWPORT ROUTER */}
      <main className="flex-1">
        
        {/* VIEW: HOME VIEW (Default Hero, How It Works, and Featured list) */}
        {currentView === 'home' && (
          <div>
            <IntroStoryHero />
            <Hero
              localities={localities}
              onSelectLocality={handleSelectLocality}
              onBecomeExpertClick={() => setView('become_expert')}
              onSearchFocusRef={searchInputRef}
            />
            
            <HowItWorks />

            {/* Featured Section Anchor */}
            <div id="featured-residents-section">
              <FeaturedResidents
                experts={experts}
                localities={localities}
                onSelectExpert={handleSelectExpert}
              />
            </div>

            {/* TEASER BANNER: THE REGRET FILES EDITORIAL HUB */}
            <div className="bg-slate-50 border-y border-slate-100 py-12">
              <div className="max-w-7xl mx-auto px-4">
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="space-y-4 max-w-2xl text-center lg:text-left relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-tight">
                      "I Wish Someone Had Asked This One Question..."
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                      Brokers show you the grand clubhouse; we show you what lies beneath. Read real, anonymous society secrets, neighborhood icebergs, and hard lessons from home buyers who regretted their ₹1 Crore+ purchases.
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
                      <span className="text-[11px] font-mono text-amber-400 font-bold">• The ₹1 Crore Mistake</span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">• Gated Society Insights</span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">• Neighborhood Icebergs</span>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-auto shrink-0 flex flex-col items-center gap-3 relative z-10">
                    <button
                      onClick={() => {
                        setView('regret_files');
                        window.scrollTo(0, 0);
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer text-center"
                    >
                      Read The Regret Files
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: EXPLORE VIEW (All Societies Directory layout) */}
        {currentView === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight mt-3">
                  Residential Apartments Directory
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
                  Browse Indian housing societies, apartment complexes, or sectors below. Click any layout to filter and consult verified long-term residents living there.
                </p>
              </div>
              {selectedLocality && (
                <button
                  onClick={handleClearLocalityFilter}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all self-center sm:self-auto cursor-pointer"
                >
                  Show All Societies
                </button>
              )}
            </div>

            {selectedLocality && (
              <div className="mb-8 flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Showing map search result for:</h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {selectedLocality.name}, {selectedLocality.city} {selectedLocality.pincode ? `- ${selectedLocality.pincode}` : ''}
                      </p>
                      {selectedLocality.apartmentName && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {selectedLocality.apartmentName}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedLocality.expertCount === 0 && (
                    <button
                      onClick={() => setView('become_expert')}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      Be the First Expert Here!
                    </button>
                  )}
                </div>
                <div className="w-full lg:w-96 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-3xs flex flex-col justify-between shrink-0">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                      📍 Verified Pincode Mapping
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Pincode Map Range</span>
                      <span className="font-mono text-blue-600 font-black">{selectedLocality.pincode || "Not Set"}</span>
                    </h4>
                    {selectedLocality.landmarks && (
                      <p className="text-[11px] text-slate-600 mt-2 font-medium bg-white border border-slate-100 p-2 rounded-lg">
                        <b>Landmark:</b> {selectedLocality.landmarks}
                      </p>
                    )}
                    {selectedLocality.detailedAddress && (
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-tight font-mono">
                        {selectedLocality.detailedAddress}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-100 mt-2">
                    Verified address coordinates mapping complete.
                  </div>
                </div>
              </div>
            )}

            {selectedLocality && selectedLocality.expertCount === 0 && (
              <div className="mb-8 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center max-w-2xl mx-auto">
                <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="font-display font-black text-slate-800 text-lg">No Resident Experts Registered Yet</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  We successfully located <strong className="text-slate-700 font-bold">"{selectedLocality.name}"</strong> on the real-time live map, but no residents living there have signed up to give insider consultations yet.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
                  <button
                    onClick={() => setView('become_expert')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    I Live Here - Register & Earn
                  </button>
                  <button
                    onClick={handleClearLocalityFilter}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Browse Other Societies
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedLocality ? localities.filter(l => l.id === selectedLocality.id) : localities).map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => handleSelectLocality(loc)}
                  className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-600 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 inline-block text-slate-500 mb-4 group-hover:text-blue-600 transition-colors">
                      <Building className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">{loc.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{loc.society || 'Residential Layout'} • {loc.city}</p>
                    
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-3 pt-3 border-t border-slate-50">
                      Builder Developer: <strong className="text-slate-700 font-bold">{loc.builder || 'Local Association'}</strong>
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-mono font-bold pt-3 border-t border-slate-50/50">
                    <span className={`px-2.5 py-1 border rounded-full ${
                      loc.expertCount > 0 
                        ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                        : 'text-blue-600 bg-blue-50 border-blue-100'
                    }`}>
                      {loc.expertCount} {loc.expertCount === 1 ? 'Expert Listed' : 'Experts Listed'}
                    </span>
                    <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {loc.expertCount > 0 ? 'View Experts' : 'Join as Expert'} <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DETAILED PROFILE VIEW */}
        {currentView === 'profile' && selectedExpert && (
          <ResidentProfile
            expert={selectedExpert}
            locality={localities.find((l) => l.id === selectedExpert.localityId) || localities[0]}
            reviews={reviews}
            onBack={() => setView('home')}
            onSelectPackage={setSelectedPackageId}
            onStartInquiry={() => {
              if (!user) {
                alert("Please Sign In: To submit an inquiry, you must first create or sign in to your BeforeRegret account.");
                return;
              }
              if (user && user.uid === selectedExpert.userId) {
                return;
              }
              setView('ask_question');
            }}
            savedExperts={savedExpertIds}
            onToggleSaveExpert={handleToggleSaveExpert}
            currentUserUid={user?.uid}
          />
        )}

        {/* VIEW: ASK QUESTION STEP-BY-STEP PAGE */}
        {currentView === 'ask_question' && selectedExpert && (
          <AskQuestion
            expert={selectedExpert}
            locality={localities.find((l) => l.id === selectedExpert.localityId) || localities[0]}
            selectedPackageId={selectedPackageId}
            onBack={() => setView('profile')}
            onSubmitQuestion={handleSubmitQuestion}
          />
        )}

        {/* VIEW: BUYER DASHBOARD VIEW */}
        {currentView === 'buyer_dashboard' && (
          <Dashboards
            queries={queries}
            reviews={reviews}
            experts={experts}
            savedExpertIds={savedExpertIds}
            activeRole="buyer"
            activeQueryId={activeQuery ? activeQuery.id : null}
            setActiveQueryId={() => {}}
            onOpenChat={handleOpenChat}
            onLeaveReview={handleLeaveReview}
            setView={setView}
            onUpdateExpert={handleUpdateExpert}
          />
        )}

        {/* VIEW: RESIDENT EXPERT DASHBOARD VIEW */}
        {currentView === 'expert_dashboard' && (
          <Dashboards
            queries={queries}
            reviews={reviews}
            experts={experts}
            savedExpertIds={savedExpertIds}
            activeRole="expert"
            activeQueryId={activeQuery ? activeQuery.id : null}
            setActiveQueryId={() => {}}
            onOpenChat={handleOpenChat}
            onLeaveReview={() => {}}
            setView={setView}
            onUpdateExpert={handleUpdateExpert}
          />
        )}

        {/* VIEW: SECURE MESSAGING CHATROOM VIEW */}
        {currentView === 'messaging' && activeQuery && (
          <Messaging
            query={activeQuery}
            onBack={() => {
              if (messagingBackView) {
                setView(messagingBackView);
              } else if (activeRole === 'buyer') {
                setView('buyer_dashboard');
              } else {
                setView('expert_dashboard');
              }
            }}
            onSubmitAnswer={handleSubmitAnswer}
            activeRole={activeRole === 'guest' ? 'buyer' : activeRole} // Default fallback to buyer
            backText={messagingBackView === 'admin_panel' ? 'Back to Admin' : 'Exit Messaging'}
          />
        )}

        {/* VIEW: BECOME A LOCAL EXPERT FORM VIEW */}
        {currentView === 'become_expert' && (
          <Onboarding
            localities={localities}
            onAddExpert={handleAddExpertFromOnboarding}
            setView={setView}
          />
        )}

        {/* VIEW: ADMIN PANEL VIEW */}
        {currentView === 'admin_panel' && (
          <AdminPanel
            setView={setView}
            activeRole={activeRole}
            setActiveRole={setActiveRole}
            queries={queries}
            setQueries={setQueries}
            experts={experts}
            localities={localities}
            onOpenQuery={(q) => {
              setActiveQuery(q);
              setMessagingBackView('admin_panel');
              setView('messaging');
              window.scrollTo(0, 0);
            }}
          />
        )}

        {/* VIEW: POLICIES COMPLIANCE CENTER */}
        {currentView === 'policies' && (
          <Policies
            initialTab={policiesTab}
            onBackToHome={() => setView('home')}
          />
        )}

        {/* VIEW: REGRET FILES EDITORIALS */}
        {currentView === 'regret_files' && (
          <RegretFiles 
            onBackToHome={() => { setView('explore'); window.scrollTo(0, 0); }} 
            selectedArticleId={selectedArticleId}
            onSelectArticle={(id) => setSelectedArticleId(id)}
          />
        )}

      </main>

      {/* Footer block */}
      <Footer setView={setView} onNavigateToPolicy={handleNavigateToPolicy} />

    </div>
  );
}
