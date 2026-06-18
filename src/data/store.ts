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
  let stories = PRESEEDED_STORIES;
  let courtCases = PRESEEDED_COURT_CASES;
  let questions = PRESEEDED_QUESTIONS;
  let user = DEFAULT_USER;

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stories) stories = parsed.stories;
        if (parsed.courtCases) courtCases = parsed.courtCases;
        if (parsed.questions) questions = parsed.questions;
        if (parsed.user) user = parsed.user;
      } catch (e) {
        console.error("Error reading localStorage", e);
      }
    }
  }

  // Backfill deterministic Case Numbers for preseeded stories
  stories = stories.map((s, idx) => {
    if (!s.caseNumber) {
      const stableNum = 1001 + idx;
      s.caseNumber = `CASE-S${stableNum}`;
    }
    return s;
  });

  // Backfill deterministic Case Numbers for preseeded court cases
  courtCases = courtCases.map((c, idx) => {
    if (!c.caseNumber) {
      const stableNum = 2001 + idx;
      c.caseNumber = `CASE-C${stableNum}`;
    }
    return c;
  });

  return { stories, courtCases, questions, user };
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
