import React, { useState } from 'react';
import { Neighborhood, ExpertProfile, DirectQuery } from '../types';
import { 
  Lock, Key, Users, Activity, FileText, CheckCircle, 
  RefreshCw, Plus, Eye, TrendingUp, Wallet, ShieldAlert,
  ArrowLeft, MessageSquare, Clock, Check
} from 'lucide-react';

interface AdminPanelProps {
  setView: (view: string) => void;
  activeRole: 'guest' | 'buyer' | 'expert';
  setActiveRole: (role: 'guest' | 'buyer' | 'expert') => void;
  queries: DirectQuery[];
  setQueries: React.Dispatch<React.SetStateAction<DirectQuery[]>>;
  experts: ExpertProfile[];
  localities: Neighborhood[];
  onOpenQuery: (query: DirectQuery) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  setView,
  activeRole,
  setActiveRole,
  queries,
  setQueries,
  experts,
  localities,
  onOpenQuery,
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'seeding'>('users');
  const [simulateStatusMsg, setSimulateStatusMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'BR1510') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect Administrator Password. Please try again.');
    }
  };

  // Pre-seed an order for demo purposes
  const handleSimulateNewOrder = () => {
    const randomExpert = experts[Math.floor(Math.random() * experts.length)];
    const packageOptions: ('QUICK' | 'BUNDLE' | 'LIVE_CHAT')[] = ['QUICK', 'BUNDLE', 'LIVE_CHAT'];
    const chosenPkg = packageOptions[Math.floor(Math.random() * packageOptions.length)];
    const prices = { QUICK: 99, BUNDLE: 199, LIVE_CHAT: 220 };
    const earnings = { QUICK: 89, BUNDLE: 179, LIVE_CHAT: 220 };

    const newQuery: DirectQuery = {
      id: `q_${Date.now()}`,
      buyerId: 'mock_buyer_amit',
      buyerName: 'Amit Kumar',
      expertId: randomExpert.id,
      expertName: randomExpert.fullName,
      localityId: randomExpert.localityId,
      localityName: randomExpert.localityName,
      queryText: `Hey ${randomExpert.fullName.split(' ')[0]}, I am looking to move here next week. How would you rate the power backup during thunderstorms, and is parking allotted strictly or can outsiders block resident spaces? Thank you!`,
      status: 'ACCEPTED',
      pricePaid: prices[chosenPkg],
      expertEarnings: earnings[chosenPkg],
      createdAt: new Date().toISOString(),
      packageOption: chosenPkg,
      bookedSlot: chosenPkg === 'LIVE_CHAT' ? 'Tomorrow, 04:00 PM - 04:20 PM' : undefined
    };

    setQueries([newQuery, ...queries]);
    setSimulateStatusMsg(`Successfully pre-seeded a new ${chosenPkg} order for Amit to expert ${randomExpert.fullName.split(' ')[0]}!`);
    setTimeout(() => setSimulateStatusMsg(''), 4000);
  };

  // Simulate resident delivering the answer
  const handleSimulateAnswerDelivery = (queryId: string) => {
    const updated = queries.map(q => {
      if (q.id === queryId) {
        return {
          ...q,
          status: 'ANSWERED' as const,
          answerText: "Thanks for checking in! Regarding the power backup, our society has a 24x7 generator backup that kicks in within 5 seconds of a breakdown. The lifts, lobby lights, and water pumps are fully covered. For parking, each flat gets 1 dedicated stilt parking spot. Visitor parking is strictly monitored at the gate with a temporary token system, so outsiders cannot block your slot.",
          answeredAt: new Date().toISOString()
        };
      }
      return q;
    });
    setQueries(updated);
    setSimulateStatusMsg('Simulated a high-fidelity resident response update!');
    setTimeout(() => setSimulateStatusMsg(''), 4000);
  };

  // Reset to initial pre-seeded sample order
  const handleResetToPreSeeded = () => {
    setQueries([
      {
        id: 'q_mock_1',
        buyerId: 'mock_buyer_amit',
        buyerName: 'Amit Kumar',
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
    setSimulateStatusMsg('Successfully restored all marketplace data to initial demo state!');
    setTimeout(() => setSimulateStatusMsg(''), 4000);
  };

  const activeRoleName = () => {
    if (activeRole === 'buyer') return 'Amit Kumar (Buyer)';
    if (activeRole === 'expert') return 'Priya (Local Resident)';
    return 'Guest / Unlogged';
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">
            Administrator Gateway
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Please enter your system passcode to access pre-seeded accounts, live order lists, and simulation features.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Enter Administrator Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-slate-200 focus:border-red-500 rounded-xl outline-none font-mono text-center font-bold"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-[11px] text-red-600 font-bold bg-red-50 py-2 px-3 rounded-lg border border-red-100 font-sans">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Verify Passcode
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>PROTECTED WORKSPACE DEV CONSOLE</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalRevenue = queries.reduce((acc, q) => acc + q.pricePaid, 0);
  const totalPayouts = queries.reduce((acc, q) => acc + q.expertEarnings, 0);
  const totalHeldFunds = queries.filter(q => q.status === 'ACCEPTED').reduce((acc, q) => acc + q.pricePaid, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
        <div>
          <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full font-mono">
            Admin Simulation Console
          </span>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mt-2.5">
            Internal Workspace Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Toggle user sessions, update mock live database entries, and monitor real-time message rooms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('home')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {simulateStatusMsg && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{simulateStatusMsg}</span>
        </div>
      )}

      {/* QUICK SYSTEM STATS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Simulated Orders</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-black text-slate-800 text-2xl mt-1.5 font-mono">{queries.length} Queries</h3>
          <p className="text-[10px] text-slate-400 mt-1">Held in system memory</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Gross Deposits</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="font-black text-emerald-600 text-2xl mt-1.5 font-mono">Rs. {totalRevenue}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Secured safely under guarantee</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resident Payouts</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="font-black text-blue-600 text-2xl mt-1.5 font-mono font-sans">Rs. {totalPayouts}</h3>
          <p className="text-[10px] text-slate-400 mt-1">80-90% Marketplace share</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Active Held Holds</span>
            <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <h3 className="font-black text-amber-600 text-2xl mt-1.5 font-mono">Rs. {totalHeldFunds}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting review/answers</p>
        </div>
      </div>

      {/* INTERNAL TABS */}
      <div className="flex border-b border-slate-200 mb-6 font-medium text-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 border-b-2 font-bold cursor-pointer transition-colors ${
            activeTab === 'users' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👤 Pre-seeded Accounts (Role Switcher)
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 border-b-2 font-bold cursor-pointer transition-colors ${
            activeTab === 'orders' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Live Inquiries List ({queries.length})
        </button>
        <button
          onClick={() => setActiveTab('seeding')}
          className={`pb-3 px-4 border-b-2 font-bold cursor-pointer transition-colors ${
            activeTab === 'seeding' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⚡ Seeding & Diagnostics
        </button>
      </div>

      {/* TAB CONTENT: PRE-SEEDED ACCOUNTS (ROLE SWITCHER) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 leading-relaxed max-w-4xl">
            <strong>💡 How to use:</strong> Select an account profile below to instantly log into that perspective. Once logged in, you can navigate the entire platform using their custom views (e.g. chat dashboards, wallet statements, leaving buyer reviews) to verify high-fidelity flows.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* GUEST ACCOUNT */}
            <div className={`border-2 rounded-2xl p-6 transition-all bg-white ${activeRole === 'guest' ? 'border-blue-600 shadow-xs' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Guest</span>
                {activeRole === 'guest' && <span className="text-xs text-blue-600 font-bold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Active Session</span>}
              </div>
              <h4 className="font-bold text-slate-800 text-base">Unauthenticated Visitor</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Acts as a fresh guest visiting the page. Can browse apartments, look at verified resident bios, read reviews, and select consultation pricing packages.
              </p>
              <button
                onClick={() => {
                  setActiveRole('guest');
                  setView('home');
                  setSimulateStatusMsg('Switched active role to Guest perspective.');
                  setTimeout(() => setSimulateStatusMsg(''), 2500);
                }}
                className="w-full mt-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Log In as Guest
              </button>
            </div>

            {/* AMIT KUMAR BUYER */}
            <div className={`border-2 rounded-2xl p-6 transition-all bg-white ${activeRole === 'buyer' ? 'border-blue-600 shadow-xs' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Pre-seeded Buyer</span>
                {activeRole === 'buyer' && <span className="text-xs text-blue-600 font-bold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Active Session</span>}
              </div>
              <h4 className="font-bold text-slate-800 text-base">Amit Kumar</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pre-loaded with pending queries and scheduled 20-min live consults. Can access the **Buyer Dashboard** to track orders, message residents, or complete review feedback.
              </p>
              <button
                onClick={() => {
                  setActiveRole('buyer');
                  setView('buyer_dashboard');
                  setSimulateStatusMsg('Logged in as Amit Kumar (Buyer). Redirected to Buyer Dashboard!');
                  setTimeout(() => setSimulateStatusMsg(''), 2500);
                }}
                className="w-full mt-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Log In as Amit (Buyer)
              </button>
            </div>

            {/* PRIYA EXPERT */}
            <div className={`border-2 rounded-2xl p-6 transition-all bg-white ${activeRole === 'expert' ? 'border-blue-600 shadow-xs' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Pre-seeded Expert</span>
                {activeRole === 'expert' && <span className="text-xs text-blue-600 font-bold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Active Session</span>}
              </div>
              <h4 className="font-bold text-slate-800 text-base">Priya (Verified Local)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Assigned to Amit\'s queries for Bimbisar Nagar. Can access the **Expert Dashboard** to reply to messages, reply to queries, submit answers, and request payouts.
              </p>
              <button
                onClick={() => {
                  setActiveRole('expert');
                  setView('expert_dashboard');
                  setSimulateStatusMsg('Logged in as Priya (Resident Expert). Redirected to Expert Dashboard!');
                  setTimeout(() => setSimulateStatusMsg(''), 2500);
                }}
                className="w-full mt-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Log In as Priya (Expert)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: LIVE INQUIRIES LIST */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
            <span className="text-xs text-slate-600 font-medium">Currently holding {queries.length} dynamic order records in runtime.</span>
            <button
              onClick={handleSimulateNewOrder}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate New Random Buyer Order</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold font-mono text-[10px] uppercase">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Buyer</th>
                    <th className="p-4">Expert (Locality)</th>
                    <th className="p-4">Package Option</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queries.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-600">{q.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{q.buyerName}</span>
                        <span className="text-[10px] text-slate-400">ID: {q.buyerId}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{q.expertName}</span>
                        <span className="text-[10px] text-slate-400">{q.localityName}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          q.packageOption === 'LIVE_CHAT' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                          q.packageOption === 'BUNDLE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-50 text-slate-700 border border-slate-100'
                        }`}>
                          {q.packageOption}
                        </span>
                        {q.bookedSlot && (
                          <span className="block text-[10px] text-orange-600 font-bold mt-1">📅 {q.bookedSlot}</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">Rs. {q.pricePaid}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'ACCEPTED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          q.status === 'ANSWERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${q.status === 'ACCEPTED' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {q.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 space-y-1.5 md:space-y-0">
                        {q.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleSimulateAnswerDelivery(q.id)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Simulate Response</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Automatically log in as the appropriate role depending on query context, or let them switch
                            setActiveRole('buyer');
                            onOpenQuery(q);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Enter Chat Room</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SEEDING & DIAGNOSTICS */}
      {activeTab === 'seeding' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div>
            <h4 className="font-bold text-slate-800 text-base mb-2">Platform Seed Operations</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quick commands to seed, truncate, or reset local memory data collections. Useful when testing the client-side experience cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Reset to Demo Initial State</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Truncates custom orders and loads pre-seeded Priya & Rohan chat.</span>
              </div>
              <button
                onClick={handleResetToPreSeeded}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-sans"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            </div>

            <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Pre-seed Random Order</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Creates a pending consultation on a random apartment block.</span>
              </div>
              <button
                onClick={handleSimulateNewOrder}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Query</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h5 className="font-bold text-slate-800 text-xs mb-2">Live Diagnostics Feed:</h5>
            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300 space-y-1 select-none">
              <p className="text-slate-500">[{new Date().toLocaleTimeString()}] System booted successfully.</p>
              <p className="text-slate-500">[{new Date().toLocaleTimeString()}] Configured developer password protection: "BR1510"</p>
              <p className="text-emerald-400">[{new Date().toLocaleTimeString()}] Pre-loaded verified expert catalog: {experts.length} active experts</p>
              <p className="text-blue-400">[{new Date().toLocaleTimeString()}] Active role: "{activeRoleName()}"</p>
              <p className="text-amber-400">[{new Date().toLocaleTimeString()}] Memory order database: {queries.length} listings</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
