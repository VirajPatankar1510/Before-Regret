import React, { useState, useMemo } from 'react';
import { 
  Heart, Sparkles, AlertTriangle, Gavel, HelpCircle, CheckCircle, 
  MessageSquare, ArrowRight, Clock, Compass, ShieldCheck, Scale, 
  Skull, User, TrendingUp, BarChart2, ChevronRight, Bookmark, Vote, BookOpen
} from 'lucide-react';
import { Story, CourtCase, Question, RedFlagCase } from '../types';

interface HubScreenProps {
  slug: string;
  stories: Story[];
  courtCases: CourtCase[];
  questions: Question[];
  redFlagCases: RedFlagCase[];
  setScreen: (screen: { type: string; slug?: string }) => void;
}

export default function HubScreen({ 
  slug, 
  stories, 
  courtCases, 
  questions, 
  redFlagCases, 
  setScreen 
}: HubScreenProps) {

  // ==========================================
  // WIDGET STATE: SHOULD-I-LEAVE (Checklist)
  // ==========================================
  const [checklistAnswers, setChecklistAnswers] = useState<Record<number, boolean>>({});
  const checklistQuestions = [
    { id: 1, text: "Have these core relationship issues been repeating for longer than 6 months with zero change?" },
    { id: 2, text: "Is the partner actively refusing to enter couples counseling or do genuine self-work?" },
    { id: 3, text: "Do you feel emotionally drained, hyper-vigilant, or unsafe expressing your authentic thoughts?" },
    { id: 4, text: "Are you staying primarily because of financial fear, child care logistics, or fear of loneliness rather than structural love?" },
    { id: 5, text: "If a close friend's partner treated them exactly how yours treats you, would you tell them to leave?" }
  ];
  
  const handleToggleChecklist = (id: number) => {
    setChecklistAnswers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const leaveScore = useMemo(() => {
    const answeredCount = Object.values(checklistAnswers).filter(Boolean).length;
    return (answeredCount / checklistQuestions.length) * 100;
  }, [checklistAnswers]);

  // ==========================================
  // WIDGET STATE: WILL-I-REGRET (Calculator)
  // ==========================================
  const [regretAge, setRegretAge] = useState<string>('26-35');
  const [regretDuration, setRegretDuration] = useState<string>('3-7 Years');
  const [regretReason, setRegretReason] = useState<string>('lack-of-commitment');

  const regretProfile = useMemo(() => {
    let label = "General Perspective";
    let advice = "Shared stories offer insights into how others approached similar dilemmas. Focus on defining your personal boundaries.";

    if (regretReason === 'cheating') {
      label = "Rebuilding Trust vs Starting Over";
      advice = "Infidelity poses significant challenges to trust, which contributors note is difficult to rebuild. Many find that dedicated therapy can support either path, but honest communication is a prerequisite.";
    } else if (regretReason === 'kids-mismatch') {
      label = "Values Mismatch (Children)";
      advice = "Having kids is a binary choice. Shared stories show that partners who compromised on their true desires often experienced silent resentment over time.";
    } else if (regretReason === 'lack-of-commitment') {
      label = "Commitment & Timelines";
      advice = "Waiting indefinitely for a partner to commit can build severe frustration. Many survivors suggest setting clear timelines and discussing mutual expectations openly.";
    } else if (regretReason === 'moving-relocation') {
      label = "Relocating for Love";
      advice = "Moving can be successful, but maintaining your own career, hobbies, and a local support system in the new location is crucial for transition stability.";
    }

    return { label, advice };
  }, [regretReason]);

  // ==========================================
  // WIDGET STATE: RED-FLAGS (Analyzer)
  // ==========================================
  const [ratedFlags, setRatedFlags] = useState<Record<string, number>>({
    isolation: 0,
    deflection: 0,
    exesControl: 0,
    stonewalling: 0
  });

  const redFlagDangerScore = useMemo(() => {
    const total = Object.keys(ratedFlags).reduce((sum, key) => sum + ratedFlags[key], 0);
    const maxPoss = Object.keys(ratedFlags).length * 10;
    return maxPoss ? Math.round((total / maxPoss) * 100) : 0;
  }, [ratedFlags]);

  // ==========================================
  // RENDER SECTIONS
  // ==========================================
  return (
    <div className="space-y-12 pb-24 animate-fadeIn" id="seo-hub-landing-stage">
      
      {/* 1. HERO MAIN SECTION */}
      {slug === 'should-i-leave' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Heart className="h-3 w-3 animate-pulse" /> Decisional Intelligence Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Should I Leave My Partner? <br />
            <span className="text-[#000000]">Clear the Emotional Fog</span> with Data
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Reflecting on whether to stay or leave can feel overwhelming. BeforeRegret helps you browse 
            experiences shared by others in similar situations to help you process your decision.
          </p>
        </div>
      )}

      {slug === 'will-i-regret' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="h-3 w-3" /> Perspectives Board
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Will I Regret It? <br />
            <span className="text-[#000000]">Reflecting on Long-Term Choices</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Understanding how similar situations turned out for others can highlight potential paths forward 
            and help you think calmly through long-term feelings and decisions.
          </p>
        </div>
      )}

      {slug === 'red-flags' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4B942]/10 text-[#F4B942] border border-[#F4B942]/20">
            <AlertTriangle className="h-3 w-3 animate-bounce" /> Behavioral Warnings Checklist
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Red Flags Checklist <br />
            <span className="text-[#000000]">Reflecting on Partner Behavior</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Reflect on recurring behaviors, gauge severity from shared experiences, and read accounts 
            of how warning signs played out for other couples.
          </p>
        </div>
      )}

      {slug === 'relationship-regrets' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="h-3 w-3" /> Shared Perspectives
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            The Relationship Regrets Registry <br />
            <span className="text-[#000000]">The Ultimate Database of Retrospective Wisdom</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            A curated collection of shared relationship stories. Read authentic accounts detailing choices, 
            post-separation adjustments, and lessons learned from peers.
          </p>
        </div>
      )}

      {slug === 'commitment-issues' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="h-3 w-3" /> Relationship Friction Board
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Commitment, Kids & Ultimatums Hub <br />
            <span className="text-[#000000]">Reflecting on Life Vision Mismatches</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Navigate the silent, structure-defining friction points. Reflect on shared experiences regarding marriage 
            ultimatums, parenting agreements, career relocation decisions, and family dynamics.
          </p>
        </div>
      )}

      {/* 2. DYNAMIC INTERACTIVE WIDGET SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Interactive Tool / Calculator */}
        <div className="lg:col-span-7 bg-[#161B22] border border-[#30363D] p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          
          {slug === 'should-i-leave' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-red-500" /> Ground Reality Checklist
                </h2>
                <span className="font-mono text-xs text-[#F4B942]">Self-Reflection</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Reflecting on these key dimensions can help clarify your thoughts:
              </p>
              
              <div className="space-y-3.5 pt-2">
                {checklistQuestions.map(q => (
                  <button 
                    key={q.id}
                    onClick={() => handleToggleChecklist(q.id)}
                    className={`w-full flex items-start gap-3.5 text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      checklistAnswers[q.id] 
                      ? 'bg-red-500/5 border-red-500/40 text-white' 
                      : 'bg-[#0D1117]/60 border-[#30363D] hover:border-[#4F8CFF]/50 text-gray-300'
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 border uppercase font-black text-[10px] transition-all ${
                      checklistAnswers[q.id] 
                      ? 'bg-red-500 border-red-500 text-white' 
                      : 'border-gray-500 text-transparent'
                    }`}>
                      ✓
                    </div>
                    <span className="text-xs sm:text-sm">{q.text}</span>
                  </button>
                ))}
              </div>

              {/* Leave Score Display */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Reflective Tension Score:</span>
                  <span className={`font-mono font-bold text-sm ${leaveScore >= 60 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                    {Math.round(leaveScore)}% Indicator
                  </span>
                </div>
                <div className="relative w-full h-2 rounded-full bg-[#0D1117] overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${leaveScore >= 60 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${leaveScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed bg-[#0D1117] p-3 rounded-xl border border-[#30363D]/40">
                  {leaveScore >= 60 
                    ? "💡 HIGH TENSION: Several key tension points are active. Many contributors with similar experiences reported that focusing on personal boundaries or seeking external advice helped them find path forward." 
                    : "⚠️ MODERATE TENSION: Tension appears lower or centered around communication friction. Read shared discussions on Advice Board to see how others navigated similar phases."}
                </p>
              </div>
            </div>
          )}

          {slug === 'will-i-regret' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" /> Perspective Exploration Tool
                </h2>
                <span className="font-mono text-xs text-indigo-400">Self-Reflection</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Choose a situation style below to read shared relationship perspectives:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Your Age Group</label>
                  <select 
                    value={regretAge}
                    onChange={(e) => setRegretAge(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="18-25">18 - 25 years old</option>
                    <option value="26-35">26 - 35 years old</option>
                    <option value="36-50">36 - 50 years old</option>
                    <option value="50+">Over 50 years old</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Relationship Duration</label>
                  <select 
                    value={regretDuration}
                    onChange={(e) => setRegretDuration(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="Under 1 Year">Less than 1 Year</option>
                    <option value="1-2 Years">1 to 2 Years</option>
                    <option value="3-7 Years">3 to 7 Years</option>
                    <option value="8+ Years">8+ Years</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Primary Core Conflict / Concern</label>
                  <select 
                    value={regretReason}
                    onChange={(e) => setRegretReason(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="cheating">Partner cheated (forgiving vs leaving)</option>
                    <option value="kids-mismatch">Kids desire mismatch (one wants, one doesn't)</option>
                    <option value="lack-of-commitment">Partner doesn't want to commit / marry</option>
                    <option value="moving-relocation">Relocating/moving for partner</option>
                  </select>
                </div>
              </div>

              {/* Estimate output block */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3 p-4 bg-[#0D1117]/80 rounded-2xl border border-[#30363D]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Insights Category:</span>
                  <span className="text-xs font-bold text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-400/10 border border-indigo-400/20">{regretProfile.label}</span>
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed pt-2">
                  {regretProfile.advice}
                </p>
              </div>
            </div>
          )}

          {slug === 'red-flags' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" /> Behavioral Pattern Reflection
                </h2>
                <span className="font-mono text-xs text-yellow-500">Reflection Gauge</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Reflect on how frequently these patterns occur in your connection:
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">Emotional isolation / criticism of family/friends</span>
                    <span className="font-mono font-bold text-yellow-400">{ratedFlags.isolation}/10</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={ratedFlags.isolation}
                    onChange={(e) => setRatedFlags(prev => ({ ...prev, isolation: Number(e.target.value) }))}
                    className="w-full accent-yellow-500 cursor-ew-resize bg-[#0D1117] rounded-lg h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">Deflection (making everything your fault when confronted)</span>
                    <span className="font-mono font-bold text-yellow-400">{ratedFlags.deflection}/10</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={ratedFlags.deflection}
                    onChange={(e) => setRatedFlags(prev => ({ ...prev, deflection: Number(e.target.value) }))}
                    className="w-full accent-yellow-500 cursor-ew-resize bg-[#0D1117] rounded-lg h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">Secretive phone habits / hiding chats, logs, or tags</span>
                    <span className="font-mono font-bold text-yellow-400">{ratedFlags.exesControl}/10</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={ratedFlags.exesControl}
                    onChange={(e) => setRatedFlags(prev => ({ ...prev, exesControl: Number(e.target.value) }))}
                    className="w-full accent-yellow-500 cursor-ew-resize bg-[#0D1117] rounded-lg h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">Stonewalling (going completely silent for days as punishment)</span>
                    <span className="font-mono font-bold text-yellow-400">{ratedFlags.stonewalling}/10</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" 
                    value={ratedFlags.stonewalling}
                    onChange={(e) => setRatedFlags(prev => ({ ...prev, stonewalling: Number(e.target.value) }))}
                    className="w-full accent-yellow-500 cursor-ew-resize bg-[#0D1117] rounded-lg h-1.5"
                  />
                </div>
              </div>

              {/* Red flag output block */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Pattern Indicator Score:</span>
                  <span className={`font-mono font-bold text-sm ${redFlagDangerScore >= 50 ? 'text-yellow-500 animate-pulse' : 'text-gray-400'}`}>
                    {redFlagDangerScore}% Pattern Intensity
                  </span>
                </div>
                <div className="relative w-full h-2 rounded-full bg-[#0D1117] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${redFlagDangerScore >= 50 ? 'bg-yellow-500' : 'bg-[#30363D]'}`}
                    style={{ width: `${redFlagDangerScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#0D1117] p-3 rounded-xl border border-[#30363D]/40">
                  {redFlagDangerScore >= 50 
                    ? "⚠️ ELEVATED BEHAVIORAL PATTERNS: High levels of these patterns are frequently highlighted by contributors as challenging for long-term relationship health. Exploring shared stories about boundary-setting could offer solid perspective." 
                    : "✔️ AMBIENT SIGNS: Rated behaviors fall into a moderate range. Continuing open, respectful dialogue and maintaining healthy personal boundaries is always key."}
                </p>
              </div>
            </div>
          )}

          {slug === 'relationship-regrets' && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" /> Relief & Adjustment Stages
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Commonly shared transition phases after a relationship separation:
              </p>

              {/* Visual custom graph mockup using inline HTML bar charts */}
              <div className="space-y-3 bg-[#0D1117]/80 p-5 rounded-2xl border border-[#30363D]/60 font-sans">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Month 1: Separation Shock & Adjustment</span>
                    <span className="text-red-400 font-bold">Intense Transition</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                    <div className="h-full bg-red-400" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Month 3: Silent Grief & Reflections</span>
                    <span className="text-yellow-400 font-bold">Reflective Stage</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '70%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Month 6: Steady Autonomy Breakpoint</span>
                    <span className="text-teal-400 font-bold">Steady Progress</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400" style={{ width: '68%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Year 1+: Rebuilt Independence & Clarity</span>
                    <span className="text-teal-400 font-bold">Rebuilt Clarity</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400" style={{ width: '96%' }} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-xs text-emerald-400 leading-relaxed flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Reflection Consensus:</strong> The initial adjustment period is frequently reported as intense but typically eases over 90 days. Many contributors noted improved clarity and personal growth in the long run.
                </span>
              </div>
            </div>
          )}

          {slug === 'commitment-issues' && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-400" /> Reflection on Commitment & Mismatches
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Perspectives shared by other couples facing lifestyle, timeline, or commitment differences:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0D1117] rounded-2xl border border-[#30363D] space-y-2">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider text-purple-400 font-mono">Ultimatum Outcomes</div>
                  <div className="text-lg font-bold text-white">Complex Tension</div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Many contributors note that ultimatums can sometimes introduce silent tension. Mutual understanding and open communication are highlighted as key.
                  </p>
                </div>

                <div className="p-4 bg-[#0D1117] rounded-2xl border border-[#30363D] space-y-2">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider text-teal-400 font-mono">Taking Conscious Space</div>
                  <div className="text-lg font-bold text-white">Voluntary Clarity</div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Conscious separation for space without pressure often allowed couples to reflect on their alignment and values in a calmer light.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-[#0D1117] p-3 rounded-xl border border-[#30363D]/40">
                💡 <strong>Reflection Tip:</strong> Maintaining your personal goals, independence, and boundaries is a healthy way to approach commitment discussions with a partner.
              </p>
            </div>
          )}

        </div>

        {/* Right Side: Informative / Context / Sidebar */}
        <div className="lg:col-span-5 space-y-6">

          <div className="bg-[#161B22] border border-[#30363D] p-6 rounded-3xl space-y-4 text-center">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HelpCircle className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Have a unique personal dilemma?</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Submit your situation anonymously and secure citizen jury deliberation on our relationship court.
            </p>
            <button 
              onClick={() => setScreen({ type: 'court_list' })}
              className="w-full bg-[#1F6FEB] hover:bg-[#388BFD] text-white rounded-xl py-2 px-3 text-xs font-semibold cursor-pointer transition-all duration-200"
            >
              Submit to Peer Jury Court ➔
            </button>
          </div>
        </div>

      </div>

      {/* 3. RETRIEVE RELEVANT REAL STORIES & CASES DYNAMIC SECTIONS */}
      <div className="space-y-6 pt-6">
        <h2 className="text-xl sm:text-2xl font-black text-[#000000] flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#F4B942]" /> Real Outcome Dossiers & Verified Timelines
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.slice(0, 3).map((st) => (
            <div 
              key={st.id}
              className="bg-[#161B22] border border-[#30363D] p-5 sm:p-6 rounded-3xl hover:border-[#4F8CFF] transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {st.decisionMade === 'Stayed' ? 'Stayed' : 'Left'} • {st.relationshipDuration}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{st.country}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                  {st.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {st.fullStory}
                </p>
              </div>

              <button
                onClick={() => setScreen({ type: 'regret_stories', slug: st.id })}
                className="w-full py-2 bg-[#21262D] hover:bg-[#30363D] text-white border border-[#30363D] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Read Full Story Timeline</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ACTIVE COMMUNITY RELATIONSHIP JURY TRIALS GRID */}
      {courtCases.length > 0 && (
        <div className="space-y-6 pt-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#000000] flex items-center gap-2">
            <Gavel className="h-6 w-6 text-yellow-500" /> Active Relationships Under Citizen Deliberation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courtCases.slice(0, 4).map((cCase, idx) => {
              let bgClass = "bg-[#161B22]/60";
              if (idx === 0) bgClass = "bg-[#000000]";
              else if (idx === 1) bgClass = "bg-[#000000]";
              else if (idx === 2) bgClass = "bg-[#101010]";
              else if (idx === 3) bgClass = "bg-[#050505]";
              
              return (
                <div 
                  key={cCase.slug}
                  className={`${bgClass} border border-[#30363D]/80 p-5 rounded-3xl hover:border-yellow-500/30 transition-all flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-500">{cCase.caseNumber || 'CASE-X'}</span>
                      <span className="inline-flex items-center gap-1 text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/5 font-mono text-[10px]">
                        <Clock className="h-3 w-3" /> Active Trial
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">{cCase.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{cCase.description}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#30363D]/40 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-mono">
                      🗳️ {cCase.arguments?.length || 0} community testimonies Filed
                    </span>
                    <button 
                      onClick={() => setScreen({ type: 'court', slug: cCase.slug })}
                      className="flex items-center gap-1 font-bold text-xs text-[#4F8CFF] hover:underline cursor-pointer"
                    >
                      <span>Cast Citizen Verdict</span> 
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. COMMUNITY ADVICE DEBATES */}
      {questions.length > 0 && (
        <div className="space-y-6 pt-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#000000] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-400" /> Advice Debates answered by Seasoned Survivors
          </h2>

          <div className="bg-[#161B22] border border-[#30363D] divide-y divide-[#30363D]/60 rounded-3xl overflow-hidden shadow-md">
            {questions.slice(0, 3).map((q) => (
              <div 
                key={q.slug}
                onClick={() => setScreen({ type: 'question', slug: q.slug })}
                className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#21262D]/30 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[purple] bg-purple-500/10 px-1.5 py-0.5 rounded text-purple-400 border border-purple-500/20">
                    {q.category}
                  </span>
                  <h3 className="text-sm font-bold text-white transition-all hover:text-[#4F8CFF]">{q.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1">{q.description}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto font-mono text-xs text-gray-500">
                  <span>💬 {q.answers?.length || 0} veteran perspectives</span>
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
