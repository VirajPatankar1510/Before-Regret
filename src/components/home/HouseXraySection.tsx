import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ContentLink } from './ContentLink';

/**
 * "What a Listing Won't Tell You", as a cutaway house (2026-10-04 redesign). The illustration is the
 * page's signature element: it shows, literally, the parts of a home a listing photo never does.
 * Each numbered spot links to the guide or tool that answers it. Every year range quoted here is
 * the same range PRIORITY_RULES uses in the report (knob-and-tube to 1955, cast iron to 1973,
 * polybutylene 1978-1996, panel brands 1950-1989); claims stay calm and factual, never alarming.
 *
 * The list beside the drawing carries every item as a real link, so the static HTML has all nine
 * links and descriptions; the numbered spots only change which one is highlighted.
 */

interface Spot { n: number; x: number; y: number; q: string; a: string; href: string; tag?: string }

const SPOTS: Spot[] = [
  { n: 1, x: 50, y: 20, q: 'How old is the roof?', a: 'Read the clues on a showing, then confirm the date with the permit or the invoice.', href: '/guides/how-to-tell-how-old-a-roof-is/' },
  // 2026-10-05, owner: worded as the search people make, matching the /sunlight/ page's own title.
  { n: 2, x: 30, y: 41, q: 'Which direction should a house face?', a: 'See how much direct sun each room gets through the year, for the way the house faces.', href: '/sunlight/', tag: 'Free tool · No sign-up' },
  { n: 3, x: 40, y: 58, q: 'What is inside the walls?', a: 'Houses built before 1956 can still have knob-and-tube wiring behind the plaster.', href: '/guides/what-is-knob-and-tube-wiring/' },
  { n: 4, x: 67, y: 61, q: 'What are the water pipes made of?', a: 'Copper, PEX, galvanized or polybutylene: a magnet and a coin tell most of them apart.', href: '/guides/identify-water-pipes-pex-copper-galvanized/' },
  { n: 5, x: 27, y: 77, q: 'Which electrical panel is it?', a: 'The brand is on the label inside the door. A few from 1950–1989 get a closer look.', href: '/guides/identify-electrical-panel-brand/' },
  { n: 6, x: 9, y: 84, q: 'Is the pipe from the street lead?', a: 'Your water utility keeps a public record of the service line, by address.', href: '/guides/lead-service-line-lookup-by-address/' },
  { n: 7, x: 74, y: 94, q: 'Is the sewer line cast iron?', a: 'Houses built before 1974 may have cast iron sewer lines. A camera scope shows their condition.', href: '/guides/why-cast-iron-pipes-corrode/' },
  { n: 8, x: 47, y: 89, q: 'Is that crack a problem?', a: 'When a foundation crack calls for a structural engineer, and when it does not.', href: '/guides/when-foundation-crack-need-structural-engineer/' },
  { n: 9, x: 89, y: 64, q: 'Was the deck permitted?', a: 'Look up a property’s permit history by address, in any US county.', href: '/guides/look-up-building-permits-by-address/' },
];

// 2026-11-19 restyle (owner: the old drawing "feels off and doesn't match our layout/theme"). Same house
// geometry, so the SPOTS coordinates above still land, but drawn the way the guide diagrams are: thin navy
// linework on paper, no scenery, and one site colour per system (brass wiring, slate water, brick sewer).
// Colours are the --color-home-* tokens from src/index.css; SVG attributes can't read CSS variables
// through Tailwind classes, so they are written out here and must move with those tokens.
const C = { ink: '#1b2a40', line: '#c9bfae', linen: '#ece6dc', paper: '#fbf9f5', oak: '#b8895c', brass: '#7f5f35', water: '#4f6f8f', brick: '#9b4a3a', sunlit: '#f4e7d1' };
const XRAY_LEGEND = [
  { label: 'Wiring', color: C.brass, dash: true },
  { label: 'Water supply', color: C.water, dash: false },
  { label: 'Sewer line', color: C.brick, dash: false },
];

const HouseCutaway: React.FC = () => (
  <svg viewBox="0 0 640 520" className="w-full h-auto" role="img" aria-label="Line drawing of a two-storey house cut away to show the roof, wiring, water pipes, electrical panel, sewer line, foundation and a rear deck">
    <defs>
      <pattern id="xray-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20 0 H0 V20" fill="none" stroke={C.linen} strokeWidth="1" />
      </pattern>
      <pattern id="xray-soil" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="12" stroke={C.line} strokeWidth="1.2" />
      </pattern>
    </defs>
    {/* drafting paper, then soil hatching below grade */}
    <rect x="0" y="0" width="640" height="520" fill={C.paper} />
    <rect x="0" y="0" width="640" height="360" fill="url(#xray-grid)" opacity="0.7" />
    <rect x="0" y="360" width="640" height="160" fill="url(#xray-soil)" opacity="0.8" />
    <line x1="0" y1="360" x2="640" y2="360" stroke={C.ink} strokeWidth="2" />

    {/* sun, as a drafting mark, and its path into the upper-left room */}
    <circle cx="566" cy="70" r="16" fill="none" stroke={C.oak} strokeWidth="2" />
    <g stroke={C.oak} strokeWidth="2" strokeLinecap="round">
      <line x1="566" y1="40" x2="566" y2="46" /><line x1="566" y1="94" x2="566" y2="100" /><line x1="536" y1="70" x2="542" y2="70" /><line x1="590" y1="70" x2="596" y2="70" />
    </g>
    <g stroke={C.oak} strokeWidth="1.5" strokeDasharray="5 6" fill="none">
      <line x1="548" y1="82" x2="224" y2="200" /><line x1="552" y1="88" x2="224" y2="236" />
    </g>

    {/* basement and footing */}
    <rect x="120" y="360" width="400" height="110" fill="#ffffff" stroke={C.ink} strokeWidth="2" />
    <rect x="112" y="470" width="416" height="10" fill={C.linen} stroke={C.ink} strokeWidth="1.5" />
    <path d="M300 470 l5 -12 l-4 -7 l3 -6" stroke={C.brick} strokeWidth="1.5" fill="none" strokeLinecap="round" />

    {/* chimney sits behind the roof, so it is drawn first */}
    <rect x="418" y="80" width="30" height="80" fill="#ffffff" stroke={C.ink} strokeWidth="2" />
    <polygon points="98,178 320,58 542,178" fill="#ffffff" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
    <g stroke={C.line} strokeWidth="1">
      <line x1="150" y1="160" x2="490" y2="160" /><line x1="190" y1="138" x2="450" y2="138" /><line x1="232" y1="115" x2="408" y2="115" /><line x1="272" y1="92" x2="368" y2="92" />
    </g>

    {/* two floors, cut away */}
    <rect x="120" y="178" width="400" height="182" fill="#ffffff" stroke={C.ink} strokeWidth="2.5" />
    <line x1="120" y1="265" x2="520" y2="265" stroke={C.ink} strokeWidth="1.5" />

    {/* windows: the sunlit one is tinted */}
    <rect x="160" y="192" width="64" height="50" fill={C.sunlit} stroke={C.ink} strokeWidth="2" />
    <line x1="192" y1="192" x2="192" y2="242" stroke={C.ink} strokeWidth="1.5" />
    <rect x="420" y="192" width="64" height="50" fill="#ffffff" stroke={C.ink} strokeWidth="2" />
    <line x1="452" y1="192" x2="452" y2="242" stroke={C.ink} strokeWidth="1.5" />

    {/* front door */}
    <rect x="296" y="292" width="48" height="68" fill={C.linen} stroke={C.ink} strokeWidth="2" />
    <circle cx="335" cy="328" r="2.5" fill={C.ink} />

    {/* wiring in the walls, from the panel up */}
    <path d="M176 378 V 300 H 260 V 214 M176 300 V 268" stroke={C.brass} strokeWidth="2.5" strokeDasharray="7 5" fill="none" strokeLinecap="round" />
    <circle cx="260" cy="214" r="4.5" fill="#ffffff" stroke={C.brass} strokeWidth="2" />

    {/* water supply, street to sink */}
    <rect x="2" y="428" width="16" height="18" rx="3" fill="#ffffff" stroke={C.water} strokeWidth="2" />
    <path d="M18 437 H 130 V 430 H 400 V 318" stroke={C.water} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

    {/* sink cabinet */}
    <rect x="372" y="302" width="84" height="56" fill="#ffffff" stroke={C.ink} strokeWidth="2" />
    <line x1="366" y1="302" x2="462" y2="302" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
    <line x1="414" y1="310" x2="414" y2="350" stroke={C.line} strokeWidth="1.5" />

    {/* sewer, sloping from the basement to the street */}
    <path d="M330 470 L 470 490 L 612 498" stroke={C.brick} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="612" y="488" width="24" height="20" rx="3" fill="#ffffff" stroke={C.brick} strokeWidth="2" />

    {/* electrical panel */}
    <rect x="160" y="378" width="32" height="46" rx="2" fill="#ffffff" stroke={C.ink} strokeWidth="2" />
    <g stroke={C.ink} strokeWidth="1.2"><line x1="167" y1="388" x2="185" y2="388" /><line x1="167" y1="396" x2="185" y2="396" /><line x1="167" y1="404" x2="185" y2="404" /><line x1="167" y1="412" x2="185" y2="412" /></g>

    {/* water heater */}
    <rect x="436" y="384" width="40" height="76" rx="16" fill="#ffffff" stroke={C.ink} strokeWidth="1.5" />

    {/* rear deck */}
    <g stroke={C.ink} strokeWidth="2" strokeLinecap="round">
      <line x1="520" y1="332" x2="616" y2="332" /><line x1="530" y1="332" x2="530" y2="360" /><line x1="606" y1="332" x2="606" y2="360" />
    </g>
    <g stroke={C.ink} strokeWidth="1.5" strokeLinecap="round">
      <line x1="520" y1="306" x2="616" y2="306" /><line x1="540" y1="306" x2="540" y2="332" /><line x1="568" y1="306" x2="568" y2="332" /><line x1="596" y1="306" x2="596" y2="332" /><line x1="616" y1="306" x2="616" y2="332" />
    </g>
  </svg>
);

export const HouseXraySection: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [active, setActive] = useState(1);
  return (
    <section className="bg-home-stone py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto home-reveal">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-home-brass">Look behind the listing photos</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold text-home-ink tracking-tight">What a Listing Won&rsquo;t Tell You</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
            Listings are written to sell the house. Here&rsquo;s what the photos don&rsquo;t show, and how to check each one.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="relative rounded-3xl bg-[#fbf9f5] border border-home-linen p-3 sm:p-5 shadow-sm">
            <div className="relative">
              <HouseCutaway />
              {SPOTS.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setActive(s.n)}
                  onMouseEnter={() => setActive(s.n)}
                  aria-label={`${s.n}. ${s.q}`}
                  aria-pressed={active === s.n}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center border-2 transition-all cursor-pointer ${
                    active === s.n ? 'bg-home-navy text-white border-white scale-110 shadow-lg' : 'bg-white text-home-navy border-home-oak home-pulse'
                  }`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                >
                  {s.n}
                </button>
              ))}
            </div>
            <ul aria-hidden="true" className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-xs font-medium text-slate-600">
              {XRAY_LEGEND.map((l) => (
                <li key={l.label} className="inline-flex items-center gap-2">
                  <svg width="22" height="6" viewBox="0 0 22 6"><line x1="1" y1="3" x2="21" y2="3" stroke={l.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={l.dash ? '5 4' : undefined} /></svg>
                  {l.label}
                </li>
              ))}
            </ul>
          </div>

          <ol className="space-y-2">
            {SPOTS.map((s) => {
              const on = active === s.n;
              return (
                <li key={s.n}>
                  <ContentLink
                    href={s.href}
                    onNavigate={onNavigate}
                    className={`group flex gap-3 rounded-2xl border p-3.5 transition-colors ${on ? 'bg-white border-home-oak shadow-sm' : 'border-transparent hover:bg-white/70'}`}
                  >
                    <span className={`shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${on ? 'bg-home-navy text-white' : 'bg-home-linen text-home-navy'}`}>{s.n}</span>
                    <span className="min-w-0">
                      <span className="block text-sm sm:text-base font-bold text-home-ink">{s.q}</span>
                      {s.tag && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#f2c98f] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-home-navy shadow-sm ring-1 ring-home-oak/50"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-home-brick" />{s.tag}</span>
                      )}
                      <span className="block text-sm text-slate-600 leading-relaxed">{s.a}</span>
                      <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold text-home-brass ${on ? '' : 'sr-only group-hover:not-sr-only'}`}>
                        Read more <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </span>
                  </ContentLink>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};
