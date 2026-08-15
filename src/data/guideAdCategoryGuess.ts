import { TRADE_CATEGORIES } from './sponsoredVendors.js';

// Guesses which trade category a guide's own title is about, purely from keywords -- used only
// to make the empty-slot recruitment CTA say "Are you in the General Contractor business?"
// instead of a generic "want to advertise here?" The guess is a hook, not a restriction: the ad
// marketplace is open (see server.ts's guide-ad checkout), any business can buy any slot
// regardless of what this function guesses. A wrong guess here costs nothing but a slightly less
// catchy empty-slot message, so a lightweight keyword list is proportionate -- this deliberately
// isn't a new admin-managed field on articles, since that's real ongoing maintenance for a
// feature nobody's paid for yet.
const KEYWORD_RULES: Array<{ keywords: string[]; category: typeof TRADE_CATEGORIES[number] }> = [
  { keywords: ['roof'], category: 'Roof Inspection' },
  { keywords: ['hvac', 'furnace', 'air condition', 'heat pump', 'compressor'], category: 'HVAC Inspection' },
  { keywords: ['sewer', 'cast iron', 'orangeburg'], category: 'Sewer Scope' },
  { keywords: ['radon'], category: 'Radon Testing' },
  // Foundation/seismic topics point at General Contractor, not a stamping engineer -- see
  // sponsoredVendors.ts for why 'Foundation Engineer' was dropped from TRADE_CATEGORIES.
  { keywords: ['foundation', 'seismic', 'earthquake', 'crawlspace', 'renovation', 'remodel', 'contractor', 'building permit'], category: 'General Contractor' },
  { keywords: ['electric', 'wiring', 'panel', 'breaker', 'knob-and-tube', 'knob and tube', 'aluminum wir'], category: 'Electrician' },
  { keywords: ['asbestos', 'mold'], category: 'Asbestos/Mold Abatement' },
  { keywords: ['termite', 'pest', 'rodent'], category: 'Pest/Termite Control' },
  { keywords: ['chimney'], category: 'Chimney Sweep' },
  { keywords: ['well pump', 'septic', 'well water'], category: 'Well & Septic Services' },
  { keywords: ['moving', 'relocat'], category: 'Moving Company' },
  // Deliberately last and broad: plumbing, water heater, and general inspection topics all land
  // here rather than in a forced, less-accurate specific bucket above. Also catches the old
  // flood/insurance and attorney/title/disclosure topics now that 'Insurance Agent' and 'Real
  // Estate Attorney' have been dropped from TRADE_CATEGORIES -- no safe substitute trade fits an
  // insurance product or legal practice, so those guides fall through to this generic guess
  // rather than mismatching to an unrelated category.
  { keywords: ['plumb', 'pipe', 'water heater', 'inspection', 'eifs', 'stucco'], category: 'Home Inspector' },
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
  'Electrician': 'electrical',
  'Home Inspector': 'home inspection',
  'General Contractor': 'general contracting',
  'Asbestos/Mold Abatement': 'asbestos or mold abatement',
  'Pest/Termite Control': 'pest control',
  'Chimney Sweep': 'chimney sweep',
  'Well & Septic Services': 'well & septic',
  'Moving Company': 'moving',
};

export function guessBusinessPhraseFromTitle(title: string): string {
  return BUSINESS_PHRASE[guessTradeCategoryFromTitle(title)];
}
