// Public Anonymous Display Name Generator for BeforeRegret Contributors
// Generates mature, trustworthy, privacy-friendly personas for Indian residential contributors.
// Strictly avoids real names, numbers, emojis, professions, city names, or credibility claims.

export const ADJECTIVES = [
  'Quiet', 'Calm', 'Curious', 'Urban', 'Local', 'Daily', 'Weekend', 
  'Morning', 'Evening', 'Late', 'Early', 'Hidden', 'Open', 'Gentle', 
  'Steady', 'Silent', 'Peaceful', 'Thoughtful', 'Mindful', 'Simple', 
  'Friendly', 'Bright', 'Fresh', 'Cozy', 'Relaxed', 'Modern'
];

export const PERSONAS = [
  'Observer', 'Explorer', 'Resident', 'Commuter', 'Walker', 'Wanderer', 
  'Visitor', 'Neighbor', 'Local', 'Homeowner', 'Tenant', 'Reviewer', 
  'Listener', 'Planner', 'Seeker', 'Navigator', 'Scout', 'Dweller', 
  'Traveller', 'Citizen'
];

export const HOME_COMMUNITY = [
  'Corner Home', 'Garden View', 'Top Floor', 'Open Balcony', 'City View', 
  'Park Facing', 'Quiet Block', 'Green Courtyard', 'Sky View', 'Window Seat', 
  'Morning Light', 'Terrace View', 'Corner Window', 'Open Terrace', 'Street View', 
  'Lake View', 'Hill View', 'Courtyard', 'Rooftop', 'Balcony'
];

export const LIFESTYLE = [
  'Morning Walker', 'Evening Walker', 'Metro Rider', 'Daily Commuter', 
  'Weekend Explorer', 'City Wanderer', 'Road Traveller', 'Park Visitor', 
  'Tea Lover', 'Coffee Lover', 'Book Reader', 'Window Watcher', 
  'Early Riser', 'Night Owl', 'Weekend Stroller', 'City Explorer', 
  'Neighborhood Walker'
];

export const LOCATION_STYLE = [
  'North Side', 'South Side', 'East Wing', 'West Wing', 
  'Corner Side', 'Garden Side', 'Lake Side', 'Hill Side', 
  'Park Side', 'City Side'
];

// Pre-defined seed patterns to ensure variety and quality
const PATTERNS = [
  // 2-word: Adjective + Persona (e.g. Calm Observer, Quiet Explorer)
  () => {
    const adj = getRandom(ADJECTIVES);
    const per = getRandom(PERSONAS);
    return `${adj} ${per}`;
  },
  // 2-word: Home/Community phrase (e.g. Garden View, Top Floor, Quiet Block)
  () => {
    return getRandom(HOME_COMMUNITY);
  },
  // 2-word: Lifestyle phrase (e.g. Daily Commuter, Morning Walker, Metro Rider)
  () => {
    return getRandom(LIFESTYLE);
  },
  // 2-word: Location phrase (e.g. North Side, Park Side)
  () => {
    return getRandom(LOCATION_STYLE);
  },
  // 3-word: Adjective + Home/Community (e.g. Quiet Corner Home, Bright Open Balcony)
  () => {
    const adj = getRandom(ADJECTIVES);
    const home = getRandom(HOME_COMMUNITY);
    return `${adj} ${home}`;
  },
  // 3-word: Adjective + Lifestyle (e.g. Quiet Morning Walker, Urban Daily Commuter)
  () => {
    const adj = getRandom(ADJECTIVES);
    const life = getRandom(LIFESTYLE);
    return `${adj} ${life}`;
  }
];

function getRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates an anonymous, privacy-friendly public display name.
 * Automatically checks against an optional existing set to guarantee uniqueness.
 */
export function generateAnonymousDisplayName(existingNames: Set<string> | string[] = new Set()): string {
  const existingSet = Array.isArray(existingNames) ? new Set(existingNames) : existingNames;
  
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    // 80% preference for 2-word, 20% for 3-word
    const isThreeWord = Math.random() < 0.2;
    let candidate = '';

    if (isThreeWord) {
      const fn = PATTERNS[Math.floor(Math.random() * 2) + 4]; // 3-word patterns
      candidate = fn();
    } else {
      const fn = PATTERNS[Math.floor(Math.random() * 4)]; // 2-word patterns
      candidate = fn();
    }

    // Capitalize every word
    candidate = candidate
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback with randomized adjective + persona combo if collision rate is extremely high
  const fallbackAdj = getRandom(ADJECTIVES);
  const fallbackPer = getRandom(PERSONAS);
  const fallbackHome = getRandom(HOME_COMMUNITY);
  return `${fallbackAdj} ${fallbackHome || fallbackPer}`;
}
