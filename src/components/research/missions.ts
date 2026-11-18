// Stage 3 of the guided research tool (docs/plans/guided-research-tool-2026-11.md): insurance, the water service
// line and the inspection report. Fixed text only, no AI. Every statement traces to a quoted fact in
// data/fact-ledgers/research-tool-missions.json or get-clue-report-before-buying-house.json (the `facts` lists), and
// scripts/assert-research-missions.ts fails if a number here isn't in one of those quotes.
//
// Calm, practical tone (voice guide): a finding is something to ask about, never a verdict on the house.

export type MissionId = 'insure' | 'water' | 'decode';

export interface Source { label: string; url: string; checkedOn: string }
export interface HowStep {
  title: string;
  body: string;
  link?: { label: string; href: string; internal?: boolean };
  source?: Source;
}
export interface Meaning {
  tone: 'good' | 'ask' | 'neutral';
  text: string;
  /** A question the visitor can send the seller. */
  seller?: string;
  /** An item for the "Verify before your deadline" list. */
  verify?: string;
  /** Short label for the report row ("You found: ..."). */
  found: string;
  /** Short next step for the report row's tag. */
  next: string;
}
export interface Choice {
  id: string;
  label: string;
  meaning: Meaning;
  /** In a multi-select question, picking this clears the others (and picking another clears it). */
  exclusive?: boolean;
}
export interface RecordQuestion { id: string; label: string; multi?: boolean; choices: Choice[] }
/** One screen of the step-by-step flow: one or two steps, and the answer that goes with them, if any. */
export interface Screen { title: string; steps: number[]; ask?: string }
export interface MissionDef {
  id: MissionId;
  h1: string;
  intro: string;
  minutes: string;
  steps: HowStep[];
  record: RecordQuestion[];
  /** The order the visitor sees: each step next to the question it answers (owner, 2026-11-18: one thing at a time). */
  screens: Screen[];
  /** Report section heading. */
  reportTitle: string;
  /** Ledger references (ledger:<slug>#<id>) behind this mission's text. */
  facts: string[];
}

const FEMA_HOME: Source = { label: 'FEMA', url: 'https://www.fema.gov/flood-maps/know-your-risk/homeowners', checkedOn: '2026-11-18' };
const FEMA_INS: Source = { label: 'FEMA', url: 'https://www.fema.gov/flood-insurance', checkedOn: '2026-11-18' };
const CFPB: Source = { label: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/consumer-reporting-companies/companies-list/comprehensive-loss-underwriting-exchange/', checkedOn: '2026-10-19' };
const ECFR: Source = { label: '40 CFR 141.84 (EPA rule)', url: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-141/subpart-I/section-141.84', checkedOn: '2026-11-18' };
const EPA_TAP: Source = { label: 'EPA Protect Your Tap', url: 'https://www.epa.gov/ground-water-and-drinking-water/protect-your-tap-quick-check-lead-0', checkedOn: '2026-11-18' };

export const MISSIONS: Record<MissionId, MissionDef> = {
  insure: {
    id: 'insure',
    h1: 'Will this house be hard to insure?',
    intro: 'Start with two free checks: the flood map and the house’s claims history. Then get a quote before your deadline.',
    minutes: 'About 10 minutes',
    reportTitle: 'Insurance',
    facts: [
      'ledger:research-tool-missions#i1', 'ledger:research-tool-missions#i2', 'ledger:research-tool-missions#i3',
      'ledger:research-tool-missions#i4', 'ledger:get-clue-report-before-buying-house#f2', 'ledger:get-clue-report-before-buying-house#f3', 'ledger:get-clue-report-before-buying-house#f4',
    ],
    steps: [
      {
        title: 'Look up the flood zone',
        body: 'On FEMA’s Flood Map Service Center, type the address and open the dynamic map. The letters on the map are the flood zone. Zones that start with A or V are FEMA’s high-risk areas.',
        link: { label: 'FEMA Flood Map Service Center', href: 'https://msc.fema.gov/portal/home' },
        source: FEMA_HOME,
      },
      {
        title: 'Ask the seller for the claims history',
        body: 'Insurance claims on a house stay on file for up to seven years. A buyer can’t order the LexisNexis C.L.U.E. report; the owner (or an insurer or lender) can, free once every 12 months. So ask the seller for it, and for the Verisk A-PLUS report too.',
        source: CFPB,
      },
      {
        title: 'Get a quote before your deadline',
        body: 'Ask an insurance agent to quote this address before your inspection or option period ends. If you’ll want flood insurance, start early: a flood policy typically has a 30-day wait unless your lender is the one requiring it.',
        source: FEMA_INS,
      },
    ],
    screens: [
      { title: 'Look up the flood zone', steps: [0], ask: 'zone' },
      { title: 'Ask the seller for the claims history', steps: [1], ask: 'claims' },
      { title: 'Get a quote before your deadline', steps: [2] },
    ],
    record: [
      {
        id: 'zone',
        label: 'What flood zone did the map show?',
        choices: [
          {
            id: 'av',
            label: 'A zone starting with A or V',
            meaning: {
              tone: 'ask',
              text: 'That’s one of FEMA’s high-risk flood areas. With a mortgage from a government-backed lender, you’ll need flood insurance there. Get a flood quote now, so the cost is part of your decision.',
              seller: 'Has the house ever had flood or water damage, and was it covered by insurance?',
              verify: 'Flood insurance quote for this address',
              found: 'High-risk flood zone (A or V)',
              next: 'Get a flood quote',
            },
          },
          {
            id: 'other',
            label: 'Another zone, like X',
            meaning: {
              tone: 'good',
              text: 'Outside FEMA’s high-risk areas. Floods can still happen, and most homeowners policies don’t cover them, so ask your agent what flood cover would cost. It’s optional here.',
              found: 'Outside the high-risk flood zones',
              next: 'Flood cover optional',
            },
          },
          {
            id: 'cant',
            label: 'I couldn’t check',
            meaning: {
              tone: 'neutral',
              text: 'Try the FEMA map again later, or ask your insurance agent to tell you the flood zone for this address when they quote it.',
              verify: 'Flood zone for this address',
              found: 'Flood zone not checked yet',
              next: 'Ask your agent',
            },
          },
        ],
      },
      {
        id: 'claims',
        label: 'Did the seller share the claims reports?',
        choices: [
          {
            id: 'none',
            label: 'Yes, no claims on them',
            meaning: { tone: 'good', text: 'No claims on file. Nice. Keep the reports with your papers.', found: 'Claims reports: no claims', next: 'Keep for your files' },
          },
          {
            id: 'claims',
            label: 'Yes, and there are claims',
            meaning: {
              tone: 'ask',
              text: 'A past claim is a question to ask, not a verdict on the house. Find out what happened and whether the repair was finished.',
              seller: 'The claims report shows a past claim. What was it for, and can you share the repair paperwork?',
              verify: 'Repairs for past insurance claims are finished',
              found: 'Claims on file',
              next: 'Ask about the repair',
            },
          },
          {
            id: 'waiting',
            label: 'Not yet, or still waiting',
            meaning: {
              tone: 'neutral',
              text: 'Worth asking for before your deadline. The seller can order both reports for free once a year.',
              seller: 'Could you order your free C.L.U.E. and A-PLUS reports for the house and share them?',
              verify: 'Claims history reports (C.L.U.E. and A-PLUS)',
              found: 'Claims reports requested',
              next: 'Ask the seller',
            },
          },
        ],
      },
    ],
  },

  water: {
    id: 'water',
    h1: 'Is the pipe from the street lead?',
    intro: 'Every public water system has to keep a record of what each service line is made of, listed by street address. Here’s how to read the one for this house.',
    minutes: 'About 10 minutes',
    reportTitle: 'The water line',
    facts: [
      'ledger:research-tool-missions#w1', 'ledger:research-tool-missions#w2', 'ledger:research-tool-missions#w3',
      'ledger:research-tool-missions#w4', 'ledger:research-tool-missions#w5', 'ledger:research-tool-missions#w6',
      'ledger:research-tool-missions#w7',
    ],
    steps: [
      {
        title: 'Find the water utility',
        body: 'The seller’s water bill names it, so ask the seller who supplies the water. If the house is on a private well, there’s no utility record: press Next and choose “private well”.',
      },
      {
        title: 'Look up the address in its service line inventory',
        body: 'Search for the utility’s name plus “service line inventory”. Utilities serving more than 50,000 people have to put it online. Smaller ones still have to make it public, so call them if you can’t find it. The record covers the whole line, including the part on the property.',
        source: ECFR,
      },
      {
        title: 'Read the label',
        body: 'Each line is listed as Lead, Galvanized Requiring Replacement, Non-Lead (some utilities write the material instead, like copper or plastic), or Lead Status Unknown.',
        source: ECFR,
      },
      {
        title: 'Look at the pipe at a showing',
        body: 'With the seller’s OK, find where the water line comes in: near the water meter, or on a wall facing the street, through the wall or floor. Gently scratch it with a key or coin. Orange means copper. Gray, hard to scratch and a magnet sticks: likely galvanized steel. Gray, soft and the magnet doesn’t stick: it may be lead.',
        source: EPA_TAP,
      },
    ],
    screens: [
      { title: 'Find the address in the water utility’s records', steps: [0, 1] },
      { title: 'Read the label', steps: [2], ask: 'line' },
      { title: 'Look at the pipe at a showing', steps: [3] },
    ],
    record: [
      {
        id: 'line',
        label: 'What does the record say for this address?',
        choices: [
          {
            id: 'lead',
            label: 'Lead',
            meaning: {
              tone: 'ask',
              text: 'A lead line can be replaced. Ask the utility whether it has a replacement planned for this line and whether the owner pays for any part. A water test is how to know what’s in the water itself, and some states or utilities pay for testing or replacement.',
              seller: 'The water service line is listed as lead. Has the water been tested, and has the utility scheduled a replacement?',
              verify: 'Water test results and the utility’s plan for the lead line',
              found: 'Lead service line',
              next: 'Ask about testing and replacement',
            },
          },
          {
            id: 'grr',
            label: 'Galvanized Requiring Replacement (counted like lead)',
            meaning: {
              tone: 'ask',
              text: 'The utility counts this line as needing replacement, the same as lead. That’s the rule for galvanized pipe that is or ever was downstream of lead, or of a line of unknown material. Ask the same questions you would for lead.',
              seller: 'The water service line is listed as galvanized requiring replacement. Has the water been tested, and has the utility scheduled a replacement?',
              verify: 'Water test results and the utility’s plan for the service line',
              found: 'Galvanized, needs replacement',
              next: 'Ask about testing and replacement',
            },
          },
          {
            id: 'unknown',
            label: 'Lead Status Unknown',
            meaning: {
              tone: 'neutral',
              text: 'Unknown means the utility has no reliable record of the material yet. It isn’t a finding either way. Look at the pipe where it comes in at your showing, and ask the utility when it plans to identify it.',
              verify: 'What the water service line is made of',
              found: 'Unknown in the inventory',
              next: 'Check the pipe',
            },
          },
          {
            id: 'nonlead',
            label: 'Non-Lead, copper or plastic',
            meaning: { tone: 'good', text: 'Listed as not lead. Nice. Note it for your files.', found: 'Not lead', next: 'Keep for your files' },
          },
          {
            id: 'well',
            label: 'The house is on a private well',
            meaning: {
              tone: 'neutral',
              text: 'A well has no utility record. Lead can also come from other plumbing and faucets, so a water test is the way to know for certain.',
              verify: 'Well water test results',
              found: 'Private well',
              next: 'Test the water',
            },
          },
          {
            id: 'cant',
            label: 'I couldn’t find it',
            meaning: {
              tone: 'neutral',
              text: 'Ask the seller which utility supplies the water, then call the utility and ask for the service line record for the address.',
              seller: 'Which utility supplies the water, and do you know what the service line from the street is made of?',
              verify: 'Service line record from the water utility',
              found: 'Not found yet',
              next: 'Ask the utility',
            },
          },
        ],
      },
    ],
  },

  decode: {
    id: 'decode',
    h1: 'Found something odd in the inspection report?',
    intro: 'Inspection reports are full of shorthand. Our decoder explains the common terms in plain English and what to do next.',
    minutes: 'A few minutes',
    reportTitle: 'The inspection report',
    facts: ['ledger:research-tool-missions#d1'],
    steps: [
      {
        title: 'Open the decoder',
        body: 'Search a term, like “open ground” or “GFCI”, or paste a paragraph of the report. It runs in your browser, and nothing you paste is sent anywhere.',
        link: { label: 'Inspection Report Decoder', href: '/tools/inspection-decoder/', internal: true },
      },
      {
        title: 'Sort what you find',
        body: 'For each item, decide: is it a question for the seller, or something a specialist should look at before your deadline?',
      },
    ],
    screens: [
      { title: 'Look up the terms you don’t recognize', steps: [0, 1], ask: 'items' },
    ],
    record: [
      {
        id: 'items',
        label: 'What did you find? Pick all that apply.',
        multi: true,
        choices: [
          {
            id: 'seller',
            label: 'Something to ask the seller about',
            meaning: {
              tone: 'ask',
              text: 'Ask for repair records or receipts. A written answer is easier to rely on later.',
              seller: 'The inspection report flagged some items. Can you share any repair records or receipts for them?',
              verify: 'Seller’s answers on the inspection items',
              found: 'Items to ask the seller about',
              next: 'Ask the seller',
            },
          },
          {
            id: 'specialist',
            label: 'Something a specialist should look at',
            meaning: {
              tone: 'ask',
              text: 'Book them before your deadline, and ask for their findings in writing.',
              verify: 'Specialist’s written findings',
              found: 'Items for a specialist',
              next: 'Book a specialist',
            },
          },
          {
            id: 'fine',
            label: 'Nothing that worries me',
            exclusive: true,
            meaning: { tone: 'good', text: 'Good. Keep the report with your papers.', found: 'Nothing worrying', next: 'Keep for your files' },
          },
          {
            id: 'notyet',
            label: 'My inspection hasn’t happened yet',
            exclusive: true,
            meaning: {
              tone: 'neutral',
              text: 'Come back after it. The decoder will be here.',
              verify: 'Home inspection',
              found: 'Inspection not done yet',
              next: 'After the inspection',
            },
          },
        ],
      },
    ],
  },
};

export const MISSION_IDS = Object.keys(MISSIONS) as MissionId[];
