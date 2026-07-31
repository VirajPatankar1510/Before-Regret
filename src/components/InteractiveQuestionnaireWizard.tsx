import React, { useState } from 'react';
import { 
  TopicDefinition, 
  StructuredSubQuestion, 
  getActiveTopics, 
  getActiveQuestionsMap,
  CONTRIBUTOR_TOPICS,
  STRUCTURED_QUESTIONS_DATABASE
} from '../data/contributorTopicsData';
import { 
  saveCustomExcelDataToStorage, 
  clearCustomExcelDataFromStorage, 
  loadCustomExcelDataFromStorage,
  downloadMasterExcelFile,
  parseUploadedExcelFile
} from '../utils/excelEngine';
import { 
  Search, Plus, Edit3, Trash2, Download, Upload, RefreshCw, 
  CheckCircle, AlertCircle, HelpCircle, FileSpreadsheet, 
  Check, X, FileText, ChevronRight, Layers, Sparkles, ShieldCheck
} from 'lucide-react';

interface InteractiveQuestionnaireWizardProps {
  onDataUpdated?: () => void;
}

export const InteractiveQuestionnaireWizard: React.FC<InteractiveQuestionnaireWizardProps> = ({
  onDataUpdated
}) => {
  const [topics, setTopics] = useState<TopicDefinition[]>(() => getActiveTopics());
  const [questionsMap, setQuestionsMap] = useState<Record<string, StructuredSubQuestion[]>>(() => getActiveQuestionsMap());
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => topics[0]?.id || 'water-pressure');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Storage mode status indicator
  const [isUsingCustomData, setIsUsingCustomData] = useState<boolean>(() => !!loadCustomExcelDataFromStorage());

  // Status Notification
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modal States
  const [editingQuestion, setEditingQuestion] = useState<{
    topicId: string;
    question: StructuredSubQuestion;
    isNew: boolean;
  } | null>(null);

  const [editingTopic, setEditingTopic] = useState<{
    topic: TopicDefinition;
    isNew: boolean;
  } | null>(null);

  // Upload Excel Preview Modal State
  const [excelUploadPreview, setExcelUploadPreview] = useState<{
    topics: TopicDefinition[];
    questionsMap: Record<string, StructuredSubQuestion[]>;
    message: string;
  } | null>(null);

  // Save changes helper
  const persistChanges = (newTopics: TopicDefinition[], newMap: Record<string, StructuredSubQuestion[]>) => {
    setTopics(newTopics);
    setQuestionsMap(newMap);
    saveCustomExcelDataToStorage(newTopics, newMap);
    setIsUsingCustomData(true);
    if (onDataUpdated) onDataUpdated();
  };

  // Selected topic object
  const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const topicQuestions = questionsMap[selectedTopicId] || [];

  // Filtered questions across selected topic or global search
  const filteredQuestions = topicQuestions.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesQText = q.questionText.toLowerCase().includes(query);
    const matchesMainQ = (q.mainQuestionText || '').toLowerCase().includes(query);
    const matchesId = q.id.toLowerCase().includes(query);
    const matchesOpts = (q.options || []).some(opt => opt.toLowerCase().includes(query));
    return matchesQText || matchesMainQ || matchesId || matchesOpts;
  });

  // Calculate totals helper
  const countTotalQuestions = (map: Record<string, StructuredSubQuestion[]>) => {
    return (Object.values(map) as StructuredSubQuestion[][]).reduce((sum, qList) => sum + (qList ? qList.length : 0), 0);
  };

  const totalQuestionsCount = countTotalQuestions(questionsMap);

  // Handle Excel Upload
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        const result = parseUploadedExcelFile(buffer);
        if (result.success) {
          setExcelUploadPreview({
            topics: result.topics,
            questionsMap: result.questionsMap,
            message: result.message
          });
        } else {
          setStatusMessage({ type: 'error', text: result.message });
        }
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Confirm Apply Excel Upload
  const handleApplyExcelData = () => {
    if (!excelUploadPreview) return;
    persistChanges(excelUploadPreview.topics, excelUploadPreview.questionsMap);
    if (excelUploadPreview.topics.length > 0) {
      setSelectedTopicId(excelUploadPreview.topics[0].id);
    }
    setStatusMessage({
      type: 'success',
      text: `Excel data successfully imported! ${excelUploadPreview.topics.length} Topics and ${countTotalQuestions(excelUploadPreview.questionsMap)} Questions updated live.`
    });
    setExcelUploadPreview(null);
  };

  // Handle JSON Restore
  const handleJSONRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.topics && parsed.questionsMap) {
          persistChanges(parsed.topics, parsed.questionsMap);
          setStatusMessage({
            type: 'success',
            text: 'JSON Backup restored successfully! Custom questionnaire active.'
          });
        } else {
          setStatusMessage({ type: 'error', text: 'Invalid JSON file format. File must contain "topics" and "questionsMap".' });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Failed to parse JSON file: ' + err.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Download JSON Backup
  const handleDownloadJSONBackup = () => {
    const payload = {
      topics,
      questionsMap,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BeforeRegret_Questionnaire_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'JSON Backup file downloaded safely.' });
  };

  // Reset to System Defaults
  const handleResetToSystemDefaults = () => {
    if (window.confirm('Are you sure you want to reset all questionnaire topics and questions back to system defaults? Any unsaved custom edits will be reverted.')) {
      clearCustomExcelDataFromStorage();
      setTopics(CONTRIBUTOR_TOPICS);
      setQuestionsMap(STRUCTURED_QUESTIONS_DATABASE);
      setIsUsingCustomData(false);
      setSelectedTopicId(CONTRIBUTOR_TOPICS[0]?.id || 'water-pressure');
      setStatusMessage({ type: 'info', text: 'Reverted questionnaire to original system default questions.' });
      if (onDataUpdated) onDataUpdated();
    }
  };

  // Save Question Form
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const { topicId, question, isNew } = editingQuestion;
    const currentQList = questionsMap[topicId] || [];

    let updatedList: StructuredSubQuestion[];
    if (isNew) {
      updatedList = [...currentQList, { ...question, id: question.id || `${topicId}_q_${Date.now()}` }];
    } else {
      updatedList = currentQList.map(q => q.id === question.id ? question : q);
    }

    const newMap = { ...questionsMap, [topicId]: updatedList };
    persistChanges(topics, newMap);
    setEditingQuestion(null);
    setStatusMessage({ type: 'success', text: `Question "${question.questionText.slice(0, 30)}..." saved successfully!` });
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    const currentQList = questionsMap[selectedTopicId] || [];
    const updatedList = currentQList.filter(q => q.id !== qId);
    const newMap = { ...questionsMap, [selectedTopicId]: updatedList };
    persistChanges(topics, newMap);
    setStatusMessage({ type: 'info', text: 'Question deleted successfully.' });
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: StructuredSubQuestion) => {
    const currentQList = questionsMap[selectedTopicId] || [];
    const newQ: StructuredSubQuestion = {
      ...q,
      id: `${selectedTopicId}_copy_${Date.now()}`,
      questionText: `${q.questionText} (Copy)`
    };
    const newMap = { ...questionsMap, [selectedTopicId]: [...currentQList, newQ] };
    persistChanges(topics, newMap);
    setStatusMessage({ type: 'success', text: 'Question duplicated. You can now edit its text.' });
  };

  // Save Topic Form
  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;

    const { topic, isNew } = editingTopic;
    let newTopics: TopicDefinition[];
    let newMap = { ...questionsMap };

    if (isNew) {
      const cleanId = topic.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      newTopics = [...topics, { ...topic, id: cleanId }];
      if (!newMap[cleanId]) newMap[cleanId] = [];
      setSelectedTopicId(cleanId);
    } else {
      newTopics = topics.map(t => t.id === topic.id ? topic : t);
    }

    persistChanges(newTopics, newMap);
    setEditingTopic(null);
    setStatusMessage({ type: 'success', text: `Topic "${topic.title}" saved successfully!` });
  };

  // Delete Topic
  const handleDeleteTopic = (tId: string) => {
    const tName = topics.find(t => t.id === tId)?.title || tId;
    if (!window.confirm(`Are you sure you want to delete topic "${tName}" and all its sub-questions?`)) return;
    
    const newTopics = topics.filter(t => t.id !== tId);
    const newMap = { ...questionsMap };
    delete newMap[tId];

    persistChanges(newTopics, newMap);
    if (newTopics.length > 0) setSelectedTopicId(newTopics[0].id);
    setStatusMessage({ type: 'info', text: `Topic "${tName}" deleted.` });
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              <span>Interactive In-App Admin Questionnaire Wizard</span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Visually edit topics, main questions, and sub-questions in real time. 
              Powered by the ₹129/topic AI Resident Intelligence Engine with strict zero-hallucination guardrails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Download JSON Backup */}
            <button
              onClick={handleDownloadJSONBackup}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>JSON Backup</span>
            </button>

            {/* JSON Restore */}
            <label className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Restore JSON</span>
              <input type="file" accept=".json" onChange={handleJSONRestoreUpload} className="hidden" />
            </label>

            {/* Reset to Defaults */}
            <button
              onClick={handleResetToSystemDefaults}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset questionnaire to original system default questions"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Status notification bar */}
        {statusMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* System Data Status Indicators */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Total Topics: <strong className="text-slate-900">{topics.length}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Total Questions: <strong className="text-slate-900">{totalQuestionsCount}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              isUsingCustomData ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {isUsingCustomData ? 'Custom Admin Questionnaire Active' : 'System Default Questionnaire'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Topic Sidebar + Right Questions Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Topics List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Questionnaire Topics</h3>
              <button
                onClick={() => setEditingTopic({
                  topic: {
                    id: `topic_${Date.now()}`,
                    title: '',
                    category: 'General',
                    iconName: 'HelpCircle',
                    description: '',
                    defaultAnsweredCount: 10
                  },
                  isNew: true
                })}
                className="px-2.5 py-1 bg-blue-50 text-[#2563EB] hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Topic</span>
              </button>
            </div>

            {/* Topics List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {topics.map(t => {
                const count = (questionsMap[t.id] || []).length;
                const isSelected = t.id === selectedTopicId;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected 
                        ? 'bg-blue-50/80 border-[#2563EB] text-[#2563EB] shadow-2xs font-semibold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-bold truncate leading-tight">{t.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">{t.category} • {count} questions</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTopic({ topic: t, isNew: false });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50"
                        title="Edit Topic Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#2563EB]' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Topic Questions & Visual Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Topic Detail Header & Actions */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-mono font-bold rounded-md">
                    {selectedTopic.category}
                  </span>
                  <h2 className="font-bold text-slate-900 text-base">{selectedTopic.title}</h2>
                </div>
                {selectedTopic.mainQuestion && (
                  <p className="text-xs text-[#2563EB] font-medium mt-1">
                    Main Headline: "{selectedTopic.mainQuestion}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingQuestion({
                    topicId: selectedTopicId,
                    question: {
                      id: `${selectedTopicId}_q_${Date.now()}`,
                      topicId: selectedTopicId,
                      mainQuestionText: selectedTopic.mainQuestion,
                      questionText: '',
                      type: 'single-choice',
                      options: ['Yes', 'No', 'Sometimes'],
                      answers: [
                        `Yes - Experienced regularly regarding ${selectedTopic.title}.`,
                        `No - Not an issue regarding ${selectedTopic.title}.`,
                        `Sometimes - Occurs occasionally during peak times.`
                      ],
                      helpText: ''
                    },
                    isNew: true
                  })}
                  className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question to Topic</span>
                </button>

                <button
                  onClick={() => handleDeleteTopic(selectedTopicId)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Topic"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search questions inside ${selectedTopic.title}...`}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F9FC] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          {/* Questions List Cards */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No questions found matching search criteria for this topic.</p>
                <button
                  onClick={() => setEditingQuestion({
                    topicId: selectedTopicId,
                    question: {
                      id: `${selectedTopicId}_q_${Date.now()}`,
                      topicId: selectedTopicId,
                      questionText: '',
                      type: 'single-choice',
                      options: ['Yes', 'No', 'Sometimes'],
                      answers: ['Yes - Experienced', 'No - Not an issue', 'Sometimes'],
                      helpText: ''
                    },
                    isNew: true
                  })}
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Create First Question
                </button>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div key={q.id} className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-2xs space-y-3 hover:border-blue-200 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-mono font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {q.type || 'single-choice'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {q.id}</span>
                      </div>
                      
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{q.questionText}</h4>
                      
                      {q.mainQuestionText && (
                        <p className="text-xs text-slate-500">
                          Main Headline: <span className="text-slate-700 italic">"{q.mainQuestionText}"</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingQuestion({ topicId: selectedTopicId, question: q, isNew: false })}
                        className="p-1.5 bg-blue-50 text-[#2563EB] hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit Question & Answers"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Duplicate Question"
                      >
                        Copy
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options & Mapped Unvarnished Narratives Preview */}
                  <div className="bg-[#F7F9FC] border border-slate-200/80 rounded-xl p-3 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Options & Unvarnished Answer Snippets ({q.options.length}):
                    </div>
                    
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const ans = (q.answers && q.answers[optIdx]) || '';
                        return (
                          <div key={optIdx} className="text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 bg-white p-2 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                              {opt}
                            </span>
                            <span className="text-slate-600 italic truncate">
                              → "{ans || 'Auto-generated conversational summary'}"
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: Edit / Create Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Edit3 className="w-5 h-5 text-[#2563EB]" />
                <span>{editingQuestion.isNew ? 'Create New Question' : 'Edit Question & Answer Snippets'}</span>
              </div>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Question Prompt Text *</label>
                <input
                  type="text"
                  required
                  value={editingQuestion.question.questionText}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, questionText: e.target.value }
                  })}
                  placeholder="e.g. Does water pressure drop during peak morning hours?"
                  className="w-full px-3.5 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              {/* Main Question Headline */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Main Topic Question Headline (Optional)</label>
                <input
                  type="text"
                  value={editingQuestion.question.mainQuestionText || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, mainQuestionText: e.target.value }
                  })}
                  placeholder="e.g. How is the water pressure & shower experience in this society?"
                  className="w-full px-3.5 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              {/* Question Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Question Input Type</label>
                  <select
                    value={editingQuestion.question.type || 'single-choice'}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, type: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  >
                    <option value="single-choice">Single Choice Radio</option>
                    <option value="rating">5-Star Compulsory Rating</option>
                    <option value="yes-no">Yes / No</option>
                    <option value="frequency">Frequency (Daily / Weekly / Monthly)</option>
                    <option value="checkbox-group">Multiple Checkbox Group</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Question ID</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.question.id}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, id: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Options & Unvarnished Narrative Mapping */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">Options & Unvarnished Narrative Answers</label>
                  <button
                    type="button"
                    onClick={() => {
                      const curOpts = editingQuestion.question.options || [];
                      const curAns = editingQuestion.question.answers || [];
                      setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          options: [...curOpts, `Option ${curOpts.length + 1}`],
                          answers: [...curAns, `Regarding ${editingQuestion.question.questionText}: Option ${curOpts.length + 1}`]
                        }
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editingQuestion.question.options.map((opt, i) => (
                    <div key={i} className="p-3 bg-[#F7F9FC] border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Option {i + 1}</span>
                        {editingQuestion.question.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = editingQuestion.question.options.filter((_, idx) => idx !== i);
                              const newAns = (editingQuestion.question.answers || []).filter((_, idx) => idx !== i);
                              setEditingQuestion({
                                ...editingQuestion,
                                question: { ...editingQuestion.question, options: newOpts, answers: newAns }
                              });
                            }}
                            className="text-red-500 hover:text-red-700 text-[11px] font-semibold"
                          >
                            Remove Option
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...editingQuestion.question.options];
                            newOpts[i] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, options: newOpts }
                            });
                          }}
                          placeholder="Option Label (e.g. Yes)"
                          className="md:col-span-4 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />

                        <input
                          type="text"
                          value={(editingQuestion.question.answers && editingQuestion.question.answers[i]) || ''}
                          onChange={(e) => {
                            const newAns = [...(editingQuestion.question.answers || [])];
                            newAns[i] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, answers: newAns }
                            });
                          }}
                          placeholder="Unvarnished report narrative sentence for this choice..."
                          className="md:col-span-8 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit / Create Topic Modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTopic.isNew ? 'Create New Topic Category' : 'Edit Topic Metadata'}
              </h3>
              <button onClick={() => setEditingTopic(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Topic Title *</label>
                <input
                  type="text"
                  required
                  value={editingTopic.topic.title}
                  onChange={(e) => setEditingTopic({
                    ...editingTopic,
                    topic: { ...editingTopic.topic, title: e.target.value }
                  })}
                  placeholder="e.g. Electric Vehicle Charging Infrastructure"
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category Domain *</label>
                <input
                  type="text"
                  required
                  value={editingTopic.topic.category}
                  onChange={(e) => setEditingTopic({
                    ...editingTopic,
                    topic: { ...editingTopic.topic, category: e.target.value }
                  })}
                  placeholder="e.g. Parking & Vehicles"
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Main Topic Headline Question</label>
                <input
                  type="text"
                  value={editingTopic.topic.mainQuestion || ''}
                  onChange={(e) => setEditingTopic({
                    ...editingTopic,
                    topic: { ...editingTopic.topic, mainQuestion: e.target.value }
                  })}
                  placeholder="e.g. How is the EV charging setup and availability in this society?"
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Topic Description</label>
                <textarea
                  rows={3}
                  value={editingTopic.topic.description}
                  onChange={(e) => setEditingTopic({
                    ...editingTopic,
                    topic: { ...editingTopic.topic, description: e.target.value }
                  })}
                  placeholder="Brief explanation of what this topic evaluates for home buyers..."
                  className="w-full p-3 text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Excel Upload Confirmation Preview Modal */}
      {excelUploadPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Confirm Excel / CSV Data Import</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {excelUploadPreview.message}
            </p>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
              <div>• <strong>{excelUploadPreview.topics.length}</strong> Topics parsed</div>
              <div>• <strong>{countTotalQuestions(excelUploadPreview.questionsMap)}</strong> Questions & Answer Snippets parsed</div>
              <div>• Ready to replace live questionnaire state and persist in local storage.</div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setExcelUploadPreview(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyExcelData}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
              >
                Apply Data Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
