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
        <div className="mx-auto w-12 h-12 bg-[#FFF8E1] border border-[#E8D79B] rounded-2xl flex items-center justify-center text-[#C9A227] shadow-sm">
          <Scale className="h-6 w-6" />
        </div>
        <h1 className="text-xl sm:text-3xl font-bold text-[#24324A] tracking-tight uppercase font-display">
          Decisional Comparative Ledger
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-medium">
          Compare demographics, regret curves, and relationship split rates side-by-side to make the best possible choice based on raw past historical outcomes.
        </p>
      </div>

      {/* Comparison Selector Controls */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center shadow-sm">
        {/* Selector 1 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider font-mono">Select Decision A</label>
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
            className="w-full bg-white border border-[#E5E7EB] focus:border-[#24324A] focus:ring-4 focus:ring-[#24324A]/5 rounded-xl p-2.5 text-xs text-[#1F2937] focus:outline-none transition-all cursor-pointer font-bold"
          >
            {situations.map(s => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Selector 2 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider font-mono">Select Decision B</label>
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
            className="w-full bg-white border border-[#E5E7EB] focus:border-[#24324A] focus:ring-4 focus:ring-[#24324A]/5 rounded-xl p-2.5 text-xs text-[#1F2937] focus:outline-none transition-all cursor-pointer font-bold"
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
        <div className="bg-white border border-[#E5E7EB] hover:border-[#24324A]/50 rounded-3xl p-5 sm:p-6 space-y-6 transition-all relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#24324A]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-[#24324A]/5 text-[#24324A] font-bold px-2.5 py-0.5 rounded-lg border border-[#24324A]/10 uppercase tracking-widest font-mono">
              Scenario Alpha
            </span>
            <span className="text-[11px] text-zinc-400 font-mono font-medium">{s1.stats.storyCount.toLocaleString()} Dossiers Logged</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#24324A] group-hover:text-[#C9A227] cursor-pointer transition-colors font-serif" onClick={() => setScreen({ type: 'situation', slug: s1.slug })}>
              {s1.name}
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed font-sans font-medium">
              {s1.description}
            </p>
          </div>

          {/* S1 Metrics List */}
          <div className="grid grid-cols-2 gap-3 bg-[#FAF8F2] p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">Average Regret</span>
              <strong className="text-xl sm:text-2xl font-bold text-[#C0392B] font-mono">{s1.stats.avgRegret} / 10</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">Would Do Again</span>
              <strong className="text-xl sm:text-2xl font-bold text-[#2E7D32] font-mono">{s1.stats.wouldDoAgainPercent}%</strong>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 font-medium">
            <div className="bg-[#FAF8F2] border border-[#E5E7EB] p-3 rounded-xl text-center">
              <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Separation Rate</span>
              <strong className="text-sm font-bold text-[#1F2937] font-mono mt-0.5 block">{s1.stats.separatedPercent}%</strong>
            </div>
            <div className="bg-[#FAF8F2] border border-[#E5E7EB] p-3 rounded-xl text-center">
              <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Duration Length</span>
              <strong className="text-sm font-bold text-[#1F2937] font-mono mt-0.5 block">{s1.stats.avgRelationshipLength}</strong>
            </div>
          </div>

          {/* S1 Decision Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest border-b border-[#ECECEC] pb-1.5 flex items-center gap-1.5 font-mono">
              <TrendingUp className="h-3 w-3 text-[#24324A]" /> Logged Course of Action
            </h4>
            <div className="space-y-2">
              {s1.decisionBreakdown.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-[#374151] truncate font-medium">{d.name}</span>
                    <span className="text-[#24324A] font-mono font-bold">{d.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#FAF8F2] rounded-full overflow-hidden border border-[#E5E7EB]">
                    <div className="h-full bg-[#24324A] rounded-full" style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setScreen({ type: 'situation', slug: s1.slug })}
            className="w-full py-2 bg-white text-[#24324A] hover:bg-[#24324A]/5 text-[11px] font-bold tracking-wider rounded-xl border border-[#24324A]/25 transition-all font-mono uppercase shadow-xs"
          >
            Access Full Dossier
          </button>
        </div>

        {/* Scenario B Card */}
        <div className="bg-white border border-[#E5E7EB] hover:border-[#C9A227]/50 rounded-3xl p-5 sm:p-6 space-y-6 transition-all relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C9A227]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-[#FFF8E1] text-[#C9A227] font-bold px-2.5 py-0.5 rounded-lg border border-[#E8D79B] uppercase tracking-widest font-mono">
              Scenario Beta
            </span>
            <span className="text-[11px] text-zinc-400 font-mono font-medium">{s2.stats.storyCount.toLocaleString()} Dossiers Logged</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#24324A] group-hover:text-[#C9A227] cursor-pointer transition-colors font-serif" onClick={() => setScreen({ type: 'situation', slug: s2.slug })}>
              {s2.name}
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed font-sans font-medium">
              {s2.description}
            </p>
          </div>

          {/* S2 Metrics List */}
          <div className="grid grid-cols-2 gap-3 bg-[#FAF8F2] p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">Average Regret</span>
              <strong className="text-xl sm:text-2xl font-bold text-[#C0392B] font-mono">{s2.stats.avgRegret} / 10</strong>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">Would Do Again</span>
              <strong className="text-xl sm:text-2xl font-bold text-[#C9A227] font-mono">{s2.stats.wouldDoAgainPercent}%</strong>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 font-medium">
            <div className="bg-[#FAF8F2] border border-[#E5E7EB] p-3 rounded-xl text-center">
              <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Separation Rate</span>
              <strong className="text-sm font-bold text-[#1F2937] font-mono mt-0.5 block">{s2.stats.separatedPercent}%</strong>
            </div>
            <div className="bg-[#FAF8F2] border border-[#E5E7EB] p-3 rounded-xl text-center">
              <span className="text-[9px] font-mono font-bold text-[#6B7280] uppercase tracking-wider block">Duration Length</span>
              <strong className="text-sm font-bold text-[#1F2937] font-mono mt-0.5 block">{s2.stats.avgRelationshipLength}</strong>
            </div>
          </div>

          {/* S2 Decision Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest border-b border-[#ECECEC] pb-1.5 flex items-center gap-1.5 font-mono">
              <TrendingUp className="h-3 w-3 text-[#C9A227]" /> Logged Course of Action
            </h4>
            <div className="space-y-2">
              {s2.decisionBreakdown.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-[#374151] truncate font-medium">{d.name}</span>
                    <span className="text-[#C9A227] font-mono font-bold">{d.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#FAF8F2] rounded-full overflow-hidden border border-[#E5E7EB]">
                    <div className="h-full bg-[#C9A227] rounded-full" style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setScreen({ type: 'situation', slug: s2.slug })}
            className="w-full py-2 bg-white text-[#C9A227] hover:bg-[#FFF8E1]/30 text-[11px] font-bold tracking-wider rounded-xl border border-[#C9A227]/25 transition-all font-mono uppercase shadow-xs"
          >
            Access Full Dossier
          </button>
        </div>

      </div>

      <div className="bg-[#FAF8F2] border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 text-center max-w-xl mx-auto space-y-3.5 shadow-sm">
        <Heart className="h-6 w-6 text-[#C9A227] mx-auto" />
        <h3 className="text-xs font-bold text-[#24324A] uppercase tracking-wider font-mono">Unbiased Survivor Experience Logging</h3>
        <p className="text-[11px] text-[#6B7280] leading-relaxed font-medium">
          Both decisions carry severe long-term mental adjustments. Do not rush. Let peer logs of timeline stories guide your judgment. Write down your own outcome to backfill our secure ledger for other peer citizens.
        </p>
      </div>

    </div>
  );
}
