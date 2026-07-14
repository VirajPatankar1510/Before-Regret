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

  // Submit expert's final answer
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

    const comment = prompt('Enter your feedback comment:', 'Amazing, direct insight into Bimbisar Nagar society water limitations! Highly recommend!');
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
              />
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
                  Browse Indian housing societies, apartment complexes, or sectors below. Click any layout to filter and consult certified long-term residents living there.
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

      </main>

      {/* Footer block */}
      <Footer setView={setView} />

    </div>
  );
}
