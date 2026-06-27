import React, { useState, useMemo, useEffect } from 'react';
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

const OUTCOME_STORIES: Record<string, { title: string; update: string; outcome: string; author: string }> = {
  'should-i-leave': {
    title: "1-Year Update: The weight lifted from my shoulders",
    update: "After completing the Ground Reality Checklist, I realized my partner had been stonewalling and refusing counseling for over 18 months. I finally chose to leave. The first 3 months were brutal, but 12 months later, my mental health has completely restored.",
    outcome: "Status: Decisively left. Peace and stable autonomy achieved.",
    author: "@sarah_k"
  },
  'will-i-regret': {
    title: "2-Years Later: Do I regret leaving?",
    update: "I kept asking myself if I would regret leaving my high-conflict marriage. Two years later, I can honestly say the only regret I have is not leaving sooner. The kids are happier seeing two peaceful parents separately than one toxic household.",
    outcome: "Status: Decisively left. Regret rating: 0/10.",
    author: "@clarity_seeker"
  },
  'red-flags': {
    title: "10-Months Progress: Stopping the excuse cycle",
    update: "I kept ignoring the isolation and deflection patterns, thinking they were just 'stress.' After conducting a behavioral red flags audit, I set a strict boundary. They refused to respect it, so I left. I am finally back in touch with my family.",
    outcome: "Status: Left. Boundaries restored.",
    author: "@boundary_builder"
  },
  'relationship-regrets': {
    title: "18-Months Timeline: Healing from separation shock",
    update: "The relief/regret curve is so accurate. Month 1 felt like separation shock. Month 3 was full of silent grief. But by Month 6, I hit a steady autonomy breakpoint. Now at Year 1.5, I have total rebuilt clarity and zero desire to go back.",
    outcome: "Status: Separated. Stable and thriving.",
    author: "@clara_m"
  },
  'commitment-issues': {
    title: "1-Year Later: Releasing the marriage pressure loop",
    update: "We were stuck in a constant commitment mismatch. He wouldn't talk about marriage. We took conscious space for 3 months with zero pressure. During that time, he realized he didn't want the same life path. We split amicably. It was the hardest but best decision.",
    outcome: "Status: Amicable split. Ready for matched values.",
    author: "@future_focused"
  },
  'trust-issues': {
    title: "1-Year Later: The hidden phone was just the beginning",
    update: "I noticed my partner constantly shielding their phone screen and changing their passcode. I tried to convince myself it was nothing. It turned out to be a secret dating app. I left, and I am so grateful I trusted my gut instead of their excuses.",
    outcome: "Status: Left. Rebuilding self-trust.",
    author: "@gut_check99"
  },
  'signs-he-doesnt-want-marriage': {
    title: "18-Months Progress: After the 'Shut Up' Ring",
    update: "I waited 6 years for a proposal. He finally proposed after an ultimatum, but the wedding planning was filled with delays and constant fights. I realized he was marrying me out of fear of loss, not desire. I called off the engagement and left.",
    outcome: "Status: Broken engagement. Seeking enthusiastic commitment.",
    author: "@no_more_waiting"
  },
  'should-i-forgive-cheating': {
    title: "2-Years Progress: Can trust be restored after cheating?",
    update: "We stayed together after his emotional affair. He went into dedicated individual therapy and fully opened his phone and bank accounts with zero defensiveness. It took two full years of consistent behavior, but we have successfully restored our foundation.",
    outcome: "Status: Stayed. Trust successfully restored through work.",
    author: "@healing_together"
  },
  'will-i-regret-divorce': {
    title: "1-Year After Divorce: Financial impact vs. Mental peace",
    update: "I filed for divorce after 12 years of marriage. The financial division was incredibly difficult, and co-parenting is still a work in progress. But the absolute emotional peace I feel walking into my own quiet home every evening is worth every single penny.",
    outcome: "Status: Divorced. Financial sacrifice, but complete mental peace.",
    author: "@peaceful_home"
  },
  'red-flags-i-ignored': {
    title: "1-Year Progress: Hiding behind potential",
    update: "I ignored early red flags like hidden contacts and family criticisms because I was in love with their potential. After the relationship crumbled, I realized people show you who they are right at the beginning. I'll never ignore my intuition again.",
    outcome: "Status: Left. Never overlooking early indicators again.",
    author: "@intuition_first"
  },
  'relationship-ultimatum': {
    title: "14-Months Update: The resentment after an ultimatum",
    update: "I gave a marriage ultimatum, and they complied. But the entire next year was filled with silent hostility and cold shoulders. An ultimatum can force compliance, but it cannot force enthusiastic love. We ended up breaking up anyway.",
    outcome: "Status: Compliance failed. Mutual separation.",
    author: "@honest_vows"
  }
};

const POPULAR_QUESTIONS_MAP: Record<string, Array<{ q: string; search: string }>> = {
  'should-i-leave': [
    { q: "Should I leave my relationship if I still love them?", search: "should i leave my relationship if i still love them" },
    { q: "How do you know when a relationship is truly over?", search: "how to know when a relationship is over" },
    { q: "What is the difference between relationship anxiety and gut feeling?", search: "relationship anxiety vs gut feeling" },
    { q: "How to leave a long-term partner when you live together?", search: "how to break up when you live together" }
  ],
  'will-i-regret': [
    { q: "Will I regret leaving my husband for someone else?", search: "regret leaving husband for someone else" },
    { q: "What percentage of women regret leaving their husband?", search: "percentage of women who regret leaving husband" },
    { q: "Do people regret leaving low-conflict marriages?", search: "regret leaving low conflict marriage" },
    { q: "How long does the regret of leaving a partner last?", search: "grief timeline after leaving a relationship" }
  ],
  'red-flags': [
    { q: "What are the most common relationship red flags?", search: "relationship red flags to look out for" },
    { q: "Is stonewalling a reason to break up?", search: "stonewalling in relationships" },
    { q: "How to handle a partner who deflects responsibility?", search: "deflection behavior in relationships" },
    { q: "How to spot subtle emotional manipulation early?", search: "covert emotional abuse signs" }
  ],
  'relationship-regrets': [
    { q: "Is it normal to feel intense regret right after a breakup?", search: "breakup regret phases" },
    { q: "How long does separation shock and grief last?", search: "separation shock timeline" },
    { q: "Will my ex regret letting me go?", search: "when do exes start to regret breakups" },
    { q: "How to rebuild independence after a long marriage?", search: "how to build life after divorce" }
  ],
  'commitment-issues': [
    { q: "How long is too long to wait for commitment?", search: "how long should i wait for commitment" },
    { q: "Why do men get commitment cold feet?", search: "commitment phobia in men" },
    { q: "Can commitment issues be cured without therapy?", search: "overcoming commitment issues" },
    { q: "Signs your partner will never marry you", search: "signs he does not want to marry you" }
  ],
  'trust-issues': [
    { q: "What are signs of emotional cheating?", search: "signs of emotional cheating" },
    { q: "Should I stay if my partner lied about something big?", search: "partner lied to me" },
    { q: "How do you handle a partner with a secret phone?", search: "secret phone in relationship" },
    { q: "Signs of financial infidelity and hidden bank accounts", search: "secret bank account husband" }
  ],
  'signs-he-doesnt-want-marriage': [
    { q: "What are early signs boyfriend won't marry you?", search: "boyfriend wont marry me" },
    { q: "Is waiting 5 years for a proposal too long?", search: "how long to wait for a proposal" },
    { q: "Why does he avoid marriage talks but stays with me?", search: "why does he avoid marriage talks" },
    { q: "What is a 'Shut Up Ring' and does it work?", search: "shut up ring signs" }
  ],
  'should-i-forgive-cheating': [
    { q: "Can a relationship fully heal after infidelity?", search: "should i forgive cheating" },
    { q: "What are the success rates of forgiving a cheater?", search: "success rates after cheating" },
    { q: "How do you know if a cheater is genuinely remorseful?", search: "signs of genuine remorse after cheating" },
    { q: "Is kissing someone else considered cheating?", search: "is kissing cheating" }
  ],
  'will-i-regret-divorce': [
    { q: "Will I regret divorcing my husband of 10+ years?", search: "will i regret divorce" },
    { q: "How does divorce affect children in the long term?", search: "divorce children long term impact" },
    { q: "How do women cope with financial decline after divorce?", search: "financial impact of divorce on women" },
    { q: "How to find emotional peace during a divorce process?", search: "how to cope with divorce stress" }
  ],
  'red-flags-i-ignored': [
    { q: "What are the biggest red flags women wish they hadn't ignored?", search: "red flags i ignored" },
    { q: "Why do we make excuses for red flags early on?", search: "why we ignore red flags" },
    { q: "Is hiding contacts or social media a red flag?", search: "hiding social media in relationship" },
    { q: "How to trust your intuition after ignoring red flags?", search: "how to trust your gut again" }
  ],
  'relationship-ultimatum': [
    { q: "Do marriage ultimatums ever work?", search: "relationship ultimatum" },
    { q: "Does giving an ultimatum cause resentment?", search: "ultimatum resentment" },
    { q: "How to state a commitment deadline without an ultimatum?", search: "how to communicate boundaries" },
    { q: "What happens if they choose to leave after an ultimatum?", search: "handling ultimatum breakup" }
  ]
};

export default function HubScreen({ 
  slug, 
  stories, 
  courtCases, 
  questions, 
  redFlagCases, 
  setScreen 
}: HubScreenProps) {

  // Auto-scroll to top when slug changes (i.e. different hub link clicked)
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [slug]);

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
  // WIDGET STATE: TRUST-ISSUES (Checklist)
  // ==========================================
  const [trustAnswers, setTrustAnswers] = useState<Record<number, boolean>>({});
  const trustQuestions = [
    { id: 1, text: "Are there frequent gaps or discrepancies in their explanations of where they've been or who they were with?" },
    { id: 2, text: "Does your partner actively tilt their phone away, use a secret passcode, or clear notifications quickly around you?" },
    { id: 3, text: "Have they maintained hidden bank accounts, secret cards, or made major financial choices without your knowledge?" },
    { id: 4, text: "Are they still maintaining secretive or emotionally intimate contact with an ex despite agreed boundaries?" },
    { id: 5, text: "When you confront them with reasonable questions, do they deflect by accusing you of paranoia, jealousy, or insecurity?" }
  ];
  
  const handleToggleTrust = (id: number) => {
    setTrustAnswers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const trustScore = useMemo(() => {
    const answeredCount = Object.values(trustAnswers).filter(Boolean).length;
    return (answeredCount / trustQuestions.length) * 100;
  }, [trustAnswers]);

  // ==========================================
  // WIDGET STATE: SIGNS-HE-DOESNT-WANT-MARRIAGE (Calculator)
  // ==========================================
  const [marriageDatingDuration, setMarriageDatingDuration] = useState<string>('3-5 Years');
  const [marriagePartnerAge, setMarriagePartnerAge] = useState<string>('26-30');
  
  const marriageOutcomeStats = useMemo(() => {
    if (marriageDatingDuration === '1-2 Years') {
      return { 
        verdict: "Early Stage Assessment", 
        advice: "Dating for under 2 years is often an exploratory period. 72% of long-term happy couples suggest focusing on character assessment before introducing marriage timelines." 
      };
    } else if (marriageDatingDuration === '3-5 Years') {
      return { 
        verdict: "Gridlock & Stalling Risk", 
        advice: "In this phase, stalling is highly indicative. 68% of contributors who waited past year 4 without clear timeline agreements reported wishing they set firm boundaries sooner." 
      };
    } else {
      return { 
        verdict: "Chronic Stalling or Value Mismatch", 
        advice: "Statistically, waiting 5+ years without a clear commitment or proposal plans often leads to deep resentment. If a partner is comfortable with the status quo, the situation rarely changes without a conscious separation." 
      };
    }
  }, [marriageDatingDuration]);

  // ==========================================
  // WIDGET STATE: SHOULD-I-FORGIVE-CHEATING (Calculator)
  // ==========================================
  const [cheatingTherapy, setCheatingTherapy] = useState<string>('no');
  const [cheatingAccountability, setCheatingAccountability] = useState<string>('defensive');
  
  const cheatingProspect = useMemo(() => {
    let successRate = 12;
    let advice = "Rebuilding is extremely difficult. If they are defensive, minimize the betrayal, or blame external factors, the chance of repeat infidelity is extremely high.";
    if (cheatingAccountability === 'full' && cheatingTherapy === 'yes') {
      successRate = 58;
      advice = "With full transparency and couples therapy, some relationships recover. However, it takes 18-24 months of consistent effort to regain basic trust.";
    } else if (cheatingAccountability === 'full') {
      successRate = 28;
      advice = "While they take ownership, professional guidance is highly recommended to uncover underlying relationship dynamics and avoid silent resentment.";
    }
    return { successRate, advice };
  }, [cheatingTherapy, cheatingAccountability]);

  // ==========================================
  // WIDGET STATE: WILL-I-REGRET-DIVORCE (Simulator)
  // ==========================================
  const [divorceDuration, setDivorceDuration] = useState<string>('5-10 Years');
  const [divorceSpark, setDivorceSpark] = useState<string>('no');

  const divorceOutcome = useMemo(() => {
    if (divorceSpark === 'no') {
      return {
        regretRate: "14%",
        status: "Low Regret / High Long-Term Satisfaction",
        advice: "When the romantic/emotional spark is gone and communication has fully broken down, over 85% of divorcees reported feeling high levels of relief and personal autonomy within 12 months."
      };
    } else {
      return {
        regretRate: "38%",
        status: "Moderate Regret Risk",
        advice: "If affection remains but communication is poor, couples therapy has a high success rate. Walking away without trying counseling first leads to higher rates of retrospective doubt."
      };
    }
  }, [divorceSpark]);

  // ==========================================
  // WIDGET STATE: RED-FLAGS-I-IGNORED (Selector)
  // ==========================================
  const [ignoredFlags, setIgnoredFlags] = useState<Record<string, boolean>>({});
  const ignoredFlagsList = [
    { id: 'phone', label: "Secretive phone / hidden notifications" },
    { id: 'ex', label: "Constant contact / comparisons with their ex" },
    { id: 'money', label: "Hiding finances or controlling cash" },
    { id: 'mood', label: "Walking on eggshells around their temper" },
    { id: 'isolation', label: "Subtle jokes or criticisms about my family/friends" }
  ];
  
  const handleToggleIgnoredFlag = (id: string) => {
    setIgnoredFlags(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const ignoredFlagsCount = useMemo(() => {
    return Object.values(ignoredFlags).filter(Boolean).length;
  }, [ignoredFlags]);

  // ==========================================
  // WIDGET STATE: RELATIONSHIP-ULTIMATUM (Simulator)
  // ==========================================
  const [ultimatumType, setUltimatumType] = useState<string>('marriage');
  const ultimatumStats = useMemo(() => {
    if (ultimatumType === 'marriage') {
      return {
        successRate: "22%",
        advice: "Only 1 in 5 couples who married via an ultimatum reported feeling satisfied 3 years later. Resentment is the primary risk."
      };
    } else if (ultimatumType === 'moving') {
      return {
        successRate: "35%",
        advice: "Relocating under duress often transfers career frustration onto the partner. Independent career pathing is essential."
      };
    } else {
      return {
        successRate: "18%",
        advice: "Forcing a partner to cut off friends or change deep-seated habits via ultimatum rarely produces lasting internal change."
      };
    }
  }, [ultimatumType]);

  const relevantStories = useMemo(() => {
    const filtered = stories.filter(st => {
      const lowerTitle = st.title.toLowerCase();
      const lowerStory = st.fullStory.toLowerCase();
      const lowerSlug = st.situationSlug ? st.situationSlug.toLowerCase() : '';
      const tags = st.tags ? st.tags.map(t => t.toLowerCase()) : [];
      
      if (slug === 'should-i-leave') {
        return lowerSlug.includes('leave') || lowerTitle.includes('leave') || lowerStory.includes('leave') || lowerStory.includes('break up') || lowerStory.includes('split') || tags.includes('divorce') || tags.includes('breakup');
      }
      if (slug === 'will-i-regret' || slug === 'will-i-regret-divorce') {
        return lowerStory.includes('regret') || lowerTitle.includes('regret') || tags.includes('regret') || tags.includes('divorce') || tags.includes('children');
      }
      if (slug === 'red-flags' || slug === 'red-flags-i-ignored') {
        return lowerStory.includes('flag') || lowerStory.includes('warning') || lowerTitle.includes('flag') || tags.includes('red-flags');
      }
      if (slug === 'relationship-regrets') {
        return lowerStory.includes('regret') || lowerTitle.includes('regret') || tags.includes('regret');
      }
      if (slug === 'commitment-issues' || slug === 'signs-he-doesnt-want-marriage' || slug === 'relationship-ultimatum') {
        return lowerStory.includes('marry') || lowerStory.includes('proposal') || lowerStory.includes('commitment') || lowerStory.includes('ultimatum') || tags.includes('marriage') || tags.includes('commitment');
      }
      if (slug === 'trust-issues' || slug === 'should-i-forgive-cheating') {
        return lowerStory.includes('cheat') || lowerStory.includes('infidelity') || lowerStory.includes('trust') || lowerStory.includes('lie') || tags.includes('cheating') || tags.includes('infidelity');
      }
      return true;
    });
    return filtered.length > 0 ? filtered : stories;
  }, [stories, slug]);

  const outcomeStory = OUTCOME_STORIES[slug];
  const popularQuestions = POPULAR_QUESTIONS_MAP[slug] || [];

  // ==========================================
  // RENDER SECTIONS
  // ==========================================
  return (
    <div className="space-y-12 pb-24 animate-fadeIn" id="seo-hub-landing-stage">
      
      {/* 1. HERO MAIN SECTION */}
      {slug === 'should-i-leave' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Heart className="h-3 w-3 animate-pulse" /> Should I Leave My Relationship?
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Should I Leave My Partner? <br />
            <span className="text-gray-600 font-medium">Deciding Whether to Stay or Walk Away</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Reflecting on whether to stay or leave can feel overwhelming. Read raw outcome stories from real couples facing relationship fatigue and breakup doubts.
          </p>
        </div>
      )}

      {slug === 'will-i-regret' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="h-3 w-3" /> Will I Regret Leaving My Husband?
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Will I Regret Leaving My Partner? <br />
            <span className="text-gray-600 font-medium">Looking at 1-Year Later Outcomes</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Understand how similar situation decisions turned out for others. Easing decision anxiety with real timeline updates and reflections on life-defining choices.
          </p>
        </div>
      )}

      {slug === 'red-flags' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4B942]/10 text-[#F4B942] border border-[#F4B942]/20">
            <AlertTriangle className="h-3 w-3 animate-bounce" /> Relationship Red Flags
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Relationship Red Flags Checklist <br />
            <span className="text-gray-600 font-medium">Spotting warning signs you shouldn't ignore</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Is it a red flag if he still talks to his ex? Reflect on recurring partner behaviors, phone hiding habits, and evaluate danger scores based on community experience.
          </p>
        </div>
      )}

      {slug === 'relationship-regrets' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="h-3 w-3" /> Relationship Regrets Registry
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Real Relationship Regrets & Stories <br />
            <span className="text-gray-600 font-medium">Lessons from people who have been there</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            A curated database of anonymous timeline stories, breakup regrets, post-separation adjustments, and wisdom shared openly by real couples.
          </p>
        </div>
      )}

      {slug === 'commitment-issues' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="h-3 w-3" /> Commitment Issues & Marriage Doubts
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Commitment, Marriage & Future Doubts <br />
            <span className="text-gray-600 font-medium">Navigating alignment and timeline friction</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Discuss marriage, kids mismatches, or relocating for love. Review shared experiences on how others handled family timelines and career-defining choices.
          </p>
        </div>
      )}

      {slug === 'trust-issues' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldCheck className="h-3 w-3" /> Trust Issues & Lies
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Trust Issues: Partner Lies & Hidden Habits <br />
            <span className="text-gray-600 font-medium">Analyzing secretive phones and hiding things</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Wondering if they are emotional cheating or keeping a secret bank account? Use our trust checklist to process your situation through shared relationship data.
          </p>
        </div>
      )}

      {slug === 'signs-he-doesnt-want-marriage' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Clock className="h-3 w-3" /> Signs He Doesn't Want Marriage
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Signs He Doesn't Want to Get Married <br />
            <span className="text-gray-600 font-medium">How long should you wait for a proposal?</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Are you waiting for a proposal while your boyfriend avoids marriage talks? Read actual timelines and outcomes from others who stood where you are now.
          </p>
        </div>
      )}

      {slug === 'should-i-forgive-cheating' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <Heart className="h-3 w-3" /> Should I Forgive Cheating?
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Should I Stay or Leave After Cheating? <br />
            <span className="text-gray-600 font-medium">Restoring trust vs avoiding repeated infidelity</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Caught your partner kissing an ex or hiding dating profiles? Look at real success rates and honest feedback from people who stayed or left after cheating.
          </p>
        </div>
      )}

      {slug === 'will-i-regret-divorce' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Scale className="h-3 w-3" /> Will I Regret Divorce?
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Will I Regret Divorcing My Husband? <br />
            <span className="text-gray-600 font-medium">Navigating emotional peace vs financial and kid impacts</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Fearing regret after filing for divorce? Review honest 1-year updates from individuals who chose separation and how they rate their peace of mind.
          </p>
        </div>
      )}

      {slug === 'red-flags-i-ignored' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <AlertTriangle className="h-3 w-3" /> Red Flags I Ignored
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            The Biggest Relationship Red Flags I Ignored <br />
            <span className="text-gray-600 font-medium">Why did I overlook early warning signs?</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Read stories of warning signs partners wish they hadn't excused away, from hidden snapchats to subtle isolation. Avoid making the same blindspot mistakes.
          </p>
        </div>
      )}

      {slug === 'relationship-ultimatum' && (
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Scale className="h-3 w-3" /> Relationship Ultimatums
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#000000] tracking-tight leading-tight">
            Should I Give an Ultimatum? <br />
            <span className="text-gray-600 font-medium">Do marriage/commitment ultimatums cause resentment?</span>
          </h1>
          <p className="text-[#000000] text-sm sm:text-base leading-relaxed">
            Explore whether ultimatums save relationships or trigger silent breakups. Learn how real couples handled commitment deadlines.
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

          {slug === 'trust-issues' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" /> Trust Erosion Checklist
                </h2>
                <span className="font-mono text-xs text-amber-500">Self-Reflection</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Has your trust been compromised? Tick the behaviors you are experiencing:
              </p>
              
              <div className="space-y-3 pt-2">
                {trustQuestions.map(q => (
                  <button 
                    key={q.id}
                    onClick={() => handleToggleTrust(q.id)}
                    className={`w-full flex items-start gap-3.5 text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      trustAnswers[q.id] 
                      ? 'bg-amber-500/5 border-amber-500/40 text-white' 
                      : 'bg-[#0D1117]/60 border-[#30363D] hover:border-[#4F8CFF]/50 text-gray-300'
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 border uppercase font-black text-[10px] transition-all ${
                      trustAnswers[q.id] 
                      ? 'bg-amber-500 border-amber-500 text-white' 
                      : 'border-gray-500 text-transparent'
                    }`}>
                      ✓
                    </div>
                    <span className="text-xs sm:text-sm">{q.text}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-[#30363D]/60 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Trust Alignment Score:</span>
                  <span className={`font-mono font-bold text-sm ${trustScore >= 60 ? 'text-amber-400 animate-pulse' : 'text-green-400'}`}>
                    {Math.round(trustScore)}% Compromised
                  </span>
                </div>
                <div className="relative w-full h-2 rounded-full bg-[#0D1117] overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${trustScore >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${trustScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed bg-[#0D1117] p-3 rounded-xl border border-[#30363D]/40">
                  {trustScore >= 60 
                    ? "💡 CRITICAL TRUST GAP: Secret phone passcodes, hidden bank accounts, or emotional deflection are high-severity trust risks. Real stories indicate that without deep, honest accountability and professional counseling, repeating patterns are highly likely." 
                    : "✔️ AMBIENT TRUST ISSUES: Moderate scores suggest communication gaps rather than outright secrets. Read our Advice board on emotional cheating to clarify healthy boundaries."}
                </p>
              </div>
            </div>
          )}

          {slug === 'signs-he-doesnt-want-marriage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-pink-400" /> Marriage Timeline Assessment
                </h2>
                <span className="font-mono text-xs text-pink-400 font-bold">Timeline Tool</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                See statistical outcome perspectives by entering your current relationship stage:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">How Long Have You Dated?</label>
                  <select 
                    value={marriageDatingDuration}
                    onChange={(e) => setMarriageDatingDuration(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="1-2 Years">1 to 2 Years</option>
                    <option value="3-5 Years">3 to 5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Partner's Age Group</label>
                  <select 
                    value={marriagePartnerAge}
                    onChange={(e) => setMarriagePartnerAge(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="18-25">18 - 25 years old</option>
                    <option value="26-30">26 - 30 years old</option>
                    <option value="31-40">31 - 40 years old</option>
                    <option value="40+">Over 40 years old</option>
                  </select>
                </div>
              </div>

              {/* Estimate output block */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3 p-4 bg-[#0D1117]/80 rounded-2xl border border-[#30363D]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consensus Verdict:</span>
                  <span className="text-xs font-bold text-pink-400 px-2 py-0.5 rounded-full bg-pink-400/10 border border-pink-400/20">{marriageOutcomeStats.verdict}</span>
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed pt-2">
                  {marriageOutcomeStats.advice}
                </p>
              </div>
            </div>
          )}

          {slug === 'should-i-forgive-cheating' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" /> Trust Restoration Estimator
                </h2>
                <span className="font-mono text-xs text-red-400 font-bold">Analysis Tool</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Evaluate the likelihood of successfully restoring trust based on behavioral markers:
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Are they in Professional Therapy?</label>
                    <select 
                      value={cheatingTherapy}
                      onChange={(e) => setCheatingTherapy(e.target.value)}
                      className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                    >
                      <option value="no">No counseling / refused individual therapy</option>
                      <option value="yes">Yes, actively in dedicated individual/couples therapy</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Partner's Accountability Level</label>
                    <select 
                      value={cheatingAccountability}
                      onChange={(e) => setCheatingAccountability(e.target.value)}
                      className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                    >
                      <option value="defensive">Defensive / blames you or alcohol</option>
                      <option value="partial">Partial (apologizes but hides details)</option>
                      <option value="full">Full (owns responsibility, fully open phone/logs)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Estimate output block */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3 p-4 bg-[#0D1117]/80 rounded-2xl border border-[#30363D]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Est. Rebuilding Success Rate:</span>
                  <span className="text-xs font-bold text-green-400 px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20">{cheatingProspect.successRate}% Success Likelihood</span>
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed pt-2">
                  {cheatingProspect.advice}
                </p>
              </div>
            </div>
          )}

          {slug === 'will-i-regret-divorce' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-slate-400" /> Divorce Regret Simulator
                </h2>
                <span className="font-mono text-xs text-slate-400 font-bold">Simulator Tool</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Assess retrospective regret rates for divorce decisions by specifying key marriage markers:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">How Long Were You Married?</label>
                  <select 
                    value={divorceDuration}
                    onChange={(e) => setDivorceDuration(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="1-5 Years">1 to 5 Years</option>
                    <option value="5-10 Years">5 to 10 Years</option>
                    <option value="10+ Years">Over 10 Years</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Does Emotional Spark or Friendship Remain?</label>
                  <select 
                    value={divorceSpark}
                    onChange={(e) => setDivorceSpark(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="no">No, complete indifference or constant hostility</option>
                    <option value="yes">Yes, we still have deep affection but poor communication</option>
                  </select>
                </div>
              </div>

              {/* Estimate output block */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3 p-4 bg-[#0D1117]/80 rounded-2xl border border-[#30363D]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Est. Retrospective Regret Rate:</span>
                  <span className="text-xs font-bold text-red-400 px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20">{divorceOutcome.regretRate} Regret</span>
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed pt-2">
                  <strong>Status:</strong> {divorceOutcome.status}<br />
                  <span className="block mt-1 text-gray-400">{divorceOutcome.advice}</span>
                </p>
              </div>
            </div>
          )}

          {slug === 'red-flags-i-ignored' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" /> Red Flags Selector
                </h2>
                <span className="font-mono text-xs text-yellow-500 font-bold">Blindspot Tool</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Select the warning signs you've observed to view community outcomes for similar situations:
              </p>

              <div className="space-y-3 pt-2">
                {ignoredFlagsList.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => handleToggleIgnoredFlag(f.id)}
                    className={`w-full flex items-center gap-3.5 text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      ignoredFlags[f.id] 
                      ? 'bg-yellow-500/5 border-yellow-500/40 text-white' 
                      : 'bg-[#0D1117]/60 border-[#30363D] hover:border-[#4F8CFF]/50 text-gray-300'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                      ignoredFlags[f.id] 
                      ? 'bg-yellow-500 border-yellow-500 text-black' 
                      : 'border-gray-500 text-transparent'
                    }`}>
                      ✓
                    </div>
                    <span className="text-xs sm:text-sm">{f.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-[#30363D]/60 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Blindspot Warning Score:</span>
                  <span className={`font-mono font-bold text-sm ${ignoredFlagsCount >= 2 ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>
                    {ignoredFlagsCount * 20}% Risk Intensity
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed bg-[#0D1117] p-3 rounded-xl border border-[#30363D]/40">
                  {ignoredFlagsCount >= 2 
                    ? "💡 SEVERE WARNING SIGNS: Ignoring multiple red flags is the #1 most-regretted relationship behavior. Survivors state that these patterns do not dissolve with time; they expand. Trust your instinct." 
                    : "✔️ MINIMAL FLAG RATIO: Keep communication channels direct and open. Ensure your boundaries remain firm and defined."}
                </p>
              </div>
            </div>
          )}

          {slug === 'relationship-ultimatum' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-purple-400" /> Ultimatum Impact Simulator
                </h2>
                <span className="font-mono text-xs text-purple-400 font-bold">Simulator Tool</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Select the category of relationship ultimatum to explore crowdsourced long-term outcome rates:
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">What is the Ultimatum About?</label>
                  <select 
                    value={ultimatumType}
                    onChange={(e) => setUltimatumType(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl p-3 text-xs focus:border-[#4F8CFF] outline-none"
                  >
                    <option value="marriage">Marriage Deadline (e.g. 'Propose by Year X or I leave')</option>
                    <option value="moving">Relocation/Career Mismatch ('Move with me or we break up')</option>
                    <option value="habits">Habit / Friend Isolation ('Stop talking to X or I walk')</option>
                  </select>
                </div>
              </div>

              {/* Estimate output block */}
              <div className="pt-4 border-t border-[#30363D]/60 space-y-3 p-4 bg-[#0D1117]/80 rounded-2xl border border-[#30363D]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Crowdsourced Success Rate:</span>
                  <span className="text-xs font-bold text-purple-400 px-2 py-0.5 rounded-full bg-purple-400/10 border border-purple-500/20">{ultimatumStats.successRate} Happily Together</span>
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed pt-2">
                  {ultimatumStats.advice}
                </p>
              </div>
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

      {/* 3. WHAT HAPPENED NEXT: OUTCOME STORIES FOR HIGHLIGHTED RECALL */}
      {outcomeStory && (
        <div className="bg-[#1C2128] border-2 border-indigo-500/40 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                What Happened Next: 1-Year Retrospective Update
              </h2>
            </div>
            <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Verified Post-Decision Story
            </span>
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="text-base sm:text-lg font-bold text-white italic">
              "{outcomeStory.title}"
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {outcomeStory.update}
            </p>
          </div>
          <div className="pt-4 border-t border-[#30363D]/60 flex flex-wrap justify-between items-center gap-3 text-xs">
            <span className="font-mono text-green-400 font-bold bg-green-500/5 px-3 py-1 rounded-full border border-green-500/20">
              {outcomeStory.outcome}
            </span>
            <span className="text-gray-400">Shared anonymously by {outcomeStory.author}</span>
          </div>
        </div>
      )}

      {/* 4. RETRIEVE RELEVANT REAL STORIES & CASES DYNAMIC SECTIONS */}
      <div className="space-y-6 pt-6">
        <h2 className="text-xl sm:text-2xl font-black text-[#000000] flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#F4B942]" /> Real Outcome Dossiers & Verified Timelines
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relevantStories.slice(0, 3).map((st) => (
            <div 
              key={st.id}
              onClick={() => setScreen({ type: 'regret_stories', slug: st.id })}
              className="bg-[#161B22] border border-[#30363D] p-5 sm:p-6 rounded-3xl hover:border-[#4F8CFF] hover:bg-[#1c212a] cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-sm group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {st.decisionMade === 'Stayed' ? 'Stayed' : 'Left'} • {st.relationshipDuration}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{st.country}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#4F8CFF] transition-colors">
                  {st.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {st.fullStory}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScreen({ type: 'regret_stories', slug: st.id });
                }}
                className="w-full py-2 bg-[#21262D] group-hover:bg-[#30363D] text-white border border-[#30363D] group-hover:border-[#4F8CFF]/50 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Read Full Story Timeline</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. ACTIVE COMMUNITY RELATIONSHIP JURY TRIALS GRID */}
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
              
              const isExpired = !cCase.createdAt || (new Date(cCase.createdAt).getTime() + (cCase.deliberationDays || 3) * 24 * 60 * 60 * 1000) <= Date.now();
              
              return (
                <div 
                  key={cCase.slug}
                  className={`${bgClass} border border-[#30363D]/80 p-5 rounded-3xl hover:border-yellow-500/30 transition-all flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-500">{cCase.caseNumber || 'CASE-X'}</span>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Ended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
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

      {/* 6. COMMUNITY ADVICE DEBATES */}
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

      {/* 7. POPULAR QUESTIONS (SEO INTERNAL LINKS MAGNET) */}
      {popularQuestions.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-[#30363D]/40">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> Popular Questions on this Topic
            </h2>
            <p className="text-xs text-gray-500">Related searches answered anonymously by the community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularQuestions.map((pq, index) => (
              <button 
                key={index}
                onClick={() => setScreen({ type: 'explore', slug: pq.search })}
                className="flex items-center justify-between text-left p-4 rounded-2xl bg-[#161B22] border border-[#30363D] hover:border-[#4F8CFF]/50 transition-all cursor-pointer group"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{pq.q}</span>
                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-all shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
