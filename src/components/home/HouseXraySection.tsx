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

interface Spot { n: number; x: number; y: number; q: string; a: string; href: string }

const SPOTS: Spot[] = [
  { n: 1, x: 50, y: 20, q: 'How old is the roof?', a: 'Roof age matters for insurance, and a re-roofing permit is the clearest record of it.', href: '/guides/prove-roof-age-for-insurance/' },
  { n: 2, x: 30, y: 41, q: 'Which rooms get the sun?', a: 'See how much direct sun each room gets through the year, for the way the house faces.', href: '/sunlight/' },
  { n: 3, x: 40, y: 58, q: 'What is inside the walls?', a: 'Houses built before 1956 can still have knob-and-tube wiring behind the plaster.', href: '/guides/what-is-knob-and-tube-wiring/' },
  { n: 4, x: 67, y: 61, q: 'What are the water pipes made of?', a: 'Houses built 1978–1996 may have polybutylene supply lines. Here is how to tell.', href: '/guides/spot-polybutylene-pipes-before-buying-house/' },
  { n: 5, x: 27, y: 77, q: 'Which electrical panel is it?', a: 'A few panel brands from 1950–1989 are ones inspectors look at closely.', href: '/guides/federal-pacific-stab-lok-panel-inspectors-flag/' },
  { n: 6, x: 9, y: 84, q: 'Is the pipe from the street lead?', a: 'Your water utility keeps a public record of the service line, by address.', href: '/guides/lead-service-line-lookup-by-address/' },
  { n: 7, x: 74, y: 94, q: 'Is the sewer line cast iron?', a: 'Houses built before 1974 may have cast iron sewer lines. A camera scope shows their condition.', href: '/guides/why-cast-iron-pipes-corrode/' },
  { n: 8, x: 47, y: 89, q: 'Is that crack a problem?', a: 'When a foundation crack calls for a structural engineer, and when it does not.', href: '/guides/when-foundation-crack-need-structural-engineer/' },
  { n: 9, x: 89, y: 64, q: 'Was the deck permitted?', a: 'Look up a property’s permit history by address, in any US county.', href: '/guides/look-up-building-permits-by-address/' },
];

const HouseCutaway: React.FC = () => (
  <svg viewBox="0 0 640 520" className="w-full h-auto" role="img" aria-label="Cutaway illustration of a two-storey house showing the roof, wiring, water pipes, electrical panel, sewer line, foundation and a rear deck">
    {/* sky and sun */}
    <circle cx="560" cy="70" r="34" fill="#f4c983" opacity="0.9" />
    {/* ground and soil */}
    <rect x="0" y="360" width="640" height="160" fill="#c8b79e" />
    <rect x="0" y="352" width="640" height="12" fill="#6f8b64" />
    {/* water main and sewer main at the street (left / right edges) */}
    <rect x="0" y="425" width="18" height="22" rx="4" fill="#4f7aa6" />
    <rect x="610" y="490" width="30" height="24" rx="4" fill="#7a5c43" />
    {/* basement */}
    <rect x="120" y="360" width="400" height="112" fill="#e6ddd0" stroke="#9a8b78" strokeWidth="4" />
    <rect x="112" y="468" width="416" height="12" fill="#9a8b78" />
    <path d="M300 472 l6 -14 l-5 -8" stroke="#7d6e5d" strokeWidth="2" fill="none" />
    {/* house body: two floors, cut away */}
    <rect x="120" y="170" width="400" height="190" fill="#f5efe6" stroke="#8a7966" strokeWidth="4" />
    <rect x="120" y="262" width="400" height="6" fill="#8a7966" />
    {/* roof + chimney */}
    <rect x="418" y="78" width="30" height="72" fill="#7a5a48" />
    <polygon points="98,178 320,58 542,178" fill="#4a3b33" />
    <g stroke="#5c4a40" strokeWidth="2" opacity="0.6">
      <line x1="150" y1="160" x2="490" y2="160" /><line x1="190" y1="138" x2="450" y2="138" /><line x1="232" y1="115" x2="408" y2="115" /><line x1="272" y1="92" x2="368" y2="92" />
    </g>
    {/* windows */}
    <rect x="160" y="192" width="64" height="50" fill="#f6d79e" stroke="#8a7966" strokeWidth="4" />
    <line x1="192" y1="192" x2="192" y2="242" stroke="#8a7966" strokeWidth="3" />
    <rect x="420" y="192" width="64" height="50" fill="#dfe8ef" stroke="#8a7966" strokeWidth="4" />
    {/* sun beam into upper window */}
    <polygon points="545,90 224,196 224,238" fill="#f6d79e" opacity="0.28" />
    {/* wiring in walls (amber, dashed) from panel up */}
    <path d="M175 392 V 300 H 260 V 214 M175 300 V 268" stroke="#d08b2c" strokeWidth="4" strokeDasharray="8 6" fill="none" strokeLinecap="round" />
    <circle cx="260" cy="214" r="6" fill="#d08b2c" />
    {/* water supply (blue) from street up to the sink */}
    <path d="M18 436 H 130 V 430 H 400 V 318" stroke="#4f7aa6" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* sink cabinet */}
    <rect x="372" y="300" width="84" height="56" fill="#cdbba3" stroke="#8a7966" strokeWidth="3" />
    <rect x="380" y="292" width="68" height="10" fill="#8a7966" />
    {/* sewer (brown, sloping) from basement to street */}
    <path d="M330 472 L 470 492 L 612 500" stroke="#7a5c43" strokeWidth="9" fill="none" strokeLinecap="round" />
    {/* electrical panel */}
    <rect x="160" y="378" width="32" height="46" rx="3" fill="#7d8792" stroke="#4f5964" strokeWidth="3" />
    {/* water heater */}
    <rect x="436" y="384" width="40" height="78" rx="18" fill="#c9ced3" stroke="#7d8792" strokeWidth="3" />
    {/* rear deck */}
    <rect x="520" y="330" width="96" height="10" fill="#a07a55" />
    <g stroke="#a07a55" strokeWidth="5"><line x1="530" y1="340" x2="530" y2="360" /><line x1="606" y1="340" x2="606" y2="360" /></g>
    <g stroke="#a07a55" strokeWidth="3"><line x1="520" y1="306" x2="616" y2="306" /><line x1="540" y1="306" x2="540" y2="330" /><line x1="568" y1="306" x2="568" y2="330" /><line x1="596" y1="306" x2="596" y2="330" /></g>
    {/* front door + porch hint */}
    <rect x="296" y="292" width="48" height="68" fill="#2f4a3a" stroke="#8a7966" strokeWidth="4" />
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
            Listings are written to sell the home. This report is written to tell you what to check, what to ask, and what nobody has verified yet.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#dfe8ef] to-home-stone border border-home-linen p-3 sm:p-5 shadow-sm">
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
                      <span className="block text-sm text-slate-600 leading-relaxed">{s.a}</span>
                      <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 ${on ? '' : 'sr-only group-hover:not-sr-only'}`}>
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
