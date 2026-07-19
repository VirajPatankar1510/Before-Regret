import React from 'react';
import { 
  Scale, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck,
  UserCheck,
  Droplet,
  VolumeX,
  ArrowRight
} from 'lucide-react';

interface DecisionJourneyProps {
  setView: (view: string) => void;
}

export const DecisionJourneySections: React.FC<DecisionJourneyProps> = ({ setView }) => {

  return (
    <div className="bg-white text-slate-950 font-sans antialiased">
      
      {/* MASTER UNIFIED JOURNEY SECTION */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 space-y-24">
          
          {/* PART 1: THE TRITICAL ASYMMETRY (Listing vs. Living) */}
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                The property visit shows you the apartment.<br />The resident tells you what living there is actually like.
              </h2>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed mt-4">
                Before you pay a deposit or sign an agreement, speak with someone who already lives in the same building or society. Ask about water, parking, noise, internet reliability, neighbours, maintenance, safety, and everything else a 15-minute property visit cannot reveal.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed mt-4 border-t border-slate-200/60 pt-4">
                Property listings are designed to help you discover homes. Residents help you understand what daily life is actually like after you move in. Both are useful—but they answer very different questions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gap Card 1 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 w-fit rounded-xl border border-blue-100/40">
                  <Droplet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Water Security</h3>
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">What You See in Listing or During A Visit:</div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "24/7 dual water supply lines with state-of-the-art filtration."
                  </p>
                  <div className="text-xs text-rose-500 font-bold uppercase tracking-wider font-mono pt-1">The Resident Reveals:</div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    During summer, the society frequently depends on water tankers for several weeks. Most residents store extra water because supply can become unpredictable.
                  </p>
                </div>
              </div>

              {/* Gap Card 2 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 w-fit rounded-xl border border-amber-100/40">
                  <VolumeX className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Noise & Chaos</h3>
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">What You See in Listing or During A Visit:</div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "The building seems peaceful during the afternoon."
                  </p>
                  <div className="text-xs text-rose-500 font-bold uppercase tracking-wider font-mono pt-1">The Resident Reveals:</div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    Residents explained that nearby commercial deliveries begin early each morning, making certain apartments noisier than expected.
                  </p>
                </div>
              </div>

              {/* Gap Card 3 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 w-fit rounded-xl border border-indigo-100/40">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Parking</h3>
                <div className="space-y-3 pt-1">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">What You See in Listing or During A Visit:</div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "Visitor parking looks sufficient."
                  </p>
                  <div className="text-xs text-rose-500 font-bold uppercase tracking-wider font-mono pt-1">The Resident Reveals:</div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    Residents mentioned visitor parking fills up quickly on weekends and guests often need to park outside the society.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PART 2: THE COST OF REGRET */}
          <div className="pt-8 border-t border-slate-200/60 max-w-3xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100/60 px-3 py-1 rounded-full font-mono">
              One Wrong Property Decision Can Stay With You For Years.
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mt-6">
              Real estate has no return policy. <br />Once you sign, you are locked in.
            </h2>
            <div className="text-sm text-slate-600 font-semibold leading-relaxed space-y-4 mt-6">
              <p>
                The most expensive mistakes are often the hardest to reverse.
              </p>
              <p>
                Choosing the wrong restaurant costs you a meal. Choosing the wrong phone costs you a few thousand rupees.
              </p>
              <p>
                Choosing the wrong home can affect your finances, daily routine, commute, and quality of life for years.
              </p>
              <p>
                That's why spending 20 minutes speaking with someone who already lives there can be one of the smartest parts of your decision-making process.
              </p>
            </div>
          </div>

          {/* PART 2.5: THE QUESTIONS MOST BUYERS ASK TOO LATE */}
          <div className="space-y-8 pt-8 border-t border-slate-200/60">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                The Questions Most Buyers Ask Too Late
              </h3>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                These are the everyday questions that usually only come up after you've already moved in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  How long does it actually take to get a lift during rush hour?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  A property visit won't tell you.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Is the neighbourhood just as quiet on weekends as it is on weekday afternoons?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Only someone who lives there knows.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Does visitor parking become difficult during evenings or weekends?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  A resident experiences it every week.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  How reliable is the water supply during summer?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Residents know what happens when demand is highest.
                </p>
              </div>

              {/* Card 5 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Is the internet reliable enough for work-from-home or video calls?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Someone living there has already tested it.
                </p>
              </div>

              {/* Card 6 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Do food delivery partners and cabs easily reach the building at night?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  A resident can tell you what everyday life is really like.
                </p>
              </div>

              {/* Card 7 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  How responsive is the society management when something goes wrong?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Residents have firsthand experience—not assumptions.
                </p>
              </div>

              {/* Card 8 */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 space-y-2">
                <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  What's one thing residents wish they had known before moving here?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Sometimes, that's the most valuable question of all.
                </p>
              </div>
            </div>
          </div>

          {/* PART 3: REVIEWS CONFLATION & ARITHMETIC SOBERITY */}
          <div className="pt-8 border-t border-slate-200/60 max-w-3xl space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 border border-cyan-100/60 px-3 py-1 rounded-full font-mono">
              Public Reviews vs. Conversation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Why public reviews aren't enough for a major property decision
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed space-y-4 font-medium">
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-xs font-mono">
                A common question is:
              </p>
              <p className="text-slate-900 font-bold italic text-base">
                "Can't I just check Google Reviews, Facebook groups, or housing forums?"
              </p>
              <p>
                Absolutely—and you should. They can be a great starting point for researching an area.
              </p>
              <p>
                However, public reviews often answer broad questions rather than the specific concerns that matter to your situation. They may also be months or years old, and it's difficult to ask follow-up questions or verify whether the information still reflects current conditions.
              </p>
              <p className="text-slate-950 font-bold">
                A conversation with someone who lives there today lets you ask highly specific questions about daily life, such as water supply, parking, noise, internet reliability, commute, or community culture—details that are often difficult to find through public reviews alone.
              </p>
            </div>

            <div className="border-t border-slate-200/60 pt-6 space-y-3">
              <h3 className="font-bold text-slate-900 text-lg">Before You Spend Lakhs, Spend 20 Minutes.</h3>
              <div className="text-sm text-slate-600 font-medium space-y-3">
                <p>
                  You may spend weeks comparing properties, negotiating prices, and visiting homes.
                </p>
                <p>
                  Spend just 20 minutes speaking with someone who already lives there before making one of life's biggest financial decisions.
                </p>
                <p className="text-slate-950 font-bold">
                  For just ₹299, have a 20-minute conversation with someone who already lives in the same building or society.
                </p>
              </div>
            </div>
          </div>

          {/* PART 4: WHAT RESIDENTS CAN AND CAN'T HELP YOU WITH */}
          <div className="space-y-12 pt-8 border-t border-slate-200/60">
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                What Residents Can — And Can't — Help You With
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-semibold leading-relaxed">
                Residents share firsthand experience from living in the building or society. Their insights come from everyday life—not property listings, brochures, or a one-time site visit.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                This section should clearly explain the scope of a resident consultation and build trust by setting realistic expectations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-12 pt-4">
              {/* CAN section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">✅</span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">What Residents CAN Help You Understand</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Water supply reliability throughout the year",
                    "Parking availability for residents and visitors",
                    "Noise levels during mornings, evenings, weekends, and festivals",
                    "Internet speed and reliability for work-from-home",
                    "Electricity outages and generator backup experience",
                    "Lift waiting times during peak hours",
                    "Society maintenance quality and responsiveness",
                    "Safety, security, and visitor entry procedures",
                    "Community culture and neighbour friendliness",
                    "Whether the society is family-friendly, pet-friendly, or tenant-friendly",
                    "Delivery, cab access, and convenience of daily services",
                    "Hidden monthly expenses or recurring society charges",
                    "Traffic and commuting experience during peak hours",
                    "Everyday inconveniences residents have learned to live with",
                    "Things they personally wish they had known before moving in"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-50 text-emerald-600 rounded-full shrink-0 mt-0.5 border border-emerald-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 font-medium leading-normal">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CANNOT section */}
              <div className="space-y-6 pt-6 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">❌</span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">What Residents CANNOT Help You With</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Legal title verification or ownership disputes",
                    "Property valuation or future price appreciation",
                    "Investment or financial advice",
                    "Structural engineering inspections or construction quality certifications",
                    "Official government approvals or regulatory compliance",
                    "Tax, home loan, or legal documentation advice",
                    "Guaranteed future infrastructure or development projects",
                    "Information outside their own personal experience"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="p-1 bg-slate-100 text-slate-500 rounded-full shrink-0 mt-0.5 border border-slate-200">
                        <X className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium leading-normal">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

