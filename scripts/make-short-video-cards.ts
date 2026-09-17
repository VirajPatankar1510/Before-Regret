// Generate vertical (1080x1920) data cards for short-form video, from verified county data.
//
//   npx tsx scripts/make-short-video-cards.ts                    # top counties by claim volume
//   npx tsx scripts/make-short-video-cards.ts --county "Harris" --state TX
//   npx tsx scripts/make-short-video-cards.ts --limit 5
//
// -----------------------------------------------------------------------------------------------
// WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT.
//
// It is a frame generator: five 1080x1920 SVGs per county plus a caption script, all numbers read
// from dist/research/data/outside-the-zone-by-county.csv at run time. Rasterise the SVGs and you
// have a short-form video; post frame 2 alone and you have an Instagram or Pinterest still.
//
// It is NOT a synthetic presenter, an AI avatar, or a cloned voice. That is a deliberate exclusion,
// not an oversight. src/components/AboutMethodology.tsx already records this project's position:
// "deliberately NOT a fabricated founder bio or an AI-generated 'author' persona ... a fake named
// author with a fake photo would be a false E-E-A-T signal, and a discoverable one." A synthetic
// face reading these numbers would contradict a decision this site already made in public, on a
// page that exists to say it out loud. These cards make no claim to be a person, so they cannot be
// caught pretending to be one.
//
// -----------------------------------------------------------------------------------------------
// WHY THIS DATA. "26.6% of paid NFIP flood claims were on homes OUTSIDE the mapped high-risk zone"
// is counterintuitive, checkable, computed by this site from FEMA's own claims file, and available
// per county for 1,922 counties -- so the same true fact is locally specific thousands of times
// over. Short-form video rewards exactly that: a surprising number that is about where the viewer
// lives.
//
// THE OUTLIER GATE IS THE WHOLE POINT OF THE SELECTION RULE. The raw file's top rows are
// Doniphan KS at 100% on 95 claims and Hubbard MN at 100% on 28. Both are arithmetically true and
// both would make a dishonest card: a headline percentage computed on a handful of claims implies
// a pattern the sample cannot support. Risk Without Price v1 shipped with a Puerto Rico outlier for
// the same reason and had to be rebuilt. MIN_CLAIMS below is that lesson as code -- the script
// refuses to render a county beneath it, and says so rather than silently skipping.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'dist', 'research', 'data', 'outside-the-zone-by-county.csv');
const OUT = path.join(ROOT, 'assets', 'short-video');

/** A percentage computed on fewer claims than this is not a finding, it is noise wearing a
 *  percentage sign. 500 keeps the headline honest at county level. */
const MIN_CLAIMS = 500;

/** AND the finding has to actually hold in that county.
 *
 *  Caught on the first real run. Sorting by claim volume alone produced cards for Ocean NJ (3.8%
 *  outside the zone) and Miami-Dade FL (8.8%) -- and every frame of this set is built around the
 *  claim that being outside the zone is no protection. In those two counties the data says the
 *  opposite: the mapped zone caught almost all the loss. The percentage was true and the card
 *  would have been a lie, which is the more dangerous shape of error because nothing in the
 *  numbers flags it.
 *
 *  20% is set against the national figure of 26.6%. A county at or near that carries the story;
 *  one well below it needs a different story, which means a different card set, not this one with
 *  a smaller number dropped in. */
const MIN_PCT_OUTSIDE = 20;

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

interface Row { county: string; state: string; claims: number; pctOutside: number; paidUsd: number }

function load(): Row[] {
  if (!fs.existsSync(SRC)) {
    throw new Error(`ABORT: ${path.relative(ROOT, SRC)} not found -- run \`npm run build\` first (prerender-research writes it).`);
  }
  const lines = fs.readFileSync(SRC, 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  const idx = (n: string) => {
    const i = head.indexOf(n);
    if (i < 0) throw new Error(`ABORT: column "${n}" missing -- the study's CSV shape changed`);
    return i;
  };
  const [c, s, cl, pc, usd] = ['county', 'state', 'classifiable_claims', 'pct_of_claims_paid_outside_mapped_zone', 'paid_on_out_of_zone_claims_usd'].map(idx);
  return lines.slice(1).map((l) => {
    const f = l.split(',');
    return { county: f[c], state: f[s], claims: Number(f[cl]), pctOutside: Number(f[pc]), paidUsd: Number(f[usd]) };
  }).filter((r) => r.county && Number.isFinite(r.claims) && Number.isFinite(r.pctOutside));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)} billion` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)} million` : `$${n.toLocaleString()}`;

/** 1080x1920. Type sizes are large because the whole frame is read in under two seconds on a
 *  phone held at arm's length -- not because bigger looks bolder. */
function frame(body: string, opts: { bg?: string; ink?: string } = {}): string {
  const bg = opts.bg ?? '#0E1116';
  const ink = opts.ink ?? '#F5F3EE';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" font-family="Georgia, 'Times New Roman', serif">
  <rect width="1080" height="1920" fill="${bg}"/>
  <g fill="${ink}">
${body}
  </g>
  <text x="80" y="1840" font-family="Menlo, monospace" font-size="26" fill="#8A93A0">beforeregret.com</text>
</svg>`;
}

function wrap(text: string, perLine: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > perLine) { out.push(line.trim()); line = w; }
    else line += ` ${w}`;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function lines(ls: string[], x: number, y: number, size: number, lh: number, weight = 'normal', fill?: string) {
  return ls.map((l, i) =>
    `    <text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${weight}"${fill ? ` fill="${fill}"` : ''}>${esc(l)}</text>`
  ).join('\n');
}

function cards(r: Row) {
  const place = `${r.county} County, ${r.state}`;
  const pct = `${r.pctOutside}%`;
  const inside = 100 - r.pctOutside;

  return [
    { name: '1-hook', svg: frame(
      lines(wrap('If your home is not in a flood zone, you are not safe from a flood claim.', 22), 80, 520, 76, 108, 'bold')
      + `\n    <text x="80" y="1080" font-family="Menlo, monospace" font-size="34" fill="#C8A96A">${esc(place.toUpperCase())}</text>`
    ) },
    { name: '2-number', svg: frame(
      `    <text x="80" y="700" font-size="300" font-weight="bold" fill="#C8A96A">${pct}</text>\n`
      + lines(wrap(`of paid flood claims in ${place} were on homes OUTSIDE the high-risk flood zone.`, 24), 80, 860, 62, 90)
    ) },
    { name: '3-scale', svg: frame(
      lines(wrap('That is not a rounding error.', 20), 80, 420, 68, 96, 'bold')
      + '\n'
      + lines(wrap(`${money(r.paidUsd)} paid out, across ${r.claims.toLocaleString()} classifiable claims in this county alone.`, 26), 80, 700, 56, 82, 'normal', '#C8D2DE')
    ) },
    { name: '4-meaning', svg: frame(
      lines(wrap('Being outside the zone is not the same as being safe.', 22), 80, 420, 64, 92, 'bold')
      + '\n'
      // An em-dash, not the site's usual "--". That convention exists for database copy, where the
      // renderer converts it; rendered straight into an SVG it reads as a typo on a full-screen card.
      + lines(wrap(`Only ${inside}% of the money went to homes inside the mapped zone. Lenders stop requiring flood cover outside it \u2014 the water does not.`, 28), 80, 760, 50, 74, 'normal', '#C8D2DE')
    ) },
    { name: '5-source', svg: frame(
      lines(wrap('Check your own county.', 20), 80, 420, 68, 96, 'bold')
      + '\n'
      + lines(wrap('2,578,413 NFIP flood claims, 1970s to 2026, analysed by county. Free, with the data file.', 30), 80, 640, 46, 68, 'normal', '#C8D2DE')
      + `\n    <text x="80" y="980" font-family="Menlo, monospace" font-size="38" fill="#C8A96A">beforeregret.com/research/</text>`
      + `\n    <text x="80" y="1040" font-family="Menlo, monospace" font-size="38" fill="#C8A96A">outside-the-zone/</text>`
      + '\n' + lines(wrap('Source: FEMA NFIP redacted claims file. Zone as rated at time of claim.', 44), 80, 1200, 30, 46, 'normal', '#8A93A0')
    ) },
  ];
}

function script(r: Row): string {
  const place = `${r.county} County, ${r.state}`;
  return [
    `CAPTION / VOICEOVER -- ${place}`,
    '',
    `1. If your home is not in a flood zone, you are not safe from a flood claim.`,
    `2. ${r.pctOutside}% of paid flood claims in ${place} were on homes outside the high-risk zone.`,
    `3. ${money(r.paidUsd)} paid out, across ${r.claims.toLocaleString()} classifiable claims in this county alone.`,
    `4. Only ${100 - r.pctOutside}% of the money went to homes inside the mapped zone. Lenders stop requiring flood cover outside it. The water does not.`,
    `5. We analysed 2,578,413 NFIP claims by county. Free, with the data file, at beforeregret.com.`,
    '',
    `SOURCE: FEMA NFIP redacted claims file, 1970s-2026. Zone as rated at time of claim, not position on today's map.`,
    `EVERY FIGURE ABOVE IS READ FROM dist/research/data/outside-the-zone-by-county.csv -- none is typed by hand.`,
  ].join('\n');
}


/** A self-contained page that animates the frames and records itself to a video file.
 *
 *  WHY THIS EXISTS RATHER THAN AN ffmpeg CALL. Neither ffmpeg nor any rasteriser is installed on
 *  this machine, and Homebrew is not either -- producing an mp4 here would mean installing a
 *  package manager onto someone's laptop, which is not a change to make on their behalf. macOS
 *  Quick Look can rasterise SVG but pads everything to a square, so 1080x1920 comes back as
 *  1920x1920 with the content letterboxed. Chrome renders the SVG correctly and can record a
 *  canvas, so the browser is the one renderer already present and already correct.
 *
 *  The SVGs are inlined rather than fetched: opened from file:// a fetch would be blocked, and an
 *  <img> pointing at a sibling .svg taints the canvas, which silently breaks the recording at the
 *  point where you least want a surprise.
 */
function recorderHtml(frames: Array<{ name: string; svg: string }>, r: Row, holdMs: number[]): string {
  const svgJson = JSON.stringify(frames.map((f) => f.svg));
  const holds = JSON.stringify(holdMs);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.county)} ${esc(r.state)} — record</title>
<style>
 body{background:#14171c;color:#e8e6e1;font:15px/1.5 system-ui,-apple-system,sans-serif;margin:0;padding:24px;display:flex;gap:24px;flex-wrap:wrap}
 canvas{width:270px;height:480px;border:1px solid #333;background:#000;flex:none}
 .panel{max-width:460px}
 button{font:600 15px system-ui;padding:11px 18px;border-radius:9px;border:0;cursor:pointer;background:#c8a96a;color:#14171c}
 button:disabled{opacity:.45;cursor:default}
 code{background:#1e222a;padding:2px 6px;border-radius:4px;font-size:13px}
 p{color:#aab2bd}
</style></head><body>
<canvas id="c" width="1080" height="1920"></canvas>
<div class="panel">
 <h2 style="margin:0 0 6px">${esc(r.county)} County, ${esc(r.state)}</h2>
 <p>${r.pctOutside}% of paid flood claims outside the mapped high-risk zone · ${r.claims.toLocaleString()} claims</p>
 <p><button id="go">Record video</button> <span id="st"></span></p>
 <p>Records the animation to a <code>.webm</code> and downloads it. Chrome or Edge — Safari does not
 support canvas recording. Add <code>voiceover.m4a</code> in any editor; the timings below match it.</p>
 <p id="timing"></p>
</div>
<script>
const SVGS = ${svgJson}, HOLD = ${holds};
const c = document.getElementById('c'), x = c.getContext('2d');
document.getElementById('timing').textContent = 'Frame holds: ' + HOLD.map(h => (h/1000)+'s').join(' · ') + '  (total ' + (HOLD.reduce((a,b)=>a+b,0)/1000) + 's)';
function load(svg){return new Promise((res,rej)=>{const i=new Image();
  i.onload=()=>res(i);i.onerror=rej;
  i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});}
async function run(record){
  const imgs = await Promise.all(SVGS.map(load));
  let rec=null, chunks=[];
  if(record){
    const stream=c.captureStream(30);
    const mime=['video/webm;codecs=vp9','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
    if(!mime){document.getElementById('st').textContent='This browser cannot record canvas.';return;}
    rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});
    rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{const b=new Blob(chunks,{type:'video/webm'});
      const a=document.createElement('a');a.href=URL.createObjectURL(b);
      a.download='${esc(r.county.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}-${esc(r.state.toLowerCase())}.webm';a.click();
      document.getElementById('st').textContent='Saved.';document.getElementById('go').disabled=false;};
    rec.start();
  }
  const FADE=380;
  for(let n=0;n<imgs.length;n++){
    const hold=HOLD[n]??2600, t0=performance.now();
    await new Promise(done=>{
      (function tick(){
        const e=performance.now()-t0;
        x.fillStyle='#0E1116';x.fillRect(0,0,1080,1920);
        if(n>0&&e<FADE){x.globalAlpha=1;x.drawImage(imgs[n-1],0,0);x.globalAlpha=e/FADE;}
        else x.globalAlpha=1;
        x.drawImage(imgs[n],0,0);x.globalAlpha=1;
        if(e>=hold)return done();
        requestAnimationFrame(tick);
      })();
    });
  }
  if(rec)rec.stop();
}
document.getElementById('go').onclick=()=>{
  document.getElementById('go').disabled=true;
  document.getElementById('st').textContent='Recording…';
  chunksReset(); run(true);
};
function chunksReset(){}
run(false);
</script></body></html>`;
}

function main() {
  const rows = load();
  const eligible = rows.filter((r) => r.claims >= MIN_CLAIMS && r.pctOutside >= MIN_PCT_OUTSIDE);
  const thinOnly = rows.filter((r) => r.claims < MIN_CLAIMS).length;
  const contradicts = rows.filter((r) => r.claims >= MIN_CLAIMS && r.pctOutside < MIN_PCT_OUTSIDE).length;
  const wantCounty = arg('county');
  const wantState = arg('state');
  const limit = Number(arg('limit') ?? 3);

  let picked: Row[];
  if (wantCounty) {
    const hit = rows.find((r) => r.county.toLowerCase() === wantCounty.toLowerCase() && (!wantState || r.state.toLowerCase() === wantState.toLowerCase()));
    if (!hit) throw new Error(`ABORT: no row for "${wantCounty}"${wantState ? `, ${wantState}` : ''} in the study data`);
    if (hit.claims < MIN_CLAIMS) {
      throw new Error(`ABORT: ${hit.county} ${hit.state} has ${hit.claims} classifiable claims, under the ${MIN_CLAIMS} minimum. A headline percentage on that few claims implies a pattern the sample cannot support -- the exact mistake that forced Risk Without Price to be rebuilt.`);
    }
    if (hit.pctOutside < MIN_PCT_OUTSIDE) {
      throw new Error(`ABORT: ${hit.county} ${hit.state} is ${hit.pctOutside}% outside the mapped zone, under the ${MIN_PCT_OUTSIDE}% floor. These cards argue that being outside the zone is no protection; here the zone caught ${100 - hit.pctOutside}% of the loss, so the card would contradict its own county's data. That county needs a different story, not this one with a smaller number in it.`);
    }
    picked = [hit];
  } else {
    // Most claims first: the biggest counties give the most defensible percentages AND the largest
    // potential audience. Sorting by percentage would surface the noisiest rows first.
    picked = [...eligible].sort((a, b) => b.claims - a.claims).slice(0, limit);
  }

  console.log(`\n  ${rows.length} counties in the study | ${eligible.length} eligible`);
  console.log(`  ${thinOnly} excluded: under ${MIN_CLAIMS} claims, too thin to carry a headline percentage`);
  console.log(`  ${contradicts} excluded: under ${MIN_PCT_OUTSIDE}% outside the zone -- the card's own argument does not hold there\n`);

  fs.mkdirSync(OUT, { recursive: true });
  for (const r of picked) {
    const slug = `${r.county}-${r.state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dir = path.join(OUT, slug);
    fs.mkdirSync(dir, { recursive: true });
    const fr = cards(r);
    for (const c of fr) fs.writeFileSync(path.join(dir, `${c.name}.svg`), c.svg);
    fs.writeFileSync(path.join(dir, 'script.txt'), `${script(r)}\n`);
    // Hold times are per-frame because the lines are not the same length -- a fixed interval would
    // cut the long ones off mid-read and leave the short ones sitting there.
    const holds = [3000, 3400, 3400, 4200, 3600];
    fs.writeFileSync(path.join(dir, 'record.html'), recorderHtml(fr, r, holds));
    if (process.argv.includes('--voice')) {
      const vo = script(r).split('\n').filter((l) => /^\d\./.test(l)).map((l) => l.replace(/^\d\.\s*/, '')).join(' ... ');
      const out = path.join(dir, 'voiceover.m4a');
      try {
        execFileSync('say', ['-o', out, '--file-format=m4af', '--data-format=aac', '-r', '175', vo], { stdio: 'ignore' });
      } catch {
        console.log('    (voiceover skipped -- `say` is macOS-only)');
      }
    }
    console.log(`  ${slug.padEnd(28)} ${String(r.pctOutside).padStart(3)}% outside | ${String(r.claims).padStart(6)} claims | ${money(r.paidUsd)}`);
    console.log(`  ${''.padEnd(28)} -> assets/short-video/${slug}/ (5 frames + script.txt)`);
  }
  console.log(`\n  SVG is the source format. Rasterise to PNG for video frames, or post frame 2 as a still.`);
  console.log(`  No synthetic presenter, no cloned voice -- see the header for why that is deliberate.\n`);
}

main();
