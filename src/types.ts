export interface TimelineNode {
  year: string;
  stage: string;
  description: string;
}

export interface StoryUpdate {
  daysAfter: number; // e.g. 30, 90, 180, 365, 730
  dateAdded: string;
  text: string;
  regretScore: number;
}

export interface StoryComment {
  id: string;
  storyId: string;
  authorName: string;
  authorId: string;
  authorPhoto?: string;
  text: string;
  dateAdded: string;
}

export interface Story {
  id: string;
  caseNumber?: string; // Unique, searchable identifier
  userId?: string; // Optional track of authenticated Google User
  title: string;
  situationSlug: string;
  situationName: string;
  age: number;
  gender: string;
  country: string;
  relationshipDuration: string;
  decisionMade: 'Stayed' | 'Left' | 'Married' | 'Moved Together' | 'Other';
  currentOutcome: 'Still Together' | 'Married' | 'Engaged' | 'Separated' | 'Divorced' | 'Complicated';
  regretScore: number; // 1-10
  regretType?: 'Past' | 'Current';
  wouldDoAgain: 'Yes' | 'No' | 'Not Sure';
  fullStory: string;
  timeline: TimelineNode[];
  userName: string;
  helpfulVotes: number;
  dateAdded: string;
  updates: StoryUpdate[];
  tags: string[];
}

export interface SituationStats {
  storyCount: number;
  avgRegret: number;
  wouldDoAgainPercent: number; // % who would do again
  stillTogetherPercent: number;
  marriedPercent: number;
  separatedPercent: number;
  avgRelationshipLength: string;
}

export interface Situation {
  slug: string;
  name: string;
  category: 'Cheating' | 'Marriage' | 'Long Distance' | 'Children & Family' | 'Careers & Moving' | 'Ultimatums' | 'Red Flags';
  description: string;
  stats: SituationStats;
  decisionBreakdown: { name: string; percentage: number }[]; // Pie graph style
  outcomeBreakdown: { name: string; value: number }[]; // Bar graph style
  regretOverTime: { period: string; level: number }[]; // Line graph style
  countryBreakdown: { country: string; count: number; avgRegret: number }[]; // Heatmap style
}

export interface CourtArgument {
  id: string;
  author: string;
  side: 'Me' | 'Partner' | 'Both' | 'Neither';
  text: string;
  votes: number;
  role: 'Truth Teller' | 'Relationship Veteran' | 'Mentor' | 'Novice' | 'Top Mentor';
}

export interface CourtCase {
  slug: string;
  caseNumber?: string; // Unique, searchable identifier
  title: string;
  description: string;
  postTime: string;
  author: string;
  votes: {
    me: number;
    partner: number;
    both: number;
    neither: number;
  };
  arguments: CourtArgument[];
  tags: string[];
}

export interface QuestionAnswerComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface QuestionAnswer {
  id: string;
  author: string;
  text: string;
  votes: number;
  isOutcomeVerified: boolean; // has submitted a story
  date: string;
  comments?: QuestionAnswerComment[]; // Comments below this specific advice!
}

export interface Question {
  slug: string;
  title: string;
  description: string;
  category: string;
  answers: QuestionAnswer[];
  pollOptions: { text: string; votes: number }[];
  storiesCount: number;
  tags: string[];
}

export interface UserProfile {
  username: string;
  storiesSubmitted: number;
  helpfulVotesReceived: number;
  followers: number;
  badges: string[];
  savedStories: string[]; // story IDs
  followedSituations: string[]; // situation slugs
  followedTags: string[]; // tag slugs
  followedQuestions: string[]; // question slugs
  recentActivity: {
    type: 'story_added' | 'story_updated' | 'court_voted' | 'helpful_voted' | 'bookmarked';
    detail: string;
    date: string;
  }[];
}

export interface RedFlagComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface RedFlagCase {
  id: string;
  caseNumber?: string;
  title: string;
  description: string;
  category: 'Communication' | 'Exes & Socials' | 'Trust & Privacy' | 'Control & Habits' | 'Other';
  votes: {
    green: number;
    yellow: number;
    red: number;
  };
  comments?: RedFlagComment[];
  author: string;
  dateAdded: string;
}



