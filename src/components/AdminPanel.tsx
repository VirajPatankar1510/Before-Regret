import React, { useState, useMemo } from 'react';
import { Neighborhood, ExpertProfile, DirectQuery, Society } from '../types';
import { 
  Lock, Key, Users, Activity, FileText, CheckCircle, 
  RefreshCw, Plus, Eye, TrendingUp, Wallet, ShieldAlert,
  ArrowLeft, MessageSquare, Clock, Check, Building2,
  GitMerge, Download, Upload, Search, Trash2, Edit3, AlertCircle,
  History, Sparkles, Tag
} from 'lucide-react';
import { 
  normalizeSocietyName, 
  importSocietiesFromCSV, 
  exportSocietiesToCSV, 
  fuzzyMatchSociety 
} from '../utils/societySearch';

interface AdminPanelProps {
  setView: (view: any) => void;
  activeRole: 'guest' | 'buyer' | 'expert';
  setActiveRole: (role: 'guest' | 'buyer' | 'expert') => void;
  queries: DirectQuery[];
  setQueries: React.Dispatch<React.SetStateAction<DirectQuery[]>>;
  experts: ExpertProfile[];
  localities: Neighborhood[];
  onOpenQuery: (query: DirectQuery) => void;
  societies?: Society[];
  setSocieties?: React.Dispatch<React.SetStateAction<Society[]>>;
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
  societies = [],
  setSocieties,
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  // Admin Tabs: 'societies' | 'import_export' | 'orders' | 'users'
  const [activeTab, setActiveTab] = useState<'societies' | 'import_export' | 'orders' | 'users'>('societies');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Verified' | 'Archived'>('ALL');

  // Edit / Merge modal states
  const [selectedSocietyForEdit, setSelectedSocietyForEdit] = useState<Society | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editAliasesStr, setEditAliasesStr] = useState('');

  // Merge modal state
  const [mergeSourceSociety, setMergeSourceSociety] = useState<Society | null>(null);
  const [mergeTargetSocietyId, setMergeTargetSocietyId] = useState('');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importReport, setImportReport] = useState('');

  // Audit History Modal State
  const [historySociety, setHistorySociety] = useState<Society | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'BR1510' || password === 'admin') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect Administrator Password. (Try: BR1510)');
    }
  };

  // Filtered societies list
  const filteredSocieties = useMemo(() => {
    return societies.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.aliases || []).some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

      const status = s.verificationStatus || 'Verified';
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [societies, searchQuery, statusFilter]);

  // Fuzzy Duplicate Suggestions list
  const fuzzyDuplicatesList = useMemo(() => {
    const pairs: Array<{ soc1: Society; soc2: Society; score: number }> = [];
    for (let i = 0; i < societies.length; i++) {
      for (let j = i + 1; j < societies.length; j++) {
        const fuzzy = fuzzyMatchSociety(societies[i].name, [societies[j]]);
        if (fuzzy.suggestions.length > 0 && fuzzy.suggestions[0].score >= 0.6) {
          pairs.push({
            soc1: societies[i],
            soc2: societies[j],
            score: fuzzy.suggestions[0].score
          });
        }
      }
    }
    return pairs;
  }, [societies]);

  // Handle Approve Society
  const handleApproveSociety = (societyId: string) => {
    if (!setSocieties) return;
    setSocieties(prev => prev.map(s => {
      if (s.id === societyId) {
        return {
          ...s,
          verificationStatus: 'Verified' as const,
          updatedAt: new Date().toISOString(),
          history: [
            ...(s.history || []),
            {
              timestamp: new Date().toISOString(),
              action: 'APPROVE',
              details: 'Approved by Platform Administrator'
            }
          ]
        };
      }
      return s;
    }));
  };

  // Handle Archive Society
  const handleArchiveSociety = (societyId: string) => {
    if (!setSocieties) return;
    setSocieties(prev => prev.map(s => {
      if (s.id === societyId) {
        return {
          ...s,
          verificationStatus: 'Archived' as const,
          updatedAt: new Date().toISOString(),
          history: [
            ...(s.history || []),
            {
              timestamp: new Date().toISOString(),
              action: 'ARCHIVE',
              details: 'Archived by Platform Administrator'
            }
          ]
        };
      }
      return s;
    }));
  };

  // Open Edit Modal
  const handleOpenEdit = (s: Society) => {
    setSelectedSocietyForEdit(s);
    setEditName(s.name);
    setEditLocality(s.locality);
    setEditCity(s.city);
    setEditLandmark(s.landmark || '');
    setEditPincode(s.pincode || '');
    setEditAliasesStr((s.aliases || []).join(', '));
  };

  // Save Edit Society
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocietyForEdit || !setSocieties) return;

    const normalized = normalizeSocietyName(editName);
    const aliasArr = editAliasesStr
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    setSocieties(prev => prev.map(s => {
      if (s.id === selectedSocietyForEdit.id) {
        return {
          ...s,
          name: normalized,
          normalizedName: normalized.toUpperCase(),
          locality: editLocality.trim(),
          city: editCity.trim(),
          landmark: editLandmark.trim(),
          pincode: editPincode.trim(),
          aliases: Array.from(new Set([...aliasArr, normalized])),
          updatedAt: new Date().toISOString(),
          history: [
            ...(s.history || []),
            {
              timestamp: new Date().toISOString(),
              action: 'EDIT',
              details: `Updated metadata. Display Name set to "${normalized}"`
            }
          ]
        };
      }
      return s;
    }));

    setSelectedSocietyForEdit(null);
  };

  // Execute Society Merge
  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceSociety || !mergeTargetSocietyId || !setSocieties) return;

    const targetSoc = societies.find(s => s.id === mergeTargetSocietyId);
    if (!targetSoc) return;

    setSocieties(prev => {
      const mergedAliases = Array.from(new Set([
        ...(targetSoc.aliases || []),
        ...(mergeSourceSociety.aliases || []),
        mergeSourceSociety.name,
        mergeSourceSociety.normalizedName || mergeSourceSociety.name
      ].filter(Boolean)));

      const combinedProfiles = [...targetSoc.profiles, ...mergeSourceSociety.profiles];

      return prev.map(s => {
        if (s.id === targetSoc.id) {
          return {
            ...s,
            aliases: mergedAliases,
            residentProfilesCount: combinedProfiles.length,
            profiles: combinedProfiles,
            updatedAt: new Date().toISOString(),
            history: [
              ...(s.history || []),
              {
                timestamp: new Date().toISOString(),
                action: 'MERGE',
                details: `Merged duplicate society "${mergeSourceSociety.name}" (UUID: ${mergeSourceSociety.id}) into canonical record.`
              }
            ]
          };
        }
        if (s.id === mergeSourceSociety.id) {
          return {
            ...s,
            verificationStatus: 'Archived' as const,
            history: [
              ...(s.history || []),
              {
                timestamp: new Date().toISOString(),
                action: 'MERGE_ARCHIVE',
                details: `Merged into canonical society "${targetSoc.name}" (UUID: ${targetSoc.id})`
              }
            ]
          };
        }
        return s;
      });
    });

    setMergeSourceSociety(null);
    setMergeTargetSocietyId('');
  };

  // Handle CSV Import Submit
  const handleCSVImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim() || !setSocieties) return;

    const result = importSocietiesFromCSV(csvText, societies);
    setSocieties(result.updatedSocieties);
    setImportReport(result.reportSummary);
  };

  // Export CSV download
  const handleDownloadCSVExport = () => {
    const csvContent = exportSocietiesToCSV(societies);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `beforeregret_societies_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON download
  const handleDownloadJSONExport = () => {
    const jsonContent = JSON.stringify(societies, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `beforeregret_societies_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#F7F9FC] min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 max-w-md w-full space-y-6 shadow-md">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Administrator Portal</h1>
            <p className="text-xs text-slate-500">Enter security password to access global database and system tools.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Admin Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (e.g. BR1510)"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Authenticate Portal
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => setView('HOME')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FC] min-h-screen pb-20">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('HOME')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="font-bold text-base flex items-center gap-2">
                <span>Platform Admin Console</span>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-mono font-bold rounded-md">
                  LIVE DB
                </span>
              </div>
              <div className="text-xs text-slate-400">Canonical Residential Database & System Governance</div>
            </div>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-xs font-semibold border-t border-slate-800/80 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('societies')}
            className={`pb-2.5 border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'societies' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Societies Index ({societies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import_export')}
            className={`pb-2.5 border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'import_export' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>CSV Import & Export Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'orders' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Buyer Queries & Transactions ({queries.length})</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* TAB 1: SOCIETIES DATABASE */}
        {activeTab === 'societies' && (
          <div className="space-y-6">

            {/* Fuzzy Duplicate Suggestions Bar */}
            {fuzzyDuplicatesList.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Fuzzy Duplicate Suggestions Detected ({fuzzyDuplicatesList.length})</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    Auto-Trigram
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fuzzyDuplicatesList.map((pair, idx) => (
                    <div key={idx} className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{pair.soc1.name}</div>
                        <div className="text-slate-500">Similar to: {pair.soc2.name}</div>
                      </div>

                      <button
                        onClick={() => {
                          setMergeSourceSociety(pair.soc2);
                          setMergeTargetSocietyId(pair.soc1.id);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        1-Click Merge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls Bar */}
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                
                {/* Search input */}
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, locality, city, alias..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Status:</span>
                  {(['ALL', 'Pending', 'Verified', 'Archived'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table of Societies */}
            <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[11px]">
                      <th className="p-4 font-semibold">UUID & Name</th>
                      <th className="p-4 font-semibold">Location</th>
                      <th className="p-4 font-semibold">Aliases</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Profiles</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredSocieties.map((s) => {
                      const status = s.verificationStatus || 'Verified';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">UUID: {s.id}</div>
                          </td>

                          <td className="p-4 space-y-0.5">
                            <div className="font-semibold text-slate-800">{s.locality}, {s.city}</div>
                            {s.landmark && <div className="text-[11px] text-slate-500">LM: {s.landmark}</div>}
                          </td>

                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(s.aliases || []).map((alias, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200 font-mono">
                                  {alias}
                                </span>
                              ))}
                              {(!s.aliases || s.aliases.length === 0) && (
                                <span className="text-slate-400 text-[10px]">None</span>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                              status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                              status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {status}
                            </span>
                          </td>

                          <td className="p-4 font-bold text-slate-900">
                            {s.residentProfilesCount || 0} Profiles
                          </td>

                          <td className="p-4 text-right space-x-2">
                            {status === 'Pending' && (
                              <button
                                onClick={() => handleApproveSociety(s.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] cursor-pointer"
                              >
                                Verify
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] cursor-pointer"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setMergeSourceSociety(s);
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-[11px] cursor-pointer"
                            >
                              Merge
                            </button>

                            <button
                              onClick={() => setHistorySociety(s)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-[11px] cursor-pointer"
                            >
                              Audit
                            </button>

                            {status !== 'Archived' && (
                              <button
                                onClick={() => handleArchiveSociety(s.id)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded text-[11px] cursor-pointer"
                              >
                                Archive
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT / EXPORT DATA PIPELINE */}
        {activeTab === 'import_export' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* CSV Import Card */}
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Upload className="w-5 h-5 text-[#2563EB]" />
                <span>Bulk CSV Import Pipeline</span>
              </div>
              <p className="text-xs text-slate-500">
                Paste raw CSV lines containing: <code>Society Name, Area, City, State, Pincode, Builder, Nearest Landmark, Aliases</code>.
              </p>

              <form onSubmit={handleCSVImportSubmit} className="space-y-3">
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Society Name, Area, City, State, Country, Pincode, Builder, Nearest Landmark, Aliases\nLodha Splendor, Majiwada, Thane, Maharashtra, India, 400601, Lodha, Near Flyover, Lodha Splendor CHS; Splendor Society`}
                  className="w-full p-3 font-mono text-xs bg-[#F7F9FC] border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!csvText.trim()}
                  className="px-6 py-2.5 bg-[#2563EB] disabled:opacity-50 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Run Import Pipeline
                </button>
              </form>

              {importReport && (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono rounded-xl">
                  {importReport}
                </div>
              )}
            </div>

            {/* Export Card */}
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Download className="w-5 h-5 text-[#2563EB]" />
                <span>Export Canonical Database Dataset</span>
              </div>
              <p className="text-xs text-slate-500">
                Download the complete dataset containing all canonical societies, normalized names, aliases, and UUID identifiers.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadCSVExport}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV Dataset</span>
                </button>

                <button
                  onClick={handleDownloadJSONExport}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#2563EB]" />
                  <span>Download JSON Dataset</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS / TRANSACTIONS */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-4 shadow-2xs">
            <h2 className="font-bold text-slate-900 text-base">Transactions Audit Trail</h2>
            <p className="text-xs text-slate-500">Monitor all unlocked knowledge assets and buyer transactions.</p>
            
            <div className="divide-y divide-slate-100">
              {queries.map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{q.buyerName}</span> unlocked knowledge from <span className="font-semibold text-blue-600">{q.expertName}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">₹{q.pricePaid}</span>
                </div>
              ))}
              {queries.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">No buyer transactions recorded yet.</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: Edit Society Metadata */}
      {selectedSocietyForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Edit Society Metadata</h3>
              <button onClick={() => setSelectedSocietyForEdit(null)} className="text-xs text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Locality / Area</label>
                  <input
                    type="text"
                    required
                    value={editLocality}
                    onChange={(e) => setEditLocality(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Landmark</label>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Aliases (Comma Separated)</label>
                <input
                  type="text"
                  value={editAliasesStr}
                  onChange={(e) => setEditAliasesStr(e.target.value)}
                  placeholder="Lodha Splendor CHS, Splendor Society"
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSocietyForEdit(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white font-semibold text-xs rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Merge Societies */}
      {mergeSourceSociety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Merge Duplicate Society</h3>
              <button onClick={() => setMergeSourceSociety(null)} className="text-xs text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Merging source <strong>"{mergeSourceSociety.name}"</strong> into a target canonical record will transfer all profiles, aliases, and audit logs into the target, then archive the source record.
            </p>

            <form onSubmit={handleExecuteMerge} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Select Target Canonical Society</label>
                <select
                  required
                  value={mergeTargetSocietyId}
                  onChange={(e) => setMergeTargetSocietyId(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F9FC] border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">-- Choose Canonical Target Society --</option>
                  {societies.filter(s => s.id !== mergeSourceSociety.id).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.locality}, {s.city}) — UUID: {s.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMergeSourceSociety(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!mergeTargetSocietyId}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg"
                >
                  Confirm Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Audit Trail History */}
      {historySociety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{historySociety.name} — Audit Trail</h3>
                <div className="text-[10px] font-mono text-slate-400">UUID: {historySociety.id}</div>
              </div>
              <button onClick={() => setHistorySociety(null)} className="text-xs text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(historySociety.history || []).map((h, i) => (
                <div key={i} className="p-3 bg-[#F7F9FC] border border-slate-200 rounded-xl text-xs space-y-0.5">
                  <div className="flex justify-between font-mono font-bold text-blue-600 text-[10px]">
                    <span>{h.action}</span>
                    <span>{new Date(h.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700">{h.details}</p>
                </div>
              ))}
              {(!historySociety.history || historySociety.history.length === 0) && (
                <div className="p-4 text-center text-xs text-slate-400">No audit history entries recorded yet.</div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistorySociety(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
