import React, { useState, useEffect } from 'react';
import { Gavel, Scale, ShieldAlert, Check, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { validateInputText } from '../lib/validation';

interface RegisterCaseFormProps {
  onSubmit: (caseData: { title: string; description: string; tags: string[]; deliberationDays: number; wantsPartnerResponse: boolean }) => void;
}

export default function RegisterCaseForm({ onSubmit }: RegisterCaseFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [deliberationDays, setDeliberationDays] = useState(3);
  const [wantsPartnerResponse, setWantsPartnerResponse] = useState(false);
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate a premium anonymous judge / litigant moniker
  const rollLitigantAlias = () => {
    const prefixes = ["aggrieved", "confused", "silent", "puzzled", "seeking", "neutral", "watchful", "anxious", "resolute", "fair"];
    const suffixes = ["litigant", "peer", "spouse", "partner", "jurist", "plaintiff", "defender", "party", "seeker", "witness"];
    const pre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setAnonymousName(`${pre}_${suf}_${num}`);
  };

  useEffect(() => {
    rollLitigantAlias();
  }, []);

  // Validate inputs on the fly
  useEffect(() => {
    setValidationError(null);
    
    const titleVal = validateInputText(title, "Title");
    if (!titleVal.isValid) {
      setValidationError(titleVal.error || "Invalid input");
      return;
    }

    const descVal = validateInputText(description, "Evidence Narrative");
    if (!descVal.isValid) {
      setValidationError(descVal.error || "Invalid input");
      return;
    }
  }, [title, description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const titleVal = validateInputText(title, "Title");
    if (!titleVal.isValid) {
      alert(titleVal.error);
      setValidationError(titleVal.error || "Invalid title");
      return;
    }

    const descVal = validateInputText(description, "Evidence Narrative");
    if (!descVal.isValid) {
      alert(descVal.error);
      setValidationError(descVal.error || "Invalid narrative");
      return;
    }

    if (!title.trim()) {
      alert("Please provide a concise title summarizing your relationship dispute.");
      return;
    }

    if (description.trim().length < 50) {
      alert("Please expand your dispute details and evidence to at least 50 characters so peer jurors can deliver an informed verdict.");
      return;
    }

    if (!isDisclaimerChecked) {
      alert("You must acknowledge the anonymous public deliberation disclaimer before submitting.");
      return;
    }

    // Process tags (fixed/default tag since input is removed)
    const tags = ["relationship-dispute"];

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      tags,
      deliberationDays,
      wantsPartnerResponse
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDeliberationDays(3);
    setWantsPartnerResponse(false);
    setIsDisclaimerChecked(false);
    setValidationError(null);
    rollLitigantAlias();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Moniker on Left, Deliberation on Right (Side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Moniker Display */}
        <div className="flex flex-col justify-between bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs h-[42px]">
          <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider leading-none">Your Moniker</span>
          <div className="flex items-center justify-between font-bold text-[#C9A227] font-mono text-[11px] leading-none">
            <span>@{anonymousName}</span>
            <button
              type="button"
              onClick={rollLitigantAlias}
              className="p-0.5 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              title="Roll another anonymous moniker"
            >
              <RefreshCw className="h-3 w-3 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Deliberation Days Custom select dropdown */}
        <div className="flex items-center justify-between bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs h-[42px]">
          <div className="flex flex-col justify-center">
            <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider leading-none">Deliberation</span>
            <span className="text-zinc-700 text-[10px] font-sans font-semibold mt-0.5 leading-none">Trial active period</span>
          </div>
          <select
            value={deliberationDays}
            onChange={(e) => setDeliberationDays(parseInt(e.target.value))}
            className="bg-white border border-zinc-300 text-zinc-900 text-[11px] font-mono font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#C9A227] cursor-pointer"
          >
            <option value="3">3 Days</option>
            <option value="5">5 Days</option>
            <option value="7">7 Days</option>
            <option value="10">10 Days</option>
            <option value="14">14 Days</option>
          </select>
        </div>
      </div>

      {/* Row 2: Case Title */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-zinc-700 font-mono tracking-wider block">
          Dispute Title *
        </label>
        <input
          type="text"
          required
          placeholder="e.g., Partner Wants Me To Pay Half For Dinner"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border-2 border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#C9A227] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all font-semibold"
        />
      </div>

      {/* Row 3: Narrative Textarea */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase font-bold text-zinc-700 font-mono tracking-wider block">
            Evidence Narrative * (Min. 50 characters)
          </label>
          <span className="text-[9px] text-zinc-500 font-mono">
            {description.length} chars
          </span>
        </div>
        <textarea
          required
          rows={4}
          placeholder="Explain what happened. Why do you believe you are right or wrong? Provide specific boundaries, background, and dynamics."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border-2 border-zinc-200 bg-white py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#C9A227] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/10 transition-all leading-relaxed font-sans resize-none font-medium"
        />
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-[10.5px] leading-relaxed font-sans">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Should Your Partner Respond Toggle */}
      <div className="rounded-xl border border-zinc-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-xs flex items-center justify-between gap-3 select-none shadow-sm">
        <div className="space-y-0.5 text-left">
          <span className="font-extrabold text-zinc-900 flex items-center gap-1.5 font-sans text-[11px] sm:text-xs">
            <Scale className="h-4 w-4 text-[#C9A227]" /> Should Your Partner Respond?
          </span>
          <p className="text-[10px] text-zinc-600 leading-relaxed font-medium">
            Generate an exclusive link for your partner to anonymously submit their opposition statement.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={wantsPartnerResponse}
            onChange={(e) => setWantsPartnerResponse(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white border border-zinc-400 shadow-inner" />
        </label>
      </div>

      {/* Row 4: Disclaimer */}
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-3 animate-fadeIn">
        <label className="flex gap-2.5 cursor-pointer select-none text-left">
          <input
            type="checkbox"
            checked={isDisclaimerChecked}
            onChange={(e) => setIsDisclaimerChecked(e.target.checked)}
            className="mt-0.5 rounded border-zinc-300 text-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 bg-white h-4 w-4 shrink-0 cursor-pointer"
            required
          />
          <span className="text-[10px] text-zinc-600 leading-relaxed font-sans font-medium">
            I understand that registering this case opens it for public peer perspective sharing. All information is anonymous, shared publicly on this decision list, and cannot be retracted after submission.
          </span>
        </label>
      </div>

      {/* Row 5: Submit Button */}
      <button
        type="submit"
        disabled={!isDisclaimerChecked || !title.trim() || description.trim().length < 50 || !!validationError}
        className={`w-full py-2.5 rounded-xl font-bold uppercase text-[10.5px] tracking-wider transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 ${
          isDisclaimerChecked && title.trim() && description.trim().length >= 50 && !validationError
            ? 'bg-[#24324A] text-white hover:bg-[#1E273A] cursor-pointer font-black'
            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
        }`}
      >
        <Gavel className="h-3.5 w-3.5" /> Share Case for Perspectives
      </button>
    </form>
  );
}
