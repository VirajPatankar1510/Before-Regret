import { Situation, Story, CourtCase, Question, RedFlagCase } from '../types';

export const POPULAR_SEARCHES = [
  "Stayed after cheating",
  "Long distance relationship",
  "Partner doesn't want kids",
  "Different religion marriage",
  "Marriage ultimatum",
  "Moved for love",
  "Ignored red flags"
];

export const MOST_REGRETTED_DECISIONS = [
  { id: '1', title: 'Stayed Too Long', description: 'Staying in a failing relationship hoping they would change.', avgRegret: 8.9, count: 184, rate: '92%' },
  { id: '2', title: 'Ignored Red Flags', description: 'Overlooking early warning signs of manipulation or incompatibility.', avgRegret: 8.5, count: 151, rate: '88%' },
  { id: '3', title: 'Married Too Quickly', description: 'Rushing into marriage before fully knowing their character.', avgRegret: 7.8, count: 98, rate: '79%' },
  { id: '4', title: 'Moved For Love', description: 'Relocating to another state/country, giving up career or friends.', avgRegret: 7.2, count: 64, rate: '71%' },
  { id: '5', title: 'Stayed After Multiple Affairs', description: 'Giving third and fourth chances after repeated infidelity.', avgRegret: 9.3, count: 124, rate: '95%' }
];

export const MOST_SUCCESSFUL_DECISIONS = [
  { id: '1', title: 'Left Toxic Relationship', description: 'Walking away from a manipulative or abusive relationship early.', avgRegret: 1.2, successRate: '96%', count: 221, wouldDoAgain: '98%' },
  { id: '2', title: 'Set Boundaries Early', description: 'Establishing clear dealbreakers and core needs within months 1-3.', avgRegret: 1.8, successRate: '91%', count: 143, wouldDoAgain: '93%' },
  { id: '3', title: 'Delayed Marriage', description: 'Postponing marriage to finish education, therapy, or build stability.', avgRegret: 2.1, successRate: '88%', count: 87, wouldDoAgain: '89%' },
  { id: '4', title: 'Went To Therapy', description: 'Pragmatic couple counseling early, or individual trauma therapy.', avgRegret: 2.5, successRate: '85%', count: 112, wouldDoAgain: '86%' },
  { id: '5', title: 'Communicated Expectations', description: 'Having the hard conversations about kids, money, and religion before moving in.', avgRegret: 1.5, successRate: '94%', count: 191, wouldDoAgain: '95%' }
];

export const PRESEEDED_SITUATIONS: Situation[] = [
  {
    slug: 'boyfriend-doesnt-want-marriage',
    name: "Boyfriend Doesn't Want Marriage",
    category: 'Marriage',
    description: "Stories, outcomes, regrets and relationship results from people who experienced having a male partner who did not believe in, wanted to postpone, or outright rejected marriage while they wanted it.",
    stats: {
      storyCount: 241,
      avgRegret: 6.8,
      wouldDoAgainPercent: 39,
      stillTogetherPercent: 28,
      marriedPercent: 12,
      separatedPercent: 60,
      avgRelationshipLength: "6.2 Years"
    },
    decisionBreakdown: [
      { name: 'Stayed with Him (No Marriage)', percentage: 42 },
      { name: 'Broke Up / Left', percentage: 48 },
      { name: 'Gave Marriage Ultimatum', percentage: 10 }
    ],
    outcomeBreakdown: [
      { name: 'Eventually Broke Up', value: 60 },
      { name: 'Happily Together (Unmarried)', value: 18 },
      { name: 'Resentfully Together (Unmarried)', value: 10 },
      { name: 'Commercially Married under coercion', value: 4 },
      { name: 'Happily Married eventually', value: 8 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 3.5 },
      { period: '6 Months', level: 4.8 },
      { period: '1 Year', level: 5.9 },
      { period: '2 Years', level: 7.2 },
      { period: '5 Years', level: 8.1 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 121, avgRegret: 6.9 },
      { country: 'United Kingdom', count: 34, avgRegret: 6.4 },
      { country: 'Canada', count: 28, avgRegret: 6.6 },
      { country: 'Australia', count: 21, avgRegret: 6.2 },
      { country: 'India', count: 19, avgRegret: 8.4 }
    ]
  },
  {
    slug: 'stayed-after-cheating',
    name: "Stayed After Cheating",
    category: 'Cheating',
    description: "Results of individuals who decided to forgive, stay, and work through the relationship after discovering their partner committed physical or emotional infidelity.",
    stats: {
      storyCount: 382,
      avgRegret: 8.2,
      wouldDoAgainPercent: 18,
      stillTogetherPercent: 15,
      marriedPercent: 8,
      separatedPercent: 77,
      avgRelationshipLength: "4.8 Years"
    },
    decisionBreakdown: [
      { name: 'Forgave instantly', percentage: 25 },
      { name: 'Went to Couples Therapy', percentage: 35 },
      { name: 'Struggled alone for 1+ year', percentage: 40 }
    ],
    outcomeBreakdown: [
      { name: 'Cheated Again (Repeated Infidelity)', value: 58 },
      { name: 'Broke Up Over Trust Issues', value: 24 },
      { name: 'Fully Restored Trust', value: 6 },
      { name: 'Staying purely for Kids/Finances', value: 12 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 4.2 },
      { period: '6 Months', level: 6.1 },
      { period: '1 Year', level: 7.8 },
      { period: '2 Years', level: 8.4 },
      { period: '5 Years', level: 9.1 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 184, avgRegret: 8.1 },
      { country: 'Canada', count: 48, avgRegret: 8.3 },
      { country: 'United Kingdom', count: 41, avgRegret: 7.9 },
      { country: 'India', count: 32, avgRegret: 8.9 },
      { country: 'Australia', count: 28, avgRegret: 8.0 }
    ]
  },
  {
    slug: 'partner-doesnt-want-kids',
    name: "Partner Doesn't Want Kids",
    category: 'Children & Family',
    description: "What happens when one partner strongly desires children, and the other is firmly child-free, yet they try to make the relationship work anyway.",
    stats: {
      storyCount: 148,
      avgRegret: 7.5,
      wouldDoAgainPercent: 24,
      stillTogetherPercent: 19,
      marriedPercent: 10,
      separatedPercent: 71,
      avgRelationshipLength: "7.1 Years"
    },
    decisionBreakdown: [
      { name: 'Hoped they would change mind', percentage: 55 },
      { name: 'Accepted Child-free lifestyle', percentage: 25 },
      { name: 'Broke up immediately', percentage: 20 }
    ],
    outcomeBreakdown: [
      { name: 'Broke up later with resentment', value: 65 },
      { name: 'Unintended Pregnancy / Friction', value: 10 },
      { name: 'Happy Child-free Together', value: 15 },
      { name: 'One partner compromised (with regret)', value: 10 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 2.8 },
      { period: '6 Months', level: 4.0 },
      { period: '1 Year', level: 6.2 },
      { period: '2 Years', level: 7.9 },
      { period: '5 Years', level: 8.8 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 68, avgRegret: 7.4 },
      { country: 'Germany', count: 21, avgRegret: 7.1 },
      { country: 'Canada', count: 19, avgRegret: 7.6 },
      { country: 'United Kingdom', count: 14, avgRegret: 7.3 },
      { country: 'Australia', count: 12, avgRegret: 7.5 }
    ]
  },
  {
    slug: 'moved-for-love',
    name: "Moved For Love",
    category: 'Careers & Moving',
    description: "The long-term outcomes of people who gave up their jobs, moved across countries or states, or left their social support networks to pursue a partner's career or relocate with them.",
    stats: {
      storyCount: 196,
      avgRegret: 5.4,
      wouldDoAgainPercent: 51,
      stillTogetherPercent: 44,
      marriedPercent: 32,
      separatedPercent: 56,
      avgRelationshipLength: "5.5 Years"
    },
    decisionBreakdown: [
      { name: 'Moved completely', percentage: 70 },
      { name: 'Compromised on dynamic/hybrid', percentage: 20 },
      { name: 'Refused to move', percentage: 10 }
    ],
    outcomeBreakdown: [
      { name: 'Broke Up & Moved Back Home', value: 48 },
      { name: 'Happily Married in New Location', value: 34 },
      { name: 'Felt Isolated & Separated', value: 12 },
      { name: 'Struggling Unemployed Unmarried', value: 6 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 4.1 },
      { period: '6 Months', level: 5.8 },
      { period: '1 Year', level: 5.2 },
      { period: '2 Years', level: 5.0 },
      { period: '5 Years', level: 4.8 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 91, avgRegret: 5.3 },
      { country: 'Canada', count: 29, avgRegret: 5.5 },
      { country: 'United Kingdom', count: 24, avgRegret: 5.2 },
      { country: 'Australia', count: 18, avgRegret: 5.1 },
      { country: 'Germany', count: 12, avgRegret: 5.6 }
    ]
  },
  {
    slug: 'long-distance-relationship',
    name: "Long Distance Relationship",
    category: 'Long Distance',
    description: "Vetted data and authentic stories concerning geographic separation, dual-location careers, time-zone conflicts, and the psychological and financial toll of staying together while living apart.",
    stats: {
      storyCount: 164,
      avgRegret: 4.9,
      wouldDoAgainPercent: 54,
      stillTogetherPercent: 32,
      marriedPercent: 18,
      separatedPercent: 50,
      avgRelationshipLength: "3.4 Years"
    },
    decisionBreakdown: [
      { name: 'Stayed Long Distance', percentage: 55 },
      { name: 'One Relocated/Moved', percentage: 35 },
      { name: 'Broke Up Early', percentage: 10 }
    ],
    outcomeBreakdown: [
      { name: 'Grew Apart (Broke Up)', value: 50 },
      { name: 'Successfully Closed Gap', value: 30 },
      { name: 'Relocated but Regretted Move', value: 12 },
      { name: 'Ghosted / Indefinite Limbo', value: 8 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 2.3 },
      { period: '6 Months', level: 3.8 },
      { period: '1 Year', level: 5.1 },
      { period: '2 Years', level: 6.2 },
      { period: '5 Years', level: 4.9 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 72, avgRegret: 4.8 },
      { country: 'Canada', count: 21, avgRegret: 5.1 },
      { country: 'United Kingdom', count: 18, avgRegret: 4.7 },
      { country: 'Germany', count: 11, avgRegret: 5.0 },
      { country: 'Australia', count: 9, avgRegret: 5.2 }
    ]
  },
  {
    slug: 'different-religion-marriage',
    name: "Different Religion Marriage",
    category: 'Marriage',
    description: "Friction analysis of interfaith marriages, family tradition friction, child raising debates, holiday struggles, and expectations surrounding religious conversion.",
    stats: {
      storyCount: 91,
      avgRegret: 5.1,
      wouldDoAgainPercent: 62,
      stillTogetherPercent: 55,
      marriedPercent: 44,
      separatedPercent: 31,
      avgRelationshipLength: "8.5 Years"
    },
    decisionBreakdown: [
      { name: 'Compromised on Dual Faiths', percentage: 65 },
      { name: 'One Partner Converted', percentage: 20 },
      { name: 'Refused Faith Compromises', percentage: 15 }
    ],
    outcomeBreakdown: [
      { name: 'Happy / Collaborative Interfaith', value: 48 },
      { name: 'Deep Stress over Children\'s Faith', value: 24 },
      { name: 'Family/In-Law Ostracization', value: 16 },
      { name: 'Eventually Divorced over Faith', value: 12 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 1.8 },
      { period: '6 Months', level: 2.5 },
      { period: '1 Year', level: 4.1 },
      { period: '2 Years', level: 5.2 },
      { period: '5 Years', level: 5.9 }
    ],
    countryBreakdown: [
      { country: 'India', count: 32, avgRegret: 6.5 },
      { country: 'United States', count: 28, avgRegret: 4.5 },
      { country: 'United Kingdom', count: 11, avgRegret: 4.9 },
      { country: 'Canada', count: 9, avgRegret: 4.7 }
    ]
  },
  {
    slug: 'marriage-ultimatum',
    name: "Marriage Ultimatum",
    category: 'Ultimatums',
    description: "The long-term success rates, levels of underlying resentment, and divorce statistics of relationships where one partner issued a hard 'marry me or I leave' timeline.",
    stats: {
      storyCount: 112,
      avgRegret: 7.9,
      wouldDoAgainPercent: 21,
      stillTogetherPercent: 22,
      marriedPercent: 15,
      separatedPercent: 63,
      avgRelationshipLength: "4.9 Years"
    },
    decisionBreakdown: [
      { name: 'Issued Ultimatum but Stayed', percentage: 18 },
      { name: 'Partner Agreed under pressure', percentage: 52 },
      { name: 'Broke up as result', percentage: 30 }
    ],
    outcomeBreakdown: [
      { name: 'Divorced inside 3 Years', value: 45 },
      { name: 'Broke up on the Spot', value: 30 },
      { name: 'Underlying Chronic Resentment', value: 18 },
      { name: 'Collaborative / Happy Marriage', value: 7 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 3.1 },
      { period: '6 Months', level: 5.6 },
      { period: '1 Year', level: 7.1 },
      { period: '2 Years', level: 8.0 },
      { period: '5 Years', level: 8.5 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 54, avgRegret: 7.8 },
      { country: 'United Kingdom', count: 18, avgRegret: 7.6 },
      { country: 'Canada', count: 11, avgRegret: 8.1 },
      { country: 'Australia', count: 9, avgRegret: 8.0 }
    ]
  },
  {
    slug: 'ignored-red-flags',
    name: "Ignored Red Flags",
    category: 'Red Flags',
    description: "Retrospective analysis of partners who overlooked early signs of jealousy, love bombing, manipulation, white lies, or narcissism hoping love or time would cure it.",
    stats: {
      storyCount: 291,
      avgRegret: 8.7,
      wouldDoAgainPercent: 9,
      stillTogetherPercent: 4,
      marriedPercent: 2,
      separatedPercent: 94,
      avgRelationshipLength: "5.1 Years"
    },
    decisionBreakdown: [
      { name: 'Excused/Ignored flags', percentage: 75 },
      { name: 'Set boundaries but caved', percentage: 20 },
      { name: 'Addressed and corrected', percentage: 5 }
    ],
    outcomeBreakdown: [
      { name: 'Traumatic separation/Broke up', value: 70 },
      { name: 'Wasted multiple years in loops', value: 20 },
      { name: 'chronic passive toxic endurance', value: 8 },
      { name: 'Partner fully changed (Rare)', value: 2 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 4.8 },
      { period: '6 Months', level: 6.9 },
      { period: '1 Year', level: 8.1 },
      { period: '2 Years', level: 8.9 },
      { period: '5 Years', level: 9.4 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 141, avgRegret: 8.6 },
      { country: 'United Kingdom', count: 42, avgRegret: 8.5 },
      { country: 'Canada', count: 31, avgRegret: 8.8 },
      { country: 'Australia', count: 21, avgRegret: 8.7 }
    ]
  },
  {
    slug: 'friend-zone',
    name: "Friend Zone Limbo",
    category: 'Red Flags',
    description: "Stories, outcomes, regrets, and relationship results from individuals who spent months or years acting as a platonic friend while harboring deep romantic feelings, hoping they would eventually be loved back.",
    stats: {
      storyCount: 184,
      avgRegret: 7.9,
      wouldDoAgainPercent: 12,
      stillTogetherPercent: 5,
      marriedPercent: 2,
      separatedPercent: 93,
      avgRelationshipLength: "2.1 Years"
    },
    decisionBreakdown: [
      { name: 'Confessed and Cut Contact', percentage: 55 },
      { name: 'Stayed as Platonic Friend', percentage: 35 },
      { name: 'Tried Friends-with-Benefits', percentage: 10 }
    ],
    outcomeBreakdown: [
      { name: 'Friendship Faded Entirely', value: 68 },
      { name: 'Remained Distant Acquaintances', value: 20 },
      { name: 'Successfully Became a Couple', value: 7 },
      { name: 'Still Stuck in Limbo', value: 5 }
    ],
    regretOverTime: [
      { period: '1 Month', level: 5.2 },
      { period: '6 Months', level: 6.8 },
      { period: '1 Year', level: 8.1 },
      { period: '2 Years', level: 8.9 },
      { period: '5 Years', level: 9.2 }
    ],
    countryBreakdown: [
      { country: 'United States', count: 98, avgRegret: 8.1 },
      { country: 'United Kingdom', count: 24, avgRegret: 7.6 },
      { country: 'Canada', count: 18, avgRegret: 8.0 },
      { country: 'Australia', count: 14, avgRegret: 7.8 },
      { country: 'India', count: 30, avgRegret: 8.4 }
    ]
  }
];

export const PRESEEDED_STORIES: Story[] = [
  {
    id: 's1',
    title: "Waited 8 years for him to 'be ready.' He married his next girlfriend in 6 months.",
    situationSlug: 'boyfriend-doesnt-want-marriage',
    situationName: "Boyfriend Doesn't Want Marriage",
    age: 31,
    gender: "Female",
    country: "United States",
    relationshipDuration: "8 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 9,
    wouldDoAgain: "No",
    dateAdded: "2025-05-10",
    tags: ["marriage", "commitment", "wasted-time"],
    fullStory: "We started dating in college when I was 21 and he was 22. By year 4, I was starting to bring up marriage. He always had an excuse: first it was 'when we graduate,' then 'when I get a promotion,' then 'when interest rates drop to buy a house.' I kept telling myself he loved me, and he did, but he was never enthusiastic about formal commitment. I stayed through all the move-ins, cooked his meals, acted like a wife in every single way. By year 8, I was 29 and gave him a soft ultimatum. He got defensive and said I was pressuring him. We split up. It nearly destroyed me. \n\nSix months later, a mutual friend told me he was engaged to a girl he met at a coffee shop. They got married three months after that. He wasn't afraid of marriage; he was just afraid of marrying *me*. Please, if a man says he doesn't want marriage, believe him. Don't waste your youth playing house for someone who values you as an option but not a permanent choice.",
    userName: "unravelled_soul",
    helpfulVotes: 1248,
    timeline: [
      { year: "2017", stage: "Situation Started", description: "Began dating in our early twenties, deeply in love." },
      { year: "2021", stage: "First Marriage Talk", description: "Brought up proposal. He stated he wanted financial security first." },
      { year: "2024", stage: "Decision Made (Stayed)", description: "Decided to wait another year, hoping his mindset would change." },
      { year: "2025", stage: "Relationship Ended", description: "Discovered he was actively avoiding combining finances. Left." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2025-06-10",
        text: "I still feel waves of extreme sadness. The hardest part is driving by our old favorite spots, but I have started therapy, which is keeping me stable.",
        regretScore: 9
      },
      {
        daysAfter: 90,
        dateAdded: "2025-08-10",
        text: "I found out about him getting engaged. It feels like a physical punch in the stomach. My therapist says this is his limitation, not mine, but the rejection is unbearable.",
        regretScore: 10
      },
      {
        daysAfter: 180,
        dateAdded: "2025-11-10",
        text: "The fog is finally clearing. I recently went on a first date with a man who explicitly stated he wants marriage in his future on date one. It was so refreshing.",
        regretScore: 8
      },
      {
        daysAfter: 365,
        dateAdded: "2026-05-10",
        text: "I am celebrating one year since leaving him! My regret score has dropped because I realize staying would have cost me my remaining fertile years. I feel light, free, and proud of my strength.",
        regretScore: 2
      }
    ]
  },
  {
    id: 's2',
    title: "I forgave his 'one-time slip up' after 3 years. It turned into a double-life with a second family.",
    situationSlug: 'stayed-after-cheating',
    situationName: "Stayed After Cheating",
    age: 38,
    gender: "Female",
    country: "Canada",
    relationshipDuration: "7 Years",
    decisionMade: "Stayed",
    currentOutcome: "Divorced",
    regretScore: 10,
    wouldDoAgain: "No",
    dateAdded: "2024-11-02",
    tags: ["cheating", "trust", "children", "divorce"],
    fullStory: "We had been married for 3 years when I saw messages on his iPad. He begged, cried, went on his knees, and blamed it on a stressful business trip and too much alcohol. He promised to go to therapy and write down every single location he went to. Out of love and for our 1-year-old child, I stayed. \n\nFor three years, things seemed to return to normal, although I was constantly checking his location and living with high baseline anxiety. Then, his business trips became longer. Long story short, I hired a private investigator. He wasn't just having casual hookups; he had rented an apartment in another city for a college student, took care of her bills, and they had a baby together. \n\nStaying after cheating just teaches them that you will tolerate disrespect. They don't respect your forgiveness; they see it as weakness. I regret staying with every bone in my body.",
    userName: "shattered_glass_99",
    helpfulVotes: 981,
    timeline: [
      { year: "2018", stage: "First Infidelity Discovered", description: "Saw texting history. He claimed it was a one-off mistake." },
      { year: "2019", stage: "Decision Made (Stayed)", description: "Decided to forgive him, attend marriage therapy, and maintain the household." },
      { year: "2024", stage: "Double Life Exposed", description: "Discovered physical flat, shared lease, and child with another woman." },
      { year: "2025", stage: "Divorce Finalized", description: "Cut all ties except court-ordered co-parenting." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2024-12-02",
        text: "The divorce proceedings are messy. He is trying to hide assets. Staying those extra years just made my financial entanglements far harder to clean up.",
        regretScore: 10
      },
      {
        daysAfter: 180,
        dateAdded: "2025-05-02",
        text: "Spoke to a network of survivors of chronic cheaters. It helped validate that these people are pathologists, not just 'making mistakes.' Starting to feel whole again.",
        regretScore: 9
      }
    ]
  },
  {
    id: 's3',
    title: "Moved from London to rural Canada for her. Best decision of my life.",
    situationSlug: 'moved-for-love',
    situationName: "Moved For Love",
    age: 29,
    gender: "Male",
    country: "United Kingdom",
    relationshipDuration: "5 Years",
    decisionMade: "Moved Together",
    currentOutcome: "Married",
    regretScore: 1,
    wouldDoAgain: "Yes",
    dateAdded: "2025-02-15",
    tags: ["long-distance", "moving", "successful-stories"],
    fullStory: "We met online in 2020 during lockdown and had a long-distance relationship for 2 years. She lived in a small lakeside town in Ontario, Canada, and I lived in downtown London. Moving to rural Ontario meant resigning from my banking job, leaving my family, and drastically changing my sensory daily life. Everyone told me I was insane. \n\nI decided to take the leap anyway. That was 3 years ago. I secured a remote consulting gig, learned to chop wood, buy snowshoes, and we built a life on 5 acres of land. We got married last summer. Being away from London's pollution has cured my asthma, and the sheer peacefulness of rural life made me realize how stressed I was in London. She is my best friend. If you genuinely share values and have a plan for career transferability, moving for love can open up a world you never knew you needed.",
    userName: "london_to_lake",
    helpfulVotes: 730,
    timeline: [
      { year: "2020", stage: "Met Online", description: "Met via a gaming community, clicked immediately" },
      { year: "2022", stage: "Decision Made (Move)", description: "Left my job, boarded a transatlantic flight, moved to her hometown" },
      { year: "2024", stage: "Married", description: "Bespoke small wedding by the lake, fully settled" }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2025-03-15",
        text: "First Canadian winter was brutal but we stayed cozy. Absolutely no regrets.",
        regretScore: 1
      },
      {
        daysAfter: 180,
        dateAdded: "2025-08-15",
        text: "We just found out she is pregnant with our first child! Parents are flying in from London. Best decision of my life.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's4',
    title: "I agreed to go Childfree to keep my husband. Now I look at other children with tears in my eyes.",
    situationSlug: 'partner-doesnt-want-kids',
    situationName: "Partner Doesn't Want Kids",
    age: 42,
    gender: "Female",
    country: "Australia",
    relationshipDuration: "14 Years",
    decisionMade: "Stayed",
    currentOutcome: "Complicated",
    regretScore: 8,
    wouldDoAgain: "No",
    dateAdded: "2025-01-20",
    tags: ["children", "marriage-compromise", "sadness"],
    fullStory: "When we married at 28, we left the 'kids' discussion vague. He said he 'wasn't ready yet.' By 34, he admitted he never wanted them. He valued his peace, sleep, and our frequent travel to Bali and Europe. I felt sick. I loved him to pieces, he was an incredible husband. I read countless articles hoping I would wake up and agree with the Childfree movement. I actively chose to stay and booked a tubal ligation to align with his choice. \n\nI am now 42. Our biological window is shut. Our friends all have pre-teens and teenagers now. I see them celebrating graduations, school sports, or just having chaotic Christmas dinners, and my heart breaks into millions of pieces. My husband is still a good man, but every time he plans another luxury holiday, I just think of the nursery we never had. We have wealth, but no legacy. If you have baby fever, do NOT compromise it away for a partner. Resentment is a slow poison that will kill the love anyway.",
    userName: "empty_nest_never_full",
    helpfulVotes: 1450,
    timeline: [
      { year: "2012", stage: "Married", description: "Vague agreement to discuss kids when we are in our thirties." },
      { year: "2018", stage: "The Confession", description: "He confessed he is child-free. I made the decision to stay." },
      { year: "2020", stage: "Sterilization Action", description: "Underwent physical procedure to ensure no accidents." },
      { year: "2026", stage: "Deep Sadness Peak", description: "Struggling with maternal grief. Feeling distant from husband." }
    ],
    updates: [
      {
        daysAfter: 90,
        dateAdded: "2025-04-20",
        text: "We tried discussing adoption or fostering, but he is completely closed to any form of raising kids. It was a firm boundary. I feel trapped.",
        regretScore: 9
      }
    ]
  },
  {
    id: 's5',
    title: "I forgave his emotional affair with his 'gym buddy.' Two years of secret therapy later, we are stronger than ever.",
    situationSlug: 'stayed-after-cheating',
    situationName: "Stayed After Cheating",
    age: 34,
    gender: "Female",
    country: "United Kingdom",
    relationshipDuration: "6 Years",
    decisionMade: "Stayed",
    currentOutcome: "Married",
    regretScore: 2,
    wouldDoAgain: "Yes",
    dateAdded: "2024-08-11",
    tags: ["cheating", "emotional-affair", "couples-therapy", "rebuilding-trust"],
    fullStory: "We had been together for four years when I found late-night chat logs between my partner and his fitness trainer. He described her as a 'gym buddy' and said it was 'just locker room venting,' but their exchange of intimate personal boundaries and late-night calls clearly crossed the line into emotional infidelity. I was devastated because there was no physical contact, yet the emotional trust was completely shattered. Everyone on online forums told me to pack my bags, saying once an emotional cheater, always a cheater.\n\nBut we decided to try couples therapy, and it changed everything. It took two full years of open-phone policy, complete transparency on his whereabouts, and uncomfortable therapeutic sessions. He never got defensive; he held space for my triggers and anxieties. Today, we are married and have reconstructed our union from the studs up. If you are struggling with whether to forgive emotional cheating, it is possible—but only if your partner is 100% willing to do the heavy therapeutic lifting with you.",
    userName: "resilient_heart",
    helpfulVotes: 612,
    timeline: [
      { year: "2022", stage: "Emotional Infidelity Exposed", description: "Discovered secretive texting and late-night calls with the gym trainer." },
      { year: "2023", stage: "Decision Made (Stayed)", description: "Agreed to remain together, booked weekly couples therapy sessions." },
      { year: "2024", stage: "Completed Rebuilding", description: "Re-established emotional safety, he voluntarily deleted social profiles." },
      { year: "2025", stage: "Got Married", description: "Committed to marriage with absolute security and transparency." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2024-09-11",
        text: "I still feel highly anxious when he leaves his phone face down. Healing is definitely not linear, but he is patient and reassuring every time I ask.",
        regretScore: 5
      },
      {
        daysAfter: 180,
        dateAdded: "2025-02-11",
        text: "We have finished 6 months of weekly therapy. The frequency of my panic attacks has dropped significantly. We are learning to communicate before problems fester.",
        regretScore: 3
      },
      {
        daysAfter: 365,
        dateAdded: "2025-08-11",
        text: "It has been a year. We got engaged! He proposed at the beach. I feel genuinely excited for our future, and the shadow of the gym buddy has dissipated.",
        regretScore: 2
      },
      {
        daysAfter: 720,
        dateAdded: "2026-08-11",
        text: "We are now married! Best decision was to stay and rebuild. Forgiving can succeed, but only if the partner is fully dedicated to psychological reform.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's6',
    title: "Gave up my corporate law career to relocate with my boyfriend. I ended up feeling like a dependent maid.",
    situationSlug: 'moved-for-love',
    situationName: "Moved For Love",
    age: 30,
    gender: "Female",
    country: "Germany",
    relationshipDuration: "4 Years",
    decisionMade: "Moved Together",
    currentOutcome: "Separated",
    regretScore: 9,
    wouldDoAgain: "No",
    dateAdded: "2025-03-22",
    tags: ["moving", "career-loss", "isolation", "resentment"],
    fullStory: "I was practicing corporate law in Munich when my boyfriend received a major executive promotion in an industrial town in northern Germany. The plan was simple: I would relocate with him, take a brief break, and then apply for a new corporate legal role in the local district. I was deeply in love, so giving up my professional status felt like a romantic sacrifice.\n\nInstead, it was a trap. The local market had almost zero corporate law openings. Within eight months, I was sitting at home, completely isolated from my friends, while he worked 12-hour days. Because he paid all the rent and expenses, he began expecting me to handle 100% of the household chore duties, meal prep, and laundry. Whenever I expressed frustration at being a dependent housewife, he accused me of being ungrateful for his hard-earned income. The power dynamic shifted permanently, and my self-esteem plummeted. I eventually packed my things and moved back to Munich. Giving up your professional career and financial independence to relocate for a partner's job is a massive risk. Ensure you have your own solid career backup before moving.",
    userName: "munich_lawyer_lost",
    helpfulVotes: 984,
    timeline: [
      { year: "2022", stage: "Career Peak in Munich", description: "Successfully practicing corporate law, living independently." },
      { year: "2023", stage: "Decision Made (Relocated)", description: "Resigned from my firm, packed my apartment, moved north." },
      { year: "2024", stage: "Household Codependency", description: "Felt trapped in housekeeper expectations, isolated without local lawyers network." },
      { year: "2025", stage: "Broke Up and Left", description: "Formulated departure plan, signed a lease back in Munich, left him." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2025-04-22",
        text: "I am renting a tiny sub-let apartment back in Munich, but my self-respect is back to 100%. I am interviewing with three corporate firms next week.",
        regretScore: 3
      },
      {
        daysAfter: 180,
        dateAdded: "2025-09-22",
        text: "Re-hired at a wonderful boutique law firm! I am self-funding my recovery. Looking back, I can't believe how easily I gave up my hard-earned agency.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's7',
    title: "We split up after 6 years because I wanted to get married and he 'didn't believe in the institution.' It was torture, but the right choice.",
    situationSlug: 'boyfriend-doesnt-want-marriage',
    situationName: "Boyfriend Doesn't Want Marriage",
    age: 32,
    gender: "Female",
    country: "Canada",
    relationshipDuration: "6 Years",
    decisionMade: "Left",
    currentOutcome: "Separated",
    regretScore: 1,
    wouldDoAgain: "Yes",
    dateAdded: "2025-01-05",
    tags: ["marriage", "commitment-issues", "ultimatum", "healing"],
    fullStory: "We lived together for four years and built an entire shared world together. But whenever friends asked when we were getting married, he would roll his eyes and say marriage was 'just a piece of paper' and a 'scheme for the government to track us.' He said our love was pure because we didn't need a ceremony. I tried to suppress my desires for legal safety, symbolic unity, and a celebration with family. I tried to be the cool, modern girlfriend who didn't care.\n\nBut as I turned 31, I realized I did care. If we bought a house or had a medical crisis, I wanted full legal rights. More than that, I wanted a partner who was proud to stand up in front of our community and declare his eternal commitment to me. I gave him a clear timeline of 6 months to decide. He refused, calling me an outdated traditionalist. It was the hardest breakup of my life, but I walked away. Today, I am engaged to a man who literally cried with joy when I accepted his proposal. Do not spend years trying to convince someone to value the commitments you deserve.",
    userName: "paper_and_promises",
    helpfulVotes: 1102,
    timeline: [
      { year: "2019", stage: "Relationship Started", description: "Began a beautiful companionship, living together early on." },
      { year: "2023", stage: "First Major Conflict", description: "Discussions regarding legal protections and public celebration rejected." },
      { year: "2024", stage: "Decision Made (Walked Away)", description: "Issued six-month milestone. He stood firm on his anti-marriage philosophy. I left." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2025-02-05",
        text: "I cry almost every day. My friends say six years is a massive investment to just drop, which makes me doubt my boundary. The loneliness of a new apartment is rough.",
        regretScore: 7
      },
      {
        daysAfter: 180,
        dateAdded: "2025-07-05",
        text: "The acute grief has subsided. I see now that he had absolute power because he knew I would compromise my fundamental dreams to keep him. Realizing this has cured my self-doubt.",
        regretScore: 2
      },
      {
        daysAfter: 365,
        dateAdded: "2026-01-05",
        text: "I met an incredible partner who wants the exact same future. We just got engaged! I am so glad I didn't waste another 5 years waiting for an anti-commitment philospher to change.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's8',
    title: "He wanted kids, I was childfree. I decided to leave the man I loved to let him have his family.",
    situationSlug: 'partner-doesnt-want-kids',
    situationName: "Partner Doesn't Want Kids",
    age: 28,
    gender: "Female",
    country: "Australia",
    relationshipDuration: "5 Years",
    decisionMade: "Left",
    currentOutcome: "Separated",
    regretScore: 1,
    wouldDoAgain: "Yes",
    dateAdded: "2024-09-18",
    tags: ["children", "childfree", "compatibility", "tough-choices"],
    fullStory: "We met in our early twenties and were perfectly compatible in every single way—except one. He had a deep, biological yearning to be a father. He wanted to coach soccer, read bedtime stories, and pass down his family name. I, on the other hand, had zero maternal instinct. I valued my quiet lifestyle, my career as an artist, and having complete financial and spatial autonomy. I knew having a child would make me feel resentful and trapped.\n\nWe both tried to convince ourselves that we could compromise, but children are a binary choice. You cannot have half a child. I realized that if I stayed and forced him to be childfree, he would eventually resent me as his peers started families. If he convinced me to have a baby, I would resent him. I loved him too much to steal his dream of being a father. I ended the relationship so he could find someone who shared his vision. \n\nTwo years later, he is happily married to a lovely woman, and they just welcomed a baby boy. I received a postcard from him thanking me for my courage. I am still childfree, traveling the world, and painting full-time. It was the maturity of walking away that saved us from mutual resentment.",
    userName: "autonomy_over_all",
    helpfulVotes: 1394,
    timeline: [
      { year: "2019", stage: "Met and Fell in Love", description: "Began a passionate relationship, fully aligned on life goals except children." },
      { year: "2022", stage: "Compromise Debates", description: "Spent a year trying to find a middle ground, realizing kids are non-negotiable." },
      { year: "2024", stage: "Decision Made (Broke Up)", description: "Ended the relationship with absolute love and respect, freeing him to pursue parenting." }
    ],
    updates: [
      {
        daysAfter: 90,
        dateAdded: "2024-12-18",
        text: "Breakups where no one did anything wrong are the hardest to get over. But seeing him holding his sister's newborn made me realize I made the correct call.",
        regretScore: 3
      },
      {
        daysAfter: 180,
        dateAdded: "2025-03-18",
        text: "I am hosting my first solo art flight in Sydney next month. I have complete focus, freedom, and peaceful quiet. My lifestyle is exactly what I wanted.",
        regretScore: 1
      },
      {
        daysAfter: 365,
        dateAdded: "2025-09-18",
        text: "He got married to someone who shares his family vision. I felt a small pang, but mostly immense relief. We both get to live our authentic truths.",
        regretScore: 1
      },
      {
        daysAfter: 720,
        dateAdded: "2026-09-18",
        text: "He sent a photo of his newborn baby with a beautiful note. We saved each other from decades of bitter resenting. Standing by your dealbreakers is the ultimate form of self-love.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's9',
    title: "Spent 4 years in a long-distance relationship expecting a magical closing of the gap. We broke up within 3 months of moving in together.",
    situationSlug: 'long-distance-relationship',
    situationName: "Long Distance Relationship",
    age: 27,
    gender: "Female",
    country: "United States",
    relationshipDuration: "4 Years",
    decisionMade: "Moved Together",
    currentOutcome: "Separated",
    regretScore: 7,
    wouldDoAgain: "No",
    dateAdded: "2025-04-12",
    tags: ["long-distance", "moving-in", "reality-check"],
    fullStory: "We were long-distance between Boston and Los Angeles for four years during college and early career. Every visit was like a vacation—expensive dinners, beach walks, and 100% focused romance. We thought we were incredibly strong because we survived the separation. \n\nThen, I transferred my job to LA, and we got an apartment. The fantasy crashed immediately. He was messy, passive-aggressive, and spent his weekends playing video games instead of doing the 'romantic' things we did on visits. And I realized we didn't actually know each other's daily habits at all. We loved the long-distance idea of each other, but the physical reality wasn't compatible. We broke up in 3 months. I regret moving across the country without a trial run first.",
    userName: "distance_illusion",
    helpfulVotes: 512,
    timeline: [
      { year: "2021", stage: "Long Distance Began", description: "Started long-distance dating between Boston and LA." },
      { year: "2024", stage: "Decision Made (Relocated)", description: "Decided to relocate to LA to live together." },
      { year: "2025", stage: "Broke Up", description: "Discovered extreme lifestyle incompatibility and split up." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2025-05-12",
        text: "Moving to my own studio apartment in LA now. It's tough but at least I have my own space and can rebuild my life on my own terms.",
        regretScore: 5
      }
    ]
  },
  {
    id: 's10',
    title: "Married with different religions. Thought we could just love each other. The holiday cycles and children discussions are breaking us.",
    situationSlug: 'different-religion-marriage',
    situationName: "Different Religion Marriage",
    age: 35,
    gender: "Male",
    country: "India",
    relationshipDuration: "8 Years",
    decisionMade: "Married",
    currentOutcome: "Complicated",
    regretScore: 6,
    wouldDoAgain: "No",
    dateAdded: "2025-03-01",
    tags: ["marriage", "religion", "family-friction"],
    fullStory: "I am Hindu and she is Christian. When we got married, we agreed we would respect each other's beliefs and let our future kids choose. It sounded progressive and simple. But then we had kids. \n\nHer family insisted on baptism, while my parents wanted traditional ceremonies. Every holiday became an intense tug-of-war. We are constantly arguing about what values, scriptures, and dietary laws to teach our 5-year-old child. It's exhausting because faith is deep-rooted, and neither of us wants to compromise our heritage. If you choose an interfaith marriage, agree on the exact child-raising protocols in writing before wedding, otherwise it will become a source of daily tension.",
    userName: "interfaith_weary",
    helpfulVotes: 440,
    timeline: [
      { year: "2018", stage: "Married", description: "Got married, agreed to a mutual respect arrangement." },
      { year: "2021", stage: "First Child Born", description: "In-laws and parents began demanding specific religious rites." },
      { year: "2026", stage: "Constant Friction", description: "Daily arguments regarding nursery teachings and holiday plans." }
    ],
    updates: [
      {
        daysAfter: 90,
        dateAdded: "2025-06-01",
        text: "We just scheduled regular family mediation sessions. It's helping establish boundaries for the grandparents, who were adding 90% of the fuel to the fire.",
        regretScore: 4
      }
    ]
  },
  {
    id: 's11',
    title: "Gave him a marriage ultimatum after 5 years. He checked the boxes resentfully and we divorced inside 2 years.",
    situationSlug: 'marriage-ultimatum',
    situationName: "Marriage Ultimatum",
    age: 33,
    gender: "Female",
    country: "United States",
    relationshipDuration: "7 Years",
    decisionMade: "Married",
    currentOutcome: "Divorced",
    regretScore: 8,
    wouldDoAgain: "No",
    dateAdded: "2024-10-15",
    tags: ["marriage", "ultimatum", "divorce"],
    fullStory: "He kept dodging engagement talks, so I gave him a hard ultimatum: propose by my 30th birthday or we split. He looked terrified but went out and bought a ring. We married a year later. \n\nBut the magic was dead. He treated the wedding like a financial chore, showed zero interest in planning, and would passively bring up 'being forced into things' during every minor argument. He grew cold and distant because he felt his agency was stripped. We divorced in 2 years. I learned that an forced commitment is worse than a clean breakup. If you have to demand a commitment, it's not genuine.",
    userName: "ultimatum_casualty",
    helpfulVotes: 810,
    timeline: [
      { year: "2018", stage: "Dating Peak", description: "Living together, very happy but no ring." },
      { year: "2022", stage: "Decision Made (Ultimatum)", description: "Gave proposal deadline. He proposed out of fear of loss." },
      { year: "2023", stage: "Married", description: "Sparsely attended wedding with constant underlying tension." },
      { year: "2025", stage: "Divorced", description: "Agreed to split to end the permanent passive aggression." }
    ],
    updates: [
      {
        daysAfter: 180,
        dateAdded: "2025-04-15",
        text: "The divorce is final. I feel a massive weight lifted off my shoulders. I don't have to walk on eggshells or apologize for wanting commitment anymore.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's12',
    title: "Ignored early red flags because the chemistry was off-the-charts. Ended up isolated and financially ruined.",
    situationSlug: 'ignored-red-flags',
    situationName: "Ignored Red Flags",
    age: 29,
    gender: "Male",
    country: "Australia",
    relationshipDuration: "3 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 9,
    wouldDoAgain: "No",
    dateAdded: "2025-05-20",
    tags: ["red-flags", "control", "manipulation", "finances"],
    fullStory: "In the first month, she was love-bombing me constantly—talking about future houses, kids, and soulmates. She also hated when I saw my friends and would start crying saying she felt neglected. She was beautiful, and the romance was intense, so I assumed she was just deeply in love. \n\nOver 3 years, she slowly pruned away all my support systems. She convinced me to co-sign a massive car loan for her, then maxed out my credit cards. When I confronted her, she'd flip it on me, calling me unsupportive. By the time I left, I sat in an empty house with ruined credit and no friends left. Never excuse control for passion. Hard boundaries on week one are vital.",
    userName: "passion_blinded",
    helpfulVotes: 915,
    timeline: [
      { year: "2022", stage: "Love Bombing Stage", description: "Extreme affection paired with early isolation demands." },
      { year: "2024", stage: "Financial Co-Signing", description: "Co-signed car loan, transferred my emergency funds to her credit line." },
      { year: "2025", stage: "The Break", description: "Woke up to the toxic cycles, family helped me escape." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2025-06-20",
        text: "I'm working two jobs to pay down the co-signed debt, but I've reconnected with my best friend. They welcomed me back immediately. There is life after toxic relationships.",
        regretScore: 4
      }
    ]
  },
  {
    id: 's13',
    title: "My gut told me he was hiding something. He called me paranoid for 2 years. He was living a secret double life on dating apps.",
    situationSlug: 'ignored-red-flags',
    situationName: "Ignored Red Flags",
    age: 32,
    gender: "Female",
    country: "United States",
    relationshipDuration: "4 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 10,
    wouldDoAgain: "No",
    dateAdded: "2026-06-18",
    tags: ["red-flags", "cheating", "trust", "gaslighting"],
    fullStory: "We were living together and planning our future. But he started taking his phone to the bathroom and leaving it face down on the table. Every time I asked him why his behavior had changed, he sighed, rolled his eyes, and called me 'crazy,' 'insecure,' and 'paranoid.' He said that if I didn't trust him, our relationship was doomed anyway, which made me feel guilty. So I suppressed my gut feeling, thinking I was indeed the problem, and tried to be the chill, trusting girlfriend.\n\nTwo years of this psychological torture went on. Then, a friend of mine spotted his active profile on Tinder. When I confronted him with the screenshot, he couldn't deny it anymore. He had been meeting women for casual hookups the entire time. Trust your intuition. If a partner makes you feel insane for asking simple, respectful questions about changed behaviors, he is gaslighting you to protect his secrets.",
    userName: "gut_was_right_32",
    helpfulVotes: 512,
    timeline: [
      { year: "2022", stage: "Changed Phone Habits", description: "He began shielding his screen. Accused me of paranoia when asked." },
      { year: "2024", stage: "Decision Made (Stayed)", description: "Chose to stay and apologize for my insecurity, hoping to restore peace." },
      { year: "2026", stage: "Dating Apps Exposed", description: "Discovered active profiles. Packed my bags and left within 24 hours." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2026-07-18",
        text: "I feel incredibly relieved. The chronic anxiety and self-doubt that I carried for two years vanished the minute I left his house. I was never crazy.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's14',
    title: "Gave him an ultimatum to move in together after 4 years. He reluctantly agreed, but his daily passive-aggression drove me to leave anyway.",
    situationSlug: 'long-distance-relationship',
    situationName: "Long Distance Relationship",
    age: 28,
    gender: "Female",
    country: "Canada",
    relationshipDuration: "5 Years",
    decisionMade: "Moved Together",
    currentOutcome: "Separated",
    regretScore: 8,
    wouldDoAgain: "No",
    dateAdded: "2026-05-15",
    tags: ["long-distance", "ultimatum", "moving-in", "resentment"],
    fullStory: "We had been dating long-distance for 4 years. I was tired of airport goodbyes and wanted to close the gap. He kept finding reasons to delay, saying his career was too busy. Finally, I told him: either we sign a lease together in the same city, or we break up. He looked cornered but reluctantly agreed to let me relocate to his city.\n\nBut the moment I arrived, he made me pay for that ultimatum in a thousand silent ways. He never cleared space in his closets. He would loudly sigh when doing dishes or sharing the living room. Every weekend, he went out with his friends, leaving me isolated in a new city where I had no network. I realized he was letting me live there physically, but he had locked me out of his life emotionally. I packed my boxes and left after six months. If he has to be forced into taking the next step, he will make you pay for his lost freedom.",
    userName: "reluctant_lease_holder",
    helpfulVotes: 420,
    timeline: [
      { year: "2021", stage: "Long Distance Dating", description: "Dated long-distance, seeing each other once a month." },
      { year: "2025", stage: "Decision Made (Ultimatum)", description: "Issued a 'move together or break up' ultimatum. He agreed to let me relocate." },
      { year: "2026", stage: "Silent Resentment Era", description: "Lived together in constant tension. He isolated me and acted cold." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2026-06-15",
        text: "Moving back to my home city. The financial cost of relocating twice was brutal, but living with someone who resents your physical presence is far more costly to your soul.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's15',
    title: "He spent our entire house downpayment on speculative crypto behind my back. I forgave him, but the financial anxiety is killing our intimacy.",
    situationSlug: 'ignored-red-flags',
    situationName: "Ignored Red Flags",
    age: 34,
    gender: "Female",
    country: "Australia",
    relationshipDuration: "6 Years",
    decisionMade: "Stayed",
    currentOutcome: "Complicated",
    regretScore: 8,
    wouldDoAgain: "No",
    dateAdded: "2026-04-10",
    tags: ["red-flags", "finances", "marriage-compromise", "trust"],
    fullStory: "We were married for three years and saving diligently for our first home. I thought we had $65,000 in our high-yield savings account. When we finally found a townhouse and went to put down the holding deposit, he went pale and confessed: he had transferred the entire sum to a crypto exchange a year ago to invest in a 'sure thing' meme coin. It had crashed to zero.\n\nHe wept, went on his knees, and promised to work overtime and hand over full control of his bank credentials to me. I loved him, so I agreed to stay and work through it. But the financial infidelity has changed me. I am constantly checking his bank balances like a detective. Every time he buys a coffee, my stomach knots. I can't look at him with respect anymore, and our sex life is non-existent. Forgiving financial cheating is possible on paper, but rebuilding the trust that he won't ruin your financial security is a long, draining road.",
    userName: "depleted_nest_egg",
    helpfulVotes: 610,
    timeline: [
      { year: "2020", stage: "Married & Saving", description: "Set up a joint account. Agreed to save for a mortgage." },
      { year: "2025", stage: "The Confession", description: "Discovered the savings were completely gone due to crypto trading." },
      { year: "2026", stage: "Decision Made (Stayed)", description: "Forgave him under strict financial monitoring, but baseline respect is shattered." }
    ],
    updates: [
      {
        daysAfter: 60,
        dateAdded: "2026-06-10",
        text: "He is indeed working overtime and transferring every dollar to my account, but my anxiety remains sky-high. I feel like his probation officer, not his wife.",
        regretScore: 8
      }
    ]
  },
  {
    id: 's16',
    title: "I was sure she would change her mind about kids because she was 'so good with my nieces.' She didn't. Now I am 39 and starting over.",
    situationSlug: 'partner-doesnt-want-kids',
    situationName: "Partner Doesn't Want Kids",
    age: 39,
    gender: "Male",
    country: "United Kingdom",
    relationshipDuration: "8 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 9,
    wouldDoAgain: "No",
    dateAdded: "2026-03-20",
    tags: ["children", "compatibility", "wasted-time", "divorce"],
    fullStory: "When we started dating, she told me on date three that she did not want to raise children. I nodded along, but internally, I thought, 'She is only 25, she will change her mind once we get married.' Every time she played wonderfully with my nieces and nephews, I smiled and thought my theory was correct.\n\nWe married, and as we hit our thirties, my desire to be a father grew into an ache. But she was firm. She had built a great career in marketing and cherished her sleeping schedules and independence. When I brought up children, she looked shocked: 'I told you from day one I was childfree.' I spent three more years trying to convince her, hoping she would 'soften.' She never did. We divorced last year. I am 39, single, and starting over in the dating market, desperately hoping to meet someone who wants to start a family before my biological window closes. Do not date someone hoping to change their core biological desires. It is disrespectful to them and devastating to you.",
    userName: "nephew_uncle_only",
    helpfulVotes: 730,
    timeline: [
      { year: "2018", stage: "Clear Declaration Ignored", description: "She stated she didn't want kids. I secretly assumed she'd change her mind." },
      { year: "2023", stage: "Decision Made (Stayed)", description: "Stayed through marriage hoping her maternal instinct would activate." },
      { year: "2025", stage: "The Final Separation", description: "Realized she would never change her mind. Divorced with deep mutual grief." }
    ],
    updates: [
      {
        daysAfter: 90,
        dateAdded: "2026-06-20",
        text: "Dating at 39 with 'wants kids' in my bio is highly stressful. I feel like my clock is ticking as much as any woman's. I regret wasting my thirties playing a waiting game.",
        regretScore: 9
      }
    ]
  },
  {
    id: 's17',
    title: "He proposed with a 'placeholder' ring and promised a wedding 'next year.' I realized he was just dangling a carrot to keep me around.",
    situationSlug: 'signs-he-doesnt-want-marriage',
    situationName: "Signs He Doesn't Want Marriage",
    age: 30,
    gender: "Female",
    country: "United States",
    relationshipDuration: "6 Years",
    decisionMade: "Left",
    currentOutcome: "Separated",
    regretScore: 1,
    wouldDoAgain: "Yes",
    dateAdded: "2026-02-12",
    tags: ["marriage", "commitment-issues", "manipulation", "healing"],
    fullStory: "We had been dating for 5 years. I was 29 and made it clear that marriage was my goal. To prevent me from leaving, he proposed on a random Tuesday night in our living room with a $50 silver band, saying, 'Let's get this placeholder ring so you know I'm serious, and we will plan the real wedding next year.' I was thrilled and felt my patience had paid off.\n\nBut over the next year, every attempt to tour a venue or discuss a budget was met with annoyance. 'We don't have the funds yet,' or 'Why are you rushing me? We are already engaged.' Then, he suggested we postpone setting a date until he bought a new truck. I woke up: the proposal wasn't a commitment; it was a shut-up ring. It was a cheap way to buy another two years of my silence. I returned the ring and left. He didn't even fight to keep me. Do not fall for future-faking; if he wants to marry you, he will actively help plan the day.",
    userName: "no_more_placeholders",
    helpfulVotes: 890,
    timeline: [
      { year: "2020", stage: "Dating Peak", description: "Happy and building a household together." },
      { year: "2025", stage: "Decision Made (Left)", description: "Received a placeholder ring but he refused to set any wedding date. Walked away." },
      { year: "2026", stage: "Rebuilding Life", description: "Renting my own apartment, focusing on my mental health and career." }
    ],
    updates: [
      {
        daysAfter: 120,
        dateAdded: "2026-06-12",
        text: "I found out he is dating someone new and telling everyone how glad he is that he didn't sign a marriage license. It hurts, but it proves my gut was 100% right. I escaped a lifetime of waiting.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's18',
    title: "I was her 'platonic best friend' for 3 years, paid her rent once, and helped her move twice. Then she introduced me as her 'brother' to her new boyfriend.",
    situationSlug: 'friend-zone',
    situationName: "Friend Zone Limbo",
    age: 26,
    gender: "Male",
    country: "United States",
    relationshipDuration: "3 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 10,
    wouldDoAgain: "No",
    dateAdded: "2026-03-10",
    tags: ["friendzone", "unrequited-love", "boundaries", "rejection"],
    fullStory: "For three years, I was her emotional anchor. I listened to her complain about toxic guys for hours, picked her up from the airport at 2 AM, and even lent her $1,200 when she was short on rent. I secretly adored her, and whenever I tried to talk about us being more, she'd say she 'valued our friendship too much to ruin it.' I convinced myself that if I just showed her enough loyalty and support, she'd eventually realize I was the one. Then, out of nowhere, she started dating this guy she met at a club who treated her like garbage. One night, we bumped into them, and she introduced me to him as 'like a big brother to me.' It hit me like a train. I was her boyfriend without any of the benefits, respect, or security. I went home, cried for hours, and then blocked her on everything. I regret wasting three years of my twenties playing therapist for a girl who used my feelings for free labor and attention.",
    userName: "brotherzoned_and_broke",
    helpfulVotes: 1450,
    timeline: [
      { year: "2023", stage: "Met as Friends", description: "Met at a local event, quickly became close confidants." },
      { year: "2024", stage: "Soft Confession", description: "Brought up my romantic interest. She put me in the 'valued friend' category." },
      { year: "2025", stage: "Decision Made (Stayed)", description: "Decided to keep supporting her, hoping she'd develop feelings over time." },
      { year: "2026", stage: "The Brother-Zone Betrayal", description: "Discovered she introduced me as her 'big brother' to a club boyfriend. Went no-contact." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2026-04-10",
        text: "She tried to reach out from a new number asking why I 'ghosted' her. I didn't reply. It's painful but my peace of mind is finally returning.",
        regretScore: 8
      },
      {
        daysAfter: 90,
        dateAdded: "2026-06-10",
        text: "I started going to the gym and focusing on my own hobbies. I can't believe how much time and energy I used to waste on someone who didn't even see me as a partner. Best decision ever to walk away.",
        regretScore: 1
      }
    ]
  },
  {
    id: 's19',
    title: "I worked 2 jobs to pay his rent and tuition while he finished his residency. The week he graduated, he broke up with me because we are 'in different leagues' now.",
    situationSlug: 'ignored-red-flags',
    situationName: "Ignored Red Flags",
    age: 29,
    gender: "Female",
    country: "United States",
    relationshipDuration: "5 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 10,
    wouldDoAgain: "No",
    dateAdded: "2026-01-15",
    tags: ["unbalanced-effort", "betrayal", "finances", "exploitation"],
    fullStory: "We met when we were 24. He was in medical school, broke, stressed, and struggling. I was working a stable corporate job, and I loved him so much that I took on a second retail job on weekends to fully support our living costs, buy his books, and pay his grocery bills so he could focus entirely on his studies. For 5 years, I didn't buy myself new clothes, we never went on vacations, and I did all the cooking and cleaning. I thought we were building our future. The week after he matched into his dream surgery residency and signed his six-figure contract, he sat me down and broke up with me. He told me that his social circle was changing, and that he felt we were 'growing in different directions' and that he needed a partner who 'matched his new professional caliber.' I was discarded like a ladder he used to climb out of his struggle. Never fund a man's potential at the expense of your own security. If they wanted to, they would—but only if you're not the one paying for their ticket.",
    userName: "medical_ladder_victim",
    helpfulVotes: 3200,
    timeline: [
      { year: "2021", stage: "Medical School Struggle", description: "Began cohabitating; I took on 2 jobs to cover our expenses." },
      { year: "2023", stage: "Decision Made (Stayed)", description: "Ignored friends warning me about his lack of reciprocity, continued funding his lifestyle." },
      { year: "2025", stage: "The Graduation discarding", description: "Discarded the exact week he secured his six-figure surgical contract." }
    ],
    updates: [
      {
        daysAfter: 60,
        dateAdded: "2026-03-15",
        text: "I hired a lawyer to see if I can sue him in small claims for the tuition loans I co-signed, but it is a legal uphill battle. I am completely broke and heartbroken.",
        regretScore: 10
      },
      {
        daysAfter: 180,
        dateAdded: "2026-07-15",
        text: "I decided to focus on myself. I got a major promotion at my own job because I finally have the energy to focus on my own career instead of running his. He tried to text me a half-hearted apology, but I left him on read. He's no longer my project.",
        regretScore: 3
      }
    ]
  },
  {
    id: 's20',
    title: "I stayed in an unhappy marriage 'for the kids.' Now that they are grown, they told me they wish I had divorced years ago.",
    situationSlug: 'partner-doesnt-want-kids',
    situationName: "Partner Doesn't Want Kids",
    age: 47,
    gender: "Female",
    country: "United States",
    relationshipDuration: "18 Years",
    decisionMade: "Stayed",
    currentOutcome: "Divorced",
    regretScore: 9,
    wouldDoAgain: "No",
    dateAdded: "2026-03-12",
    tags: ["staying-for-the-kids", "loveless-marriage", "divorce", "parenting"],
    fullStory: "For fifteen years, my marriage was a cold war. There was no physical abuse, but there was zero affection, constant passive-aggressive sniping, and long, icy silences. I convinced myself that staying together 'for the kids' was the noble, selfless thing to do. I wanted them to have a two-parent home, a stable house, and normal family holidays. So, I grit my teeth and endured it.\n\nLast Thanksgiving, my oldest daughter (now 22) and my son (20) were having a drink with me. Out of nowhere, my daughter said, 'Mom, we always knew you and Dad hated each other. Growing up in that house was so stressful. We felt the tension every single day. Honestly, we used to pray you guys would just get a divorce.'\n\nI was absolutely floored. I had sacrificed my own happiness, my mental health, and fifteen years of my life to protect them from divorce, only to find out that the hostile environment we created was actually worse for them. It taught them a completely broken model of what a relationship looks like. If you're staying together purely 'for the kids,' please don't. Kids are smart. They don't want two miserable parents under one roof.",
    userName: "peaceful_nest_seeker",
    helpfulVotes: 1850,
    timeline: [
      { year: "2008", stage: "The Silence Began", description: "Realized we had grown completely apart, but decided to stay together until the kids graduated high school." },
      { year: "2015", stage: "Decision Made (Stayed)", description: "Endured years of passive aggression and icy dinner tables, pretending everything was fine for their sake." },
      { year: "2024", stage: "The Divorce", description: "Our youngest went to college. We filed for divorce within six months. It was quiet, but the damage was done." }
    ],
    updates: [
      {
        daysAfter: 60,
        dateAdded: "2026-05-12",
        text: "My ex-husband and I barely speak, but the relief of living in a peaceful apartment without his constant sighing and eye-rolling is incredible. I only wish I did this when the kids were in elementary school.",
        regretScore: 8
      },
      {
        daysAfter: 180,
        dateAdded: "2026-09-12",
        text: "Had a long chat with my son. He admitted he used to hide in his room to avoid the 'vibes' in our house. Hearing that breaks my heart, but it confirms that children of divorce are happier than children of a bitter marriage.",
        regretScore: 9
      }
    ]
  },
  {
    id: 's21',
    title: "I spent my entire 20s financially supporting my boyfriend while he chased his 'dream.' He dumped me the second he actually made it.",
    situationSlug: 'ignored-red-flags',
    situationName: "Ignored Red Flags",
    age: 30,
    gender: "Female",
    country: "United Kingdom",
    relationshipDuration: "7 Years",
    decisionMade: "Stayed",
    currentOutcome: "Separated",
    regretScore: 10,
    wouldDoAgain: "No",
    dateAdded: "2026-02-18",
    tags: ["financial-exploitation", "wasted-twenties", "broken-promises", "users"],
    fullStory: "We met when we were 22. He was a talented guy but 'struggling' to find his path. He wanted to be a full-time music producer and creator. I believed in him completely, so I took a boring 9-to-5 corporate job and paid for everything. I paid the rent, the groceries, his car payments, his expensive gear, and his medical bills. Every time I brought up our lack of savings or his lack of contribution, he'd say I didn't believe in him or that he'd make it all up to me once he signed a deal. \n\nI spent seven years living like a broke college student, sacrificing my own hobbies and travel dreams to fund his. Last year, one of his tracks went viral on TikTok. He got signed, got a massive advance, and finally started making real money. \n\nTwo weeks later, he sat me down and said he 'needed space to find himself' and that our relationship felt 'too heavy and full of old baggage.' He moved into a luxury flat in London and started dating a 22-year-old influencer. He didn't even offer to pay back a single penny of the thousands I spent on him. I was literally just his launchpad. Please, never financially support a man who isn't your husband or showing equal hustle. You cannot buy a man's loyalty by paying his rent.",
    userName: "never_again_sponsor",
    helpfulVotes: 2420,
    timeline: [
      { year: "2019", stage: "The Promise", description: "He quit his retail job to focus on music. I agreed to cover rent for 'a few months' that turned into years." },
      { year: "2022", stage: "Decision Made (Stayed)", description: "Exhausted from working overtime, but caved when he cried and said I was his only support system." },
      { year: "2026", stage: "The Viral Hit & Dump", description: "His track went viral. He got signed, got rich, and dumped me via a 'we grew apart' conversation." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2026-03-20",
        text: "I'm struggling to pay rent on my own now since we had a joint lease and he just walked away. It is so humiliating to realize I funded his glow-up while draining my own savings.",
        regretScore: 10
      },
      {
        daysAfter: 120,
        dateAdded: "2026-06-20",
        text: "I've blocked him on everything. I started putting the money I used to spend on his groceries into a savings account, and I'm amazed at how fast it's growing. I'm finally reclaiming my financial power.",
        regretScore: 6
      }
    ]
  },
  {
    id: 's22',
    title: "I gave up my dream career and relocated for my husband's job. Now I'm a resentful stay-at-home parent with a huge gap on my resume.",
    situationSlug: 'moved-for-love',
    situationName: "Moved For Love",
    age: 34,
    gender: "Female",
    country: "Australia",
    relationshipDuration: "6 Years",
    decisionMade: "Stayed",
    currentOutcome: "Married",
    regretScore: 8,
    wouldDoAgain: "No",
    dateAdded: "2026-04-05",
    tags: ["career-sacrifice", "relocation", "financial-dependence", "stay-at-home-parent"],
    fullStory: "I had a fantastic, fast-paced marketing job in Sydney that I absolutely loved. I spent years building my network and was on track for a major promotion. Then my husband got offered a high-paying executive role in a very small, remote mining town. He promised it would only be for two years, and that we would save a ton of money and buy our dream house. He told me, 'It's a team decision, you can find something there or take a break.'\n\nThere were zero professional marketing roles in that town. None. To fill the time, we had our first baby sooner than planned. That was four years ago. We are still here. I have become a full-time, stay-at-home parent. I love my child, but I have completely lost my identity. My husband works 60 hours a week, and when he's home, he acts like his job is the only one that matters because he's the breadwinner. I have to ask him for money for everything, which makes me feel like a child. \n\nEvery time I look at LinkedIn, I see my old peers getting director roles, and I feel this deep, toxic resentment towards my husband. My resume now has a four-year gap that feels impossible to explain to employers. Sacrificing your career and independence for a partner's job is a trap. You think you're making a team decision, but you're actually just handing over your power.",
    userName: "lost_my_spark_34",
    helpfulVotes: 1980,
    timeline: [
      { year: "2020", stage: "The Move", description: "Gave up my corporate role in Sydney to relocate to a remote town for his career." },
      { year: "2022", stage: "Decision Made (Stayed)", description: "Agreed to stay past the 'two-year agreement' because his bonus was too good to pass up, despite my growing resentment." },
      { year: "2025", stage: "Resentment Peaks", description: "Completely financially dependent, feeling isolated, and noticing a significant power imbalance in our marriage." }
    ],
    updates: [
      {
        daysAfter: 45,
        dateAdded: "2026-05-20",
        text: "We had a huge fight. I told him I wanted to move back to the city so I could work, and he told me I was being 'selfish' and not thinking about our financial security. The resentment is becoming toxic.",
        regretScore: 9
      },
      {
        daysAfter: 150,
        dateAdded: "2026-09-01",
        text: "I've started doing freelance consulting online. It doesn't pay nearly what my old job did, but having my own income and using my brain again is saving my sanity. I am drawing a hard line: we are moving back to a major city next year or I am taking our child and leaving.",
        regretScore: 5
      }
    ]
  },
  {
    id: 's23',
    title: "I lied on our first date and said I love football. We've been married 3 years and I still have to sit through 4 hours of games every Sunday pretending I know what a first down is.",
    situationSlug: 'ignored-red-flags',
    situationName: "Ignored Red Flags",
    age: 28,
    gender: "Female",
    country: "United States",
    relationshipDuration: "5 Years",
    decisionMade: "Stayed",
    currentOutcome: "Married",
    regretScore: 6,
    wouldDoAgain: "No",
    dateAdded: "2026-05-10",
    tags: ["funny", "lies", "sports", "marriage", "relatable"],
    fullStory: "Okay, so our very first date was at a sports bar. I was trying so hard to be the 'cool, chill girl' who wasn't like other girls, so when he asked if I liked football, I enthusiastically said, 'Oh my god, yes, I literally live for Sunday game days!'\n\nI do not live for Sunday game days. I do not even know what a first down is. But he was gorgeous, so I kept the lie going. I bought a jersey. I memorized three players' names. I learned when to cheer by watching his face. \n\nFast forward 5 years: we are married, own a house, and he thinks Sunday football is our sacred couple's ritual. Every single week from September to February, I sit on the couch for four hours screaming at the TV, completely dead inside, wishing I was doing literally anything else. Last week he bought us season tickets. I have spent thousands of dollars and hundreds of hours on a sport I genuinely despise. If you're on a first date right now: do not fake your hobbies. You will end up trapped in a lifelong subscription to something you hate.",
    userName: "fake_football_fan_98",
    helpfulVotes: 3200,
    timeline: [
      { year: "2021", stage: "The First Date Lie", description: "Told him I loved football to seem low-maintenance and cool." },
      { year: "2023", stage: "The Proposal Jersey", description: "He proposed to me with a custom team jersey with our future last name on it. I had to fake cry tears of joy." },
      { year: "2026", stage: "Season Ticket Crisis", description: "He surprised me with expensive season tickets. I realized I am trapped in this lie forever." }
    ],
    updates: [
      {
        daysAfter: 30,
        dateAdded: "2026-06-10",
        text: "I tried to subtle-hint that I'm getting 'tired of the NFL' and he looked at me like I just suggested we kick a puppy. I guess I'm going to the stadium in the freezing rain next Sunday.",
        regretScore: 6
      },
      {
        daysAfter: 90,
        dateAdded: "2026-08-10",
        text: "I'm thinking of starting a support group for people who lied about liking camping, golf, or indie rock on their first dates. We can meet in secret and do crafts.",
        regretScore: 4
      }
    ]
  }
];

export const PRESEEDED_COURT_CASES: CourtCase[] = [
  {
    slug: 'girlfriend-checked-phone',
    title: "Girlfriend Checked My Phone Behind My Back",
    description: "I left my phone on the kitchen counter while taking a shower. I caught her scrolling through my chats with my female coworker. There is absolutely nothing romantic, but she claims her intuitive gut told her to check because I've been quiet lately. Am I right to be furious, or is her anxiety a valid excuse for violating privacy?",
    postTime: "2026-06-12",
    author: "anonymous_blue",
    votes: {
      me: 580,
      partner: 120,
      both: 240,
      neither: 60
    },
    tags: ["trust", "privacy", "boundaries"],
    arguments: [
      {
        id: "ca1",
        author: "justice_warrior",
        side: "Me",
        text: "Privacy is a non-negotiable boundary. If she suspected something, she should have used her words, not her fingers. Reviewing messages in secret shows deep insecurity and a lack of respect.",
        votes: 180,
        role: "Relationship Veteran"
      },
      {
        id: "ca2",
        author: "compassion_lens",
        side: "Both",
        text: "You shouldn't have been sneaked on, which makes her wrong. However, your sudden 'quietness' triggers people with anxious attachments. She needs to apologize for the breach, and you need to communicate why you became quiet.",
        votes: 85,
        role: "Mentor"
      },
      {
        id: "ca3",
        author: "cynic_heart",
        side: "Partner",
        text: "In this age of digital affairs, intuitive gut feelings are usually 99% right. If you have nothing to hide, why are you furious? A clear conscience shouldn't care about a phone lookover.",
        votes: -40,
        role: "Novice"
      }
    ]
  },
  {
    slug: 'boyfriend-refuses-to-delete-ex',
    title: "Boyfriend Refuses to Delete His Ex-Girlfriend on Instagram",
    description: "They split up 3 years ago and claim they are 'civil friends.' They like each other's gym posts and selfies. When I explained that seeing her constant likes makes me uncomfortable, he accused me of controlling him and said his friendships predate me. Is it a red flag that he prioritizes an ex's social media connection over my peace of mind?",
    postTime: "2026-06-15",
    author: "anxious_peachy",
    votes: {
      me: 890,
      partner: 210,
      both: 110,
      neither: 30
    },
    tags: ["exes", "social-media", "jealousy"],
    arguments: [
      {
        id: "ca4",
        author: "wisdom_keeper",
        side: "Me",
        text: "He's technically keeping an anchor open. If his current partner expresses a boundary that doesn't restrict his real life, and he reacts by calling her 'controlling,' he is centering his freedom to thirst-trap with an ex over your safety. That's a red flag.",
        votes: 240,
        role: "Top Mentor"
      },
      {
        id: "ca5",
        author: "chill_vibes_guy",
        side: "Partner",
        text: "They broke up years ago! Gym selfies are just gym selfies. Forcing someone to prune their instagram likes is high school behavior. Just trust him.",
        votes: 14,
        role: "Novice"
      }
    ]
  },
  {
    slug: 'husband-financial-infidelity-secret-debt',
    title: "Husband Hid $45k of Credit Card Debt Until We Applied for a Mortgage",
    description: "We have been happily married for 3 years and were about to buy our first house. The mortgage broker pulled our credit reports and revealed my husband has $45,000 in secret credit card debt from his speculative retail option trading. He begged me not to leave, saying he wanted to fix it himself and was ashamed. Am I justified in wanting a separation over this financial betrayal, or should I stay and help him pay it off?",
    postTime: "2026-06-21",
    author: "heartbroken_nest_builder",
    votes: {
      me: 910,
      partner: 80,
      both: 140,
      neither: 40
    },
    tags: ["finances", "trust", "marriage", "red-flags"],
    arguments: [
      {
        id: "ca6",
        author: "financial_forester",
        side: "Me",
        text: "Financial infidelity is just as destructive as physical infidelity. He lied every single day for years while you were saving your hard-earned wages. If you buy a house with him now, you are legally marrying his debt and his addiction. Separate immediately to protect your own credit score and assets.",
        votes: 312,
        role: "Truth Teller"
      },
      {
        id: "ca7",
        author: "grace_under_pressure",
        side: "Both",
        text: "He did a terrible thing out of shame and addiction. If he hands over complete control of his bank logins, attends Gamblers Anonymous, and agrees to a post-nuptial agreement protecting you from his liabilities, you can try to rebuild. But do not buy a house or merge accounts until he completes therapy.",
        votes: 184,
        role: "Mentor"
      }
    ]
  },
  {
    slug: 'friendzone-betrayal-best-friend',
    title: "Best Friend is Mad I Started Dating and Claims I 'Betrayed' Our Bond",
    description: "My male best friend of 4 years has been my absolute rock. Twice in the past, I confessed that I had romantic feelings for him and asked him out, but both times he laughed it off and said he valued our friendship too much to 'complicate' it. So, I forced myself to move on. Last month, I started dating an amazing guy. Now, my best friend is acting cold, refusing to hang out, and claims that I 'betrayed' our close bond and that my new boyfriend is a 'threat' to our friendship. Am I right to tell him he's acting entitled, or is his emotional reaction valid?",
    postTime: "2026-06-25",
    author: "moving_on_curious",
    votes: {
      me: 1240,
      partner: 110,
      both: 180,
      neither: 50
    },
    tags: ["friendzone", "jealousy", "friendship-boundaries", "rejection"],
    arguments: [
      {
        id: "ca8",
        author: "boundary_boss",
        side: "Me",
        text: "He rejected you twice! He doesn't get to keep you single as an on-call emotional support girlfriend while refusing to give you the commitment, label, or security. It is incredibly selfish to act betrayed when you finally find happiness elsewhere.",
        votes: 480,
        role: "Truth Teller"
      },
      {
        id: "ca9",
        author: "empathy_first",
        side: "Both",
        text: "He is acting incredibly immaturely by freezing you out, which makes him wrong. However, the introduction of a romantic partner permanently alters a close opposite-sex friendship. He is likely grieving the sudden loss of his primary emotional safe space, even if his way of expressing it is completely unfair.",
        votes: 124,
        role: "Relationship Veteran"
      }
    ]
  }
];

export const PRESEEDED_QUESTIONS: Question[] = [
  {
    slug: 'should-i-stay-after-cheating',
    title: "Should I stay after he cheated on me once or will he do it again?",
    description: "I caught my boyfriend of 2 years kissing another girl at a party. It's the first time anything like this has happened, and he has been crying and buying flowers. The community's statistics show that 'Stayed After Cheating' has an 82% regret rate. Is anyone in the 18% who successfully stayed and restored trust? How did you do it?",
    category: "Cheating",
    storiesCount: 38240,
    tags: ["infidelity", "forgiveness", "chance"],
    pollOptions: [
      { text: "Leave immediately (Once a cheater, always one)", votes: 1450 },
      { text: "Stay and work through it with professional therapy", votes: 420 },
      { text: "Give one chance, but with strict open-phone limits", votes: 310 },
      { text: "It depends entirely on if it was physical or emotional", votes: 120 }
    ],
    answers: [
      {
        id: "qa1",
        author: "healed_glass",
        text: "We survived it, but only because he entered 1-on-1 therapy for 2 years to answer 'why' he cheated. If they just say 'I was drunk,' they will cheat again. Do not stay unless they undergo deep psychological restructuring.",
        votes: 142,
        isOutcomeVerified: true,
        date: "2026-06-01",
        comments: [
          {
            id: "qc1_1",
            author: "wonder_heart",
            text: "This is so true. Alcohol is never an excuse, it just lowers inhibitions.",
            date: "2026-06-02"
          },
          {
            id: "qc1_2",
            author: "hopeful_clover",
            text: "Did you go to couples therapy too or just individual?",
            date: "2026-06-03"
          }
        ]
      },
      {
        id: "qa2",
        author: "bitter_pill",
        text: "I stayed. He cheated 4 years later with my cousin. Leaving at year 2 would have spared me a catastrophic amount of therapy bills. Learn from my regret.",
        votes: 98,
        isOutcomeVerified: true,
        date: "2026-06-05",
        comments: [
          {
            id: "qc2_1",
            author: "shocked_observer",
            text: "Oh my god, your cousin? That is a double betrayal. I am so sorry.",
            date: "2026-06-06"
          }
        ]
      }
    ]
  }
];

export const COUNTRIES_DATA = [
  {
    slug: 'usa',
    name: "United States",
    topSituations: ["Stayed After Cheating", "Boyfriend Doesn't Want Marriage", "Partner Doesn't Want Kids"],
    topRegrets: ["Ignoring early red flags", "Moving for a partner too quickly", "Staying after physical affairs"],
    commonOutcomes: "74% of long-term engagements without a date set end in separation.",
    storiesCount: 452
  },
  {
    slug: 'india',
    name: "India",
    topSituations: ["Different Religion Marriage", "Parents Disapprove of Partner", "Arranged Marriage Compatibility"],
    topRegrets: ["Compromising on career for in-laws", "Assuming family approval will come later", "Ignoring financial disparities"],
    commonOutcomes: "88% of cross-community relationships that proceed without maternal blessing report severe early marital stress.",
    storiesCount: 125
  },
  {
    slug: 'canada',
    name: "Canada",
    topSituations: ["Moved for Love", "Long Distance (US-Canada)", "Financial Disparities"],
    topRegrets: ["Giving up professional status in move", "Living in isolated suburbs for a partner"],
    commonOutcomes: "Moves for love that involve switching provinces report higher mid-term financial tension.",
    storiesCount: 89
  }
];

export const PRESEEDED_RED_FLAG_CASES: RedFlagCase[] = [
  {
    id: "rf_1",
    title: "My boyfriend still talks to his ex every day.",
    description: "They split up 3 years ago and claim they are 'civil friends.' They like each other's gym posts and selfies. When I explained that seeing her constant likes makes me uncomfortable, he accused me of controlling him and said his friendships predate me. Is it a red flag that he prioritizes an ex's social media connection over my peace of mind?",
    category: "Exes & Socials",
    votes: {
      green: 12,
      yellow: 24,
      red: 64
    },
    author: "anxious_peachy",
    dateAdded: "2026-06-18",
    comments: [
      {
        id: "rfc1_c1",
        author: "counselor_jen",
        text: "Healthy friendships with exes are possible, but dismissing your feelings as 'controlling' is a yellow/red flag. The dismissal itself is a bigger worry than the social connection.",
        date: "2026-06-18"
      },
      {
        id: "rfc1_c2",
        author: "veteran_love",
        text: "If they talk every single day and swap gym selfies, that crosses a line. Complete separation is usually required for healing unless they share a kid.",
        date: "2026-06-19"
      }
    ]
  },
  {
    id: "rf_2",
    title: "My partner keeps their phone face-down at all times and brings it to the bathroom",
    description: "Even when we are sitting on the couch watching a movie, they put their phone face down. When they go to the bathroom, they always bring it. I've never snooped on their phone, but this constant defensiveness of their screen makes me feel insecure. When I asked, they said they just value their privacy.",
    category: "Trust & Privacy",
    votes: {
      green: 8,
      yellow: 45,
      red: 110
    },
    author: "quiet_observer",
    dateAdded: "2026-06-17",
    comments: [
      {
        id: "rfc2_c1",
        author: "tech_detective",
        text: "Privacy is choosing what you share. Secrecy is hiding things you know would hurt your partner. This sounds a lot like secrecy.",
        date: "2026-06-17"
      }
    ]
  },
  {
    id: "rf_3",
    title: "My boyfriend gets extremely passive-aggressive when I plan a girls' night out",
    description: "He doesn't say I can't go, but he sighs loudly, jokes about me 'abandoning him,' and takes forever to reply to my texts while I am out. The next day, he is distant and silent.",
    category: "Control & Habits",
    votes: {
      green: 3,
      yellow: 18,
      red: 87
    },
    author: "girl_interrupted",
    dateAdded: "2026-06-16",
    comments: [
      {
        id: "rfc3_c1",
        author: "healing_coach",
        text: "This is a form of guilt-tripping and emotional manipulation. It doesn't have to be loud control to be toxic.",
        date: "2026-06-16"
      }
    ]
  },
  {
    id: "rf_4",
    title: "My partner wants us to share location 24/7",
    description: "They say it is purely for safety and convenience, so we know when each other is driving home. They shared theirs with me first. I feel super anxious being continuously tracked and would prefer privacy, but they say not wanting to share means I have something to hide.",
    category: "Trust & Privacy",
    votes: {
      green: 34,
      yellow: 72,
      red: 54
    },
    author: "lost_gps",
    dateAdded: "2026-06-15",
    comments: [
      {
        id: "rfc4_c1",
        author: "sensible_soul",
        text: "Some couples love this, but forcing it with the 'nothing to hide' argument is manipulative. Privacy and trust can co-exist happily.",
        date: "2026-06-15"
      }
    ]
  }
];
