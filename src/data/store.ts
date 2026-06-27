import { Story, CourtCase, Question, UserProfile, StoryUpdate, CourtArgument, RedFlagCase } from '../types';
import { PRESEEDED_STORIES, PRESEEDED_COURT_CASES, PRESEEDED_QUESTIONS, PRESEEDED_RED_FLAG_CASES } from './mockData';

const LOCAL_STORAGE_KEY = 'before_regret_platform_store2'; // new key to avoid mismatch with old stored structures

interface StoreState {
  stories: Story[];
  courtCases: CourtCase[];
  questions: Question[];
  redFlagCases: RedFlagCase[];
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
  submittedStories: [],
  submittedRedFlags: [],
  recentActivity: [
    { type: 'court_voted', detail: 'Voted on court case "Girlfriend Checked My Phone"', date: '2 hours ago' }
  ]
};

// Initialize helper
export function getInitialState(): StoreState {
  let stories = PRESEEDED_STORIES;
  let courtCases = PRESEEDED_COURT_CASES;
  let questions = PRESEEDED_QUESTIONS;
  let redFlagCases = PRESEEDED_RED_FLAG_CASES;
  let user = DEFAULT_USER;

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stories) {
          const savedIds = new Set(parsed.stories.map((s: any) => s.id));
          const newPreseeded = PRESEEDED_STORIES.filter(s => !savedIds.has(s.id));
          stories = [...parsed.stories, ...newPreseeded];
        }
        if (parsed.courtCases) {
          const savedSlugs = new Set(parsed.courtCases.map((c: any) => c.slug));
          const newPreseeded = PRESEEDED_COURT_CASES.filter(c => !savedSlugs.has(c.slug));
          courtCases = [...parsed.courtCases, ...newPreseeded];
        }
        if (parsed.questions) {
          const savedSlugs = new Set(parsed.questions.map((q: any) => q.slug));
          const newPreseeded = PRESEEDED_QUESTIONS.filter(q => !savedSlugs.has(q.slug));
          questions = [...parsed.questions, ...newPreseeded];
        }
        if (parsed.redFlagCases) {
          const savedIds = new Set(parsed.redFlagCases.map((r: any) => r.id));
          const newPreseeded = PRESEEDED_RED_FLAG_CASES.filter(r => !savedIds.has(r.id));
          redFlagCases = [...parsed.redFlagCases, ...newPreseeded];
        }
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

  // Backfill deterministic Case Numbers for preseeded red flag cases
  redFlagCases = redFlagCases.map((r, idx) => {
    if (!r.caseNumber) {
      const stableNum = 3001 + idx;
      r.caseNumber = `CASE-F${stableNum}`;
    }
    return r;
  });

  return { stories, courtCases, questions, redFlagCases, user };
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
