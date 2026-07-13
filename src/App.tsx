import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { FeaturedResidents } from './components/FeaturedResidents';
import { ResidentProfile } from './components/ResidentProfile';
import { AskQuestion } from './components/AskQuestion';
import { Dashboards } from './components/Dashboards';
import { Messaging } from './components/Messaging';
import { Onboarding } from './components/Onboarding';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';

import { INITIAL_LOCALITIES, INITIAL_EXPERTS, INITIAL_REVIEWS } from './data';
import { Neighborhood, ExpertProfile, DirectQuery, Review } from './types';
import { Building, MapPin, Search, Sparkles, Filter, Award, ChevronRight } from 'lucide-react';

export default function App() {
  // Navigation & Simulation Perspective State
  const [currentView, setView] = useState<string>('home'); // home, explore, profile, ask, buyer_dashboard, expert_dashboard, messaging, become_expert
  const [activeRole, setActiveRole] = useState<'guest' | 'buyer' | 'expert'>('guest');

  // Core Database Collections State
  const [localities, setLocalities] = useState<Neighborhood[]>(INITIAL_LOCALITIES);
  const [experts, setExperts] = useState<ExpertProfile[]>(INITIAL_EXPERTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [queries, setQueries] = useState<DirectQuery[]>([
    {
      id: 'q_mock_1',
      buyerId: 'user_rohan',
      buyerName: 'Rohan Deshmukh',
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
  ]);

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

  // Navigation handlers
  const handleSelectExpert = (expert: ExpertProfile) => {
    const loc = localities.find((l) => l.id === expert.localityId) || localities[0];
    setSelectedExpert(expert);
    setSelectedLocality(loc);
    setView('profile');
    window.scrollTo(0, 0);
  };

  const handleSelectLocality = (locality: Neighborhood) => {
    setSelectedLocality(locality);
    setView('home'); // stay home but filtered
    const element = document.getElementById('featured-residents-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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

  // Submit new inquiry wizard
  const handleSubmitQuestion = (queryText: string, packageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT', bookedSlot?: string) => {
    if (!selectedExpert) return;

    const newQuery: DirectQuery = {
      id: `q_${Date.now()}`,
      buyerId: 'user_rohan',
      buyerName: 'Rohan Deshmukh',
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
  };

  // Submit expert's verified final answer
  const handleSubmitAnswer = (queryId: string, answerText: string) => {
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
  };

  // Star rating reviews submission
  const handleLeaveReview = (query: DirectQuery) => {
    const ratingInput = prompt('Enter star rating (1 to 5):', '5');
    const starRating = parseInt(ratingInput || '5');
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      alert('Invalid rating stars.');
      return;
    }

    const comment = prompt('Enter your feedback comment:', 'Amazing, unvarnished insight into Bimbisar Nagar society water limitations! Highly recommend!');
    if (!comment) return;

    const newReview: Review = {
      id: `rev_${Date.now()}`,
      queryId: query.id,
      buyerName: 'Rohan Deshmukh',
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
    alert('Thank you! Your verified rating has been published successfully.');
  };

  const handleAddExpertFromOnboarding = (newExpert: ExpertProfile) => {
    setExperts([newExpert, ...experts]);
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
                selectedLocality={selectedLocality}
                onClearLocalityFilter={handleClearLocalityFilter}
              />
            </div>
          </div>
        )}

        {/* VIEW: EXPLORE VIEW (All Societies Directory layout) */}
        {currentView === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-10 text-center sm:text-left">
              <span className="bg-blue-50 border border-blue-100/60 text-blue-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full font-mono">
                Comprehensive Society Directory
              </span>
              <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight mt-3">
                Residential Apartments Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
                Browse Indian housing societies, apartment complexes, or sectors below. Click any layout to filter and consult certified long-term residents living there.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localities.map((loc) => (
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
                    <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-full">
                      {loc.expertCount} Residents Listed
                    </span>
                    <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Experts <ChevronRight className="w-4 h-4" />
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
            onStartInquiry={() => setView('ask_question')}
            savedExperts={savedExpertIds}
            onToggleSaveExpert={handleToggleSaveExpert}
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

      </main>

      {/* Footer block */}
      <Footer setView={setView} />

    </div>
  );
}
