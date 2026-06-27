import React, { useState } from 'react';
import { Compass, FileText, ChevronRight, Gavel, Sparkles, AlertTriangle, HelpCircle, Heart, Tag, Search, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { Situation, Story, CourtCase } from '../types';
import { PRESEEDED_RELATIONSHIP_PROBLEMS } from '../data/relationshipProblems';

interface ExploreScreenProps {
  situations: Situation[];
  stories?: Story[];
  courtCases?: CourtCase[];
  setScreen: (screen: { type: string; slug?: string }) => void;
  onCaseRetrieve?: (caseNum: string) => void;
  initialSearchTerm?: string;
}

export default function ExploreScreen({ 
  situations, 
  stories = [], 
  courtCases = [], 
  setScreen,
  onCaseRetrieve,
  initialSearchTerm = ''
}: ExploreScreenProps) {
  const [filterType, setFilterType] = useState<'all' | 'story' | 'trial'>('all');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Combine both user timelines & court trials for unified indexing
  const indexedItems: {
    id: string;
    caseNumber?: string;
    title: string;
    type: 'story' | 'trial';
    description: string;
    time: string;
    slug?: string;
    parentSlug?: string;
    tags: string[];
  }[] = [];

  // 1. Add Story timelines
  stories.forEach(s => {
    // Find parent category matching the situation
    const sit = situations.find(x => x.slug === s.situationSlug);
    indexedItems.push({
      id: s.id,
      caseNumber: s.caseNumber || `CASE-S${s.id.slice(0, 4).toUpperCase()}`,
      title: s.title,
      type: 'story',
      description: s.fullStory || '',
      time: s.dateAdded || 'Archived',
      slug: s.situationSlug,
      parentSlug: s.situationSlug,
      tags: [s.gender, `${s.age}y/o`, ...(sit ? [sit.category] : []), ...(s.tags || [])]
    });
  });

  // 2. Add Court trials
  courtCases.forEach(c => {
    indexedItems.push({
      id: c.slug,
      caseNumber: c.caseNumber || `CASE-C${c.slug.slice(0, 4).toUpperCase()}`,
      title: c.title,
      type: 'trial',
      description: c.description || '',
      time: c.postTime || 'Deliberation',
      slug: c.slug,
      parentSlug: undefined,
      tags: c.tags || ['Relationship Trial']
    });
  });

  // Sort by Case Number descending/random but stable
  const sortedItems = [...indexedItems].sort((a, b) => b.caseNumber!.localeCompare(a.caseNumber!));

  // Helper to determine if a tag is demographic or generic country
  const isDemographicOrGenericTag = (tag: string): boolean => {
    const t = tag.toLowerCase().trim();
    if (t === 'male' || t === 'female' || t === 'other' || t === 'non-binary') return true;
    if (t.endsWith('y/o') || t.endsWith('s') || /^\d+$/.test(t)) return true;
    const countries = ['usa', 'india', 'canada', 'uk', 'vietnam', 'australia', 'germany', 'france', 'united states', 'united kingdom'];
    if (countries.includes(t)) return true;
    return false;
  };

  // Filter based on search input & tabs
  const filteredItems = sortedItems.filter(item => {
    const matchesTab = filterType === 'all' || item.type === filterType;
    if (!searchTerm.trim()) return matchesTab;

    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    const queryNorm = normalize(searchTerm);
    if (!queryNorm) return matchesTab;

    // Check if the query matches any PRESEEDED_RELATIONSHIP_PROBLEMS keywords/name/id
    const matchedProblems = PRESEEDED_RELATIONSHIP_PROBLEMS.filter(p => {
      const pNameNorm = normalize(p.name);
      const pIdNorm = normalize(p.id);
      if (pNameNorm.includes(queryNorm) || queryNorm.includes(pNameNorm) || pIdNorm.includes(queryNorm) || queryNorm.includes(pIdNorm)) {
        return true;
      }
      return p.keywords.some(kw => {
        const kwNorm = normalize(kw);
        return kwNorm.includes(queryNorm) || queryNorm.includes(kwNorm);
      });
    });

    const matchedProblemSlugs = matchedProblems.map(p => normalize(p.id));

    // Also match split words for fallback/broad matching
    const termLower = searchTerm.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    const termWords = termLower.split(/\s+/).filter(w => w.length > 2 && !['got', 'the', 'and', 'for', 'was', 'with', 'not', 'your', 'from'].includes(w));
    const termWordsNorm = termWords.map(w => normalize(w)).filter(Boolean);

    // Main search logic with normalization
    const titleNorm = normalize(item.title);
    const descNorm = normalize(item.description);
    const caseNumNorm = item.caseNumber ? normalize(item.caseNumber) : '';
    const slugNorm = item.slug ? normalize(item.slug) : '';
    const parentSlugNorm = item.parentSlug ? normalize(item.parentSlug) : '';

    const matchesSearch = 
      titleNorm.includes(queryNorm) ||
      queryNorm.includes(titleNorm) ||
      caseNumNorm.includes(queryNorm) ||
      descNorm.includes(queryNorm) ||
      // Match via preseeded relationship problem category mapping
      (matchedProblemSlugs.length > 0 && (
        matchedProblemSlugs.includes(slugNorm) ||
        matchedProblemSlugs.includes(parentSlugNorm)
      )) ||
      // Search tags: match if tag contains query, OR query contains tag
      item.tags.some(t => {
        const tNorm = normalize(t);
        return tNorm && (tNorm.includes(queryNorm) || queryNorm.includes(tNorm));
      }) ||
      // Or word-level overlap (normalized)
      (termWordsNorm.length > 0 && termWordsNorm.some(wordNorm => 
        titleNorm.includes(wordNorm) ||
        descNorm.includes(wordNorm) ||
        item.tags.some(t => normalize(t).includes(wordNorm))
      ));

    return matchesTab && matchesSearch;
  });

  const showDirectoryOnTop = !!searchTerm;

  // 1. Categories Grid JSX
  const categoriesGrid = (
    <div className="space-y-4">
      {!showDirectoryOnTop && (
        <div className="text-left pb-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A227]">Browse Frameworks</span>
          <h2 className="text-lg font-bold text-[#24324A] uppercase tracking-wide font-serif">Topic Classified Directories</h2>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {situations.map(s => (
          <div
            key={s.slug}
            onClick={() => setScreen({ type: 'situation', slug: s.slug })}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-5 cursor-pointer shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-[#24324A] bg-[#24324A]/5 px-2 py-0.5 rounded font-mono border border-[#24324A]/10">
                  {s.category}
                </span>
                <span className="text-[10px] text-[#C9A227] font-bold group-hover:underline">Active timelines →</span>
              </div>
              <h3 className="text-sm font-bold text-[#24324A] pt-1 font-serif group-hover:text-[#C9A227] transition-all">{s.name}</h3>
              <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed font-sans">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 2. SEO-Friendly Index Section JSX (Public Case Directory)
  const publicCaseDirectory = (
    <section className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 space-y-6 shadow-sm border-t-2 border-t-[#C9A227]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECEC] pb-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#24324A] flex items-center gap-2 uppercase tracking-wide font-serif">
            <ShieldCheck className="h-5 w-5 text-[#C9A227]" />
            📁 Public Case Directory
          </h2>
          <p className="text-[11px] text-[#6B7280] font-medium">
            Directory listing of user-lodged relationship stories and trial records. Completely anonymous and securely stored.
          </p>
          
          {searchTerm && (
            <div className="mt-2.5 inline-flex items-center gap-2 bg-[#FFF8E1] border border-[#E8D79B]/60 px-3 py-1 rounded-xl animate-fadeIn">
              <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold text-amber-800">Showing results for:</span>
              <span className="text-xs font-black text-[#24324A] font-serif">"{searchTerm}"</span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-[#C0392B] hover:text-[#CBB544] ml-2 text-xs font-mono font-bold transition-all px-1"
                title="Clear search"
              >
                ✕ Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Quick Filter Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {(['all', 'story', 'trial'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                filterType === type
                  ? 'bg-[#FFF8E1] text-[#C9A227] border-[#E8D79B]'
                  : 'text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAF8F2] bg-white'
              }`}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      {/* Local Index Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search index by unique Case Key, tags (e.g. Female, 20s), or issue words..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-[#E5E7EB] focus:border-[#24324A] rounded-xl py-2 px-3.5 pl-10 text-xs text-[#1F2937] placeholder-zinc-400 focus:outline-none transition-all font-sans font-medium hover:border-zinc-300"
        />
        <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Ledger list */}
      <div className="divide-y divide-[#E5E7EB]">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => {
                if (item.type === 'story') {
                  setScreen({ type: 'situation', slug: item.slug });
                  if (onCaseRetrieve) {
                    setTimeout(() => onCaseRetrieve(item.caseNumber || ''), 300);
                  }
                } else {
                  setScreen({ type: 'court', slug: item.slug });
                }
              }}
              className="py-4 hover:bg-[#FAF8F2]/60 px-2 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#C9A227] bg-[#FFF8E1] border border-[#E8D79B] px-2 py-0.5 rounded-md">
                    {item.caseNumber}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md font-mono ${
                    item.type === 'trial' ? 'bg-[#24324A]/5 text-[#24324A] border border-[#24324A]/10' : 'bg-zinc-100 text-[#6B7280] border border-zinc-200'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {item.time}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#1F2937] group-hover:text-[#24324A] transition-colors font-serif">
                  "{item.title}"
                </h3>
                <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 md:self-center">
                {item.tags.filter(isDemographicOrGenericTag).map(t => (
                  <span key={t} className="text-[9px] bg-[#F4F1E8] text-[#6B7280] border border-[#E5E7EB] px-2 py-0.5 rounded-full font-sans font-semibold">
                    {t}
                  </span>
                ))}
                <div className="hidden md:flex h-7 w-7 rounded-full bg-zinc-100 group-hover:bg-[#24324A]/5 items-center justify-center text-zinc-400 group-hover:text-[#24324A] transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-[#FAF8F2] rounded-xl my-4">
            <AlertTriangle className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No matching stories or cases in offline index</p>
            <p className="text-[10px] text-zinc-400 mt-1">Try resetting filter tabs or checking for typos.</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* Intro Header */}
      <div className="space-y-1.5 text-center max-w-2xl mx-auto py-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#24324A] tracking-tight uppercase font-display">Outcome Intelligence Directories</h1>
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-semibold">
          Browse real-life crowd-sourced relationship dossiers grouped by issues, demographics, and active case logs.
        </p>
      </div>

      {/* Dynamic ordering of directories based on Search presence */}
      {showDirectoryOnTop ? (
        <div className="space-y-8">
          {publicCaseDirectory}
          {categoriesGrid}
        </div>
      ) : (
        <div className="space-y-8">
          {categoriesGrid}
          {publicCaseDirectory}
        </div>
      )}

      {/* Extra Directories shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Court shortcut */}
        <div 
          onClick={() => setScreen({ type: 'court_list' })}
          className="rounded-2xl border border-dashed border-[#E8D79B] bg-white p-5 cursor-pointer hover:border-[#C9A227] hover:shadow-md transition-all shadow-sm"
        >
          <Gavel className="h-8 w-8 text-[#C9A227] mb-3" />
          <h3 className="text-sm font-bold text-[#24324A] mb-1 font-serif">BR Court Cases</h3>
          <p className="text-xs text-[#6B7280] leading-relaxed font-sans">Read or load situations of digital snoopings, Instagram ex-likes, or in-law disagreements. Review perspectives and cast your active vote.</p>
        </div>

        {/* Q&A shortcut */}
        <div 
          onClick={() => setScreen({ type: 'question_list' })}
          className="rounded-2xl border border-dashed border-purple-200 bg-white p-5 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all shadow-sm"
        >
          <Sparkles className="h-8 w-8 text-purple-500 mb-3" />
          <h3 className="text-sm font-bold text-[#24324A] mb-1 font-serif font-semibold">Peer Query Advisory</h3>
          <p className="text-xs text-[#6B7280] leading-relaxed font-sans">Ask other relationship survivors directly. Analyze community poll choices and link outcomes directly to archived story timelines.</p>
        </div>

      </section>

    </div>
  );
}
