// Generates docs/sunlight.html -- the free daylight tool at /sunlight/.
//
//   npx tsx scripts/build-sunlight-tool.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS IS A TOOL PAGE AND NOT A GUIDE.
//
// It was routed through the write-guide pipeline first and the pipeline rejected it, correctly.
// guideTopic() returns null for every plausible slug -- there is no daylight bucket among the
// eleven in GUIDE_TOPIC_PATTERNS, and a null cluster fails assert-article-quality.ts. A search of
// all 68 published guides for honest inbound anchors returned four matches and all four were false
// positives ("which direction the CIRCUIT completes", "sunlight hits the solar ARRAY", "orientation
// of a CRACK", "gravel to reflect sunlight"). Step 6b of that skill is explicit: finding nothing is
// a reason to reconsider the guide, not to insert a sentence.
//
// So it lives where /walkthrough/ and /research/ live: outside the articles table, discovered by
// links and sharing rather than by the related-guides module. That is also the strategic argument
// for building it at all -- this property's constraint is indexing, and a tool is the only asset
// here with a route in that does not require winning that fight first.
//
// -----------------------------------------------------------------------------------------------
// KEYWORD PROVENANCE. Every term this page targets traces to
// data/keywords/2026-09-18-volumes-south-facing-house.json, captured through
// scripts/capture-keywords.ts. 7,290 searches/month across ten terms, the largest being
// "south facing house" at 1,300/mo with a keyword difficulty of 0. Nothing here is an estimate.
//
// THE THESIS, which is the information gain over the articles currently ranking: "south facing"
// describes the front of a building. The room a person sleeps in may face any direction at all, and
// that is the direction that decides whether they ever see a morning. Every other page on this
// query answers for the house. This one answers for the room, because it can compute it.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOC = path.join(ROOT, 'docs', 'data', 'sunlight-locations.json');
const CAPTURE = path.join(ROOT, 'data', 'keywords', '2026-09-18-volumes-south-facing-house.json');
const OUT = path.join(ROOT, 'docs', 'sunlight.html');

if (!fs.existsSync(LOC)) throw new Error('ABORT: run scripts/build-sunlight-locations.ts first');
if (!fs.existsSync(CAPTURE)) throw new Error('ABORT: keyword capture missing -- this page may not claim a target query without one');

const loc = JSON.parse(fs.readFileSync(LOC, 'utf8'));
const cap = JSON.parse(fs.readFileSync(CAPTURE, 'utf8'));
const vol = (kw: string) => {
  const hit = cap.keywords.find((k: any) => k.keyword === kw);
  if (!hit) throw new Error(`ABORT: "${kw}" is targeted on the page but is not in the capture`);
  return hit.search_volume as number;
};
// Assert the terms the copy is written around were actually measured.
for (const k of ['south facing house', 'north facing house', 'east facing house', 'west facing house',
  'which direction should a house face', 'what direction does my house face']) vol(k);

const counties = loc.counties as Array<{ f: string; n: string; s: string; y: number; x: number; z: string; a?: number }>;
if (counties.length < 500) throw new Error(`ABORT: only ${counties.length} counties -- rebuild the location file`);

const TZS = [...new Set(counties.map((c) => c.z))].sort();

const html = `<style>
  .wrap{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font:16px/1.65 Charter,Georgia,'Times New Roman',serif;color:#1a1a1a}
  .wrap *{box-sizing:border-box}
  .kicker{font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#a8710f;margin:0 0 .9rem}
  .wrap h1{font-size:2.35rem;line-height:1.12;margin:0 0 1rem;font-weight:600;letter-spacing:-.015em}
  .standfirst{font-size:1.16rem;line-height:1.6;color:#3d3d3d;margin:0 0 2rem}
  .wrap h2{font:700 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#a8710f;margin:2.75rem 0 .5rem;padding-top:1.5rem;border-top:1px solid #e7e0d2}
  .wrap h3{font-size:1.32rem;line-height:1.35;font-weight:600;margin:0 0 .9rem;letter-spacing:-.01em}
  .wrap p{margin:0 0 1.1rem}
  .wrap a{color:#a8710f}

  .tool{background:#fdfbf6;border:1px solid #e7e0d2;padding:1.4rem 1.3rem;margin:0 0 2rem}
  .tool .row{display:grid;gap:.9rem;margin:0 0 1rem}
  @media(min-width:560px){.tool .row.two{grid-template-columns:1fr 1fr}}
  .tool label{display:block;font:600 11px/1.3 ui-sans-serif,system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#6b6b6b;margin:0 0 .35rem}
  /* Sits BELOW the control, not under the label: in the two-column row a hint above one select
     and not the other would push the two out of alignment. */
  .tool .hint{font:400 12px/1.45 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:.38rem 0 0}
  .tool select{width:100%;padding:.6rem .55rem;font:400 15px ui-sans-serif,system-ui,sans-serif;border:1px solid #cdc4b2;background:#fff;color:#1a1a1a;border-radius:0}
  .segs{display:flex;flex-wrap:wrap;gap:.4rem}
  .segs button{font:500 13px ui-sans-serif,system-ui,sans-serif;padding:.45rem .7rem;border:1px solid #cdc4b2;background:#fff;color:#1a1a1a;cursor:pointer}
  .segs button[aria-pressed="true"]{background:#a8710f;border-color:#a8710f;color:#fff}
  .tz{font:400 12px ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:.55rem 0 0}
  .tz select{display:inline-block;width:auto;padding:.2rem .3rem;font-size:12px}

  .verdict{margin:1.4rem 0 0;padding:1.1rem 1.2rem;background:#fff;border:1px solid #e7e0d2}
  .verdict .big{font:600 1.32rem/1.32 Charter,Georgia,serif;margin:0 0 .5rem}
  .verdict .sub{font:400 14px/1.55 ui-sans-serif,system-ui,sans-serif;color:#4a4a4a;margin:0}
  .verdict.none .big{color:#2f5f86}
  .verdict.some .big{color:#a8710f}

  table{width:100%;border-collapse:collapse;font:400 13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:1.1rem 0 .5rem;font-variant-numeric:tabular-nums}
  th{text-align:right;font-weight:700;border-bottom:2px solid #1a1a1a;padding:.45rem .4rem;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:#4a4a4a;white-space:nowrap}
  th:first-child,td:first-child{text-align:left}
  td{text-align:right;border-bottom:1px solid #ece8e1;padding:.42rem .4rem;white-space:nowrap}
  .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .cap{font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b;margin:.2rem 0 0}
  .cite{background:#f7f3ea;border:1px solid #e7e0d2;padding:1.1rem 1.2rem;font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif;margin:2.5rem 0 0}
  .cite b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a8710f;margin-bottom:.5rem}
  footer.spine{margin:2rem 0 0;padding-top:1.2rem;border-top:1px solid #e7e0d2;font:400 12.5px/1.7 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}
  @media(max-width:560px){.wrap h1{font-size:1.85rem}}
</style>

<div class="wrap">
  <p class="kicker">Free &middot; 566 US counties &middot; no sign-up</p>
  <h1>Which direction should a house face?</h1>
  <p class="standfirst">The honest answer is that it depends which room you mean. &ldquo;South
  facing&rdquo; describes a front door. The bedroom behind it might face north and never see a
  sunrise all year. Pick a county and a window below, and this works out exactly when direct sun
  reaches that room &mdash; on the shortest day, the longest, and both equinoxes.</p>

  <div class="tool">
    <div class="row two">
      <div>
        <label for="sl-county">County</label>
        <select id="sl-county">${counties.map((c) => `<option value="${c.f}">${c.n}, ${c.s}</option>`).join('')}</select>
      </div>
      <div>
        <label for="sl-dir">The window faces</label>
        <select id="sl-dir">
          <option value="0">North (N)</option><option value="22.5">North-northeast (NNE)</option>
          <option value="45">Northeast (NE)</option><option value="67.5">East-northeast (ENE)</option>
          <option value="90" selected>East (E)</option><option value="112.5">East-southeast (ESE)</option>
          <option value="135">Southeast (SE)</option><option value="157.5">South-southeast (SSE)</option>
          <option value="180">South (S)</option><option value="202.5">South-southwest (SSW)</option>
          <option value="225">Southwest (SW)</option><option value="247.5">West-southwest (WSW)</option>
          <option value="270">West (W)</option><option value="292.5">West-northwest (WNW)</option>
          <option value="315">Northwest (NW)</option><option value="337.5">North-northwest (NNW)</option>
        </select>
        <p class="hint">The way you would be looking if you stood at the window and faced out. Your
        phone&rsquo;s compass app will tell you &mdash; or check the house on a satellite map.</p>
      </div>
    </div>
    <div class="row">
      <div>
        <label>What is in front of that window?</label>
        <div class="segs" role="group" aria-label="Obstruction">
          <button type="button" id="sl-open" aria-pressed="true">Open view</button>
          <button type="button" id="sl-obs" aria-pressed="false">Building or trees within ~20ft</button>
        </div>
      </div>
    </div>
    <p class="tz">Times shown in <select id="sl-tz">${TZS.map((z) => `<option value="${z}">${z.replace('America/', '').replace(/_/g, ' ')}</option>`).join('')}</select>
    <span id="sl-tzwarn"></span></p>

    <div class="verdict" id="sl-verdict"><p class="big">Pick a county and a direction.</p></div>
    <div class="scroll"><table id="sl-table"></table></div>
    <p class="cap" id="sl-cap"></p>
  </div>

  <h2>What a south facing house actually means</h2>
  <p>Almost everything written about a <strong>south facing house</strong> is describing the street
  elevation &mdash; which way the front of the building points. That tells you about the front rooms
  and nothing at all about the back ones. A south facing house has north-facing rooms in it, and
  those rooms behave exactly like rooms in a north facing house.</p>
  <p>South-facing windows do get the most sun overall, and they get it through the middle of the
  day rather than at either end. In winter that is the warmest room in the house. In an
  un-shaded August it is the one nobody wants to sit in.</p>

  <h2>A north facing house is not the bad one</h2>
  <p>This is the result that surprises people. In midsummer the sun rises well north of due east
  &mdash; at 40&deg;N it clears the horizon at a bearing of about 58&deg; in June, against about 121&deg;
  in December. So a north-facing window gets a genuine run of early light for several months, then
  loses it entirely for the winter. Set the direction to north above and the table shows the split.</p>
  <p>What a north facing room really lacks is not light but <em>direct</em> light. It gets steady,
  even daylight all day and very little glare, which is why north-facing rooms have been the
  traditional choice for studios and desks.</p>

  <h2>East facing and west facing windows</h2>
  <p>These two differ most, and the difference is the time of day. An <strong>east facing
  house</strong> takes the sun early and loses it around midday. A <strong>west facing house</strong>
  is the mirror image: nothing in the morning, then everything from mid-afternoon until sunset,
  along with the heat that comes with it in summer.</p>
  <p>Neither is better in the abstract. East light suits a bedroom or a kitchen you use in the
  morning. West light suits a room you sit in after work, if you can shade it in July.</p>

  <h2>What blocks the light</h2>
  <p>A compass direction assumes an open sky, and most houses do not have one. The neighbouring
  roofline, a mature oak, a ridge behind the property &mdash; any of these routinely matter more than
  the direction does. A two-storey house about fifteen feet away blocks roughly the first 15&deg; of
  sky, which on a midwinter morning is the difference between first light at 7:19 and first light
  at 9:07.</p>
  <p>That is not a rounding error. In winter an obstruction does not reduce a room&rsquo;s morning
  light, it removes it. Switch the second setting above to compare the same window both ways &mdash;
  for many houses this is the only comparison that matters.</p>

  <h2>Where the numbers come from</h2>
  <p>Sun position is worked out for every minute of the day using the standard NOAA solar position
  algorithm, corrected for atmospheric refraction near the horizon. A window receives direct sun
  when the sun is above the horizon and within 90&deg; of the way the window faces. County
  coordinates are the internal points published in the
  <a href="https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/">US Census
  Bureau 2023 Gazetteer</a>.</p>

  <h2>What this doesn&rsquo;t tell you</h2>
  <p>It tells you whether direct sun reaches the glass, not how bright the room will feel &mdash;
  window size, glazing, wall colour and indirect daylight all matter and none of them are here. The
  obstruction setting is one approximation, not a model of your neighbour&rsquo;s actual roofline.
  And it counts minutes of sunlight; it makes no claim about health or sleep.</p>

  <footer class="spine">
    <p style="margin:0">Looking at a specific address? The free
    <a href="https://www.beforeregret.com/">property report</a> covers flood and hazard exposure,
    permit history and what to check for a house of that era. There is also a guide to
    <a href="https://www.beforeregret.com/guides/look-up-building-permits-by-address/">looking up
    building permits by address</a> if you want to see what work has been done to the house.</p>
  </footer>
</div>

<script type="application/json" id="sl-data">${JSON.stringify(counties)}</script>
<script>
(function(){
  var el=document.getElementById('sl-data'); if(!el) return;
  var C=JSON.parse(el.textContent||'[]'), byF={};
  for(var i=0;i<C.length;i++) byF[C[i].f]=C[i];

  var D2R=Math.PI/180, R2D=180/Math.PI;
  function sunPos(utcMs,lat,lon){
    var T=(utcMs/86400000+2440587.5-2451545)/36525;
    var L0=(280.46646+T*(36000.76983+T*0.0003032))%360; if(L0<0)L0+=360;
    var M=357.52911+T*(35999.05029-0.0001537*T);
    var e=0.016708634-T*(0.000042037+0.0000001267*T);
    var Cc=Math.sin(M*D2R)*(1.914602-T*(0.004817+0.000014*T))
          +Math.sin(2*M*D2R)*(0.019993-0.000101*T)+Math.sin(3*M*D2R)*0.000289;
    var om=125.04-1934.136*T;
    var app=L0+Cc-0.00569-0.00478*Math.sin(om*D2R);
    var e0=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60;
    var ob=e0+0.00256*Math.cos(om*D2R);
    var dec=Math.asin(Math.sin(ob*D2R)*Math.sin(app*D2R))*R2D;
    var y=Math.pow(Math.tan(ob/2*D2R),2);
    var eq=4*R2D*(y*Math.sin(2*L0*D2R)-2*e*Math.sin(M*D2R)
        +4*e*y*Math.sin(M*D2R)*Math.cos(2*L0*D2R)-0.5*y*y*Math.sin(4*L0*D2R)-1.25*e*e*Math.sin(2*M*D2R));
    var um=(((utcMs%86400000)+86400000)%86400000)/60000;
    var tst=(um+eq+4*lon+1440)%1440, ha=tst/4-180; if(ha<-180)ha+=360;
    var la=lat*D2R, de=dec*D2R, h=ha*D2R;
    var cz=Math.sin(la)*Math.sin(de)+Math.cos(la)*Math.cos(de)*Math.cos(h);
    cz=Math.min(1,Math.max(-1,cz));
    var zen=Math.acos(cz)*R2D, elv=90-zen;
    if(elv>-0.575){
      var te=Math.tan(elv*D2R), r;
      if(elv>85) r=0;
      else if(elv>5) r=58.1/te-0.07/Math.pow(te,3)+0.000086/Math.pow(te,5);
      else r=1735+elv*(-518.2+elv*(103.4+elv*(-12.79+elv*0.711)));
      elv+=r/3600;
    }
    var az, den=Math.cos(la)*Math.sin(zen*D2R);
    if(Math.abs(den)>1e-9){
      var c2=Math.min(1,Math.max(-1,(Math.sin(la)*Math.cos(zen*D2R)-Math.sin(de))/den));
      az = ha>0 ? (Math.acos(c2)*R2D+180)%360 : (540-Math.acos(c2)*R2D)%360;
    } else az = lat>0?180:0;
    return {e:elv,a:az};
  }
  function tzOff(ms,tz){
    var f=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',
      day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(ms));
    var p={}; for(var i=0;i<f.length;i++) p[f[i].type]=f[i].value;
    var u=Date.UTC(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute,+p.second);
    return Math.round((u-Math.floor(ms/1000)*1000)/60000);
  }
  function toUtc(y,m,d,mins,tz){
    var g=Date.UTC(y,m-1,d,Math.floor(mins/60),mins%60);
    for(var i=0;i<3;i++){
      var t=Date.UTC(y,m-1,d,0,0)+mins*60000-tzOff(g,tz)*60000;
      if(Math.abs(t-g)<1000) break; g=t;
    }
    return g;
  }
  function day(y,m,d,lat,lon,tz,waz,cut){
    var sr=null,first=null,last=null,tot=0,morn=0,prev=false;
    for(var mi=0;mi<1440;mi++){
      var p=sunPos(toUtc(y,m,d,mi,tz),lat,lon), up=p.e>-0.833;
      if(up&&!prev&&sr===null) sr=mi;
      prev=up;
      var del=Math.abs(((p.a-waz+540)%360)-180);
      if(p.e>cut&&del<90){ tot++; if(mi<540)morn++; if(first===null)first=mi; last=mi; }
    }
    return {sr:sr,first:first,last:last,tot:tot,morn:morn};
  }
  function hm(v){ return v===null?'\\u2014':(('0'+Math.floor(v/60)).slice(-2)+':'+('0'+(v%60)).slice(-2)); }

  var cSel=document.getElementById('sl-county'), dSel=document.getElementById('sl-dir'),
      tSel=document.getElementById('sl-tz'), warn=document.getElementById('sl-tzwarn'),
      bOpen=document.getElementById('sl-open'), bObs=document.getElementById('sl-obs'),
      vEl=document.getElementById('sl-verdict'), tEl=document.getElementById('sl-table'),
      capEl=document.getElementById('sl-cap');
  var obstructed=false;

  bOpen.addEventListener('click',function(){obstructed=false;bOpen.setAttribute('aria-pressed','true');bObs.setAttribute('aria-pressed','false');run();});
  bObs.addEventListener('click',function(){obstructed=true;bObs.setAttribute('aria-pressed','true');bOpen.setAttribute('aria-pressed','false');run();});
  cSel.addEventListener('change',function(){syncTz();run();});
  dSel.addEventListener('change',run);
  tSel.addEventListener('change',run);

  function syncTz(){
    var c=byF[cSel.value]; if(!c) return;
    tSel.value=c.z;
    warn.textContent = c.a ? ' \\u2014 this state crosses a time-zone line, so check this is right.' : '';
  }

  var DATES=[[2026,12,21,'Shortest day'],[2026,3,20,'March equinox'],[2026,6,21,'Longest day'],[2026,9,22,'September equinox']];
  // "A east-facing window" reads as carelessness, and carelessness is what a reader punishes on a
  // page whose whole claim is precision. Only the east compass points start with a vowel.
  function art(d){ return d.charAt(0)==='e' ? 'An ' : 'A '; }
  var NAMES={0:'north',22.5:'north-northeast',45:'northeast',67.5:'east-northeast',90:'east',
    112.5:'east-southeast',135:'southeast',157.5:'south-southeast',180:'south',202.5:'south-southwest',
    225:'southwest',247.5:'west-southwest',270:'west',292.5:'west-northwest',315:'northwest',337.5:'north-northwest'};

  function run(){
    var c=byF[cSel.value]; if(!c) return;
    var waz=parseFloat(dSel.value), tz=tSel.value, cut=obstructed?15:0;
    var rows=[], totMorn=0, anyDirect=0;
    for(var i=0;i<DATES.length;i++){
      var D=DATES[i], r=day(D[0],D[1],D[2],c.y,c.x,tz,waz,cut);
      rows.push([D[3],r]); totMorn+=r.morn; anyDirect+=r.tot;
    }
    var name=c.n+', '+c.s, dir=NAMES[waz];
    var cls, big, sub;
    if(anyDirect===0){
      cls='none'; big='This window never receives direct sunlight.';
      sub=art(dir)+dir+'-facing window in '+name+', with the obstruction setting you chose, gets no direct sun on any of the four dates below.';
    } else if(totMorn===0){
      cls='none'; big='This room never gets a morning.';
      sub=art(dir)+dir+'-facing window in '+name+' receives zero minutes of direct sun before 9am \\u2014 on the shortest day, the longest day, and both equinoxes. It does get afternoon sun.';
    } else {
      cls='some';
      var best=Math.max(rows[0][1].morn,rows[1][1].morn,rows[2][1].morn,rows[3][1].morn);
      var worst=Math.min(rows[0][1].morn,rows[1][1].morn,rows[2][1].morn,rows[3][1].morn);
      big=worst===0 ? 'Morning light in summer, none in winter.' : 'This room gets morning sun year-round.';
      sub=art(dir)+dir+'-facing window in '+name+' receives between '+worst+' and '+best+' minutes of direct sun before 9am, depending on the season.';
    }
    vEl.className='verdict '+cls;
    vEl.innerHTML='<p class="big">'+big+'</p><p class="sub">'+sub+'</p>';

    var h='<thead><tr><th>Date</th><th>Sunrise</th><th>First direct sun</th><th>Last direct</th><th>Total</th><th>Before 9am</th></tr></thead><tbody>';
    for(var j=0;j<rows.length;j++){
      var R=rows[j][1];
      h+='<tr><td>'+rows[j][0]+'</td><td>'+hm(R.sr)+'</td><td>'+hm(R.first)+'</td><td>'+hm(R.last)+'</td><td>'+R.tot+' min</td><td>'+R.morn+' min</td></tr>';
    }
    tEl.innerHTML=h+'</tbody>';
    capEl.textContent='Window facing '+waz+'\\u00b0 '+dir+' in '+name+' ('+c.y.toFixed(3)+', '+c.x.toFixed(3)+'), '
      +(obstructed?'with a 15\\u00b0 horizon cutoff for a nearby building or tree line.':'assuming an open horizon.')
      +' Times in '+tz.replace('America/','').replace(/_/g,' ')+'.';
  }

  // Default to the largest county in the list so the tool shows a real answer on load.
  cSel.value='06037'; if(!byF[cSel.value]) cSel.selectedIndex=0;
  syncTz(); run();
})();
</script>
`;

if (!html.includes('<div class="wrap">')) throw new Error('ABORT: prerender slices at <div class="wrap">');
// The page must keep naming its source and its limits. Both are reader-facing -- somebody deciding
// whether to trust a number wants to know where it came from and what it does not cover -- and both
// are easy to lose in a tidy-up.
for (const required of ['Gazetteer', 'doesn&rsquo;t tell you']) {
  if (!html.includes(required)) throw new Error(`ABORT: page no longer contains "${required}"`);
}
// Keyword coverage, asserted rather than hoped for: the terms this page is written to rank for must
// actually appear in its prose.
for (const kw of ['south facing house', 'north facing house', 'east facing house', 'west facing house']) {
  // [\s-]+ not [\s-]: the prose is wrapped, so "east facing house" can carry a newline and two
  // spaces of indent between its words, and markup between them too.
  if (!new RegExp(kw.replace(/ /g, '(?:[\\s-]|</?strong>)+'), 'i').test(html)) {
    throw new Error(`ABORT: "${kw}" is targeted but does not appear on the page`);
  }
}

// -----------------------------------------------------------------------------------------------
// THE TRIPWIRE. The NOAA algorithm is now implemented twice: once in scripts/solar-window.ts, which
// has a self-test against published values, and once in the browser script above, which is what
// readers actually run. Two implementations of the same physics drift, and a drift here is
// invisible -- the page keeps returning plausible times that are quietly wrong.
//
// So the emitted script's maths is pulled back out, evaluated, and checked against the tested
// engine before this file is allowed to be written. No DOM is needed: sunPos, tzOff, toUtc and day
// are pure. If they ever disagree by more than a minute, the build stops here rather than shipping.
{
  const { windowDay } = await import('./solar-window.js');
  const body = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const need = ['function sunPos', 'function tzOff', 'function toUtc', 'function day'];
  for (const n of need) if (!body.includes(n)) throw new Error(`ABORT: emitted script is missing ${n}`);
  const start = body.indexOf('var D2R');
  const end = body.indexOf("function hm(");
  if (start < 0 || end < 0 || end <= start) throw new Error('ABORT: cannot locate the maths block in the emitted script');
  // eslint-disable-next-line no-new-func
  const browserDay = new Function(`${body.slice(start, end)}; return day;`)() as
    (y: number, m: number, d: number, lat: number, lon: number, tz: string, waz: number, cut: number) => any;

  const CASES: Array<[string, number, number, string, number, number]> = [
    ['Los Angeles, E, open', 34.196, -118.262, 'America/Los_Angeles', 90, 0],
    ['New York, WNW, open', 40.7128, -74.006, 'America/New_York', 292.5, 0],
    ['Chicago, N, obstructed', 41.894, -87.645, 'America/Chicago', 0, 15],
    ['Miami, S, open', 25.616, -80.504, 'America/New_York', 180, 0],
    ['Seattle, W, obstructed', 47.491, -121.834, 'America/Los_Angeles', 270, 15],
  ];
  let checked = 0;
  for (const [label, lat, lon, tz, az, cut] of CASES) {
    for (const [m, d] of [[12, 21], [3, 20], [6, 21], [9, 22]]) {
      const node = windowDay(2026, m, d, lat, lon, tz, az, cut);
      const web = browserDay(2026, m, d, lat, lon, tz, az, cut);
      const cmp: Array<[string, number | null, number | null]> = [
        ['sunrise', node.sunriseMin, web.sr], ['first', node.firstDirectMin, web.first],
        ['last', node.lastDirectMin, web.last], ['total', node.directMinutes, web.tot],
        ['morning', node.morningDirectMinutes, web.morn],
      ];
      for (const [field, a, b] of cmp) {
        if (a === null || b === null) {
          if (a !== b) throw new Error(`ABORT: ${label} ${m}/${d} ${field}: node=${a} browser=${b}`);
        } else if (Math.abs(a - b) > 1) {
          throw new Error(`ABORT: ${label} ${m}/${d} ${field}: node=${a} browser=${b} -- the two implementations have drifted`);
        }
      }
      checked++;
    }
  }
  console.log(`  browser maths verified against scripts/solar-window.ts across ${checked} day(s) in ${CASES.length} location(s)`);
}
fs.writeFileSync(OUT, html);
console.log(`wrote ${path.relative(ROOT, OUT)}  (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`  ${counties.length} counties, ${TZS.length} time zones`);
console.log(`  target queries, all from ${path.basename(CAPTURE)}:`);
for (const k of ['south facing house', 'west facing house', 'north facing house', 'east facing house',
  'best direction for house to face', 'what direction does my house face', 'which direction should a house face']) {
  console.log(`    ${String(vol(k)).padStart(5)}/mo  ${k}`);
}
