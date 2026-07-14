import React, { useState } from 'react';
import { DirectQuery, ExpertProfile, Review, Wallet } from '../types';
import { MOCK_AVATARS } from '../data';
import { MessageSquare, CheckCircle, Clock, Wallet as WalletIcon, Coins, Award, LogOut, FileText, Bookmark, Settings, Check, User, ArrowUpRight, HelpCircle, AlertCircle, Sparkles, Compass, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardsProps {
  queries: DirectQuery[];
  reviews: Review[];
  experts: ExpertProfile[];
  savedExpertIds: string[];
  activeRole: 'buyer' | 'expert';
  activeQueryId: string | null;
  setActiveQueryId: (id: string | null) => void;
  onOpenChat: (query: DirectQuery) => void;
  onLeaveReview: (query: DirectQuery) => void;
  setView?: (view: string) => void;
}

export const Dashboards: React.FC<DashboardsProps> = ({
  queries,
  reviews,
  experts,
  savedExpertIds,
  activeRole,
  activeQueryId,
  setActiveQueryId,
  onOpenChat,
  onLeaveReview,
  setView,
}) => {
  const { user, expertProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'questions' | 'saved' | 'invoices' | 'settings'>('questions');
  const [expertTab, setExpertTab] = useState<'new' | 'completed' | 'earnings' | 'settings'>('new');
  const [withdrawalAmount, setWithdrawalAmount] = useState('1000');
  const [upiId, setUpiId] = useState('priya@okhdfcbank');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const currentUserId = user ? user.uid : 'user_rohan';
  const currentExpertId = expertProfile ? expertProfile.id : 'exp_priya';

  // ---------------- BUYER LOGIC ----------------
  // Rohan's Queries
  const rohanQueries = queries.filter(q => q.buyerId === currentUserId);
  const activeQuestions = rohanQueries.filter(q => q.status !== 'ANSWERED' && q.status !== 'REFUNDED');
  const completedQuestions = rohanQueries.filter(q => q.status === 'ANSWERED');
  const savedResidents = experts.filter(exp => savedExpertIds.includes(exp.id));

  // ---------------- EXPERT LOGIC (Priya) ----------------
  const priyaQueries = queries.filter(q => q.expertId === currentExpertId);
  const newQuestions = priyaQueries.filter(q => q.status === 'PENDING' || q.status === 'ACCEPTED');
  const finishedQuestions = priyaQueries.filter(q => q.status === 'ANSWERED' || q.status === 'DISPUTED');

  const mockWallet: Wallet = {
    expertId: 'exp_priya',
    availableBalance: 2400,
    heldBalance: 398,
    totalWithdrawn: 14500,
    upiId: 'priya@okhdfcbank'
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) return;
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawSuccess(`Success! ₹${withdrawalAmount} has been initiated to ${upiId}. The funds will hit your bank account within 24 hours.`);
      setTimeout(() => setWithdrawSuccess(''), 6000);
    }, 2000);
  };

  const triggerMockInvoiceDownload = (q: DirectQuery) => {
    alert(`Downloading Invoice Invoice-BR-${q.id.toUpperCase()} (INR ${q.pricePaid}) as PDF...`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Back Button */}
      {setView && (
        <div className="mb-6 flex">
          <button
            onClick={() => setView('home')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      )}
      
      {/* ROLE SWITCHED BANNER OVERVIEW */}
      <div className="mb-8 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl">
            {activeRole === 'buyer' ? <User className="w-5 h-5" /> : <Award className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {activeRole === 'buyer' ? "Buyer Workspace (Rohan's Account)" : "Resident Expert Workspace (Priya's Dashboard)"}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {activeRole === 'buyer' 
                ? 'Check status of your protected neighbor queries or message residents.' 
                : 'Manage incoming consultation inquiries, withdraw earnings, or adjust availability.'}
            </p>
          </div>
        </div>

        {/* Dashboard Quick Status Badges */}
        <div className="flex items-center gap-2">
          {activeRole === 'buyer' ? (
            <span className="text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold font-mono">
              🟢 {activeQuestions.length} Active / {completedQuestions.length} Completed
            </span>
          ) : (
            <div className="text-right">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Withdrawable Wallet</span>
              <strong className="text-sm font-black text-slate-800 font-mono">Rs. {mockWallet.availableBalance}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ==================== BUYER VIEW ==================== */}
      {activeRole === 'buyer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Side Tabs Navigation */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('questions')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>My Questions</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Residents</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Invoices</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* MY QUESTIONS PANEL */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                
                {/* Active Inquiries Card List */}
                <div>
                  <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Active protected consultations</h3>
                  {activeQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {activeQuestions.map((q) => (
                        <div key={q.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-3xs flex flex-col justify-between gap-4">
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 border border-blue-100 rounded-md">
                                {q.packageOption || 'QUICK'} CONSULT
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm mt-2">
                                Query regarding {q.localityName}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium">Assigned expert: {q.expertName.split(' ')[0]} • Ordered on {new Date(q.createdAt).toLocaleDateString()}</p>
                              {q.packageOption === 'LIVE_CHAT' && q.bookedSlot && (
                                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold font-mono rounded-lg">
                                  <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                  <span>Live Chat Scheduled: {q.bookedSlot}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {q.status}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-2">
                            "{q.queryText}"
                          </p>

                          <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                            <span className="text-xs text-slate-400">Total Paid Amount: <strong className="font-mono text-slate-800">Rs. {q.pricePaid}</strong></span>
                            <div className="flex items-center gap-2">
                              {q.status === 'ACCEPTED' && (
                                <button
                                  onClick={() => onOpenChat(q)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                                >
                                  Open Chat Interface
                                </button>
                              )}
                              {q.status === 'PENDING' && (
                                <span className="text-[11px] text-slate-500 font-bold italic bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg">
                                  Waiting for Expert approval...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl bg-white text-center text-slate-400 text-xs">
                      No active consult tickets right now. Search any society in India to consult an expert.
                    </div>
                  )}
                </div>

                {/* Completed Inquiries Card List */}
                <div>
                  <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Completed Consultations</h3>
                  {completedQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {completedQuestions.map((q) => (
                        <div key={q.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-3xs">
                          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                society report: {q.localityName}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium">Answered by resident {q.expertName.split(' ')[0]} on {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : 'recently'}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              ANSWERED & RESOLVED
                            </span>
                          </div>

                          <div className="space-y-3 my-4">
                            <div>
                              <span className="text-[9px] font-bold uppercase text-slate-400">Your Inquiry:</span>
                              <p className="text-xs text-slate-500 mt-0.5">"{q.queryText}"</p>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                              <span className="text-[9px] font-bold uppercase text-blue-600 block">Resident Answer:</span>
                              <p className="text-xs text-slate-700 font-medium mt-1 whitespace-pre-line leading-relaxed">
                                {q.answerText || 'Consultation chat logs closed successfully.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100/60">
                            <button
                              onClick={() => triggerMockInvoiceDownload(q)}
                              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Receipt Invoice</span>
                            </button>

                            <div className="flex gap-2">
                              <button
                                onClick={() => onOpenChat(q)}
                                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                View Chat Log
                              </button>
                              <button
                                onClick={() => onLeaveReview(q)}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                Leave star Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center border border-slate-200">
                      No resolved consultation queries yet.
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* SAVED RESIDENTS PANEL */}
            {activeTab === 'saved' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-display font-black text-slate-900 text-base mb-4">Saved Local Experts</h3>
                {savedResidents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedResidents.map((exp) => (
                      <div key={exp.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3.5 items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${exp.fullName}&backgroundColor=b6e3f4`}
                            alt={exp.fullName}
                            className="w-10 h-10 rounded-full border border-slate-200 p-0.5 bg-white"
                          />
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800">{exp.fullName.split(' ')[0]}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{exp.localityName}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('questions')} // redirect or handle action
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                        >
                          Ask
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No saved resident experts yet. Browse experts in the Featured section to save.
                  </p>
                )}
              </div>
            )}

            {/* INVOICES PANEL */}
            {activeTab === 'invoices' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-display font-black text-slate-900 text-base mb-4">Invoices & Safe Receipts</h3>
                <div className="space-y-3">
                  {rohanQueries.map((q) => (
                    <div key={q.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Invoice-BR-{q.id.toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400">Transaction Date: {new Date(q.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-black text-slate-900 font-mono">Rs. {q.pricePaid}</p>
                          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Settled</span>
                        </div>
                        <button
                          onClick={() => triggerMockInvoiceDownload(q)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] uppercase rounded-lg cursor-pointer"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                  {rohanQueries.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-6">No purchase transactions found.</p>
                  )}
                </div>
              </div>
            )}

            {/* ACCOUNT SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                <h3 className="font-display font-black text-slate-900 text-base">Account Settings & Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input type="text" defaultValue="Rohan Deshmukh" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 outline-hidden" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Email Address</label>
                    <input type="email" defaultValue="rohan@example.com" disabled className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 cursor-not-allowed outline-hidden" />
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 cursor-pointer">
                  Save Changes
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ==================== RESIDENT EXPERT VIEW ==================== */}
      {activeRole === 'expert' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Side Tabs Navigation */}
          <div className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setExpertTab('new')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                expertTab === 'new'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Incoming Inquiries ({newQuestions.length})</span>
            </button>
            <button
              onClick={() => setExpertTab('completed')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                expertTab === 'completed'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Answered Queries</span>
            </button>
            <button
              onClick={() => setExpertTab('earnings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                expertTab === 'earnings'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <WalletIcon className="w-4 h-4" />
              <span>Earnings & Wallet</span>
            </button>
            <button
              onClick={() => setExpertTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                expertTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* INCOMING INQUIRIES PANEL */}
            {expertTab === 'new' && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Pending Consultation Orders</h3>
                {newQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {newQuestions.map((q) => (
                      <div key={q.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-3xs">
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 border border-emerald-100 rounded-md">
                              ₹{q.pricePaid} SECURED HOLD ACTIVE
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-2">
                              Society Question from {q.buyerName}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium">Topic: Neighborhood Checkup • Ordered on {new Date(q.createdAt).toLocaleDateString()}</p>
                            {q.packageOption === 'LIVE_CHAT' && q.bookedSlot && (
                              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold font-mono rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                <span>Live Chat Slot: {q.bookedSlot}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                            {q.status}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 italic font-medium my-4">
                          "{q.queryText}"
                        </p>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] text-slate-400 font-mono">Potential net earnings: <strong className="text-slate-700">Rs. {q.expertEarnings || Math.round(q.pricePaid * 0.9)}</strong> (after processing fees)</span>
                          <button
                            onClick={() => onOpenChat(q)}
                            className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Accept & Answer Query
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl bg-white text-center text-slate-400 text-xs">
                    No new incoming orders right now. Ensure your availability setting is Active to receive inquiries.
                  </div>
                )}
              </div>
            )}

            {/* ANSWERED QUERIES PANEL */}
            {expertTab === 'completed' && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Completed Consultation Audits</h3>
                {finishedQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {finishedQuestions.map((q) => (
                      <div key={q.id} className="bg-white border border-slate-200/80 rounded-2xl p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">Consultation with {q.buyerName}</h4>
                            <p className="text-[11px] text-slate-400">Answered on {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : 'Recently'}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase">
                            Disbursed
                          </span>
                        </div>
                        <div className="my-3 space-y-2">
                          <p className="text-xs text-slate-400">Question: "{q.queryText}"</p>
                          <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <strong>Your Answer:</strong> {q.answerText || 'Consultation completed successfully via chat.'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100/50">
                          <span>Earnings Disbursed: <strong className="font-mono text-slate-800">Rs. {q.expertEarnings || Math.round(q.pricePaid * 0.9)}</strong></span>
                          <button
                            onClick={() => onOpenChat(q)}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            View Chat History
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center border border-slate-200">
                    No answered or settled consult records yet.
                  </p>
                )}
              </div>
            )}

            {/* EARNINGS & WALLET PANEL */}
            {expertTab === 'earnings' && (
              <div className="space-y-6">
                
                {/* Financial Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Withdrawable Balance</span>
                    <h3 className="font-black text-slate-800 font-mono text-2xl mt-1">Rs. {mockWallet.availableBalance}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Settled after 48-hour holds</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Held Pending Release</span>
                    <h3 className="font-black text-amber-600 font-mono text-2xl mt-1">Rs. {mockWallet.heldBalance}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Active client inquiries</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Withdrawn</span>
                    <h3 className="font-black text-slate-800 font-mono text-2xl mt-1">Rs. {mockWallet.totalWithdrawn}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Transferred to UPI/Bank</p>
                  </div>
                </div>

                {/* Instant Withdrawal Request Box */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                  <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider mb-4">Request Instant Withdrawal</h3>
                  
                  <form onSubmit={handleWithdrawal} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">UPI ID or VPA Address</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@upi"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Withdrawal Amount (INR)</label>
                        <input
                          type="number"
                          required
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          max={mockWallet.availableBalance}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden font-mono text-slate-700"
                        />
                      </div>
                    </div>

                    {withdrawSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold">
                        {withdrawSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={withdrawing || mockWallet.availableBalance < parseInt(withdrawalAmount)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      {withdrawing ? 'Processing Withdrawal...' : 'Request Payout'}
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* PROFILE SETTINGS PANEL */}
            {expertTab === 'settings' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                <h3 className="font-display font-black text-slate-900 text-base">Local Resident Profile Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input type="text" defaultValue="Priya" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 outline-hidden" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Locality / Society Covered</label>
                    <input type="text" defaultValue="Bimbisar Nagar, Jogeshwari" disabled className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 cursor-not-allowed outline-hidden" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Short Introduction Bio</label>
                    <textarea rows={3} defaultValue="Resident since 2016. I can consult you on water supply hours, maid availability, parking constraints, and MHADA complex rules." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 outline-hidden leading-relaxed" />
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 cursor-pointer">
                  Save Settings
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
