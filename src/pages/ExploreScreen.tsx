import React from 'react';
import { Compass, FileText, ChevronRight, Gavel, Sparkles, AlertTriangle, HelpCircle, Heart, Tag } from 'lucide-react';
import { Situation } from '../types';

interface ExploreScreenProps {
  situations: Situation[];
  setScreen: (screen: { type: string; slug?: string }) => void;
}

export default function ExploreScreen({ situations, setScreen }: ExploreScreenProps) {
  
  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* Intro Header */}
      <div className="space-y-1.5 text-center max-w-2xl mx-auto py-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Outcome Intelligence Directories</h1>
        <p className="text-xs sm:text-sm text-[#AAB2C0] leading-relaxed">Browse pre-collected dossiers of real life relationship situations grouped by primary issues and geo-demographic patterns.</p>
      </div>

      {/* Categories Grid (Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {situations.map(s => (
          <div
            key={s.slug}
            onClick={() => setScreen({ type: 'situation', slug: s.slug })}
            className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 cursor-pointer shadow-sm hover:border-[#4F8CFF] hover:scale-[1.01] transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-[#AAB2C0] bg-[#30363D] px-2 py-0.5 rounded">
                  {s.category}
                </span>
                <span className="text-[10px] text-[#4F8CFF] font-semibold">Active Timeline dossiers →</span>
              </div>
              <h3 className="text-sm font-bold text-white pt-1">{s.name}</h3>
              <p className="text-xs text-[#AAB2C0] line-clamp-3 leading-relaxed">{s.description}</p>
            </div>

            
          </div>
        ))}
      </div>

      {/* Extra Directories shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Court shortcut */}
        <div 
          onClick={() => setScreen({ type: 'court_list' })}
          className="rounded-2xl border border-dashed border-[#F4B942]/20 bg-gradient-to-tr from-[#161B22] to-transparent p-5 cursor-pointer hover:border-[#F4B942] transition-colors"
        >
          <Gavel className="h-8 w-8 text-[#F4B942] mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Relationship Jury Courtroom</h3>
          <p className="text-xs text-[#AAB2C0] leading-relaxed">Read or load trials of digital snooping, Instagram ex-likes, or in-law disagreements. Take the stand and cast your active verdict.</p>
        </div>

        {/* Q&A shortcut */}
        <div 
          onClick={() => setScreen({ type: 'question_list' })}
          className="rounded-2xl border border-dashed border-purple-500/20 bg-gradient-to-tr from-[#161B22] to-transparent p-5 cursor-pointer hover:border-purple-500 transition-colors"
        >
          <Sparkles className="h-8 w-8 text-purple-400 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Peer Query Advisory</h3>
          <p className="text-xs text-[#AAB2C0] leading-relaxed">Ask other relationship survivors directly. Analyze community poll choices and link outcomes directly to archived story timelines.</p>
        </div>

      </section>

    </div>
  );
}
