import React, { useState } from 'react';
import { Situation } from '../types';
import { PRESEEDED_SITUATIONS } from '../data/mockData';
import { ArrowRight, Compass, Shield, Users, Percent, HelpCircle, AlertTriangle, TrendingUp, Sparkles, Scale, Columns, ArrowLeftRight, Heart } from 'lucide-react';

interface CompareScreenProps {
  slug1: string;
  slug2: string;
  situations: Situation[];
  setScreen: (screen: { type: string; slug?: string }) => void;
}

export default function CompareScreen({ slug1, slug2, situations, setScreen }: CompareScreenProps) {
  // Try to find the preseeded situations
  const situation1 = situations.find(s => s.slug === slug1) || situations.find(s => s.slug.includes(slug1)) || situations[0];
  const situation2 = situations.find(s => s.slug === slug2) || situations.find(s => s.slug.includes(slug2)) || situations[1] || situations[0];

  const [activeSlug1, setActiveSlug1] = useState(situation1.slug);
  const [activeSlug2, setActiveSlug2] = useState(situation2.slug);

  const s1 = situations.find(s => s.slug === activeSlug1) || situation1;
  const s2 = situations.find(s => s.slug === activeSlug2) || situation2;

  // Render side-by-side metrics
  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-[#F4B942]">
          <Scale className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Decisional Comparative Ledger
        </h1>
        <p className="text-xs sm:text-sm text-[#AAB2C0] leading-relaxed">
          Compare demographics, regret curves, and relationship split rates side-by-side to make the best possible choice based on raw past historical outcomes.
        </p>
      </div>

      {/* Comparison Selector Controls */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Selector 1 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Decision A</label>
          <select
            value={activeSlug1}
            onChange={(e) => {
              setActiveSlug1(e.target.value);
              // Push url state programmatically to follow Restful patterns
              window.history.pushState(
                { type: 'compare', slug: `${e.target.value}-vs-${activeSlug2}` },
                '',
                `/compare/${e.target.value}-vs-${activeSlug2}`
              );
            }}
            className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#4F8CFF] rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-bold"
          >
            {situations.map(s => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Selector 2 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Decision B</label>
          <select
            value={activeSlug2}
            onChange={(e) => {
              setActiveSlug2(e.target.value);
              window.history.pushState(
                { type: 'compare', slug: `${activeSlug1}-vs-${e.target.value}` },
                '',
                `/compare/${activeSlug1}-vs-${e.target.value}`
              );
            }}
            className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#4F8CFF] rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer font-bold"
          >
            {situations.map(s => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Side-by-Side Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scenario A Card */}
        <div className="bg-[#161B22] border border-[#30363D] hover:border-[#4F8CFF]/50 rounded-3xl p-5 sm:p-6 space-y-6 transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4F8CFF]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-[#4F8CFF]/10 text-[#4F8CFF] font-black px-2.5 py-0.5 rounded-lg border border-[#4F8CFF]/20 uppercase tracking-widest font-mono">
              Scenario Alpha
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">{s1.stats.storyCount.toLocaleString()} Dossiers Logged</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white group-hover:text-[#4F8CFF] cursor-pointer transition-colors" onClick={() => setScreen({ type: 'situation', slug: s1.slug })}>
              {s1.name}
            </h3>
            <p className="text-xs text-[#AAB2C0] leading-relaxed">
              {s1.description}
            </p>
          </div>

          {/* S1 Metrics List */}
          <div className="grid grid-cols-2 gap-3 bg-[#0D1117] p-4 rounded-2xl border border-[#30363D]">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Average Regret</span>
              <strong className="text-xl sm:text-2xl font-black text-red-400 font-mono">{s1.stats.avgRegret} / 10</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Would Do Again</span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{s1.stats.wouldDoAgainPercent}%</strong>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1C2128] border border-[#30363D]/65 p-3 rounded-xl text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Separation Rate</span>
              <strong className="text-sm font-extrabold text-white font-mono mt-0.5 block">{s1.stats.separatedPercent}%</strong>
            </div>
            <div className="bg-[#1C2128] border border-[#30363D]/65 p-3 rounded-xl text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Duration Length</span>
              <strong className="text-sm font-extrabold text-white font-mono mt-0.5 block">{s1.stats.avgRelationshipLength}</strong>
            </div>
          </div>

          {/* S1 Decision Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest border-b border-[#30363D]/50 pb-1.5 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-[#4F8CFF]" /> Logged Course of Action
            </h4>
            <div className="space-y-2">
              {s1.decisionBreakdown.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-300 truncate">{d.name}</span>
                    <span className="text-[#4F8CFF] font-mono">{d.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#4F8CFF] to-blue-600 rounded-full" style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setScreen({ type: 'situation', slug: s1.slug })}
            className="w-full py-2 bg-[#0D1117] text-[#4F8CFF] hover:bg-[#4F8CFF]/10 text-[11px] font-semibold tracking-wider rounded-xl border border-[#4F8CFF]/20 transition-all font-mono uppercase"
          >
            Access Full Dossier
          </button>
        </div>

        {/* Scenario B Card */}
        <div className="bg-[#161B22] border border-[#30363D] hover:border-pink-500/50 rounded-3xl p-5 sm:p-6 space-y-6 transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-pink-500/10 text-pink-400 font-black px-2.5 py-0.5 rounded-lg border border-pink-500/20 uppercase tracking-widest font-mono">
              Scenario Beta
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">{s2.stats.storyCount.toLocaleString()} Dossiers Logged</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white group-hover:text-pink-400 cursor-pointer transition-colors" onClick={() => setScreen({ type: 'situation', slug: s2.slug })}>
              {s2.name}
            </h3>
            <p className="text-xs text-[#AAB2C0] leading-relaxed">
              {s2.description}
            </p>
          </div>

          {/* S2 Metrics List */}
          <div className="grid grid-cols-2 gap-3 bg-[#0D1117] p-4 rounded-2xl border border-[#30363D]">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Average Regret</span>
              <strong className="text-xl sm:text-2xl font-black text-red-400 font-mono">{s2.stats.avgRegret} / 10</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Would Do Again</span>
              <strong className="text-xl sm:text-2xl font-black text-[#F4B942] font-mono">{s2.stats.wouldDoAgainPercent}%</strong>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1C2128] border border-[#30363D]/65 p-3 rounded-xl text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Separation Rate</span>
              <strong className="text-sm font-extrabold text-white font-mono mt-0.5 block">{s2.stats.separatedPercent}%</strong>
            </div>
            <div className="bg-[#1C2128] border border-[#30363D]/65 p-3 rounded-xl text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Duration Length</span>
              <strong className="text-sm font-extrabold text-white font-mono mt-0.5 block">{s2.stats.avgRelationshipLength}</strong>
            </div>
          </div>

          {/* S2 Decision Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest border-b border-[#30363D]/50 pb-1.5 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-pink-400" /> Logged Course of Action
            </h4>
            <div className="space-y-2">
              {s2.decisionBreakdown.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-300 truncate">{d.name}</span>
                    <span className="text-pink-400 font-mono">{d.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full" style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setScreen({ type: 'situation', slug: s2.slug })}
            className="w-full py-2 bg-[#0D1117] text-pink-400 hover:bg-pink-500/10 text-[11px] font-semibold tracking-wider rounded-xl border border-pink-500/20 transition-all font-mono uppercase"
          >
            Access Full Dossier
          </button>
        </div>

      </div>

      <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-5 sm:p-6 text-center max-w-xl mx-auto space-y-3.5">
        <Heart className="h-6 w-6 text-[#F4B942] mx-auto" />
        <h3 className="text-xs font-black text-white uppercase tracking-wider">Unbiased Survivor Experience Logging</h3>
        <p className="text-[11px] text-[#AAB2C0] leading-relaxed">
          Both decisions carry severe long-term mental adjustments. Do not rush. Let peer logs of timeline chronicles guide your judgment. Write down your own outcome to backfill our secure ledger for other peer citizens.
        </p>
      </div>

    </div>
  );
}
