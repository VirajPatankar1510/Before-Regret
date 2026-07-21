import React, { useState, useEffect } from 'react';
import { DirectQuery, ExpertProfile, Review, Wallet } from '../types';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Wallet as WalletIcon, 
  Award, 
  FileText, 
  Bookmark, 
  Settings, 
  Check, 
  User, 
  HelpCircle, 
  AlertCircle, 
  Sparkles, 
  Compass, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  Activity,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResidentAvatar } from './ResidentAvatar';
import { Neighborhood } from '../types';

interface DashboardsProps {
  queries: DirectQuery[];
  reviews: Review[];
  experts: ExpertProfile[];
  savedExpertIds: string[];
  activeQueryId: string | null;
  setActiveQueryId: (id: string | null) => void;
  onOpenChat: (query: DirectQuery) => void;
  onLeaveReview: (query: DirectQuery) => void;
  setView?: (view: string) => void;
  onUpdateExpert?: (expert: ExpertProfile) => void;
  localities?: Neighborhood[];
  onAddLocality?: (locality: Neighborhood) => void;
}

export const Dashboards: React.FC<DashboardsProps> = ({
  queries,
  reviews,
  experts,
  savedExpertIds,
  activeQueryId,
  setActiveQueryId,
  onOpenChat,
  onLeaveReview,
  setView,
  onUpdateExpert,
  localities = [],
  onAddLocality,
}) => {
  const { user, expertProfile, setExpertProfile, userExperts } = useAuth();
  
  // Single, unified active tab state
  const [activeTab, setActiveTab] = useState<string>(expertProfile ? 'client_requests' : 'my_questions');

  useEffect(() => {
    if (expertProfile) {
      setActiveTab('client_requests');
    } else {
      setActiveTab('my_questions');
    }
  }, [expertProfile]);
  
  // Wallet / payout states
  const [withdrawalAmount, setWithdrawalAmount] = useState('1000');
  const [upiId, setUpiId] = useState(expertProfile?.upiId || '');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Settings states
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
      setUpiId(expertProfile.upiId || '');
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
  const currentExpertId = expertProfile ? expertProfile.id : null;

  // Filter inquiries strictly owned by the authenticated user (Seeker mode)
  const myQuestions = queries.filter(q => q.buyerId === currentUserId);
  const activeMyQuestions = myQuestions.filter(q => q.status !== 'ANSWERED' && q.status !== 'REFUNDED');
  const completedMyQuestions = myQuestions.filter(q => q.status === 'ANSWERED');
  
  // Filter inquiries submitted to this expert (Expert mode)
  const clientQuestions = currentExpertId ? queries.filter(q => q.expertId === currentExpertId) : [];
  const pendingClientQuestions = clientQuestions.filter(q => q.status === 'ACCEPTED' || q.status === 'PENDING');
  const answeredClientQuestions = clientQuestions.filter(q => q.status === 'ANSWERED');

  const savedResidentsList = experts.filter(exp => savedExpertIds.includes(exp.id));

  // Simulated Expert Wallet
  const expertWallet: Wallet = {
    expertId: currentExpertId || 'exp_temp',
    availableBalance: expertProfile?.balance !== undefined ? expertProfile.balance : 2400,
    heldBalance: clientQuestions.filter(q => q.status === 'ACCEPTED').length * 179,
    totalWithdrawn: (expertProfile?.balance === 0 || expertProfile?.questionsAnsweredCount === 0) ? 0 : 14500,
    upiId: upiId || 'yourname@okhdfcbank'
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) return;
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawSuccess(`Success! ₹${withdrawalAmount} withdrawal initiated to ${upiId}. The funds will reach your linked bank account within 24 hours.`);
      setTimeout(() => setWithdrawSuccess(''), 6000);
    }, 2000);
  };

  const handlePayoutSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSetupError('');
    setPayoutSetupSuccess('');

    if (bankAccNumber !== bankAccNumberConfirm) {
      setPayoutSetupError('Bank Account Numbers do not match.');
      return;
    }

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
        setPayoutSetupSuccess('Payout setup updated successfully! Secure banking account configured.');
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
    if (!currentExpertId) return;
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
        alert(`Payout Failed: ${data.error || 'Check your secure banking account verification status.'}`);
        window.location.reload();
      }
    } catch (err: any) {
      alert(`Error releasing payout: ${err.message}`);
    } finally {
      setCompletingQueryId(null);
    }
  };

  const handleUpdateProfileBio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertProfile || !currentExpertId) return;
    
    setSettingsSuccess(false);
    const updatedExpert = {
      ...expertProfile,
      fullName: settingsName,
      bio: settingsBio,
      upiId
    };

    fetch('/api/experts/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedExpert)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setExpertProfile(data.expert);
        if (onUpdateExpert) onUpdateExpert(data.expert);
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 4000);
      }
    })
    .catch(err => console.error("Update profile bio error:", err));
  };

  const triggerMockInvoiceDownload = (q: DirectQuery) => {
    alert(`Downloading Invoice-BR-${q.id.toUpperCase()} (INR ${q.pricePaid}) as PDF...`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Home Navigation */}
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

      {/* Header Banner */}
      <div className="mb-8 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <ResidentAvatar name={user?.displayName || user?.email || 'Guest'} className="w-16 h-16 border-2 border-slate-700" />
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight">
                My Dashboard
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Manage your consultations, saved societies, billing receipts, and expert profile from a single account.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <span className="px-3 py-1.5 bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-bold font-mono">
              Inquiries: {myQuestions.length} Submitted
            </span>
            {expertProfile && (
              <span className="px-3 py-1.5 bg-emerald-950/50 border border-emerald-800/30 rounded-xl text-xs font-bold font-mono text-emerald-400">
                Wallet Balance: Rs. {expertWallet.availableBalance}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Listing Switcher (Multi-Society Management) */}
      {userExperts.length > 1 && (
        <div className="mb-6 bg-blue-50/40 border border-blue-200/50 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 font-mono">Currently Managing Active Listing</p>
              <h2 className="font-bold text-slate-800 text-sm leading-tight">{expertProfile?.localityName} ({expertProfile?.city})</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Switch Active Profile:</span>
            <select
              value={expertProfile?.id || ''}
              onChange={(e) => {
                const matched = userExperts.find(exp => exp.id === e.target.value);
                if (matched) {
                  setExpertProfile(matched);
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 cursor-pointer text-slate-800 min-w-[200px]"
            >
              {userExperts.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.localityName} ({exp.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Unified Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Hand Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/50 h-fit">
          {expertProfile ? (
            <>
              <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Expert Console
              </div>

              <button
                onClick={() => setActiveTab('client_requests')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'client_requests'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Client Requests</span>
                </span>
                {pendingClientQuestions.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeTab === 'client_requests' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {pendingClientQuestions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('client_completed')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'client_completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Completed Audits</span>
              </button>

              <button
                onClick={() => setActiveTab('earnings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'earnings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <WalletIcon className="w-4 h-4" />
                <span>Earnings & Payouts</span>
              </button>

              <button
                onClick={() => setActiveTab('expert_settings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'expert_settings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Expert Profile Settings</span>
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Seeker Workspace
              </div>
              
              <button
                onClick={() => setActiveTab('my_questions')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'my_questions'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>My Inquiries</span>
                </span>
                {activeMyQuestions.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeTab === 'my_questions' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {activeMyQuestions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('saved_residents')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'saved_residents'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Locals</span>
              </button>

              <button
                onClick={() => setActiveTab('receipts')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'receipts'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Billing Receipts</span>
              </button>

              <div className="pt-4 pb-2 border-t border-slate-200/60 mt-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Become a Resident Guide
              </div>
              <button
                onClick={() => setActiveTab('become_expert_tab')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'become_expert_tab'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-500" />
                <span>Earn from your Society</span>
              </button>
            </>
          )}
        </div>

        {/* Right Hand Workspace Viewport */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: MY INQUIRIES */}
          {activeTab === 'my_questions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">My Submitted Inquiries</h2>
                <span className="text-xs text-slate-500 font-medium">{myQuestions.length} inquiries found</span>
              </div>

              {myQuestions.length > 0 ? (
                <div className="space-y-4">
                  {myQuestions.map((q) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-blue-100 rounded-md">
                            {q.packageOption} CONSULTATION
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-2">
                            Query regarding {q.localityName}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">Assigned expert: {q.expertName} • Submitted on {new Date(q.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          q.status === 'ANSWERED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : q.status === 'ACCEPTED'
                            ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {q.status}
                        </span>
                      </div>

                      {/* Render questions entered before payment */}
                      <div className="my-4 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Structured Queries Submissions:</span>
                        {q.structuredQuestions && q.structuredQuestions.length > 0 ? (
                          <div className="space-y-3">
                            {q.structuredQuestions.map((sq, sIdx) => (
                              <div key={sq.id || sIdx} className="space-y-1 border-l-2 border-blue-500 pl-3">
                                <p className="text-xs text-slate-800 font-bold">Q{sIdx + 1}: {sq.text || q.queryText}</p>
                                {sq.answer ? (
                                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50 mt-1">
                                    <span className="text-[9px] font-black text-emerald-800 uppercase font-mono block">Expert Response:</span>
                                    <p className="text-xs text-slate-700 italic leading-relaxed mt-1 font-medium">"{sq.answer}"</p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic">Waiting for resident's answer...</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 font-medium">"{q.queryText}"</p>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                        <span className="text-xs text-slate-400 font-medium">Amount Secured: <strong className="font-mono text-slate-800">Rs. {q.pricePaid}</strong></span>
                        <div className="flex items-center gap-2">
                          {(q.status === 'ACCEPTED' || q.status === 'ANSWERED') && (
                            <button
                              onClick={() => onOpenChat(q)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs"
                            >
                              Open Chat Interface
                            </button>
                          )}
                          {q.status === 'ANSWERED' && (
                            <button
                              onClick={() => onLeaveReview(q)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              ⭐ Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-white text-center">
                  <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">No Consultations Found</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    You haven't submitted any inquiries yet. Search any gated society to speak to a resident expert!
                  </p>
                  <button
                    onClick={() => setView && setView('home')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Search Societies</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED LOCALS */}
          {activeTab === 'saved_residents' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">My Saved Local Residents</h2>
              
              {savedResidentsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedResidentsList.map((exp) => (
                    <div key={exp.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-600 transition-all cursor-pointer flex flex-col justify-between group">
                      <div className="flex items-start gap-3">
                        <ResidentAvatar name={exp.fullName} className="w-10 h-10 border border-slate-100" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{exp.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{exp.localityName}</p>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{exp.bio}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setView && setView(`expert/${exp.id}`)}
                        className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl transition-all border border-slate-100 hover:border-blue-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>View Resident Profile</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-white text-center text-slate-400 text-xs">
                  No saved expert profiles yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDER RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">My Order Receipts & Invoices</h2>
              
              {myQuestions.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="divide-y divide-slate-100">
                    {myQuestions.map((q) => (
                      <div key={q.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-mono font-black text-slate-400 uppercase">INV-BR-{q.id.toUpperCase()}</span>
                          <h4 className="font-bold text-slate-900 text-sm">Consultation - {q.localityName}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">Date: {new Date(q.createdAt).toLocaleDateString()} • Method: UPI Secure</p>
                        </div>
                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase block font-mono">Amount Paid</span>
                            <span className="font-mono text-sm font-black text-slate-800">Rs. {q.pricePaid}</span>
                          </div>
                          <button
                            onClick={() => triggerMockInvoiceDownload(q)}
                            className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all border border-slate-100 hover:border-blue-100 cursor-pointer"
                            title="Download Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-white text-center text-slate-400 text-xs">
                  No payment invoices generated yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLIENT REQUESTS (EXPERT MODE) */}
          {activeTab === 'client_requests' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-black text-emerald-800 uppercase tracking-wider font-mono">Incoming Client Requests</h2>
                <span className="text-xs text-slate-500 font-medium">{pendingClientQuestions.length} pending reviews</span>
              </div>

              {pendingClientQuestions.length > 0 ? (
                <div className="space-y-4">
                  {pendingClientQuestions.map((q) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-emerald-100 rounded-md">
                            {q.packageOption} ORDER
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-2">
                            Society Report: {q.localityName}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-semibold">Client Seeker: {q.buyerName} • Received on {new Date(q.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          PENDING
                        </span>
                      </div>

                      {/* Display the structured questions */}
                      <div className="my-4 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/30 text-left space-y-4">
                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block font-mono">Client's Specific Questions:</span>
                        {q.structuredQuestions && q.structuredQuestions.length > 0 ? (
                          <div className="space-y-4">
                            {q.structuredQuestions.map((sq, sqIdx) => {
                              const [answeringText, setAnsweringText] = useState(sq.answer || '');
                              const [savedAns, setSavedAns] = useState(!!sq.answer);
                              
                              const handleSaveAnswer = () => {
                                if (answeringText.trim().length < 10) {
                                  alert('Your response must be at least 10 characters.');
                                  return;
                                }
                                // Update within structuredQuestions locally
                                sq.answer = answeringText.trim();
                                setSavedAns(true);
                                alert(`Answer for Q${sqIdx+1} saved! Remember to release checkout below to finalize the consultation.`);
                              };

                              return (
                                <div key={sq.id || sqIdx} className="space-y-2 border-l-2 border-emerald-600 pl-3">
                                  <p className="text-xs text-slate-800 font-bold">Q{sqIdx + 1}: {sq.text || q.queryText}</p>
                                  {savedAns ? (
                                    <div className="bg-emerald-100/50 p-3 rounded-lg border border-emerald-200/50">
                                      <p className="text-xs text-slate-700 italic">"{sq.answer}"</p>
                                      <button 
                                        onClick={() => setSavedAns(false)}
                                        className="text-[10px] text-blue-600 font-bold mt-1.5 hover:underline"
                                      >
                                        Edit Response
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <textarea
                                        rows={2}
                                        value={answeringText}
                                        onChange={(e) => setAnsweringText(e.target.value)}
                                        placeholder="Type your experienced, honest insider answer..."
                                        className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-hidden text-slate-800 font-medium font-sans"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleSaveAnswer}
                                        className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg"
                                      >
                                        Save Response
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 font-medium">"{q.queryText}"</p>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-400 block font-medium">Earnings on Completion: <strong className="font-mono text-emerald-600">Rs. {q.expertEarnings}</strong></span>
                          <span className="text-[10px] text-slate-400">Escrow Protected Fund (Route Hold)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenChat(q)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Chat Room
                          </button>
                          
                          <button
                            disabled={completingQueryId === q.id}
                            onClick={() => handleCompleteBookingAndPayout(q.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs inline-flex items-center gap-1"
                          >
                            {completingQueryId === q.id ? 'Releasing...' : '✓ Complete & Dispatch Payout'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-white text-center text-slate-400 text-xs">
                  No active client inquiries right now.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMPLETED AUDITS (EXPERT MODE) */}
          {activeTab === 'client_completed' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">My Answered Consultations</h2>
              
              {answeredClientQuestions.length > 0 ? (
                <div className="space-y-4">
                  {answeredClientQuestions.map((q) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Inquiry - {q.localityName}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">Client Seeker: {q.buyerName} • Completed on {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          RELEASED
                        </span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3 space-y-3">
                        {q.structuredQuestions && q.structuredQuestions.length > 0 ? (
                          q.structuredQuestions.map((sq, i) => (
                            <div key={sq.id || i} className="space-y-1">
                              <p className="text-xs text-slate-500 font-bold">Q: {sq.text}</p>
                              <p className="text-xs text-slate-700 italic font-medium">A: "{sq.answer}"</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-700 italic">"{q.answerText}"</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        Dispatched payout: <strong className="font-mono text-emerald-600">Rs. {q.expertEarnings}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 rounded-3xl bg-white text-center text-slate-400 text-xs">
                  No answered consultations yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EARNINGS & WALLET (EXPERT MODE) */}
          {activeTab === 'earnings' && (
            <div className="space-y-8">
              
              {/* Wallet Summary Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase block font-mono">Available Wallet Balance</span>
                  <strong className="text-2xl font-black text-slate-900 font-mono block mt-2">Rs. {expertWallet.availableBalance}</strong>
                  <span className="text-[9px] text-emerald-600 font-bold mt-1.5 block">✓ Dispatched instantly on withdrawal request</span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase block font-mono">Escrow Held Balance</span>
                  <strong className="text-2xl font-black text-slate-900 font-mono block mt-2">Rs. {expertWallet.heldBalance}</strong>
                  <span className="text-[9px] text-slate-400 font-medium mt-1.5 block">Waiting for active client answers</span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase block font-mono">Total Life Earnings</span>
                  <strong className="text-2xl font-black text-slate-900 font-mono block mt-2">Rs. {expertWallet.totalWithdrawn + expertWallet.availableBalance}</strong>
                  <span className="text-[9px] text-slate-400 font-medium mt-1.5 block">14 payments disbursed successfully</span>
                </div>
              </div>

              {/* UPI Instant Payout Request */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 mb-4 font-mono uppercase tracking-wider">Instant UPI Wallet Withdrawal</h3>
                <form onSubmit={handleWithdrawal} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Withdrawal Amount (INR)</label>
                      <input
                        type="number"
                        min="100"
                        max={expertWallet.availableBalance}
                        required
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Your UPI ID Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. name@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                  {withdrawSuccess && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl font-medium">{withdrawSuccess}</p>
                  )}
                  <button
                    type="submit"
                    disabled={withdrawing || expertWallet.availableBalance < 100}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-3xs"
                  >
                    {withdrawing ? 'Processing Withdrawal...' : 'Disburse Instantly via UPI'}
                  </button>
                </form>
              </div>

              {/* Secure Banking Accounts */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-mono uppercase tracking-wider">Banking Account Setup</h3>
                  <p className="text-xs text-slate-400 mt-1">Configure your official commercial payout route using unified credentials for gated society advisory work.</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap gap-4 items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-mono">KYC / Payout API State</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${expertProfile?.kycCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        KYC: {expertProfile?.kycCompleted ? 'COMPLETED' : 'PENDING'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${expertProfile?.bankVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        BANK: {expertProfile?.bankVerified ? 'LINKED' : 'NOT LINKED'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${expertProfile?.payoutsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        PAYOUTS: {expertProfile?.payoutsEnabled ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePayoutSetupSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bank Account Number</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter account number"
                        value={bankAccNumber}
                        onChange={(e) => setBankAccNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-hidden text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confirm Account Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Re-enter account number"
                        value={bankAccNumberConfirm}
                        onChange={(e) => setBankAccNumberConfirm(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-hidden text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bank IFSC Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC0000123"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-hidden text-slate-800 font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Official PAN ID Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ABCDE1234F"
                        value={panCard}
                        onChange={(e) => setPanCard(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-hidden text-slate-800 font-mono uppercase"
                      />
                    </div>
                  </div>

                  {payoutSetupSuccess && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg font-medium">{payoutSetupSuccess}</p>
                  )}
                  {payoutSetupError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg font-medium">{payoutSetupError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingPayout}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                  >
                    {submittingPayout ? 'Configuring Banking Accounts...' : 'Save Routing Payout Details'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 7: EXPERT SETTINGS (EXPERT MODE) */}
          {activeTab === 'expert_settings' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider font-mono">Expert Listing & Slot Availability Settings</h2>
              
              <form onSubmit={handleUpdateProfileBio} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Public Consultant Full Name</label>
                  <input
                    type="text"
                    required
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden text-slate-800"
                  />
                </div>
                
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">My Society Insider Bio Description</label>
                  <textarea
                    rows={4}
                    required
                    value={settingsBio}
                    onChange={(e) => setSettingsBio(e.target.value)}
                    placeholder="Describe your tenure, block experience, or any honest details prospective buyers should ask you about..."
                    className="w-full p-4 text-xs border-2 border-slate-200 focus:border-emerald-600 rounded-xl outline-hidden text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Expert Consulting UPI Address</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>

                {settingsSuccess && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl font-medium">
                    Listing and availability settings saved successfully! Your society profile has been synchronized.
                  </p>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Listing Settings
                </button>
              </form>

              {/* Societies / Areas Covered Management */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6" id="listed-societies-manager">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono mb-1">
                    Your Registered Societies
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    To maintain data trust and avoid commercial brokers, community guidelines limit each resident expert to listing or creating **at most 2 areas or societies**.
                  </p>
                </div>

                {/* Display list of current societies */}
                <div className="space-y-3" id="current-societies-list">
                  {userExperts.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                        exp.id === expertProfile?.id 
                          ? 'bg-blue-50/40 border-blue-200 shadow-xs' 
                          : 'bg-slate-50 border-slate-150'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border ${
                          exp.id === expertProfile?.id 
                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {exp.localityName}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400">
                            {exp.city} {exp.id === expertProfile?.id ? '(Currently Managing)' : ''}
                          </p>
                        </div>
                      </div>

                      {exp.id !== expertProfile?.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setExpertProfile(exp);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer text-blue-600"
                        >
                          Switch to Manage
                        </button>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100/50 text-blue-700 rounded text-[9px] font-bold font-mono uppercase">
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {userExperts.length < 2 && (
                  <div className="pt-2 border-t border-dashed border-slate-100">
                    <button
                      type="button"
                      onClick={() => setView('become_expert')}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 border-dashed rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Register Another Society ({2 - userExperts.length} remaining)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: PROMPT TO BECOME EXPERT (GUEST SEEKERS) */}
          {activeTab === 'become_expert_tab' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
              <div className="p-4 bg-emerald-50 rounded-2xl w-fit mx-auto border border-emerald-100 text-emerald-600">
                <Building className="w-10 h-10" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-display font-black text-slate-900 text-lg sm:text-xl">
                  Earn Rs. 1000 - 3000/Month from Home
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  If you have lived in a housing society or neighborhood for more than 1 year, prospective buyers want to consult you. Answer simple, specific questions honestly to help them make the biggest decision of their lives, and get paid securely.
                </p>
              </div>
              <button
                onClick={() => setView && setView('become_expert')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Become a Resident Guide &rarr;
              </button>
            </div>
          )}

          {/* TAB 9: PLATFORM ADMIN CONTROL PANEL */}
          {activeTab === 'admin_console' && (
            <AdminPanel queries={queries} experts={experts} onUpdateExpert={onUpdateExpert} />
          )}

        </div>

      </div>
    </div>
  );
};

// --- HIGH-FIDELITY INTERACTIVE PLATFORM ADMIN PANEL COMPONENT ---
interface AdminPanelProps {
  queries: DirectQuery[];
  experts: ExpertProfile[];
  onUpdateExpert?: (expert: ExpertProfile) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ queries, experts, onUpdateExpert }) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'simulations' | 'settings' | 'audit_logs' | 'webhooks'>('bookings');
  
  // Platform Business Settings State
  const [platformSettings, setPlatformSettings] = useState({
    bookingPrice: 299,
    platformFee: 79,
    residentShare: 220,
    currency: "INR"
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Simulated Webhook State
  const [selectedBookingIdForWebhook, setSelectedBookingIdForWebhook] = useState('');
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState('');

  // Selected Expert for state simulation
  const [selectedExpertId, setSelectedExpertId] = useState(experts[0]?.id || '');
  const [simulatingExpertState, setSimulatingExpertState] = useState(false);
  const [expertStateSuccess, setExpertStateSuccess] = useState('');

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const [auditRes, webhookRes, settingsRes] = await Promise.all([
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/webhook-events'),
        fetch('/api/admin/settings')
      ]);
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data);
      }
      if (webhookRes.ok) {
        const data = await webhookRes.json();
        setWebhookEvents(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data) {
          setPlatformSettings(data);
        }
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformSettings)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Platform business settings updated successfully in database!");
        setPlatformSettings(data.settings);
      } else {
        alert(`Error updating settings: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Execute an admin API action
  const handleAdminAction = async (endpoint: string, payload: any, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Operation completed successfully!");
        window.location.reload();
      } else {
        alert(`Operation Failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // Simulate Webhook Payment Delivery
  const handleSimulateWebhookPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingIdForWebhook) {
      alert("Please select a booking to simulate a payment for!");
      return;
    }
    setSimulatingWebhook(true);
    setWebhookMessage('');

    try {
      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: `pay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              amount: 29900,
              currency: "INR",
              status: "captured",
              notes: {
                bookingId: selectedBookingIdForWebhook
              }
            }
          }
        }
      };

      const res = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-payment-signature': 'simulated_secure_signature_hash'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.status === "processed") {
        setWebhookMessage("✓ Webhook delivered & payment captured. Booking CONFIRMED in escrow!");
        fetchLogs();
        setTimeout(() => {
          alert("Webhook successfully processed! Reloading to update states...");
          window.location.reload();
        }, 1500);
      } else {
        setWebhookMessage(`✗ Webhook Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setWebhookMessage(`✗ Network Error: ${err.message}`);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  // Update expert verification states instantly
  const handleSimulateExpertState = async (e: React.FormEvent, kyc: boolean, bank: boolean, payout: boolean) => {
    e.preventDefault();
    if (!selectedExpertId) return;
    setSimulatingExpertState(true);
    setExpertStateSuccess('');

    try {
      const response = await fetch('/api/experts/simulate-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: selectedExpertId,
          kyc_completed: kyc,
          bank_verified: bank,
          payouts_enabled: payout
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setExpertStateSuccess('Expert verification state simulated on server!');
        if (onUpdateExpert) {
          onUpdateExpert(data.expert);
        }
        setTimeout(() => {
          setExpertStateSuccess('');
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulatingExpertState(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-purple-200">
            🛡️ Platform Operations Console
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-2 font-display">BeforeRegret Escrow & Settlement Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage trust-escrows, split commission releases, instant refunds, and inspect raw system logs.</p>
        </div>
        <button 
          onClick={fetchLogs} 
          disabled={loadingLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
          <span>Sync Logs</span>
        </button>
      </div>

      {/* Admin Panel Tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveAdminTab('bookings')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'bookings'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💰 Bookings & Escrows ({queries.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('simulations')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'simulations'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🧪 Testing Simulations
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'settings'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⚙️ Business Settings
        </button>
        <button
          onClick={() => setActiveAdminTab('audit_logs')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'audit_logs'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Audit Trails ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('webhooks')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'webhooks'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔌 Webhook Event Logs ({webhookEvents.length})
        </button>
      </div>

      {/* ADMIN TAB 1: BOOKINGS & ESCROWS */}
      {activeAdminTab === 'bookings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Commission Rule</span>
              <p className="text-xs text-slate-800 mt-1 font-semibold">₹{platformSettings.bookingPrice} Total Booking Fee</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Platform Share: ₹{platformSettings.platformFee} • Resident Share: ₹{platformSettings.residentShare}</p>
            </div>
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/30">
              <span className="text-[10px] font-bold text-purple-700 uppercase font-mono">Total Escrows Active</span>
              <p className="text-xs text-purple-900 mt-1 font-semibold">
                {queries.filter(q => q.status === 'ACCEPTED').length} Bookings Pending Completion
              </p>
              <p className="text-[10px] text-purple-600 mt-0.5">Funds safely held in independent secure escrow bank accounts.</p>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/30">
              <span className="text-[10px] font-bold text-emerald-700 uppercase font-mono">Total Settled Disbursements</span>
              <p className="text-xs text-emerald-900 mt-1 font-semibold">
                {queries.filter(q => q.status === 'ANSWERED').length} Dispatched Payouts
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Successfully routed automatically via linked accounts.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="p-3 font-bold">Booking / Seeker</th>
                  <th className="p-3 font-bold">Resident Expert</th>
                  <th className="p-3 font-bold">Amount</th>
                  <th className="p-3 font-bold">Escrow States</th>
                  <th className="p-3 font-bold text-right">Operations & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">No bookings available in database. Submit an inquiry first!</td>
                  </tr>
                ) : (
                  queries.map((q) => {
                    const expert = experts.find(e => e.id === q.expertId);
                    const bookingStatus = q.status;
                    
                    // Determine payout state
                    let payoutStatus = "Held";
                    if (bookingStatus === "ANSWERED") payoutStatus = "Settled (Dispatched)";
                    else if (bookingStatus === "REFUNDED") payoutStatus = "Returned to Seeker";
                    else if (bookingStatus === "PAYOUT_FAILED") payoutStatus = "Blocked / Verification Failed";

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50">
                        <td className="p-3 space-y-1">
                          <p className="font-bold text-slate-900">{q.localityName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{q.id}</p>
                          <p className="text-[10px] text-slate-500">Buyer: {q.buyerName}</p>
                        </td>
                        <td className="p-3 space-y-1">
                          <p className="font-semibold text-slate-800">{q.expertName}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`text-[9px] px-1 rounded ${expert?.kycCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              KYC: {expert?.kycCompleted ? 'Y' : 'N'}
                            </span>
                            <span className={`text-[9px] px-1 rounded ${expert?.bankVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              Bank: {expert?.bankVerified ? 'Y' : 'N'}
                            </span>
                            <span className={`text-[9px] px-1 rounded ${expert?.payoutsEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              Payout: {expert?.payoutsEnabled ? 'Y' : 'N'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-mono font-bold text-slate-900">₹{q.pricePaid || platformSettings.bookingPrice}</p>
                          <p className="text-[10px] text-slate-400">Split: ₹{q.expertEarnings || platformSettings.residentShare} / ₹{(q.pricePaid || platformSettings.bookingPrice) - (q.expertEarnings || platformSettings.residentShare)}</p>
                        </td>
                        <td className="p-3 space-y-1.5">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">Booking Status:</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              bookingStatus === 'ANSWERED' ? 'bg-emerald-100 text-emerald-800' : 
                              bookingStatus === 'REFUNDED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>{bookingStatus}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">Payout Status:</span>
                            <span className="text-[10px] font-mono font-bold text-slate-700">{payoutStatus}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right space-y-2">
                          <div className="flex flex-col items-end gap-1.5">
                            {bookingStatus !== 'ANSWERED' && bookingStatus !== 'REFUNDED' && (
                              <>
                                <button
                                  onClick={() => handleAdminAction('/api/bookings/complete', { queryId: q.id }, "Are you sure you want to mark this consultation as completed and release payouts?")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  Mark Chat Complete
                                </button>
                                <button
                                  onClick={() => handleAdminAction('/api/admin/refund/approve', { bookingId: q.id }, `Are you sure you want to approve this refund? This will return all ₹${q.pricePaid || platformSettings.bookingPrice} to the Seeker.`)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  Approve Refund
                                </button>
                                <button
                                  onClick={() => handleAdminAction('/api/admin/chat/no-show', { bookingId: q.id, type: 'resident' }, "Report Resident expert as no show? This blocks payouts.")}
                                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  Resident No Show
                                </button>
                              </>
                            )}
                            {bookingStatus === 'PAYOUT_FAILED' && (
                              <button
                                onClick={() => handleAdminAction('/api/admin/payout/retry', { bookingId: q.id }, "Retry dispatching payout to this resident expert?")}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Retry Gated Payout
                              </button>
                            )}
                            {bookingStatus === 'ANSWERED' && (
                              <span className="text-[10px] text-emerald-600 font-bold block">✓ Fully Disbursed</span>
                            )}
                            {bookingStatus === 'REFUNDED' && (
                              <span className="text-[10px] text-red-600 font-bold block">✓ Refund Processed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN TAB 2: SIMULATIONS */}
      {activeAdminTab === 'simulations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* SIMULATE WEBHOOK */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs text-purple-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span>🔌 Simulate Secure Webhook Payment</span>
            </h3>
            <p className="text-xs text-slate-400">Simulate asynchronous background payment confirmation from the independent secure payment gateway. Never trust frontend callbacks.</p>

            <form onSubmit={handleSimulateWebhookPayment} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Booking to Pay (₹{platformSettings.bookingPrice})</label>
                <select
                  value={selectedBookingIdForWebhook}
                  onChange={(e) => setSelectedBookingIdForWebhook(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700 font-mono"
                >
                  <option value="">-- Choose Booking --</option>
                  {queries.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.localityName} - {q.buyerName} (Status: {q.status})
                    </option>
                  ))}
                </select>
              </div>

              {webhookMessage && (
                <p className={`text-xs p-3 rounded-xl border font-mono ${
                  webhookMessage.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                }`}>{webhookMessage}</p>
              )}

              <button
                type="submit"
                disabled={simulatingWebhook || !selectedBookingIdForWebhook}
                className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                {simulatingWebhook ? 'Delivering Webhook...' : 'Deliver Secure Payment Webhook'}
              </button>
            </form>
          </div>

          {/* SIMULATE EXPERT STATE */}
          <div className="space-y-4 md:pl-8 pt-6 md:pt-0">
            <h3 className="font-bold text-xs text-purple-800 font-mono uppercase tracking-wider">
              🧪 Simulate Expert Verification Gates
            </h3>
            <p className="text-xs text-slate-400">Toggle whether this resident expert has completed KYC checks, verified banking, and is active for payouts prior to releasing settlements.</p>

            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Resident Expert</label>
                <select
                  value={selectedExpertId}
                  onChange={(e) => setSelectedExpertId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700"
                >
                  {experts.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} - {e.localityName}
                    </option>
                  ))}
                </select>
              </div>

              {expertStateSuccess && (
                <p className="text-xs p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">{expertStateSuccess}</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={(e) => handleSimulateExpertState(e, true, true, true)}
                  disabled={simulatingExpertState}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                >
                  Fully Verify (All True)
                </button>
                <button
                  onClick={(e) => handleSimulateExpertState(e, false, true, true)}
                  disabled={simulatingExpertState}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                >
                  KYC Pending
                </button>
                <button
                  onClick={(e) => handleSimulateExpertState(e, false, false, false)}
                  disabled={simulatingExpertState}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                >
                  Block All (False)
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ADMIN TAB: BUSINESS SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-xs text-purple-800 font-mono uppercase tracking-wider">⚙️ Centralized Business Config System (PlatformSettings Database Table)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure real-time business parameters. Changes are stored persistently in the database and read on-the-fly by the escrow engine.
            </p>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-5 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Booking Price (Paid by Seeker)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-mono">₹</span>
                  <input
                    type="number"
                    value={platformSettings.bookingPrice}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, bookingPrice: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency</label>
                <input
                  type="text"
                  value={platformSettings.currency}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, currency: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Platform Commission Fee</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-mono">₹</span>
                  <input
                    type="number"
                    value={platformSettings.platformFee}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformFee: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resident Share (Payout Amount)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-mono">₹</span>
                  <input
                    type="number"
                    value={platformSettings.residentShare}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, residentShare: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {platformSettings.bookingPrice !== (platformSettings.platformFee + platformSettings.residentShare) && (
              <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                ⚠️ Warning: Sum of Platform Fee (₹{platformSettings.platformFee}) and Resident Share (₹{platformSettings.residentShare}) is ₹{platformSettings.platformFee + platformSettings.residentShare}, which does not match Booking Price (₹{platformSettings.bookingPrice}).
              </p>
            )}

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Settings to DB'}
            </button>
          </form>
        </div>
      )}

      {/* ADMIN TAB 3: AUDIT TRAILS */}
      {activeAdminTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs text-purple-800 font-mono uppercase tracking-wider">📜 Independent System Audit Trail</h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{auditLogs.length} events logged</span>
          </div>
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No audits generated yet.</p>
            ) : (
              auditLogs.slice().reverse().map((log) => (
                <div key={log.id} className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2 hover:bg-slate-50 font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <pre className="text-[10px] text-slate-600 max-w-lg overflow-x-auto whitespace-pre-wrap leading-relaxed mt-1.5">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded h-fit">{log.id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ADMIN TAB 4: WEBHOOKS LOG */}
      {activeAdminTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs text-purple-800 font-mono uppercase tracking-wider">🔌 Processed Webhook Event Payload History</h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{webhookEvents.length} payloads captured</span>
          </div>
          <p className="text-xs text-slate-400">Verifying raw signatures and payload integrity in real time protects from double-spend and callback manipulation attacks.</p>
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {webhookEvents.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No webhooks recorded yet.</p>
            ) : (
              webhookEvents.slice().reverse().map((ev) => (
                <div key={ev.eventId} className="p-3.5 text-xs flex flex-col gap-2 hover:bg-slate-50 font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-900 text-purple-100 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                        {ev.eventType}
                      </span>
                      <span className="text-slate-400 text-[9px]">{new Date(ev.processedAt).toLocaleString()}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold">Event ID: {ev.eventId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono">Signature:</span>
                    <p className="text-[10px] text-slate-600 truncate font-mono bg-slate-50 p-1 rounded border border-slate-100">{ev.signature || 'NONE'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono">Raw Payload:</span>
                    <pre className="text-[10px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-150 overflow-x-auto whitespace-pre leading-relaxed mt-1.5">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
