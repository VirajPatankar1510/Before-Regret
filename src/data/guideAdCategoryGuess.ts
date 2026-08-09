import { TRADE_CATEGORIES } from './sponsoredVendors.js';

// Guesses which trade category a guide's own title is about, purely from keywords -- used only
// to make the empty-slot recruitment CTA say "Are you in the Electrician business?" instead of a
// generic "want to advertise here?" The guess is a hook, not a restriction: the ad marketplace is
// open (see server.ts's guide-ad checkout), any business can buy any slot regardless of what this
// function guesses. A wrong guess here costs nothing but a slightly less catchy empty-slot
// message, so a lightweight keyword list is proportionate -- this deliberately isn't a new
// admin-managed field on articles, since that's real ongoing maintenance for a feature nobody's
// paid for yet.
const KEYWORD_RULES: Array<{ keywords: string[]; category: typeof TRADE_CATEGORIES[number] }> = [
  { keywords: ['roof'], category: 'Roof Inspection' },
  { keywords: ['hvac', 'furnace', 'air condition', 'heat pump', 'compressor'], category: 'HVAC Inspection' },
  { keywords: ['sewer', 'cast iron', 'orangeburg'], category: 'Sewer Scope' },
  { keywords: ['radon'], category: 'Radon Testing' },
  { keywords: ['foundation', 'seismic', 'earthquake', 'crawlspace'], category: 'Foundation Engineer' },
  { keywords: ['electric', 'wiring', 'panel', 'breaker', 'knob-and-tube', 'knob and tube', 'aluminum wir'], category: 'Electrician' },
  { keywords: ['flood', 'fema', 'insurance', 'clue report'], category: 'Insurance Agent' },
  { keywords: ['attorney', 'title', 'disclosure', 'lien', 'contract'], category: 'Real Estate Attorney' },
  { keywords: ['moving', 'relocat'], category: 'Moving Company' },
  // Deliberately last and broad: asbestos, mold, plumbing, water heater, general inspection
  // topics all land here rather than in a forced, less-accurate specific bucket above.
  { keywords: ['asbestos', 'mold', 'plumb', 'pipe', 'water heater', 'inspection', 'eifs', 'stucco', 'chimney'], category: 'Home Inspector' },
];

export function guessTradeCategoryFromTitle(title: string): typeof TRADE_CATEGORIES[number] {
  const lower = title.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.category;
  }
  return 'Home Inspector';
}

// The raw TRADE_CATEGORIES labels are the right length for a dropdown/tag ("Roof Inspection",
// "Home Inspector") but read oddly spliced into "Are you in the X business?" -- "in the Home
// Inspector business" and "in the Moving Company business" (redundant -- a moving company already
// says what it is) are both real examples caught before shipping. This maps each category to the
// phrase that actually reads naturally in that specific sentence.
const BUSINESS_PHRASE: Record<typeof TRADE_CATEGORIES[number], string> = {
  'Roof Inspection': 'roofing',
  'HVAC Inspection': 'HVAC',
  'Sewer Scope': 'sewer/plumbing inspection',
  'Radon Testing': 'radon testing',
  'Foundation Engineer': 'structural engineering',
  'Electrician': 'electrical',
  'Home Inspector': 'home inspection',
  'Insurance Agent': 'insurance',
  'Real Estate Attorney': 'real estate law',
  'Moving Company': 'moving',
};

export function guessBusinessPhraseFromTitle(title: string): string {
  return BUSINESS_PHRASE[guessTradeCategoryFromTitle(title)];
}
