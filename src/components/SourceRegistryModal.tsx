import React, { useState } from 'react';
import {
  Database, Calendar, CheckCircle2, ExternalLink, Search, X
} from 'lucide-react';
import { OFFICIAL_SOURCE_REGISTRY } from '../data/sourceRegistry';

interface SourceRegistryModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

// Previously claimed a fabricated "Audited & Confirmed" status, a fake quarterly audit cycle,
// and an invented "Source Registry Audit Version" for every single entry -- including sources
// BeforeRegret has never actually queried (a decommissioned HIFLD portal, county assessor
// records that don't exist anywhere in this codebase). Rewritten to say exactly what's true:
// which sources are genuinely queried live right now, and which are reference links only.
export const SourceRegistryModal: React.FC<SourceRegistryModalProps> = ({ isOpen = true, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredSources = OFFICIAL_SOURCE_REGISTRY.filter(src => {
    const matchesSearch = src.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          src.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          src.dataTypes.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = filterLevel === 'ALL' || src.governmentLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const liveCount = OFFICIAL_SOURCE_REGISTRY.filter(s => s.isLive).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans text-slate-900 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">

        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-slate-500/20 text-slate-300 rounded-full text-xs font-mono font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>Public Data Source Registry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Where This Report's Data Comes From
            </h2>
            <p className="text-xs text-slate-400">
              {liveCount} of {OFFICIAL_SOURCE_REGISTRY.length} sources below are queried live by BeforeRegret. The rest are direct links to the official portal so you can check them yourself.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sources, agencies, data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-500 font-medium shrink-0">Level:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Government Levels</option>
              <option value="Federal">Federal</option>
              <option value="State">State</option>
              <option value="County">County</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>
        </div>

        {/* Registry Table List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              <span>How to read this list</span>
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-emerald-700">Live</span> means BeforeRegret actually calls that source's API for every report. Everything else is a direct link to the official government portal -- BeforeRegret has not independently queried it, and nothing about it should be treated as confirmed until you check it yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredSources.map((src) => (
              <div key={src.id} className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 transition-all space-y-3 shadow-2xs">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-mono font-bold uppercase rounded">
                        {src.governmentLevel}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${src.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {src.isLive ? 'LIVE -- QUERIED BY BEFOREREGRET' : 'REFERENCE LINK -- NOT YET QUERIED'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1">
                      {src.name}
                    </h3>
                    <p className="text-xs text-slate-500">{src.agency}</p>
                  </div>

                  <a
                    href={src.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors shrink-0 self-start sm:self-auto"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{src.statusNote}</span>
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {src.dataTypes.map((dt, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[11px]">
                      {dt}
                    </span>
                  ))}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
