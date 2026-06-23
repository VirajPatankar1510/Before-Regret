import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Sparkles, FileText, AlertCircle, RefreshCw, Calendar, Eye, Heart, ShieldCheck } from 'lucide-react';
import { Story, TimelineNode } from '../types';
import { PRESEEDED_RELATIONSHIP_PROBLEMS, RelationshipProblem } from '../data/relationshipProblems';
import { fetchRelationshipProblemsFromFirestore } from '../lib/firestoreService';

export interface SituationOption {
  category: string; // The popular search text option
  slug: string; // The slug corresponding with the predefined situation
  name: string; // The readable display name
  listCategory: 'Cheating' | 'Marriage' | 'Long Distance' | 'Children & Family' | 'Careers & Moving' | 'Ultimatums' | 'Red Flags';
}

export const SITUATION_OPTIONS: SituationOption[] = [
  {
    category: "Stayed after cheating",
    slug: "stayed-after-cheating",
    name: "Stayed After Cheating",
    listCategory: "Cheating"
  },
  {
    category: "Long distance relationship",
    slug: "long-distance-relationship",
    name: "Long Distance Relationship",
    listCategory: "Long Distance"
  },
  {
    category: "Partner doesn't want kids",
    slug: "partner-doesnt-want-kids",
    name: "Partner Doesn't Want Kids",
    listCategory: "Children & Family"
  },
  {
    category: "Different religion marriage",
    slug: "different-religion-marriage",
    name: "Different Religion Marriage",
    listCategory: "Marriage"
  },
  {
    category: "Marriage ultimatum",
    slug: "marriage-ultimatum",
    name: "Marriage Ultimatum",
    listCategory: "Ultimatums"
  },
  {
    category: "Moved for love",
    slug: "moved-for-love",
    name: "Moved For Love",
    listCategory: "Careers & Moving"
  },
  {
    category: "Ignored red flags",
    slug: "ignored-red-flags",
    name: "Ignored Red Flags",
    listCategory: "Red Flags"
  },
  {
    category: "Boyfriend doesn't want marriage",
    slug: "boyfriend-doesnt-want-marriage",
    name: "Boyfriend Doesn't Want Marriage",
    listCategory: "Marriage"
  },
  {
    category: "Other relationship issue",
    slug: "custom-situation",
    name: "Other Custom Issue",
    listCategory: "Marriage"
  }
];

interface SubmitStoryFormProps {
  onClose: () => void;
  onSubmit: (story: Story) => void;
}

export default function SubmitStoryForm({ onClose, onSubmit }: SubmitStoryFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [situationCategory, setSituationCategory] = useState('Stayed after cheating');
  const [customSituation, setCustomSituation] = useState('');
  const [age, setAge] = useState<number>(26);
  const [country, setCountry] = useState('United States');
  const [gender, setGender] = useState('Female');
  const [regretType, setRegretType] = useState<'Past' | 'Current'>('Past');
  const [relationshipDuration, setRelationshipDuration] = useState('3 Years');
  const [decisionMade, setDecisionMade] = useState<'Stayed' | 'Left' | 'Married' | 'Moved Together' | 'Other'>('Left');
  const [currentOutcome, setCurrentOutcome] = useState<'Still Together' | 'Married' | 'Engaged' | 'Separated' | 'Divorced' | 'Complicated'>('Separated');
  const [regretScore, setRegretScore] = useState<number>(7);
  const [wouldDoAgain, setWouldDoAgain] = useState<'Yes' | 'No' | 'Not Sure'>('No');
  const [title, setTitle] = useState('');
  const [fullStory, setFullStory] = useState('');
  const [anonymousUsername, setAnonymousUsername] = useState('');

  // Dynamic Relationship Problems state
  const [relationshipProblems, setRelationshipProblems] = useState<RelationshipProblem[]>(PRESEEDED_RELATIONSHIP_PROBLEMS);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('ghosting');

  React.useEffect(() => {
    fetchRelationshipProblemsFromFirestore().then(list => {
      if (list && list.length > 0) {
        setRelationshipProblems(list);
      }
    }).catch(err => {
      console.error("Failed to load custom relationship problems, using fallbacks:", err);
    });
  }, []);

  const selectedProblem = relationshipProblems.find(p => p.id === selectedSubCategoryId);

  // Auto-generate a secure anonymous survivor moniker
  const rollAnonymousName = () => {
    const prefixes = ["silent", "weary", "brave", "healed", "watchful", "soaring", "glistening", "patient", "thoughtful", "shattered", "resolute", "hidden"];
    const suffixes = ["wanderer", "soul", "heart", "expert", "observer", "survivor", "glass", "anchor", "pioneer", "mind", "beacon", "witness"];
    const pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setAnonymousUsername(`${pre}_${suf}_${num}`);
  };

  React.useEffect(() => {
    rollAnonymousName();
  }, []);

  const totalSteps = 6;
  const progressPercent = Math.min(100, Math.floor(((step - 1) / (totalSteps - 1)) * 100));

  const handleNext = () => {
    if (step === 5) {
      if (fullStory.trim().length < 100) {
        alert("Please expand your story narrative to at least 100 characters so peers can learn from your experience.");
        return;
      }
      if (!title.trim()) {
        alert("Please provide a summary title.");
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (fullStory.trim().length < 100) {
      alert("Please expand your story narrative to at least 100 characters so peers can learn from your experience.");
      setStep(5);
      return;
    }

    if (!title.trim()) {
      alert("Please provide a summary title.");
      setStep(5);
      return;
    }

    // Build timeline milestones dynamically/automatically
    const startYear = (2026 - parseInt(relationshipDuration || '3') - 1).toString();
    const decisionYear = (2026 - 1).toString();
    const resolveYear = "2026";

    const customTimeline: TimelineNode[] = regretType === 'Current' ? [
      { year: startYear, stage: "Situation Triggered", description: `Began navigating ${situationCategory} complications` },
      { year: decisionYear, stage: "Action Enacted", description: `Enacted choice: ${decisionMade}` },
      { year: resolveYear, stage: "Active Ongoing Distress", description: `Current ongoing state evaluated as ${currentOutcome} with active regrets` }
    ] : [
      { year: startYear, stage: "Situation Started", description: `Began navigating the relationship dynamic` },
      { year: decisionYear, stage: "Decision Enacted", description: `Made choice: ${decisionMade}` },
      { year: resolveYear, stage: "Definitive Outcome", description: `Resolved to current final state: ${currentOutcome}` }
    ];

    const newStory: Story = {
      id: 'usr_' + Date.now().toString(),
      title: title.trim(),
      situationSlug: (() => {
        if (customSituation.trim()) {
          return customSituation.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        }
        if (situationCategory === "Other relationship issue") {
          return selectedSubCategoryId;
        }
        const opt = SITUATION_OPTIONS.find(o => o.category === situationCategory);
        return opt ? opt.slug : 'custom-situation';
      })(),
      situationName: (() => {
        if (customSituation.trim()) return customSituation.trim();
        if (situationCategory === "Other relationship issue") {
          return selectedProblem ? selectedProblem.name : "Other Custom Issue";
        }
        const opt = SITUATION_OPTIONS.find(o => o.category === situationCategory);
        return opt ? opt.name : `Dealing with ${situationCategory}`;
      })(),
      age,
      gender,
      country,
      relationshipDuration,
      decisionMade,
      currentOutcome,
      regretScore,
      regretType,
      wouldDoAgain,
      fullStory: fullStory.trim(),
      timeline: customTimeline,
      userName: anonymousUsername || "anonymous_user",
      helpfulVotes: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      updates: [],
      tags: [
        (() => {
          const opt = SITUATION_OPTIONS.find(o => o.category === situationCategory);
          return opt ? opt.listCategory.toLowerCase() : 'marriage';
        })(),
        decisionMade.toLowerCase(),
        currentOutcome.toLowerCase(),
        regretType.toLowerCase() + '-regret',
        ...(situationCategory === "Other relationship issue" ? [
          "other-relationship-issue",
          selectedSubCategoryId,
          ...(selectedProblem ? [selectedProblem.name.toLowerCase()] : []),
          ...(selectedProblem ? selectedProblem.keywords.map(kw => kw.toLowerCase()) : [])
        ] : [])
      ]
    };

    onSubmit(newStory);
    setIsSubmitted(true);
  };

  return (
    <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-2xl relative text-zinc-300">
      {isSubmitted ? (
        <div className="space-y-6 animate-fadeIn text-center py-6">
          <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-2">
            <Check className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">Successfully submitted.</h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mt-2.5">
              Thank you for sharing your experience. Your story has been saved anonymously to the public registry, serving as a beacon of wisdom for others.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all uppercase tracking-wider"
            >
              Close Window
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stepper Header */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#4F8CFF] font-mono">Step {step} of {totalSteps}</span>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 font-serif">
                <Sparkles className="h-4 w-4 text-[#F4B942]" /> Share Regret Story
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white hover:bg-[#30363D] h-7 w-7 rounded-full flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          {/* Progress Track */}
          <div className="relative h-1.5 w-full bg-[#30363D] rounded-full overflow-hidden mb-6">
            <div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#4F8CFF] to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

      {/* Render Steps */}
      <div className="min-h-[350px] flex flex-col justify-between">
        
        <div className="py-2">
          
          {/* STEP 1: Category & Custom Label */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#4F8CFF]" /> What describes the core relationship situation category?
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1">Select the most accurate categorization for the regret directory.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SITUATION_OPTIONS.map(opt => (
                  <button
                    key={opt.category}
                    type="button"
                    onClick={() => {
                      setSituationCategory(opt.category);
                      if (opt.slug !== 'custom-situation') {
                        setCustomSituation('');
                      }
                    }}
                    className={`rounded-xl border p-2 text-left text-[11px] font-semibold block leading-tight transition-all cursor-pointer ${
                      situationCategory === opt.category ? 'bg-[#4F8CFF]/15 border-[#4F8CFF] text-white' : 'bg-[#0D1117] border-[#30363D] text-[#AAB2C0] hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {opt.category}
                  </button>
                ))}
              </div>
              
              {/* Dropdown for custom relationship problems options */}
              {situationCategory === "Other relationship issue" && (
                <div className="space-y-2 bg-[#0D1117] border border-[#30363D] p-3 rounded-xl animate-fadeIn text-left">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">
                    Choose Specific Relationship Issue Option:
                  </label>
                  <select
                    value={selectedSubCategoryId}
                    onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-[#30363D] bg-[#161B22] p-2 text-xs text-white focus:border-[#4F8CFF] focus:outline-none font-semibold cursor-pointer"
                  >
                    {relationshipProblems.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {selectedProblem && (
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1">
                      {selectedProblem.description}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1 pt-1">
                <label className="text-[10px] text-[#AAB2C0] font-bold block">Optional: Define custom concise situation name:</label>
                <input
                  type="text"
                  placeholder="e.g., Husband didn't want children, Husband walked off of family..."
                  value={customSituation}
                  onChange={(e) => setCustomSituation(e.target.value)}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#4F8CFF] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Demographics (Age, Gender, Location) COMBINED */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">Your Demographic Context</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Providing these matches helps comparable peers filter outcomes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Age Range Slider */}
                <div className="space-y-2 bg-[#0D1117] border border-[#30363D] p-3 rounded-xl">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">My Age at Situation: <span className="text-[#4F8CFF]">{age} years</span></label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="18"
                      max="80"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="flex-1 accent-[#4F8CFF]"
                    />
                  </div>
                </div>

                {/* Country Option Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">Relationship Location:</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2.5 text-xs text-white focus:border-[#4F8CFF] focus:outline-none font-bold"
                  >
                    {[
                      "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", 
                      "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", 
                      "Indonesia", "Ireland", "Italy", "Japan", "Malaysia", "Mexico", "Netherlands", 
                      "New Zealand", "Norway", "Philippines", "Poland", "Portugal", "Saudi Arabia", "Singapore", 
                      "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", 
                      "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Other"
                    ].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender Identity Select button list */}
              <div className="space-y-1.5 bg-[#0D1117] border border-[#30363D] p-3 rounded-xl">
                <label className="text-[11px] font-bold text-[#AAB2C0] block">My Gender Identity:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Female', 'Male', 'Non-Binary'].map(gen => (
                    <button
                      key={gen}
                      type="button"
                      onClick={() => setGender(gen)}
                      className={`rounded-xl border py-2 text-center text-xs font-semibold block transition-colors cursor-pointer ${
                        gender === gen ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-[#161B22] border-[#30363D] text-[#AAB2C0] hover:text-white'
                      }`}
                    >
                      {gen}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Regret Type and Temporal Duration COMBINED */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#F4B942]" /> Temporal & Decisional Stage
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Pinpoint whether the pain layer is active/ongoing or a retrospective completed memory.</p>
              </div>

              {/* Regret Type Toggle Past vs. Current */}
              <div className="bg-[#0D1117] border border-[#30363D] p-3 rounded-xl space-y-2">
                <label className="text-[11px] font-bold text-[#AAB2C0] block">What is the nature of this regret?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegretType('Past')}
                    className={`rounded-xl border p-3 text-left transition-all relative cursor-pointer ${
                      regretType === 'Past' 
                        ? 'border-cyan-500 bg-cyan-950/15 text-white' 
                        : 'border-[#30363D] bg-[#161B22] text-zinc-400'
                    }`}
                  >
                    <div className="font-extrabold text-xs">Past Regret</div>
                    <div className="text-[9px] mt-0.5 text-zinc-400">Reflecting on a completed relationship story.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegretType('Current')}
                    className={`rounded-xl border p-3 text-left transition-all relative cursor-pointer ${
                      regretType === 'Current' 
                        ? 'border-rose-500 bg-rose-950/15 text-white' 
                        : 'border-[#30363D] bg-[#161B22] text-zinc-400'
                    }`}
                  >
                    <div className="font-extrabold text-xs">Current Regret</div>
                    <div className="text-[9px] mt-0.5 text-zinc-400 font-medium">Actively navigating unresolved ongoing distress.</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Duration select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">
                    {regretType === 'Current' ? 'Ongoing Duration since trigger:' : 'Total Duration relationship lasted:'}
                  </label>
                  <select
                    value={relationshipDuration}
                    onChange={(e) => setRelationshipDuration(e.target.value)}
                    className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2 text-xs text-white focus:border-[#4F8CFF] font-semibold"
                  >
                    {['Less than 1 Year', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years', '10 Years', '15+ Years'].map(dur => (
                      <option key={dur} value={dur}>{dur}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Decisional Option */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">Enacted Decision Option:</label>
                  <select
                    value={decisionMade}
                    onChange={(e) => setDecisionMade(e.target.value as any)}
                    className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2 text-xs text-white focus:border-indigo-500 font-semibold"
                  >
                    <option value="Left">Left (Broke up, walked off, divorced)</option>
                    <option value="Stayed">Stayed (Trying to fix, wait or adapt)</option>
                    <option value="Married">Married (Formally signed union)</option>
                    <option value="Moved Together">Moved Together (Co-housing relocations)</option>
                    <option value="Other">Other active decisions</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: Outcome & Regret Intensity COMBINED */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-[#2E7D32]" /> Outcome Evaluation & Regret Meter
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Provide details on where things stand today and the depth of hindsight distress.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Today's state state */}
                <div className="space-y-1 bg-[#0D1117] border border-[#30363D] p-2 rounded-xl">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">Current state status today Change:</label>
                  <select
                    value={currentOutcome}
                    onChange={(e) => setCurrentOutcome(e.target.value as any)}
                    className="w-full bg-[#161B22] border border-[#30363D] rounded-lg p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Separated">Separated (Broken Up)</option>
                    <option value="Still Together">Still Unmarried Together</option>
                    <option value="Married">Happily or Resentfully Married</option>
                    <option value="Engaged">Engaged / Contracted</option>
                    <option value="Divorced">Formally Divorced</option>
                    <option value="Complicated">Ongoing complex state</option>
                  </select>
                </div>

                {/* Did You Replay Analysis */}
                <div className="space-y-1 bg-[#0D1117] border border-[#30363D] p-2 rounded-xl">
                  <label className="text-[11px] font-bold text-[#AAB2C0] block">Would you do it again in replay?</label>
                  <div className="grid grid-cols-3 gap-1 pt-1.5">
                    {['Yes', 'No', 'Not Sure'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWouldDoAgain(opt as any)}
                        className={`rounded-lg border py-1.5 text-center text-[10px] font-bold cursor-pointer ${
                          wouldDoAgain === opt ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-[#161B22] border-[#30363D] text-zinc-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Regret Level Slider scale */}
              <div className="bg-[#0E131B] border border-zinc-800 p-3 rounded-2xl text-center space-y-2">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[11px] font-bold text-[#AAB2C0]">Regret Pain Index</span>
                  <div className="text-xl font-black text-[#FF5D5D] font-mono">
                    {regretScore} <span className="text-[11px] text-zinc-500">/ 10</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#2E7D32] font-semibold font-mono">1 (Insignificant)</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={regretScore}
                    onChange={(e) => setRegretScore(Number(e.target.value))}
                    className="flex-1 accent-red-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-[#FF5D5D] font-semibold font-mono">10 (Excruciating)</span>
                </div>
                <p className="text-[10px] text-zinc-400 italic">
                  {regretScore <= 3 ? "😊 Little to no regrets. You stand confident in your steps." :
                   regretScore <= 6 ? "😐 Moderate regrets. Some nostalgia or 'what-if' thoughts remain." :
                   "💔 Extreme regrets. You deeply wish you took a different path."}
                </p>
              </div>

            </div>
          )}

          {/* STEP 5: Narrative details */}
          {step === 5 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Story Narrative & Advice</h3>
                  <p className="text-[10px] text-zinc-400">Share warning flags, family impacts or crucial takeaways for comparable peers.</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${fullStory.trim().length >= 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-[#FF5D5D]'}`}>
                  {fullStory.trim().length} / 100 characters min
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Summarize your situation decision outcome in one raw line..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2.5 text-xs text-white placeholder-zinc-500 font-bold focus:border-[#4F8CFF] focus:outline-none"
                  required
                />

                <textarea
                  placeholder="Tell your story. What triggered the friction? What decision did you make? What was the immediate response from family, partner, or kids? What has been the most painful regret?"
                  value={fullStory}
                  onChange={(e) => setFullStory(e.target.value)}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-xs text-white placeholder-zinc-500 focus:border-[#4F8CFF] focus:outline-none min-h-[140px] font-serif leading-relaxed"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 6: Fully Anonymous & Secured */}
          {step === 6 && (
            <div className="space-y-4 animate-fadeIn text-center py-2">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 font-sans">
                <ShieldCheck className="h-4 w-4 text-[#4F8CFF]" /> Complete Privacy Shield
              </h3>
              <p className="text-[11px] text-[#AAB2C0] max-w-sm mx-auto leading-relaxed">
                BeforeRegret keeps you completely anonymous. We never track your cookies, IP address, or personal email. Your story is published safely under the random alias below.
              </p>

              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto pt-1 bg-[#0D1117] p-1 rounded-2xl border border-[#30363D]">
                <div className="flex-1 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-indigo-300">
                  @{anonymousUsername}
                </div>
                <button
                  type="button"
                  onClick={rollAnonymousName}
                  className="p-2 rounded-xl border border-[#30363D] bg-[#161B22] hover:border-white text-[#AAB2C0] cursor-pointer hover:text-white"
                  title="Generate another handle"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3 max-w-sm mx-auto text-[10px] text-zinc-400 font-semibold italic">
                "By clicking Publish, I commit this raw outcome ledger transparently to guide and safeguard other partners facing comparable constraints."
              </div>
            </div>
          )}

        </div>

        {/* Stepper Navigation Buttons footer */}
        <div className="mt-6 pt-4 border-t border-[#30363D] flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-[#30363D] ${
              step === 1 ? 'opacity-30 cursor-not-allowed text-[#AAB2C0]' : 'text-white hover:bg-[#30363D] cursor-pointer'
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-5 py-2.5 text-xs font-black text-white shadow-lg cursor-pointer"
            >
              Publish Anonymously <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

      </div>

    </>
    )}
    </div>
  );
}
