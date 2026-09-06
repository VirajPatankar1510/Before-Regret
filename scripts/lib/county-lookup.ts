// The county lookup widget, shared by every study in the storm-and-premium series.
//
// It lives here rather than in one study's builder because the second study needed the same tool
// and the alternative was a copy. Two copies of a widget drift: one gets a caveat reworded, the
// other does not, and the one that shipped to a newsroom is the one nobody re-reads.
//
// It is deliberately framework-free and makes no network request. It has to run inside somebody
// else's page, where a fetch may be blocked by CSP and a missing dependency is invisible to us.
export type LookupCounty = {
  county: string; state: string; stormEvents: number; flood: number; hail: number;
  pctUnder1000: number; pctOver3000: number; pctPre1980: number; radonZone: number | null;
  eventsByType: Record<string, number>;
};

export function lookupPayload(counties: LookupCounty[]) {
  return counties.map((c) => ({
    n: `${c.county.charAt(0)}${c.county.slice(1).toLowerCase()}, ${c.state}`,
    e: c.stormEvents,
    f: c.flood,
    u: Math.round(c.pctUnder1000 * 1000) / 10,
    o: Math.round(c.pctOver3000 * 1000) / 10,
    p: Math.round(c.pctPre1980 * 1000) / 10,
    r: c.radonZone,
    t: Object.entries(c.eventsByType).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([k, v]) => `${k} ${v}`).join(' &middot; '),
  })).sort((a, b) => a.n.localeCompare(b.n));
}

export const LOOKUP_CSS = `
  .lookup{border:1px solid #e5e0d8;background:#fdfcfa;padding:1.1rem 1.2rem;margin:0 0 2rem}
  .lk-eyebrow{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b;margin:0 0 .7rem}
  .lookup select{width:100%;font:400 15px/1.4 ui-sans-serif,system-ui,sans-serif;padding:.55rem .6rem;border:1px solid #cfc8bd;background:#fff;color:#1a1a1a;border-radius:2px}
  .lk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(7.5rem,1fr));gap:1px;background:#e5e0d8;border:1px solid #e5e0d8;margin:.9rem 0 0}
  .lk-cell{background:#fdfcfa;padding:.65rem .7rem}
  .lk-cell b{display:block;font:700 1.25rem/1.1 ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em}
  .lk-cell span{display:block;font:400 11px/1.35 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin-top:.25rem}
  .lk-types{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:.7rem 0 0}
  .lk-caveat{font:400 11.5px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:.8rem 0 0;border-top:1px solid #ece8e1;padding-top:.7rem}`;

export function lookupMarkup(n: number): string {
  return `<div class="lookup">
    <p class="lk-eyebrow">Look up any of the ${n} counties</p>
    <label for="lkpick" style="position:absolute;left:-9999px">Choose a county</label>
    <select id="lkpick"><option value="">Choose a county&hellip;</option></select>
    <div id="lkout" aria-live="polite"></div>
    <p class="lk-caveat">NOAA records <em>reports</em> of severe weather, not a census of it, so
    counts describe how often something damaging was written down. Insurance shares are what
    mortgaged households told the Census they pay, in bands &mdash; there is no average premium in
    this data and none should be quoted from it.</p>
  </div>`;
}

export const dataScript = (payload: unknown) =>
  `<script type="application/json" id="alg-data">${JSON.stringify(payload)}</script>`;

export const JS_SCRIPT = `<script>
(function(){
  var d=JSON.parse(document.getElementById('alg-data').textContent);
  var s=document.getElementById('lkpick'),o=document.getElementById('lkout');
  d.forEach(function(c,i){var e=document.createElement('option');e.value=i;e.textContent=c.n;s.appendChild(e);});
  function cell(v,l){return '<div class="lk-cell"><b>'+v+'</b><span>'+l+'</span></div>';}
  s.addEventListener('change',function(){
    if(s.value===''){o.innerHTML='';return;}
    var c=d[+s.value];
    o.innerHTML='<div class="lk-grid">'
      +cell(c.e.toLocaleString(),'severe weather events, 2015&ndash;2024')
      +cell(c.u.toFixed(1)+'%','pay under $1,000 a year')
      +cell(c.o.toFixed(1)+'%','pay over $3,000 a year')
      +cell(c.p.toFixed(1)+'%','of homes built before 1980')
      +cell(c.f.toLocaleString(),'floods and flash floods')
      +cell(c.r===null?'&mdash;':'Zone '+c.r,'EPA radon zone')
      +'</div><p class="lk-types">Most common: '+c.t+'</p>';
  });
})();
</script>`;

// The iframe wrapper. The caveat and the credit are asserted by each builder, not here, so a study
// that forgets to include them fails its own build rather than this file's.
export function embedDocument(studyUrl: string, studyTitle: string, markup: string, data: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Storm frequency and insurance cost by county &mdash; Before Regret</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${studyUrl}">
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:16px;background:#fdfcfa;color:#1a1a1a;font:16px/1.6 Charter,Georgia,serif;-webkit-font-smoothing:antialiased}
${LOOKUP_CSS}
  .lookup{max-width:680px;margin:0 auto}
  .embed-credit{max-width:680px;margin:12px auto 0;font:400 11px/1.4 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;text-align:right}
  .embed-credit a{color:#8a6d3b}
</style>
</head>
<body>
${markup}
<p class="embed-credit"><a href="${studyUrl}" target="_blank" rel="noopener">${studyTitle}</a> &mdash; Before Regret</p>
${data}
${JS_SCRIPT}
<script>
/* Reports its own height to the host page: the widget grows once a county is picked, so no single
   iframe height is right. The host listener is optional -- without it the fallback height still
   renders a usable tool, it just stops following the content. */
(function(){
  function post(){
    var h=Math.ceil(document.documentElement.getBoundingClientRect().height);
    try{parent.postMessage({beforeRegretEmbedHeight:h},'*');}catch(e){}
  }
  if(window.ResizeObserver) new ResizeObserver(post).observe(document.body);
  window.addEventListener('load',post);
  setTimeout(post,60);
})();
</script>
</body>
</html>
`;
}
