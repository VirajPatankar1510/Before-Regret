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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Moniker Display */}
      <div className="flex items-center justify-between bg-[#0D1117] px-3 py-2 rounded-xl border border-[#30363D]/40 text-xs">
        <span className="text-[#AAB2C0] font-mono text-[10px]">PEER MONIKER</span>
        <div className="flex items-center gap-1.5 font-bold text-[#F4B942] font-mono text-[11px]">
          <span>@{anonymousName}</span>
          <button
            type="button"
            onClick={rollLitigantAlias}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            title="Roll another anonymous moniker"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Case Title Input */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#AAB2C0] font-mono block mb-1">
          Case Title / Relationship Dispute *
        </label>
        <input
          type="text"
          required
          placeholder="e.g., My Partner Wants Me To Pay Half For His Family Dinner"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border-2 border-[#30363D] bg-[#0D1117] py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-[#F4B942] focus:outline-none focus:ring-4 focus:ring-[#F4B942]/10 transition-all"
        />
      </div>

      {/* Dispute / Evidence Input */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#AAB2C0] font-mono block mb-1">
          Evidence & Story Narrative * (Min. 50 chars)
        </label>
        <textarea
          required
          rows={4}
          placeholder="Explain what happened. Who did what? Why do you think you are in the right/wrong? Provide context on your specific boundaries and the argument structure."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border-2 border-[#30363D] bg-[#0D1117] py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-[#F4B942] focus:outline-none focus:ring-4 focus:ring-[#F4B942]/10 transition-all leading-relaxed font-serif"
        />
        <div className="text-right text-[9px] text-zinc-500 font-mono mt-1">
          Character count: {description.length} / Min. 50
        </div>
      </div>

      {/* Tags input */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[#AAB2C0] font-mono block mb-1">
          Tags / Core Issues (comma-separated, optional)
        </label>
        <input
          type="text"
          placeholder="e.g., finance, boundary, family, social-media"
          value={tagsString}
          onChange={(e) => setTagsString(e.target.value)}
          className="w-full rounded-xl border-2 border-[#30363D] bg-[#0D1117] py-2 px-3 text-xs text-white placeholder-zinc-600 focus:border-[#F4B942] focus:outline-none"
        />
      </div>

      {/* Deliberation Duration Selection */}
      <div className="bg-[#0D1117]/50 rounded-xl border border-[#30363D]/45 p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#AAB2C0] font-mono mb-1">
          <Calendar className="h-3.5 w-3.5 text-[#F4B942]" />
          <span>Deliberation period *</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { label: "3 days", value: 3, unit: "days" },
            { label: "5 days", value: 5, unit: "days" },
            { label: "7 days", value: 7, unit: "days" },
            { label: "10 days", value: 10, unit: "days" },
            { label: "14 days", value: 14, unit: "days" }
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setDeliberationDays(opt.value)}
              className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all text-center flex flex-col justify-center items-center cursor-pointer ${
                deliberationDays === opt.value
                  ? 'bg-[#F4B942]/15 border-[#F4B942] text-[#F4B942] shadow-sm ring-2 ring-[#F4B942]/10'
                  : 'bg-[#0D1117] border-[#30363D] text-[#AAB2C0] hover:border-zinc-600'
              }`}
            >
              <span className="text-[13px] font-black">{opt.value}</span>
              <span className="text-[7.5px] uppercase tracking-widest text-[#AAB2C0]">{opt.unit}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Checkbox with small disclaimer below input box */}
      <div className="rounded-xl border border-dashed border-[#30363D] bg-[#161B22] p-3 animate-fadeIn">
        <label className="flex gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDisclaimerChecked}
            onChange={(e) => setIsDisclaimerChecked(e.target.checked)}
            className="mt-0.5 rounded border-[#30363D] text-[#F4B942] focus:ring-0 focus:ring-offset-0 bg-[#0D1117] h-4 w-4 shrink-0"
            required
          />
          <span className="text-[10.5px] text-[#AAB2C0] leading-snug font-sans">
            I understand that registering this case opens it for public peer perspective sharing. All information is anonymous, shared publicly on this decision list, and cannot be retracted after submission.
          </span>
        </label>
      </div>

      {/* Submit Case Button */}
      <button
        type="submit"
        disabled={!isDisclaimerChecked || !title.trim() || description.trim().length < 50}
        className={`w-full py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
          isDisclaimerChecked && title.trim() && description.trim().length >= 50
            ? 'bg-[#F4B942] text-[#0D1117] hover:bg-[#F4B942]/90 cursor-pointer font-black'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-[#30363D]/40'
        }`}
      >
        <Gavel className="h-4 w-4" /> Share Case for Perspectives
      </button>
    </form>
  );
}
