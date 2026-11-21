import type { TRADE_CATEGORIES } from './sponsoredVendors.js';

// Which open articles to show a business first on /topic-ads/, once it has picked its business type.
//
// Owner, 2026-11-22: after picking a business type "the list of articles disappear" -- the old sort
// used guessTradeCategoryFromTitle(), which gives each title exactly ONE trade (first keyword rule
// wins), so most trades matched zero or one article and everything else was folded away. A sewer
// scope guide is just as relevant to a plumber as to a sewer-scope company, so relevance here is
// many-to-many:
//
//   1. "best"    -- the title names this trade's own subject (TRADE_KEYWORDS).
//   2. "related" -- the title names the subject of a neighbouring trade (RELATED_TRADES), the next
//                   best place for this business to be seen when its own subject has few articles.
//   3. everything else, still available.
//
// Purely a display order. Any business can still buy any open article (the marketplace is open,
// see guideAdsApi.ts). Keywords are matched as lowercase substrings of the title. Imported only by
// the browser today, but it lives in src/data, so its imports carry .js in case the server ever
// imports it (the 2026-10-12 outage).

type Trade = typeof TRADE_CATEGORIES[number];

export const TRADE_KEYWORDS: Record<Trade, string[]> = {
  'Roof Inspection': ['roof', 'shingle', 'gutter', 'attic', 'skylight', 'hail'],
  'HVAC Inspection': ['hvac', 'furnace', 'air condition', 'heat pump', 'compressor', 'boiler', 'ductwork', 'duct ', 'heating', 'freon', 'r-22', 'wood stove'],
  'Sewer Scope': ['sewer', 'cast iron', 'orangeburg', 'drain', 'clay pipe', 'root intrusion'],
  'Radon Testing': ['radon'],
  'Electrician': ['electric', 'wiring', 'panel', 'breaker', 'knob-and-tube', 'knob and tube', 'aluminum wir', 'outlet', 'gfci', 'open ground', 'two-prong', 'fuse', 'pushmatic', 'zinsco', 'federal pacific', 'romex', 'pigtail', 'double-tap', 'double tap', 'amp service', 'ev charger'],
  'Plumber': ['plumb', 'polybutylene', 'pipe', 'water heater', 'repipe', 'tpr valve', 'sump', 'service line', 'water line', 'expansion tank', 'lead line', 'galvanized', 'leak', 'burst', 'sewer', 'cast iron', 'well pump'],
  'Home Inspector': ['inspection', 'inspector', 'inspect', 'checklist', 'red flag', 'walkthrough', 'walk-through', 'what to check', 'before buying', 'before you buy'],
  'Stucco & EIFS': ['eifs', 'efis', 'stucco', 'dryvit', 'siding', 'moisture'],
  'General Contractor': ['permit', 'renovation', 'remodel', 'contractor', 'addition', 'unpermitted', 'seismic', 'earthquake', 'deck', 'retaining wall', 'garage conversion', 'adu', 'repair cost', 'fix'],
  'Foundation Repair': ['foundation', 'crawlspace', 'crawl space', 'pier and beam', 'pier-and-beam', 'slab', 'settling', 'crack', 'sinkhole', 'retaining wall', 'expansive soil'],
  'Asbestos/Mold Abatement': ['asbestos', 'mold', 'vermiculite', 'popcorn ceiling', 'lead paint', 'lead-based', 'water damage', 'flood'],
  'Pest/Termite Control': ['termite', 'pest', 'rodent', 'wood-destroying', 'wdo', 'carpenter ant'],
  'Chimney Sweep': ['chimney', 'fireplace', 'wood stove', 'flue'],
  'Well & Septic Services': ['well pump', 'septic', 'well water', 'private well', 'drain field', 'leach field'],
  'Moving Company': ['moving', 'relocat', 'move in', 'move-in', 'first week', 'new home'],
  'Real Estate Agent': ['seller', 'closing', 'escrow', 'contingen', 'earnest', 'walk away', 'appraisal', 'hoa', 'offer', 'title insurance', 'disclosure', 'option period', 'buyer', 'buying a house', 'clue report', 'insurance'],
  'Interior Designer': ['interior design', 'home decor', 'floor plan', 'layout', 'sunlight', 'natural light', 'south-facing', 'north-facing'],
  'Painter & Flooring': ['paint', 'flooring', 'hardwood', 'carpet', 'lead paint', 'lead-based', 'drywall', 'popcorn ceiling', 'siding', 'water stain', 'maintenance checklist'],
  'Landscaping & Tree Service': [' tree', 'trees', 'landscap', 'yard', 'grading', 'lawn', 'drainage', 'retaining wall'],
  'Solar Installer': ['solar', 'south-facing', 'sunlight', 'sun by direction', 'roof'],
  'Water Testing & Treatment': ['water test', 'water quality', 'hard water', 'softener', 'pfas', 'nitrate', 'well water', 'private well', 'lead service', 'lead pipe', 'lead line'],
};

/**
 * The next-best subjects for each trade, closest first, used when its own subject has few articles.
 * 'Home Inspector' is the broad catch-all (every "inspection" title), so it goes last.
 */
export const RELATED_TRADES: Record<Trade, Trade[]> = {
  'Roof Inspection': ['Solar Installer', 'General Contractor', 'Home Inspector'],
  'HVAC Inspection': ['Electrician', 'Chimney Sweep', 'Home Inspector'],
  'Sewer Scope': ['Plumber', 'Well & Septic Services', 'Home Inspector'],
  'Radon Testing': ['Water Testing & Treatment', 'Asbestos/Mold Abatement', 'Home Inspector'],
  'Electrician': ['General Contractor', 'Solar Installer', 'Home Inspector'],
  'Plumber': ['Sewer Scope', 'Water Testing & Treatment', 'Well & Septic Services', 'Home Inspector'],
  'Home Inspector': ['Real Estate Agent', 'Roof Inspection', 'Electrician', 'Plumber'],
  'Stucco & EIFS': ['Roof Inspection', 'Asbestos/Mold Abatement', 'Home Inspector'],
  'General Contractor': ['Foundation Repair', 'Electrician', 'Plumber', 'Home Inspector'],
  'Foundation Repair': ['General Contractor', 'Landscaping & Tree Service', 'Home Inspector'],
  'Asbestos/Mold Abatement': ['Radon Testing', 'Plumber', 'Home Inspector'],
  'Pest/Termite Control': ['Foundation Repair', 'Landscaping & Tree Service', 'Home Inspector'],
  'Chimney Sweep': ['HVAC Inspection', 'Roof Inspection', 'Home Inspector'],
  'Well & Septic Services': ['Water Testing & Treatment', 'Plumber', 'Sewer Scope'],
  'Moving Company': ['Real Estate Agent', 'Home Inspector'],
  'Real Estate Agent': ['Home Inspector', 'General Contractor'],
  'Interior Designer': ['Painter & Flooring', 'Real Estate Agent', 'General Contractor'],
  'Painter & Flooring': ['Interior Designer', 'Asbestos/Mold Abatement', 'Stucco & EIFS', 'General Contractor'],
  'Landscaping & Tree Service': ['Foundation Repair', 'Pest/Termite Control', 'General Contractor'],
  'Solar Installer': ['Roof Inspection', 'Electrician', 'Interior Designer'],
  'Water Testing & Treatment': ['Well & Septic Services', 'Plumber', 'Radon Testing'],
};

function titleMatches(lowerTitle: string, trade: string): boolean {
  const words = TRADE_KEYWORDS[trade as Trade];
  return Boolean(words && words.some((k) => lowerTitle.includes(k)));
}

/**
 * Split articles into best matches, next-best (related) matches, and the rest, keeping each group in
 * its original order. Related matches are ordered by how close the related trade is.
 */
export function rankArticlesForTrade<T extends { title: string }>(
  items: T[],
  trade: string
): { best: T[]; related: T[]; rest: T[] } {
  const best: T[] = [];
  const relatedBuckets: T[][] = (RELATED_TRADES[trade as Trade] || []).map(() => []);
  const rest: T[] = [];
  const related = RELATED_TRADES[trade as Trade] || [];
  for (const item of items) {
    const lower = ` ${item.title.toLowerCase()}`;
    if (titleMatches(lower, trade)) { best.push(item); continue; }
    const idx = related.findIndex((r) => titleMatches(lower, r));
    if (idx >= 0) relatedBuckets[idx].push(item);
    else rest.push(item);
  }
  return { best, related: relatedBuckets.flat(), rest };
}
