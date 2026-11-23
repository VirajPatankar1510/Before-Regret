import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ContentLink } from './ContentLink';

/**
 * "What a Listing Won't Tell You": nine things a listing photo never shows, each linking to the guide
 * or tool that answers it. Every year range quoted here is the same range PRIORITY_RULES uses in the
 * report (knob-and-tube to 1955, cast iron to 1973, polybutylene 1978-1996, panel brands 1950-1989);
 * claims stay calm and factual, never alarming.
 *
 * 2026-11-19, owner: the cutaway house illustration was removed (first restyled as line art the same
 * day, then dropped). The nine questions and links are the part that does the work, so they stay,
 * now as a card grid. The x/y fields on SPOTS were the illustration's marker positions and went with it.
 */

interface Spot { n: number; q: string; a: string; href: string; tag?: string }

const SPOTS: Spot[] = [
  { n: 1, q: 'How old is the roof?', a: 'Read the clues on a showing, then confirm the date with the permit or the invoice.', href: '/guides/how-to-tell-how-old-a-roof-is/' },
  // 2026-10-05, owner: worded as the search people make, matching the /sunlight/ page's own title.
  { n: 2, q: 'Which direction should a house face?', a: 'See how much direct sun each room gets through the year, for the way the house faces.', href: '/sunlight/', tag: 'Free tool · No sign-up' },
  { n: 3, q: 'What is inside the walls?', a: 'Houses built before 1956 can still have knob-and-tube wiring behind the plaster.', href: '/guides/what-is-knob-and-tube-wiring/' },
  { n: 4, q: 'What are the water pipes made of?', a: 'Copper, PEX, galvanized or polybutylene: a magnet and a coin tell most of them apart.', href: '/guides/identify-water-pipes-pex-copper-galvanized/' },
  { n: 5, q: 'Which electrical panel is it?', a: 'The brand is on the label inside the door. A few from 1950–1989 get a closer look.', href: '/guides/identify-electrical-panel-brand/' },
  { n: 6, q: 'Is the pipe from the street lead?', a: 'Your water utility keeps a public record of the service line, by address.', href: '/guides/lead-service-line-lookup-by-address/' },
  { n: 7, q: 'Is the sewer line cast iron?', a: 'Houses built before 1974 may have cast iron sewer lines. A camera scope shows their condition.', href: '/guides/why-cast-iron-pipes-corrode/' },
  { n: 8, q: 'Is that crack a problem?', a: 'When a foundation crack calls for a structural engineer, and when it does not.', href: '/guides/when-foundation-crack-need-structural-engineer/' },
  { n: 9, q: 'Was the deck permitted?', a: 'Look up a property’s permit history by address, in any US county.', href: '/guides/look-up-building-permits-by-address/' },
];

export const HouseXraySection: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => (
  <section className="bg-home-stone py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto home-reveal">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-base sm:text-lg font-semibold text-slate-500">Look behind the listing photos</p>
        <h2 className="mt-3 font-serif text-4xl sm:text-6xl font-semibold text-home-ink tracking-[-0.025em] [text-wrap:balance]">What a Listing Won&rsquo;t Tell You</h2>
      </div>

      <ol className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SPOTS.map((s) => (
          <li key={s.n} className="flex">
            <ContentLink
              href={s.href}
              onNavigate={onNavigate}
              className="group flex w-full gap-3 rounded-3xl bg-white p-5 sm:p-6 transition-transform hover:-translate-y-0.5"
            >
              <span className="shrink-0 w-7 h-7 rounded-full bg-home-mist text-slate-500 text-xs font-semibold flex items-center justify-center">{s.n}</span>
              <span className="min-w-0 flex flex-col">
                <span className="block text-base font-bold text-home-ink">{s.q}</span>
                {s.tag && (
                  <span className="mt-1.5 self-start inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-600" />{s.tag}</span>
                )}
                <span className="mt-1 block text-sm text-slate-600 leading-relaxed">{s.a}</span>
                <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:underline underline-offset-2">
                  Learn more <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </span>
            </ContentLink>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
