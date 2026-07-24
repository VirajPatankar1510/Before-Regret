import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewState, Society, ResidentKnowledgeProfile, TopicKnowledge, UnlockedPurchase } from './types';
import { INITIAL_SOCIETIES } from './data/societies';
import { INITIAL_EXPERTS, INITIAL_LOCALITIES } from './data';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { WhyBeforeRegret } from './components/WhyBeforeRegret';
import { SocietyView } from './components/SocietyView';
import { ResidentProfileView } from './components/ResidentProfileView';
import { TopicDetailModal } from './components/TopicDetailModal';
import { ContributorWizard } from './components/ContributorWizard';
import { ContributorLanding } from './components/ContributorLanding';
import { UnlockModal } from './components/UnlockModal';
import { KnowledgeLibrary } from './components/KnowledgeLibrary';
import { TermsConditions } from './components/TermsConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { RefundPolicy } from './components/RefundPolicy';
import { LegalDisclaimer } from './components/LegalDisclaimer';
import { ContactUs } from './components/ContactUs';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { useAuth } from './context/AuthContext';

import { Search, X, MapPin, ArrowRight } from 'lucide-react';

export function App() {
  const { user } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('HOME');
  const [contributorMode, setContributorMode] = useState<'LANDING' | 'WIZARD'>('LANDING');
  const [societies, setSocieties] = useState<Society[]>(INITIAL_SOCIETIES);

  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [selectedResidentProfile, setSelectedResidentProfile] = useState<ResidentKnowledgeProfile | null>(null);
  
  // Topic Detail Reader Modal
  const [activeTopicModal, setActiveTopicModal] = useState<TopicKnowledge | null>(null);

  // Unlock Checkout Modal
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockTargetProfile, setUnlockTargetProfile] = useState<ResidentKnowledgeProfile | null>(null);
  const [unlockTargetTopic, setUnlockTargetTopic] = useState<TopicKnowledge | null>(null);

  // Search Overlay Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Unlocked purchases state: profileId -> set of topicIds unlocked (or 'ALL' keyword)
  const [unlockedPurchases, setUnlockedPurchases] = useState<UnlockedPurchase[]>([
    {
      id: 'purch-initial-1',
      type: 'SINGLE_TOPIC',
      societyId: 'lodha-amara',
      societyName: 'Lodha Amara',
      profileId: 'res-lodha-101',
      topicId: 'parking',
      unlockedAt: 'Today',
      pricePaid: 129
    }
  ]);

  // Helper to map state to URL path
  const getUrlForState = (
    view: ViewState,
    soc: Society | null,
    prof: ResidentKnowledgeProfile | null,
    mode: 'LANDING' | 'WIZARD'
  ): string => {
    switch (view) {
      case 'HOME':
        return '/';
      case 'SOCIETY':
        return soc ? `/society/${soc.id}` : '/';
      case 'RESIDENT_PROFILE':
        return prof ? `/society/${prof.societyId}/resident/${prof.id}` : (soc ? `/society/${soc.id}` : '/');
      case 'LIBRARY':
        return '/library';
      case 'CONTRIBUTOR_FLOW':
        return mode === 'WIZARD' ? '/contributor-registration' : '/contributor';
      case 'TERMS':
        return '/terms-and-conditions';
      case 'PRIVACY':
        return '/privacy-policy';
      case 'REFUND':
        return '/refund-policy';
      case 'DISCLAIMER':
        return '/legal-disclaimer';
      case 'CONTACT':
        return '/contact-us';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  // Helper to parse URL path to application state
  const parsePathToState = useCallback((pathname: string) => {
    const rawPath = pathname.split('?')[0].split('#')[0];
    const cleanPath = rawPath.replace(/\/$/, '') || '/';

    if (cleanPath === '/' || cleanPath === '') {
      return { view: 'HOME' as ViewState };
    }
    if (cleanPath === '/library') {
      return { view: 'LIBRARY' as ViewState };
    }
    if (cleanPath === '/contributor-registration' || cleanPath.startsWith('/contributor-registration')) {
      return { view: 'CONTRIBUTOR_FLOW' as ViewState, contributorMode: 'WIZARD' as const };
    }
    if (cleanPath === '/contributor' || cleanPath.startsWith('/contributor') || cleanPath === '/become-expert') {
      return { view: 'CONTRIBUTOR_FLOW' as ViewState, contributorMode: 'LANDING' as const };
    }
    if (cleanPath === '/terms-and-conditions' || cleanPath === '/terms') {
      return { view: 'TERMS' as ViewState };
    }
    if (cleanPath === '/privacy-policy' || cleanPath === '/privacy') {
      return { view: 'PRIVACY' as ViewState };
    }
    if (cleanPath === '/refund-policy' || cleanPath === '/refund') {
      return { view: 'REFUND' as ViewState };
    }
    if (cleanPath === '/legal-disclaimer' || cleanPath === '/disclaimer') {
      return { view: 'DISCLAIMER' as ViewState };
    }
    if (cleanPath === '/contact-us' || cleanPath === '/contact') {
      return { view: 'CONTACT' as ViewState };
    }
    if (cleanPath === '/admin') {
      return { view: 'ADMIN' as ViewState };
    }

    // Match resident profile: /society/:socId/resident/:profId OR /resident/:profId
    const residentMatch = cleanPath.match(/(?:\/society\/([^/]+))?\/resident\/([^/]+)$/);
    if (residentMatch) {
      const profId = residentMatch[2];
      for (const soc of societies) {
        const foundProf = soc.profiles.find(p => p.id === profId);
        if (foundProf) {
          return { view: 'RESIDENT_PROFILE' as ViewState, society: soc, profile: foundProf };
        }
      }
    }

    // Match society: /society/:socId OR /locality/:socId OR /explore/:socId
    const societyMatch = cleanPath.match(/^\/(?:society|locality|explore|city)\/([^/]+)$/);
    if (societyMatch) {
      const socId = societyMatch[1];
      const foundSoc = societies.find(s => 
        s.id === socId || 
        s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === socId ||
        s.city.toLowerCase() === socId.toLowerCase()
      );
      if (foundSoc) {
        return { view: 'SOCIETY' as ViewState, society: foundSoc };
      }
    }

    return { view: 'HOME' as ViewState };
  }, [societies]);

  const parsePathToStateRef = useRef(parsePathToState);
  useEffect(() => {
    parsePathToStateRef.current = parsePathToState;
  }, [parsePathToState]);

  // Initial routing on mount and popstate handling
  useEffect(() => {
    const route = parsePathToStateRef.current(window.location.pathname);
    setViewState(route.view);
    if (route.society) setSelectedSociety(route.society);
    if (route.profile) setSelectedResidentProfile(route.profile);
    if (route.contributorMode) setContributorMode(route.contributorMode);

    const handlePopState = () => {
      const r = parsePathToStateRef.current(window.location.pathname);
      setViewState(r.view);
      if (r.society) setSelectedSociety(r.society);
      if (r.profile) setSelectedResidentProfile(r.profile);
      if (r.contributorMode) setContributorMode(r.contributorMode);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-transition to WIZARD mode (form) when user is authenticated during CONTRIBUTOR_FLOW
  useEffect(() => {
    if (user && viewState === 'CONTRIBUTOR_FLOW' && contributorMode === 'LANDING') {
      setContributorMode('WIZARD');
    }
  }, [user, viewState, contributorMode]);

  // Synchronize URL and SEO metadata whenever state changes
  useEffect(() => {
    const targetUrl = getUrlForState(viewState, selectedSociety, selectedResidentProfile, contributorMode);
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }

    // Dynamic SEO Title & Meta Tags for pSEO Indexability
    let title = "Before Regret — Real Unfiltered Residential Insights";
    let description = "Discover what residents wish they knew before buying or renting. Get real insights on water supply, maintenance, committee rules, and parking.";

    if (viewState === 'SOCIETY' && selectedSociety) {
      title = `${selectedSociety.name}, ${selectedSociety.locality}, ${selectedSociety.city} — Resident Insights | Before Regret`;
      description = `Verified resident knowledge, water supply, parking, and maintenance reviews for ${selectedSociety.name} in ${selectedSociety.locality}, ${selectedSociety.city}.`;
    } else if (viewState === 'RESIDENT_PROFILE' && selectedResidentProfile) {
      title = `${selectedResidentProfile.residentType} Resident in ${selectedResidentProfile.societyName} (${selectedResidentProfile.yearsLiving} Yrs) | Before Regret`;
      description = `Read verified insights from a ${selectedResidentProfile.yearsLiving}-year ${selectedResidentProfile.residentType.toLowerCase()} resident in ${selectedResidentProfile.societyName}, ${selectedResidentProfile.city}.`;
    } else if (viewState === 'LIBRARY') {
      title = "My Knowledge Library | Before Regret";
      description = "Access your unlocked residential knowledge profiles and society insights.";
    } else if (viewState === 'CONTRIBUTOR_FLOW') {
      title = "Become a Resident Contributor | Before Regret";
      description = "Share your living experience with home buyers and tenants. Help buyers make informed decisions and earn money.";
    } else if (viewState === 'TERMS') {
      title = "Terms & Conditions | Before Regret";
      description = "Terms and conditions for using Before Regret residential knowledge platform.";
    } else if (viewState === 'PRIVACY') {
      title = "Privacy Policy | Before Regret";
      description = "Privacy policy and data protection principles of Before Regret.";
    } else if (viewState === 'REFUND') {
      title = "Refund Policy | Before Regret";
      description = "100% money back guarantee and buyer protection refund policy.";
    } else if (viewState === 'DISCLAIMER') {
      title = "Legal Disclaimer | Before Regret";
      description = "Neutrality policy and legal disclaimer for resident reviews.";
    } else if (viewState === 'CONTACT') {
      title = "Contact Us | Before Regret";
      description = "Get in touch with Before Regret support team.";
    } else if (viewState === 'ADMIN') {
      title = "Platform Admin | Before Regret";
    }

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', window.location.origin + targetUrl);
  }, [viewState, selectedSociety, selectedResidentProfile, contributorMode]);

  const scrollToHeroSearch = () => {
    if (viewState !== 'HOME') {
      setViewState('HOME');
    }
    setTimeout(() => {
      const searchContainer = document.getElementById('hero-search-container') || document.getElementById('hero-search-input');
      if (searchContainer) {
        searchContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const input = document.getElementById('hero-search-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
      }
      window.dispatchEvent(new CustomEvent('trigger-hero-search-glow'));
    }, 100);
  };

  // Keyboard shortcut ⌘K listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        scrollToHeroSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState]);

  const isProfileFullyUnlocked = (profileId: string) => {
    return unlockedPurchases.some(p => p.profileId === profileId && p.type === 'FULL_PROFILE');
  };

  const isTopicUnlocked = (profileId: string, topicId: string) => {
    if (isProfileFullyUnlocked(profileId)) return true;
    return unlockedPurchases.some(p => p.profileId === profileId && p.topicId === topicId);
  };

  const handleOpenUnlockSingleTopic = (profile: ResidentKnowledgeProfile, topic: TopicKnowledge) => {
    setUnlockTargetProfile(profile);
    setUnlockTargetTopic(topic);
    setIsUnlockModalOpen(true);
  };

  const handleOpenUnlockFullProfile = (profile: ResidentKnowledgeProfile) => {
    setUnlockTargetProfile(profile);
    setUnlockTargetTopic(null);
    setIsUnlockModalOpen(true);
  };

  const handleUnlockTopicPromptFromSociety = (profile: ResidentKnowledgeProfile) => {
    const firstLockedTopic = profile.topics.find(t => !isTopicUnlocked(profile.id, t.id)) || profile.topics[0];
    handleOpenUnlockSingleTopic(profile, firstLockedTopic);
  };

  const handleConfirmPayment = (profileId: string, topicId?: string, pricePaid: number = 129) => {
    if (!unlockTargetProfile) return;

    const newPurchase: UnlockedPurchase = {
      id: `purch-${Date.now()}`,
      type: topicId ? 'SINGLE_TOPIC' : 'FULL_PROFILE',
      societyId: unlockTargetProfile.societyId,
      societyName: unlockTargetProfile.societyName,
      profileId: profileId,
      topicId: topicId,
      unlockedAt: 'Just now',
      pricePaid: pricePaid
    };

    setUnlockedPurchases(prev => [newPurchase, ...prev]);
  };

  const handleSelectSocietyAndNavigate = (society: Society) => {
    setSelectedSociety(society);
    setViewState('SOCIETY');
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectResidentProfileAndNavigate = (profile: ResidentKnowledgeProfile) => {
    setSelectedResidentProfile(profile);
    setViewState('RESIDENT_PROFILE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchFromHero = (query: string) => {
    setGlobalSearchQuery(query);
    setIsSearchOpen(true);
  };

  const handlePublishComplete = () => {
    setViewState('HOME');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchFilteredSocieties = societies.filter(s =>
    s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    s.locality.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#F7F9FC] text-slate-900 font-sans min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sticky Header Navbar */}
      <Navbar
        currentView={viewState}
        setView={(view) => {
          setViewState(view);
          if (view === 'CONTRIBUTOR_FLOW') {
            const hasUser = user || localStorage.getItem('br_current_user');
            setContributorMode(hasUser ? 'WIZARD' : 'LANDING');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unlockedCount={unlockedPurchases.length}
        onOpenSearch={scrollToHeroSearch}
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        
        {/* VIEW 1: HOMEPAGE */}
        {viewState === 'HOME' && (
          <>
            <Hero
              onSearch={handleSearchFromHero}
              onSelectSociety={handleSelectSocietyAndNavigate}
              societies={societies}
              onBecomeContributor={() => {
                setViewState('CONTRIBUTOR_FLOW');
                setContributorMode(user ? 'WIZARD' : 'LANDING');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <HowItWorks />

            <WhyBeforeRegret
              onSearchClick={scrollToHeroSearch}
              onBecomeContributor={() => {
                setViewState('CONTRIBUTOR_FLOW');
                setContributorMode(user ? 'WIZARD' : 'LANDING');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}

        {/* VIEW 2: SOCIETY PAGE */}
        {viewState === 'SOCIETY' && selectedSociety && (
          <SocietyView
            society={selectedSociety}
            onBack={() => {
              setViewState('HOME');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectResidentProfile={handleSelectResidentProfileAndNavigate}
            onUnlockProfile={handleOpenUnlockFullProfile}
            onUnlockTopicPrompt={handleUnlockTopicPromptFromSociety}
            isProfileFullyUnlocked={isProfileFullyUnlocked}
          />
        )}

        {/* VIEW 3: RESIDENT KNOWLEDGE PROFILE PAGE */}
        {viewState === 'RESIDENT_PROFILE' && selectedResidentProfile && (
          <ResidentProfileView
            profile={selectedResidentProfile}
            onBack={() => {
              if (selectedSociety) {
                setViewState('SOCIETY');
              } else {
                setViewState('HOME');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onUnlockTopic={handleOpenUnlockSingleTopic}
            onUnlockAll={handleOpenUnlockFullProfile}
            onOpenTopicModal={(topic) => setActiveTopicModal(topic)}
            isTopicUnlocked={(profId, topId) => isTopicUnlocked(profId, topId)}
            isFullyUnlocked={isProfileFullyUnlocked(selectedResidentProfile.id)}
          />
        )}

        {/* VIEW 4: CONTRIBUTOR LANDING & WIZARD FLOW */}
        {viewState === 'CONTRIBUTOR_FLOW' && (
          contributorMode === 'LANDING' ? (
            <ContributorLanding
              onStartAnswering={() => {
                setContributorMode('WIZARD');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToHome={() => {
                setViewState('HOME');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <ContributorWizard
              societies={societies}
              onBack={() => {
                setContributorMode('LANDING');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToLanding={() => {
                setContributorMode('LANDING');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onPublishComplete={handlePublishComplete}
              onAddNewSociety={(newSoc) => setSocieties(prev => [newSoc, ...prev.filter(s => s.id !== newSoc.id)])}
            />
          )
        )}

        {/* VIEW 5: UNLOCKED KNOWLEDGE LIBRARY */}
        {viewState === 'LIBRARY' && (
          <KnowledgeLibrary
            purchases={unlockedPurchases}
            societies={societies}
            onBack={() => {
              setViewState('HOME');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSociety={handleSelectSocietyAndNavigate}
          />
        )}

        {/* VIEW 6: TERMS */}
        {viewState === 'TERMS' && (
          <TermsConditions onBackToHome={() => setViewState('HOME')} />
        )}

        {/* VIEW 7: PRIVACY */}
        {viewState === 'PRIVACY' && (
          <PrivacyPolicy onBackToHome={() => setViewState('HOME')} />
        )}

        {/* VIEW 8: REFUND */}
        {viewState === 'REFUND' && (
          <RefundPolicy onBackToHome={() => setViewState('HOME')} />
        )}

        {/* VIEW 9: DISCLAIMER */}
        {viewState === 'DISCLAIMER' && (
          <LegalDisclaimer onBackToHome={() => setViewState('HOME')} />
        )}

        {/* VIEW 10: CONTACT */}
        {viewState === 'CONTACT' && (
          <ContactUs onBackToHome={() => setViewState('HOME')} />
        )}

        {/* VIEW 11: ADMIN */}
        {viewState === 'ADMIN' && (
          <AdminPanel
            setView={setViewState}
            activeRole="guest"
            setActiveRole={() => {}}
            queries={[]}
            setQueries={() => {}}
            experts={INITIAL_EXPERTS}
            localities={INITIAL_LOCALITIES}
            onOpenQuery={() => {}}
            societies={societies}
            setSocieties={setSocieties}
          />
        )}

      </main>

      {/* Global Footer */}
      <Footer
        setView={(view) => {
          setViewState(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={scrollToHeroSearch}
      />

      {/* Topic Detail Reader Modal */}
      <TopicDetailModal
        topic={activeTopicModal}
        onClose={() => setActiveTopicModal(null)}
        societyName={selectedResidentProfile?.societyName || selectedSociety?.name || 'Society'}
      />

      {/* Unlock Checkout Modal */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        profile={unlockTargetProfile}
        selectedTopic={unlockTargetTopic}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Global Search Overlay Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="bg-white border border-[#E4E4E7] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E4E4E7] flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search by society name, locality or city..."
                autoFocus
                className="w-full text-base bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400 font-sans"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {searchFilteredSocieties.length > 0 ? (
                searchFilteredSocieties.map((society) => (
                  <div
                    key={society.id}
                    onClick={() => handleSelectSocietyAndNavigate(society)}
                    className="p-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {society.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{society.locality}, {society.city}</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full">
                        {society.residentProfilesCount} Resident Profiles
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  No societies found matching "{globalSearchQuery}".
                </div>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] font-sans text-slate-400 flex justify-between items-center">
              <span>Press <kbd className="bg-slate-200 px-1 rounded text-slate-700">ESC</kbd> to close</span>
              <span>Before Regret Residential Search</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
