import { Situation, Story, CourtCase, Question } from '../types';

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
  { id: '1', title: 'Stayed Too Long', description: 'Staying in a failing relationship hoping they would change.', avgRegret: 8.9, count: 18420, rate: '92%' },
  { id: '2', title: 'Ignored Red Flags', description: 'Overlooking early warning signs of manipulation or incompatibility.', avgRegret: 8.5, count: 15112, rate: '88%' },
  { id: '3', title: 'Married Too Quickly', description: 'Rushing into marriage before fully knowing their character.', avgRegret: 7.8, count: 9812, rate: '79%' },
  { id: '4', title: 'Moved For Love', description: 'Relocating to another state/country, giving up career or friends.', avgRegret: 7.2, count: 6410, rate: '71%' },
  { id: '5', title: 'Stayed After Multiple Affairs', description: 'Giving third and fourth chances after repeated infidelity.', avgRegret: 9.3, count: 12450, rate: '95%' }
];

export const MOST_SUCCESSFUL_DECISIONS = [
  { id: '1', title: 'Left Toxic Relationship', description: 'Walking away from a manipulative or abusive relationship early.', avgRegret: 1.2, successRate: '96%', count: 22100, wouldDoAgain: '98%' },
  { id: '2', title: 'Set Boundaries Early', description: 'Establishing clear dealbreakers and core needs within months 1-3.', avgRegret: 1.8, successRate: '91%', count: 14320, wouldDoAgain: '93%' },
  { id: '3', title: 'Delayed Marriage', description: 'Postponing marriage to finish education, therapy, or build stability.', avgRegret: 2.1, successRate: '88%', count: 8710, wouldDoAgain: '89%' },
  { id: '4', title: 'Went To Therapy', description: 'Pragmatic couple counseling early, or individual trauma therapy.', avgRegret: 2.5, successRate: '85%', count: 11200, wouldDoAgain: '86%' },
  { id: '5', title: 'Communicated Expectations', description: 'Having the hard conversations about kids, money, and religion before moving in.', avgRegret: 1.5, successRate: '94%', count: 19120, wouldDoAgain: '95%' }
];

export const PRESEEDED_SITUATIONS: Situation[] = [
  {
    slug: 'boyfriend-doesnt-want-marriage',
    name: "Boyfriend Doesn't Want Marriage",
    category: 'Marriage',
    description: "Stories, outcomes, regrets and relationship results from people who experienced having a male partner who did not believe in, wanted to postpone, or outright rejected marriage while they wanted it.",
    stats: {
      storyCount: 24182,
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
      { country: 'United States', count: 12150, avgRegret: 6.9 },
      { country: 'United Kingdom', count: 3410, avgRegret: 6.4 },
      { country: 'Canada', count: 2840, avgRegret: 6.6 },
      { country: 'Australia', count: 2110, avgRegret: 6.2 },
      { country: 'India', count: 1920, avgRegret: 8.4 }
    ]
  },
  {
    slug: 'stayed-after-cheating',
    name: "Stayed After Cheating",
    category: 'Cheating',
    description: "Results of individuals who decided to forgive, stay, and work through the relationship after discovering their partner committed physical or emotional infidelity.",
    stats: {
      storyCount: 38240,
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
      { country: 'United States', count: 18450, avgRegret: 8.1 },
      { country: 'Canada', count: 4890, avgRegret: 8.3 },
      { country: 'United Kingdom', count: 4120, avgRegret: 7.9 },
      { country: 'India', count: 3200, avgRegret: 8.9 },
      { country: 'Australia', count: 2800, avgRegret: 8.0 }
    ]
  },
  {
    slug: 'partner-doesnt-want-kids',
    name: "Partner Doesn't Want Kids",
    category: 'Children & Family',
    description: "What happens when one partner strongly desires children, and the other is firmly child-free, yet they try to make the relationship work anyway.",
    stats: {
      storyCount: 14810,
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
      { country: 'United States', count: 6800, avgRegret: 7.4 },
      { country: 'Germany', count: 2110, avgRegret: 7.1 },
      { country: 'Canada', count: 1920, avgRegret: 7.6 },
      { country: 'United Kingdom', count: 1410, avgRegret: 7.3 },
      { country: 'Australia', count: 1200, avgRegret: 7.5 }
    ]
  },
  {
    slug: 'moved-for-love',
    name: "Moved For Love",
    category: 'Careers & Moving',
    description: "The long-term outcomes of people who gave up their jobs, moved across countries or states, or left their social support networks to pursue a partner's career or relocate with them.",
    stats: {
      storyCount: 19612,
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
      { country: 'United States', count: 9100, avgRegret: 5.3 },
      { country: 'Canada', count: 2900, avgRegret: 5.5 },
      { country: 'United Kingdom', count: 2400, avgRegret: 5.2 },
      { country: 'Australia', count: 1800, avgRegret: 5.1 },
      { country: 'Germany', count: 1200, avgRegret: 5.6 }
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
        date: "2026-06-01"
      },
      {
        id: "qa2",
        author: "bitter_pill",
        text: "I stayed. He cheated 4 years later with my cousin. Leaving at year 2 would have spared me a catastrophic amount of therapy bills. Learn from my regret.",
        votes: 98,
        isOutcomeVerified: true,
        date: "2026-06-05"
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
    storiesCount: 45210
  },
  {
    slug: 'india',
    name: "India",
    topSituations: ["Different Religion Marriage", "Parents Disapprove of Partner", "Arranged Marriage Compatibility"],
    topRegrets: ["Compromising on career for in-laws", "Assuming family approval will come later", "Ignoring financial disparities"],
    commonOutcomes: "88% of cross-community relationships that proceed without maternal blessing report severe early marital stress.",
    storiesCount: 12480
  },
  {
    slug: 'canada',
    name: "Canada",
    topSituations: ["Moved for Love", "Long Distance (US-Canada)", "Financial Disparities"],
    topRegrets: ["Giving up professional status in move", "Living in isolated suburbs for a partner"],
    commonOutcomes: "Moves for love that involve switching provinces report higher mid-term financial tension.",
    storiesCount: 8900
  }
];
