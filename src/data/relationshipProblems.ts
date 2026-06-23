export interface RelationshipProblem {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export const PRESEEDED_RELATIONSHIP_PROBLEMS: RelationshipProblem[] = [
  {
    id: "ghosting",
    name: "Ghosting & Sudden Silence",
    description: "When a partner abruptly cuts off all contact and disappears without explanation or closure.",
    keywords: [
      "ghosted", "stopped replying to me", "he vanished", "she disappeared", "stopped texting", 
      "cut off without explanation", "ignored messages", "no response texts", "silent treatment", 
      "suddenly blocked me", "blocked on instagram", "vanished out of nowhere"
    ]
  },
  {
    id: "friend-zone",
    name: "Friend Zone Limbo",
    description: "Developing deep romantic sentiments for a partner who only sees you as a platonic friend.",
    keywords: [
      "friendzone", "just friends", "friend zoned", "likes me as a friend", "put me in the friend zone", 
      "only friends", "romantic rejection", "unrequited love", "doesn't see me that way", 
      "platonic love", "stuck in friendzone"
    ]
  },
  {
    id: "situationship",
    name: "Situationship (Commitment Limbo)",
    description: "A romantic and physical attachment without clear labels, agreements, or directional progress.",
    keywords: [
      "no labels", "stuck in situationship", "almost boyfriend", "almost girlfriend", "undefinable relationship", 
      "not official", "friends with benefits regret", "hiding our relationship", "commitment phobia", 
      "what are we talk", "keeps me in limbo"
    ]
  },
  {
    id: "love-bombing",
    name: "Love Bombing & Rushed Pace",
    description: "Incredible early affection, gifts, and declarations used to rush commitment before true intimacy is built.",
    keywords: [
      "fast love", "too good to be true first", "showered with gifts", "moving too fast relationship", 
      "manipulation love", "obsessed starting out", "intense romance too early", "rushed marriage talk", 
      "overwhelmed by affection", "clingy early on"
    ]
  },
  {
    id: "micro-cheating",
    name: "Micro-Cheating & Shady Online Habits",
    description: "Small acts of boundary-tripping like keeping active dating profiles, hiding notifications, or flirting online.",
    keywords: [
      "microcheating", "dating apps active", "texting ex boyfriend", "texting ex girlfriend", 
      "shady social media", "hiding messages", "emotional infidelities", "secret friends", 
      "liking other girls pictures", "private snapchat", "hiding phone screen"
    ]
  },
  {
    id: "emotional-unavailability",
    name: "Emotional Unavailability",
    description: "A partner refusing or struggling to share vulnerabilities, connect deeply, or discuss emotional needs.",
    keywords: [
      "emotionally unavailable", "closed off", "won't open up", "guarded heart", "scared of commitment", 
      "distant behavior", "emotionally cold", "avoids deep talks", "withholds affection", 
      "walls built up", "detached husband", "detached wife"
    ]
  },
  {
    id: "gaslighting-narcissism",
    name: "Narcissistic Gaslighting & Manipulation",
    description: "Pervasive manipulation that distorts truth, shifts all blame, and makes you doubt your sanity.",
    keywords: [
      "narcissist partner", "gaslighted", "manipulative spouse", "always my fault", "feeling crazy", 
      "emotional abuse", "hot and cold partner", "blame shifting", "playing the victim", 
      "walking on eggshells", "psychological mind games"
    ]
  },
  {
    id: "mismatched-future-goals",
    name: "Mismatched Future Goals",
    description: "Deep disagreements regarding marriage timelines, career relocations, or whether to have children.",
    keywords: [
      "different timelines", "career vs relationship", "where is this going", "want different things", 
      "one wants kids other doesn't", "family planning split", "different religions future", 
      "marriage ultimatum", "compromised my dreams", "relocation conflict"
    ]
  },
  {
    id: "financial-conflict",
    name: "Financial Conflict & Spending Mismatch",
    description: "Severe friction from hidden debts, controlling allocation of funds, or incompatible spender/saver mindsets.",
    keywords: [
      "money issues", "debt secrets", "mismatched spender", "financial control", "paying for everything", 
      "income gap tension", "hiding purchases", "financial abuse", "refuses to work relationship", 
      "split bills fight"
    ]
  },
  {
    id: "intimacy-issues",
    name: "Intimacy Mismatch & Dead Bedroom",
    description: "Long dry spells, dry physical affection, and mismatched sexual drive creating profound partner isolation.",
    keywords: [
      "dead bedroom", "libido mismatch", "no affection", "different sex drives", "feels like roommates", 
      "lack of physical touch", "no kissing anymore", "withholding sex", "no romantic spark", 
      "rejected physically", "unwanted sexually"
    ]
  },
  {
    id: "in-laws-struggles",
    name: "In-Law Infractions & Border Delays",
    description: "Overbearing family-of-origin interference and a partner unable of establishing boundaries.",
    keywords: [
      "in-laws meddling", "mother in law issues", "family drama", "overbearing parents", 
      "prioritizing family over partner", "no family boundaries", "parental approval obsession", 
      "parents hate my partner", "holidays family fights"
    ]
  },
  {
    id: "codependency",
    name: "Codependency & Losing Self-Identity",
    description: "Neglecting your own desires, friendships, and goals entirely to please and pacify an unstable partner.",
    keywords: [
      "codependent relationship", "lost my identity", "living for them", "no personal life", 
      "people pleasing partner", "clinging too hard", "lost my friends because of relationship", 
      "needs external approval", "fear of being alone"
    ]
  },
  {
    id: "trust-control-issues",
    name: "Trust Issues & Obsessive Control",
    description: "Incessant paranoia, phone-checking mandates, jealousy tantrums, and dictates on who you can see.",
    keywords: [
      "jealousy issues", "controlling partner", "checking phone secrets", "trust broken", 
      "possessive behavior", "insecure boyfriend", "accusing of cheating", "demanding passwords", 
      "dictating what to wear", "isolating me from friends"
    ]
  },
  {
    id: "breadcrumbing",
    name: "Breadcrumbing & Hot-and-Cold Leads",
    description: "Intermittent attention and sporadic flirting crumbs designed to hold your interest without moving forward.",
    keywords: [
      "breadcrumbs", "mixed signals", "hot and cold behavior", "keeps me on the hook", "leading me on", 
      "sporadic messaging", "attention seeker", "talks then disappears", "low effort replies", 
      "leads me along"
    ]
  },
  {
    id: "rebound-regrets",
    name: "Rebound Relationship Regrets",
    description: "Jumping into a serious emotional commitment immediately after a painful breakup before processing grief.",
    keywords: [
      "rebound mistake", "too soon after breakup", "using someone to get over ex", "rushed relationship", 
      "jumping into commitment", "should have stayed single", "using rebound to heal", 
      "comparing partner to ex"
    ]
  },
  {
    id: "lost-spark",
    name: "Lost Spark & Platonic Roommates",
    description: "A gradual decay of chemistry and physical attraction where partners live purely like platonic roommates.",
    keywords: [
      "spark is gone", "no chemistry", "bored in relationship", "feeling like siblings", "falling out of love", 
      "uninspired union", "stale marriage", "feels like flatmates", "no passion anymore", 
      "routine relationship boring"
    ]
  },
  {
    id: "neglect-priority",
    name: "Neglect, Loneliness & Priority Splits",
    description: "Profound loneliness caused by a partner prioritizing work, video games, friends, or hobbies over you.",
    keywords: [
      "unappreciated", "ignored spouse", "partner always busy", "workaholic husband", 
      "feels lonely in marriage", "no quality time together", "ignored for video games", 
      "prioritizes friends over me", "neglected wife"
    ]
  },
  {
    id: "orbiting",
    name: "Orbiting (Social Lurking)",
    description: "When an ex or admirer remains completely silent but continuously watches all your social media posts/stories.",
    keywords: [
      "orbiting", "ex-boyfriend watches my stories", "silent viewer", "viewing stories but won't talk", 
      "ex stalking my instagram", "social media ghost", "lurking online ex", "subtle likes ex"
    ]
  },
  {
    id: "future-faking",
    name: "Future Faking Promises",
    description: "Detailed, beautiful promises regarding future homes, weddings, and journeys designed to secure compliance now, with no action.",
    keywords: [
      "future faking", "empty marriage promises", "lying about the future", "stuck on false hope", 
      "promises without action", "leads me along with promises", "waiting on changes that never happen"
    ]
  },
  {
    id: "benching-cushioning",
    name: "Benching (Back-up Option)",
    description: "Keeping you conditionally on standby (as a backup) while they actively date and seek other primary matches.",
    keywords: [
      "benched", "backup girl", "standby boy", "cushioning relationship", "second choice partner", 
      "dating multiple people but keeping me", "feeling like an option", "never prioritizing me"
    ]
  }
];
