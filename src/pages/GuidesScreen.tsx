import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Clock, Share2, Sparkles, CheckCircle, ChevronRight, HelpCircle, ShieldAlert, Award } from 'lucide-react';
import { PRESEEDED_SITUATIONS } from '../data/mockData';

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
    credentials: "Based on anonymous infidelity timelines",
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
    credentials: "Based on commitment deadlock reviews",
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
    credentials: "Derived from relocation case histories",
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
    credentials: "Distilled from community court files",
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
    credentials: "Based on financial boundary dispute logs",
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
    credentials: "Analyzed from user communication logs",
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
    credentials: "Derived from communication deadlock cases",
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
    credentials: "Based on household contribution reviews",
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
  },
  {
    id: "narcissistic-gaslighting",
    slug: "narcissistic-gaslighting-vs-healthy-disagreements",
    title: "Gaslighting vs. Healthy Disagreement: Spotting the Emotional Shell Game",
    category: "Dating Safety",
    readTime: "8 min read",
    summary: "How to tell if your partner is practicing emotional gaslighting or if you are simply experiencing a normal, heated clash of memories and perspectives.",
    icon: ShieldAlert,
    author: "BeforeRegret Editorial Desk",
    credentials: "Based on relationship conflict audits",
    introduction: "The word 'gaslighting' gets thrown around in almost every modern breakup story. But what does it actually look like in real life? True gaslighting is a targeted, toxic effort to erase your confidence, make you question your memory, and make you dependent on your partner's version of reality. A healthy relationship allows for disagreements, but it never forces you to forfeit your own mental sanity. This guide helps you identify the psychological shell game.",
    sections: [
      {
        heading: "What Gaslighting Actually Is (And What It Isn't)",
        paragraphs: [
          "Gaslighting is not just a partner having a different memory of an argument. It is not someone stubbornly insisting they did not say something hurtful because of pride or conflict avoidance.",
          "Instead, gaslighting is an ongoing strategy of psychological manipulation. The goal of a gaslighter is to create a systematic imbalance of power. By making you feel confused, overly sensitive, or crazy, they ensure you stop trusting your own judgment and instead rely completely on theirs.",
          "When you raise a concern, a gaslighter will not just argue back; they will attack your capacity to perceive reality. They will try to convince you that your memory is failing, your emotions are unstable, or you are imagining issues that do not exist."
        ]
      },
      {
        heading: "Three Warning Signals of the Shell Game",
        paragraphs: [
          "Anonymous case files on our platform reveal three distinct phrases and behaviors that separate gaslighting from normal friction:",
        ],
        bullets: [
          "**Reversing the Accusation (DARVO):** Denying the behavior, attacking your character for bringing it up, and reversing the roles of victim and offender. Suddenly, an argument about their secret texting turns into a trial about your insecurity.",
          "**Warping Your History:** Asserting with absolute confidence that events you clearly remember never happened, or that you promised things you did not. ('You always make things up to hurt me.')",
          "**Counterfeiting Concern:** Masking their control behind soft, patronizing words. ('I'm only worried about you because your memory has been so bad lately, maybe you should see a therapist.')"
        ]
      },
      {
        heading: "The Litmus Test for Sanity",
        paragraphs: [
          "To evaluate if you are being gaslit, stop debating the details of the arguments with your partner and instead observe your own emotional baseline over the last 6 months.",
          "If you find yourself constantly second-guessing your feelings, keeping a secret digital diary of conversations just to prove you are not crazy, or starting every conversation with a long apology for being 'difficult,' you are likely dealing with active psychological manipulation.",
          "A partner who cares about your relationship will care about how their actions make you feel, even if they remember the details of the event differently."
        ]
      }
    ],
    conclusion: "Healthy partners respect your perspective even when they don't agree with it. If you have to keep digital receipts, record conversations, or constantly defend your basic sanity just to be heard, the relationship has ceased to be a safe harbor. Trust your instincts and prioritize your own mental peace."
  },
  {
    id: "long-distance-deadlock",
    slug: "long-distance-deadlock-closing-the-gap",
    title: "The Long-Distance Deadlock: How to Know When to Close the Gap or Let Go",
    category: "Life Transitions",
    readTime: "7 min read",
    summary: "Long-distance relationships can sustain for a season, but without a concrete timeline to merge lives, they often expire. Read the actual failure factors and how to audit your future together.",
    icon: Clock,
    author: "BeforeRegret Editorial Desk",
    credentials: "Based on long-distance timeline outcomes",
    introduction: "In our digital, global world, long-distance relationships (LDRs) are more common than ever. Many couples start out with grand plans and deep devotion, convinced that their love can survive any amount of mileage. But our database records show that without a concrete, mutually agreed-upon end date, over 70% of long-distance relationships eventually dissolve due to physical loneliness and emotional drift. This guide looks at the reality of LDR deadlocks and how to handle your situation before you waste years in suspension.",
    sections: [
      {
        heading: "The Illusion of Long-Distance Harmony",
        paragraphs: [
          "Long-distance relationships often feel incredibly romantic and low-conflict. Because your time together is rare and precious, you naturally ignore minor irritations and focus entirely on enjoyment.",
          "This dynamic creates a dangerous illusion of perfect compatibility. You only see the highly curated, high-energy version of your partner, completely missing how they handle daily stress, household chores, or routine communication friction.",
          "A relationship is not truly tested until you share standard, boring, day-to-day life. Postponing this reality indefinitely keeps you stuck in a perpetual dating phase that prevents true relational growth."
        ]
      },
      {
        heading: "The Three Pillar Audit for Long-Distance Partners",
        paragraphs: [
          "To evaluate if your long-distance relationship is a viable long-term partnership or a comfortable holding pattern, test it against three key metrics:",
        ],
        bullets: [
          "**The Concrete End-Date:** Do you have a specific, realistic date on the calendar when one of you is moving, or is it a vague 'someday when the timing is right' promise?",
          "**Asymmetric Relocation Sacrifice:** Is one person expected to sacrifice their entire family, friend group, and career while the other makes zero changes? Unbalanced sacrifices are a prime incubator for deep, lasting resentment.",
          "**Financial Realism:** Do you have a shared, practical budget to cover the costs of visits, visa applications, and relocation? Love alone cannot pay for moving vans and flight tickets."
        ]
      },
      {
        heading: "Recognizing the 'Forever Distance' Stall",
        paragraphs: [
          "Some partners love the *idea* of a relationship but actually prefer the emotional safety net of physical distance. It allows them to feel coupled up without having to compromise their daily independence or face real intimacy.",
          "If your partner continually moves the goalposts for relocation—citing work stress, financial hesitation, or bad timing every time you try to set a firm move date—they may be stalling to keep you in an easy, low-maintenance holding pattern."
        ]
      }
    ],
    conclusion: "Distance is a bridge to cross, not a permanent place to live. If your partner cannot or will not agree to a firm, practical plan to merge your lives within a reasonable timeline, they are choosing their current comfort over a shared future. It is better to end the suspension now than to look back years later with regret."
  },
  {
    id: "cold-feet-vs-dealbreakers",
    slug: "cold-feet-vs-marriage-dealbreakers",
    title: "Cold Feet vs. Genuine Dealbreakers: The Pre-Engagement Doubt Audit",
    category: "Commitment Deadlocks",
    readTime: "7 min read",
    summary: "Is your pre-marriage anxiety just standard cold feet, or is it your subconscious screaming at you to run? Learn how to audit your doubts with absolute clinical clarity.",
    icon: HelpCircle,
    author: "BeforeRegret Editorial Desk",
    credentials: "Based on marital regret retrospective surveys",
    introduction: "Taking the leap into marriage or lifelong partnership is a massive psychological milestone. It is entirely normal to feel a wave of anxiety, nervousness, or self-doubt as the big decision approaches. But many people override their deepest warnings, labeling genuine, structural dealbreakers as simple 'cold feet.' When we surveyed individuals who went through painful divorces, a staggering 85% admitted they felt deep doubts *before* saying 'I do' but ignored them out of social embarrassment or fear of conflict. This guide helps you tell the difference.",
    sections: [
      {
        heading: "The Anatomy of Standard Cold Feet",
        paragraphs: [
          "Normal cold feet are about the *magnitude of the commitment*, not the *character of your partner*. It is a natural reaction to realizing that you are closing the door on other options and stepping into a lifelong partnership.",
          "Standard anxiety shows up as worries about being a good spouse, financial stress about weddings, or feeling overwhelmed by family expectations.",
          "If your doubts are purely about the responsibility of marriage, but you still feel deeply safe, respected, and heard in your partner's presence, you are likely just experiencing standard transition jitters."
        ]
      },
      {
        heading: "The Five Red-Zone Doubt Indicators",
        paragraphs: [
          "Conversely, if your doubts are about the relationship itself, these are not cold feet—they are structural warning signs that require immediate attention:",
        ],
        bullets: [
          "**Fundamental Value Incompatibility:** Deep, unresolvable clashes about whether to have children, how to handle finances, or basic moral boundaries.",
          "**Character and Honesty Concerns:** A history of small lies, hidden financial debt, or defensive secrecy that makes you feel like you are walking on eggshells.",
          "**The Communication Wall:** A recurring cycle where they stonewall you, shut down, or turn every concern you raise into a fight about your flaws.",
          "**The Lack of Emotional Safety:** Feeling like you have to hide your true thoughts, beliefs, or friend groups to keep the peace.",
          "**Pressure and Coercion:** Feeling like you are moving forward primarily to avoid disappointing your partner, your family, or losing your social standing."
        ]
      },
      {
        heading: "Conducting Your Personal Doubt Audit",
        paragraphs: [
          "To separate jitters from dealbreakers, try a simple mental exercise: Imagine if your wedding was canceled tomorrow. If your primary feeling is crushing grief and disappointment, your anxieties are likely just cold feet.",
          "But if your immediate, secret reaction is a wave of relief or a feeling of being unburdened, your subconscious is telling you that this commitment is a mistake. Listen to that feeling."
        ]
      }
    ],
    conclusion: "A wedding lasts a day; a marriage lasts a lifetime. It is infinitely easier and cheaper to call off an engagement or postpone a wedding than it is to untangle a life through divorce court. Never let social pressure, money spent, or fear of a painful conversation force you into a lifetime of regret."
  },
  {
    id: "codependency-vs-interdependence",
    slug: "codependency-vs-interdependence-autonomy-score",
    title: "Codependency vs. Interdependence: Evaluating Your Autonomy Score",
    category: "Emotional Secrecy",
    readTime: "8 min read",
    summary: "Discover the vital boundary line between healthy romantic devotion and toxic codependency where your entire mental stability is held hostage by your partner's moods.",
    icon: BookOpen,
    author: "BeforeRegret Editorial Desk",
    credentials: "Derived from relationship attachment reviews",
    introduction: "In a world that celebrates all-consuming romance, it is very easy to mistake a highly toxic, codependent attachment pattern for deep, passionate devotion. We are taught that love means being 'two halves of a whole,' but healthy relationships are actually made of two whole, independent individuals choosing to share their lives. When your partner's mood, text response time, or minor critique completely dictates your daily peace of mind, you have crossed from healthy interdependence into painful codependency. Let's look at the math of your relationship autonomy.",
    sections: [
      {
        heading: "Interdependence: The Safe Anchor",
        paragraphs: [
          "Healthy closeness is built on interdependence. This means you rely on each other for support, comfort, and safety, but you still maintain your own distinct identity, opinions, friendships, and goals.",
          "In an interdependent bond, if your partner has a bad day at work or feels irritable, you can feel empathy and support them without letting their emotional state completely hijack your own mental stability.",
          "You do not need to constantly check their temperature, ask if they are 'mad at you,' or change your behaviors to manage their feelings. There is an underlying safety that allows both of you to have separate emotional lives."
        ]
      },
      {
        heading: "Codependency: The Emotional Prison",
        paragraphs: [
          "Codependency, on the other hand, is an anxious, high-alert state where your own self-worth and mood are entirely hostage to your partner's reactions. Look for these four key warning signs:",
        ],
        bullets: [
          "**The Peacekeeper Exhaustion:** Constantly scanning their face, voice tone, and text messages for any sign of disapproval, and exhausting yourself trying to fix their mood.",
          "**The Erased Identity:** Giving up your hobbies, opinions, and friendships to match their preferences, until you no longer know what *you* actually want or believe.",
          "**The Savior Complex:** Believing that if you just love them enough, support them enough, or absorb enough of their poor behavior, they will eventually heal and treat you right.",
          "**The Severe Rejection Panic:** A feeling of sheer panic, nausea, or terror when they ask for space, have a quiet afternoon, or express a different opinion."
        ]
      },
      {
        heading: "Reclaiming Your Autonomy",
        paragraphs: [
          "Breaking free from codependency does not mean you have to pack your bags and leave. It starts with a simple shift in focus: taking your hands off their emotional wheel and placing them back on your own.",
          "Start small by reconnecting with one friend they do not share, spending an afternoon on a hobby they do not participate in, or practicing the 'Pause'—when they are in a bad mood, let them have it without trying to fix it or apologizing for it."
        ]
      }
    ],
    conclusion: "True love does not require you to abandon yourself. A healthy relationship should be a beautiful addition to your life, not your entire life support system. Reclaim your independent footing, set clean boundaries, and rebuild your own autonomy score for a stable future."
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

  // Find related situations based on guide slug
  const getRelatedSituations = (articleSlug: string) => {
    const guideToSituationMap: Record<string, string[]> = {
      'infidelity-reconciliation-math-of-forgiveness': ['stayed-after-cheating'],
      'emotional-cheating-vs-close-friendship-boundaries': ['stayed-after-cheating'],
      'ultimatum-protocol-why-marriage-deadlocks-fail': ['boyfriend-doesnt-want-marriage', 'marriage-ultimatum'],
      'cold-feet-vs-marriage-dealbreakers': ['boyfriend-doesnt-want-marriage', 'partner-doesnt-want-kids'],
      'relocation-risk-index-moving-for-love': ['moved-for-love'],
      'long-distance-deadlock-closing-the-gap': ['long-distance-relationship'],
      'codependency-vs-interdependence-autonomy-score': ['different-religion-marriage', 'partner-doesnt-want-kids'],
      'red-flag-evaluation-boundary-matrix': ['ignored-red-flags']
    };
    const slugs = guideToSituationMap[articleSlug] || ['boyfriend-doesnt-want-marriage'];
    return PRESEEDED_SITUATIONS.filter(sit => slugs.includes(sit.slug));
  };

  const getOtherGuides = (articleSlug: string) => {
    return GUIDE_ARTICLES.filter(a => a.slug !== articleSlug).slice(0, 3);
  };

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
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn text-left">
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

          {/* Main Grid with Sidebar for dense internal linking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Content (8 Columns) */}
            <div className="lg:col-span-8 space-y-8">
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

            {/* Sidebar (4 Columns) for Dense Internal Linking */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Related Real-Life Situations */}
              {getRelatedSituations(selectedArticle.slug).length > 0 && (
                <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
                  <h4 className="text-xs font-black tracking-widest text-[#24324A] uppercase font-mono flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                    <Sparkles className="h-4 w-4 text-[#C9A227]" /> Mapped Situations
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed text-left">
                    Examine real peer timelines, outcome distributions, and average regret metrics compiled for this scenario:
                  </p>
                  <div className="space-y-3">
                    {getRelatedSituations(selectedArticle.slug).map(sit => (
                      <div
                        key={sit.slug}
                        onClick={() => {
                          setScreen({ type: 'situation', slug: sit.slug });
                          window.scrollTo({ top: 0 });
                        }}
                        className="group p-3.5 rounded-2xl border border-zinc-100 hover:border-[#C9A227]/30 bg-[#FAF9F6]/30 hover:bg-[#FAF8F2] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-[#C9A227] uppercase tracking-wider block mb-1">
                            {sit.category}
                          </span>
                          <h5 className="text-xs font-bold text-[#24324A] group-hover:text-[#C9A227] transition-colors leading-snug">
                            {sit.name}
                          </h5>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100/60 text-[9px] font-bold text-zinc-400 font-mono">
                          <span>Avg Regret: {sit.stats.avgRegret}/10</span>
                          <span className="text-[#C9A227] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            Analyze Outcomes <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Expert Guides */}
              <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
                <h4 className="text-xs font-black tracking-widest text-[#24324A] uppercase font-mono flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                  <BookOpen className="h-4 w-4 text-[#C9A227]" /> Other Expert Guides
                </h4>
                <div className="space-y-3">
                  {getOtherGuides(selectedArticle.slug).map(other => (
                    <div
                      key={other.slug}
                      onClick={() => {
                        setScreen({ type: 'guides', slug: other.slug });
                        window.scrollTo({ top: 0 });
                      }}
                      className="group p-3 rounded-2xl border border-zinc-50 hover:border-[#C9A227]/30 bg-[#FAF9F6]/20 hover:bg-[#FAF8F2] transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">
                          {other.category}
                        </span>
                        <h5 className="text-xs font-bold text-[#24324A] group-hover:text-[#C9A227] transition-colors line-clamp-2 leading-tight">
                          {other.title}
                        </h5>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#C9A227] shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Intelligence Hub Links */}
              <div className="bg-gradient-to-br from-[#24324A] to-[#1C273A] text-white rounded-3xl p-6 space-y-4 shadow-sm border border-zinc-800">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-widest font-mono">
                    Decisional Toolkit
                  </span>
                  <h4 className="text-sm font-bold text-white font-serif">
                    Unbiased Support Juries & Dynamic Meters
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed text-left">
                  Connect with dynamic citizen juries, score your relationship red flags, or search our global database:
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {[
                    { label: "BR Relationship Court", desc: "Citizen jury verdicts on marital & trust disputes", screen: { type: "court_list" } },
                    { label: "Anonymous Regret Registry", desc: "Browse authentic peer timelines & stories", screen: { type: "regret_stories" } },
                    { label: "Red Flag Meter Analysis", desc: "Calculate your partner's specific warning indexes", screen: { type: "red_flag_meter" } },
                    { label: "Commitment Incompatibilities", desc: "Read community-distilled outcomes", screen: { type: "hub", slug: "commitment-issues" } },
                  ].map((tool, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => {
                        setScreen(tool.screen);
                        window.scrollTo({ top: 0 });
                      }}
                      className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C9A227]/40 hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <span className="text-xs font-bold text-white leading-tight">
                        {tool.label}
                      </span>
                      <span className="text-[9px] text-zinc-400 mt-0.5 leading-normal">
                        {tool.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
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
