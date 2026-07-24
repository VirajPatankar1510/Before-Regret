import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles, 
  RotateCw, Search, Building2, Plus, MapPin, ShieldCheck, 
  Check, Edit3, User, Info, CheckSquare, Square,
  Navigation, Lock, LogIn, UserCheck
} from 'lucide-react';
import { Society } from '../types';
import { CONTRIBUTOR_QUESTIONS, TOPIC_METADATA } from '../data/societies';
import { generateAnonymousDisplayName } from '../utils/nameGenerator';
import { 
  normalizeSocietyName, 
  fuzzyMatchSociety, 
  searchSocietiesEngine 
} from '../utils/societySearch';
import { useAuth } from '../context/AuthContext';

interface ContributorWizardProps {
  societies: Society[];
  onBack: () => void;
  onBackToLanding?: () => void;
  onPublishComplete: (newSocietyName: string) => void;
  onAddNewSociety?: (newSociety: Society) => void;
}

type WizardStep = 'PERSONAL_DETAILS' | 'SEARCH_SOCIETY' | 'TOPICS_SELECT' | 'QUESTION_SCREENS' | 'PREVIEW_EDIT' | 'PUBLISHED';

export const ContributorWizard: React.FC<ContributorWizardProps> = ({
  societies,
  onBack,
  onBackToLanding,
  onPublishComplete,
  onAddNewSociety,
}) => {
  // Auth context check
  const { user, isClerkActive, triggerClerkSignIn, triggerClerkSignUp, loginWithMockUser } = useAuth();

  // Step State
  const [step, setStep] = useState<WizardStep>('PERSONAL_DETAILS');

  // STEP 1: Personal Details State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Auto populate name if logged in user has displayName
  useEffect(() => {
    if (user && user.displayName && !firstName && !lastName) {
      const parts = user.displayName.trim().split(' ');
      if (parts.length > 0) setFirstName(parts[0]);
      if (parts.length > 1) setLastName(parts.slice(1).join(' '));
    }
  }, [user]);
  const [publicDisplayName, setPublicDisplayName] = useState(() => generateAnonymousDisplayName());
  const [yearsLiving, setYearsLiving] = useState<number>(3);
  const [residentType, setResidentType] = useState<'Owner' | 'Tenant'>('Owner');
  const [personalDetailsError, setPersonalDetailsError] = useState('');

  // STEP 2: Society Search & Add State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);

  // Add Society Form State
  const [isAddingNewSociety, setIsAddingNewSociety] = useState(false);
  const [newSocName, setNewSocName] = useState('');
  const [newSocLandmark, setNewSocLandmark] = useState('');
  const [newSocCity, setNewSocCity] = useState('Thane, Mumbai MMR');
  const [newSocPincode, setNewSocPincode] = useState('');
  const [addSocError, setAddSocError] = useState('');

  // Fuzzy match warning state
  const [fuzzySuggestions, setFuzzySuggestions] = useState<Society[]>([]);
  const [showFuzzyWarning, setShowFuzzyWarning] = useState(false);
  const [pendingSocToCreate, setPendingSocToCreate] = useState<{
    normName: string;
    landmark: string;
    city: string;
    pincode: string;
  } | null>(null);

  // STEP 3: Topic Selection State
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([
    'parking', 'water', 'internet', 'noise', 'security', 'electricity'
  ]);

  // STEP 4: Questions & Answers State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // STEP 5: Generated Summaries State
  const [generatedSummaries, setGeneratedSummaries] = useState<Record<string, string>>({});
  const [declaredTruthful, setDeclaredTruthful] = useState(false);

  // Autosave notification state
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving'>('saved');

  // Trigger autosave feedback micro-effect
  useEffect(() => {
    setAutosaveStatus('saving');
    const t = setTimeout(() => setAutosaveStatus('saved'), 400);
    return () => clearTimeout(t);
  }, [firstName, lastName, publicDisplayName, selectedSociety, answers, selectedTopicIds]);

  // Handler: Refresh Display Name
  const handleRefreshDisplayName = () => {
    const newName = generateAnonymousDisplayName();
    setPublicDisplayName(newName);
  };

  // Handler: Step 1 Submit
  const handlePersonalDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setPersonalDetailsError('Please enter both First Name and Last Name.');
      return;
    }
    setPersonalDetailsError('');
    setStep('SEARCH_SOCIETY');
  };

  // Search results
  const searchResults = useMemo(() => {
    return searchSocietiesEngine(searchQuery, societies);
  }, [searchQuery, societies]);

  // Handler: Select Existing Society
  const handleSelectSociety = (society: Society) => {
    setSelectedSociety(society);
    setIsAddingNewSociety(false);
    setShowFuzzyWarning(false);
    setStep('TOPICS_SELECT');
  };

  // Handler: Add New Society Form Submit
  const handleAddNewSocietySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocName.trim()) {
      setAddSocError('Society Name is required.');
      return;
    }
    if (!newSocLandmark.trim()) {
      setAddSocError('Nearest Landmark is required.');
      return;
    }
    if (!newSocCity.trim()) {
      setAddSocError('City is required.');
      return;
    }
    if (!newSocPincode.trim()) {
      setAddSocError('Pincode is required.');
      return;
    }

    setAddSocError('');

    // Normalization
    const normName = normalizeSocietyName(newSocName);

    // Fuzzy duplicate check
    const fuzzyCheck = fuzzyMatchSociety(normName, societies);

    if (fuzzyCheck.exactMatch) {
      // Direct exact match found! Select existing society immediately
      handleSelectSociety(fuzzyCheck.exactMatch);
      return;
    }

    if (fuzzyCheck.suggestions.length > 0) {
      // Fuzzy matches found! Show "Did you mean..." warning
      setFuzzySuggestions(fuzzyCheck.suggestions.map(s => s.society));
      setPendingSocToCreate({
        normName,
        landmark: newSocLandmark.trim(),
        city: newSocCity.trim(),
        pincode: newSocPincode.trim()
      });
      setShowFuzzyWarning(true);
      return;
    }

    // No similar society found -> create Pending Society immediately
    createPendingSocietyAndProceed(normName, newSocLandmark.trim(), newSocCity.trim(), newSocPincode.trim());
  };

  // Helper to create pending society with UUID
  const createPendingSocietyAndProceed = (
    normName: string,
    landmark: string,
    city: string,
    pincode: string
  ) => {
    const newSociety: Society = {
      id: 'soc-' + crypto.randomUUID(),
      name: normName,
      normalizedName: normName.toUpperCase(),
      city: city,
      locality: landmark.includes('Road') || landmark.includes('Nagar') ? landmark : `${landmark} Area`,
      state: 'Maharashtra',
      pincode: pincode,
      landmark: landmark,
      verificationStatus: 'Pending',
      aliases: [normName, `${normName} CHS`, `${normName} Society`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      residentProfilesCount: 1,
      totalTopicsAvailable: 11,
      lastUpdated: 'Just now',
      description: `Residential society located near ${landmark}, ${city}. Currently pending resident verification.`,
      profiles: []
    };

    if (onAddNewSociety) {
      onAddNewSociety(newSociety);
    }

    handleSelectSociety(newSociety);
  };

  // Toggle Topic Selection
  const toggleTopic = (id: string) => {
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length > 1) {
        setSelectedTopicIds(selectedTopicIds.filter(t => t !== id));
      }
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  // Questions for chosen topics
  const questionsToAnswer = useMemo(() => {
    return CONTRIBUTOR_QUESTIONS.filter(q => selectedTopicIds.includes(q.topicId));
  }, [selectedTopicIds]);

  const handleAnswerQuestion = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsToAnswer.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      generateParagraphs();
      setStep('PREVIEW_EDIT');
    }
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questionsToAnswer.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      generateParagraphs();
      setStep('PREVIEW_EDIT');
    }
  };

  // Auto-generate natural paragraphs for preview
  const generateParagraphs = () => {
    const summaryMap: Record<string, string> = {};

    selectedTopicIds.forEach(topicId => {
      const topicMeta = TOPIC_METADATA.find(t => t.id === topicId);
      const topicQuestions = CONTRIBUTOR_QUESTIONS.filter(q => q.topicId === topicId);

      const answeredOptions = topicQuestions
        .map(q => answers[q.id])
        .filter(Boolean);

      if (answeredOptions.length > 0) {
        summaryMap[topicId] = `In ${selectedSociety?.name || 'our society'}, ${topicMeta?.title || topicId} is reported as follows: ${answeredOptions.join('. ')}. Based on ${yearsLiving} years of personal living experience as an ${residentType.toLowerCase()} resident, conditions remain authentic and verified.`;
      } else {
        summaryMap[topicId] = `Resident feedback for ${topicMeta?.title || topicId} in ${selectedSociety?.name || 'this society'} confirms standard operational management based on ${yearsLiving} years of personal living experience.`;
      }
    });

    setGeneratedSummaries(summaryMap);
  };

  // Final Publish
  const handlePublish = () => {
    if (!declaredTruthful) return;

    if (selectedSociety && onAddNewSociety) {
      // Add profile to selected society
      const newProfile = {
        id: 'res-' + crypto.randomUUID(),
        societyId: selectedSociety.id,
        societyName: selectedSociety.name,
        city: selectedSociety.city,
        locality: selectedSociety.locality,
        livingSince: `${new Date().getFullYear() - yearsLiving}`,
        yearsLiving: yearsLiving,
        helpedBuyersCount: 1,
        rating: 5.0,
        verifiedResident: true,
        residentType: residentType,
        topicsAnsweredCount: selectedTopicIds.length,
        lastUpdated: 'Just now',
        freshnessStatus: 'Current' as const,
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: selectedTopicIds.map(topicId => {
          const meta = TOPIC_METADATA.find(t => t.id === topicId);
          return {
            id: topicId,
            title: meta?.title || topicId,
            category: meta?.category || 'General',
            iconName: meta?.iconName || 'Info',
            readingTime: '2 min read',
            lastUpdated: 'Just now',
            freshnessStatus: 'Current' as const,
            singlePrice: 129,
            summary: generatedSummaries[topicId] || 'Resident verified insights.',
            structuredQA: CONTRIBUTOR_QUESTIONS
              .filter(q => q.topicId === topicId && answers[q.id])
              .map(q => ({
                questionId: q.id,
                question: q.questionText,
                answer: answers[q.id]
              }))
          };
        })
      };

      const updatedSoc: Society = {
        ...selectedSociety,
        residentProfilesCount: selectedSociety.residentProfilesCount + 1,
        profiles: [newProfile, ...selectedSociety.profiles]
      };

      onAddNewSociety(updatedSoc);
    }

    setStep('PUBLISHED');
  };

  if (!user) {
    return (
      <div className="bg-[#F7F9FC] min-h-screen flex flex-col justify-center items-center p-4">
        {/* Center Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-[#E4E4E7] rounded-2xl p-4 sm:p-5 space-y-3.5 text-center max-w-sm w-full shadow-xs"
        >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Log In Required
              </h2>
            </div>

            <div className="space-y-2 pt-0.5">
              <button
                onClick={() => {
                  if (isClerkActive) {
                    triggerClerkSignIn(`${window.location.origin}/contributor-registration`);
                  } else {
                    loginWithMockUser({
                      uid: `user_${Date.now()}`,
                      displayName: 'Resident Contributor',
                      email: 'resident@example.com'
                    });
                  }
                }}
                className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>

              <button
                onClick={() => {
                  if (isClerkActive) {
                    triggerClerkSignUp(`${window.location.origin}/contributor-registration`);
                  } else {
                    const sampleEmail = prompt('Enter your email to sign up:');
                    if (sampleEmail && sampleEmail.trim()) {
                      const name = sampleEmail.split('@')[0];
                      loginWithMockUser({
                        uid: `user_${Date.now()}`,
                        displayName: name.charAt(0).toUpperCase() + name.slice(1),
                        email: sampleEmail.trim()
                      });
                    } else if (sampleEmail === '') {
                      loginWithMockUser({
                        uid: `user_${Date.now()}`,
                        displayName: 'New Resident',
                        email: 'newresident@example.com'
                      });
                    }
                  }
                }}
                className="w-full py-2 bg-white hover:bg-slate-50 text-[#2563EB] border border-[#2563EB]/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>

              <button
                onClick={onBackToLanding || onBack}
                className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FC] min-h-screen pb-20">
      
      {/* Sleek Minimal Top Navigation */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#E4E4E7] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit</span>
          </button>

          {/* Step Dots Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-slate-400">
              {step === 'PERSONAL_DETAILS' ? '1 of 4' :
               step === 'SEARCH_SOCIETY' ? '2 of 4' :
               step === 'TOPICS_SELECT' ? '3 of 4' :
               step === 'QUESTION_SCREENS' ? '4 of 4' : 'Done'}
            </span>
            <div className="flex gap-1">
              {['PERSONAL_DETAILS', 'SEARCH_SOCIETY', 'TOPICS_SELECT', 'QUESTION_SCREENS'].map((s, idx) => {
                const stepOrder = ['PERSONAL_DETAILS', 'SEARCH_SOCIETY', 'TOPICS_SELECT', 'QUESTION_SCREENS', 'PREVIEW_EDIT', 'PUBLISHED'];
                const currentIdx = stepOrder.indexOf(step);
                const isComplete = currentIdx > idx;
                const isCurrent = currentIdx === idx;
                return (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCurrent ? 'w-6 bg-[#2563EB]' : isComplete ? 'w-2 bg-blue-300' : 'w-2 bg-slate-200'
                    }`} 
                  />
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {autosaveStatus === 'saving' ? 'Saving...' : 'Autosaved'}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 'PERSONAL_DETAILS' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
          >
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Enter your name
              </h2>
              <p className="text-xs text-slate-500">
                Your real name stays private. Buyers only see your Display Name.
              </p>
            </div>

            <form onSubmit={handlePersonalDetailsSubmit} className="space-y-5">
              
              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#2563EB] focus:bg-white focus:outline-none transition-all placeholder:text-[11px] placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#2563EB] focus:bg-white focus:outline-none transition-all placeholder:text-[11px] placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Public Persona Bar */}
              <div className="h-13 px-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 overflow-hidden">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase truncate">Choose Display Name:</div>
                  <div className="text-xs font-bold text-slate-900 truncate">{publicDisplayName}</div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshDisplayName}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg transition-all shadow-2xs cursor-pointer shrink-0"
                >
                  <RotateCw className="w-3 h-3 text-[#2563EB]" />
                  <span>Refresh</span>
                </button>
              </div>

              {personalDetailsError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                  {personalDetailsError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: SEARCH OR ADD SOCIETY */}
        {step === 'SEARCH_SOCIETY' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs"
          >
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Find your society
              </h2>
              <p className="text-xs text-slate-500">
                Search our verified index or add your society if it's missing.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsAddingNewSociety(false);
                }}
                placeholder="Type society name or locality..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white focus:outline-none transition-all placeholder:text-xs placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* Results list */}
            {!isAddingNewSociety && (
              <div className="space-y-2">
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSociety(s)}
                      className="p-3 bg-[#F7F9FC] hover:bg-blue-50/80 border border-[#E4E4E7] hover:border-blue-300 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.verificationStatus === 'Pending' && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{s.locality}, {s.city}</span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Select →
                      </span>
                    </div>
                  ))}

                  {searchResults.length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No matching society found for "{searchQuery}".
                    </div>
                  )}
                </div>

                {/* Add new society prompt */}
                <div className="pt-2 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                  <span className="text-xs text-slate-600 font-medium">Can't find your society?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewSociety(true);
                      if (searchQuery) setNewSocName(searchQuery);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Society</span>
                  </button>
                </div>
              </div>
            )}

            {/* Add New Society Form Drawer */}
            {isAddingNewSociety && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Building2 className="w-4 h-4 text-[#2563EB]" />
                    <span>Add New Society</span>
                  </div>
                  <button
                    onClick={() => setIsAddingNewSociety(false)}
                    className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Fuzzy Duplicate Warning */}
                {showFuzzyWarning && fuzzySuggestions.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                    <div className="font-bold text-amber-900">Did you mean an existing society?</div>
                    <div className="space-y-1">
                      {fuzzySuggestions.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSociety(s)}
                          className="p-2 bg-white border border-amber-200 rounded cursor-pointer hover:bg-amber-100/50 flex justify-between"
                        >
                          <span className="font-bold text-slate-900">{s.name} ({s.locality})</span>
                          <span className="text-blue-600 font-semibold">Select</span>
                        </div>
                      ))}
                    </div>

                    {pendingSocToCreate && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => createPendingSocietyAndProceed(
                            pendingSocToCreate.normName,
                            pendingSocToCreate.landmark,
                            pendingSocToCreate.city,
                            pendingSocToCreate.pincode
                          )}
                          className="px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg cursor-pointer"
                        >
                          Confirm "{pendingSocToCreate.normName}"
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!showFuzzyWarning && (
                  <form onSubmit={handleAddNewSocietySubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-700">Society Name *</label>
                        <input
                          type="text"
                          required
                          value={newSocName}
                          onChange={(e) => setNewSocName(e.target.value)}
                          placeholder="e.g. Lodha Splendor"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563EB] placeholder:text-[11px] placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-700">Landmark *</label>
                        <input
                          type="text"
                          required
                          value={newSocLandmark}
                          onChange={(e) => setNewSocLandmark(e.target.value)}
                          placeholder="e.g. Near Majiwada Flyover"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563EB] placeholder:text-[11px] placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-700">City *</label>
                        <input
                          type="text"
                          required
                          value={newSocCity}
                          onChange={(e) => setNewSocCity(e.target.value)}
                          placeholder="e.g. Thane, Mumbai MMR"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563EB] placeholder:text-[11px] placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-700">Pincode *</label>
                        <input
                          type="text"
                          required
                          value={newSocPincode}
                          onChange={(e) => setNewSocPincode(e.target.value)}
                          placeholder="e.g. 400601"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563EB] placeholder:text-[11px] placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                    </div>

                    {addSocError && (
                      <div className="p-2 bg-red-50 text-red-700 text-xs rounded-md">
                        {addSocError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      Save Society & Continue →
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('PERSONAL_DETAILS')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: TOPICS SELECT */}
        {step === 'TOPICS_SELECT' && selectedSociety && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs"
          >
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Select topics you know
              </h2>
              <p className="text-xs text-slate-500">
                Insights for <strong className="text-slate-800">{selectedSociety.name}</strong> ({selectedSociety.city}).
              </p>
            </div>

            {/* Selected Society Badge */}
            <div className="px-3 py-2 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                📍 {selectedSociety.name}, {selectedSociety.locality}
              </span>
              <button
                onClick={() => setStep('SEARCH_SOCIETY')}
                className="text-blue-600 hover:underline font-semibold cursor-pointer text-[11px]"
              >
                Change
              </button>
            </div>

            {/* Residence Info (Years living here & Occupancy) */}
            <div className="bg-[#F7F9FC] border border-[#E4E4E7] rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-800">Your Living Experience in {selectedSociety.name}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Years Living Here</label>
                  <select
                    value={yearsLiving}
                    onChange={(e) => setYearsLiving(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(y => (
                      <option key={y} value={y}>{y} {y === 1 ? 'Year' : 'Years'}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Occupancy</label>
                  <select
                    value={residentType}
                    onChange={(e) => setResidentType(e.target.value as 'Owner' | 'Tenant')}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  >
                    <option value="Owner">Owner Resident</option>
                    <option value="Tenant">Tenant Resident</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {TOPIC_METADATA.map((topic) => {
                const isSelected = selectedTopicIds.includes(topic.id);
                return (
                  <div
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      isSelected 
                        ? 'bg-blue-50 border-[#2563EB] text-slate-900 font-semibold' 
                        : 'bg-[#F7F9FC] border-[#E4E4E7] hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#2563EB] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs truncate">{topic.title}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('SEARCH_SOCIETY')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setStep('QUESTION_SCREENS');
                }}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Answer Questions ({questionsToAnswer.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: QUESTION SCREENS */}
        {step === 'QUESTION_SCREENS' && questionsToAnswer.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
          >
            {/* Header with question counter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold text-[#2563EB]">
                {questionsToAnswer[currentQuestionIndex].topicTitle} • {currentQuestionIndex + 1}/{questionsToAnswer.length}
              </span>

              <span className="text-[11px] font-mono text-slate-400">
                {Math.round(((currentQuestionIndex + 1) / questionsToAnswer.length) * 100)}% Complete
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {questionsToAnswer[currentQuestionIndex].questionText}
              </h3>

              {/* Options list */}
              <div className="space-y-2">
                {questionsToAnswer[currentQuestionIndex].options.map((optionText) => {
                  const isChosen = answers[questionsToAnswer[currentQuestionIndex].id] === optionText;
                  return (
                    <div
                      key={optionText}
                      onClick={() => handleAnswerQuestion(questionsToAnswer[currentQuestionIndex].id, optionText)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm ${
                        isChosen 
                          ? 'bg-blue-50 border-[#2563EB] text-slate-900 font-semibold shadow-2xs' 
                          : 'bg-[#F7F9FC] border-[#E4E4E7] hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span>{optionText}</span>
                      {isChosen && <Check className="w-4 h-4 text-[#2563EB]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Skip question
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentQuestionIndex < questionsToAnswer.length - 1 ? 'Next' : 'Review Profile'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: PREVIEW & PUBLISH */}
        {step === 'PREVIEW_EDIT' && selectedSociety && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs"
          >
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Review your profile
              </h2>
              <p className="text-xs text-slate-500">
                Auto-generated summaries based on your answers. Feel free to adjust text.
              </p>
            </div>

            {/* Contributor Card Badge */}
            <div className="px-4 py-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-blue-300">{publicDisplayName}</div>
                <div className="text-[11px] text-slate-300">{residentType} Resident • {yearsLiving} Yrs in {selectedSociety.name}</div>
              </div>
              <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded-full text-[10px]">
                Verified
              </span>
            </div>

            {/* Editable Summaries */}
            <div className="space-y-3">
              {selectedTopicIds.map((topicId) => {
                const meta = TOPIC_METADATA.find(t => t.id === topicId);
                return (
                  <div key={topicId} className="p-3 bg-[#F7F9FC] border border-[#E4E4E7] rounded-xl space-y-1.5">
                    <div className="text-xs font-bold text-slate-800">
                      {meta?.title || topicId}
                    </div>

                    <textarea
                      rows={2}
                      value={generatedSummaries[topicId] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGeneratedSummaries(prev => ({ ...prev, [topicId]: val }));
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>

            {/* Truthfulness Declaration */}
            <div 
              onClick={() => setDeclaredTruthful(!declaredTruthful)}
              className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl cursor-pointer flex items-center gap-2.5 text-xs text-slate-800"
            >
              {declaredTruthful ? (
                <CheckSquare className="w-4 h-4 text-[#2563EB] shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>I confirm that these insights reflect my genuine living experience in {selectedSociety.name}.</span>
            </div>

            <button
              type="button"
              disabled={!declaredTruthful}
              onClick={handlePublish}
              className="w-full py-3.5 bg-[#2563EB] disabled:opacity-50 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Publish Profile</span>
            </button>
          </motion.div>
        )}

        {/* STEP 6: PUBLISHED CONFIRMATION */}
        {step === 'PUBLISHED' && selectedSociety && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-8 text-center space-y-5 shadow-sm max-w-lg mx-auto"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                Profile Published!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you, <strong>{publicDisplayName}</strong>! Your resident knowledge asset for <strong>{selectedSociety.name}</strong> is live.
              </p>
            </div>

            <button
              onClick={() => onPublishComplete(selectedSociety.name)}
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Return Home</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};
