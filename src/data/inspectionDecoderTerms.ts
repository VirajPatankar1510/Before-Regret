// Inspection Report Decoder -- the terms it knows (PREVIEW; expanded to 44 terms 2026-10-30, owner: "cover maximum terms").
//
// No AI, no outside API: this file IS the tool's knowledge. Matching is plain text (aliases below), done in the
// visitor's browser; a report pasted into the tool never leaves their device.
//
// RULES FOR EVERY ENTRY
//   - Every term links to a guide we have published, and says nothing that guide's subject doesn't support.
//   - Definitions and practical next steps only. Deliberately left OUT until each is re-verified at a primary source:
//     code section numbers, thresholds and measurements, dates and eras beyond the decade, costs, and any claim about
//     what insurers or lenders "usually" do. Where insurance matters, the entry says to ask your own insurer in writing.
//     Several older guides carry broad insurer generalisations (e.g. Zinsco, fuse box); these entries do NOT repeat them.
//   - Calm wording. "Safety item" means have a licensed pro look before closing, not panic.
//   - Before the page goes indexable, every entry needs a fact-ledger line (data/fact-ledgers/), as our articles do.
export type Seriousness = 'safety' | 'investigate' | 'minor';

export type DecoderCategory =
  | 'Electrical' | 'Plumbing' | 'Sewer & septic' | 'Foundation & structure' | 'Roof & exterior'
  | 'Environmental' | 'Pests' | 'Heating & cooling' | 'Report wording';

export const DECODER_CATEGORIES: DecoderCategory[] = [
  'Electrical', 'Plumbing', 'Sewer & septic', 'Foundation & structure', 'Roof & exterior',
  'Environmental', 'Pests', 'Heating & cooling', 'Report wording',
];

export interface DecoderTerm {
  id: string;
  name: string;
  category: DecoderCategory;
  /** Lower-case phrasings matched against what the visitor types or pastes. */
  aliases: string[];
  meaning: string;
  whyItMatters: string[];
  seriousness: { level: Seriousness; text: string };
  whoChecksIt: string;
  askYourInspector: string[];
  askTheSeller: string[];
  guide: { href: string; title: string };
}

const ELECTRICIAN = 'A licensed electrician';
const PLUMBER = 'A licensed plumber';
const ASK_INSURER = 'If it could affect your homeowners insurance, ask the insurer quoting your policy, in writing, before your deadline.';

export const DECODER_TERMS: DecoderTerm[] = [
  // ---------------------------------------------------------------- Electrical
  {
    id: 'open-ground', name: 'Open ground', category: 'Electrical',
    aliases: ['open ground', 'open grounds', 'open grd', 'ungrounded outlet', 'ungrounded outlets', 'ungrounded receptacle', 'ungrounded receptacles', 'no ground', 'missing ground', 'not grounded', 'ungrounded three prong', 'ungrounded 3 prong'],
    meaning: 'A three-prong outlet that isn’t connected to a ground wire. It looks modern, but the third (grounding) slot goes nowhere.',
    whyItMatters: [
      'The ground wire is the safety path that carries stray current away if an appliance develops a fault. Without it, the metal case of a faulty appliance can stay live.',
      'Surge protectors plugged into it can’t do their job, because they rely on that ground path.',
      'It often comes from swapping old two-prong outlets for three-prong ones without running a ground wire.',
    ],
    seriousness: { level: 'safety', text: 'A safety item. Usually fixable, but how big the job is depends on whether it’s one outlet or the whole house.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: [
      'Which outlets, and how many? One room, or throughout the house?',
      'If the house is old enough to have started with two-prong wiring but every outlet now tests “correct”, could some be bootleg grounds?',
    ],
    askTheSeller: ['Were any outlets replaced while you owned the house, and was that work permitted?', 'Will you have a licensed electrician correct it before closing, or credit the cost?'],
    guide: { href: '/guides/open-ground-mean-electrical-inspection/', title: 'What does “open ground” mean on a home inspection?' },
  },
  {
    id: 'bootleg-ground', name: 'Bootleg (false) ground', category: 'Electrical',
    aliases: ['bootleg ground', 'bootleg grounds', 'false ground', 'false grounds', 'fake ground', 'jumpered ground', 'neutral bonded to ground at outlet'],
    meaning: 'A short jumper wire inside an outlet box connecting the neutral screw to the ground screw, instead of a real ground wire back to the panel. A standard plug-in tester reads it as correctly wired.',
    whyItMatters: [
      'It hides an open ground instead of fixing it, so the outlet looks safe when it isn’t.',
      'The grounding pin can end up carrying current, and if the neutral fails upstream, metal parts of plugged-in equipment can become live.',
    ],
    seriousness: { level: 'safety', text: 'A safety item, and one a basic test can miss, so it needs an electrician to open the box or use the right tester.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['How did you detect it, by opening the box or with a tester designed to find it?', 'Is it likely on other outlets that also tested “correct”?'],
    askTheSeller: ['Who replaced the outlets, and was there a permit for any rewiring?'],
    guide: { href: '/guides/open-ground-mean-electrical-inspection/', title: 'What does “open ground” mean? (covers bootleg grounds)' },
  },
  {
    id: 'reverse-polarity', name: 'Reverse polarity', category: 'Electrical',
    aliases: ['reverse polarity', 'reversed polarity', 'polarity reversed', 'hot neutral reverse', 'hot neutral reversed', 'hot and neutral reversed', 'hot neutral swapped', 'rev polarity'],
    meaning: 'The hot and neutral wires are connected to the wrong screws on the outlet. Things plugged in still work, so it usually goes unnoticed.',
    whyItMatters: [
      'A device’s on/off switch is meant to cut the hot wire. With polarity reversed it cuts the neutral instead, so parts of the device can stay energised even when it’s switched off, like the metal shell of a lamp socket while you change a bulb.',
      'One or two reversed outlets usually means a simple wiring slip at those outlets. Many, across different rooms, can mean a mistake further back on the circuit.',
    ],
    seriousness: { level: 'safety', text: 'A safety item. Often a quick fix when it’s isolated; worth a fuller look when it’s widespread.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Exactly which outlets tested reversed? Is there a pattern by room or circuit?', 'Did anything suggest switch wiring problems too? A plug-in tester checks outlets, not switches.'],
    askTheSeller: ['Has any electrical work been done in the rooms where these outlets are, and by whom?', 'Will a licensed electrician correct the outlets before closing, or will you credit the cost?'],
    guide: { href: '/guides/reverse-polarity-mean-electrical-inspection/', title: 'What does “reverse polarity” mean? Is it dangerous?' },
  },
  {
    id: 'gfci', name: 'GFCI missing or not tripping', category: 'Electrical',
    aliases: ['gfci', 'gfcis', 'gfi', 'ground fault', 'ground fault circuit interrupter', 'no gfci', 'missing gfci', 'gfci did not trip', 'gfci not tripping', 'gfci protection', 'gfci inoperable', 'gfci defective', 'not gfci protected'],
    meaning: 'GFCI (ground-fault circuit interrupter) protection cuts power in a fraction of a second if electricity starts leaking through a path it shouldn’t, such as a person. The report means it’s missing where expected, usually near water, or it didn’t trip when tested.',
    whyItMatters: [
      'It’s the protection designed for wet areas like kitchens, bathrooms, garages and outdoors, where a shock is most dangerous.',
      'Protection doesn’t have to be the outlet with the test/reset buttons. One GFCI outlet, or a GFCI breaker in the panel, can protect other plain-looking outlets on the same circuit, so “missing” is worth confirming.',
    ],
    seriousness: { level: 'safety', text: 'A safety item in wet areas. Usually a straightforward fix once you know where protection is and isn’t.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Is protection missing, or present but not tripping when tested?', 'Did you check for GFCI breakers in the panel or a GFCI outlet upstream on the same circuit?'],
    askTheSeller: ['Will you have GFCI protection added or replaced where it’s missing before closing, or credit the cost?'],
    guide: { href: '/guides/need-gfci-outlets-pass-home-inspection/', title: 'Do you need GFCI outlets to pass a home inspection?' },
  },
  {
    id: 'double-tap', name: 'Double-tapped breaker', category: 'Electrical',
    aliases: ['double tap', 'double tapped', 'double tapped breaker', 'double tapping', 'double tap breaker', 'two wires on one breaker', 'two conductors under one terminal', 'multiple wires on breaker'],
    meaning: 'Two wires connected under a single screw on a circuit breaker that is designed to hold only one.',
    whyItMatters: [
      'A terminal made for one wire may not clamp two properly, and a loose connection can overheat.',
      'Some breakers are designed and labelled to take two wires, so it’s worth confirming which kind this is.',
    ],
    seriousness: { level: 'safety', text: 'A safety item, and usually a simple, inexpensive fix for an electrician.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Which breaker, and is it a type made to accept two wires?', 'Were there other signs of amateur work inside the panel?'],
    askTheSeller: ['Who last worked in the electrical panel, and was it permitted?'],
    guide: { href: '/guides/double-tapped-breaker-did-inspector-flag/', title: 'What is a double-tapped breaker? Why inspectors flag it' },
  },
  {
    id: 'fpe-panel', name: 'Federal Pacific (Stab-Lok) panel', category: 'Electrical',
    aliases: ['federal pacific', 'federal pacific electric', 'fpe', 'fpe panel', 'stab lok', 'stablok', 'stab-lok', 'stab lok panel', 'federal pacific panel'],
    meaning: 'An older brand of electrical panel and breakers. The brand name is on the label inside the panel door.',
    whyItMatters: [
      'Inspectors flag it because of long-standing reports that its breakers may not trip reliably when they should.',
      'Replacing individual breakers doesn’t address the concern, so the usual recommendation is an electrician’s evaluation of the whole panel.',
      ASK_INSURER,
    ],
    seriousness: { level: 'safety', text: 'Treat it as a safety item: get a licensed electrician’s written opinion and a quote before your deadline.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Can you record the panel brand and model in writing, with a photo of the label?'],
    askTheSeller: ['Would you replace the panel before closing, or credit the cost from an electrician’s quote?'],
    guide: { href: '/guides/federal-pacific-stab-lok-panel-inspectors-flag/', title: 'What is a Federal Pacific Stab-Lok panel?' },
  },
  {
    id: 'zinsco-panel', name: 'Zinsco panel', category: 'Electrical',
    aliases: ['zinsco', 'zinsco panel', 'zinsco breakers', 'sylvania zinsco', 'gte sylvania'],
    meaning: 'An older brand of electrical panel and breakers, identified from the label inside the panel door.',
    whyItMatters: [
      'Inspectors flag it because of reported problems with breakers that may not trip and connections that can overheat.',
      ASK_INSURER,
    ],
    seriousness: { level: 'safety', text: 'Treat it as a safety item: get a licensed electrician’s evaluation and a replacement quote before your deadline.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Can you record the brand and model in writing, with a photo of the label?', 'Did you see any signs of heat damage in the panel?'],
    askTheSeller: ['Would you replace the panel before closing, or credit the cost from a quote?'],
    guide: { href: '/guides/will-zinsco-panel-fail-4-point-inspection/', title: 'Zinsco panel failed a 4-point inspection? What to do next' },
  },
  {
    id: 'pushmatic-panel', name: 'Pushmatic panel', category: 'Electrical',
    aliases: ['pushmatic', 'push matic', 'push-matic', 'pushmatic panel', 'bulldog pushmatic', 'push button breakers'],
    meaning: 'An older panel whose breakers are push buttons rather than toggles.',
    whyItMatters: [
      'It’s usually flagged for its age and how easy it is to get parts and service, not for one specific defect.',
      'An electrician can tell you whether it’s serviceable or due for replacement.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Worth an electrician’s opinion and, if needed, a replacement quote.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Can you record the panel brand, age if known, and condition in writing?'],
    askTheSeller: ['Do you know when the panel was installed or last serviced?'],
    guide: { href: '/guides/identify-electrical-panel-brand/', title: 'Electrical panel brand: how to tell FPE, Zinsco and Pushmatic' },
  },
  {
    id: 'fuse-box', name: 'Fuse box / fuse panel', category: 'Electrical',
    aliases: ['fuse box', 'fuse panel', 'fused panel', 'screw in fuses', 'edison base fuses', 'over fusing', 'overfused', 'over fused', 'oversized fuse'],
    meaning: 'An older type of electrical panel that protects circuits with replaceable fuses instead of breakers.',
    whyItMatters: [
      'Fuses work when the right size is fitted. The common problem is a fuse too large for the wire behind it (“over-fusing”), which lets wires overheat.',
      'An older panel may also limit how much the house can power today.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate. If the report mentions over-fusing, treat that part as a safety item.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Were any fuses larger than the circuits they protect?', 'What size is the electrical service?'],
    askTheSeller: ['Has the panel ever been upgraded or evaluated by an electrician?'],
    guide: { href: '/guides/get-home-insurance-fuse-box/', title: 'Can you get home insurance with a fuse box?' },
  },
  {
    id: 'knob-and-tube', name: 'Knob-and-tube wiring', category: 'Electrical',
    aliases: ['knob and tube', 'knob & tube', 'knob-and-tube', 'k&t', 'k and t', 'knob tube', 'porcelain knobs'],
    meaning: 'An early two-wire electrical system that runs wires on porcelain knobs and through porcelain tubes. It has no ground wire.',
    whyItMatters: [
      'Existing knob-and-tube is generally allowed to remain, but its age, missing ground, later splices and insulation packed around it are the usual concerns.',
      'It can come up with insurers and lenders, so find out early whether any of it is still live.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate: an electrician can tell you how much is active and what replacing it would involve.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Is it still energised, or abandoned? Where did you see it?', 'Is any of it buried in insulation or spliced to newer cable?'],
    askTheSeller: ['How much has been replaced, and is there paperwork or a permit for it?'],
    guide: { href: '/guides/what-is-knob-and-tube-wiring/', title: 'What is knob-and-tube wiring? How to identify it' },
  },
  {
    id: 'romex-splice', name: 'Open splice / modern cable spliced to old wiring', category: 'Electrical',
    aliases: ['open splice', 'open splices', 'flying splice', 'flying splices', 'splice outside junction box', 'splices not in junction box', 'romex spliced to knob and tube', 'spliced to knob and tube', 'exposed splice', 'exposed splices', 'missing junction box', 'no junction box'],
    meaning: 'Wires joined together outside a proper junction box, often where newer cable (like Romex) meets older wiring.',
    whyItMatters: [
      'Connections are supposed to sit inside an accessible box that protects and contains them. An open splice can loosen, get damaged and overheat.',
      'Where new cable meets knob-and-tube, the old circuit’s limits still apply to everything connected to it.',
    ],
    seriousness: { level: 'safety', text: 'A safety item, usually corrected by an electrician installing proper boxes.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Where are the splices, and how many did you find?', 'Is newer cable connected to older wiring anywhere?'],
    askTheSeller: ['Who did the wiring work in that area, and was it permitted?'],
    guide: { href: '/guides/splice-romex-knob-tube-wiring/', title: 'Can you splice Romex to knob-and-tube wiring?' },
  },
  {
    id: 'aluminum-wiring', name: 'Aluminum branch wiring', category: 'Electrical',
    aliases: ['aluminum wiring', 'aluminium wiring', 'aluminum branch wiring', 'aluminum branch circuits', 'single strand aluminum', 'solid aluminum wiring', 'al wiring'],
    meaning: 'Household circuits wired with solid aluminum conductors instead of copper. This is different from the large aluminum cable that commonly feeds a panel.',
    whyItMatters: [
      'The concern is at the connections, which can loosen and overheat over time.',
      'There are recognised repair methods for the connections, carried out by an electrician.',
      ASK_INSURER,
    ],
    seriousness: { level: 'safety', text: 'Treat it as a safety item until an electrician has checked the connections.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['Is it on the branch circuits, or only the main service cable?', 'Did you see any warm, discoloured or damaged connections?'],
    askTheSeller: ['Has any remediation been done, and is there documentation?'],
    guide: { href: '/guides/get-home-insurance-aluminum-wiring/', title: 'Can you get home insurance with aluminum wiring?' },
  },
  {
    id: 'service-size', name: '100-amp or limited electrical service', category: 'Electrical',
    aliases: ['100 amp', '100 amp service', '100a service', '60 amp', '60 amp service', 'undersized service', 'limited electrical capacity', 'service size'],
    meaning: 'The size of the electrical supply into the house. A smaller service isn’t a defect by itself.',
    whyItMatters: [
      'Whether it’s enough depends on what runs on electricity: heating, hot water, cooking, air conditioning, or an EV charger you plan to add.',
      'Upgrading the service can involve the utility, a permit and panel work, so find out early if you plan big electrical loads.',
    ],
    seriousness: { level: 'minor', text: 'Usually not urgent; matters most if you plan to add major electrical loads.' },
    whoChecksIt: ELECTRICIAN,
    askYourInspector: ['What size is the service and the main breaker?', 'Did anything suggest the panel is already near its limit?'],
    askTheSeller: ['Has the service ever been upgraded? Are there any electrical appliances you’ve had trouble running?'],
    guide: { href: '/guides/100-amp-service-enough-house-re-buying/', title: 'Is 100-amp service enough for a house you’re buying?' },
  },
  // ---------------------------------------------------------------- Plumbing
  {
    id: 'polybutylene', name: 'Polybutylene pipe', category: 'Plumbing',
    aliases: ['polybutylene', 'poly butylene', 'pb pipe', 'pb piping', 'polybutylene piping', 'polybutylene supply lines', 'qest'],
    meaning: 'A gray, flexible plastic water supply pipe used in homes for a period from the late 1970s into the 1990s, often joined with metal crimp rings.',
    whyItMatters: [
      'It has a history of failures, often at fittings or inside walls where you can’t see them.',
      'Copper or newer pipe under one sink doesn’t prove the rest of the house is clear.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate: a plumber can tell you how much is in the house and what repiping would involve.' },
    whoChecksIt: PLUMBER,
    askYourInspector: ['Where did you see it, and could you see the pipe material at the water heater and main shutoff?'],
    askTheSeller: ['Has the house been repiped, fully or partly? Is there an invoice?'],
    guide: { href: '/guides/spot-polybutylene-pipes-before-buying-house/', title: 'How to spot polybutylene pipes before buying a house' },
  },
  {
    id: 'galvanized-pipe', name: 'Galvanized steel water pipe', category: 'Plumbing',
    aliases: ['galvanized pipe', 'galvanized pipes', 'galvanized piping', 'galvanized steel', 'galvanized supply', 'galvanised pipe'],
    meaning: 'Steel water pipe coated with zinc, common in older homes. It’s gray and a magnet sticks to it.',
    whyItMatters: [
      'It corrodes from the inside, which can mean low water pressure, rusty water and leaks.',
      'It’s one of the materials that usually leads to a repipe eventually.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: ask a plumber about its condition and the cost of replacement.' },
    whoChecksIt: PLUMBER,
    askYourInspector: ['Is it the supply pipe, and how much of the house uses it?', 'Did you note low pressure or discoloured water?'],
    askTheSeller: ['Has any of the plumbing been replaced, and where?'],
    guide: { href: '/guides/identify-water-pipes-pex-copper-galvanized/', title: 'PEX, copper or galvanized? How to tell a house’s water pipes' },
  },
  {
    id: 'dielectric', name: 'Dissimilar metals / missing dielectric union', category: 'Plumbing',
    aliases: ['dielectric union', 'no dielectric union', 'missing dielectric', 'dissimilar metals', 'dissimilar metal', 'galvanic corrosion', 'copper to galvanized', 'copper connected to galvanized'],
    meaning: 'Copper pipe joined directly to galvanized steel without the special fitting meant to separate the two metals.',
    whyItMatters: [
      'Different metals in contact can corrode at the joint, leading to leaks.',
      'Even a correct fitting doesn’t fix the older galvanized pipe on the other side of it.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: usually a plumbing repair, plus a question about the remaining old pipe.' },
    whoChecksIt: PLUMBER,
    askYourInspector: ['Where is the joint, and is there any corrosion or leaking at it?'],
    askTheSeller: ['Who did the plumbing repair, and when?'],
    guide: { href: '/guides/connect-pex-copper-to-galvanized-pipe/', title: 'Can you connect PEX or copper to galvanized pipe?' },
  },
  {
    id: 'tpr-valve', name: 'TPR valve or discharge pipe issue', category: 'Plumbing',
    aliases: ['tpr', 'tpr valve', 't&p valve', 't and p valve', 'temperature and pressure relief', 'temperature pressure relief valve', 'relief valve', 'tpr discharge', 'relief valve discharge', 'tpr discharge pipe'],
    meaning: 'The temperature and pressure relief valve on a water heater, and the pipe that carries its discharge away. It releases heat and pressure if the heater overheats.',
    whyItMatters: [
      'It’s the water heater’s last safety device. If the valve or its discharge pipe is missing, capped, too small or the wrong material, it may not work when needed.',
      'A badly routed discharge pipe can also cause scalding.',
    ],
    seriousness: { level: 'safety', text: 'A safety item, and usually a quick plumbing fix.' },
    whoChecksIt: PLUMBER,
    askYourInspector: ['Was the problem the valve itself, or the discharge pipe (missing, capped, wrong size or material)?'],
    askTheSeller: ['How old is the water heater, and who installed it?'],
    guide: { href: '/guides/tpr-valve-inspectors-always-check/', title: 'What is a TPR valve and why do inspectors always check it?' },
  },
  // ---------------------------------------------------------------- Sewer & septic
  {
    id: 'cast-iron-drain', name: 'Cast iron drain or sewer pipe', category: 'Sewer & septic',
    aliases: ['cast iron pipe', 'cast iron pipes', 'cast iron drain', 'cast iron sewer', 'cast iron stack', 'corroded cast iron', 'cast iron corrosion'],
    meaning: 'Heavy iron drain and sewer pipe found in many older homes.',
    whyItMatters: [
      'It corrodes from the inside, so how it looks from outside tells you little.',
      'A sewer camera scope is the way to see its condition before you close.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: book a sewer scope and price any repair it shows.' },
    whoChecksIt: 'A plumber or sewer-scope specialist',
    askYourInspector: ['Where did you see cast iron, and any cracks, rust or leaking?', 'Would you recommend a sewer scope?'],
    askTheSeller: ['Has the sewer line ever been scoped, repaired or replaced? Any backups?'],
    guide: { href: '/guides/why-cast-iron-pipes-corrode/', title: 'Cast iron sewer pipe damage: belly, cracks and repair credits' },
  },
  {
    id: 'orangeburg', name: 'Orangeburg pipe', category: 'Sewer & septic',
    aliases: ['orangeburg', 'orangeburg pipe', 'bituminous fiber pipe', 'fiber sewer pipe', 'tar paper pipe'],
    meaning: 'A sewer pipe made from wood fibre bound with tar, laid in some homes in the mid-1900s.',
    whyItMatters: [
      'Over time it can absorb water, deform under the weight of soil and collapse.',
      'A sewer camera scope is the way to identify it and see its condition.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: scope the line and price replacement if it’s there.' },
    whoChecksIt: 'A plumber or sewer-scope specialist',
    askYourInspector: ['Did anything suggest the sewer material, and would you recommend a scope?'],
    askTheSeller: ['Has the sewer line from the house to the street ever been replaced?'],
    guide: { href: '/guides/orangeburg-pipe-collapse/', title: 'What is Orangeburg pipe and why does it collapse?' },
  },
  {
    id: 'sewer-belly', name: 'Sewer line belly or sag', category: 'Sewer & septic',
    aliases: ['belly', 'bellied', 'sewer belly', 'sewer line belly', 'sag in line', 'sag in the line', 'sagging sewer', 'low spot in sewer', 'standing water in line', 'negative slope'],
    meaning: 'A section of sewer pipe that dips, so wastewater collects there instead of draining away.',
    whyItMatters: [
      'How serious it is depends on how deep the sag is and what’s collecting in it.',
      'Some repair methods can’t remove a significant sag; fixing it properly can mean digging up that section.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: ask the scope technician to describe its depth and length, then get a repair quote.' },
    whoChecksIt: 'A plumber or sewer-scope specialist',
    askYourInspector: ['How deep and how long is the belly, and where is it along the line?', 'Can we get the scope video?'],
    askTheSeller: ['Any history of backups or repairs to the sewer line?'],
    guide: { href: '/guides/sewer-line-belly-found-inspection/', title: 'Found a sewer line belly during inspection?' },
  },
  {
    id: 'root-intrusion', name: 'Root intrusion in sewer line', category: 'Sewer & septic',
    aliases: ['root intrusion', 'roots in line', 'roots in sewer', 'tree roots in line', 'root infiltration', 'roots at joint', 'roots at joints'],
    meaning: 'Tree roots that have grown into the sewer pipe, usually through a joint or crack.',
    whyItMatters: [
      'Roots can catch debris and block the line, and the way they got in is a gap in the pipe.',
      'Clearing them treats the symptom; the joint or crack they came through is the underlying issue.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: get the scope video and a plumber’s view on repair versus ongoing clearing.' },
    whoChecksIt: 'A plumber or sewer-scope specialist',
    askYourInspector: ['Where along the line are the roots, and how much of the pipe do they block?'],
    askTheSeller: ['Has the line been cleared or repaired before, and how often?'],
    guide: { href: '/guides/sewer-scope-before-buying-house/', title: '4 things a sewer scope can reveal before you buy' },
  },
  {
    id: 'lead-service-line', name: 'Lead service line', category: 'Plumbing',
    aliases: ['lead service line', 'lead pipe', 'lead pipes', 'lead water line', 'lead line', 'lead service'],
    meaning: 'The water pipe running from the street main into the house is, or may be, made of lead.',
    whyItMatters: [
      'Water utilities keep a public inventory of service line materials by address, so you can look it up.',
      'Lead pipe is soft and gray, and a magnet won’t stick to it.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: check the utility’s inventory and ask about replacement programs.' },
    whoChecksIt: 'The water utility and a licensed plumber',
    askYourInspector: ['What did the pipe look like where it enters the house?'],
    askTheSeller: ['Has the service line ever been replaced, and do you have any record from the water utility?'],
    guide: { href: '/guides/lead-service-line-lookup-by-address/', title: 'Lead service line lookup: is the pipe to this house lead?' },
  },
  {
    id: 'septic', name: 'Septic system not inspected', category: 'Sewer & septic',
    aliases: ['septic', 'septic system', 'septic tank', 'septic not inspected', 'leach field', 'drain field', 'drainfield', 'absorption field', 'septic excluded'],
    meaning: 'A general home inspection doesn’t evaluate the buried septic tank or drain field.',
    whyItMatters: [
      'The tank’s condition and the drain field’s health need a separate inspection, usually with the tank uncovered and pumped.',
      'Septic repairs can be large, so this is worth doing inside your inspection period.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: book a septic inspection before your deadline.' },
    whoChecksIt: 'A licensed septic inspector or contractor',
    askYourInspector: ['Did you see any signs of septic problems, such as slow drains or wet areas in the yard?'],
    askTheSeller: ['When was the tank last pumped and inspected? Are there records, and do you know where the tank is?'],
    guide: { href: '/guides/home-inspection-include-septic-system/', title: 'Does a home inspection include the septic system?' },
  },
  {
    id: 'sump-pump', name: 'Sump pump issue', category: 'Plumbing',
    aliases: ['sump pump', 'sump', 'sump pit', 'sump pump inoperable', 'sump pump not working', 'no sump pump', 'sump discharge'],
    meaning: 'The pump in a basement or crawl-space pit that moves groundwater away from the foundation isn’t working, is missing, or discharges somewhere it shouldn’t.',
    whyItMatters: [
      'A failed sump pump can mean a wet basement.',
      'Water damage from a failed sump pump is often handled differently from other water damage by insurance, so ask about it.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate: usually a plumbing or waterproofing fix, plus questions about past water.' },
    whoChecksIt: 'A plumber or basement waterproofing contractor',
    askYourInspector: ['Did the pump run when tested, and where does it discharge?'],
    askTheSeller: ['Has the basement ever had water? How often does the pump run?'],
    guide: { href: '/guides/homeowners-insurance-cover-failed-sump-pump/', title: 'Does homeowners insurance cover a failed sump pump?' },
  },
  // ---------------------------------------------------------------- Foundation & structure
  {
    id: 'settlement-cracking', name: 'Typical settlement cracking', category: 'Foundation & structure',
    aliases: ['settlement cracking', 'typical settlement', 'typical settlement cracking', 'settlement cracks', 'minor settlement', 'hairline cracks', 'hairline crack', 'shrinkage cracks', 'shrinkage crack'],
    meaning: 'Small cracks the inspector considers normal for a house settling over time.',
    whyItMatters: [
      'They’re usually cosmetic. What matters is their direction, width, location and whether they’re growing.',
      'Cracks that are wide, horizontal, stair-stepped or offset deserve a closer look.',
    ],
    seriousness: { level: 'minor', text: 'Usually minor; keep an eye on them and photograph them for comparison.' },
    whoChecksIt: 'Your inspector; a structural engineer if anything looks beyond typical',
    askYourInspector: ['Which cracks did you mean, and did any look different from typical settlement?'],
    askTheSeller: ['Have the cracks changed over time, or been patched?'],
    guide: { href: '/guides/typical-settlement-cracking-mean-inspection-report/', title: 'What does “typical settlement cracking” mean?' },
  },
  {
    id: 'foundation-crack', name: 'Foundation crack: structural engineer recommended', category: 'Foundation & structure',
    aliases: ['foundation crack', 'foundation cracks', 'horizontal crack', 'stair step crack', 'stair-step crack', 'step crack', 'structural engineer', 'recommend structural engineer', 'further evaluation by a structural engineer', 'bowing wall', 'bowed wall', 'bowing foundation wall'],
    meaning: 'The inspector saw a crack or movement that goes beyond typical settlement and wants a structural engineer to evaluate it.',
    whyItMatters: [
      'Crack direction and offset matter: horizontal, stair-step or displaced cracks can point to soil or water pressure on the foundation.',
      'An engineer’s report tells you whether it needs repair, what kind, and whether it’s still moving.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate before your deadline: book the engineer early, as they can be busy.' },
    whoChecksIt: 'A licensed structural engineer',
    askYourInspector: ['Exactly where, which direction, and was there any offset or bowing?'],
    askTheSeller: ['Has the foundation ever been evaluated or repaired? Are there reports or warranties?'],
    guide: { href: '/guides/when-foundation-crack-need-structural-engineer/', title: 'When does a foundation crack need a structural engineer?' },
  },
  {
    id: 'foundation-repair', name: 'Previous foundation repair', category: 'Foundation & structure',
    aliases: ['foundation repair', 'previous foundation repair', 'foundation piers', 'piering', 'underpinning', 'helical piers', 'push piers', 'wall anchors', 'foundation stabilization'],
    meaning: 'The foundation has already been repaired, for example with piers, underpinning or wall anchors.',
    whyItMatters: [
      'A good repair can be a plus, if it was done by a licensed contractor, is documented, and the warranty transfers to you.',
      'Signs of new movement after a repair are what to watch for.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: get the paperwork and, ideally, an independent engineer’s opinion.' },
    whoChecksIt: 'A licensed structural engineer',
    askYourInspector: ['Did you see any signs of movement since the repair?'],
    askTheSeller: ['Who did the repair, when, with what permit, and does the warranty transfer to a new owner?'],
    guide: { href: '/guides/should-buy-house-s-already-had-foundation-repair/', title: 'Should you buy a house that’s already had foundation repair?' },
  },
  {
    id: 'prior-repair', name: 'Evidence of prior repair', category: 'Report wording',
    aliases: ['evidence of prior repair', 'evidence of previous repair', 'prior repair', 'previous repair', 'signs of repair', 'evidence of patching', 'previously repaired'],
    meaning: 'The inspector saw signs that something was fixed or patched before, without being able to say whether the underlying problem was solved.',
    whyItMatters: [
      'The question is whether the cause was fixed or only covered up.',
      'Records, permits and the contractor’s scope of work are what answer it.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: ask for the paperwork, and a specialist if it’s structural, roof or water related.' },
    whoChecksIt: 'The specialist for that system',
    askYourInspector: ['What was repaired, where, and did it look professionally done?'],
    askTheSeller: ['What was the original problem, who fixed it, and are there receipts or permits?'],
    guide: { href: '/guides/evidence-prior-repair-mean-home-inspection-report/', title: 'What does “evidence of prior repair” mean?' },
  },
  // ---------------------------------------------------------------- Roof & exterior
  {
    id: 'roof-end-of-life', name: 'Roof near the end of its life', category: 'Roof & exterior',
    aliases: ['roof near end of life', 'roof at end of life', 'roof at end of useful life', 'aging roof', 'older roof', 'roof remaining life', 'granule loss', 'curling shingles', 'curled shingles', 'worn shingles'],
    meaning: 'The roof shows wear suggesting it will need replacing in the coming years.',
    whyItMatters: [
      'Roof age affects replacement timing, and roof age and condition can come up with insurers.',
      'Records like a re-roofing permit, invoice and warranty pin the age down better than appearance.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate: get a roofer’s remaining-life estimate and a replacement quote.' },
    whoChecksIt: 'A licensed roofer',
    askYourInspector: ['Can you give a remaining-life estimate in writing? How many layers are there?'],
    askTheSeller: ['When was the roof replaced? Is there a permit, invoice or transferable warranty?'],
    guide: { href: '/guides/how-to-tell-how-old-a-roof-is/', title: 'How to tell how old a roof is before you make an offer' },
  },
  {
    id: 'flat-roof', name: 'Flat or low-slope roof ponding', category: 'Roof & exterior',
    aliases: ['flat roof', 'low slope roof', 'low-slope roof', 'ponding', 'ponding water', 'standing water on roof', 'membrane roof', 'seam separation'],
    meaning: 'A flat or nearly flat roof where water collects or the seams show wear.',
    whyItMatters: [
      'Low-slope roofs depend on drainage and sound seams; standing water speeds up wear and leaks.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate: have a roofer check drainage, seams and remaining life.' },
    whoChecksIt: 'A licensed roofer',
    askYourInspector: ['Where does water pond, and did you see any leaks or stains inside?'],
    askTheSeller: ['How old is the roof membrane, and has it leaked or been patched?'],
    guide: { href: '/guides/get-home-insurance-flat-roof/', title: 'Flat roof home insurance: what underwriters require' },
  },
  {
    id: 'eifs', name: 'EIFS (synthetic stucco)', category: 'Roof & exterior',
    aliases: ['eifs', 'e.i.f.s', 'synthetic stucco', 'exterior insulation and finish system', 'dryvit', 'foam stucco'],
    meaning: 'A foam-backed exterior finish that looks like stucco. “Dryvit” is a manufacturer name often linked to it.',
    whyItMatters: [
      'The concern is water getting behind it, which a visual inspection can’t see.',
      'A specialist moisture survey inside your inspection period is the usual next step.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: confirm it’s EIFS, then book a specialist moisture survey.' },
    whoChecksIt: 'A specialist EIFS / stucco inspector',
    askYourInspector: ['How did you identify it as EIFS? Any stains, cracks or soft spots near windows?'],
    askTheSeller: ['Has the exterior ever been tested for moisture or repaired? Are there reports?'],
    guide: { href: '/guides/buy-house-with-eifs-stucco/', title: 'Should you buy a house with EIFS? What to check first' },
  },
  {
    id: 'stucco-cracks', name: 'Stucco cracks or patches', category: 'Roof & exterior',
    aliases: ['stucco crack', 'stucco cracks', 'stucco cracking', 'stucco patch', 'stucco patches', 'stucco repair', 'stucco damage', 'hollow stucco', 'bulging stucco'],
    meaning: 'Cracks or repair patches in the stucco on the outside of the house.',
    whyItMatters: [
      'Hairline cracks are usually minor. Most stucco damage starts with water, so the cause matters more than the patch.',
      'Bulges, hollow-sounding areas or patches beside windows and rooflines deserve a specialist.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate if there are bulges, hollow spots or patches near openings; otherwise monitor.' },
    whoChecksIt: 'A stucco specialist',
    askYourInspector: ['Is it traditional stucco or EIFS, and where are the cracks or patches?'],
    askTheSeller: ['What caused the damage that was patched, and was the cause fixed?'],
    guide: { href: '/guides/stucco-repair-before-buying-house/', title: 'Stucco repair on a house you’re buying: patch or red flag?' },
  },
  {
    id: 'unpermitted-deck', name: 'Unpermitted deck', category: 'Roof & exterior',
    aliases: ['unpermitted deck', 'deck without permit', 'deck not permitted', 'ledger board', 'deck ledger', 'improper ledger', 'deck attachment', 'missing flashing at ledger'],
    meaning: 'A deck with no permit on file, or one whose attachment to the house looks wrong.',
    whyItMatters: [
      'Some small, low, detached decks don’t need a permit at all, so check that first.',
      'For those that do, guards, stairs and how the deck is attached to the house are what matter most.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate; treat loose guards, stairs or attachment as safety items.' },
    whoChecksIt: 'The building department, and a contractor or engineer',
    askYourInspector: ['How is the deck attached to the house, and were the guards and stairs sound?'],
    askTheSeller: ['Who built the deck, when, and was it permitted?'],
    guide: { href: '/guides/buying-house-unpermitted-deck-before-closing/', title: 'Buying a house with an unpermitted deck?' },
  },
  // ---------------------------------------------------------------- Environmental
  {
    id: 'radon', name: 'Radon test result', category: 'Environmental',
    aliases: ['elevated radon', 'high radon', 'radon level', 'radon levels', 'radon mitigation', 'radon above action level', 'radon result'],
    meaning: 'Radon is a natural radioactive gas you can’t see or smell. The report mentions a radon test or result. If the result is at or above the level where fixing it is recommended, the steps below apply.',
    whyItMatters: [
      'High radon is fixable: a mitigation system lowers it, and a follow-up test confirms it worked.',
      'Buyers commonly ask the seller to install a system before closing, or for a credit.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate and negotiate: get a mitigation quote, then a retest after installation.' },
    whoChecksIt: 'A certified radon mitigation professional',
    askYourInspector: ['What was the result, how long did the test run, and were the test conditions followed?'],
    askTheSeller: ['Has the house been tested or mitigated before? Would you install a system or credit the cost?'],
    guide: { href: '/guides/negotiate-radon-mitigation-after-inspection/', title: 'Can you negotiate radon mitigation after inspection?' },
  },
  {
    id: 'mold', name: 'Possible mold / microbial growth', category: 'Environmental',
    aliases: ['mold', 'mould', 'microbial growth', 'possible mold', 'suspected mold', 'mildew', 'organic growth', 'fungal growth'],
    meaning: 'The inspector saw something that may be mold, or signs of moisture where mold could grow. A visual inspection can’t confirm what it is or see inside walls.',
    whyItMatters: [
      'Mold follows moisture, so finding and fixing the water source matters most.',
      'Testing and hidden-area checks need a mold specialist.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: find the moisture source first, then a specialist if the area is significant.' },
    whoChecksIt: 'A mold assessment specialist (and a plumber or roofer for the water source)',
    askYourInspector: ['Where, how large an area, and was there active moisture?'],
    askTheSeller: ['Have there been leaks or water damage, and how were they repaired?'],
    guide: { href: '/guides/home-inspection-check-mold-behind-walls/', title: 'Does a home inspection check for mold behind walls?' },
  },
  {
    id: 'asbestos', name: 'Suspected asbestos', category: 'Environmental',
    aliases: ['asbestos', 'suspected asbestos', 'possible asbestos', 'acm', 'asbestos containing material', 'vermiculite', 'popcorn ceiling', 'asbestos tape', 'asbestos wrap'],
    meaning: 'The inspector saw a material that may contain asbestos. A home inspection doesn’t test for it.',
    whyItMatters: [
      'Only a lab test of a sample can confirm asbestos.',
      'Materials in good condition are usually left undisturbed; the risk comes from damage or renovation.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate if you plan renovations or the material is damaged: get it tested before disturbing it.' },
    whoChecksIt: 'A licensed asbestos inspector',
    askYourInspector: ['Which materials, where, and in what condition?'],
    askTheSeller: ['Has any material been tested or removed? Are there records?'],
    guide: { href: '/guides/standard-home-inspection-check-asbestos/', title: 'Does a standard home inspection check for asbestos?' },
  },
  {
    id: 'oil-tank', name: 'Possible underground oil tank', category: 'Environmental',
    aliases: ['oil tank', 'underground oil tank', 'buried oil tank', 'ust', 'underground storage tank', 'oil fill pipe', 'oil tank fill pipe', 'abandoned oil lines', 'oil supply lines'],
    meaning: 'Signs such as a fill pipe, vent pipe or old supply lines suggest there may be, or may have been, a buried heating oil tank.',
    whyItMatters: [
      'A general inspection doesn’t look for buried tanks. A tank sweep by an environmental professional does.',
      'A leaking tank can mean soil cleanup, so find out before you close.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: book a tank sweep inside your inspection period.' },
    whoChecksIt: 'An environmental tank-sweep professional',
    askYourInspector: ['What did you see, where, and does anything look connected or recently capped?'],
    askTheSeller: ['Was the house ever heated with oil? Was a tank removed or closed in place, with paperwork?'],
    guide: { href: '/guides/home-inspection-check-underground-oil-tanks/', title: 'Does a home inspection check for underground oil tanks?' },
  },
  // ---------------------------------------------------------------- Pests
  {
    id: 'termites-wdo', name: 'Termites or wood-destroying insects (WDO)', category: 'Pests',
    aliases: ['termite', 'termites', 'wdo', 'wdi', 'wood destroying organism', 'wood destroying organisms', 'wood destroying insect', 'wood destroying insects', 'mud tubes', 'frass', 'carpenter ants', 'wood boring beetles', 'wdo report'],
    meaning: 'Evidence of termites or other wood-destroying insects or decay, active or in the past. A WDO report is the specialised inspection that documents it.',
    whyItMatters: [
      'Active infestation usually means treatment by a licensed pest professional, and some loan programs look for a clear WDO report.',
      'Past damage may need a contractor or engineer to check the wood that was eaten.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: a licensed pest inspection, and a repair assessment if there’s damage.' },
    whoChecksIt: 'A licensed pest control / WDO inspector',
    askYourInspector: ['Was it active or old activity, and where? Any visible damage to wood?'],
    askTheSeller: ['Has the house been treated before? Is there a transferable treatment warranty?'],
    guide: { href: '/guides/wdo-report-who-supposed-order/', title: 'What is a WDO report and who is supposed to order it?' },
  },
  // ---------------------------------------------------------------- Heating & cooling
  {
    id: 'hvac-age', name: 'HVAC near or past its expected life', category: 'Heating & cooling',
    aliases: ['hvac at end of life', 'hvac near end of life', 'furnace at end of life', 'furnace near end of life', 'ac at end of life', 'air conditioner at end of life', 'older hvac', 'aging furnace', 'aging hvac', 'aging air conditioner', 'r22', 'r-22'],
    meaning: 'The heating or cooling equipment is older and may be nearing replacement.',
    whyItMatters: [
      'Age, maintenance history and refrigerant type all affect how long it will keep running and what repairs cost.',
      'The age is usually on the unit’s data plate.',
    ],
    seriousness: { level: 'minor', text: 'Usually not urgent, but worth budgeting for and getting a service check.' },
    whoChecksIt: 'A licensed HVAC technician',
    askYourInspector: ['How old are the units, and did both heating and cooling run normally?'],
    askTheSeller: ['Are there service records? When were the units installed?'],
    guide: { href: '/guides/hvac-techs-wish-buyers-knew-about-system-age/', title: 'HVAC age and lifespan: what AC techs wish buyers knew' },
  },
  {
    id: 'wood-stove', name: 'Wood stove', category: 'Heating & cooling',
    aliases: ['wood stove', 'woodstove', 'wood burning stove', 'wood burner', 'pellet stove', 'stove clearance', 'clearance to combustibles'],
    meaning: 'A wood or pellet stove, sometimes with questions about its installation or clearances.',
    whyItMatters: [
      'Whether it was professionally installed or approved locally can matter, including to insurers.',
      'The chimney or flue should be checked too.',
      ASK_INSURER,
    ],
    seriousness: { level: 'investigate', text: 'Investigate: a chimney sweep or installer can confirm the installation and clearances.' },
    whoChecksIt: 'A certified chimney sweep or stove installer',
    askYourInspector: ['Did the clearances and chimney or flue look correct?'],
    askTheSeller: ['Who installed it, and was it permitted or inspected?'],
    guide: { href: '/guides/home-insurance-with-wood-stove/', title: 'Can you get home insurance with a wood stove?' },
  },
  // ---------------------------------------------------------------- Report wording
  {
    id: 'not-inspected-storage', name: 'Not inspected due to storage / limited access', category: 'Report wording',
    aliases: ['not inspected due to storage', 'not inspected', 'limited access', 'access restricted', 'restricted access', 'inaccessible', 'blocked by storage', 'personal belongings', 'not accessible', 'could not access'],
    meaning: 'Belongings or obstructions blocked part of the house, so the inspector couldn’t look at it.',
    whyItMatters: [
      'Anything not inspected is unknown, not fine.',
      'Buyers commonly ask the seller to clear the area so the inspector can come back before the deadline.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: ask for access and a return visit inside your inspection period.' },
    whoChecksIt: 'Your inspector, on a return visit',
    askYourInspector: ['Exactly which areas or systems weren’t inspected, and what would a return visit cost?'],
    askTheSeller: ['Can you clear those areas so the inspector can come back before the deadline?'],
    guide: { href: '/guides/not-inspected-due-storage-mean-inspection-report/', title: 'What does “not inspected due to storage” mean?' },
  },
  {
    id: 'amateur-workmanship', name: 'Amateur workmanship', category: 'Report wording',
    aliases: ['amateur workmanship', 'amateur work', 'amateur installation', 'unprofessional', 'unprofessional workmanship', 'unworkmanlike', 'non professional', 'nonprofessional', 'diy', 'do it yourself', 'handyman', 'poor workmanship', 'not professionally installed', 'improperly installed'],
    meaning: 'The inspector’s way of saying something was installed or repaired without following normal trade practice. It’s deliberately general: a visual inspection can’t open walls or declare a code violation.',
    whyItMatters: [
      'The item named may be small, but it can be a clue that other work in the house was done the same way, including work you can’t see.',
      'It often points to work done without a permit, which is worth checking against the property’s permit history.',
    ],
    seriousness: { level: 'investigate', text: 'A signal to investigate. How serious it is depends entirely on what and where.' },
    whoChecksIt: 'The licensed specialist for that system: electrician, plumber, or structural engineer',
    askYourInspector: ['What exactly did you see, and where? Which system is it: electrical, plumbing, structural or HVAC?', 'Did you see signs of similar work elsewhere that you couldn’t fully inspect?'],
    askTheSeller: ['Who did this work, when, and was it permitted? Are there receipts or permit records?'],
    guide: { href: '/guides/amateur-workmanship-mean-home-inspection-report/', title: 'What does “amateur workmanship” mean? Warning signs' },
  },
  {
    id: 'unpermitted-work', name: 'Unpermitted work or addition', category: 'Report wording',
    aliases: ['unpermitted', 'unpermitted work', 'unpermitted addition', 'without permit', 'without a permit', 'no permit', 'not permitted', 'permit not found', 'garage conversion', 'converted garage', 'finished basement without permit'],
    meaning: 'Work that may have needed a permit doesn’t appear to have one, such as an addition, a converted garage or a finished basement.',
    whyItMatters: [
      'Some work never needed a permit, so check that first.',
      'If it did, the problem passes to whoever owns the house, so settle it before closing: a permit after the fact, a credit, or walking away.',
    ],
    seriousness: { level: 'investigate', text: 'Investigate: check the permit history and ask the building department what it would take.' },
    whoChecksIt: 'The local building department',
    askYourInspector: ['What work looked newer than the rest of the house or non-standard?'],
    askTheSeller: ['Who did the work, when, and was it permitted? Are there records?'],
    guide: { href: '/guides/find-unpermitted-work-before-buying/', title: 'Buying a house with unpermitted work: what you take on' },
  },
];

/** Normalises text for matching: lower-case, punctuation to spaces, single spaces, padded so ' alias ' is a word match. */
export function normaliseForMatch(s: string): string {
  return ` ${s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

// A mention right after a negation ("no visible mold observed", "without GFCI") is not a finding. Plain word logic:
// if any of the three words before a match is a negation, that occurrence is skipped. Aliases that themselves
// contain the negation ("no gfci", "not inspected") still match, because the check looks BEFORE the alias.
const NEGATIONS = new Set(['no', 'not', 'without', 'none', 'never']);

function matchesWithoutNegation(hay: string, alias: string): boolean {
  const needle = normaliseForMatch(alias);
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + 1)) {
    const before = hay.slice(0, i).trim().split(' ').slice(-3);
    if (!before.some((w) => NEGATIONS.has(w))) return true;
  }
  return false;
}

/** Terms whose name or any alias appears in the text as whole words, not right after a negation. Plain matching -- no AI. */
export function findTermsInText(text: string): DecoderTerm[] {
  const hay = normaliseForMatch(text);
  return DECODER_TERMS.filter((t) => [t.name, ...t.aliases].some((a) => matchesWithoutNegation(hay, a)));
}
