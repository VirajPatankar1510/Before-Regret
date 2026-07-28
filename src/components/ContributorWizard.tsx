import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles, 
  Search, Building2, Plus, MapPin, ShieldCheck, 
  Check, User, Info, Lock, LogIn, UserCheck, ThumbsUp, AlertTriangle,
  Car, Droplets, Wifi, VolumeX, Zap, ArrowUpSquare, Wrench,
  Trash2, Dumbbell, Users, Receipt, UserCheck as UserCheckIcon,
  Baby, Wind, Sun, Bug, EyeOff, Thermometer, CloudRain,
  HeartHandshake, HelpCircle, Activity, Smile, Dog, ShoppingBag, Bus,
  Utensils, Package, TrendingUp, Truck, Hammer, RefreshCw, UserPlus,
  Square, CheckSquare, Layers, MessageSquare, SkipForward,
  FileSpreadsheet, Download, Upload, FileText, Database, RotateCcw, X, ShieldAlert,
  Star, Sliders, ListChecks
} from 'lucide-react';
import { Society } from '../types';
import { generateAnonymousDisplayName, formatMaskedDisplayName } from '../utils/nameGenerator';
import { 
  normalizeSocietyName, 
  fuzzyMatchSociety, 
  searchSocietiesEngine 
} from '../utils/societySearch';
import { useAuth } from '../context/AuthContext';
import {
  MasterEngineWorkbook,
  WorkbookValidationReport
} from '../types/residentEngineTypes';
import {
  loadMasterEngineWorkbookFromStorage,
  saveMasterEngineWorkbookToStorage,
  resetMasterEngineWorkbookStorage,
  parseWorkbookArrayBuffer
} from '../engine/residentEngineCore';
import { validateWorkbook } from '../engine/residentEngineValidator';
import { downloadMasterEngineWorkbookFile } from '../engine/excelTemplateGenerator';
import { WorkbookDiagnosticModal } from './WorkbookDiagnosticModal';
import { AiReportModal } from './AiReportModal';
import { 
  MAIN_QUESTIONS_CATALOG, 
  getMainQuestionsCatalog,
  MainQuestionItem, 
  FollowUpQuestionConfig, 
  BackgroundQuestionConfig,
  generateRelevantExperienceLabels,
  RelevantExperienceLabels
} from '../data/contributorTopicsData';

// Helper component for dynamic topic icons
const TopicIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className = "w-4 h-4" }) => {
  switch (iconName) {
    case 'Car': return <Car className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'Wifi': return <Wifi className={className} />;
    case 'VolumeX': return <VolumeX className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'ArrowUpSquare': return <ArrowUpSquare className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Trash2': return <Trash2 className={className} />;
    case 'Dumbbell': return <Dumbbell className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Receipt': return <Receipt className={className} />;
    case 'UserCheck': return <UserCheckIcon className={className} />;
    case 'ShieldAlert': return <ShieldCheck className={className} />;
    case 'Baby': return <Baby className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Bug': return <Bug className={className} />;
    case 'EyeOff': return <EyeOff className={className} />;
    case 'Thermometer': return <Thermometer className={className} />;
    case 'CloudRain': return <CloudRain className={className} />;
    case 'HeartHandshake': return <HeartHandshake className={className} />;
    case 'HelpCircle': return <HelpCircle className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Smile': return <Smile className={className} />;
    case 'Dog': return <Dog className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'Bus': return <Bus className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Package': return <Package className={className} />;
    case 'TrendingUp': return <TrendingUp className={className} />;
    case 'Truck': return <Truck className={className} />;
    case 'Hammer': return <Hammer className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'ThumbsUp': return <ThumbsUp className={className} />;
    case 'AlertTriangle': return <AlertTriangle className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'UserPlus': return <UserPlus className={className} />;
    default: return <Info className={className} />;
  }
};

interface ContributorWizardProps {
  societies: Society[];
  onBack: () => void;
  onBackToLanding?: () => void;
  onPublishComplete: (newSocietyName: string) => void;
  onAddNewSociety?: (newSociety: Society) => void;
}

type WizardStep = 
  | 'PERSONAL_DETAILS' 
  | 'SEARCH_SOCIETY' 
  | 'QUESTION_SELECT' 
  | 'QUESTION_INTERVIEW' 
  | 'PREVIEW_EDIT' 
  | 'PUBLISHED';

export const ContributorWizard: React.FC<ContributorWizardProps> = ({
  societies,
  onBack,
  onBackToLanding,
  onPublishComplete,
  onAddNewSociety,
}) => {
  // Auth context check
  const { user } = useAuth();

  // Step State
  const [step, setStep] = useState<WizardStep>('PERSONAL_DETAILS');

  // STEP 1: Personal Details State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Auto-populate name if logged-in user has displayName
  useEffect(() => {
    if (user && user.displayName && !firstName && !lastName) {
      const parts = user.displayName.trim().split(' ');
      if (parts.length > 0) setFirstName(parts[0]);
      if (parts.length > 1) setLastName(parts.slice(1).join(' '));
    }
  }, [user]);

  const [publicDisplayName, setPublicDisplayName] = useState(() => generateAnonymousDisplayName());

  // Automatically generate masked display name revealing first 3 letters + *****
  useEffect(() => {
    if (firstName.trim() || lastName.trim()) {
      const combined = `${firstName.trim()} ${lastName.trim()}`.trim();
      setPublicDisplayName(formatMaskedDisplayName(combined));
    }
  }, [firstName, lastName]);

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

  // STEP 3: Main Question Selection State
  const [selectedMainQuestion, setSelectedMainQuestion] = useState<MainQuestionItem | null>(null);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // STEP 4: Structured Interview Sub-State (Question Selection -> Purpose 2 -> Purpose 1)
  const [interviewSubStep, setInterviewSubStep] = useState<'SELECT_5_QUESTIONS' | 'PURPOSE_1' | 'PURPOSE_2'>('SELECT_5_QUESTIONS');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [backgroundAnswers, setBackgroundAnswers] = useState<Record<string, string>>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, any>>({});
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(0);

  // Dynamic Question Pool & Skip/Replace State for Decision Bundles
  const [activeFollowUpQuestions, setActiveFollowUpQuestions] = useState<FollowUpQuestionConfig[]>([]);
  const [questionPool, setQuestionPool] = useState<FollowUpQuestionConfig[]>([]);
  const [skipBanner, setSkipBanner] = useState<string | null>(null);

  // STEP 5: Preview & Declaration State
  const [declaredTruthful, setDeclaredTruthful] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);

  // 100% DATA-DRIVEN MASTER ENGINE WORKBOOK STATE (Excel Compatible)
  const [masterWorkbook, setMasterWorkbook] = useState<MasterEngineWorkbook>(() => loadMasterEngineWorkbookFromStorage());
  const [excelStatusBanner, setExcelStatusBanner] = useState<string | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  const topRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll automatically on top/main section when step, interview sub-step, or question changes
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, interviewSubStep, currentFollowUpIndex]);

  // Realtime Excel Upload Handler
  const handleUploadExcelSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelStatusBanner('Reading and parsing Excel file in real-time...');
      const buffer = await file.arrayBuffer();
      const newWorkbook = parseWorkbookArrayBuffer(buffer);
      
      // Save to local storage for persistence across reloads
      saveMasterEngineWorkbookToStorage(newWorkbook);
      
      // Update state in real-time
      setMasterWorkbook(newWorkbook);
      
      const topicsCount = newWorkbook.topics?.length || 0;
      const questionsCount = newWorkbook.questions?.length || 0;
      
      setExcelStatusBanner(`✅ Realtime Excel Import Complete! Updated ${topicsCount} topics & ${questionsCount} structured questions live.`);
      
      setTimeout(() => {
        setExcelStatusBanner(null);
      }, 6000);
    } catch (err: any) {
      console.error('Failed to parse uploaded Excel file:', err);
      setExcelStatusBanner(`❌ Failed to import Excel sheet: ${err.message || 'Invalid sheet structure'}`);
    } finally {
      e.target.value = '';
    }
  };

  // Realtime Excel Download Handler
  const handleDownloadExcelSheet = () => {
    try {
      downloadMasterEngineWorkbookFile(masterWorkbook);
      setExcelStatusBanner('📥 Master Engine Excel sheet downloaded successfully!');
      setTimeout(() => setExcelStatusBanner(null), 4000);
    } catch (err: any) {
      alert('Failed to download Excel workbook: ' + err.message);
    }
  };

  // Realtime Reset to Default Excel Workbook
  const handleResetExcelToDefault = () => {
    if (window.confirm('Reset Master Engine Workbook to default template? Custom uploaded Excel data will be replaced.')) {
      const resetWb = resetMasterEngineWorkbookStorage();
      setMasterWorkbook(resetWb);
      setExcelStatusBanner('🔄 Master Engine Workbook reset to default schema in real-time.');
      setTimeout(() => setExcelStatusBanner(null), 4000);
    }
  };

  // Compute live validation diagnostic report
  const validationReport = useMemo(() => validateWorkbook(masterWorkbook), [masterWorkbook]);

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

  // Search results for societies
  const searchResults = useMemo(() => {
    return searchSocietiesEngine(searchQuery, societies);
  }, [searchQuery, societies]);

  // Handler: Select Existing Society -> proceed to QUESTION_SELECT
  const handleSelectSociety = (society: Society) => {
    setSelectedSociety(society);
    setIsAddingNewSociety(false);
    setShowFuzzyWarning(false);
    setStep('QUESTION_SELECT');
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

    const normName = normalizeSocietyName(newSocName);
    const fuzzyCheck = fuzzyMatchSociety(normName, societies);

    if (fuzzyCheck.exactMatch) {
      handleSelectSociety(fuzzyCheck.exactMatch);
      return;
    }

    if (fuzzyCheck.suggestions.length > 0) {
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

    createPendingSocietyAndProceed(normName, newSocLandmark.trim(), newSocCity.trim(), newSocPincode.trim());
  };

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
      totalTopicsAvailable: MAIN_QUESTIONS_CATALOG.length,
      lastUpdated: 'Just now',
      description: `Residential society located near ${landmark}, ${city}.`,
      profiles: []
    };

    if (onAddNewSociety) {
      onAddNewSociety(newSociety);
    }

    handleSelectSociety(newSociety);
  };

  // Dynamic Questions Catalog from Excel or Master Workbook
  const activeMainQuestionsCatalog = useMemo(() => {
    return getMainQuestionsCatalog();
  }, [masterWorkbook]);

  // Categories list for Main Questions
  const categoriesList = useMemo(() => {
    const cats = Array.from(new Set(activeMainQuestionsCatalog.map(mq => mq.category)));
    return ['ALL', ...cats];
  }, [activeMainQuestionsCatalog]);

  // Filtered Main Questions Catalog
  const filteredMainQuestions = useMemo(() => {
    return activeMainQuestionsCatalog.filter(mq => {
      const matchesCat = selectedCategory === 'ALL' || mq.category === selectedCategory;
      const matchesSearch = !questionSearchQuery.trim() ||
        mq.title.toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
        mq.description.toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
        mq.category.toLowerCase().includes(questionSearchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeMainQuestionsCatalog, selectedCategory, questionSearchQuery]);

  // Select 1 Main Question and initialize 5-question selection step
  const handleSelectMainQuestion = (mq: MainQuestionItem) => {
    setSelectedMainQuestion(mq);
    
    // Initialize background field defaults
    const initialBg: Record<string, string> = {};
    mq.backgroundFields.forEach(bg => {
      initialBg[bg.id] = bg.defaultValue || (bg.options[0] || '');
    });
    setBackgroundAnswers(initialBg);

    // Compulsory rating questions are included automatically
    const ratingQIds = mq.followUpQuestions.filter(fq => fq.inputType === 'rating').map(fq => fq.id);
    const nonRatingQIds = mq.followUpQuestions.filter(fq => fq.inputType !== 'rating').map(fq => fq.id);

    // Pre-select rating questions + up to 5 total questions
    const default5 = [...ratingQIds, ...nonRatingQIds.slice(0, Math.max(0, 5 - ratingQIds.length))];
    setSelectedQuestionIds(default5);

    // Initialize follow-up answers map
    const initialFollowUps: Record<string, any> = {};
    mq.followUpQuestions.forEach(fq => {
      if (fq.inputType === 'checkbox') {
        initialFollowUps[fq.id] = [];
      } else if (fq.inputType === 'rating') {
        initialFollowUps[fq.id] = 0; // Unselected (0 stars)
      } else if (fq.inputType === 'slider') {
        initialFollowUps[fq.id] = Math.round(((fq.sliderMin || 1) + (fq.sliderMax || 10)) / 2);
      } else {
        initialFollowUps[fq.id] = fq.options?.[0] || '';
      }
    });
    setFollowUpAnswers(initialFollowUps);
    setCurrentFollowUpIndex(0);
    setSkipBanner(null);

    setInterviewSubStep('SELECT_5_QUESTIONS');
    setStep('QUESTION_INTERVIEW');
  };

  // Toggle selection of a question in the 5-question selector
  const handleToggleQuestionSelection = (qId: string) => {
    if (!selectedMainQuestion) return;
    const targetQ = selectedMainQuestion.followUpQuestions.find(fq => fq.id === qId);
    if (!targetQ) return;

    // Compulsory rating questions cannot be toggled off
    if (targetQ.inputType === 'rating') {
      return;
    }

    setSelectedQuestionIds(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      } else {
        if (prev.length >= 5) {
          // Replace the oldest selected non-rating question
          const ratingQIds = selectedMainQuestion.followUpQuestions
            .filter(fq => fq.inputType === 'rating')
            .map(fq => fq.id);
          const nonRatingSelected = prev.filter(id => !ratingQIds.includes(id));
          if (nonRatingSelected.length > 0) {
            const oldestNonRating = nonRatingSelected[0];
            return [...prev.filter(id => id !== oldestNonRating), qId];
          }
        }
        return [...prev, qId];
      }
    });
  };

  // Confirm selected 5 questions and start interview
  const handleConfirmSelectedQuestions = () => {
    if (!selectedMainQuestion) return;

    const chosen = selectedMainQuestion.followUpQuestions.filter(fq => selectedQuestionIds.includes(fq.id));

    // Fallback if none selected
    const active = chosen.length > 0 ? chosen : selectedMainQuestion.followUpQuestions.slice(0, 5);

    setActiveFollowUpQuestions(active);
    setCurrentFollowUpIndex(0);
    setInterviewSubStep('PURPOSE_2');
  };

  // Compute live 2 Relevant Experience labels
  const relevantExperienceLabels: RelevantExperienceLabels = useMemo(() => {
    if (!selectedMainQuestion) return { label1: '', label2: '' };
    if (selectedMainQuestion.generateRelevantExperienceLabels) {
      return selectedMainQuestion.generateRelevantExperienceLabels(backgroundAnswers);
    }
    return generateRelevantExperienceLabels(backgroundAnswers);
  }, [selectedMainQuestion, backgroundAnswers]);

  // Handler: Update Background Field
  const handleBackgroundChange = (fieldId: string, val: string) => {
    setBackgroundAnswers(prev => ({ ...prev, [fieldId]: val }));
  };

  // Handler: Update Follow-Up Answer
  const handleFollowUpChange = (questionId: string, val: any) => {
    setFollowUpAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  // Handler: Toggle Checkbox Option
  const handleToggleCheckboxOption = (questionId: string, optionText: string) => {
    setFollowUpAnswers(prev => {
      const currentList: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (currentList.includes(optionText)) {
        return { ...prev, [questionId]: currentList.filter(item => item !== optionText) };
      } else {
        return { ...prev, [questionId]: [...currentList, optionText] };
      }
    });
  };

  // Publish handler
  const handlePublish = () => {
    if (!selectedSociety) return;
    setStep('PUBLISHED');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-4" ref={topRef}>

        {/* TOP NAVIGATION / HEADER */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBackToLanding || onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Stepper Progress Badges */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 overflow-x-auto no-scrollbar">
            <span className={`px-2 py-0.5 rounded-full ${step === 'PERSONAL_DETAILS' ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-700'}`}>
              1. Identity
            </span>
            <span>&rarr;</span>
            <span className={`px-2 py-0.5 rounded-full ${step === 'SEARCH_SOCIETY' ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-700'}`}>
              2. Society
            </span>
            <span>&rarr;</span>
            <span className={`px-2 py-0.5 rounded-full ${step === 'QUESTION_SELECT' ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-700'}`}>
              3. Question
            </span>
            <span>&rarr;</span>
            <span className={`px-2 py-0.5 rounded-full ${step === 'QUESTION_INTERVIEW' ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-700'}`}>
              4. Answers
            </span>
            <span>&rarr;</span>
            <span className={`px-2 py-0.5 rounded-full ${step === 'PREVIEW_EDIT' || step === 'PUBLISHED' ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-700'}`}>
              5. Publish
            </span>
          </div>

          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-md shrink-0">
            Earns ₹50 / answer
          </span>
        </div>

        {/* REALTIME EXCEL SHEET ENGINE TOOLBAR */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Data-Driven Master Excel Sheet Engine</span>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[9px] font-bold rounded border border-emerald-200">
                    v{masterWorkbook.settings?.version || '3.0.0'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {masterWorkbook.topics?.length || 0} Topics • {masterWorkbook.questions?.length || 0} Questions • Realtime Data Updating
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {/* Download Excel Sheet */}
              <button
                type="button"
                onClick={handleDownloadExcelSheet}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Download full 15-sheet Excel workbook (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Download Excel</span>
                <span className="sm:hidden">Download</span>
              </button>

              {/* Upload Excel Sheet */}
              <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Excel</span>
                <span className="sm:hidden">Upload</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleUploadExcelSheet}
                  className="hidden"
                />
              </label>

              {/* Reset to Default */}
              <button
                type="button"
                onClick={handleResetExcelToDefault}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title="Reset Excel sheet to default schema"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Diagnostic Inspector Modal */}
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(true)}
                className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Open Workbook Diagnostic & Inspector"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inspect</span>
              </button>
            </div>
          </div>

          {/* Realtime Status Alert Banner */}
          {excelStatusBanner && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold flex items-center justify-between gap-2"
            >
              <span>{excelStatusBanner}</span>
              <button
                type="button"
                onClick={() => setExcelStatusBanner(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 'PERSONAL_DETAILS' && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-6 space-y-4 shadow-2xs"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[10px] font-bold border border-blue-100">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Resident Contribution</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Resident Verification & Identity
              </h2>
              <p className="text-xs text-slate-500 leading-normal">
                Your private name is strictly for payouts. A 100% anonymous public persona protects your privacy.
              </p>
            </div>

            <form onSubmit={handlePersonalDetailsSubmit} className="space-y-4">
              {personalDetailsError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{personalDetailsError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              {/* Public Display Name Card */}
              <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Your Masked Public Display Name</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (firstName.trim() || lastName.trim()) {
                        const combined = `${firstName.trim()} ${lastName.trim()}`.trim();
                        setPublicDisplayName(formatMaskedDisplayName(combined));
                      } else {
                        setPublicDisplayName(generateAnonymousDisplayName());
                      }
                    }}
                    className="text-[10px] font-bold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate Name</span>
                  </button>
                </div>
                <div className="px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 font-mono flex items-center justify-between">
                  <span>{publicDisplayName}</span>
                  <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    First 3 Letters + *****
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Automatically generated revealing only your first 3 letters followed by ***** to protect your privacy.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue to Select Housing Society</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: SEARCH OR ADD SOCIETY */}
        {step === 'SEARCH_SOCIETY' && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-6 space-y-4 shadow-2xs"
          >
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Which Housing Society Do You Live In?
              </h2>
              <p className="text-xs text-slate-500">
                Search for your society name or register a new society.
              </p>
            </div>

            {!isAddingNewSociety ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search society name, locality, or landmark..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Society search results (no inner scroll bars) */}
                <div className="space-y-1.5">
                  {searchResults.map((soc) => (
                    <div
                      key={soc.id}
                      onClick={() => handleSelectSociety(soc)}
                      className="p-3 bg-[#F8FAFC] hover:bg-blue-50/80 border border-slate-200 hover:border-[#2563EB] rounded-lg transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{soc.name}</span>
                        </h4>
                        <p className="text-[10px] text-slate-500">{soc.locality}, {soc.city}</p>
                      </div>
                      <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1">
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Can't find your society?</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSociety(true)}
                    className="font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New Society</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddNewSocietySubmit} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900">Register New Society</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSociety(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Back to Search
                  </button>
                </div>

                {addSocError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{addSocError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Society Name *</label>
                  <input
                    type="text"
                    required
                    value={newSocName}
                    onChange={(e) => setNewSocName(e.target.value)}
                    placeholder="e.g. Crestwood Heights CHS"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Locality / Landmark *</label>
                    <input
                      type="text"
                      required
                      value={newSocLandmark}
                      onChange={(e) => setNewSocLandmark(e.target.value)}
                      placeholder="e.g. Kolshet Road"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City *</label>
                    <input
                      type="text"
                      required
                      value={newSocCity}
                      onChange={(e) => setNewSocCity(e.target.value)}
                      placeholder="e.g. Thane, Mumbai MMR"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={newSocPincode}
                    onChange={(e) => setNewSocPincode(e.target.value)}
                    placeholder="e.g. 400607"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSociety(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Register & Proceed</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* STEP 3: MAIN QUESTION SELECTION (CHOOSE 1 QUESTION) */}
        {step === 'QUESTION_SELECT' && selectedSociety && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-6 space-y-4 shadow-2xs"
          >
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#2563EB] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{selectedSociety.name}</span>
                </span>
                <span className="text-[10px] text-slate-500">{selectedSociety.locality}</span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Select 1 Question to Answer
              </h2>
              <p className="text-xs text-slate-500 leading-normal">
                Every contribution focuses on 1 question. You receive <strong>₹50 for each unlock</strong> by a buyer.
              </p>
            </div>

            {/* Filter and Search controls */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="Search topics (e.g. Water, Parking, Lifts)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
                  {categoriesList.map((cat, catIdx) => (
                    <button
                      key={cat || `cat_${catIdx}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-[#2563EB] text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Questions' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* QUESTIONS LIST GRID (No inner scrollbar) */}
              <div className="space-y-2.5">
                {filteredMainQuestions.map((mq) => (
                  <div
                    key={mq.id}
                    onClick={() => handleSelectMainQuestion(mq)}
                    className="p-3.5 bg-[#F8FAFC] hover:bg-blue-50/70 border border-slate-200 hover:border-[#2563EB] rounded-xl transition-all cursor-pointer space-y-2 relative group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className="p-2 bg-blue-100 text-[#2563EB] rounded-lg shrink-0 mt-0.5">
                          <TopicIcon iconName={mq.iconName} className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{mq.category}</span>
                            {mq.badge && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-extrabold rounded">
                                {mq.badge}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors leading-snug">
                            {mq.title}
                          </h3>
                        </div>
                      </div>

                      <button className="px-2.5 py-1 bg-[#2563EB] text-white text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1">
                        <span>Answer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-normal pl-8">
                      {mq.description}
                    </p>

                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 pl-8">
                      <span>{mq.backgroundFields.length} background + {mq.followUpQuestions.length} interview questions</span>
                      <span className="font-bold text-emerald-600">Resident gets ₹50 / unlock</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('SEARCH_SOCIETY')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Society</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: STRUCTURED INTERVIEW (PURPOSE 1 THEN PURPOSE 2) */}
        {step === 'QUESTION_INTERVIEW' && selectedMainQuestion && selectedSociety && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-6 space-y-4 shadow-2xs"
          >
            {/* Header Title */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded-md uppercase">
                  {selectedMainQuestion.category}
                </span>
                <span>{selectedSociety.name}</span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white leading-snug">
                {selectedMainQuestion.title}
              </h2>
            </div>

            {/* SUB-STEP 0: SELECT 5 QUESTIONS FROM BUNDLE QUESTION BANK */}
            {interviewSubStep === 'SELECT_5_QUESTIONS' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-[#2563EB]" />
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        Select 5 Questions You Want to Answer
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                      {selectedQuestionIds.length} / 5 Selected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Choose up to 5 questions from this topic's Excel Question Bank ({selectedMainQuestion.followUpQuestions.length} questions available) that you feel most confident answering about your society. Overall rating questions are compulsory and pre-selected.
                  </p>
                </div>

                {/* Question Selection Checklist */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {selectedMainQuestion.followUpQuestions.map((fq, index) => {
                    const isSelected = selectedQuestionIds.includes(fq.id);
                    const isRating = fq.inputType === 'rating';

                    return (
                      <div
                        key={fq.id}
                        onClick={() => handleToggleQuestionSelection(fq.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                          isRating
                            ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                            : isSelected
                              ? 'bg-blue-50/50 border-[#2563EB] shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          isRating
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : isSelected 
                              ? 'bg-[#2563EB] border-[#2563EB] text-white' 
                              : 'border-slate-300 bg-white'
                        }`}>
                          {(isSelected || isRating) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Question #{index + 1}
                            </span>
                            {isRating ? (
                              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                Compulsory Rating Question
                              </span>
                            ) : isSelected && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {fq.questionText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Button */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setStep('SELECT_MAIN_QUESTION');
                      setSelectedMainQuestion(null);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    ← Back to Topics
                  </button>
                  <button
                    onClick={handleConfirmSelectedQuestions}
                    disabled={selectedQuestionIds.length === 0}
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Answering ({selectedQuestionIds.length} Selected)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-STEP 1: MAIN QUESTION & STRUCTURED INTERVIEW QUESTIONS */}
            {interviewSubStep === 'PURPOSE_2' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Step 1 of 2: Main Question Interview ({currentFollowUpIndex + 1} of {activeFollowUpQuestions.length})</span>
                  </div>

                  <div className="font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px]">
                    {Math.round(((currentFollowUpIndex + 1) / Math.max(1, activeFollowUpQuestions.length)) * 100)}% Complete
                  </div>
                </div>

                {/* Render Current Follow-Up Question Card */}
                {(() => {
                  const fq = activeFollowUpQuestions[currentFollowUpIndex];
                  if (!fq) return null;

                  return (
                    <div className="space-y-3 p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl relative">
                      <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200/60">
                        <div className="space-y-1">
                          <div className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider flex items-center gap-1">
                            <span>Question {currentFollowUpIndex + 1} of {activeFollowUpQuestions.length}</span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {fq.questionText}
                          </h3>
                        </div>
                      </div>

                      {fq.helpText && (
                        <p className="text-[11px] text-slate-500 italic">{fq.helpText}</p>
                      )}

                      {/* INPUT TYPE: RADIO */}
                      {fq.inputType === 'radio' && fq.options && (
                        <div className="space-y-2">
                          {fq.options.map((opt, optIdx) => {
                            const isChosen = followUpAnswers[fq.id] === opt;
                            return (
                              <div
                                key={`${fq.id}_opt_${optIdx}`}
                                onClick={() => handleFollowUpChange(fq.id, opt)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs font-medium ${
                                  isChosen 
                                    ? 'bg-blue-50 border-[#2563EB] text-slate-900 font-bold ring-1 ring-[#2563EB]/20 shadow-2xs' 
                                    : 'bg-white border-[#E4E4E7] hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <span>{opt}</span>
                                {isChosen && <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* INPUT TYPE: CHECKBOX */}
                      {fq.inputType === 'checkbox' && fq.options && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-500">Select all that apply:</p>
                          {fq.options.map((opt, optIdx) => {
                            const currentSelected: string[] = Array.isArray(followUpAnswers[fq.id]) ? followUpAnswers[fq.id] : [];
                            const isChecked = currentSelected.includes(opt);

                            return (
                              <div
                                key={`${fq.id}_chk_${optIdx}`}
                                onClick={() => handleToggleCheckboxOption(fq.id, opt)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs font-medium ${
                                  isChecked 
                                    ? 'bg-blue-50 border-[#2563EB] text-slate-900 font-bold ring-1 ring-[#2563EB]/20 shadow-2xs' 
                                    : 'bg-white border-[#E4E4E7] hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <span>{opt}</span>
                                {isChecked ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* INPUT TYPE: DROPDOWN */}
                      {fq.inputType === 'dropdown' && fq.options && (
                        <div className="space-y-1">
                          <select
                            value={followUpAnswers[fq.id] || ''}
                            onChange={(e) => handleFollowUpChange(fq.id, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-[#2563EB] focus:outline-none cursor-pointer"
                          >
                            {fq.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* INPUT TYPE: RATING (NOT PREFILLED BY DEFAULT) */}
                      {fq.inputType === 'rating' && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-600">
                            {(followUpAnswers[fq.id] || 0) === 0 ? 'Tap stars to select rating:' : `Selected Rating: ${followUpAnswers[fq.id]} / 5 Stars`}
                          </div>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isSelected = (followUpAnswers[fq.id] || 0) >= star;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleFollowUpChange(fq.id, star)}
                                  className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    isSelected 
                                      ? 'bg-amber-500 border-amber-500 text-white shadow-2xs' 
                                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'
                                  }`}
                                >
                                  <Star className={`w-4 h-4 ${isSelected ? 'fill-current text-white' : 'text-slate-300'}`} />
                                  <span className="text-xs font-bold">{star}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* INPUT TYPE: SLIDER */}
                      {fq.inputType === 'slider' && (
                        <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600">Value:</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-[#2563EB] font-mono font-extrabold text-xs rounded">
                              {followUpAnswers[fq.id]} {fq.sliderUnit || ''}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={fq.sliderMin || 1}
                            max={fq.sliderMax || 10}
                            step={fq.sliderStep || 1}
                            value={followUpAnswers[fq.id] || (fq.sliderMin || 1)}
                            onChange={(e) => handleFollowUpChange(fq.id, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                          />
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>{fq.sliderMin} {fq.sliderUnit}</span>
                            <span>{fq.sliderMax} {fq.sliderUnit}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Nav buttons for Step 1 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentFollowUpIndex > 0) {
                        setCurrentFollowUpIndex(prev => prev - 1);
                      } else {
                        setInterviewSubStep('SELECT_5_QUESTIONS');
                      }
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{currentFollowUpIndex > 0 ? 'Previous Question' : '← Change Selected Questions'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentFollowUpIndex < activeFollowUpQuestions.length - 1) {
                        setCurrentFollowUpIndex(prev => prev + 1);
                      } else {
                        setInterviewSubStep('PURPOSE_1');
                      }
                    }}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>
                      {currentFollowUpIndex < activeFollowUpQuestions.length - 1 
                        ? 'Next Question' 
                        : 'Proceed to Experience Questions'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-STEP 2: RELEVANT EXPERIENCE QUESTIONS (ASKED AFTER MAIN QUESTION) */}
            {interviewSubStep === 'PURPOSE_1' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB] uppercase">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Step 2 of 2: Relevant Living Experience Context</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Answer these 3 quick experience questions (2 generic + 1 topic-specific context) to build your verified experience labels.
                    </p>
                  </div>

                  {/* 3 Background Experience Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedMainQuestion.backgroundFields.map(bgField => (
                      <div key={bgField.id} className="space-y-1">
                        <label className="text-xs font-bold text-slate-800">{bgField.label}</label>
                        {bgField.inputType === 'radio' ? (
                          <div className="flex items-center gap-1.5">
                            {bgField.options.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleBackgroundChange(bgField.id, opt)}
                                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  backgroundAnswers[bgField.id] === opt
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <select
                            value={backgroundAnswers[bgField.id] || ''}
                            onChange={(e) => handleBackgroundChange(bgField.id, e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-[#2563EB] focus:outline-none cursor-pointer"
                          >
                            {bgField.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 2 DISTINCT RELEVANT EXPERIENCE LABELS PREVIEW */}
                  <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-1.5">
                    <div className="text-[10px] font-extrabold text-[#2563EB] uppercase">
                      Generated Verified Experience Labels (Shown Publicly)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span>{relevantExperienceLabels.label1}</span>
                      </div>

                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span>{relevantExperienceLabels.label2}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setInterviewSubStep('PURPOSE_2');
                      setCurrentFollowUpIndex(selectedMainQuestion.followUpQuestions.length - 1);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Main Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('PREVIEW_EDIT')}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Review & Publish Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 5: PREVIEW & PUBLISH */}
        {step === 'PREVIEW_EDIT' && selectedMainQuestion && selectedSociety && (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-6 space-y-4 shadow-2xs"
          >
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Review Your Resident Intelligence Answer
              </h2>
              <p className="text-xs text-slate-500 leading-normal">
                Your answers will be published for home buyers in <strong>{selectedSociety.name}</strong>.
              </p>
            </div>

            {/* Display Persona & Payout Badge */}
            <div className="px-3 py-2 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-blue-300">{publicDisplayName}</div>
                <div className="text-[10px] text-slate-300">{selectedSociety.name}, {selectedSociety.city}</div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold rounded-md text-[10px]">
                Resident Payout: ₹50 / unlock
              </span>
            </div>

            {/* 2 RELEVANT EXPERIENCE LABELS SUMMARY (PURPOSE 1) */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#2563EB]">
                Public Verified Experience Labels (Purpose 1)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 bg-white border border-blue-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>{relevantExperienceLabels.label1}</span>
                </div>
                <div className="p-2 bg-white border border-blue-200 rounded-md text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>{relevantExperienceLabels.label2}</span>
                </div>
              </div>
            </div>

            {/* Answered Questions Summary (Purpose 2 - No inner scrollbar) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase">
                Answer Summary (Purpose 2)
              </h3>
              <div className="space-y-2">
                {selectedMainQuestion.followUpQuestions.map(fq => (
                  <div key={fq.id} className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg space-y-0.5">
                    <div className="text-xs font-bold text-slate-800">{fq.questionText}</div>
                    <div className="text-xs text-[#2563EB] font-bold font-mono">
                      {Array.isArray(followUpAnswers[fq.id]) 
                        ? (followUpAnswers[fq.id].length > 0 ? followUpAnswers[fq.id].join(', ') : 'None selected')
                        : fq.inputType === 'rating'
                          ? `${followUpAnswers[fq.id] || 0} / 5 Stars`
                          : `${followUpAnswers[fq.id]} ${fq.sliderUnit || ''}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaredTruthful}
                  onChange={(e) => setDeclaredTruthful(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-xs text-slate-800 font-medium leading-normal">
                  I confirm these answers represent my honest, first-hand experience living in <strong>{selectedSociety.name}</strong> as a resident.
                </span>
              </label>
            </div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setInterviewSubStep('PURPOSE_2');
                  setStep('QUESTION_INTERVIEW');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Answers</span>
              </button>

              <button
                type="button"
                disabled={!declaredTruthful}
                onClick={handlePublish}
                className="px-5 py-2.5 bg-emerald-600 disabled:opacity-40 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Answer (Earns ₹50 / Unlock)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: PUBLISHED CONFIRMATION */}
        {step === 'PUBLISHED' && selectedSociety && selectedMainQuestion && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4 text-center shadow-xs max-w-md mx-auto"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                Answer Live!
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Thank You for Helping Homebuyers!
              </h2>
              <p className="text-xs text-slate-600 leading-normal">
                Your answer for <strong>"{selectedMainQuestion.title}"</strong> in <strong>{selectedSociety.name}</strong> is live. Whenever a buyer unlocks your answer, <strong>₹50</strong> will be credited directly to your account.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => setStep('QUESTION_SELECT')}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Answer Another Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onPublishComplete(selectedSociety.name)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                View Society Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* FUZZY WARNING MODAL */}
        {showFuzzyWarning && pendingSocToCreate && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-xs font-bold text-slate-900">Similar Society Found</h3>
              </div>
              <p className="text-xs text-slate-600">
                We found existing societies matching "{pendingSocToCreate.normName}". Did you mean one of these?
              </p>
              <div className="space-y-1.5">
                {fuzzySuggestions.map((soc, idx) => (
                  <div
                    key={soc.id || `fuzzy_soc_${idx}`}
                    onClick={() => {
                      setShowFuzzyWarning(false);
                      handleSelectSociety(soc);
                    }}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{soc.name}</div>
                      <div className="text-[10px] text-slate-500">{soc.locality}, {soc.city}</div>
                    </div>
                    <span className="text-[10px] bg-white border px-2 py-0.5 rounded font-bold text-blue-600">Select</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFuzzyWarning(false)}
                  className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFuzzyWarning(false);
                    createPendingSocietyAndProceed(
                      pendingSocToCreate.normName,
                      pendingSocToCreate.landmark,
                      pendingSocToCreate.city,
                      pendingSocToCreate.pincode
                    );
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create New Society
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WORKBOOK DIAGNOSTIC & SCHEMAS MODAL */}
        <WorkbookDiagnosticModal
          isOpen={showDiagnosticModal}
          onClose={() => setShowDiagnosticModal(false)}
          workbook={masterWorkbook}
          validationReport={validationReport}
          onUploadNewWorkbook={() => {}}
          onResetToDefault={() => {}}
          onRefreshWorkbook={() => {}}
        />

      </div>
    </div>
  );
};
