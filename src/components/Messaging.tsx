import React, { useState, useEffect } from 'react';
import { DirectQuery } from '../types';
import { MapPin, Image, Paperclip, Send, ArrowLeft, ShieldCheck, Check, Clock, Eye, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseSlotTimeRange } from '../utils/slotHelper';

interface ChatMessageItem {
  id: string;
  senderId: string;
  senderRole: 'buyer' | 'expert';
  text: string;
  createdAt: string;
  mapPin?: { name: string; coordinates: string };
  imageAttachment?: string;
}

interface MessagingProps {
  query: DirectQuery;
  onBack: () => void;
  onSubmitAnswer: (queryId: string, answerText: string) => void;
  onUpdateQuery?: (updated: DirectQuery) => void;
  activeRole: 'buyer' | 'expert';
  backText?: string;
}

export const Messaging: React.FC<MessagingProps> = ({
  query,
  onBack,
  onSubmitAnswer,
  onUpdateQuery,
  activeRole,
  backText,
}) => {
  const { user, expertProfile } = useAuth();
  const currentUserId = user ? user.uid : '';
  const currentExpertId = expertProfile ? expertProfile.id : '';

  const [now, setNow] = useState(new Date());
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg_1',
      senderId: query.buyerId,
      senderRole: 'buyer',
      text: query.queryText,
      createdAt: query.createdAt
    },
    {
      id: 'msg_2',
      senderId: query.expertId,
      senderRole: 'expert',
      text: "Hello! Thanks for reaching out. I'm currently looking into the points you raised and will compile a comprehensive resident audit/report for you very soon. Let me know if there are any specific local issues you'd like me to address!",
      createdAt: new Date(new Date(query.createdAt).getTime() + 15 * 60 * 1000).toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const slotRange = query.bookedSlot ? parseSlotTimeRange(query.bookedSlot) : null;
  const isBefore = slotRange ? now < slotRange.start : false;
  const isActive = slotRange ? (now >= slotRange.start && now <= slotRange.end) : true;
  const isAfter = slotRange ? now > slotRange.end : false;

  // Compute countdown text
  let countdownText = '';
  if (slotRange && isBefore) {
    const diffMs = slotRange.start.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (3600 * 1000));
    const diffMins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    const diffSecs = Math.floor((diffMs % (60 * 1000)) / 1000);
    const parts = [];
    if (diffHrs > 0) parts.push(`${diffHrs}h`);
    if (diffMins > 0 || diffHrs > 0) parts.push(`${diffMins}m`);
    parts.push(`${diffSecs}s`);
    countdownText = parts.join(' ');
  }

  // Compute session end countdown
  let sessionEndsText = '';
  if (slotRange && isActive) {
    const diffMs = slotRange.end.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffSecs = Math.floor((diffMs % (60 * 1000)) / 1000);
    sessionEndsText = `${diffMins}m ${diffSecs}s`;
  }

  // Send standard chat message (for live chat)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      senderId: activeRole === 'buyer' ? currentUserId : currentExpertId,
      senderRole: activeRole,
      text: inputText,
      createdAt: new Date().toISOString()
    };

    setMessages([...messages, newMsg]);
    setInputText('');
  };

  // Send simulated image attachment
  const handleAttachImage = () => {
    const newMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      senderId: activeRole === 'buyer' ? currentUserId : currentExpertId,
      senderRole: activeRole,
      text: "Attached a snapshot of the main entrance gate parking rules notice board:",
      createdAt: new Date().toISOString(),
      imageAttachment: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=350"
    };
    setMessages([...messages, newMsg]);
  };

  // Send simulated map location pin
  const handleAttachMap = () => {
    const newMsg: ChatMessageItem = {
      id: `msg_${Date.now()}`,
      senderId: activeRole === 'buyer' ? currentUserId : currentExpertId,
      senderRole: activeRole,
      text: "Pinned the exact location of the borewell pump room and water tanker queues:",
      createdAt: new Date().toISOString(),
      mapPin: { name: "Society Pump House & Tanker Gate", coordinates: "19.1356° N, 72.8583° E" }
    };
    setMessages([...messages, newMsg]);
  };

  const handleFinalReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAnswer.trim().length < 30) {
      alert('Please provide a comprehensive answer report (minimum 30 characters) to release the secured funds.');
      return;
    }
    onSubmitAnswer(query.id, finalAnswer);
    setShowAnswerForm(false);
  };

  // --- BUDGET STRUCTURED COOPERATIVE INTERACTION LOGIC ---
  const isBudgetPackage = query.packageOption === 'QUICK' || query.packageOption === 'BUNDLE';
  const maxQuestionsCount = query.packageOption === 'QUICK' ? 1 : 3;

  // Track state for draft questions (buyer drafting before submit)
  const [draftQuestions, setDraftQuestions] = useState<string[]>(() => {
    if (query.structuredQuestions && query.structuredQuestions.length > 0) {
      return query.structuredQuestions.map(q => q.text);
    }
    return Array(maxQuestionsCount).fill('');
  });

  // Track expert answers drafts
  const [draftAnswers, setDraftAnswers] = useState<string[]>(() => {
    if (query.structuredQuestions && query.structuredQuestions.length > 0) {
      return query.structuredQuestions.map(q => q.answer || '');
    }
    return Array(maxQuestionsCount).fill('');
  });

  // Track clarification triggers and drafts
  const [draftClarification, setDraftClarification] = useState<string[]>(Array(maxQuestionsCount).fill(''));
  const [replyClarification, setReplyClarification] = useState<string[]>(Array(maxQuestionsCount).fill(''));
  const [clarificationToggle, setClarificationToggle] = useState<boolean[]>(Array(maxQuestionsCount).fill(false));

  const hasSubmittedQuestions = query.structuredQuestions && query.structuredQuestions.some(q => q.text.trim().length > 0);

  const handleBuyerSubmitQuestions = () => {
    const unfilledIndex = draftQuestions.findIndex(q => q.trim().length < 10);
    if (unfilledIndex !== -1) {
      alert(`Please write at least 10 characters for Question #${unfilledIndex + 1} so the resident expert has enough detail to answer.`);
      return;
    }

    const structuredQuestions = draftQuestions.map((text, idx) => ({
      id: `q${idx + 1}`,
      text: text.trim(),
      answer: ''
    }));

    const combinedQueryText = structuredQuestions.map((q, idx) => `Question ${idx + 1}: ${q.text}`).join('\n');

    const updatedQuery = {
      ...query,
      queryText: combinedQueryText,
      structuredQuestions
    };

    if (onUpdateQuery) {
      onUpdateQuery(updatedQuery);
    }
  };

  const handleBuyerSubmitClarification = (idx: number, q: any) => {
    const text = replyClarification[idx];
    if (!text.trim()) {
      alert("Please enter some text for your clarification response.");
      return;
    }

    const updatedStructured = query.structuredQuestions?.map((sq, sIdx) => {
      if (sIdx === idx) {
        return {
          ...sq,
          clarificationRequested: false,
          clarificationAnswer: text.trim()
        };
      }
      return sq;
    }) || [];

    const updatedQuery = {
      ...query,
      structuredQuestions: updatedStructured
    };

    if (onUpdateQuery) {
      onUpdateQuery(updatedQuery);
    }

    const updatedReplies = [...replyClarification];
    updatedReplies[idx] = '';
    setReplyClarification(updatedReplies);
  };

  const handleExpertSubmitClarificationRequest = (idx: number, q: any) => {
    const requestText = draftClarification[idx];
    if (!requestText.trim()) {
      alert("Please write your clarification request before sending.");
      return;
    }

    const updatedStructured = query.structuredQuestions?.map((sq, sIdx) => {
      if (sIdx === idx) {
        return {
          ...sq,
          clarificationRequested: true,
          clarificationQuestion: requestText.trim(),
          clarificationAnswer: '' // Reset answer to let buyer reply
        };
      }
      return sq;
    }) || [];

    const updatedQuery = {
      ...query,
      structuredQuestions: updatedStructured
    };

    if (onUpdateQuery) {
      onUpdateQuery(updatedQuery);
    }

    // Reset fields
    const updatedToggles = [...clarificationToggle];
    updatedToggles[idx] = false;
    setClarificationToggle(updatedToggles);

    const updatedDrafts = [...draftClarification];
    updatedDrafts[idx] = '';
    setDraftClarification(updatedDrafts);
  };

  const handleExpertSubmitFinalReport = () => {
    // Check if any drafted answers are empty
    const unfilledAnsIndex = draftAnswers.findIndex((ans, idx) => {
      const alreadyHasAns = query.structuredQuestions?.[idx]?.answer;
      if (alreadyHasAns) return false;
      return ans.trim().length < 15;
    });

    if (unfilledAnsIndex !== -1) {
      alert(`Please write a comprehensive answer (minimum 15 characters) for Question #${unfilledAnsIndex + 1} before publishing the report.`);
      return;
    }

    const updatedStructured = query.structuredQuestions?.map((sq, idx) => {
      const draftAns = draftAnswers[idx];
      return {
        ...sq,
        answer: sq.answer || draftAns.trim()
      };
    }) || [];

    const compiledText = updatedStructured.map((sq, idx) => {
      return `[Question ${idx + 1}] ${sq.text}\n[Answer] ${sq.answer}`;
    }).join('\n\n');

    const updatedQuery = {
      ...query,
      status: 'ANSWERED' as const,
      answerText: compiledText,
      answeredAt: new Date().toISOString(),
      structuredQuestions: updatedStructured
    };

    onSubmitAnswer(query.id, compiledText);
    if (onUpdateQuery) {
      onUpdateQuery(updatedQuery);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Messaging Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>{backText || 'Exit Messaging'}</span>
        </button>

        <div className="text-right">
          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-emerald-100 rounded-md">
            ₹{query.pricePaid} Secured Hold Active
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Inquiry Ref: #{query.id.split('_')[1] || query.id}</p>
        </div>
      </div>

      {/* Society Metadata Header Banner */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-bold text-slate-800 text-xs sm:text-sm">Inquiry Topic: {query.localityName}</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
            Buyer: {query.buyerName} • Expert: {query.expertName}
          </p>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
          query.status === 'ANSWERED' 
            ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
            : 'text-blue-600 bg-blue-50 border-blue-100'
        }`}>
          {query.status}
        </span>
      </div>

      {/* RENDER DIVERGENT VIEWS: BUDGET PLANS VS LIVE CHAT */}
      {isBudgetPackage ? (
        <div className="space-y-6">
          {/* HEADER EXPLANATORY CARD */}
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-100 rounded-2xl p-5">
            <h3 className="font-black text-slate-800 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span>
              <span>{query.packageOption === 'QUICK' ? 'Quick 1-Question Audit Report' : 'Standard 3-Questions Audit Report'}</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-medium">
              This structured dashboard ensures precise answers from local gated society experts without unstructured chat noise.
              Resident experts answer each question separately and can request clarifying details on individual questions.
            </p>
          </div>

          {!hasSubmittedQuestions ? (
            // DRAFTING PHASE
            activeRole === 'buyer' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Draft Your Questions</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Please specify exactly what you need verified in {query.localityName}. Minimum 10 characters per box.</p>
                </div>

                <div className="space-y-4">
                  {draftQuestions.map((qText, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Question #{idx + 1}
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder={
                          idx === 0 
                            ? "e.g., How is the summer water supply in Block C? Is there high tanker dependency?"
                            : idx === 1 
                            ? "e.g., Are there restrictive rules or high maintenance charges for bachelors/pets?"
                            : "e.g., What are the best CBSE school buses that stop directly inside the society gates?"
                        }
                        value={qText}
                        onChange={(e) => {
                          const updated = [...draftQuestions];
                          updated[idx] = e.target.value;
                          setDraftQuestions(updated);
                        }}
                        className="w-full p-3 text-xs sm:text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden text-slate-800 font-sans"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 text-right">
                  <button
                    onClick={handleBuyerSubmitQuestions}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md inline-flex items-center gap-1.5"
                  >
                    <span>Submit Questions to Expert</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-lg mx-auto">
                  📝
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Waiting for Buyer Questions</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  The buyer is currently formulating their specific questions. You will receive an instant push notification the moment they submit them.
                </p>
              </div>
            )
          ) : (
            // QA INTERACTIVE LIST PANEL
            <div className="space-y-6">
              {query.structuredQuestions?.map((q, idx) => {
                const hasClarificationRequest = q.clarificationRequested;
                const hasAnswer = q.answer && q.answer.trim().length > 0;

                return (
                  <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-3xs space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                            {q.text}
                          </h4>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shrink-0 ${
                        hasAnswer
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : hasClarificationRequest
                          ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {hasAnswer ? 'Completed' : hasClarificationRequest ? 'Awaiting Clarification' : 'Pending Answer'}
                      </span>
                    </div>

                    {/* Clarification Box */}
                    {hasClarificationRequest && (
                      <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Expert Clarification Request:</span>
                        </div>
                        <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-amber-100/50 italic font-medium leading-relaxed">
                          "{q.clarificationQuestion}"
                        </p>

                        {activeRole === 'buyer' ? (
                          <div className="space-y-2 pt-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Your Response:</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type your response to clarify..."
                                value={replyClarification[idx] || ''}
                                onChange={(e) => {
                                  const updated = [...replyClarification];
                                  updated[idx] = e.target.value;
                                  setReplyClarification(updated);
                                }}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 focus:border-amber-500 rounded-xl outline-hidden text-slate-800"
                              />
                              <button
                                onClick={() => handleBuyerSubmitClarification(idx, q)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-700 italic font-semibold">
                            Waiting for the buyer to respond to your clarification request.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Resolved Clarification Logs */}
                    {q.clarificationQuestion && !q.clarificationRequested && q.clarificationAnswer && (
                      <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
                        <p className="text-slate-500 font-medium leading-relaxed">
                          ⚠️ <strong className="text-slate-700">Resident Clarification:</strong> "{q.clarificationQuestion}"
                        </p>
                        <p className="text-slate-700 bg-white/70 p-2.5 rounded-lg border border-slate-100 pl-3 font-semibold leading-relaxed">
                          💬 <strong className="text-slate-800">Your Response:</strong> "{q.clarificationAnswer}"
                        </p>
                      </div>
                    )}

                    {/* Final Answer Block */}
                    {hasAnswer ? (
                      <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-black uppercase tracking-wider text-[9px]">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Resident Expert Answer:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-semibold whitespace-pre-line bg-white/60 p-3 rounded-lg border border-emerald-50">
                          {q.answer}
                        </p>
                      </div>
                    ) : (
                      activeRole === 'expert' && (
                        <div className="space-y-3 pt-2">
                          {/* Need clarification toggle */}
                          {!hasClarificationRequest && (
                            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`clarify_toggle_${idx}`}
                                  checked={clarificationToggle[idx]}
                                  onChange={(e) => {
                                    const updated = [...clarificationToggle];
                                    updated[idx] = e.target.checked;
                                    setClarificationToggle(updated);
                                  }}
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor={`clarify_toggle_${idx}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                  Need clarification before answering?
                                </label>
                              </div>
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider font-mono">Clarification Option</span>
                            </div>
                          )}

                          {clarificationToggle[idx] && !hasClarificationRequest && (
                            <div className="bg-amber-50/40 border border-amber-200/50 rounded-xl p-3.5 space-y-2.5">
                              <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider">
                                Write clarification request:
                              </label>
                              <textarea
                                rows={2}
                                placeholder="e.g. Please clarify if you own a four-wheeler, or live with roommates?"
                                value={draftClarification[idx]}
                                onChange={(e) => {
                                  const updated = [...draftClarification];
                                  updated[idx] = e.target.value;
                                  setDraftClarification(updated);
                                }}
                                className="w-full p-2.5 text-xs border border-slate-200 focus:border-amber-500 rounded-lg outline-hidden text-slate-800 font-sans"
                              />
                              <button
                                onClick={() => handleExpertSubmitClarificationRequest(idx, q)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                              >
                                Send Request to Buyer
                              </button>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Your verified response to Question #{idx + 1}:
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Write your detailed answer here..."
                              value={draftAnswers[idx]}
                              onChange={(e) => {
                                const updated = [...draftAnswers];
                                updated[idx] = e.target.value;
                                setDraftAnswers(updated);
                              }}
                              className="w-full p-3 text-xs sm:text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden text-slate-800 leading-relaxed font-sans"
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}

              {/* EXPERT ACTION PANEL */}
              {activeRole === 'expert' && query.status !== 'ANSWERED' && (
                <div className="mt-8 bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🌟</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Compile & Settle Audit Report</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5 font-medium">
                        Make sure you have written answers for all questions. Once submitted, your answers are instantly delivered to the buyer, closing the consult, and transferring the payouts.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white border border-emerald-100 rounded-xl p-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">✓ Payout cleared immediately</span>
                    <span className="font-mono font-bold">Expected payout: <strong className="text-slate-800">Rs. {query.expertEarnings}</strong></span>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={handleExpertSubmitFinalReport}
                      className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                    >
                      <span>Publish Report & Settle Funds</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* CHAT WINDOW INTERFACE (LIVE CHAT ONLY) */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[480px] relative">
          
          {query.packageOption === 'LIVE_CHAT' && (
            <div className="bg-orange-50/90 border-b border-orange-100 px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAfter && !forceOpen ? 'bg-slate-400' : 'bg-orange-500 animate-pulse'}`} />
                <div>
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block font-sans">
                    {isAfter && !forceOpen ? 'Live Chat Concluded' : 'Live 20-Min Chat Consult Active'}
                  </span>
                  <span className="text-[11px] text-orange-700 font-medium font-mono">
                    Slot: {query.bookedSlot || 'Today, 05:00 PM - 05:30 PM'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-orange-500 font-bold block uppercase tracking-wider">
                  {isAfter && !forceOpen ? 'Status' : 'Session Ends In'}
                </span>
                <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${isAfter && !forceOpen ? 'text-slate-600 bg-slate-200' : 'text-orange-800 bg-orange-100'}`}>
                  {isAfter && !forceOpen ? 'CONCLUDED' : (forceOpen ? '29m 45s' : (sessionEndsText || '00m 00s'))}
                </span>
              </div>
            </div>
          )}

          {query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-2.5 leading-relaxed z-10">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                This live 20-minute session has concluded. The chat is archived. The resident expert can now compile the final society report to release the held session payout.
              </span>
            </div>
          )}

          {query.packageOption === 'LIVE_CHAT' && query.bookedSlot && isBefore && !forceOpen ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50/50 space-y-6 overflow-y-auto">
              <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center text-xl shadow-xs">
                ⏰
              </div>
              
              <div className="max-w-md space-y-2">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block font-sans">
                  Live Chat Scheduled
                </span>
                <h3 className="font-display font-black text-slate-900 text-base leading-snug">
                  This Chat Room Opens at the Booked Slot Time
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                  To guarantee focus and direct peer consultation, live chats are locked until the scheduled start time. We have dispatched a 15-minute start reminder to both expert and buyer.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 max-w-xs w-full shadow-3xs space-y-3">
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Scheduled Slot:</span>
                  <p className="text-xs font-black text-slate-800 font-mono bg-slate-50 border border-slate-100 py-1 rounded-lg">
                    {query.bookedSlot}
                  </p>
                </div>
                
                <div className="pt-1.5 border-t border-slate-100">
                  <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Opens In:</span>
                  <span className="text-lg font-black text-orange-600 font-mono tracking-tight block">
                    {countdownText || 'Opening...'}
                  </span>
                </div>
              </div>

              <div className="pt-2 max-w-xs w-full">
                <button
                  type="button"
                  onClick={() => setForceOpen(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>⚡ Bypass Lock & Open Chat Room</span>
                </button>
                <p className="text-[9px] text-slate-400 mt-2 font-sans leading-relaxed max-w-[260px] mx-auto">
                  *Use this simulation bypass to immediately open the chat window for testing and verification without waiting.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages list scroller */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
                
                {messages.map((msg) => {
                  const isMe = activeRole === 'buyer' ? msg.senderRole === 'buyer' : msg.senderRole === 'expert';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4.5 ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-br-xs' 
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5 justify-between">
                          <span className="text-[10px] font-black tracking-wider uppercase opacity-75">
                            {msg.senderRole === 'buyer' ? 'Buyer' : 'Resident Expert'}
                          </span>
                          <span className="text-[9px] font-mono opacity-60">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        
                        {msg.imageAttachment && (
                          <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                            <img src={msg.imageAttachment} alt="Attachment" className="w-full h-auto max-h-52 object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        {msg.mapPin && (
                          <div className="mt-3 bg-slate-900 text-slate-100 rounded-xl p-3 border border-slate-800 flex items-start gap-2.5">
                            <span className="text-base shrink-0 mt-0.5">📍</span>
                            <div className="text-left">
                              <h4 className="text-[11px] font-black tracking-tight leading-tight">{msg.mapPin.name}</h4>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{msg.mapPin.coordinates}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat action input box */}
              <div className="p-3 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <button
                    onClick={handleAttachImage}
                    disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-100/80 cursor-pointer disabled:opacity-50"
                  >
                    <Image className="w-3.5 h-3.5 text-blue-500" />
                    <span>Attach Photo Notice</span>
                  </button>
                  <button
                    onClick={handleAttachMap}
                    disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-100/80 cursor-pointer disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Pin Location Marker</span>
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                    placeholder={
                      query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen
                        ? "Live session has concluded"
                        : "Ask for details or write message..."
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />

                  <button
                    type="submit"
                    disabled={query.packageOption === 'LIVE_CHAT' && isAfter && !forceOpen}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-3xs cursor-pointer shrink-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}

        </div>
      )}

      {/* SPECIAL ACTIVE EXPERT RESPONSE GIG GATEWAY PANEL (ONLY FOR LIVE CHAT COMPILING REPORT) */}
      {!isBudgetPackage && activeRole === 'expert' && query.status !== 'ANSWERED' && (
        <div className="mt-8 bg-emerald-50/70 border-2 border-emerald-100 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-500 text-white p-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Resident Final Answers Form</h3>
                <p className="text-xs text-slate-500 font-medium">Draft your compiled society report. This submits the answers and releases the pending balance.</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAnswerForm(!showAnswerForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {showAnswerForm ? 'Hide Form' : 'Compile Final Report'}
            </button>
          </div>

          {showAnswerForm && (
            <form onSubmit={handleFinalReportSubmit} className="space-y-4 pt-3 border-t border-emerald-100/60">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Your final response message:
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide key details regarding water tanker dependency, parking restrictions, CBSE schools availability, maid rates, etc..."
                  value={finalAnswer}
                  onChange={(e) => setFinalAnswer(e.target.value)}
                  className="w-full p-4 text-xs sm:text-sm border border-slate-200 rounded-xl outline-hidden text-slate-800 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-between items-center bg-white border border-emerald-100 rounded-xl p-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">✓ Funds released immediately on submission</span>
                <span className="font-mono">Expected payout: <strong className="text-slate-800">Rs. {query.expertEarnings}</strong></span>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Submit Report & Settle Funds
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
};
