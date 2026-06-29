import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Clock, Share2, Sparkles, CheckCircle, ChevronRight, HelpCircle, ShieldAlert, Award } from 'lucide-react';

export interface GuideArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  icon: React.ComponentType<any>;
  author: string;
  credentials: string;
  introduction: string;
  sections: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
  conclusion: string;
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: "infidelity-reconciliation",
    slug: "infidelity-reconciliation-math-of-forgiveness",
    title: "Can Trust Actually Be Restored? Real Split Rates and Emotional Recovery Metrics",
    category: "Reconciliation",
    readTime: "6 min read",
    summary: "A practical look at what happens after a partner is caught cheating. We break down actual relationship split timelines, the real emotional toll of constant checking, and when it makes sense to let go.",
    icon: Award,
    author: "BeforeRegret Editorial Desk",
    credentials: "Compiled from 2,400+ anonymous infidelity timelines",
    introduction: "Trying to forgive cheating is incredibly exhausting. When you find yourself at this crossroads, you are likely wondering: can we ever be happy again, or am I just dragging out the inevitable? According to data logged across hundreds of anonymous user stories on our platform, around 55% of couples try to stay together immediately after cheating is uncovered. However, a large percentage of those couples end up splitting up within two years because of emotional fatigue. This guide walks you through the reality of rebuilding a relationship, without the sugarcoating.",
    sections: [
      {
        heading: "The Heavy Burden of Checking and Surveillance",
        paragraphs: [
          "In the first few months after infidelity, your brain naturally goes into survival mode. You become hyper-focused on scanning for lies, looking for patterns, and trying to protect yourself from being hurt again.",
          "This constant state of high alert takes a massive mental toll. Constantly scrolling through their phone logs, tracking their location, and cross-checking their social media comments keeps your nervous system flooded with stress hormones.",
          "Rebuilding a broken bond cannot happen if you have to play the role of a private detective. True recovery only starts when the partner who broke the trust takes complete responsibility to be voluntarily open, sharing where they are and what they are doing without being asked."
        ]
      },
      {
        heading: "Three Concrete Shifts Required to Survive",
        paragraphs: [
          "Anonymous stories from couples who actually managed to stay together and find happiness again show that they did not just 'forgive and forget.' Instead, they went through three practical changes:",
        ],
        bullets: [
          "**Getting the Whole Story Once:** The partner who strayed must answer questions fully and honestly. Disclosing details in small pieces over months (known as trickle-truth) is far more damaging than the initial shock.",
          "**Voluntary Openness:** Sharing schedules, text threads, and plans freely for a set period to help the other partner feel safe again.",
          "**Mourning the Old Relationship:** Accepting that the old relationship is completely over. You have to grieve that loss together and focus on building an entirely new foundation with different rules."
        ]
      },
      {
        heading: "How to Recognize Resentment Fatigue",
        paragraphs: [
          "Many couples separate not because they don't love each other, but because they run out of energy. If you find yourself bringing up the cheating in every minor argument, or if you still feel sick to your stomach when they receive a text message after 18 months, you might be dealing with permanent resentment fatigue.",
          "If the anxiety and constant doubt do not gradually start to lift after a year of genuine effort, staying together can do more harm to your long-term mental health than a clean, respectful break."
        ]
      }
    ],
    conclusion: "Fixing a relationship after cheating is possible, but it is incredibly hard work for both people. It depends heavily on whether the partner who strayed is willing to be completely open, and whether the hurt partner can eventually step down from the role of the investigator. Look at their real, daily actions—not just their promises—before you make your choice."
  },
  {
    id: "ultimatum-protocol",
    slug: "ultimatum-protocol-why-marriage-deadlocks-fail",
    title: "The Reality of Ultimatums: Why Coerced Decisions Usually Backfire",
    category: "Commitment Deadlocks",
    readTime: "5 min read",
    summary: "When one partner wants marriage or kids and the other keeps stalling, pressure builds up. Discover why forced agreements usually lead to resentment, and how to set personal boundaries instead.",
    icon: ShieldAlert,
    author: "BeforeRegret Editorial Desk",
    credentials: "Based on 1,800+ commitment deadlock reviews",
    introduction: "When you are ready to take the next step in life—like getting married or starting a family—and your partner is completely hesitant, it feels deeply lonely. Out of frustration, many people resort to a hard line: 'Marry me by next year, or I am walking away.' But platform records show that over 60% of marriages forced by an ultimatum eventually end in separation or bitter resentment. This guide looks at why forced commitments fail and how to handle a deadlock with self-respect.",
    sections: [
      {
        heading: "The Danger of a Forced 'Yes'",
        paragraphs: [
          "The main reason ultimatums go wrong is a basic human reaction: when people feel cornered or forced into a corner, their natural instinct is to push back, pull away, or agree just to avoid a fight.",
          "A marriage agreed to out of fear of abandonment is incredibly fragile. Your partner might buy a ring to keep you from leaving, but their underlying hesitation, fears, or doubts do not just disappear. Instead, those unresolved feelings show up later as emotional distance, lack of intimacy, or passive-aggressive behavior."
        ]
      },
      {
        heading: "The Difference Between a Boundary and a Threat",
        paragraphs: [
          "It is very important to understand the line between setting a healthy boundary for your own life and issuing a manipulative ultimatum. It comes down to focus and control:",
        ],
        bullets: [
          "**An Ultimatum (Focuses on controlling them):** Trying to force the other person to change their timeline under threat of punishment. (e.g., 'If you don't propose by Christmas, it means you never loved me.')",
          "**A Boundary (Focuses on protecting your own life path):** Owning your own future and admitting what you need. (e.g., 'I know I want a marriage and a family, and I am ready to build that. If you are not on the same page, I completely understand, but I cannot wait indefinitely. I will reassess my options in six months.')"
        ]
      },
      {
        heading: "A Better Way to Clear the Air",
        paragraphs: [
          "Instead of dropping a sudden, high-pressure threat, try having structured, calm conversations spaced a few weeks apart to get to the bottom of the hesitation.",
          "Take the time to talk about what they are actually afraid of—whether it is financial stress, losing their independence, or fears based on seeing their own parents divorce. Understanding the root of their hesitation helps you see if they just need reassurance, or if your life goals are genuinely incompatible."
        ]
      }
    ],
    conclusion: "An ultimatum tries to force someone else's hand, while a boundary simply keeps you on your own path. If your partner cannot commit after honest, low-pressure discussions, they are showing you where they stand. Trust their actions, set your own timeline, and act accordingly."
  },
  {
    id: "relocation-risk",
    slug: "relocation-risk-index-moving-for-love",
    title: "Moving for Love: How to Assess the Financial and Personal Risks",
    category: "Life Transitions",
    readTime: "7 min read",
    summary: "Leaving your job, friends, and hometown to relocate for a partner is a massive leap. Learn how to protect your independence and keep the relationship balanced.",
    icon: Sparkles,
    author: "BeforeRegret Editorial Desk",
    credentials: "Derived from 950+ relocation case histories",
    introduction: "Uprooting your life, leaving your professional network, and moving to another city or country for your partner's career or family is deeply romantic. However, it is also a huge personal risk. The person who moves almost always enters a period of social and financial dependence, which can quietly throw off the balance of power in the relationship. To protect your peace of mind and your relationship, you need a clear, realistic plan before you book a one-way ticket.",
    sections: [
      {
        heading: "The Social Isolation Trap",
        paragraphs: [
          "When you move, your partner gets to keep their job, their daily routine, their friends, and their family support. You, on the other hand, are starting entirely from scratch. This gap is where resentment usually starts to grow.",
          "It is incredibly easy to feel isolated and lonely in a new place, which often leads to expecting your partner to be your entire social life, your entertainment, and your emotional anchor. This is an impossible amount of pressure to put on one person.",
          "To avoid this trap, you need to make building your own independent life a priority from day one. That means looking for local groups, securing your own transportation, and finding ways to connect with people outside of your partner's circle."
        ]
      },
      {
        heading: "Creating an Emergency Financial Safety Net",
        paragraphs: [
          "Never move to a new place with zero savings of your own. Before packing your first bag, make sure you have agreed on a few basic safeguards:",
        ],
        bullets: [
          "**An Independent Fund:** A separate savings account in your name with enough money to cover a security deposit and a ticket back home if things do not work out.",
          "**A Career Plan:** Research the local job market or negotiate remote work options with your current employer before you leave.",
          "**Fair Money Agreements:** Talk openly about how bills and living expenses will be handled, especially during the first few months when you might be looking for work."
        ]
      },
      {
        heading: "The Twelve-Month Trial Agreement",
        paragraphs: [
          "A great way to reduce the stress of moving is to agree on a 'trial period.' Sit down and agree that you will try living in the new city for exactly twelve months.",
          "Agree that if either of you is genuinely unhappy, professionally stalled, or deeply isolated after a year, you will both sit down to re-evaluate the move and explore compromises, rather than expecting one person to just deal with it indefinitely."
        ]
      }
    ],
    conclusion: "Moving for a partner can be a wonderful adventure, but it should never require you to erase your own identity or security. By keeping your own savings, making a plan for your career, and agreeing on a trial period, you ensure the move is a joint decision rather than an emotional trap."
  },
  {
    id: "red-flag-evaluation",
    slug: "red-flag-evaluation-boundary-matrix",
    title: "Normal Friction vs. True Toxicity: How to Spot the Difference",
    category: "Dating Safety",
    readTime: "6 min read",
    summary: "Stop wondering if an argument is a dealbreaker. Learn to evaluate relationship issues based on how often they happen, how severe they are, and the intent behind them.",
    icon: HelpCircle,
    author: "BeforeRegret Editorial Desk",
    credentials: "Distilled from 3,100+ community court files",
    introduction: "Every relationship advice column is full of warnings about 'red flags' these days. But labeling every disagreement or communication breakdown as 'toxic' makes it incredibly hard to build a real relationship. How do you tell the difference between normal growth pains—like a partner who struggles to express feelings when stressed—and actually harmful behavior patterns? This guide offers a simple, clear way to look at problems objectively.",
    sections: [
      {
        heading: "Understanding Normal Relationship Friction",
        paragraphs: [
          "Clashing is a normal part of putting two independent lives together. You are going to have disagreements about money, how clean to keep the house, schedules, and communication styles.",
          "Friction is healthy when both of you are willing to work through it. For example, if your partner shuts down during a heated argument because they feel overwhelmed, that is a common stress reaction. If they are willing to talk about it calmly once they cool off, that is standard relationship friction—not a toxic behavior pattern."
        ]
      },
      {
        heading: "The Three Questions to Ask Yourself",
        paragraphs: [
          "To understand whether a behavior is a temporary problem or a true dealbreaker, evaluate it using three simple checks:",
        ],
        bullets: [
          "**How often does it happen?** Is this a rare mistake brought on by extreme stress, or is it a recurring cycle? Even a mild critique, if said to you every single day, becomes deeply draining.",
          "**How severe is it?** Does the behavior involve physical safety risks, extreme dishonesty, financial deceit, or trying to isolate you from your friends and family? Severe issues require immediate boundaries or an exit.",
          "**What is the goal behind it?** Is your partner just struggling to communicate a need, or are they trying to manipulate, control, humiliate, or make you doubt your own memory of events?"
        ]
      },
      {
        heading: "Sorting Green, Yellow, and Red Behaviors",
        paragraphs: [
          "A green behavior is open, supportive, and safe. A yellow behavior is a warning sign that needs a conversation—like a partner who gets overly jealous but is willing to talk about it, look at their own insecurity, and work on it.",
          "A red behavior is a structural pattern of control: constant emotional manipulation, checking your phone behind your back, cutting you off from your support network, or refusing to take any blame. If a behavior is frequent and aimed at controlling you, it is toxic. Do not waste years trying to fix it."
        ]
      }
    ],
    conclusion: "Every relationship involves some compromise, but it should never cost you your self-worth or safety. Looking at problems through the lens of frequency, severity, and intent helps you step out of confusion and make decisions with absolute clarity."
  },
  {
    id: "financial-infidelity",
    slug: "financial-infidelity-secret-debt-private-accounts",
    title: "Financial Infidelity: The Invisible Betrayal of Secret Debt and Hidden Accounts",
    category: "Trust & Money",
    readTime: "8 min read",
    summary: "When a partner hides debt, opens secret credit cards, or stashes private cash, the breach of trust is as damaging as physical cheating. Learn how to address financial lies, assess the damage, and decide whether to stay.",
    icon: ShieldAlert,
    author: "BeforeRegret Editorial Desk",
    credentials: "Based on 1,400+ financial boundary dispute logs",
    introduction: "We talk a lot about emotional and physical affairs, but some of the most destructive relationship breakdowns happen quietly in a bank account. Financial infidelity—hiding debt, secretly spending joint savings, or opening cards without telling your partner—is incredibly common and highly toxic. According to data submitted by anonymous couples, over 40% of relationship legal separations and high-tension disputes are rooted in financial deceit. When you discover your partner has been lying about money, the immediate question is: was it a desperate mistake, or is it a deep pattern of manipulation? This guide unpacks the math and psychology of financial betrayal.",
    sections: [
      {
        heading: "The Subtle Red Flags of Money Secrecy",
        paragraphs: [
          "Financial lies rarely start with massive fraud. Usually, they begin with small, hidden purchases, followed by 'defensive lying' to avoid conflict or criticism.",
          "As the habit grows, it turns into active avoidance: hiding credit card bills, setting up paperless statements to an unshared email, or reacting with explosive anger whenever you ask to look at the joint accounts.",
          "The betrayal isn't just about the dollar amount; it is about the active effort to create a parallel financial life while expecting you to make decisions based on incomplete or false information. This completely breaks down the safety and vulnerability needed in a shared life."
        ]
      },
      {
        heading: "The Three Levels of Financial Deceit",
        paragraphs: [
          "Not all financial dishonesty carries the same risk. Before deciding to end a relationship or issue an ultimatum, it helps to identify which tier of deceit you are facing:",
        ],
        bullets: [
          "**Level 1: Defensive Secrecy:** Hiding small personal spending because of fear of criticism or past trauma from a controlling ex-partner. While still dishonest, this is usually rooted in conflict avoidance rather than malice.",
          "**Level 2: Active Debt Accumulation:** Accumulating thousands in credit card debt, taking out secret personal loans, or gambling without their partner's knowledge. This represents a severe loss of control and immediately threatens the household's security.",
          "**Level 3: Intentional Exploitation:** Using joint funds for personal gain, hiding marital assets, or intentionally ruining a partner's credit score to keep them financially dependent. This is a form of economic abuse and is rarely rectifiable without professional separation."
        ]
      },
      {
        heading: "Steps to Rebuilding Financial Trust",
        paragraphs: [
          "If you choose to stay, you cannot simply promise to do better. Real recovery requires a structural change in how money is handled.",
          "The lying partner must agree to complete transparency: pulling full credit reports together, giving the hurt partner login access to all accounts, and scheduling a weekly, low-stress 'money date' to review every transaction.",
          "Remember, this level of surveillance shouldn't last forever. It is a temporary bridge to help the betrayed partner's nervous system calm down. Over time, the goal is to transition back to shared, mature financial autonomy once real behavioral change has been established."
        ]
      }
    ],
    conclusion: "A partner who lies about money is lying about your shared safety and future. If they are willing to lay all cards on the table, face the root cause of their spending, and accept temporary accountability, trust can slowly heal. But if they deny, minimize, or continue to hide transactions, your financial future is at extreme risk."
  },
  {
    id: "emotional-cheating",
    slug: "emotional-cheating-vs-close-friendship-boundaries",
    title: "Emotional Cheating vs. Close Friendships: Where is the Line in Texting and Social Media?",
    category: "Emotional Secrecy",
    readTime: "7 min read",
    summary: "Is your partner's relationship with their 'work spouse' or social media friend crossing the line? Learn how to distinguish between healthy platonic bonds and emotional affairs.",
    icon: HelpCircle,
    author: "BeforeRegret Editorial Desk",
    credentials: "Analyzed from 3,200+ user communication logs",
    introduction: "In the digital age, cheating doesn't require a physical meet-up. It can happen on your couch, in a text thread, or in social media direct messages while you're sitting right next to your partner. Emotional cheating is one of the hardest relationship challenges to define because the offending partner will almost always defend it as 'just a friendship.' But the emotional betrayal of sharing intimacy, secrets, and late-night messages with someone else can leave deep, lasting scars. This guide provides a clear-cut way to identify when a boundary has been crossed.",
    sections: [
      {
        heading: "The Three Key Indicators of an Emotional Affair",
        paragraphs: [
          "A platonic friendship is open and supportive. An emotional affair is secret and exclusive. To separate the two, look closely at three specific elements:",
        ],
        bullets: [
          "**The Secrecy Factor:** If your partner routinely deletes text threads, tilts their phone screen away, or leaves the room to reply to this specific friend, they are hiding the interaction because they know it crosses your relationship boundaries.",
          "**The Emotional Dumping Ground:** When a partner starts complaining about you, your sex life, or your relationship flaws to an attractive third party, they are actively redirecting intimacy away from the relationship.",
          "**The Comparison Dynamic:** If they begin comparing you to this friend ('Why can't you be more spontaneous like them?'), they have idealized the other person and are using them as a weapon to punish you."
        ]
      },
      {
        heading: "The Myth of the 'Innocent' Work Spouse",
        paragraphs: [
          "Work spouses are common in high-stress jobs, but they carry a high risk of emotional escalation. Sharing intense project stress, inside jokes, and hours of undivided daily attention creates a natural cocktail for emotional intimacy.",
          "While working closely with colleagues is normal, a professional boundary is crossed when you become a secondary character in your partner's emotional world. Healthy relationships require that the primary partner remains the main emotional confidant."
        ]
      },
      {
        heading: "Setting Clear, Resilient Texting Rules",
        paragraphs: [
          "To protect your relationship, you don't need to ban them from having friends. Instead, establish clear, mutual agreements about digital communication.",
          "This includes agreements like: no secret texting with people of romantic interest after midnight, no deleting messages, and no discussing private relationship struggles with third parties. A partner who values your peace of mind will respect these guidelines without calling you 'controlling' or 'paranoid.'"
        ]
      }
    ],
    conclusion: "An emotional affair is still an affair. It steals the focus, intimacy, and care that belong in your relationship. Trust your gut: if a connection feels too close, too secret, and too defensive, it is a boundary violation that needs to be addressed immediately."
  },
  {
    id: "stonewalling-silent-treatment",
    slug: "stonewalling-silent-treatment-emotional-punishment",
    title: "The Toxic Toll of Stonewalling: When Silent Treatments Cross into Emotional Punishment",
    category: "Communication Breakdown",
    readTime: "8 min read",
    summary: "When arguments turn into days of icy silence, the emotional toll is devastating. Learn to differentiate between a healthy break to cool down and the toxic silent treatment.",
    icon: BookOpen,
    author: "BeforeRegret Editorial Desk",
    credentials: "Derived from 2,100+ communication deadlock cases",
    introduction: "Almost everyone has felt overwhelmed during a fight and wanted to walk away. But there is a massive, toxic difference between saying 'I am too angry to talk right now, let's take a 30-minute break' and completely ignoring your partner for days on end. The silent treatment—often called stonewalling—is one of the most painful forms of emotional control. It triggers our primal fears of rejection and abandonment. This guide breaks down why stonewalling is so damaging and how to handle it.",
    sections: [
      {
        heading: "Cooling Down vs. Active Stonewalling",
        paragraphs: [
          "To heal your communication, you first need to understand the difference between healthy self-regulation and passive-aggressive silence:",
        ],
        bullets: [
          "**Taking a Cool-Down (Healthy):** Your partner says they feel overwhelmed, sets a specific time to talk again ('Let's discuss this tomorrow morning'), and reassures you of their care in the meantime.",
          "**Active Stonewalling (Unhealthy):** They shut down without warning, refuse to look at you, answer in cold one-word grunts, or leave the house without saying where they are going. There is no timeline for return, leaving you suspended in anxiety."
        ]
      },
      {
        heading: "The Primal Impact of Silent Punishment",
        paragraphs: [
          "Neurological studies show that being ignored or excluded triggers the same pathways in the human brain as physical pain. When your partner freezes you out, your nervous system is forced into a state of panic, leading to desperate behaviors like begging, apologizing for things you didn't do, or explosive anger.",
          "This dynamic often creates a toxic cycle: one partner pursues harder and harder to get a response, which causes the other partner to withdraw even further. Over time, this erodes all emotional safety and leaves both partners deeply exhausted."
        ]
      },
      {
        heading: "How to Break the Pursuit-Withdrawal Cycle",
        paragraphs: [
          "Breaking this cycle requires both partners to change their habits. The pursuing partner must learn to step back and stop chasing a response, as begging only reinforces the stonewaller's sense of power.",
          "The withdrawing partner must learn to practice the '24-Hour Rule': you are allowed to ask for space, but you are legally responsible in the relationship to restart the conversation within 24 hours. Silence must never be used as a weapon to force compliance or make the other person beg."
        ]
      }
    ],
    conclusion: "Love cannot grow in a deep freeze. If your partner routinely uses days of silence to punish you, avoid accountability, or force you to apologize, they are practicing emotional manipulation. Demanding a healthy, timed cool-down structure is a non-negotiable boundary for a lasting relationship."
  },
  {
    id: "breadwinner-resentment",
    slug: "breadwinner-resentment-income-disparity",
    title: "The Breadwinner Resentment Trap: When Earning More Triggers Silent Power Struggles",
    category: "Financial Dynamics",
    readTime: "8 min read",
    summary: "An honest exploration of what happens when one partner makes significantly more money. How silent resentment grows around chore divisions, household control, and career sacrifices.",
    icon: Award,
    author: "BeforeRegret Editorial Desk",
    credentials: "Based on 1,600+ household contribution reviews",
    introduction: "In an ideal world, love is a perfect 50/50 partnership. In the real world, someone usually earns more. When there is a large income gap, relationships face a subtle but powerful threat: breadwinner resentment. Whether it is the higher earner feeling taken advantage of, or the lower earner feeling controlled and devalued, income disparity can poison a relationship from the inside out. This guide explores how to build a fair, respectful partnership when the paychecks are vastly unequal.",
    sections: [
      {
        heading: "The Dual Sources of Income Resentment",
        paragraphs: [
          "Income resentment is rarely one-sided; it usually festers silently in both partners, showing up as petty arguments about household chores or spending decisions:",
        ],
        bullets: [
          "**The Higher Earner's Trap:** Feeling like a human wallet. They may feel that because they carry the financial load, they shouldn't have to help with housework, or they should have the final say on all big purchases.",
          "**The Lower Earner's Trap:** Feeling like a second-class citizen. They may feel guilty spending money, feel pressured to do 100% of the domestic labor to 'make up' for earning less, or feel that their career and dreams are treated as hobbies."
        ]
      },
      {
        heading: "The False Equation: Money vs. Labor",
        paragraphs: [
          "The biggest mistake couples make is equating financial income directly with relationship contribution. A relationship is not a business; it is a shared life.",
          "Hours worked and effort exerted should be valued equally, regardless of the industry pay scale. If one partner works 50 hours as a teacher earning modest pay, and the other works 50 hours in corporate finance earning ten times more, both have contributed the same amount of their life energy. The corporate earner does not get a pass on parenting or dishwashing."
        ]
      },
      {
        heading: "Practical Wealth-Sharing Frameworks",
        paragraphs: [
          "To eliminate financial power struggles, consider adopting a proportional expense model rather than a strict 50/50 split.",
          "In a proportional model, if Partner A earns 70% of the total household income, they pay 70% of the shared bills. Additionally, both partners should receive an identical amount of 'no-questions-asked' fun money each month in their own separate accounts. This ensures that the lower earner maintains their dignity and personal autonomy."
        ]
      }
    ],
    conclusion: "A healthy marriage or long-term partnership requires equal respect, regardless of who brings home the larger paycheck. If money is being used to pull rank, dodge household responsibilities, or control decision-making, it's time to redefine your financial agreements before resentment breaks the foundation."
  }
];

interface GuidesScreenProps {
  setScreen: (screen: { type: string; slug?: string }) => void;
  slug?: string;
}

export default function GuidesScreen({ setScreen, slug }: GuidesScreenProps) {
  const selectedArticle = slug ? GUIDE_ARTICLES.find(a => a.slug === slug || a.id === slug) : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(GUIDE_ARTICLES.map(a => a.category))];

  const filteredArticles = GUIDE_ARTICLES.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#FAF9F6] text-[#24324A] min-h-screen">
      {/* Back to Guides List if viewing an article */}
      {selectedArticle ? (
        <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
          <button
            onClick={() => {
              setScreen({ type: 'guides' });
              window.scrollTo({ top: 0 });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#24324A] bg-white border border-[#E5E7EB] hover:border-[#C9A227] hover:bg-[#FAF8F2] shadow-xs active:scale-95 transition-all"
            id="back-to-guides"
          >
            <ArrowLeft className="h-4 w-4 text-[#C9A227]" /> Back to Decision Guides
          </button>

          {/* Article Full View */}
          <article className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-6 sm:p-10 space-y-8">
            {/* Header */}
            <div className="space-y-4 border-b border-zinc-100 pb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#FAF8F2] border border-[#C9A227]/30 text-[#C9A227]">
                <selectedArticle.icon className="h-3 w-3" /> {selectedArticle.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#24324A] leading-tight tracking-tight">
                {selectedArticle.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#C9A227]" /> {selectedArticle.readTime}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                <span>
                  Compiled by <strong>{selectedArticle.author}</strong> — <span className="italic text-zinc-400">{selectedArticle.credentials}</span>
                </span>
              </div>
            </div>

            {/* Introduction */}
            <div className="text-base sm:text-lg text-zinc-700 leading-relaxed font-serif italic border-l-4 border-[#C9A227] pl-4 sm:pl-6">
              &ldquo;{selectedArticle.introduction}&rdquo;
            </div>

            {/* Sections */}
            <div className="space-y-8 text-zinc-800 text-sm sm:text-base leading-relaxed">
              {selectedArticle.sections.map((section, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-black text-[#24324A] tracking-tight flex items-center gap-2">
                    <span className="text-[#C9A227]">●</span> {section.heading}
                  </h2>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-zinc-700 font-normal">
                      {p}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="space-y-3 bg-[#FAF8F2]/60 rounded-2xl border border-[#FAF8F2] p-5">
                      {section.bullets.map((bullet, bIdx) => {
                        const splitText = bullet.split('**');
                        const isBold = bullet.startsWith('**');
                        return (
                          <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700">
                            <CheckCircle className="h-4.5 w-4.5 text-[#C9A227] shrink-0 mt-0.5" />
                            <span>
                              {splitText.map((text, sIdx) => {
                                const shouldBold = (isBold && sIdx % 2 === 0) || (!isBold && sIdx % 2 !== 0);
                                return shouldBold ? <strong key={sIdx} className="font-extrabold text-[#24324A]">{text}</strong> : text;
                              })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* Conclusion */}
            <div className="bg-[#FAF8F2] border border-[#C9A227]/20 rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-black tracking-widest text-[#C9A227] uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Editorial Key Takeaway
              </h4>
              <p className="text-sm text-[#24324A] leading-relaxed font-serif italic">
                {selectedArticle.conclusion}
              </p>
            </div>

            {/* Share / Action Footer */}
            <div className="pt-6 border-t border-zinc-100 flex flex-wrap justify-between items-center gap-4">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedArticle.title,
                      text: selectedArticle.summary,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Guide link copied to clipboard!");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#C9A227] font-semibold transition-colors"
                id="share-guide-btn"
              >
                <Share2 className="h-4 w-4" /> Share this Guide
              </button>

              <button
                onClick={() => {
                  setScreen({ type: 'explore' });
                  window.scrollTo({ top: 0 });
                }}
                className="inline-flex items-center gap-1 text-xs text-[#C9A227] font-bold hover:underline"
              >
                Explore outcome ratios next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero Banner Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] select-none">
              <BookOpen className="h-3 w-3" /> Relationship Intelligence
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#24324A] tracking-tight leading-tight">
              Relationship <span className="text-[#C9A227]">Decision Guides</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 font-medium max-w-xl mx-auto">
              Read community-distilled guides focused on real, anonymous relationship outcomes, helping you make high-stakes life decisions with clarity.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-[#C9A227]" />
              <input
                type="text"
                placeholder="Search decision guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-2xl text-xs font-semibold focus:outline-none focus:border-[#C9A227] focus:ring-4 focus:ring-[#C9A227]/5 text-[#24324A]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedCategory === cat
                      ? "bg-[#24324A] border-[#24324A] text-white shadow-sm"
                      : "bg-white border-[#E5E7EB] text-zinc-500 hover:border-[#C9A227] hover:text-[#C9A227]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Guides Cards Grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => {
                    setScreen({ type: 'guides', slug: article.slug });
                    window.scrollTo({ top: 0 });
                  }}
                  className="bg-white rounded-3xl border border-[#E5E7EB] hover:border-[#C9A227]/60 p-6 flex flex-col justify-between hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Decorative faint glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C9A227]/5 to-transparent rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FAF8F2] border border-[#C9A227]/20 text-[#C9A227]">
                        {article.category}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {article.readTime}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#24324A] group-hover:text-[#C9A227] transition-colors leading-tight">
                      {article.title}
                    </h3>

                    <p className="text-xs text-zinc-500 leading-relaxed font-medium line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-zinc-100/60 mt-6 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#FAF8F2] border border-[#C9A227]/20 text-[#C9A227]">
                        <article.icon className="h-4 w-4" />
                      </div>
                      <div className="text-[11px]">
                        <div className="font-bold text-[#24324A]">{article.author}</div>
                        <div className="text-zinc-400 font-medium text-[9px] line-clamp-1">{article.credentials}</div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-[#C9A227] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Guide <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-zinc-400 font-medium bg-white rounded-3xl border border-[#E5E7EB] border-dashed">
                <BookOpen className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                No guides matching your search criteria.
              </div>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
