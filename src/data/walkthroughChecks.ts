// The physical checks behind the 20-Minute Walkthrough Radar.
//
// -------------------------------------------------------------------------------------------
// WHY THIS FILE EXISTS SEPARATELY FROM src/engine/inspectionPriorities.ts.
//
// That engine already decides what matters for a house of a given era and county, and it is not
// duplicated here -- the walkthrough tool calls it for the "questions to hand your inspector"
// output. But its rules are written for the wrong moment. Every howToCheck in it addresses the
// post-inspection conversation:
//
//     "Ask your inspector to record the panel brand and model in writing, then confirm
//      insurability with your insurance agent before your option period ends."
//
// Correct advice, useless in a driveway. A buyer standing in a stranger's utility room with eleven
// minutes left needs "open the grey door on the panel and read the name printed inside." That is a
// different register and a different unit of content, so it lives in its own file rather than
// being bolted onto rules that are already doing another job well.
//
// -------------------------------------------------------------------------------------------
// THE RULES THIS CONTENT FOLLOWS.
//
// 1. EVERY CHECK IS SOMETHING A BUYER CAN PHYSICALLY DO in a normal viewing, without tools beyond
//    a phone torch, without opening anything sealed, and without touching live electrical parts.
//    No check here asks anyone to remove a panel cover -- reading the label on the door is safe,
//    pulling the dead front is not.
//
// 2. EVERY CHECK LINKS TO A PUBLISHED GUIDE that explains what was found. The tool is a way into
//    the library, not a replacement for it. assertWalkthroughChecks() below fails the build if a
//    slug stops resolving.
//
// 3. NOTHING HERE DIAGNOSES. The prompt says what to look at, lookingFor says what a flag looks
//    like, and flagMeans says what to do about it -- which is always "ask the inspector to confirm
//    X in writing", never "this house has a problem". A buyer glancing at a wall cannot tell
//    settlement from structural failure, and a tool that implies they can is worse than no tool.
//
// 4. DATE RANGES MATCH OUR OWN PUBLISHED GUIDES, not the widest range on the internet. Where a
//    guide says aluminium branch wiring was installed 1965-1976, this file says the same, so a
//    reader who follows the link does not find two different numbers.
export type Foundation = 'slab' | 'basement' | 'crawlspace' | 'unsure';

export type CheckZone =
  | 'Outside, before you go in'
  | 'Kitchen and bathrooms'
  | 'Utility room or garage'
  | 'Basement'
  | 'Basement or crawl space'
  | 'Crawl space'
  | 'Living space'
  | 'Paperwork';

export interface WalkthroughCheck {
  id: string;
  zone: CheckZone;
  /** The physical instruction. Imperative, specific, doable in under a minute. */
  prompt: string;
  /** What a flag actually looks like. Concrete and visual. */
  lookingFor: string;
  /** One sentence on why it is worth the thirty seconds. */
  whyItMatters: string;
  /** What to do when it is flagged. Always an action, never a diagnosis. */
  flagMeans: string;
  /** Inclusive era bounds on year built. */
  minYear: number;
  maxYear: number;
  /** Omitted means the check applies to every foundation type. */
  foundations?: Foundation[];
  /** Slug of the published guide that explains the finding. */
  guide: string;
  /** Shown when a carrier is likely to care, which is often the sharper consequence than repair cost. */
  insuranceFlag?: boolean;
  /**
   * Editorial priority, not a derived score.
   *
   * The tool is called the 20-Minute Walkthrough and a 1960s basement house matches 21 checks, so
   * an unranked list recreates exactly the overwhelm it exists to fix. 'first' checks are the ones
   * worth doing if the viewing is cut short: things that can stop a policy being written, or that
   * are expensive and invisible once the walls are back up. 'ifTime' checks are real and worth
   * doing, just not at the cost of missing a panel label.
   *
   * Ranked by hand rather than computed from insuranceFlag, because the two do not always agree --
   * a missing TPR discharge line is cheap and no carrier asks about it, and it still outranks a
   * cosmetic check.
   */
  rank: 'first' | 'ifTime';
}

export const WALKTHROUGH_CHECKS: WalkthroughCheck[] = [
  // ---------------------------------------------------------------- outside
  {
    id: 'roof-from-street',
    zone: 'Outside, before you go in',
    prompt: 'Stand back on the far side of the street and look at the roof from two different angles.',
    lookingFor: 'Dark vertical streaking, patches in a noticeably different shade, or anything breaking the flat plane of the slope.',
    whyItMatters: 'Insurers score roofs from aerial imagery before anyone visits, and regulators in more than a dozen states have documented non-renewals based on images that were outdated or of the wrong building.',
    flagMeans: 'Ask the seller for the roofing invoice and the closed permit for the tear-off, and get a real insurance quote on the address before your contingency expires.',
    minYear: 1800, maxYear: 2100,
    guide: 'home-insurance-aerial-photos-roof',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'overhanging-branches',
    zone: 'Outside, before you go in',
    prompt: 'Photograph every tree limb that hangs over the roofline.',
    lookingFor: 'Any branch above the roof surface, and any limb touching or within a few feet of it.',
    whyItMatters: 'This is the most common underwriting flag that is both legitimate and trivially fixable, and it is far cheaper to negotiate before closing than to discover in a non-renewal letter.',
    flagMeans: 'Raise it as a pre-closing item. Trimming is inexpensive; a declined policy is not.',
    minYear: 1800, maxYear: 2100,
    guide: 'home-insurance-aerial-photos-roof',
    rank: 'ifTime',
    insuranceFlag: true,
  },
  {
    id: 'green-stripe',
    zone: 'Outside, before you go in',
    prompt: 'Walk the side and rear lawn and look down at the grass, not at the house.',
    lookingFor: 'A stripe or patch of unnaturally lush, dark green grass running across an otherwise dry lawn, or ground that is soft underfoot in dry weather.',
    whyItMatters: 'A leaking sewer lateral or a failing septic drain field fertilises the ground above it, and the line is the homeowner’s responsibility right out to the main in most jurisdictions.',
    flagMeans: 'Ask whether the property is on sewer or septic, and ask your inspector about a camera scope of the lateral. It is usually a separate add-on, not part of a standard inspection.',
    minYear: 1800, maxYear: 2100,
    guide: 'home-inspection-include-septic-system',
    rank: 'first',
  },
  {
    id: 'oil-tank-vent',
    zone: 'Outside, before you go in',
    prompt: 'Walk the perimeter and look at the wall about a foot above ground level, and at the ground itself.',
    lookingFor: 'A capped pipe about two inches across sticking out of the wall, a small round metal cap set in the lawn, or a disconnected fill pipe.',
    whyItMatters: 'A buried heating-oil tank is an environmental liability that transfers with the property, and the cost of remediating a leaked tank is not comparable to the cost of removing an empty one.',
    flagMeans: 'Ask directly whether an underground tank was ever installed and whether it was removed or abandoned in place, and ask for the closure documentation.',
    minYear: 1800, maxYear: 1975,
    guide: 'home-inspection-check-underground-oil-tanks',
    rank: 'first',
  },
  {
    id: 'eifs-stucco',
    zone: 'Outside, before you go in',
    prompt: 'If the walls look like stucco, tap them gently with a knuckle in two or three places.',
    lookingFor: 'A hollow, drum-like sound rather than the solid tap of traditional stucco, and stucco that runs right down to the soil without a visible gap.',
    whyItMatters: 'Synthetic stucco can trap water behind it with no drainage path, and the damage develops out of sight rather than showing on the surface.',
    flagMeans: 'Ask your inspector whether the cladding is EIFS or traditional stucco, and whether a moisture survey is warranted before your contingency ends.',
    minYear: 1975, maxYear: 2005,
    guide: 'standard-home-inspection-check-eifs-stucco-moisture',
    rank: 'first',
  },
  {
    id: 'termite-tubes',
    zone: 'Outside, before you go in',
    prompt: 'Crouch at two or three points along the foundation wall and look at the concrete just above the soil line.',
    lookingFor: 'Pencil-width mud tubes running vertically up the concrete, and any bare wood within a few inches of the soil.',
    whyItMatters: 'Subterranean termites travel in shelter tubes between soil and timber, and the tubes are visible from outside long before any interior damage shows.',
    flagMeans: 'Ask who is ordering the WDO or termite report and when. In many states the timing and who pays are negotiable, and it is worth settling early.',
    minYear: 1800, maxYear: 2100,
    guide: 'standard-home-inspection-include-termites',
    rank: 'ifTime',
  },

  // ---------------------------------------------------------------- utility room
  {
    id: 'panel-brand',
    zone: 'Utility room or garage',
    prompt: 'Find the main electrical panel and open only the outer door. Read the brand name printed on the door or the label inside it.',
    lookingFor: 'The names Federal Pacific, FPE, Stab-Lok, Zinsco, Sylvania-Zinsco, or Challenger.',
    whyItMatters: 'These panels are the single most common reason a home insurance application is declined outright rather than merely priced higher.',
    flagMeans: 'Photograph the label and send it to an independent insurance agent before your contingency expires. Ask for a quote, not an opinion.',
    minYear: 1950, maxYear: 1990,
    guide: 'federal-pacific-stab-lok-panel-inspectors-flag',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'fuses-not-breakers',
    zone: 'Utility room or garage',
    prompt: 'Look at what is behind the panel door: switches, or round screw-in fuses?',
    lookingFor: 'Round glass or ceramic fuses that screw in, or cartridge fuses in a pull-out block, instead of rows of toggle breakers.',
    whyItMatters: 'Many carriers will not write a standard policy on an active fuse panel regardless of its condition, which makes it a financing problem as much as an electrical one.',
    flagMeans: 'Treat it as an insurability question first. Ask an independent agent whether they can bind coverage as-is, and get an electrician’s estimate for a panel upgrade.',
    minYear: 1800, maxYear: 1965,
    guide: 'get-home-insurance-fuse-box',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'water-heater-date',
    zone: 'Utility room or garage',
    prompt: 'Find the manufacturer’s sticker on the side of the water heater and photograph the serial number.',
    lookingFor: 'A date in the label, or a serial number beginning with a month and year code. Anything over about twelve years old is living on borrowed time.',
    whyItMatters: 'A water heater is one of the few major components whose remaining life you can estimate from the driveway, and its failure mode is water across a finished floor.',
    flagMeans: 'Add the replacement cost to your first-year budget rather than treating it as a repair request, and ask whether the seller has the installation invoice.',
    minYear: 1800, maxYear: 2100,
    guide: 'hvac-techs-wish-buyers-knew-about-system-age',
    rank: 'first',
  },
  {
    id: 'tpr-discharge',
    zone: 'Utility room or garage',
    prompt: 'Look at the pipe leaving the valve near the top of the water heater and follow it down with your eyes.',
    lookingFor: 'A discharge pipe that stops partway down, points upward, is capped, or is missing entirely rather than running to within a few inches of the floor.',
    whyItMatters: 'That valve is the tank’s only protection against over-pressure, and a discharge line that terminates at head height defeats the point of having one.',
    flagMeans: 'Ask your inspector to note the TPR discharge configuration in writing. It is usually a cheap correction and an easy thing to ask a seller to fix.',
    minYear: 1800, maxYear: 2100,
    guide: 'tpr-valve-inspectors-always-check',
    rank: 'ifTime',
  },
  {
    id: 'knob-and-tube',
    zone: 'Utility room or garage',
    prompt: 'Shine your phone torch along the exposed ceiling joists in the basement, garage or attic hatch.',
    lookingFor: 'White or brown ceramic knobs and tubes fixed to the timber, with single wires running through them rather than a modern sheathed cable.',
    whyItMatters: 'Whether the wiring is still energised or long abandoned changes both the repair cost and the insurability, and the two look identical from the ground.',
    flagMeans: 'Ask the inspector to confirm in writing whether any of it is still energised, then take that answer to an insurance agent before you waive anything.',
    minYear: 1800, maxYear: 1950,
    guide: 'what-is-knob-and-tube-wiring',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'aluminium-branch',
    zone: 'Utility room or garage',
    prompt: 'Look at the printing on the outer sheath of the cables where they enter the top of the panel.',
    lookingFor: 'The letters AL, ALUM or ALUMINUM stamped on the sheath of the thin cables feeding ordinary rooms, not just on the thick service cable.',
    whyItMatters: 'Single-strand aluminium on ordinary lighting and socket circuits is a documented fire risk and a standard underwriting decline until it is remediated.',
    flagMeans: 'Ask the inspector to record the branch circuit conductor material in writing, and price remediation before your contingency ends rather than after.',
    minYear: 1965, maxYear: 1976,
    guide: 'get-home-insurance-aluminum-wiring',
    rank: 'first',
    insuranceFlag: true,
  },

  // ---------------------------------------------------------------- kitchen and baths
  {
    id: 'polybutylene',
    zone: 'Kitchen and bathrooms',
    prompt: 'Open the cabinet under a bathroom sink and look at the supply pipes running to the wall, then check behind the water heater.',
    lookingFor: 'Flexible grey, blue or black plastic tubing, often stamped PB2110, rather than copper, white PEX or braided steel.',
    whyItMatters: 'Polybutylene degrades from the inside and fails without warning, and most carriers decline a house that still has it on its supply lines.',
    flagMeans: 'Ask whether the house has been fully repiped or only stubbed out at the visible sections, and ask for the invoice and closed permit for the work.',
    minYear: 1978, maxYear: 1995,
    guide: 'spot-polybutylene-pipes-before-buying-house',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'accordion-trap',
    zone: 'Kitchen and bathrooms',
    prompt: 'Open the cabinet under a bathroom or kitchen sink and look at the drain pipe curving down from the plughole.',
    lookingFor: 'A ribbed, concertina-style flexible plastic pipe instead of a smooth rigid P-trap, or a joint held with tape.',
    whyItMatters: 'A corrugated trap catches waste in its ridges and is not permitted under most plumbing codes, so it is a reliable sign that unpermitted work was done somewhere in the house.',
    flagMeans: 'Treat it as a prompt rather than a defect: ask what other work was done by the same hand, and check the permit record for the property.',
    minYear: 1800, maxYear: 2100,
    guide: 'amateur-workmanship-mean-home-inspection-report',
    rank: 'ifTime',
  },
  {
    id: 'gfci-outlets',
    zone: 'Kitchen and bathrooms',
    prompt: 'Look at the sockets beside the kitchen sink, in each bathroom, in the garage, and outside.',
    lookingFor: 'Sockets with no TEST and RESET buttons on the faceplate in any of those locations.',
    whyItMatters: 'Shock protection near water has been required for decades and its absence is both a safety item and a routine inspection finding that stalls closings.',
    flagMeans: 'Ask your inspector to list every location missing protection. It is one of the cheapest repair requests to make and one sellers rarely contest.',
    minYear: 1800, maxYear: 2100,
    guide: 'need-gfci-outlets-pass-home-inspection',
    rank: 'ifTime',
  },
  {
    id: 'three-prong-old-house',
    zone: 'Living space',
    prompt: 'In an older house, look at the sockets in bedrooms and the living room.',
    lookingFor: 'Modern three-prong sockets throughout a house whose wiring you have just seen is original two-wire.',
    whyItMatters: 'A three-prong socket on an ungrounded circuit gives the appearance of protection that is not there, and it is one of the commonest things a seller-side handyman changes cosmetically.',
    flagMeans: 'Ask the inspector to test for open grounds and to report how many circuits are affected, not just whether any are.',
    minYear: 1800, maxYear: 1965,
    guide: 'open-ground-mean-electrical-inspection',
    rank: 'ifTime',
  },

  // ---------------------------------------------------------------- basement
  {
    id: 'efflorescence',
    zone: 'Basement',
    prompt: 'Shine your torch along the bottom two feet of the basement walls, all the way round.',
    lookingFor: 'A white, chalky, powdery deposit on the blockwork or concrete, and any wall that has been freshly painted while the rest has not.',
    whyItMatters: 'That deposit is salt left behind by water moving through the wall, so it records water that has already come in, whatever the surface looks like today.',
    flagMeans: 'Ask how long ago the basement was painted and why, and ask the inspector to comment specifically on moisture in the affected wall.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement'],
    guide: 'when-foundation-crack-need-structural-engineer',
    rank: 'first',
  },
  {
    id: 'sump-pump',
    zone: 'Basement',
    prompt: 'Look for a lidded pit set into the basement floor, usually in a corner.',
    lookingFor: 'A pit with no pump in it, a pump with no visible discharge line, or a discharge line that ends against the foundation outside.',
    whyItMatters: 'Standard policies generally exclude water that backs up through a sump, and the endorsement that covers it has to be bought deliberately.',
    flagMeans: 'Ask whether a water backup and sump overflow endorsement is in place, and ask the seller how often the pump runs in a wet month.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement'],
    guide: 'homeowners-insurance-cover-failed-sump-pump',
    rank: 'ifTime',
    insuranceFlag: true,
  },
  {
    id: 'cast-iron-stack',
    zone: 'Basement or crawl space',
    prompt: 'Find the main vertical drain stack and look at it where it disappears into the floor.',
    lookingFor: 'A thick dark metal pipe rather than white plastic, with flaking, rust-coloured scale or damp staining at the joints near the base.',
    whyItMatters: 'Cast iron drains corrode from the inside out over decades, and the section below the slab is both the first to fail and the most expensive to reach.',
    flagMeans: 'Ask about a camera scope of the main drain line. It is normally a separate add-on and worth arranging before the contingency date rather than after.',
    minYear: 1800, maxYear: 1975,
    foundations: ['basement', 'crawlspace'],
    guide: 'why-cast-iron-pipes-corrode',
    rank: 'first',
  },
  {
    id: 'foundation-cracks',
    zone: 'Basement',
    prompt: 'Walk the perimeter of the basement and look at the walls where they meet the floor and the ceiling.',
    lookingFor: 'Cracks wide enough to admit a coin, cracks running diagonally from the corners of openings, walls bowing inward, or a step pattern through the mortar joints.',
    whyItMatters: 'Most cracking in a basement wall is ordinary and some of it is not, and the difference is about width, direction and displacement rather than length.',
    flagMeans: 'Photograph each one with something for scale, and ask whether an independent structural engineer, not a repair contractor, should look before you commit.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement'],
    guide: 'when-foundation-crack-need-structural-engineer',
    rank: 'first',
  },
  {
    id: 'prior-repair-evidence',
    zone: 'Basement or crawl space',
    prompt: 'Look along the inside face of the foundation wall for anything that does not match its surroundings.',
    lookingFor: 'Steel or carbon-fibre straps against the wall, a row of brackets, fresh mortar in an old wall, or one patch of new paint on an otherwise unpainted surface.',
    whyItMatters: 'Past foundation work is not automatically bad news, but it changes what you need in writing, and a lender may ask for an engineer’s letter before it will close.',
    flagMeans: 'Ask for the engineering report, the invoice, the warranty, and whether that warranty transfers to you. A seller’s recollection is not documentation.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement', 'crawlspace'],
    guide: 'should-buy-house-s-already-had-foundation-repair',
    rank: 'first',
  },

  // ---------------------------------------------------------------- crawl space
  {
    id: 'crawl-standing-water',
    zone: 'Crawl space',
    prompt: 'Open the crawl space hatch and put your torch beam across the ground without going in.',
    lookingFor: 'Standing water or wet soil, a plastic vapour barrier that is torn or absent, and insulation hanging down out of the joists.',
    whyItMatters: 'A wet crawl space feeds moisture into the floor structure above it continuously, and the consequences appear as floor and timber problems rather than as visible water.',
    flagMeans: 'Ask the inspector to confirm they physically entered the crawl space rather than looking in from the hatch, and to report on the vapour barrier specifically.',
    minYear: 1800, maxYear: 2100,
    foundations: ['crawlspace'],
    guide: 'evidence-prior-repair-mean-home-inspection-report',
    rank: 'first',
  },

  // ---------------------------------------------------------------- living space
  {
    id: 'settlement-cracking',
    zone: 'Living space',
    prompt: 'Look at the wall above interior doorways and where walls meet the ceiling in two or three rooms.',
    lookingFor: 'Diagonal cracks radiating from the corners of door frames, doors that will not latch, or fresh mesh tape and mudding under a new coat of paint.',
    whyItMatters: 'Hairline cracking is normal in almost every house; a pattern that repeats at several openings in the same direction is a different conversation.',
    flagMeans: 'Photograph each crack and ask the seller when the room was last painted. Ask the inspector to distinguish cosmetic cracking from movement in the report.',
    minYear: 1800, maxYear: 2100,
    guide: 'typical-settlement-cracking-mean-inspection-report',
    rank: 'ifTime',
  },
  {
    id: 'blocked-access',
    zone: 'Living space',
    prompt: 'Note anything stacked against a wall, in front of the panel, over the attic hatch, or filling the garage.',
    lookingFor: 'Storage or furniture blocking the electrical panel, the crawl space hatch, the attic access, or a whole basement wall.',
    whyItMatters: 'An inspector cannot report on what they cannot reach, and the resulting "not inspected due to storage" note transfers the unknown to you rather than resolving it.',
    flagMeans: 'Ask now for the area to be cleared before the inspection. Requesting it afterwards usually means paying for a second visit.',
    minYear: 1800, maxYear: 2100,
    guide: 'not-inspected-due-storage-mean-inspection-report',
    rank: 'ifTime',
  },

  // ---------------------------------------------------------------- paperwork
  {
    id: 'permit-paper-trail',
    zone: 'Paperwork',
    prompt: 'Before you leave, ask the agent one question: which improvements were permitted, and can you see the closed permits?',
    lookingFor: 'A finished basement, an added room, a deck, a new panel or a re-roof, with no paperwork offered for any of it.',
    whyItMatters: 'An open or missing permit becomes the buyer’s problem at closing, and it is discovered by the title company at the worst possible moment rather than by you now.',
    flagMeans: 'Look the address up yourself. Permit records are public in every US jurisdiction, and the search is free.',
    minYear: 1800, maxYear: 2100,
    guide: 'find-unpermitted-work-before-buying',
    rank: 'first',
  },
];

/** Decade options offered by the tool, newest first. */
export const DECADES = [
  { label: '2010s or newer', mid: 2015 },
  { label: '2000s', mid: 2005 },
  { label: '1990s', mid: 1995 },
  { label: '1980s', mid: 1985 },
  { label: '1970s', mid: 1975 },
  { label: '1960s', mid: 1965 },
  { label: '1950s', mid: 1955 },
  { label: '1940s', mid: 1945 },
  { label: 'Before 1940', mid: 1930 },
] as const;

export const FOUNDATIONS: Array<{ id: Foundation; label: string; hint: string }> = [
  { id: 'slab', label: 'Slab', hint: 'Sits on concrete, no space underneath' },
  { id: 'basement', label: 'Basement', hint: 'A full floor below ground' },
  { id: 'crawlspace', label: 'Crawl space', hint: 'A low gap under the floor with a hatch' },
  { id: 'unsure', label: 'Not sure', hint: 'Shows the checks that apply either way' },
];

/**
 * The checks that apply to one house.
 *
 * 'unsure' deliberately returns only foundation-agnostic checks rather than everything. Showing a
 * basement wall check to someone standing in a slab house spends the scarcest thing they have,
 * which is attention, and teaches them the list is padded.
 */
export function selectChecks(yearBuilt: number, foundation: Foundation): WalkthroughCheck[] {
  const applies = WALKTHROUGH_CHECKS.filter((c) => {
    if (yearBuilt < c.minYear || yearBuilt > c.maxYear) return false;
    if (!c.foundations) return true;
    if (foundation === 'unsure') return false;
    return c.foundations.includes(foundation);
  });
  // 'first' before 'ifTime', original file order preserved within each group so related checks in
  // the same room stay together and the reader is not sent back and forth across the house.
  return [...applies.filter((c) => c.rank === 'first'), ...applies.filter((c) => c.rank === 'ifTime')];
}

/**
 * The primary list adapts to the house instead of being cut to a round number.
 *
 * A fixed cap of ten was the first attempt and the build assertion rejected it: a 1968 basement
 * house matches twelve 'first' checks, so two genuine priorities -- including "ask for the permits"
 * -- were being pushed below the fold to satisfy the number, while a 2015 slab house had only four
 * and the list was padded to ten with filler. Both failures came from treating "20 minutes" as a
 * count rather than as a focus.
 *
 * So: every 'first' check is always shown, and a thin configuration is topped up from 'ifTime' to a
 * floor of eight. A new house honestly needs fewer checks than an old one.
 */
export const MIN_PRIMARY = 8;

/**
 * The order a person actually moves through a viewing. Applied to the final list rather than to the
 * rank, because the top-up in splitChecks appends lower-ranked checks and that broke the route: a
 * 2010s slab house was listing Outside, Utility, Paperwork, then Outside again, sending the reader
 * back to the garden after they had already asked the agent the exit question.
 */
const ZONE_ORDER: CheckZone[] = [
  'Outside, before you go in',
  'Utility room or garage',
  'Basement',
  'Basement or crawl space',
  'Crawl space',
  'Kitchen and bathrooms',
  'Living space',
  'Paperwork',
];

function byWalkOrder(a: WalkthroughCheck, b: WalkthroughCheck): number {
  return ZONE_ORDER.indexOf(a.zone) - ZONE_ORDER.indexOf(b.zone);
}

export function splitChecks(yearBuilt: number, foundation: Foundation): {
  primary: WalkthroughCheck[]; ifTime: WalkthroughCheck[];
} {
  const all = selectChecks(yearBuilt, foundation);
  const firsts = all.filter((c) => c.rank === 'first');
  const rest = all.filter((c) => c.rank !== 'first');
  const topUp = Math.max(0, MIN_PRIMARY - firsts.length);
  return {
    primary: [...firsts, ...rest.slice(0, topUp)].sort(byWalkOrder),
    ifTime: rest.slice(topUp).sort(byWalkOrder),
  };
}

/**
 * Build-time integrity check. Called by scripts/assert-walkthrough-checks.ts against the live
 * article list, so a guide that is unpublished or renamed fails the build instead of shipping a
 * dead link inside a tool whose whole purpose is to send people to those guides.
 */
export function assertWalkthroughChecks(publishedSlugs: Set<string>): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const c of WALKTHROUGH_CHECKS) {
    if (ids.has(c.id)) problems.push(`duplicate id: ${c.id}`);
    ids.add(c.id);
    if (!publishedSlugs.has(c.guide)) problems.push(`${c.id}: guide "${c.guide}" is not a published guide`);
    if (c.minYear > c.maxYear) problems.push(`${c.id}: minYear ${c.minYear} is after maxYear ${c.maxYear}`);
    if (!c.prompt.trim().endsWith('.') && !c.prompt.trim().endsWith('?')) problems.push(`${c.id}: prompt is not a sentence`);
    // Every prompt must stand alone. accordion-trap opened with "While that cabinet is open",
    // which read correctly next to the polybutylene check and dangled on any house too new to be
    // shown it -- and the era gating means no check can assume another was displayed.
    for (const dependent of ['while that', 'while you', 'as above', 'same cabinet', 'that same']) {
      if (c.prompt.toLowerCase().includes(dependent)) problems.push(`${c.id}: prompt depends on another check being shown first`);
    }
    for (const [field, value] of Object.entries({ prompt: c.prompt, lookingFor: c.lookingFor, whyItMatters: c.whyItMatters, flagMeans: c.flagMeans })) {
      if (value.length < 40) problems.push(`${c.id}: ${field} is too short to be useful`);
    }
    // Rule 3: a check may never tell the reader what is wrong with the house.
    for (const banned of ['this means the house', 'you have a', 'indicates that your', 'proves']) {
      if (c.flagMeans.toLowerCase().includes(banned)) problems.push(`${c.id}: flagMeans diagnoses rather than directing`);
    }
  }
  // Every era must produce a usable list, or the tool has dead configurations.
  for (const d of DECADES) {
    for (const f of ['slab', 'basement', 'crawlspace'] as Foundation[]) {
      const all = selectChecks(d.mid, f);
      if (all.length < 8) problems.push(`${d.label} + ${f} yields only ${all.length} checks`);
      // The capped list must not be padded with ifTime items while a 'first' check is pushed off
      // the end -- that would rank a cosmetic check above a panel label for that configuration.
      const { primary, ifTime } = splitChecks(d.mid, f);
      // Every 'first' check must survive into the primary list -- the whole point of the rank.
      for (const c of all.filter((x) => x.rank === 'first')) {
        if (!primary.includes(c)) problems.push(`${d.label} + ${f}: 'first' check ${c.id} was pushed out of the primary list`);
      }
      if (primary.length < MIN_PRIMARY) problems.push(`${d.label} + ${f} shows only ${primary.length} checks`);
      // A list this long stops being a walkthrough aid and becomes an inspection report.
      if (primary.length > 14) problems.push(`${d.label} + ${f} shows ${primary.length} checks, too many for one viewing`);
      if (primary.length + ifTime.length !== all.length) problems.push(`${d.label} + ${f}: split lost or duplicated a check`);
      // The route must move through the house once. A zone that reappears after another zone means
      // the reader is being sent back to a room they have left.
      const seen: CheckZone[] = [];
      for (const c of primary) if (seen[seen.length - 1] !== c.zone) seen.push(c.zone);
      if (new Set(seen).size !== seen.length) problems.push(`${d.label} + ${f}: the walk doubles back (${seen.join(' -> ')})`);
      // Every zone shown must be one the house actually has.
      for (const c of primary) {
        if (c.zone === 'Basement' && f !== 'basement') problems.push(`${d.label} + ${f}: shows a Basement check (${c.id})`);
        if (c.zone === 'Crawl space' && f !== 'crawlspace') problems.push(`${d.label} + ${f}: shows a Crawl space check (${c.id})`);
      }
    }
  }
  return problems;
}
