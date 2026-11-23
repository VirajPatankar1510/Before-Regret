// Two recognition pages under /research/, published 2026-11-23 (owner: "publish the awards and
// permit pages"):
//
//   /research/permit-search-done-right/  big-city permit portals that pass a buyer's test
//   /research/explainer-awards/          the clearest trade explanations of old-house defects
//
// Both are written by hand, not generated, because every line is a judgement about a named public
// body or business and has to be exactly true. The rules they follow (marketing/*-2026-11.md):
//   - only winners and passing cities are named; a city we could not test is "not tested", never
//     failing, and a business that did not win is never named;
//   - every claim was checked on the date printed beside it;
//   - no logos, no personal names copied from a portal, short quotes only.
//
// The permit page's city list is cross-checked against data/permit-portal-recognition/2026-11-tests.json
// at build time, so the page cannot name a city in a tier the test file does not support.
import fs from 'node:fs';
import path from 'node:path';

export const RECOGNITION_PUBLISHED = '2026-11-23';
const PUBLISHED_VISIBLE = '23 November 2026';
const BASE = 'https://www.beforeregret.com';

export interface RecognitionPage {
  slug: string;
  url: string;
  title: string;
  description: string;
  cardTitle: string;
  standfirst: string;
  finding: string;
  body: string;
  ld: unknown[];
  footer: { heading: string; links: Array<{ href: string; text: string; external?: boolean }> };
}

export const RECOGNITION_CSS = `
.rec-head{padding:72px 0 36px}
.rec-head h1{font-size:clamp(2.6rem,7vw,4.6rem)}
.rec-head .standfirst{margin-top:.8em}
.rec-list{display:grid;grid-template-columns:1fr;gap:0;margin-top:1.4em}
.rec-item{padding:22px 0;border-top:1px solid var(--rule)}
.rec-item h3{font-family:var(--serif);font-size:1.25rem;letter-spacing:0;text-transform:none;color:var(--ink);font-weight:600}
.rec-item .rec-by{font-family:var(--mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:.35em}
.rec-item p+p,.rec-item .rec-by+p{margin-top:.7em}
.rec-item ul{margin:.7em 0 0;padding-left:1.2em}
.rec-item li{margin:.3em 0}
.rec-meta{font-family:var(--mono);font-size:.74rem;color:var(--muted);line-height:1.6}
.rec-note{background:var(--panel);border:1px solid var(--rule);padding:14px 16px;font-size:.95rem}
.spine a{color:var(--ink);text-decoration-color:var(--price);text-underline-offset:3px}
.spine ol,.spine ul{padding-left:1.3em}
.spine li{margin:.35em 0}
`;

function article(p: { url: string; headline: string; description: string; about: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.headline,
    description: p.description,
    url: p.url,
    mainEntityOfPage: p.url,
    datePublished: RECOGNITION_PUBLISHED,
    dateModified: RECOGNITION_PUBLISHED,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    about: p.about,
    author: { '@type': 'Organization', name: 'Before Regret', url: `${BASE}/` },
    publisher: { '@id': `${BASE}/#organization` },
  };
}

function breadcrumb(name: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Before Regret', item: `${BASE}/` },
      { '@type': 'ListItem', position: 2, name: 'Research', item: `${BASE}/research/` },
      { '@type': 'ListItem', position: 3, name, item: url },
    ],
  };
}

// ---- Permit search done right ------------------------------------------------------------------

interface CityRow { city: string; portal: string; href: string; address: string; found: string; checked: string; tier: 'done-right' | 'passes-core' }

const CITY_ROWS: CityRow[] = [
  { city: 'Philadelphia', tier: 'done-right', portal: 'Atlas', href: 'https://atlas.phila.gov/',
    address: 'City Hall, 1400 John F Kennedy Blvd',
    found: '251 permits, 36 inspections marked passed or failed, and 59 violations, all on one screen. Permits at that address go back to 2007.',
    checked: '2026-11-23' },
  { city: 'Phoenix', tier: 'done-right', portal: 'PDD Online Permits Search', href: 'https://apps-secure.phoenix.gov/PDD/Search/Permits',
    address: 'City Hall, 200 W Washington St',
    found: '915 records going back to December 1993. Every permit has an inspection history with the result of each inspection: we opened a 1994 electrical permit and its final inspection is marked PASS.',
    checked: '2026-11-23' },
  { city: 'Columbus', tier: 'done-right', portal: 'Columbus Online Portal, Building', href: 'https://portal.columbus.gov/permits/Cap/CapHome.aspx?module=Building&TabName=Building',
    address: 'City Hall, 90 W Broad St',
    found: 'More than 100 records, each described in plain words rather than a permit code. Completed inspections show their result, for example &ldquo;MEP Final Approved - Complete&rdquo;.',
    checked: '2026-11-23' },
  { city: 'Austin', tier: 'passes-core', portal: 'Austin Build + Connect', href: 'https://abc.austintexas.gov/citizenportal/app/public-search',
    address: 'City Hall, 301 W 2nd St', found: '661 records, with building permits back to 1980.', checked: '2026-11-18' },
  { city: 'Dallas', tier: 'passes-core', portal: 'DallasNow', href: 'https://aca-prod.accela.com/DALLASTX/Cap/CapHome.aspx?module=Building&TabName=Building',
    address: 'City Hall, 1500 Marilla St', found: 'More than 100 records, back to 2009 or earlier.', checked: '2026-11-23' },
  { city: 'San Antonio', tier: 'passes-core', portal: 'Accela Citizen Access', href: 'https://aca-prod.accela.com/COSA/Cap/CapHome.aspx?module=Building&TabName=Building',
    address: 'City Hall, 100 Military Plaza', found: '22 records, back to 2013. The inspections tab on each record is public.', checked: '2026-11-23' },
  { city: 'San Diego', tier: 'passes-core', portal: 'Accela Citizen Access', href: 'https://aca-prod.accela.com/SANDIEGO/Cap/CapHome.aspx?module=DSD&TabName=DSD',
    address: 'City Administration Building, 202 C St', found: '59 records, back to 2019 in this system.', checked: '2026-11-23' },
  // 200 Texas St is deliberately not called City Hall: we did not confirm it is the current one.
  { city: 'Fort Worth', tier: 'passes-core', portal: 'Accela Citizen Access', href: 'https://aca-prod.accela.com/CFW/Cap/CapHome.aspx?module=Development&TabName=Development',
    address: '200 Texas St', found: 'More than 100 records at the address.', checked: '2026-11-23' },
];

function checkCityRowsAgainstTests(): void {
  const file = path.join(process.cwd(), 'data', 'permit-portal-recognition', '2026-11-tests.json');
  const tests = JSON.parse(fs.readFileSync(file, 'utf8')) as { results: Array<{ city: string; tier: string; url?: string; checkedOn?: string }> };
  const problems: string[] = [];
  for (const row of CITY_ROWS) {
    const t = tests.results.find((r) => r.city === row.city);
    if (!t) { problems.push(`${row.city}: not in the test file`); continue; }
    if (t.tier !== row.tier) problems.push(`${row.city}: page says ${row.tier}, test file says ${t.tier}`);
    if (t.url !== row.href) problems.push(`${row.city}: portal link differs from the test file`);
    if (!String(t.checkedOn ?? '').includes(row.checked)) problems.push(`${row.city}: checked ${row.checked} is not in the test file (${t.checkedOn})`);
  }
  for (const t of tests.results) {
    if ((t.tier === 'done-right' || t.tier === 'passes-core') && !CITY_ROWS.some((r) => r.city === t.city)) {
      problems.push(`${t.city}: passes in the test file but is missing from the page`);
    }
  }
  if (CITY_ROWS.some((r) => r.city === 'Fort Worth' && /city hall/i.test(r.address))) problems.push('Fort Worth must not be called City Hall');
  if (problems.length) throw new Error(`[recognition] permit page disagrees with its test file:\n  ${problems.join('\n  ')}`);
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function cityCard(r: CityRow): string {
  return `
      <div class="rec-item">
        <h3>${r.city}</h3>
        <p class="rec-by"><a href="${r.href}" rel="noopener">${r.portal}</a> &#183; tested at ${r.address}</p>
        <p>${r.found}</p>
        <p class="rec-meta">Checked ${fmtDate(r.checked)}</p>
      </div>`;
}

function permitPage(): RecognitionPage {
  checkCityRowsAgainstTests();
  const slug = 'permit-search-done-right';
  const url = `${BASE}/research/${slug}/`;
  const title = 'Permit Search Done Right: Big-City Portals We Tested';
  const description = "Big-city permit portals tested the way a home buyer would use them. These let anyone look up a building's permits by street address.";
  const doneRight = CITY_ROWS.filter((r) => r.tier === 'done-right');
  const basics = CITY_ROWS.filter((r) => r.tier === 'passes-core');

  const body = `<div class="wrap">
  <header class="rec-head">
    <p class="kicker">Published ${PUBLISHED_VISIBLE}</p>
    <h1>Permit search done right</h1>
    <p class="standfirst">Big-city permit portals that let anyone look up a building&#8217;s permits by street address, with no account.</p>
  </header>

  <section>
    <div class="spine stack">
      <p>Before you buy a house, you can usually look up its permits yourself: the work that was approved, when it was done and whether it passed inspection. Whether that takes two minutes or an afternoon depends on the city.</p>
      <p>In November 2026 we tried the permit search of the largest US cities the way a buyer would: no account, just a street address. We used a public building&#8217;s address in each city, usually City Hall, so anyone can repeat the test.</p>
      <h3 style="margin-top:2em">The tests</h3>
      <ol>
        <li><b>No account.</b> The search works without registering, logging in or accepting a click-through agreement.</li>
        <li><b>Search by street address.</b></li>
        <li><b>It finds the building.</b> Searching a public building&#8217;s address returns that building&#8217;s permits.</li>
        <li><b>Inspection results are visible.</b> A completed inspection shows whether it passed.</li>
      </ol>
      <p>Tests 1 to 3 are the basics. Test 4 is what turns a permit list into an answer: a permit that was opened is not the same as work that passed.</p>
    </div>
  </section>

  <section>
    <div class="spine">
      <h2>Permit search done right</h2>
      <p style="margin-top:.8em">These ${doneRight.length === 3 ? 'three' : doneRight.length} passed all four tests.</p>
      <div class="rec-list">${doneRight.map(cityCard).join('')}
      </div>
      <div class="stack" style="margin-top:1.6em">
        <h3>What made them good</h3>
        <ul>
          <li><b>Philadelphia:</b> one search box gives permits, inspections and violations for the address, on one screen.</li>
          <li><b>Phoenix:</b> the inspection history goes back decades, with the result of every inspection.</li>
          <li><b>Columbus:</b> the descriptions say what the work was in words a buyer can read, not just a permit code.</li>
        </ul>
        <p class="rec-note"><b>One tip for Phoenix and Columbus:</b> the start date is pre-filled (the last 30 days in Phoenix, 3 years in Columbus). Change it to an early year before you search, or older permits won&#8217;t show.</p>
      </div>
    </div>
  </section>

  <section>
    <div class="spine">
      <h2>Also passes the basics</h2>
      <p style="margin-top:.8em">These pass tests 1 to 3.</p>
      <div class="rec-list">${basics.map(cityCard).join('')}
      </div>
    </div>
  </section>

  <section>
    <div class="spine stack">
      <h2>What to do with what you find</h2>
      <p>A permit that was issued but never closed can follow the house to its next owner. If a search turns one up on a house you&#8217;re buying, our guide to <a href="/guides/resolve-open-building-permits-before-closing/">resolving open building permits before closing</a> walks through who fixes it and when. If the permit history is thin for the work you can see, that&#8217;s the question our guide on <a href="/guides/find-unpermitted-work-before-buying/">finding unpermitted work before buying</a> answers.</p>
    </div>
  </section>

  <section>
    <div class="spine stack">
      <h2>How we checked this</h2>
      <p>We started from the largest US cities in the Census Bureau&#8217;s Vintage 2025 population estimates. Every search was run with no account, in an ordinary browser, on the date shown beside each city. A count like &ldquo;more than 100&rdquo; is the portal&#8217;s own cap on the list. &ldquo;Back to&rdquo; means the oldest record that search returned at that address, not the oldest record the city holds.</p>
      <p>Portals change, so we re-test and update the dates. If your city&#8217;s search works differently from what we describe, tell us at <a href="mailto:hello@beforeregret.com">hello@beforeregret.com</a> and we&#8217;ll re-test it.</p>
    </div>
  </section>
</div>`;

  return {
    slug, url, title, description,
    cardTitle: 'Permit Search Done Right',
    standfirst: 'Which big-city permit portals let anyone look up a building by street address, with no account.',
    finding: 'Philadelphia, Phoenix and Columbus passed every test, including showing whether each inspection passed. Five more pass the basics.',
    body,
    ld: [
      article({ url, headline: 'Permit search done right', description, about: 'Public building permit search portals in the largest US cities' }),
      breadcrumb('Permit search done right', url),
    ],
    footer: {
      heading: 'This page',
      links: [
        { href: 'https://www.census.gov/programs-surveys/popest.html', text: 'Census population estimates', external: true },
        { href: '/research/explainer-awards/', text: 'Explainer Awards' },
        { href: '/support/', text: 'Corrections &amp; questions' },
      ],
    },
  };
}

// ---- Explainer Awards --------------------------------------------------------------------------

interface Award {
  category: string; winner: string; place: string; postTitle: string; href: string;
  read: string; text: string; apart: string; checkedAgainst: string; note?: string;
  ours: Array<{ href: string; text: string }>;
}

const AWARDS: Award[] = [
  {
    category: 'Double-tapped circuit breakers', winner: 'Structure Tech Home Inspections', place: 'Minneapolis',
    postTitle: 'How to fix double-tapped circuit breakers', href: 'https://structuretech.com/double-tapped-circuit-breakers/',
    read: 'We read 2 explanations from trade businesses.',
    text: 'It explains that two wires under one screw is fine on a breaker built for it, and shows you the label that tells you which kind you have. It is clear that the problem is the physical connection, not the load on the circuit, and it opens by calling the issue &ldquo;a pretty minor issue&rdquo; that is usually a simple fix.',
    apart: 'It catches the case most explanations miss. When the second wire is a whole basement bedroom added onto the bathroom receptacle circuit, a quick pigtail isn&#8217;t the fix: the circuits have to be split, because the bathroom circuit can&#8217;t serve other rooms.',
    checkedAgainst: 'Schneider Electric&#8217;s QO breaker FAQ FA97891; IRC 2021 E3406.10 (NEC 110.14(A)) and E3703.4.',
    ours: [{ href: '/guides/double-tapped-breaker-did-inspector-flag/', text: 'what it means when an inspector flags a double tap' }],
  },
  {
    category: 'Aluminum wiring', winner: 'Super Fast Electric', place: 'Orlando',
    postTitle: 'Aluminum Wiring vs Copper: Safety Risks and Upgrade Options', href: 'https://www.superfastelectric.com/resources/guides/aluminum-wiring-vs-copper-wiring',
    read: 'We read 4 explanations.',
    text: 'It quotes the Consumer Product Safety Commission&#8217;s finding accurately, lists exactly the three permanent repairs the CPSC accepts (copper rewiring, COPALUM crimps, and AlumiConn connectors as the alternative), and says plainly that swapping outlets for &ldquo;aluminum-rated&rdquo; ones is not a permanent fix.',
    apart: 'It speaks from its own jobs: the ranch and split-level houses built between 1967 and 1972 that its electricians see most across Orange, Seminole and Osceola counties, and the homeowners who were told an outlet swap would do. It explains why it won&#8217;t: the swap leaves the splices and the panel connections untouched.',
    checkedAgainst: 'CPSC Publication 516, &ldquo;Repairing Aluminum Wiring&rdquo;.',
    note: 'One thing we&#8217;d add for buyers: where the guide suggests opening the panel cover yourself, leave that step to the electrician.',
    ours: [{ href: '/guides/aluminum-wiring-repair-cost-before-closing/', text: 'what an aluminum wiring repair costs before closing' }],
  },
  {
    category: 'Polybutylene pipe', winner: 'Waypoint Property Inspection', place: 'Tampa',
    postTitle: 'What Is Polybutylene?', href: 'https://waypointinspection.com/blog/plumbing/what-is-polybutylene/',
    read: 'We read 2 explanations from trade businesses.',
    text: 'It tells you colour isn&#8217;t proof and the PB2110 marking on the pipe is, and it lists every place to look, from the laundry hookups and the water heater to the attic and the water meter. It is calm about the risk: there is no guarantee the pipe will fail, or when.',
    apart: 'Some houses were plumbed with copper stub-outs at the fixtures and polybutylene running inside the walls, so copper under the sink doesn&#8217;t clear the house. The post shows a photo of exactly that.',
    checkedAgainst: 'the Jana Laboratories / University of Illinois at Chicago paper on early polybutylene failures; 2021 IRC Table P2906.5.',
    ours: [{ href: '/guides/spot-polybutylene-pipes-before-buying-house/', text: 'how to spot polybutylene before you buy' }],
  },
  {
    category: 'Knob-and-tube wiring', winner: 'A+ Electric &amp; Plumbing', place: 'Los Angeles',
    postTitle: 'Knob and Tube Wiring: What Los Angeles Homeowners Should Know Before Escrow Closes', href: 'https://elecplumb.com/blog/knob-and-tube-wiring/',
    read: 'We read 3 explanations from trade businesses.',
    text: 'It explains why insulation packed around knob-and-tube matters, gets California&#8217;s exception right (a licensed electrician inspects and certifies the wiring first, and the local building department signs off), and lays out a staged plan instead of a panic: &ldquo;Not always tonight, but yes, on a plan.&rdquo;',
    apart: 'It warns that a decades-old remodel permit doesn&#8217;t tell you what&#8217;s live today. Plenty of houses had the kitchen and bath rewired while the bedrooms stayed on the original wiring, and only a tester on each circuit settles it. That is the exact trap a buyer reading a permit history falls into.',
    checkedAgainst: 'California Electrical Code 394.12 and its certification exception.',
    ours: [
      { href: '/guides/is-knob-and-tube-wiring-still-live/', text: 'how to tell if knob-and-tube is still live' },
      { href: '/guides/knob-and-tube-wiring-insulation/', text: 'the insulation rules state by state' },
    ],
  },
];

function awardCard(a: Award): string {
  const ours = a.ours.map((o) => `<a href="${o.href}">${o.text}</a>`).join(' and ');
  return `
  <section>
    <div class="spine stack">
      <h3>${a.category}</h3>
      <h2>${a.winner}, ${a.place}</h2>
      <p class="rec-meta">Winning post: <a href="${a.href}" rel="noopener">&ldquo;${a.postTitle}&rdquo;</a></p>
      <p>${a.text}</p>
      <p><b>What set it apart:</b> ${a.apart}</p>${a.note ? `
      <p class="rec-note">${a.note}</p>` : ''}
      <p><a href="${a.href}" rel="noopener">Read it</a></p>
      <p class="rec-meta">${a.read} Checked against ${a.checkedAgainst} Read ${PUBLISHED_VISIBLE}.</p>
      <p style="font-size:.95rem;color:var(--muted)">Our own guide on this: ${ours}.</p>
    </div>
  </section>`;
}

function awardsPage(): RecognitionPage {
  const slug = 'explainer-awards';
  const url = `${BASE}/research/explainer-awards/`;
  const title = 'Explainer Awards: The Clearest Trade Explanations';
  const description = 'We read what electricians and inspectors publish about old-house defects, checked each against the primary source, and named the clearest.';
  const body = `<div class="wrap">
  <header class="rec-head">
    <p class="kicker">Published ${PUBLISHED_VISIBLE} &#183; Round 1 &#183; ${AWARDS.length} defects</p>
    <h1>Explainer Awards</h1>
    <p class="standfirst">The clearest explanations of old-house defects, written by the trades who fix them and checked against the primary sources.</p>
  </header>

  <section>
    <div class="spine stack">
      <p>When a buyer searches a line from an inspection report, what they usually find is a contractor&#8217;s blog post. Some are excellent and some get the basics wrong. This page names the ones that got it right.</p>
      <p>For each defect we read what trade businesses have published and checked every claim against the primary source: the code section, the manufacturer&#8217;s documentation or the federal guidance. Then we name the clearest.</p>
    </div>
  </section>
${AWARDS.map(awardCard).join('\n')}

  <section>
    <div class="spine stack">
      <h2>How we judged</h2>
      <p>Each explanation was scored on five questions:</p>
      <ol>
        <li><b>Accurate:</b> does any claim contradict the primary source?</li>
        <li><b>Plain:</b> can a buyer with no trade background follow it?</li>
        <li><b>Says how to check:</b> does it tell the reader what to look for or what to ask?</li>
        <li><b>Calm:</b> does it explain the risk without selling fear?</li>
        <li><b>Shows real work:</b> does it use photos or observations from the writer&#8217;s own jobs?</li>
      </ol>
      <p>Only trade businesses that do the work can win: electricians, plumbers and inspectors. Lead-generation sites and directories can&#8217;t.</p>
      <p>We don&#8217;t accept payment or nominations, and winning has nothing to do with advertising. Corrections: <a href="mailto:hello@beforeregret.com">hello@beforeregret.com</a>.</p>
    </div>
  </section>
</div>`;

  return {
    slug, url, title, description,
    cardTitle: 'Explainer Awards',
    standfirst: 'The clearest explanations of old-house defects written by the trades who fix them, checked against the primary sources.',
    finding: `Round 1 names ${AWARDS.length} winners: ${AWARDS.map((a) => `${a.winner} (${a.category.toLowerCase()})`).join(', ')}.`,
    body,
    ld: [
      article({ url, headline: 'Explainer Awards', description, about: 'Trade explanations of old-house defects: double-tapped breakers, aluminum wiring, polybutylene pipe, knob-and-tube wiring' }),
      breadcrumb('Explainer Awards', url),
    ],
    footer: {
      heading: 'This page',
      links: [
        { href: '/research/permit-search-done-right/', text: 'Permit search done right' },
        { href: '/guides/', text: 'Our guides' },
        { href: '/support/', text: 'Corrections &amp; questions' },
      ],
    },
  };
}

export function recognitionPages(): RecognitionPage[] {
  const pages = [permitPage(), awardsPage()];
  for (const p of pages) {
    if (p.title.length > 60) throw new Error(`[recognition] ${p.slug} title is ${p.title.length} chars, over 60`);
    if (p.description.length < 70 || p.description.length > 155) throw new Error(`[recognition] ${p.slug} description is ${p.description.length} chars, budget 70-155`);
  }
  return pages;
}
