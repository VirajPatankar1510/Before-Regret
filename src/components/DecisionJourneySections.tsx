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
  onScrollToSearch?: () => void;
}

export const DecisionJourneySections: React.FC<DecisionJourneyProps> = ({ setView, onScrollToSearch }) => {

  const handleScrollClick = () => {
    if (onScrollToSearch) {
      onScrollToSearch();
    } else {
      const searchBox = document.getElementById('hero-search');
      const searchInput = document.getElementById('hero-search-input');
      if (searchBox) {
        searchBox.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      if (searchInput) {
        searchInput.focus();
      }
    }
  };

  return (
    <div className="bg-white text-slate-950 font-sans antialiased">
      
      {/* SEPARATED INTRO SECTION */}
      <section className="py-20 bg-gradient-to-b from-amber-50/20 to-orange-50/10 border-b border-orange-100/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl tracking-tight leading-tight">
              <span className="text-slate-400 font-light text-xs sm:text-sm uppercase tracking-wider block font-sans">The property visit shows you the apartment.</span>
              <span className="text-blue-600 font-semibold block mt-2">The resident tells you what living there is actually like.</span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mt-6 max-w-2xl mx-auto text-center sm:text-left font-sans">
              Before you pay a deposit or sign an agreement, speak with someone who already lives in the same building or society. Ask about water, parking, noise, internet reliability, neighbours, maintenance, safety, and everything else a 15-minute property visit cannot reveal.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION FOR PROPERTY LISTINGS VS RESIDENTS */}
      <section className="py-16 bg-slate-50/60 border border-slate-100/80 rounded-3xl mx-4 my-8 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="max-w-5xl mx-auto px-6">
          {/* PART 1: THE TRITICAL ASYMMETRY (Listing vs. Living) */}
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-slate-900 font-semibold tracking-tight text-lg font-sans text-center">
                Property listings are designed to help you discover homes.
              </p>
              <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed text-center font-sans mt-3">
                Residents help you understand what daily life is actually like after you move in. Both are useful—but they answer very different questions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gap Card 1 */}
              <div className="bg-white border border-slate-100/90 rounded-2xl p-7 shadow-2xs hover:shadow-md hover:border-slate-200/60 transition-all duration-300 space-y-4">
                <div className="p-2.5 bg-blue-50/60 text-blue-600 w-fit rounded-xl border border-blue-100/40">
                  <Droplet className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Water Security</h3>
                <div className="space-y-3 pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">What You See in Listing or During A Visit:</div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    "24/7 dual water supply lines with state-of-the-art filtration."
                  </p>
                  <div className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider font-mono bg-rose-50/60 px-2 py-0.5 rounded border border-rose-100/30 w-fit">The Resident Reveals:</div>
                  <p className="text-xs text-slate-800 font-normal leading-relaxed">
                    During summer, the society frequently depends on water tankers for several weeks. Most residents store extra water because supply can become unpredictable.
                  </p>
                </div>
              </div>

              {/* Gap Card 2 */}
              <div className="bg-white border border-slate-100/90 rounded-2xl p-7 shadow-2xs hover:shadow-md hover:border-slate-200/60 transition-all duration-300 space-y-4">
                <div className="p-2.5 bg-amber-50/60 text-amber-600 w-fit rounded-xl border border-amber-100/40">
                  <VolumeX className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Noise & Chaos</h3>
                <div className="space-y-3 pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">What You See in Listing or During A Visit:</div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    "The building seems peaceful during the afternoon."
                  </p>
                  <div className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider font-mono bg-rose-50/60 px-2 py-0.5 rounded border border-rose-100/30 w-fit">The Resident Reveals:</div>
                  <p className="text-xs text-slate-800 font-normal leading-relaxed">
                    Residents explained that nearby commercial deliveries begin early each morning, making certain apartments noisier than expected.
                  </p>
                </div>
              </div>

              {/* Gap Card 3 */}
              <div className="bg-white border border-slate-100/90 rounded-2xl p-7 shadow-2xs hover:shadow-md hover:border-slate-200/60 transition-all duration-300 space-y-4">
                <div className="p-2.5 bg-indigo-50/60 text-indigo-600 w-fit rounded-xl border border-indigo-100/40">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900">Parking</h3>
                <div className="space-y-3 pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">What You See in Listing or During A Visit:</div>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    "Visitor parking looks sufficient."
                  </p>
                  <div className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider font-mono bg-rose-50/60 px-2 py-0.5 rounded border border-rose-100/30 w-fit">The Resident Reveals:</div>
                  <p className="text-xs text-slate-800 font-normal leading-relaxed">
                    Residents mentioned visitor parking fills up quickly on weekends and guests often need to park outside the society.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MASTER UNIFIED JOURNEY SECTION */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 space-y-24">
          
          {/* PART 2: THE COST OF REGRET */}
          <div className="p-8 sm:p-10 bg-amber-50/20 border border-amber-100/60 rounded-3xl max-w-3xl shadow-xs relative overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100/60 border border-amber-200/50 text-amber-900 px-3.5 py-1.5 rounded-full font-mono inline-block">
              One Wrong Property Decision Can Stay With You For Years.
            </span>
            <h2 className="font-bold text-slate-900 tracking-tight leading-snug mt-6 text-xl sm:text-2xl">
              Real estate has no return policy. <br />Once you sign, you are locked in.
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-4 mt-6">
              <p>
                The most expensive mistakes are often the hardest to reverse.
              </p>
              <p>
                Choosing the wrong restaurant costs you a meal. Choosing the wrong phone costs you a few thousand rupees.
              </p>
              <p>
                Choosing the wrong home can affect your finances, daily routine, commute, and quality of life for years.
              </p>
              <p className="font-medium text-slate-900">
                That's why spending 20 minutes speaking with someone who already lives there can be one of the smartest parts of your decision-making process.
              </p>
            </div>
          </div>

          {/* PART 2.5: THE QUESTIONS MOST BUYERS ASK TOO LATE */}
          <div className="space-y-8 pt-8 border-t border-slate-200/60">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                The Questions Most Buyers Ask Too Late
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-light">
                These are the everyday questions that usually only come up after you've already moved in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  How long does it actually take to get a lift during rush hour?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  A property visit won't tell you.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  Is the neighbourhood just as quiet on weekends as it is on weekday afternoons?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  Only someone who lives there knows.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  Does visitor parking become difficult during evenings or weekends?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  A resident experiences it every week.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  How reliable is the water supply during summer?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  Residents know what happens when demand is highest.
                </p>
              </div>

              {/* Card 5 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  Is the internet reliable enough for work-from-home or video calls?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  Someone living there has already tested it.
                </p>
              </div>

              {/* Card 6 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  Do food delivery partners and cabs easily reach the building at night?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  A resident can tell you what everyday life is really like.
                </p>
              </div>

              {/* Card 7 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  How responsive is the society management when something goes wrong?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  Residents have firsthand experience—not assumptions.
                </p>
              </div>

              {/* Card 8 */}
              <div className="bg-white border border-slate-100/90 border-l-4 border-l-blue-500/20 hover:border-l-blue-500/80 rounded-2xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200/60 transition-all duration-300 space-y-3 group">
                <h4 className="font-medium text-base sm:text-lg text-slate-900 leading-snug tracking-tight">
                  What's one thing residents wish they had known before moving here?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide font-medium">
                  Sometimes, that's the most valuable question of all.
                </p>
              </div>
            </div>
          </div>

          {/* CTA 1: READY TO ASK YOUR OWN QUESTIONS */}
          <div className="max-w-3xl mx-auto pt-12 border-t border-slate-200/60 flex justify-center">
            <div className="w-full max-w-[700px] bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight pt-1">
                  Ready To Ask Your Own Questions?
                </h3>
              </div>

              {/* Pricing highlight box */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg mx-auto shadow-2xs">
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-slate-900 text-base">20-Minute Resident Chat</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Direct connection with an active resident</p>
                </div>
                <div className="text-center sm:text-right shrink-0 bg-white px-5 py-3 rounded-xl border border-slate-100/80 shadow-3xs">
                  <div className="text-2xl font-bold text-slate-950">₹299</div>
                  <div className="text-[8px] text-slate-400 font-bold font-mono tracking-wider mt-0.5">ONE-TIME CHARGE</div>
                </div>
              </div>

              {/* Key benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 max-w-md mx-auto text-left border-t border-slate-100 pt-6">
                {[
                  "Real Residents",
                  "Direct, private chat",
                  "Real-time answers to your questions",
                  "Rescheduled or fully refunded if offline"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="p-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleScrollClick}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm sm:text-base rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)] w-full sm:w-auto cursor-pointer"
                >
                  Find a Resident <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* PART 3: REVIEWS CONFLATION & ARITHMETIC SOBERITY */}
          <div className="pt-8 border-t border-slate-200/60 max-w-3xl space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 border border-cyan-100 px-3 py-1 rounded-full font-mono">
              Public Reviews vs. Conversation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Why public reviews aren't enough for a major property decision
            </h2>
            <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-5 font-normal">
              <p className="text-slate-400 font-semibold uppercase tracking-wider text-xs font-mono">
                A common question is:
              </p>
              <div className="border-l-2 border-slate-200 pl-4 py-1 my-4 bg-slate-50/50 pr-4 rounded-r-lg">
                <p className="text-slate-900 font-bold italic text-base">
                  "Can't I just check Google Reviews, Facebook groups, or housing forums?"
                </p>
              </div>
              <p>
                Absolutely—and you should. They can be a great starting point for researching an area.
              </p>
              <p>
                However, public reviews often answer broad questions rather than the specific concerns that matter to your situation. They may also be months or years old, and it's difficult to ask follow-up questions or verify whether the information still reflects current conditions.
              </p>
              <p className="text-slate-900 font-medium">
                A conversation with someone who lives there today lets you ask highly specific questions about daily life, such as water supply, parking, noise, internet reliability, commute, or community culture—details that are often difficult to find through public reviews alone.
              </p>
            </div>

            <div className="bg-amber-50/30 border border-amber-100/60 rounded-2xl p-8 shadow-3xs space-y-4">
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">Before You Spend Lakhs, Spend 20 Minutes.</h3>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3 font-normal">
                <p>
                  You may spend weeks comparing properties, negotiating prices, and visiting homes.
                </p>
                <p>
                  Spend just 20 minutes speaking with someone who already lives there before making one of life's biggest financial decisions.
                </p>
                <p className="text-slate-950 font-semibold">
                  For just ₹299, have a 20-minute conversation with someone who already lives in the same building or society.
                </p>
              </div>
            </div>
          </div>

          {/* PART 4: WHAT RESIDENTS CAN AND CAN'T HELP YOU WITH */}
          <div className="space-y-12 pt-8 border-t border-slate-200/60">
            <div className="space-y-4 max-w-3xl">
              <h2 className="font-bold text-slate-900 tracking-tight leading-tight text-xl sm:text-2xl">
                What Residents Can — And Can't — Help You With
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-light leading-relaxed">
                Residents share firsthand experience from living in the building or society. Their insights come from everyday life—not property listings, brochures, or a one-time site visit.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-12 pt-4">
              {/* CAN section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">What Residents CAN Help You Understand</h3>
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
                    <div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50/50 rounded-lg transition-colors duration-200">
                      <div className="p-1 bg-emerald-50 text-emerald-600 rounded-full shrink-0 mt-0.5 border border-emerald-100/60">
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
                  <h3 className="text-lg font-semibold text-slate-900">What Residents CANNOT Help You With</h3>
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
                    <div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50/50 rounded-lg transition-colors duration-200">
                      <div className="p-1 bg-slate-100 text-slate-500 rounded-full shrink-0 mt-0.5 border border-slate-200/60">
                        <X className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium leading-normal">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA 2: READY TO MAKE A SMARTER PROPERTY DECISION */}
          <div className="max-w-4xl mx-auto pt-16 border-t border-slate-200/60">
            <div className="bg-slate-50 text-slate-900 rounded-3xl p-10 sm:p-14 text-center space-y-8 shadow-xs border border-slate-200/80 relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <h3 className="font-bold tracking-tight text-slate-900 leading-tight text-2xl sm:text-3xl">
                  Ready To Make A Smarter Property Decision?
                </h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto pt-1 font-light leading-relaxed">
                  Don't rely solely on property listings or brochure promises. Speak with someone who understands daily life in the building before you sign.
                </p>
              </div>

              {/* Pricing Highlight Box */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg mx-auto shadow-2xs text-slate-900 relative z-10">
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-slate-900 text-base">Resident Chat</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Direct live connection with an active resident</p>
                </div>
                <div className="text-center sm:text-right shrink-0 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <div className="text-lg font-bold text-slate-950 font-mono">20 Min • ₹299</div>
                  <div className="text-[8px] text-slate-400 font-bold font-mono tracking-wider mt-0.5">ONE-TIME FEE</div>
                </div>
              </div>

              {/* Benefits list (horizontal list) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-y-4 gap-x-8 text-slate-600 text-xs sm:text-sm font-semibold max-w-xl mx-auto border-t border-slate-200/40 pt-6 relative z-10">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Local Resident Experts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Private & Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fast, Convenient Response</span>
                </div>
              </div>

              <div className="pt-4 space-y-3 relative z-10">
                <button
                  onClick={handleScrollClick}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-semibold text-sm sm:text-base rounded-xl transition-all shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.25)] w-full sm:w-auto cursor-pointer"
                >
                  Search Your Building →
                </button>
                <p className="text-[11px] text-slate-400 font-medium leading-normal">
                  No membership fees. Only pay when you connect with a resident.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

