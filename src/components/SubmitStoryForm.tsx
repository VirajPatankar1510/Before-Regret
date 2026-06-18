import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Sparkles, HelpCircle, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { Story, TimelineNode } from '../types';

interface SubmitStoryFormProps {
  onClose: () => void;
  onSubmit: (story: Story) => void;
}

export default function SubmitStoryForm({ onClose, onSubmit }: SubmitStoryFormProps) {
  const [step, setStep] = useState(1);

  // Form State
  const [situationCategory, setSituationCategory] = useState('Marriage');
  const [customSituation, setCustomSituation] = useState('');
  const [age, setAge] = useState<number>(26);
  const [country, setCountry] = useState('United States');
  const [gender, setGender] = useState('Female');
  const [relationshipDuration, setRelationshipDuration] = useState('3 Years');
  const [decisionMade, setDecisionMade] = useState<'Stayed' | 'Left' | 'Married' | 'Moved Together' | 'Other'>('Left');
  const [currentOutcome, setCurrentOutcome] = useState<'Still Together' | 'Married' | 'Engaged' | 'Separated' | 'Divorced' | 'Complicated'>('Separated');
  const [regretScore, setRegretScore] = useState<number>(7);
  const [wouldDoAgain, setWouldDoAgain] = useState<'Yes' | 'No' | 'Not Sure'>('No');
  const [title, setTitle] = useState('');
  const [fullStory, setFullStory] = useState('');
  const [anonymousUsername, setAnonymousUsername] = useState('');

  // Auto-generate a fun secure anonymous name
  const rollAnonymousName = () => {
    const prefixes = ["silent", "weary", "brave", "healed", "watchful", "soaring", "glistening", "patient", "thoughtful", "shattered"];
    const suffixes = ["wanderer", "soul", "heart", "expert", "observer", "survivor", "glass", "anchor", "pioneer", "mind"];
    const pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setAnonymousUsername(`${pre}_${suf}_${num}`);
  };

  React.useEffect(() => {
    rollAnonymousName();
  }, []);

  const totalSteps = 10;
  const progressPercent = Math.min(100, Math.floor(((step - 1) / (totalSteps - 1)) * 100));

  const handleNext = () => {
    if (step === 9) {
      if (fullStory.trim().length < 100) {
        alert("Please expand your story narrative to at least 100 characters to ensure other users learn from your outcomes.");
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

    // Custom Validation bounds
    if (fullStory.trim().length < 100) {
      alert("Please expand your story narrative to at least 100 characters to ensure other users learn from your outcomes.");
      setStep(9);
      return;
    }

    if (!title.trim()) {
      alert("Please provide a summary title.");
      setStep(9);
      return;
    }

    // Build timeline milestones automatically
    const startYear = (2026 - parseInt(relationshipDuration) - 1).toString();
    const decisionYear = (2026 - 1).toString();
    const resolveYear = "2026";

    const customTimeline: TimelineNode[] = [
      { year: startYear, stage: "Situation Started", description: "Began navigating the relationship dynamic" },
      { year: decisionYear, stage: "Decision Made", description: `Enacted decision: ${decisionMade}` },
      { year: resolveYear, stage: "Relationship Outcome", description: `Resolved to current state: ${currentOutcome}` }
    ];

    const newStory: Story = {
      id: 'usr_' + Date.now().toString(),
      title: title.trim(),
      situationSlug: customSituation.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-h\-]/g, '') || 'custom-situation',
      situationName: customSituation || `Dealing with ${situationCategory}`,
      age,
      gender,
      country,
      relationshipDuration,
      decisionMade,
      currentOutcome,
      regretScore,
      wouldDoAgain,
      fullStory: fullStory.trim(),
      timeline: customTimeline,
      userName: anonymousUsername || "anonymous_user",
      helpfulVotes: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      updates: [],
      tags: [situationCategory.toLowerCase(), decisionMade.toLowerCase(), currentOutcome.toLowerCase()]
    };

    onSubmit(newStory);
  };

  return (
    <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-2xl relative">
      
      {/* Stepper Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#4F8CFF]">Step {step} of {totalSteps}</span>
          <h2 className="text-sm sm:text-base font-bold text-white">Share Outcome Anonymously</h2>
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
      <div className="min-h-72 flex flex-col justify-between">
        
        <div className="py-2">
          {/* STEP 1: Situation Identification */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#4F8CFF]" /> What best describes your relationship situation category?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {['Marriage', 'Cheating', 'Long Distance', 'Children & Family', 'Careers & Moving', 'Ultimatums', 'Red Flags'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSituationCategory(cat)}
                    className={`rounded-xl border p-3 text-left text-xs font-semibold block transition-colors ${
                      situationCategory === cat ? 'bg-[#4F8CFF]/15 border-[#4F8CFF] text-white' : 'bg-[#0D1117] border-[#30363D] text-[#AAB2C0] hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[#AAB2C0] font-bold block">Optional: Define custom situation name (e.g., 'Boyfriend wants an open relationship'):</label>
                <input
                  type="text"
                  placeholder="e.g. Boyfriend wants an open relationship"
                  value={customSituation}
                  onChange={(e) => setCustomSituation(e.target.value)}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#4F8CFF] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Age Input */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white">How old were you (or are you now) when this situation unfolded?</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="flex-1 accent-[#4F8CFF]"
                />
                <span className="text-xl font-extrabold text-[#4F8CFF] bg-[#4F8CFF]/10 text-center w-14 py-1.5 rounded-lg border border-[#4F8CFF]/20">
                  {age}
                </span>
              </div>
              <p className="text-[11px] text-[#AAB2C0]">Age parameters are crucial so peers in comparable milestones (twenties vs thirties) can locate your timeline decisions accurately.</p>
            </div>
          )}

          {/* STEP 3: Country Selector */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white">Where did this relationship occur (Country)?</h3>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-xs text-white focus:border-[#4F8CFF] focus:outline-none font-bold"
              >
                {[
                  "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", 
                  "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", 
                  "Indonesia", "Ireland", "Italy", "Japan", "Malaysia", "Mexico", "Netherlands", 
                  "New Zealand", "Norway", "Philippines", "Poland", "Portugal", "Saudi Arabia", "Singapore", 
                  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", 
                  "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Other"
                ].map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <p className="text-[11px] text-[#AAB2C0]">Cultural and regional contexts heavily impact matrimonial expectations, family support arrays, and financial divisions.</p>
            </div>
          )}

          {/* STEP 4: Gender */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white font-sans">With which gender identity do you identify?</h3>
              <div className="grid grid-cols-3 gap-2">
                {['Female', 'Male', 'Non-Binary'].map(gen => (
                  <button
                    key={gen}
                    type="button"
                    onClick={() => setGender(gen)}
                    className={`rounded-xl border p-3.5 text-center text-xs font-semibold block transition-colors ${
                      gender === gen ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#0D1117] border-[#30363D] text-[#AAB2C0] hover:text-white'
                    }`}
                  >
                    {gen}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Relationship Duration */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white">What was the total duration of the relationship?</h3>
              <select
                value={relationshipDuration}
                onChange={(e) => setRelationshipDuration(e.target.value)}
                className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-xs text-white focus:border-[#4F8CFF] font-semibold"
              >
                {['Less than 1 Year', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years', '10 Years', '15+ Years'].map(dur => (
                  <option key={dur} value={dur}>{dur}</option>
                ))}
              </select>
            </div>
          )}

          {/* STEP 6: Decision Made */}
          {step === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white">What crucial decision did you end up making?</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Stayed', label: 'Stayed (Tried to fix, wait or compromise)' },
                  { value: 'Left', label: 'Left (Broke up, divorced or walked away)' },
                  { value: 'Married', label: 'Married (Enacted formal marriage union)' },
                  { value: 'Moved Together', label: 'Moved (Relocated or combined housing)' },
                  { value: 'Other', label: 'Other alternative choices' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDecisionMade(opt.value as any)}
                    className={`rounded-xl border p-3 text-left text-xs font-semibold block transition-all ${
                      decisionMade === opt.value ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-[#0D1117] border-[#30363D] text-[#AAB2C0] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Current Outcome */}
          {step === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white">What is the current outcome / relationship state today?</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'Still Together', label: 'Still Unmarried Together' },
                  { value: 'Married', label: 'Happily or Resentfully Married' },
                  { value: 'Engaged', label: 'Engaged under contract' },
                  { value: 'Separated', label: 'Co-separated (Broken Up)' },
                  { value: 'Divorced', label: 'Formally Divorced' },
                  { value: 'Complicated', label: 'Ongoing on-and-off state' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCurrentOutcome(opt.value as any)}
                    className={`rounded-xl border p-3.5 text-left text-xs font-semibold block transition-all ${
                      currentOutcome === opt.value ? 'bg-[#2ECC71]/15 border-[#2ECC71] text-white' : 'bg-[#0D1117] border-[#30363D] text-[#AAB2C0] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: Regret Score */}
          {step === 8 && (
            <div className="space-y-4 animate-fadeIn text-center">
              <h3 className="text-xs sm:text-sm font-bold text-white">What is your current decision regret score?</h3>
              <div className="text-5xl font-black text-[#FF5D5D] bg-[#0E131B] py-4 rounded-2xl border border-zinc-800">
                {regretScore} <span className="text-xs text-zinc-500 font-bold">/ 10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-emerald-400 font-bold">1 (No regrets ever)</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={regretScore}
                  onChange={(e) => setRegretScore(Number(e.target.value))}
                  className="flex-1 accent-red-500"
                />
                <span className="text-[10px] text-[#FF5D5D] font-bold">10 (Excruciating regret)</span>
              </div>
              <p className="text-[10px] text-[#AAB2C0] leading-relaxed">
                {regretScore <= 3 ? "😊 You feel complete clarity about that decision." :
                 regretScore <= 6 ? "😐 You have mixed thoughts or slight nostalgia of what-ifs." :
                 "💔 You deeply wish you had made a different choice earlier."}
              </p>
            </div>
          )}

          {/* STEP 9: Full Story */}
          {step === 9 && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                <span>Write Your Detailed Timeline Story</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${fullStory.trim().length >= 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-[#FF5D5D]'}`}>
                  {fullStory.trim().length} / 100 char min
                </span>
              </h3>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Summarize your experience in one punchy line..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-2.5 text-xs text-white placeholder-zinc-500 font-bold focus:border-[#4F8CFF] focus:outline-none"
                  required
                />

                <textarea
                  placeholder="Share details. What led to the crisis? What was the decision? How did your family react? What was the actual, raw outcome? Highlight what others must avoid."
                  value={fullStory}
                  onChange={(e) => setFullStory(e.target.value)}
                  className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-xs text-white placeholder-zinc-500 focus:border-[#4F8CFF] focus:outline-none min-h-[160px] font-serif"
                  required
                />
              </div>
              <p className="text-[10px] text-[#AAB2C0]">By sharing authentic milestones, you save others from making blind choices with lifelong implications.</p>
            </div>
          )}

          {/* STEP 10: Username Anonymous Setting */}
          {step === 10 && (
            <div className="space-y-4 animate-fadeIn text-center">
              <h3 className="text-xs sm:text-sm font-bold text-white">We Value Your Absolute Anonymity</h3>
              <p className="text-[11px] text-[#AAB2C0] max-w-sm mx-auto leading-relaxed">BeforeRegret does not require emails, real-names, or facial logins to commit stories. All accounts are pre-masked of cookies.</p>
              
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <div className="flex-1 rounded-xl bg-[#0D1117] border border-[#30363D] py-2.5 px-4 text-xs font-mono font-bold text-indigo-300">
                  @{anonymousUsername}
                </div>
                <button
                  type="button"
                  onClick={rollAnonymousName}
                  className="p-2.5 rounded-xl border border-[#30363D] bg-[#0D1117] hover:border-white text-[#AAB2C0]"
                  title="Generate another handle"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              
              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3 max-w-xs mx-auto text-[10px] text-indigo-300">
                🔒 Handles are completely anonymous. No personally identifiable IP parameters are persistent.
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
              step === 1 ? 'opacity-30 cursor-not-allowed text-[#AAB2C0]' : 'text-white hover:bg-[#30363D]'
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 px-4 py-2 text-xs font-bold text-white"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-5 py-2.5 text-xs font-black text-white shadow-lg"
            >
              Publish Anonymously <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
