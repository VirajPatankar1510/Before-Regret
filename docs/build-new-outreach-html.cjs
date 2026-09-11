// Builds docs/new-outreach-emails.html -- the ten new desks, one card each, copy-button per field.
//
//   node docs/build-new-outreach-html.cjs
//
// Same shape as outreach-pack.html and local-outreach-pack.html, with one change: those pages put a
// single Copy button on the body, so the To line and the subject still had to be selected by hand.
// Every field here has its own button, because the failure this whole document exists to avoid is a
// mis-typed recipient.
//
// EVERY ADDRESS was read off the outlet's own published contact page on 2026-09-09 and is
// reproduced verbatim. Where an outlet publishes none, the card gives the form URL and no address,
// rather than a guess -- the rule adopted after a masthead address hard-bounced 550 5.4.1.
const fs = require('fs');
const path = require('path');

const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const SIGN = ['Best regards,', 'Viraj Patankar', 'Before Regret', 'hello@beforeregret.com'];

const EMAILS = [
  {
    n: 1, outlet: 'WESA 90.5', to: 'news@wesa.fm', study: 'Allegheny',
    beat: 'Pittsburgh NPR member station, news desk',
    why: 'Strongest local pitch in the set. The county figure is the story and it is theirs.',
    subject: 'Allegheny County had the third most severe weather of 100 large US counties, and one of the smallest shares paying over $3,000 to insure a home',
    body: [
      'Dear WESA news desk,', '',
      'I have finished a county-level analysis that puts Allegheny County in an unusual position, and the local number is the story rather than the national one.', '',
      'Across the 100 most populous US counties, using NOAA Storm Events for 2015-2024 and Census ACS table B25141 for what mortgaged households report actually paying:', '',
      '1,108 severe weather events recorded in Allegheny County over the decade, third highest of the 100. The median county recorded 285.',
      '58.8% of the county’s 206,078 mortgaged households report paying under $1,000 a year to insure the home, seventh highest share.',
      '2.9% report paying over $3,000, sixth lowest share of the hundred.', '',
      'The comparison that makes it land: Oklahoma County, Oklahoma recorded 864 severe weather events over the same decade, fewer than Allegheny, and 24.0% of its mortgaged households pay over $3,000. Allegheny records more weather and has a quarter as many households paying that much.', '',
      'One correction before it prints, because it is the sentence that gets away from this data: it does not say Pittsburgh has the cheapest home insurance in America. The ACS reports what households say they pay, in bands, with no published mean, so no county here has an average premium and none is calculated. What the data supports is a share, not a price.', '',
      'Study, method, limitations and the full 100-county CSV:',
      'https://www.beforeregret.com/research/allegheny-storm-premium/', '',
      'All of it is public federal data and the files are linked from the page.', '',
    ],
  },
  {
    n: 2, outlet: 'PublicSource', to: 'info@publicsource.org', study: 'Allegheny',
    beat: 'Pittsburgh nonprofit newsroom, accountability and data',
    why: 'Separate newsroom from WESA, so both can go the same day.',
    subject: 'County-level data on Pittsburgh home insurance: what 206,078 mortgaged households report paying',
    body: [
      'Dear PublicSource,', '',
      'Something for a data or accountability desk, with the caveat attached.', '',
      'I have analysed the 100 most populous US counties on three public federal sources: NOAA Storm Events 2015-2024, Census ACS table B25141, and the EPA radon map. Allegheny County comes out third for severe weather frequency, with 1,108 recorded events against a 100-county median of 285, while 58.8% of its 206,078 mortgaged households report paying under $1,000 a year to insure the home, and only 2.9% report paying over $3,000.', '',
      'The housing context matters for your readers specifically: 77.2% of the county’s stock is pre-1980 and 36.7% is pre-1950, on an EPA Zone 1 radon designation, the highest of three.', '',
      'What I cannot tell you is why the price sits where it does. The ACS reports bands, not premiums, so this is descriptive. Rate regulation, loss history, construction cost and market structure all plausibly contribute and this data separates none of them. I would rather say that up front than have it surface in an edit.', '',
      'The full county table is published as CSV and the figures as JSON, free to reuse with attribution:',
      'https://www.beforeregret.com/research/allegheny-storm-premium/', '',
    ],
  },
  {
    n: 3, outlet: 'The Dallas Morning News', to: 'newstips@dallasnews.com', study: 'North Texas',
    beat: 'Metro news tips desk',
    why: 'Largest DFW newsroom and the two outlier counties are in its patch.',
    subject: 'Collin and Denton are two of only three US counties where half the housing went up in one 20-year window and the hail keeps coming',
    body: [
      'Dear news desk,', '',
      'A finding about Collin and Denton counties that I do not think has been reported, from Census ACS year-built estimates and NOAA Storm Events.', '',
      'Of the 100 most populous US counties, only three have both at least 45% of their homes built inside a single twenty-year window and at least 100 recorded hailstorms in 2015-2024. Two of the three share a border, and they are Collin and Denton. The third is Wake County, North Carolina.', '',
      '50.9% of Collin County’s 421,938 homes were built in the 2000s or 2010s.',
      '50.7% the same for Denton County’s 364,120 homes.',
      '1,240 hailstorms recorded across Tarrant, Denton, Collin and Dallas counties over the decade.', '',
      'The argument in one line: roofs go on when houses go up, so a county built in one burst has roofs coming due together rather than one at a time, and these two sit in a hail corridor that wears roofs out faster than most places.', '',
      'The sentence I would ask you not to print: half the roofs in Collin County are about to fail. The study does not say that. Decade of construction is not roof age, since a 2005 house may have been re-roofed twice already, and hail claims are one of the commonest reasons it would have been. The concentration figure sets the clock. It does not read it.', '',
      'Study, method and the full 100-county CSV:',
      'https://www.beforeregret.com/research/north-texas-roof-age/', '',
    ],
  },
  {
    n: 4, outlet: 'Fort Worth Report', to: 'news@fortworthreport.org', study: 'North Texas',
    beat: 'Tarrant County nonprofit newsroom',
    why: 'Tarrant is the contrast case rather than an outlier, which is the angle they can own.',
    subject: 'Tarrant sits inside a four-county hail corridor with 1,240 recorded hailstorms in a decade',
    body: [
      'Dear Fort Worth Report,', '',
      'A North Texas finding with a Tarrant County angle, from public federal data.', '',
      'Across Tarrant, Denton, Collin and Dallas counties, NOAA recorded 1,240 hailstorms between 2015 and 2024. What makes the region unusual nationally is what that weather is landing on. Of the 100 most populous US counties, only three combine at least 45% of homes built in one twenty-year window with at least 100 recorded hailstorms, and two of them, Collin and Denton, are your neighbours.', '',
      'Tarrant’s own housing is spread across more decades than Collin’s or Denton’s, which is the contrast worth drawing: the same hail corridor, a different replacement profile, and so a different exposure for homeowners and for the market.', '',
      'One caveat I would rather give you than have you find: decade of construction is not roof age. It establishes when the first roof went on, not what is up there now. Hail claims are one of the commonest reasons a roof would already have been replaced.', '',
      'Full county table as CSV, figures as JSON, free to reuse with attribution:',
      'https://www.beforeregret.com/research/north-texas-roof-age/', '',
    ],
  },
  {
    n: 5, outlet: 'The Texas Tribune', to: 'pitches@texastribune.org', study: 'North Texas',
    beat: 'Statewide policy and data; a dedicated pitches address',
    why: 'The only one of the four with a published pitches@ address, so it expects cold pitches.',
    subject: 'Two adjoining Texas counties are national outliers for synchronised housing plus hail exposure',
    body: [
      'Dear Texas Tribune,', '',
      'A statewide-interest finding from Census and NOAA data, offered with its limits attached.', '',
      'Of the 100 most populous US counties, exactly three have at least 45% of their homes built within a single twenty-year window and at least 100 recorded hailstorms in 2015-2024. Two of the three are Texan and adjoining: Collin, where 50.9% of 421,938 homes went up in the 2000s or 2010s, and Denton, at 50.7% of 364,120. The third is Wake County, North Carolina.', '',
      'Across the four-county DFW core, NOAA recorded 1,240 hailstorms over that decade.', '',
      'The policy-relevant version is about timing rather than damage. Housing built in a burst produces replacement demand in a burst, and Texas has the clearest example of that in the country sitting in a hail corridor. It is a question about the insurance market and the roofing trade as much as about weather.', '',
      'What the data does not support: any claim about how many roofs are currently failing. Construction decade sets the clock on the first roof; it does not tell you what has been replaced since.', '',
      'Method, limitations and the full CSV:',
      'https://www.beforeregret.com/research/north-texas-roof-age/', '',
    ],
  },
  {
    n: 6, outlet: 'Dallas Observer', to: 'editorial@dallasobserver.com', study: 'North Texas',
    beat: 'Alt-weekly, consumer and city desk',
    why: 'Different register from the DMN pitch. Same facts, written for their voice.',
    subject: 'Why Collin and Denton homeowners keep getting roofing letters: the data behind it',
    body: [
      'Dear Dallas Observer,', '',
      'If you have ever wondered why entire Collin and Denton neighbourhoods seem to get roofed in the same summer, there is now a number behind it.', '',
      'Half the housing in each county, 50.9% of Collin’s 421,938 homes and 50.7% of Denton’s 364,120, went up inside a single twenty-year window. Across the four-county DFW core, NOAA recorded 1,240 hailstorms between 2015 and 2024. Of the 100 largest counties in America, only three combine that kind of construction concentration with that much hail, and two of them are here.', '',
      'Roofs go on when houses go up. A county built in one burst gets its roofs coming due together, and hail moves that schedule forward.', '',
      'To keep you out of trouble with it: this is not a claim that half the roofs in Collin County are failing. A 2005 house may already have been re-roofed twice. The data sets the clock; it does not read it.', '',
      'Everything is public federal data and the county table is free to reuse:',
      'https://www.beforeregret.com/research/north-texas-roof-age/', '',
    ],
  },
  {
    n: 7, outlet: 'Inside Climate News', to: '', form: 'https://insideclimatenews.org/contact/', study: 'Raise or Remove',
    beat: 'National climate desk', formNote: 'Use the contact form and set the subject to tips, which is what their contact page asks for.',
    why: 'Managed retreat is their subject and the two-regime split is a genuinely new cut of it.',
    subject: 'Managed retreat is not a national policy, it is five states',
    body: [
      'Managed retreat is usually discussed as a national policy question. FEMA’s own grant file says it is really five states.', '',
      'Across 32,779 federally funded decisions on flooded single-family homes, fiscal 1996-2025, 24,020 homes were bought and demolished and 8,759 were raised in place. Demolition wins 2.7 to 1. Ranked by how often they demolish, the 25 states with meaningful volume do not form a spectrum. They form two groups with an empty gap between them: Florida, Louisiana, New Jersey, Virginia and Washington sit between 22.6% and 51.2%, then nothing until North Carolina at 71.5%. Kansas and Oklahoma have never raised a single-family home with these grants.', '',
      'The finding nearly did not survive. Sorted by foundation, 93.4% of homes with basements were demolished against 46.3% on piers, a clean engineering gradient. It does not hold: Louisiana has pier-built housing and raises houses, Iowa has basements and demolishes them, so state could account for all of it. Asking within states is what produces the real result. Foundation moves the outcome by 48.9 points in the five states that elevate, and by 22.7 against a 90.7% base rate in the other twenty, where everything goes regardless.', '',
      'Study, method, limitations, and the state and ZIP tables as CSV:',
      'https://www.beforeregret.com/research/raise-or-remove/', '',
      'All public-domain federal data. 1,196 counties, 1,461 ZIP codes.', '',
    ],
  },
  {
    n: 8, outlet: 'Grist', to: '', form: 'https://grist.org/contact/', study: 'Raise or Remove',
    beat: 'National climate and environment',
    why: 'Same study, framed on the disconfirmation rather than the state split.',
    subject: 'The US demolishes 2.7 flooded homes for every one it raises',
    body: [
      'A national number on buyouts versus elevation, with the disconfirmation attached because that is the part worth checking.', '',
      'FEMA publishes every property its mitigation grants have paid to alter or remove. Filtered to single-family homes facing the buy-or-raise choice, that is 32,779 decisions across fiscal 1996-2025: 24,020 demolished, 8,759 raised. 73.3% of the time the house goes.', '',
      'Five states, Florida, Louisiana, New Jersey, Virginia and Washington, do nearly all of America’s elevating, demolishing 31.1% of the time. The other twenty demolish 90.7% of the time. So whether America should retreat or adapt is not really a live national question. Twenty states answered it one way and five the other, and the line between them is not gradual.', '',
      'What this cannot tell you: it is FEMA-funded decisions only. States, counties and cities run their own buyout programmes and homeowners elevate privately, and none of that is in the file. A ZIP with no record is not a ZIP where nothing happened. Cost is also unknowable here, since a payment amount appears on only 47.8% of the relevant rows, which is why no cost figure appears anywhere in the study.', '',
      'https://www.beforeregret.com/research/raise-or-remove/', '',
    ],
  },
  {
    n: 9, outlet: 'ProPublica', to: '', form: 'https://www.propublica.org/tips/', study: 'High-Hazard Dams',
    beat: 'National investigative; tips form',
    why: 'The 636 intersection is not published by the inventory and is the kind of number they build on.',
    subject: '636 US dams are rated poor or unsatisfactory and have no emergency action plan',
    body: [
      '636 US dams are rated in poor or unsatisfactory condition and have no emergency action plan on file. That intersection is the number, and it is not one the National Inventory of Dams publishes directly.', '',
      'Of 92,766 dams in the inventory, 17,049 are classified high hazard potential, meaning failure is expected to cause loss of life. Of those, 2,791 (16.4%) are rated poor or unsatisfactory and 2,476 (14.5%) have no emergency action plan recorded. 636 are in both groups.', '',
      'Two things I would want a reporter to have before writing it. High hazard potential is a statement about consequences, not condition, and it is constantly conflated with dangerous dam. And the version of this that gets written by mistake is over 2,000 dams in poor condition with no emergency plan, which runs the two groups together and describes neither.', '',
      'Every figure is the regulating agencies’ own assessment, aggregated by county and published as CSV:',
      'https://www.beforeregret.com/research/high-hazard-dams/', '',
    ],
  },
  {
    n: 10, outlet: 'The Associated Press', to: '', form: 'https://www.ap.org/tips/', study: 'High-Hazard Dams',
    beat: 'National wire; tips form',
    why: 'County-level aggregation localises for member newsrooms anywhere, which is what a wire wants.',
    subject: 'County-level cut of the National Inventory of Dams, free to member newsrooms',
    body: [
      'A county-level cut of the National Inventory of Dams that surfaces an intersection the file does not publish on its own.', '',
      'Of the 17,049 dams the US Army Corps of Engineers classifies high hazard potential, meaning failure is expected to cause loss of life, 2,791 carry a condition rating of poor or unsatisfactory, 2,476 have no emergency action plan on file, and 636 are in both groups. Their median completion year is 1955.', '',
      'The data is aggregated by county, so it localises for member newsrooms anywhere in the country, and it is published as CSV and JSON with no restriction beyond attribution.', '',
      'Note for accuracy, since it is the commonest error with this dataset: high hazard potential describes the consequence of failure, not the condition of the dam. A well-maintained dam above a town is high hazard potential.', '',
      'https://www.beforeregret.com/research/high-hazard-dams/', '',
    ],
  },
];

// ---- assertions, so a bad card cannot ship -----------------------------------------------------
const VERIFIED = new Set(['news@wesa.fm', 'info@publicsource.org', 'newstips@dallasnews.com',
  'news@fortworthreport.org', 'editorial@dallasobserver.com', 'pitches@texastribune.org']);
for (const m of EMAILS) {
  if (m.to && !VERIFIED.has(m.to)) throw new Error(`ABORT: ${m.outlet} address ${m.to} is not on the verified list`);
  if (!m.to && !m.form) throw new Error(`ABORT: ${m.outlet} has neither an address nor a form URL`);
  if (m.subject.length < 30) throw new Error(`ABORT: ${m.outlet} subject is too short`);
  const text = m.body.join(' ');
  if (!/https:\/\/www\.beforeregret\.com\/research\//.test(text)) throw new Error(`ABORT: ${m.outlet} body has no study link`);
  for (const banned of ['[Your name]', 'TODO', 'XXX']) if (text.includes(banned)) throw new Error(`ABORT: ${m.outlet} body contains ${banned}`);
}
if (EMAILS.length !== 10) throw new Error(`ABORT: ${EMAILS.length} emails, expected 10`);

const card = (m) => {
  const lines = [...m.body, ...SIGN];
  const bodyHtml = lines.map((l) => (l === '' ? '<div class="sp"></div>' : `<div class="ln">${e(l)}</div>`)).join('');
  const dest = m.to
    ? `<div class="fieldrow"><code id="to${m.n}">${e(m.to)}</code><button class="cp" onclick="cpText('to${m.n}',this)">Copy</button></div>`
    : `<div class="fieldrow"><span class="formnote">No public address &mdash; submit via <a href="${e(m.form)}">${e(m.form)}</a></span></div>`;
  return `<section class="card">
  <div class="chead"><span class="num">${m.n}</span><h2>${e(m.outlet)}</h2><span class="tag">${e(m.study)}</span></div>
  <table class="meta"><tr><th>Beat</th><td>${e(m.beat)}</td></tr><tr><th>Why this one</th><td>${e(m.why)}</td></tr>${m.formNote ? `<tr><th>Note</th><td>${e(m.formNote)}</td></tr>` : ''}</table>
  <p class="lbl">${m.to ? 'To' : 'Submit via'}</p>
  ${dest}
  <p class="lbl">Subject</p>
  <div class="fieldrow"><span id="su${m.n}" class="subj">${e(m.subject)}</span><button class="cp" onclick="cpText('su${m.n}',this)">Copy</button></div>
  <p class="lbl">Body</p>
  <div class="mail"><button class="cp" onclick="cp(this)">Copy body</button>${bodyHtml}</div>
</section>`;
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>New Outreach Emails &mdash; Before Regret</title>
<style>
:root{--paper:#F5F7F6;--ink:#16211F;--muted:#5A6B67;--rule:#D4DCD9;--panel:#EBEFED;--accent:#1B6E5A;--warn:#9A5B10;
 --disp:"Archivo",system-ui,sans-serif;--serif:Georgia,"Source Serif 4",serif;--mono:ui-monospace,"JetBrains Mono",Menlo,monospace}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#0D1413;--ink:#E2E9E6;--muted:#93A5A0;--rule:#26332F;--panel:#151F1D;--accent:#4FBE9C;--warn:#D79B4A}}
:root[data-theme="dark"]{--paper:#0D1413;--ink:#E2E9E6;--muted:#93A5A0;--rule:#26332F;--panel:#151F1D;--accent:#4FBE9C;--warn:#D79B4A}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);line-height:1.6;margin:0;padding:0}
.wrap{max-width:60rem;margin:0 auto;padding:2.6rem 1.3rem 5rem}
.kicker{font:700 11px/1 var(--disp);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 .6rem}
h1{font:800 2.3rem/1.12 var(--disp);letter-spacing:-.02em;margin:0 0 .5rem}
.standfirst{color:var(--muted);font-size:1.02rem;margin:0 0 1.6rem;padding-bottom:1.3rem;border-bottom:1px solid var(--rule)}
.note{background:var(--panel);border:1px solid var(--rule);border-radius:3px;padding:1rem 1.15rem;margin:0 0 1.5rem}
.note h3{font:700 .95rem/1.3 var(--disp);margin:0 0 .45rem}
.note p{margin:0 0 .55rem;font-size:.93rem}.note p:last-child{margin:0}
.note code{font:400 .84rem/1.5 var(--mono);color:var(--warn)}
.card{border:1px solid var(--rule);border-radius:3px;padding:1.15rem 1.25rem 1.4rem;margin:0 0 1.5rem;background:var(--panel)}
.chead{display:flex;align-items:center;gap:.65rem;margin:0 0 .8rem;flex-wrap:wrap}
.num{background:var(--accent);color:var(--paper);font:700 .8rem/1 var(--disp);width:1.5rem;height:1.5rem;display:grid;place-items:center;border-radius:50%}
.chead h2{font:700 1.2rem/1.2 var(--disp);margin:0;flex:1}
.tag{font:700 10px/1 var(--disp);letter-spacing:.09em;text-transform:uppercase;color:var(--muted);border:1px solid var(--rule);padding:.3rem .45rem;border-radius:2px}
.meta{border-collapse:collapse;width:100%;margin:0 0 .9rem;font-size:.88rem}
.meta th{text-align:left;color:var(--muted);font:700 .74rem/1.5 var(--disp);letter-spacing:.05em;text-transform:uppercase;width:8.5rem;vertical-align:top;padding:.22rem .6rem .22rem 0}
.meta td{padding:.22rem 0;vertical-align:top}
.lbl{font:700 .72rem/1 var(--disp);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:.9rem 0 .35rem}
.fieldrow{display:flex;gap:.6rem;align-items:flex-start;background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:.55rem .6rem}
.fieldrow code,.fieldrow .subj{flex:1;font:400 .9rem/1.45 var(--mono);word-break:break-word;overflow-wrap:anywhere}
.fieldrow{flex-wrap:wrap}
.fieldrow .subj{font-family:var(--serif);font-size:.95rem}
.formnote{flex:1;font-size:.9rem;color:var(--muted)}
.mail{position:relative;background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:1.6rem .8rem .8rem;font:400 .88rem/1.6 var(--mono);white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.ln{margin:0}.sp{height:.85em}
.cp{background:var(--accent);color:var(--paper);border:0;border-radius:2px;font:700 .72rem/1 var(--disp);letter-spacing:.05em;padding:.42rem .6rem;cursor:pointer;white-space:nowrap}
.mail .cp{position:absolute;top:.45rem;right:.45rem}
.cp:hover{opacity:.87}
a{color:var(--accent)}
footer{margin-top:2.5rem;padding-top:1.2rem;border-top:1px solid var(--rule);font-size:.84rem;color:var(--muted)}
</style>
</head>
<body>
<div class="wrap">
<p class="kicker">Before Regret &middot; Press outreach</p>
<h1>New outreach emails</h1>
<p class="standfirst">Ten desks that have never been pitched, for the four studies that have never been sent. Compiled 9 September 2026.</p>

<div class="note">
  <h3>Already contacted &mdash; not in this list</h3>
  <p>Chad Hemenway, William Rabb, Don Jergler, Ezra Amacher and Susanne Sclafane have had pitches for Risk Without Price and Outside the Zone, and Andrea Wells is held on a reply. So have the local desks in the Outside the Zone pack, including the Houston Chronicle city desk. Anything further to any of them is a follow-up, which is a different job. None of the ten below overlaps with them.</p>
</div>

<div class="note">
  <h3>Shared desks only</h3>
  <p>The first Houston pitch went to a named business editor taken from the Chronicle&rsquo;s own published staff list and hard-bounced: <code>550 5.4.1 Recipient address rejected: Access denied</code>. Large newsrooms publish staff addresses for attribution while the mail server refuses external senders. Published is not the same as reachable, so every address here is a shared desk. A named address is for replying to a reporter who wrote to you first.</p>
  <p>Each address was read off that outlet&rsquo;s own contact page on 9 September 2026 and is reproduced exactly. Four outlets publish no address at all; those cards give the form URL instead of a guess.</p>
</div>

<div class="note">
  <h3>One pitch per newsroom</h3>
  <p>Two emails to the same masthead reads as two people pitching. Where a city has two outlets here they are genuinely separate newsrooms, so both can go the same day. Lead with the local number every time &mdash; the national one is only context.</p>
</div>

${EMAILS.map(card).join('\n')}

<footer>
  <p>Every figure in these emails is computed from public federal data and published with its own method and limitations section. If a reporter comes back on cost, the FEMA file records a payment amount on only 47.8% of the relevant rows, which is why no cost-per-decision figure appears anywhere in Raise or Remove.</p>
  <p>Corrections and questions: hello@beforeregret.com</p>
</footer>
</div>
<script>
function flash(btn){var w=btn.textContent;btn.textContent='Copied';setTimeout(function(){btn.textContent=w;},1400);}
function fail(btn){btn.textContent='Select manually';}
function cpText(id,btn){
  navigator.clipboard.writeText(document.getElementById(id).textContent.trim()).then(function(){flash(btn);},function(){fail(btn);});
}
function cp(btn){
  var el=btn.parentElement.cloneNode(true); el.querySelector('.cp').remove();
  var lines=[].map.call(el.children,function(n){return n.className==='sp'?'':n.textContent;});
  navigator.clipboard.writeText(lines.join('\\n').trim()).then(function(){flash(btn);},function(){fail(btn);});
}
</script>
</body>
</html>`;

const out = path.join(__dirname, 'new-outreach-emails.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`Wrote ${out} (${html.length} bytes, ${EMAILS.length} emails)`);
