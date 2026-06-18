import { Story, CourtCase, Question, UserProfile, StoryUpdate, CourtArgument } from '../types';
import { PRESEEDED_STORIES, PRESEEDED_COURT_CASES, PRESEEDED_QUESTIONS } from './mockData';

const LOCAL_STORAGE_KEY = 'before_regret_platform_store';

interface StoreState {
  stories: Story[];
  courtCases: CourtCase[];
  questions: Question[];
  user: UserProfile;
}

const DEFAULT_USER: UserProfile = {
  username: "anonymous_seeker",
  storiesSubmitted: 0,
  helpfulVotesReceived: 0,
  followers: 4,
  badges: ["Truth Teller"],
  savedStories: [],
  followedSituations: [],
  followedTags: ['marriage', 'cheating'],
  followedQuestions: [],
  recentActivity: [
    { type: 'court_voted', detail: 'Voted on court case "Girlfriend Checked My Phone"', date: '2 hours ago' }
  ]
};

// Initialize helper
export function getInitialState(): StoreState {
  if (typeof window === 'undefined') {
    return {
      stories: PRESEEDED_STORIES,
      courtCases: PRESEEDED_COURT_CASES,
      questions: PRESEEDED_QUESTIONS,
      user: DEFAULT_USER
    };
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure we merge seed data if any is added in development
      const stories = parsed.stories || PRESEEDED_STORIES;
      const courtCases = parsed.courtCases || PRESEEDED_COURT_CASES;
      const questions = parsed.questions || PRESEEDED_QUESTIONS;
      const user = parsed.user || DEFAULT_USER;
      return { stories, courtCases, questions, user };
    } catch (e) {
      console.error("Error reading localStorage", e);
    }
  }

  return {
    stories: PRESEEDED_STORIES,
    courtCases: PRESEEDED_COURT_CASES,
    questions: PRESEEDED_QUESTIONS,
    user: DEFAULT_USER
  };
}

// Save state helper
export function saveState(state: StoreState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }
}

export const badgesSystem = {
  HEART_SURVIVOR: "Heart Survivor",
  TRUTH_TELLER: "Truth Teller",
  RELATIONSHIP_VETERAN: "Relationship Veteran",
  HELPFUL_100: "100 Helpful Votes",
  HELPFUL_1000: "1000 Helpful Votes",
  OUTCOME_CONTRIBUTOR: "Outcome Contributor",
  TOP_MENTOR: "Top Mentor"
};
