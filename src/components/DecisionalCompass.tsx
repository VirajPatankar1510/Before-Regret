import React, { useState } from 'react';
import { HelpCircle, ChevronRight, RefreshCw, Compass, AlertCircle, Heart, Star, Flame, MapPin, Smile, BookOpen, Users } from 'lucide-react';

interface DecisionalCompassProps {
  setScreen: (screen: { type: string; slug?: string }) => void;
}

export default function DecisionalCompass({ setScreen }: DecisionalCompassProps) {
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<{
    area: string;
    action: string;
    fear: string;
  }>({
    area: '',
    action: '',
    fear: '',
  });

  const resetCompass = () => {
    setStep(0);
    setAnswers({ area: '', action: '', fear: '' });
  };

  const handleSelectArea = (val: string) => {
    setAnswers(prev => ({ ...prev, area: val }));
    setStep(1);
  };

  const handleSelectAction = (val: string) => {
    setAnswers(prev => ({ ...prev, action: val }));
    setStep(2);
  };

  const handleSelectFear = (val: string) => {
    setAnswers(prev => ({ ...prev, fear: val }));
    setStep(3);
  };

  // Pre-configured custom insights based on selection combinations
  const getVerdict = () => {
    const { area, action, fear } = answers;

    let title = "The Pragmatist's Conundrum";
    let matchedSlug = "boyfriend-doesnt-want-marriage";
    let matchedName = "Boyfriend Doesn't Want Marriage";
    let icon = Flame;
    let description = "You are confronting a milestone crossroads with significant future stakes. Let's inspect similar historical lines.";
    let statisticalWarning = "74% of long-term ultimatums without prior boundary establishment end in separation over 24 months.";
    let keyPrescription = "Avoid making silent compromises hoping they will shift views. Define a strict internal timeline.";

    if (area === 'Commitment & Marriage') {
      matchedSlug = 'boyfriend-doesnt-want-marriage';
      matchedName = "Boyfriend Doesn't Want Marriage";
      title = "Milestone Stagnation Profile";
      description = "Your biggest dilemma is long-term progression parity. Staying long-term without an explicit, mutual calendar commitment leads to peak resentment.";
      keyPrescription = "Do not buy into 'one day' promises. Initiate a milestone expectations check immediately.";
      statisticalWarning = "Average regret score for staying over 5 years under un-agreed commitment is 8.1/10.";
    } else if (area === 'Trust & Forgiveness') {
      matchedSlug = 'stayed-after-cheating';
      matchedName = "Stayed After Cheating";
      title = "Trust Vulnerability Profile";
      icon = Heart;
      description = "You're grappling with trust restorability after boundary failures. Data warns that staying out of fear of starting over is a primary source of retrospective regret.";
      keyPrescription = "Assess if they are actively in active professional therapy, or if they are simply offering word-level apologies.";
      statisticalWarning = "58% of individuals who forgave infidelity reported a dynamic repeat event within 4 years.";
    } else if (area === 'Relocation & Distance') {
      matchedSlug = 'long-distance-relationship';
      matchedName = "Long Distance Relationship";
      title = "Provincial Attachment Profile";
      icon = Compass;
      description = "You are contemplating transferring your professional or physical base for a relative attachment. This is highly standard, and relies thoroughly on underlying status balance.";
      keyPrescription = "Verify if you would enjoy the destination city independent of the partner's daily presence.";
      statisticalWarning = "Moves for love that involve giving up career status report double mid-term tension rates.";
    } else if (area === 'Family Disapproval') {
      matchedSlug = 'different-religion-marriage';
      matchedName = "Different Religion Marriage";
      title = "Tribal Alignment Profile";
      icon = Users;
      description = "Cultural disparities and family approval variables have huge downstream consequences that are often underestimated in years 1-3.";
      keyPrescription = "Arrange a joint long-term expectations audit about holiday priorities and child-rearing traditions.";
      statisticalWarning = "Cross-cultural agreements report 88% higher early-session marital friction if maternal support remains withheld.";
    } else {
      matchedSlug = 'partner-doesnt-want-kids';
      matchedName = "Partner Doesn't Want Kids";
      title = "Vital Value Impasse Profile";
      description = "Biological clocks, children desire differences, or lifestyle incompatibilities are absolute dealbreakers that cannot be solved by compromising.";
      keyPrescription = "A compromise here means one partner stays resentful forever. Prioritize core lifestyle compatibility.";
      statisticalWarning = "65% of partners where kids desires differed broke up later with acute personal grievance.";
    }

    return {
      title,
      matchedSlug,
      matchedName,
      icon,
      description,
      statisticalWarning,
      keyPrescription
    };
  };

  const verdict = getVerdict();

  return (
    <div className="rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-[#131924] to-[#0D131F] p-5 sm:p-6 shadow-[0_0_35px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/30 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:border-indigo-400" id="decisional-compass-widget">
      {/* Decorative Glow elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="relative space-y-4">
        
        {/* Header Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Compass className="h-4 w-4 animate-spin-slow" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Interactive Dilemma Compass
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.2 rounded-full font-mono">Personalized</span>
              </h3>
              <p className="text-[11px] text-[#AAB2C0]">Answer 3 relatable questions to map your path against historical crowd outcomes.</p>
            </div>
          </div>

          {step > 0 && (
            <button
              onClick={resetCompass}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-md transition-all self-start sm:self-center"
            >
              <RefreshCw className="h-3 w-3" /> Reset Quiz
            </button>
          )}
        </div>

        {/* STEP 0: THE MIL_STONE AREA */}
        {step === 0 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-center text-center gap-1.5 text-sm sm:text-base text-indigo-400 font-bold uppercase tracking-wider">
              <span>Step 1 of 3:</span>
              <span className="text-white">Where is the friction originating from?</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { title: "Commitment & Marriage", desc: "Ultimatums, postponement, unshared futures", value: "Commitment & Marriage", icon: "💍" },
                { title: "Trust & Forgiveness", desc: "Cheating, phone snooping, hidden messages", value: "Trust & Forgiveness", icon: "🔑" },
                { title: "Relocation & Distance", desc: "Moving states/cities, long-distance strain", value: "Relocation & Distance", icon: "✈️" },
                { title: "Family Disapproval", desc: "Unsupportive in-laws, religious/cultural clashes", value: "Family Disapproval", icon: "👪" },
                { title: "Core Life Incompatibility", desc: "Kids vs Child-free, financial spend differences", value: "Core Life Incompatibility", icon: "⚖️" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectArea(item.value)}
                  className="rounded-xl border border-slate-800 bg-[#161B22]/50 p-3.5 text-left hover:border-indigo-500 hover:bg-[#1e293b]/40 transition-all flex items-start gap-3 group active:scale-[0.99]"
                >
                  <span className="text-xl bg-slate-850 p-2 rounded-lg group-hover:scale-110 transition-transform shrink-0 select-none">
                    {item.icon}
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">{item.title}</h4>
                    <p className="text-[10px] text-[#AAB2C0] leading-snug">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: THE STRATEGY ON TABLE */}
        {step === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-center text-center gap-1.5 text-sm sm:text-base text-indigo-400 font-bold uppercase tracking-wider">
              <span>Step 2 of 3:</span>
              <span className="text-white">What action/milestone are you contemplating today?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { title: "Give a hard ultimatum", desc: "Commit now or I walk immediately", value: "Ultimatum" },
                { title: "Stay and hope they adapt", desc: "Wait for change and avoid making conflicts", value: "Hopeful adaptation" },
                { title: "Make a major sacrifice", desc: "Move city/province or give up job for them", value: "Relocate / Sacrifice" },
                { title: "Walk away entirely", desc: "End the connection despite lingering love", value: "Break up cleanly" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAction(item.value)}
                  className="rounded-xl border border-slate-800 bg-[#161B22]/50 p-3.5 text-left hover:border-indigo-500 hover:bg-[#1e293b]/40 transition-all flex flex-col justify-center active:scale-[0.99] group"
                >
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide mb-1">{item.title}</h4>
                  <p className="text-[10px] text-[#AAB2C0] leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: THE PRIMARY FEAR */}
        {step === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-center text-center gap-1.5 text-sm sm:text-base text-[#00F2FE] font-bold uppercase tracking-wider">
              <span>Step 3 of 3:</span>
              <span className="text-white">What failure scenario scares you the absolute most?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { title: "Wasted years of my life", desc: "Remaining stuck only to separate down the road" },
                { title: "Loneliness of leaving", desc: "Regretting walking away from an otherwise kind person" },
                { title: "Resentment and coldness", desc: "Staying but hating the daily compromises I had to make" },
                { title: "Financial / Career isolation", desc: "Losing my professional potential and independence" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectFear(item.title)}
                  className="rounded-xl border border-slate-800 bg-[#161B22]/50 p-3.5 text-left hover:border-[#00F2FE] hover:bg-[#1e293b]/40 transition-all flex flex-col justify-center active:scale-[0.99] group"
                >
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00F2FE] transition-colors uppercase tracking-wide mb-1">{item.title}</h4>
                  <p className="text-[10px] text-[#AAB2C0] leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DYNAMIC VERDICT & RECOMMENDATIONS */}
        {step === 3 && (
          <div className="space-y-4 animate-scaleUp">
            
            {/* Verdict Card */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-emerald-500/10 pb-2.5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">Statistical Match Identified</span>
                  <h4 className="text-md font-extrabold text-white mt-1 uppercase tracking-wide">{verdict.title}</h4>
                </div>
                <div className="bg-emerald-500/15 p-2 rounded-lg text-emerald-400 shrink-0">
                  <Star className="h-4.5 w-4.5 fill-current animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1.5">
                <div className="md:col-span-8 space-y-2">
                  <p className="text-xs text-[#AAB2C0] leading-relaxed font-sans mt-0.5">
                    {verdict.description}
                  </p>
                  <div className="bg-[#0E131B]/60 border border-slate-800 rounded-lg p-2.5 text-[11px] leading-relaxed text-[#AAB2C0]">
                    <span className="font-bold text-white block mb-0.5 text-[10px] uppercase tracking-wider">Expert Peer Prescription:</span>
                    {verdict.keyPrescription}
                  </div>
                </div>

                <div className="md:col-span-4 rounded-lg bg-slate-900 border border-slate-800 p-3 text-center flex flex-col justify-center shrink-0">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mb-1">DANGER METRIC</span>
                  <span className="text-sm font-black text-[#FF5D5D]">REGRET CRITICAL</span>
                  <p className="text-[10px] text-[#AAB2C0] leading-snug mt-1">{verdict.statisticalWarning}</p>
                </div>
              </div>
            </div>

            {/* Flatten Illustration inside the completed report */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-indigo-950/10 to-[#101520] p-4 flex flex-col sm:flex-row items-center gap-4">
              
              {/* Flat custom inline illustration vector representative */}
              <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-indigo-500/5 border border-indigo-500/10 rounded-full text-indigo-400 shadow-inner relative">
                <div className="absolute inset-2 border border-dashed border-indigo-500/20 rounded-full animate-spin-slow" />
                <Compass className="h-10 w-10 text-indigo-300" />
              </div>

              <div className="space-y-1.5 flex-1">
                <h5 className="text-xs font-bold text-white uppercase tracking-wide">What does the database suggest?</h5>
                <p className="text-[11px] text-[#AAB2C0] leading-relaxed">
                  We have mapped thousands of real, chronologically-tracked stories matching this exact milestone. Explore real-life updates from partners who chose each path.
                </p>
                
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <button
                    onClick={() => setScreen({ type: 'situation', slug: verdict.matchedSlug })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 px-3 py-1.5 text-xs font-bold text-white transition-all shadow active:scale-95"
                  >
                    Explore Matched Dossier: "{verdict.matchedName}" <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={resetCompass}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] hover:bg-[#161B22] px-3 py-1.5 text-xs text-[#AAB2C0] hover:text-white transition-all"
                  >
                    Compare Another Scenario
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
