import React, { useState, useMemo } from 'react';
import { Society, ResidentKnowledgeProfile, TopicKnowledge } from '../types';
import { 
  ArrowLeft, Building2, MapPin, ShieldCheck, Star, Clock, Lock, Unlock, 
  CheckCircle2, Sparkles, User, HelpCircle, AlertCircle, Search, Filter, Layers, Check, X
} from 'lucide-react';
import { AiReportModal } from './AiReportModal';
import { MAIN_QUESTIONS_CATALOG } from '../data/contributorTopicsData';

interface SocietyViewProps {
  society: Society;
  onBack: () => void;
  onSelectResidentProfile: (profile: ResidentKnowledgeProfile) => void;
  onUnlockProfile: (profile: ResidentKnowledgeProfile) => void;
  onUnlockTopicPrompt: (profile: ResidentKnowledgeProfile) => void;
  isProfileFullyUnlocked: (profileId: string) => boolean;
}

export const SocietyView: React.FC<SocietyViewProps> = ({
  society,
  onBack,
  onSelectResidentProfile,
  onUnlockProfile,
  onUnlockTopicPrompt,
  isProfileFullyUnlocked,
}) => {
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'PROFILES'>('QUESTIONS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [questionSearchQuery, setQuestionSearchQuery] = useState<string>('');

  // Map of topicId -> selected profile index (for multi-resident switching per question)
  const [selectedResidentForTopic, setSelectedResidentForTopic] = useState<Record<string, number>>({});

  // AI Report Modal state
  const [aiReportModalData, setAiReportModalData] = useState<{
    isOpen: boolean;
    resident: ResidentKnowledgeProfile | null;
    topic: TopicKnowledge | null;
  }>({
    isOpen: false,
    resident: null,
    topic: null,
  });

  // Group topics across all resident profiles in this society
  // Key = topicId, Value = Array of { profile, topic }
  const groupedQuestionTopics = useMemo(() => {
    const map: Record<string, Array<{ profile: ResidentKnowledgeProfile; topic: TopicKnowledge }>> = {};

    society.profiles.forEach((prof) => {
      prof.topics.forEach((top) => {
        if (!map[top.id]) {
          map[top.id] = [];
        }
        map[top.id].push({ profile: prof, topic: top });
      });
    });

    return map;
  }, [society]);

  // Unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(groupedQuestionTopics).forEach(list => {
      if (list[0]?.topic?.category) {
        cats.add(list[0].topic.category);
      }
    });
    return ['ALL', ...Array.from(cats)];
  }, [groupedQuestionTopics]);

  // Filtered list of topic entries
  const filteredTopicEntries = useMemo(() => {
    return Object.entries(groupedQuestionTopics).filter(([topicId, residentList]) => {
      const firstTopic = residentList[0]?.topic;
      if (!firstTopic) return false;

      // Match category
      if (selectedCategory !== 'ALL' && firstTopic.category !== selectedCategory) {
        return false;
      }

      // Match search query
      if (questionSearchQuery.trim()) {
        const query = questionSearchQuery.toLowerCase();
        const mainQ = MAIN_QUESTIONS_CATALOG.find(mq => mq.topicId === topicId)?.title || '';
        const matchTitle = firstTopic.title.toLowerCase().includes(query);
        const matchCategory = firstTopic.category.toLowerCase().includes(query);
        const matchMainQ = mainQ.toLowerCase().includes(query);
        const matchSummary = firstTopic.summary.toLowerCase().includes(query);

        return matchTitle || matchCategory || matchMainQ || matchSummary;
      }

      return true;
    });
  }, [groupedQuestionTopics, selectedCategory, questionSearchQuery]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {society.city}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              ₹129 per Resident Answer
            </span>
          </div>
        </div>
      </div>

      {/* Society Banner */}
      <section className="bg-white border-b border-[#E4E4E7] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{society.locality}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {society.name}
            </h1>
            {society.description && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {society.description}
              </p>
            )}
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Resident Contributors</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                {society.residentProfilesCount} Residents
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Questions Answered</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                {Object.keys(groupedQuestionTopics).length} Main Topics
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Last Updated</div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {society.lastUpdated}
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E4E4E7]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Verification</div>
              <div className="text-xs font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Genuine Answers</span>
              </div>
            </div>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pt-4">
            <button
              onClick={() => setActiveTab('QUESTIONS')}
              className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'QUESTIONS'
                  ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Questions & Resident Answers ({Object.keys(groupedQuestionTopics).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PROFILES')}
              className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'PROFILES'
                  ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Resident Contributor Profiles ({society.profiles.length})</span>
            </button>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* MODE 1: QUESTIONS & RESIDENT ANSWERS TAB */}
        {activeTab === 'QUESTIONS' && (
          <div className="space-y-6">

            {/* Filter and Search Bar */}
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="Search questions (e.g., water quality, parking, noise, lift wait times)..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-sans"
                  />
                  {questionSearchQuery && (
                    <button
                      onClick={() => setQuestionSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-semibold shrink-0">
                  Showing {filteredTopicEntries.length} Question Topics
                </div>
              </div>

              {/* Domain Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Questions' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Questions & Answers */}
            <div className="space-y-6">
              {filteredTopicEntries.length > 0 ? (
                filteredTopicEntries.map(([topicId, residentList]) => {
                  const mainQ = MAIN_QUESTIONS_CATALOG.find(mq => mq.topicId === topicId);
                  const selectedIdx = selectedResidentForTopic[topicId] || 0;
                  const currentResidentEntry = residentList[selectedIdx] || residentList[0];
                  const { profile: selectedProfile, topic: selectedTopic } = currentResidentEntry;

                  const isUnlocked = isProfileFullyUnlocked(selectedProfile.id);

                  // Calculate sub-questions answered vs skipped
                  const structuredQA = selectedTopic.structuredQA || [];
                  const totalSubQuestionsCount = mainQ?.followUpQuestions?.length || Math.max(structuredQA.length, 4);
                  const answeredCount = structuredQA.length > 0 ? structuredQA.length : totalSubQuestionsCount - 1;
                  const skippedCount = Math.max(0, totalSubQuestionsCount - answeredCount);

                  return (
                    <div
                      key={topicId}
                      className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-2xs hover:shadow-sm transition-all space-y-5"
                    >
                      {/* Top Question Header */}
                      <div className="space-y-2 border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                            {selectedTopic.category}
                          </span>
                          
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                            {residentList.length} Resident {residentList.length === 1 ? 'Answer' : 'Answers Available'}
                          </span>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                          {mainQ?.title || selectedTopic.title}
                        </h2>

                        <p className="text-xs text-slate-500">
                          {selectedTopic.title} • {selectedTopic.readingTime}
                        </p>
                      </div>

                      {/* MULTIPLE RESIDENT SWITCHER (If > 1 resident answered this question) */}
                      {residentList.length > 1 && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                            <span>Select Resident Contributor ({residentList.length} Residents Answered):</span>
                            <span className="text-blue-600 font-extrabold">Switch Resident to Compare</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {residentList.map((entry, rIdx) => {
                              const isSelected = selectedIdx === rIdx;
                              return (
                                <button
                                  key={entry.profile.id}
                                  onClick={() => setSelectedResidentForTopic(prev => ({ ...prev, [topicId]: rIdx }))}
                                  className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-white border-[#2563EB] ring-2 ring-blue-500/20 shadow-2xs'
                                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                      Resident {rIdx + 1} ({entry.profile.residentType})
                                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                      {entry.profile.yearsLiving} Yrs • Rating {entry.profile.rating.toFixed(1)} ★
                                    </div>
                                  </div>
                                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                                    {entry.topic.structuredQA?.length || 4} Qs
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resident Experience Context & Sub-Question Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Selected Resident Profile Tag */}
                        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                              R{selectedIdx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                Resident Contributor ({selectedProfile.residentType})
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Living in {society.name} for {selectedProfile.yearsLiving} years
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-700 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{selectedProfile.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Answered vs Skipped Sub-Questions Badge Indicator */}
                        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>{answeredCount} of {totalSubQuestionsCount} Sub-Questions Answered</span>
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              {skippedCount > 0 
                                ? `${skippedCount} optional question skipped by resident (excluded from report)`
                                : '100% complete topic evaluation'}
                            </div>
                          </div>

                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            Confirmed Answer
                          </span>
                        </div>
                      </div>

                      {/* Sub-Questions Answered Breakdown Checklist */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Sub-Questions Answered Breakdown:
                        </div>

                        <div className="space-y-1.5">
                          {structuredQA.length > 0 ? (
                            structuredQA.map((sq, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{sq.question}</span>
                                  </div>
                                  <div className="text-slate-600 text-[11px] pl-5 font-mono">
                                    Ans: <strong className="text-slate-800">{sq.answer}</strong>
                                  </div>
                                </div>
                                {sq.badge && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold shrink-0">
                                    {sq.badge}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-700">
                              Detailed answers recorded for peak usage hours, maintenance realities, and practical living impact.
                            </div>
                          )}

                          {skippedCount > 0 && (
                            <div className="p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{skippedCount} optional question was skipped by the contributor and omitted from report generation.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Answer Preview / Summary Text Box */}
                      <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Resident Summary:
                        </div>
                        {selectedTopic.summary}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
                        
                        <button
                          onClick={() => setAiReportModalData({
                            isOpen: true,
                            resident: selectedProfile,
                            topic: selectedTopic,
                          })}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>View AI Resident Answer Report (₹129)</span>
                        </button>

                        {isUnlocked ? (
                          <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Answer Unlocked</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onUnlockTopicPrompt(selectedProfile)}
                            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5 text-white" />
                            <span>Unlock Resident Answer</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-white text-[11px]">₹129</span>
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">
                    No questions found matching "{questionSearchQuery}" in {selectedCategory === 'ALL' ? 'all categories' : selectedCategory}.
                  </div>
                  <button
                    onClick={() => {
                      setQuestionSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className="text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    Clear Search Filters
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* MODE 2: RESIDENT CONTRIBUTOR PROFILES TAB */}
        {activeTab === 'PROFILES' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Resident Contributor Profiles ({society.profiles.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Resident contributors who answered questions for {society.name}.
                </p>
              </div>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {society.profiles.map((profile, pIdx) => {
                const unlocked = isProfileFullyUnlocked(profile.id);

                return (
                  <div
                    key={profile.id}
                    className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-2xs hover:shadow-sm transition-all space-y-6 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            R{pIdx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              Resident Contributor {pIdx + 1}
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {profile.residentType} • {society.locality}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{profile.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Metrics Table */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Living Duration</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {profile.yearsLiving} Years (Since {profile.livingSince})
                          </div>
                        </div>

                        <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Questions Answered</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {profile.topics.length} Main Topics
                          </div>
                        </div>
                      </div>

                      {/* Topics Covered Chips */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                          Questions Answered:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.topics.map((t) => (
                            <span
                              key={t.id}
                              className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200/60"
                            >
                              {t.title}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => onSelectResidentProfile(profile)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>View Resident Answers</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </section>

      {/* AI Resident Answer Report Modal */}
      {aiReportModalData.isOpen && aiReportModalData.resident && aiReportModalData.topic && (
        <AiReportModal
          isOpen={aiReportModalData.isOpen}
          onClose={() => setAiReportModalData({ isOpen: false, resident: null, topic: null })}
          societyName={society.name}
          locality={society.locality}
          city={society.city}
          residentType={aiReportModalData.resident.residentType}
          yearsLiving={aiReportModalData.resident.yearsLiving}
          topicsData={[
            {
              topicId: aiReportModalData.topic.id,
              topicTitle: aiReportModalData.topic.title,
              qaList: [
                { question: `${aiReportModalData.topic.title} Overview & Details`, answer: aiReportModalData.topic.summary },
                ...(aiReportModalData.topic.structuredQA || []).map(sq => ({ question: sq.question, answer: sq.answer }))
              ]
            }
          ]}
        />
      )}

    </div>
  );
};
