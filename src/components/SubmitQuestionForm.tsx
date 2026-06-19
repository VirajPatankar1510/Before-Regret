import React, { useState } from 'react';
import { Sparkles, MessageSquare, AlertCircle, HelpCircle, Check, Plus, Trash2 } from 'lucide-react';

interface SubmitQuestionFormProps {
  onClose: () => void;
  onSubmit: (question: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    pollOptions: string[];
  }) => void;
}

export default function SubmitQuestionForm({ onClose, onSubmit }: SubmitQuestionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Marriage');
  const [tagsInput, setTagsInput] = useState('');
  
  // Custom Poll option management!
  const [pollOptions, setPollOptions] = useState<string[]>([
    "Leave immediately",
    "Stay and try couples therapy",
    "Give it one last chance"
  ]);

  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleAddOption = () => {
    if (pollOptions.length >= 6) {
      alert("Maximum of 6 poll options are allowed to keep it legible.");
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) {
      alert("You need at least 2 options for a functional poll.");
      return;
    }
    setPollOptions(pollOptions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 15) {
      alert("Please expand your Advice Topic title to at least 15 characters to make it clear what you are asking.");
      return;
    }

    if (description.trim().length < 50) {
      alert("Please provide at least 50 characters of detailed context / dilemma so survivors can formulate helpful advices.");
      return;
    }

    const cleanedOptions = pollOptions.map(o => o.trim()).filter(o => o !== '');
    if (cleanedOptions.length < 2) {
      alert("Please fulfill at least 2 distinct poll option choices for the community survey!");
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsArray,
      pollOptions: cleanedOptions
    });
  };

  const categories = [
    'Cheating',
    'Marriage',
    'Long Distance',
    'Children & Family',
    'Careers & Moving',
    'Ultimatums',
    'Red Flags'
  ];

  return (
    <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-5 sm:p-6 shadow-xl space-y-6 animate-fadeIn max-w-3xl mx-auto">
      
      <div className="flex items-center gap-2 pb-3 border-b border-[#30363D]/65">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white">Lodge Advice Request Board</h2>
          <p className="text-xs text-[#AAB2C0]">Get constructive, experienced advices from timeline survivors anonymously.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Topic Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center justify-between">
            <span className="text-white">What's Your Dilemma / Dilemma Summary Title? <span className="text-red-400">*</span></span>
            <span className="text-[10px] text-zinc-500 font-mono font-normal">Min 15 chars</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Should I tell my husband about a minor financial secret from 5 years ago?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[#30363D] bg-[#0E131B] p-3 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-550"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-white tracking-wider">
              Primary Advice category <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[#30363D] bg-[#0E131B] p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-350 tracking-wider">
              Keywords / tags <span className="text-zinc-500 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. trust, secrets, marital-finances"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-xl border border-[#30363D] bg-[#0E131B] p-3 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-550"
            />
          </div>

        </div>

        {/* Story details */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-350 tracking-wider flex items-center justify-between">
            <span className="text-white">Dilemma Context & Timeline Details <span className="text-red-400">*</span></span>
            <span className="text-[10px] text-zinc-500 font-mono font-normal">Min 50 chars</span>
          </label>
          <textarea
            required
            rows={5}
            placeholder="Explain what happened, your current choices, duration, and what specific advice comments you seek. Survivors will answer under peer review guidance."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[#30363D] bg-[#0E131B] p-3 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-550 font-sans"
          />
        </div>

        {/* Poll Options */}
        <div className="space-y-3 border-t border-[#30363D]/40 pt-4">
          <div>
            <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" /> Build Advice Poll Survey
            </span>
            <p className="text-[10px] text-zinc-400">Provide options that the public can click dynamically to guide your outcome choice.</p>
          </div>

          <div className="space-y-2">
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs font-mono text-zinc-500 shrink-0 select-none">#{idx + 1}</span>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleUpdateOption(idx, e.target.value)}
                  className="flex-1 rounded-xl border border-[#30363D]/80 bg-[#0E131B] px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-550"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-2 border border-red-500/15 hover:border-red-500/35 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                  title="Remove option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-purple-400 bg-[#1e142e] border border-purple-500/20 hover:border-purple-500/50 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Choice Option
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#30363D]/65">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#30363D] hover:bg-[#30363D]/30 px-4 py-2 text-xs text-[#AAB2C0] font-bold transition-all hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-black transition-all shadow-md active:scale-98"
          >
            <Check className="h-4 w-4" /> Broadcast Advice Topic
          </button>
        </div>

      </form>
    </div>
  );
}
