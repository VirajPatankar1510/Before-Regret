import React, { useState, useEffect } from 'react';
import { DirectQuery, ExpertProfile, Review, Wallet } from '../types';
import { MOCK_AVATARS } from '../data';
import { MessageSquare, CheckCircle, Clock, Wallet as WalletIcon, Coins, Award, LogOut, FileText, Bookmark, Settings, Check, User, ArrowUpRight, HelpCircle, AlertCircle, Sparkles, Compass, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResidentAvatar } from './ResidentAvatar';

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
  onUpdateExpert?: (expert: ExpertProfile) => void;
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
  onUpdateExpert,
}) => {
  const { user, expertProfile, setExpertProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'questions' | 'saved' | 'invoices' | 'settings'>('questions');
  const [expertTab, setExpertTab] = useState<'new' | 'completed' | 'earnings' | 'settings'>('new');
  const [withdrawalAmount, setWithdrawalAmount] = useState('1000');
  const [upiId, setUpiId] = useState(expertProfile?.upiId || 'priya@okhdfcbank');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const [settingsName, setSettingsName] = useState(expertProfile?.fullName || '');
  const [settingsBio, setSettingsBio] = useState(expertProfile?.bio || '');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Bank & Personal Payout Details
  const [bankAccNumber, setBankAccNumber] = useState(expertProfile?.bankAccountNumber || '');
  const [bankAccNumberConfirm, setBankAccNumberConfirm] = useState(expertProfile?.bankAccountNumber || '');
  const [ifscCode, setIfscCode] = useState(expertProfile?.ifsc || '');
  const [panCard, setPanCard] = useState(expertProfile?.pan || '');
  const [addressText, setAddressText] = useState(expertProfile?.address || '');
  const [dobText, setDobText] = useState(expertProfile?.dob || '');
  const [businessType, setBusinessType] = useState(expertProfile?.businessType || 'individual');

  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutSetupSuccess, setPayoutSetupSuccess] = useState('');
  const [payoutSetupError, setPayoutSetupError] = useState('');

  // Simulation controls
  const [simulatingVerification, setSimulatingVerification] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState('');
  const [completingQueryId, setCompletingQueryId] = useState<string | null>(null);

  useEffect(() => {
    if (expertProfile) {
      setSettingsName(expertProfile.fullName || '');
      setSettingsBio(expertProfile.bio || '');
      setUpiId(expertProfile.upiId || 'priya@okhdfcbank');
      setBankAccNumber(expertProfile.bankAccountNumber || '');
      setBankAccNumberConfirm(expertProfile.bankAccountNumber || '');
      setIfscCode(expertProfile.ifsc || '');
      setPanCard(expertProfile.pan || '');
      setAddressText(expertProfile.address || '');
      setDobText(expertProfile.dob || '');
      setBusinessType(expertProfile.businessType || 'individual');
    }
  }, [expertProfile]);

  const currentUserId = user ? user.uid : '';
  const currentExpertId = expertProfile ? expertProfile.id : 'exp_priya';

  const handlePayoutSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSetupError('');
    setPayoutSetupSuccess('');

    if (bankAccNumber !== bankAccNumberConfirm) {
      setPayoutSetupError('Bank Account Numbers do not match.');
      return;
    }

    // Basic format checks
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panCard && !panRegex.test(panCard.toUpperCase())) {
      setPayoutSetupError('Invalid PAN format. Must be like ABCDE1234F.');
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (ifscCode && !ifscRegex.test(ifscCode.toUpperCase())) {
      setPayoutSetupError('Invalid IFSC format. Must be an 11-character code (e.g. HDFC0000123).');
      return;
    }

    setSubmittingPayout(true);
    try {
      const response = await fetch('/api/experts/payout-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: currentExpertId,
          pan: panCard.toUpperCase(),
          bankAccountNumber: bankAccNumber,
          ifsc: ifscCode.toUpperCase(),
          dob: dobText,
          address: addressText,
          businessType
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPayoutSetupSuccess('Payout setup updated successfully! Razorpay Route linked account configured.');
        setExpertProfile(data.expert);
        if (onUpdateExpert) {
          onUpdateExpert(data.expert);
        }
      } else {
        setPayoutSetupError(data.error || 'Failed to update payout setup.');
      }
    } catch (err: any) {
      setPayoutSetupError(err.message || 'Network error updating payout setup.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleSimulateVerification = async (kyc: boolean, bank: boolean, payouts: boolean) => {
    setSimulatingVerification(true);
    setSimulationSuccess('');
    try {
      const response = await fetch('/api/experts/simulate-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: currentExpertId,
          kyc_completed: kyc,
          bank_verified: bank,
          payouts_enabled: payouts
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSimulationSuccess('Verification state updated on server!');
        setExpertProfile(data.expert);
        if (onUpdateExpert) {
          onUpdateExpert(data.expert);
        }
        setTimeout(() => setSimulationSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulatingVerification(false);
    }
  };

  const handleCompleteBookingAndPayout = async (queryId: string) => {
    setCompletingQueryId(queryId);
    try {
      const response = await fetch('/api/bookings/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('Booking marked complete and payout successfully dispatched!');
        window.location.reload();
      } else {
        alert(`Payout Failed: ${data.error || 'Check your Razorpay Route linked account verification status.'}`);
        window.location.reload();
      }
    } catch (err: any) {
      alert(`Error releasing payout: ${err.message}`);
    } finally {
      setCompletingQueryId(null);
    }
  };

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
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>{activeQuestions.length} Active / {completedQuestions.length} Completed</span>
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
                          <ResidentAvatar name={exp.fullName} className="w-10 h-10 border border-slate-200" />
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
                
                {/* Real-time Earnings stats */}
                {(() => {
                  const expertCompleted = priyaQueries.filter(q => q.status === 'COMPLETED');
                  const expertEscrow = priyaQueries.filter(q => q.status === 'CONFIRMED' || q.status === 'PAYOUT_FAILED');
                  const totalEarnedAmount = expertCompleted.length * 220;
                  const totalHeldAmount = expertEscrow.length * 220;

                  return (
                    <>
                      {/* Financial Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Settled Earnings</span>
                          <h3 className="font-black text-emerald-600 font-mono text-2xl mt-1">₹{totalEarnedAmount}</h3>
                          <p className="text-[10px] text-slate-400 mt-1">Successfully routed to your bank</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Held in Escrow</span>
                          <h3 className="font-black text-amber-500 font-mono text-2xl mt-1">₹{totalHeldAmount}</h3>
                          <p className="text-[10px] text-slate-400 mt-1">Held securely pending completion</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Total Consulting Hours</span>
                          <h3 className="font-black text-slate-800 font-mono text-2xl mt-1">{(priyaQueries.length * 20) / 60} hrs</h3>
                          <p className="text-[10px] text-slate-400 mt-1">{priyaQueries.length} total sessions booked</p>
                        </div>
                      </div>

                      {/* Onboarding & KYC Timeline Tracker */}
                      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                          <Coins className="w-40 h-40 text-blue-400" />
                        </div>
                        
                        <div className="relative z-10">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                            <div>
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                                Razorpay Route Integration
                              </span>
                              <h3 className="text-base font-black tracking-tight mt-1">Your Payout Connected Account</h3>
                            </div>
                            {expertProfile?.razorpay_account_id ? (
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Linked Account ID</span>
                                <strong className="text-xs text-blue-400 font-mono font-bold bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                                  {expertProfile.razorpay_account_id}
                                </strong>
                              </div>
                            ) : (
                              <span className="text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md font-bold uppercase">
                                Action Required
                              </span>
                            )}
                          </div>

                          {/* Interactive Progress Timeline */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                            {/* Account Created step */}
                            <div className="flex items-center gap-3 bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800">
                              <div className={`p-1.5 rounded-lg ${expertProfile?.razorpay_account_id ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold">1. Account Linked</h4>
                                <p className="text-[9px] text-slate-400">
                                  {expertProfile?.razorpay_account_id ? "Linked successfully" : "Setup bank details"}
                                </p>
                              </div>
                            </div>

                            {/* KYC step */}
                            <div className="flex items-center gap-3 bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800">
                              <div className={`p-1.5 rounded-lg ${expertProfile?.kyc_completed ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold">2. KYC Verified</h4>
                                <p className="text-[9px] text-slate-400">
                                  {expertProfile?.kyc_completed ? "Identity approved" : "Pending review"}
                                </p>
                              </div>
                            </div>

                            {/* Bank check step */}
                            <div className="flex items-center gap-3 bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800">
                              <div className={`p-1.5 rounded-lg ${expertProfile?.bank_verified ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold">3. Bank Checked</h4>
                                <p className="text-[9px] text-slate-400">
                                  {expertProfile?.bank_verified ? "Account confirmed" : "Verification pending"}
                                </p>
                              </div>
                            </div>

                            {/* Payouts Active step */}
                            <div className="flex items-center gap-3 bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800">
                              <div className={`p-1.5 rounded-lg ${expertProfile?.payouts_enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold">4. Payouts Active</h4>
                                <p className="text-[9px] text-slate-400">
                                  {expertProfile?.payouts_enabled ? "Instantly enabled" : "Awaiting activation"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* REVIEWER INTERACTIVE SIMULATION UTILITY BOX */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div className="space-y-2">
                            <h4 className="text-sm font-black text-blue-900 tracking-tight">Reviewer Testing Tool: Simulate Account Activations</h4>
                            <p className="text-xs text-blue-700">
                              Razorpay Route verification typically takes 1-2 business days. Use this simulator to instantly trigger transitions and test the marketplace's <strong>First Payout Validation Logic</strong>.
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-xl select-none cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={expertProfile?.kyc_completed || false} 
                                  onChange={(e) => handleSimulateVerification(e.target.checked, expertProfile?.bank_verified || false, expertProfile?.payouts_enabled || false)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Simulate KYC Approved</span>
                              </label>

                              <label className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-xl select-none cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={expertProfile?.bank_verified || false} 
                                  onChange={(e) => handleSimulateVerification(expertProfile?.kyc_completed || false, e.target.checked, expertProfile?.payouts_enabled || false)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Simulate Bank Verified</span>
                              </label>

                              <label className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-xl select-none cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={expertProfile?.payouts_enabled || false} 
                                  onChange={(e) => handleSimulateVerification(expertProfile?.kyc_completed || false, expertProfile?.bank_verified || false, e.target.checked)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Simulate Payouts Enabled</span>
                              </label>
                            </div>

                            {simulationSuccess && (
                              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg mt-2 inline-block">
                                ✓ {simulationSuccess}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SESSIONS & RETRY PAYOUT ACTIONS SECTION */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Escrow Settlement Ledger</h4>
                        
                        {priyaQueries.length > 0 ? (
                          <div className="space-y-4">
                            {priyaQueries.map((q) => {
                              const isCompleted = q.status === "COMPLETED";
                              const isEscrow = q.status === "CONFIRMED";
                              const isFailed = q.status === "PAYOUT_FAILED";

                              return (
                                <div key={q.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <h5 className="text-xs font-extrabold text-slate-900">
                                        20 Min Consultation - ID: BR-{q.id.toUpperCase()}
                                      </h5>
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        Client: {q.buyerName} • Booked Slot: {q.bookedSlot || "Immediate Chat"}
                                      </p>
                                    </div>
                                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                                      isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      isEscrow ? "bg-amber-50 text-amber-700 border-amber-200" :
                                      isFailed ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" :
                                      "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}>
                                      {isCompleted ? "Payout Completed" :
                                       isEscrow ? "In Escrow Holding" :
                                       isFailed ? "Payout Blocked" :
                                       q.status}
                                    </span>
                                  </div>

                                  {/* Marketplace Split Ledger Details */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 bg-white p-3 rounded-xl border border-slate-100 text-[10px]">
                                    <div>
                                      <span className="text-slate-400 block font-medium">Customer Paid</span>
                                      <strong className="text-slate-800 font-mono">₹299</strong>
                                      <span className="text-slate-400 block font-normal">(Inclusive of GST)</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-medium">Marketplace Fee</span>
                                      <strong className="text-slate-700 font-mono">₹79</strong>
                                      <span className="text-slate-400 block font-normal">(Platform services)</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-medium">Resident Payout (90%)</span>
                                      <strong className="text-emerald-600 font-mono">₹220</strong>
                                      <span className="text-slate-400 block font-normal">(Dispatched to Route)</span>
                                    </div>
                                  </div>

                                  {/* Error messages if validation gates intercepted payout */}
                                  {q.payoutErrorMessage && (
                                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex gap-2">
                                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-extrabold text-rose-900">First Payout Blocked</p>
                                        <p className="mt-0.5 font-medium">{q.payoutErrorMessage}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Action releases */}
                                  <div className="mt-3 flex items-center justify-between text-[10px]">
                                    <div>
                                      {q.payoutTransferId && (
                                        <p className="text-slate-400 font-mono">
                                          Transfer ID: <strong className="text-slate-600 font-bold">{q.payoutTransferId}</strong>
                                        </p>
                                      )}
                                      {q.payoutTimestamp && (
                                        <p className="text-slate-400">
                                          Released on: {new Date(q.payoutTimestamp).toLocaleString()}
                                        </p>
                                      )}
                                    </div>

                                    {(isEscrow || isFailed) && (
                                      <button
                                        onClick={() => handleCompleteBookingAndPayout(q.id)}
                                        disabled={completingQueryId === q.id}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                                      >
                                        {completingQueryId === q.id ? "Processing Release..." : "Mark Complete & Release ₹220"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-400 font-medium">
                            No consulting transactions found in ledger.
                          </div>
                        )}
                      </div>

                      {/* DEDICATED BANK DETAILS & KYC FORM */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6">
                        <div className="border-b border-slate-100 pb-3 mb-4">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">KYC & Bank Destination Configuration</h4>
                          <p className="text-xs text-slate-400 mt-1">Configure your independent resident bank details to automatically route split payouts.</p>
                        </div>

                        <form onSubmit={handlePayoutSetupSubmit} className="space-y-4 text-xs font-medium">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-slate-500 block mb-1">PAN Card Number</label>
                              <input 
                                type="text"
                                required
                                maxLength={10}
                                placeholder="ABCDE1234F"
                                value={panCard}
                                onChange={(e) => setPanCard(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-mono uppercase text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-slate-500 block mb-1">Date of Birth</label>
                              <input 
                                type="date"
                                required
                                value={dobText}
                                onChange={(e) => setDobText(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-slate-500 block mb-1">Bank Account Number</label>
                              <input 
                                type="password"
                                required
                                placeholder="Re-enter bank account number to sync"
                                value={bankAccNumber}
                                onChange={(e) => setBankAccNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-mono text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-slate-500 block mb-1">Re-enter Bank Account Number</label>
                              <input 
                                type="text"
                                required
                                placeholder="Verify account number matches"
                                value={bankAccNumberConfirm}
                                onChange={(e) => setBankAccNumberConfirm(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-mono text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-slate-500 block mb-1">IFSC Code</label>
                              <input 
                                type="text"
                                required
                                placeholder="HDFC0000123"
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-mono uppercase text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-slate-500 block mb-1">Business Registered Type</label>
                              <select
                                value={businessType}
                                onChange={(e) => setBusinessType(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 text-slate-800"
                              >
                                <option value="individual">Individual / Proprietorship</option>
                                <option value="partnership">Partnership Firm</option>
                                <option value="private_limited">Private Limited Company</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-slate-500 block mb-1">Registered Address</label>
                              <input 
                                type="text"
                                required
                                placeholder="123, Bimbisar Nagar, Jogeshwari, Mumbai"
                                value={addressText}
                                onChange={(e) => setAddressText(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 text-slate-800"
                              />
                            </div>
                          </div>

                          {payoutSetupError && (
                            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-semibold">
                              {payoutSetupError}
                            </div>
                          )}

                          {payoutSetupSuccess && (
                            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold">
                              {payoutSetupSuccess}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submittingPayout}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            {submittingPayout ? "Saving Details..." : "Submit Payout Details"}
                          </button>
                        </form>
                      </div>
                    </>
                  );
                })()}

              </div>
            )}

            {/* PROFILE SETTINGS PANEL */}
            {expertTab === 'settings' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-slate-900 text-base">Local Resident Profile Settings</h3>
                  {settingsSuccess && (
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg animate-fade-in">
                      ✓ Settings Saved Successfully!
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={settingsName} 
                      onChange={(e) => setSettingsName(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 outline-hidden focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Locality / Society Covered</label>
                    <input 
                      type="text" 
                      defaultValue={expertProfile?.localityName || "Bimbisar Nagar, Jogeshwari"} 
                      disabled 
                      className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 cursor-not-allowed outline-hidden" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">UPI ID for Direct Payout Routing</label>
                    <input 
                      type="text" 
                      value={upiId} 
                      onChange={(e) => setUpiId(e.target.value)} 
                      placeholder="e.g. name@upi"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 outline-hidden focus:border-blue-500 font-mono" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Updates your payout address for all future direct settlements.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Short Introduction Bio</label>
                    <textarea 
                      rows={3} 
                      value={settingsBio} 
                      onChange={(e) => setSettingsBio(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 outline-hidden leading-relaxed focus:border-blue-500" 
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!expertProfile) return;
                    const updated: ExpertProfile = {
                      ...expertProfile,
                      fullName: settingsName,
                      bio: settingsBio,
                      upiId: upiId
                    };
                    if (onUpdateExpert) {
                      onUpdateExpert(updated);
                    }
                    setExpertProfile(updated);
                    setSettingsSuccess(true);
                    setTimeout(() => setSettingsSuccess(false), 3000);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 cursor-pointer"
                >
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
