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
//    a phone flashlight, without opening anything sealed, and without touching live electrical parts.
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
    prompt: 'Before you go in, cross the street and look at the roof from two angles.',
    lookingFor: 'Dark streaks running down, patches that don\'t match the rest, or anything sagging or wavy.',
    whyItMatters: 'Insurers grade roofs from photos taken by plane or satellite, often before anyone visits in person.',
    flagMeans: 'Ask the seller for the roofing receipt. Then get a real insurance quote on this address before your inspection deadline.',
    minYear: 1800, maxYear: 2100,
    guide: 'home-insurance-aerial-photos-roof',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'overhanging-branches',
    zone: 'Outside, before you go in',
    prompt: 'Take a photo of any tree branches hanging over the roof.',
    lookingFor: 'Branches above the roof, or close enough to touch it in a storm.',
    whyItMatters: 'It is one of the most common things an insurer asks you to fix, and one of the cheapest.',
    flagMeans: 'Bring it up before closing. Trimming a tree is cheap. Losing your policy is not.',
    minYear: 1800, maxYear: 2100,
    guide: 'home-insurance-aerial-photos-roof',
    rank: 'ifTime',
    insuranceFlag: true,
  },
  {
    id: 'green-stripe',
    zone: 'Outside, before you go in',
    prompt: 'Walk the side and back yard. Look down at the grass, not up at the house.',
    lookingFor: 'A stripe of extra-green grass across an otherwise dry lawn, or ground that squishes when it has not rained.',
    whyItMatters: 'A leaking sewer or septic line feeds the grass above it, and that pipe is yours to fix, not the city\'s.',
    flagMeans: 'Ask whether the house is on city sewer or septic. Then ask your inspector about running a camera down the line. It is usually an add-on, not included.',
    minYear: 1800, maxYear: 2100,
    guide: 'home-inspection-include-septic-system',
    rank: 'first',
  },
  {
    id: 'oil-tank-vent',
    zone: 'Outside, before you go in',
    prompt: 'Walk around the house. Look at the wall near the ground, and at the lawn itself.',
    lookingFor: 'A capped pipe sticking out of the wall around knee height, or a small round metal cap sitting in the grass.',
    whyItMatters: 'An old buried oil tank becomes your problem the day you close, and a leaking one is expensive to clean up.',
    flagMeans: 'Ask straight out whether there was ever a buried oil tank and whether it was removed. Ask to see the paperwork.',
    minYear: 1800, maxYear: 1975,
    guide: 'home-inspection-check-underground-oil-tanks',
    rank: 'first',
  },
  {
    id: 'eifs-stucco',
    zone: 'Outside, before you go in',
    prompt: 'If the outside looks like stucco, knock on it gently in two or three spots.',
    lookingFor: 'A hollow sound, like knocking on foam, instead of the solid thud of real stucco.',
    whyItMatters: 'Synthetic stucco can trap water behind it, and you will not see the damage until it is expensive.',
    flagMeans: 'Ask your inspector whether it is real stucco or synthetic, and whether a moisture test is worth doing.',
    minYear: 1975, maxYear: 2005,
    guide: 'standard-home-inspection-check-eifs-stucco-moisture',
    rank: 'first',
  },
  {
    id: 'termite-tubes',
    zone: 'Outside, before you go in',
    prompt: 'Crouch down at two or three spots where the wall meets the dirt.',
    lookingFor: 'Thin mud tunnels running up the concrete, about as wide as a pencil.',
    whyItMatters: 'Termites build those tunnels to get from the soil into the wood, and you can see them from outside.',
    flagMeans: 'Ask who is ordering the termite report and when. Who pays is often negotiable, so settle it early.',
    minYear: 1800, maxYear: 2100,
    guide: 'standard-home-inspection-include-termites',
    rank: 'ifTime',
  },

  // ---------------------------------------------------------------- utility room
  {
    id: 'panel-brand',
    zone: 'Utility room or garage',
    prompt: 'Find the breaker box and open just the outer door. Read the brand name inside.',
    lookingFor: 'The names Federal Pacific, FPE, Stab-Lok, Zinsco, Sylvania-Zinsco, or Challenger.',
    whyItMatters: 'These brands are the single most common reason a home insurance application gets turned down flat.',
    flagMeans: 'Take a photo of the label and send it to an insurance agent. Ask for a real quote, not an opinion, before your deadline.',
    minYear: 1950, maxYear: 1990,
    guide: 'federal-pacific-stab-lok-panel-inspectors-flag',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'fuses-not-breakers',
    zone: 'Utility room or garage',
    prompt: 'Look inside the box. Flip switches, or round screw-in fuses?',
    lookingFor: 'Round glass or ceramic fuses that screw in, instead of rows of little switches.',
    whyItMatters: 'Plenty of insurers will not write a policy on a fuse box at all, whatever shape it is in.',
    flagMeans: 'Treat this as an insurance question first. Ask an agent whether they can cover it as-is, and get an electrician\'s quote.',
    minYear: 1800, maxYear: 1965,
    guide: 'get-home-insurance-fuse-box',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'water-heater-date',
    zone: 'Utility room or garage',
    prompt: 'Find the sticker on the side of the water heater and photograph the serial number.',
    lookingFor: 'A date printed on the label. Much past twelve years old and it is near the end of its life.',
    whyItMatters: 'When a water heater fails it does not just stop working, it empties onto the floor.',
    flagMeans: 'Budget to replace it in your first year rather than asking the seller. Ask whether they have the install receipt.',
    minYear: 1800, maxYear: 2100,
    guide: 'hvac-techs-wish-buyers-knew-about-system-age',
    rank: 'first',
  },
  {
    id: 'tpr-discharge',
    zone: 'Utility room or garage',
    prompt: 'On the water heater, find the pipe near the top and follow it down with your eyes.',
    lookingFor: 'A pipe that stops halfway down, points upward, or is capped, instead of running down near the floor.',
    whyItMatters: 'That is the safety valve. If it ever lets go, you want scalding water at your ankles, not your face.',
    flagMeans: 'Ask your inspector to write it up. It is a cheap fix and an easy thing to ask the seller to handle.',
    minYear: 1800, maxYear: 2100,
    guide: 'tpr-valve-inspectors-always-check',
    rank: 'ifTime',
  },
  {
    id: 'knob-and-tube',
    zone: 'Utility room or garage',
    prompt: 'Shine your phone flashlight along the exposed beams in the basement, garage, or attic.',
    lookingFor: 'White or brown ceramic knobs screwed to the wood, with single wires threaded through them.',
    whyItMatters: 'Whether that wiring is still live or long dead changes both the repair bill and whether you can insure the place.',
    flagMeans: 'Ask your inspector to confirm in writing whether any of it is still live, then take that answer to an insurance agent.',
    minYear: 1800, maxYear: 1950,
    guide: 'what-is-knob-and-tube-wiring',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'aluminium-branch',
    zone: 'Utility room or garage',
    prompt: 'Look at the writing printed on the cables where they enter the top of the breaker box.',
    lookingFor: 'The letters AL or ALUMINUM on the thin cables that feed regular rooms, not just on the thick main cable.',
    whyItMatters: 'Aluminum on ordinary room wiring is a known fire risk, and most insurers want it fixed before they will cover you.',
    flagMeans: 'Ask your inspector to write down what the wiring is made of, and get a price for fixing it before your deadline.',
    minYear: 1965, maxYear: 1976,
    guide: 'get-home-insurance-aluminum-wiring',
    rank: 'first',
    insuranceFlag: true,
  },

  // ---------------------------------------------------------------- kitchen and baths
  {
    id: 'polybutylene',
    zone: 'Kitchen and bathrooms',
    prompt: 'Open the cabinet under a bathroom sink and look at the pipes going into the wall. Then check behind the water heater.',
    lookingFor: 'Bendy gray, blue, or black plastic pipe, often stamped PB2110.',
    whyItMatters: 'This pipe fails from the inside with no warning, and most insurers will not cover a house that still has it.',
    flagMeans: 'Ask whether the whole house was re-piped or only the parts you can see. Ask for the receipt and the permit.',
    minYear: 1978, maxYear: 1995,
    guide: 'spot-polybutylene-pipes-before-buying-house',
    rank: 'first',
    insuranceFlag: true,
  },
  {
    id: 'accordion-trap',
    zone: 'Kitchen and bathrooms',
    prompt: 'Open the cabinet under a bathroom or kitchen sink and look at the drain pipe.',
    lookingFor: 'A ribbed, bendy pipe like a straw, instead of a smooth curved one. Tape on a joint counts too.',
    whyItMatters: 'That ribbed pipe catches gunk and is not allowed by most plumbing codes, so it usually means somebody did their own work.',
    flagMeans: 'Take it as a hint, not a verdict. Ask what else was done by the same person, and look up the permit history.',
    minYear: 1800, maxYear: 2100,
    guide: 'amateur-workmanship-mean-home-inspection-report',
    rank: 'ifTime',
  },
  {
    id: 'gfci-outlets',
    zone: 'Kitchen and bathrooms',
    prompt: 'Look at the outlets by the kitchen sink, in each bathroom, in the garage, and outside.',
    lookingFor: 'Outlets with no TEST and RESET buttons on them in any of those places.',
    whyItMatters: 'Those buttons are what cut the power before a shock turns serious near water.',
    flagMeans: 'Ask your inspector to list every spot that is missing one. It is cheap to fix and sellers rarely argue about it.',
    minYear: 1800, maxYear: 2100,
    guide: 'need-gfci-outlets-pass-home-inspection',
    rank: 'ifTime',
  },
  {
    id: 'three-prong-old-house',
    zone: 'Living space',
    prompt: 'In an older house, look at the outlets in the bedrooms and the living room.',
    lookingFor: 'Modern three-hole outlets throughout, in a house whose wiring you have just seen is the old two-wire kind.',
    whyItMatters: 'A three-hole outlet on old wiring looks safe and is not. It is a common cosmetic swap before listing.',
    flagMeans: 'Ask your inspector to test for open grounds and to say how many outlets are affected, not just whether any are.',
    minYear: 1800, maxYear: 1965,
    guide: 'open-ground-mean-electrical-inspection',
    rank: 'ifTime',
  },

  // ---------------------------------------------------------------- basement
  {
    id: 'efflorescence',
    zone: 'Basement',
    prompt: 'Shine your flashlight along the bottom two feet of the basement walls, all the way around.',
    lookingFor: 'White chalky powder on the block or concrete. Also one freshly painted wall when the rest is bare.',
    whyItMatters: 'That white powder is salt left behind by water coming through the wall, so it is a record of water you cannot see now.',
    flagMeans: 'Ask when the basement was last painted and why. Ask your inspector to comment on that specific wall.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement'],
    guide: 'when-foundation-crack-need-structural-engineer',
    rank: 'first',
  },
  {
    id: 'sump-pump',
    zone: 'Basement',
    prompt: 'Look for a covered hole set into the basement floor, usually in a corner.',
    lookingFor: 'A hole with no pump in it, or a pump whose pipe dumps out right against the foundation outside.',
    whyItMatters: 'A standard policy does not cover water backing up through a sump. That coverage has to be added on purpose.',
    flagMeans: 'Ask whether the policy has a water backup add-on, and ask the seller how often the pump runs in a wet month.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement'],
    guide: 'homeowners-insurance-cover-failed-sump-pump',
    rank: 'ifTime',
    insuranceFlag: true,
  },
  {
    id: 'cast-iron-stack',
    zone: 'Basement or crawl space',
    prompt: 'Find the big vertical drain pipe and look at where it disappears into the floor.',
    lookingFor: 'Thick dark metal instead of white plastic, with rust flaking off or damp stains near the bottom.',
    whyItMatters: 'Old metal drains rust from the inside out. The stretch under the concrete fails first and costs the most to reach.',
    flagMeans: 'Ask about running a camera down the main drain. It is usually an add-on and worth booking before your deadline.',
    minYear: 1800, maxYear: 1975,
    foundations: ['basement', 'crawlspace'],
    guide: 'why-cast-iron-pipes-corrode',
    rank: 'first',
  },
  {
    id: 'foundation-cracks',
    zone: 'Basement',
    prompt: 'Walk around the basement and look where the walls meet the floor and the ceiling.',
    lookingFor: 'Cracks wide enough to slip a coin into, cracks running at an angle from the corners of windows, or a wall bowing inward.',
    whyItMatters: 'Most cracks in a basement wall are normal. A few are not, and the difference is width and direction, not length.',
    flagMeans: 'Photograph each one with a coin beside it for scale. Ask whether an independent engineer, not a repair company, should take a look.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement'],
    guide: 'when-foundation-crack-need-structural-engineer',
    rank: 'first',
  },
  {
    id: 'prior-repair-evidence',
    zone: 'Basement or crawl space',
    prompt: 'Look along the inside of the foundation wall for anything that does not match the rest.',
    lookingFor: 'Metal or black straps bolted to the wall, a row of brackets, new mortar in old block, or one patch of fresh paint.',
    whyItMatters: 'Past foundation work is not automatically bad news, but your lender may want an engineer\'s letter before it will close.',
    flagMeans: 'Ask for the engineer\'s report, the invoice, and the warranty, and whether that warranty transfers to you.',
    minYear: 1800, maxYear: 2100,
    foundations: ['basement', 'crawlspace'],
    guide: 'should-buy-house-s-already-had-foundation-repair',
    rank: 'first',
  },

  // ---------------------------------------------------------------- crawl space
  {
    id: 'crawl-standing-water',
    zone: 'Crawl space',
    prompt: 'Open the crawl space hatch and shine your flashlight across the ground. You do not have to go in.',
    lookingFor: 'Standing water or wet dirt, plastic sheeting that is torn or missing, and insulation hanging down.',
    whyItMatters: 'A wet crawl space pushes moisture into the floor above it all year, and you notice it upstairs rather than down there.',
    flagMeans: 'Ask your inspector to confirm they actually went in, rather than looking through the hatch.',
    minYear: 1800, maxYear: 2100,
    foundations: ['crawlspace'],
    guide: 'evidence-prior-repair-mean-home-inspection-report',
    rank: 'first',
  },

  // ---------------------------------------------------------------- living space
  {
    id: 'settlement-cracking',
    zone: 'Living space',
    prompt: 'Look above the doorways and where the walls meet the ceiling in two or three rooms.',
    lookingFor: 'Cracks angling up from the corners of door frames, doors that will not latch, or fresh patching under new paint.',
    whyItMatters: 'Almost every house has hairline cracks. Several at the same angle in different rooms is a different conversation.',
    flagMeans: 'Photograph them and ask when the room was last painted. Ask your inspector to say which ones are only cosmetic.',
    minYear: 1800, maxYear: 2100,
    guide: 'typical-settlement-cracking-mean-inspection-report',
    rank: 'ifTime',
  },
  {
    id: 'blocked-access',
    zone: 'Living space',
    prompt: 'Notice anything stacked in front of the breaker box, the attic hatch, the crawl space door, or filling the garage.',
    lookingFor: 'Boxes, furniture, or storage blocking any of those.',
    whyItMatters: 'Your inspector cannot report on what they cannot reach, and not inspected becomes your problem, not the seller\'s.',
    flagMeans: 'Ask now for it to be moved before the inspection. Asking afterwards usually means paying for a second visit.',
    minYear: 1800, maxYear: 2100,
    guide: 'not-inspected-due-storage-mean-inspection-report',
    rank: 'ifTime',
  },

  // ---------------------------------------------------------------- paperwork
  {
    id: 'permit-paper-trail',
    zone: 'Paperwork',
    prompt: 'On your way out, ask the agent one question: which work was permitted, and can you see the permits?',
    lookingFor: 'A finished basement, an addition, a deck, a new roof or breaker box, with no paperwork offered for any of it.',
    whyItMatters: 'An open permit becomes yours at closing, and it usually surfaces at the last minute through the title company.',
    flagMeans: 'Look it up yourself. Permit records are public everywhere in the US and searching them is free.',
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

/**
 * The page's structured data, shared between App.tsx's applyHeadSeo call and
 * scripts/prerender-walkthrough.tsx.
 *
 * One exported constant rather than two hand-kept copies: /advertise and the legal pages each
 * maintain their schema twice and rely on discipline to keep them equal, which is a drift risk this
 * route does not need to inherit.
 */
export const WALKTHROUGH_URL = 'https://www.beforeregret.com/walkthrough/';

export const WALKTHROUGH_JSON_LD: Array<Record<string, unknown>> = [
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to check a house during a 20-minute viewing',
    description:
      'A room-by-room list of things a buyer can physically look at during a normal house viewing, selected by the decade the house was built and what it sits on.',
    totalTime: 'PT20M',
    url: WALKTHROUGH_URL,
    isAccessibleForFree: true,
    supply: { '@type': 'HowToSupply', name: 'A phone with a flashlight' },
    author: { '@id': 'https://www.beforeregret.com/#organization' },
    publisher: { '@id': 'https://www.beforeregret.com/#organization' },
    step: [
      { '@type': 'HowToStep', name: 'Outside, before you go in', text: 'Look at the roof from the street, walk the lawn for a green stripe over the sewer line, and check the perimeter for an old oil tank fill pipe.' },
      { '@type': 'HowToStep', name: 'Utility room or garage', text: 'Read the brand name on the electrical panel door, photograph the water heater date sticker, and look at the cable markings entering the panel.' },
      { '@type': 'HowToStep', name: 'Kitchen and bathrooms', text: 'Open a cabinet under a sink and look at the supply pipe material and the shape of the drain trap.' },
      { '@type': 'HowToStep', name: 'Basement or crawl space', text: 'Shine a flashlight along the bottom of the walls looking for white salt deposits, look at the main drain stack, and check the foundation wall for cracks or evidence of past repair.' },
      { '@type': 'HowToStep', name: 'Before you leave', text: 'Ask the agent which improvements were permitted and whether you can see the closed permits.' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.beforeregret.com/' },
      { '@type': 'ListItem', position: 2, name: 'The 20-Minute Walkthrough Checklist', item: WALKTHROUGH_URL },
    ],
  },
];
