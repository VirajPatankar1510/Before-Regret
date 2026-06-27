import React, { useState, useEffect } from 'react';
import { Gavel, Scale, ShieldAlert, Check, RefreshCw, Calendar } from 'lucide-react';

interface RegisterCaseFormProps {
  onSubmit: (caseData: { title: string; description: string; tags: string[]; deliberationDays: number }) => void;
}

export default function RegisterCaseForm({ onSubmit }: RegisterCaseFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [deliberationDays, setDeliberationDays] = useState(3);
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    // Process tags
    const tags = tagsString
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    // Default tag if none supplied
    if (tags.length === 0) {
      tags.push("relationship-dispute");
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      tags,
      deliberationDays
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setTagsString('');
    setDeliberationDays(3);
    setIsDisclaimerChecked(false);
    rollLitigantAlias();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Row 1: Moniker on Left, Deliberation on Right (Side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Moniker Display */}
        <div className="flex flex-col justify-between bg-[#0D1117] px-3 py-1.5 rounded-xl border border-[#30363D]/40 text-xs h-[42px]">
          <span className="text-[#AAB2C0] font-mono text-[9px] uppercase tracking-wider leading-none">Your Moniker</span>
          <div className="flex items-center justify-between font-bold text-[#F4B942] font-mono text-[11px] leading-none">
            <span>@{anonymousName}</span>
            <button
              type="button"
              onClick={rollLitigantAlias}
              className="p-0.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Roll another anonymous moniker"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Deliberation Days Custom select dropdown */}
        <div className="flex items-center justify-between bg-[#0D1117] px-3 py-1.5 rounded-xl border border-[#30363D]/40 text-xs h-[42px]">
          <div className="flex flex-col justify-center">
            <span className="text-[#AAB2C0] font-mono text-[9px] uppercase tracking-wider leading-none">Deliberation</span>
            <span className="text-white text-[10px] font-sans font-semibold mt-0.5 leading-none">Trial active period</span>
          </div>
          <select
            value={deliberationDays}
            onChange={(e) => setDeliberationDays(parseInt(e.target.value))}
            className="bg-[#161B22] border border-[#30363D] text-white text-[11px] font-mono font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#F4B942] cursor-pointer"
          >
            <option value="3">3 Days</option>
            <option value="5">5 Days</option>
            <option value="7">7 Days</option>
            <option value="10">10 Days</option>
            <option value="14">14 Days</option>
          </select>
        </div>
      </div>

      {/* Row 2: Case Title and Tags (Side by side on sm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Case Title Input */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-[#AAB2C0] font-mono tracking-wider block">
            Dispute Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Partner Wants Me To Pay Half For Dinner"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border-2 border-[#30363D] bg-[#0D1117] py-2 px-3 text-xs text-white placeholder-zinc-500 focus:border-[#F4B942] focus:outline-none focus:ring-2 focus:ring-[#F4B942]/10 transition-all"
          />
        </div>

        {/* Tags input */}
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-[#AAB2C0] font-mono tracking-wider block">
            Tags / Issues (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g., finance, boundary, family"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            className="w-full rounded-xl border-2 border-[#30363D] bg-[#0D1117] py-2 px-3 text-xs text-white placeholder-zinc-500 focus:border-[#F4B942] focus:outline-none focus:ring-2 focus:ring-[#F4B942]/10 transition-all"
          />
        </div>
      </div>

      {/* Row 3: Narrative Textarea */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-[9px] uppercase font-bold text-[#AAB2C0] font-mono tracking-wider block">
            Evidence Narrative * (Min. 50 characters)
          </label>
          <span className="text-[9px] text-zinc-500 font-mono">
            {description.length} chars
          </span>
        </div>
        <textarea
          required
          rows={3}
          placeholder="Explain what happened. Why do you believe you are right or wrong? Provide specific boundaries, background, and dynamics."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border-2 border-[#30363D] bg-[#0D1117] py-2 px-3 text-xs text-white placeholder-zinc-500 focus:border-[#F4B942] focus:outline-none focus:ring-2 focus:ring-[#F4B942]/10 transition-all leading-relaxed font-serif resize-none"
        />
      </div>

      {/* Row 4: Disclaimer */}
      <div className="rounded-xl border border-dashed border-[#30363D]/80 bg-[#161B22]/55 p-2 animate-fadeIn">
        <label className="flex gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDisclaimerChecked}
            onChange={(e) => setIsDisclaimerChecked(e.target.checked)}
            className="mt-0.5 rounded border-[#30363D] text-[#F4B942] focus:ring-0 focus:ring-offset-0 bg-[#0D1117] h-3.5 w-3.5 shrink-0 cursor-pointer"
            required
          />
          <span className="text-[10px] text-[#AAB2C0] leading-tight font-sans">
            I understand that registering this case opens it for public peer perspective sharing. All information is anonymous, shared publicly on this decision list, and cannot be retracted after submission.
          </span>
        </label>
      </div>

      {/* Row 5: Submit Button */}
      <button
        type="submit"
        disabled={!isDisclaimerChecked || !title.trim() || description.trim().length < 50}
        className={`w-full py-2.5 rounded-xl font-bold uppercase text-[10.5px] tracking-wider transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 ${
          isDisclaimerChecked && title.trim() && description.trim().length >= 50
            ? 'bg-[#F4B942] text-[#0D1117] hover:bg-[#F4B942]/90 cursor-pointer font-black'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-[#30363D]/40'
        }`}
      >
        <Gavel className="h-3.5 w-3.5" /> Share Case for Perspectives
      </button>
    </form>
  );
}
