import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Quote, 
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface WhyBeforeRegretProps {
  onSearchClick: () => void;
  onBecomeContributor: () => void;
}

const AnimatedSpendAmount: React.FC = () => {
  const words = ['Lakhs', 'Or', 'Even', 'Crores'];
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;

    const startAnimation = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      // Smooth sequence with readable pauses: Lakhs -> Or -> Even -> Crores
      // First change happens after 500ms of reaching the screen center
      setTimeout(() => {
        setIndex(1); // "Or"
        setTimeout(() => {
          setIndex(2); // "Even"
          setTimeout(() => {
            setIndex(3); // "Crores"
          }, 1000);
        }, 1000);
      }, 500);
    };

    const checkPosition = () => {
      if (!el || hasTriggeredRef.current) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      
      // Calculate vertical center of the component
      const elementCenter = rect.top + rect.height / 2;
      const screenCenter = vh / 2;

      // Only trigger when the component's center reaches or crosses the vertical center of the screen
      if (elementCenter <= screenCenter) {
        startAnimation();
      }
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkPosition);
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    
    // Initial check in case it loads already past center
    checkPosition();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className="inline-block text-center align-baseline relative font-black text-slate-900 text-[1.25em] w-[3.6em] shrink-0"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const PriceGuessReveal: React.FC = () => {
  const [sliderValue, setSliderValue] = useState<number>(2999);
  const [hasMoved, setHasMoved] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [animIndex, setAnimIndex] = useState<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const revealWords = ["Nope", "Get", "Now", "At", "Just", "Rs. 399."];

  const triggerReveal = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!hasMoved || isPending || revealed) return;
    
    setIsPending(true);
    // Relaxed pause of 800ms after slider release so user sees their chosen price
    setTimeout(() => {
      setRevealed(true);
    }, 800);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
    setHasMoved(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    // Auto-trigger if slider stops moving for 1400ms
    debounceTimerRef.current = setTimeout(() => {
      triggerReveal();
    }, 1400);
  };

  useEffect(() => {
    if (!revealed) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNext = (currentIndex: number) => {
      if (currentIndex >= revealWords.length - 1) return;

      // Subtle pause after "Nope" (index 0)
      const delay = currentIndex === 0 ? 1500 : 950;

      timeoutId = setTimeout(() => {
        setAnimIndex(currentIndex + 1);
        scheduleNext(currentIndex + 1);
      }, delay);
    };

    scheduleNext(0);

    return () => clearTimeout(timeoutId);
  }, [revealed]);

  return (
    <div className="my-6 max-w-sm mx-auto p-5 bg-white border border-slate-200 rounded-2xl shadow-xl min-h-[128px] flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="slider-box"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-3 text-center"
          >
            <div className="flex items-center justify-between font-semibold text-slate-800 px-1">
              <span className="text-blue-600 font-bold uppercase tracking-wider text-[14px]">Guess The Price:</span>
              <span className="font-mono text-emerald-600 font-bold text-[18px]">
                Rs. {sliderValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type="range"
                min={1299}
                max={4999}
                step={100}
                value={sliderValue}
                onChange={handleSliderChange}
                onMouseUp={triggerReveal}
                onTouchEnd={triggerReveal}
                className="w-full h-2.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex justify-center text-[11px] font-mono px-1">
              <span className="text-[#000000] font-semibold animate-pulse">
                {isPending ? "Revealing real price..." : "Drag slider to guess"}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal-box"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center text-center space-y-1"
          >
            {animIndex === revealWords.length - 1 ? (
              <motion.span
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[12px] font-mono uppercase text-emerald-600 tracking-widest font-bold"
              >
                Unlocked Price
              </motion.span>
            ) : (
              <span className="text-[12px] font-mono uppercase text-transparent tracking-widest select-none">
                &nbsp;
              </span>
            )}
            <div className="h-12 flex items-center justify-center">
              <span className="inline-block text-center align-middle relative font-black text-slate-900 text-2xl sm:text-3xl w-[8em] shrink-0">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={revealWords[animIndex]}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className={`inline-block ${
                      animIndex === revealWords.length - 1
                        ? 'text-emerald-600 text-3xl sm:text-4xl font-extrabold drop-shadow-sm'
                        : animIndex === 0
                        ? 'text-red-500 font-bold'
                        : 'text-blue-600 font-bold'
                    }`}
                  >
                    {revealWords[animIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WhyBeforeRegret: React.FC<WhyBeforeRegretProps> = ({
  onSearchClick,
  onBecomeContributor,
}) => {
  return (
    <div className="bg-white text-slate-900">
      
      {/* SECTION 1: THE ASYMMETRY OF RISK (15-MIN VISIT VS 365-DAY REALITY) */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#F7F9FC] to-white border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-slate-900 tracking-tight leading-tight">
              You spend <AnimatedSpendAmount /> on a home after just a 15-minute visit.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal max-w-xl mx-auto leading-relaxed">
              Sample flats and brochures only show you the good side. Only people living there can tell you what everyday life is really like.
            </p>
          </div>

          {/* Visual Comparison: The Visit vs The Living Reality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Left: What the brochure shows */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
                    15-Minute Site Visit
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                  What You See During a Visit
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    24/7 Water Supply
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    Quiet Sunday afternoon inspection window
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    Promised amenities & grand future timelines
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    Sales pitch emphasizing prime connectivity
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: What verified residents uncover */}
            <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 border border-blue-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    365-Day Living Reality
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  What You Experience After Moving In
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    Water tankers during summer - people actually need to store water in drums. 
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    Whether your guests can actually find parking
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    Monsoon waterlogging & basement drainage logs
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    How helpful the society committee really is & extra charges
                  </li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: REAL BUYER STORIES (EMOTIONAL RESONANCE) */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              You usually don't find these problems on Day 1.
            </h2>
            <p className="text-sm text-slate-600">
              You notice them slowly after you move in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-[#F7F9FC] border border-[#E4E4E7] rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
              <div className="space-y-3">
                <Quote className="w-6 h-6 text-blue-600 opacity-60" />
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  "After moving in, we realised the garbage collection point was right below our wing. Every morning we had to keep the windows shut."
                </p>
              </div>
            </div>

            <div className="bg-[#F7F9FC] border border-[#E4E4E7] rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
              <div className="space-y-3">
                <Quote className="w-6 h-6 text-blue-600 opacity-60" />
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  "Maintenance increased by almost ₹3,000 per month after we moved in. We never planned for that."
                </p>
              </div>
            </div>

            <div className="bg-[#F7F9FC] border border-[#E4E4E7] rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
              <div className="space-y-3">
                <Quote className="w-6 h-6 text-blue-600 opacity-60" />
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  "My parents struggle every day because the lift keeps breaking down. We only realised this after moving in."
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* HIGH-CONVERTING SEARCH CTA */}
      <section className="py-20 sm:py-24 bg-[#09090B] text-white relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8 relative z-10">
          
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Know what residents know before you decide.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              Search any residential society to unlock direct facts from people who live there right now.
            </p>
          </div>

          {/* Interactive Price Reveal Feature */}
          <PriceGuessReveal />

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSearchClick}
              className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Search className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>Search Your Society Now</span>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 3A: COULD THIS HAPPEN TO ME? (The Unseen Blindspots) */}
      <section className="py-16 sm:py-20 bg-[#F7F9FC] border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Even experienced buyers can't find everything during a property visit.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              When inspecting a home, we naturally evaluate layout and finishes. We rarely test morning lift queues, summer water pressure, or late-night noise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Problems You Don't Notice During a Visit
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Basement seepage, frequent elevator breakdowns, or recent increase in charges rarely show up during afternoon walkthroughs.
              </p>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Society Rules Nobody Tells You
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Strict visitor curfew hours, heavy move-in shifting charges, or pet restrictions set by resident committees without public listings.
              </p>
            </div>

            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 space-y-3 relative overflow-hidden shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Problems That Show Up Only After You Move In
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Monsoon waterlogging near entry gates or summer water tanker reliance that only current residents observe across full seasons.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* SECTION 3D: WHY BEFORE BUYING INSTEAD OF AFTER? (The Power Shift) */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Before you sign the agreement, you still have a choice.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Once you've signed and moved in, changing your decision becomes difficult.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Before Signing */}
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold font-mono tracking-wider text-emerald-800 uppercase">
                  Before Deposit / Signing
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                You have 100% control
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Walk away safely with zero financial loss
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Negotiate price based on real maintenance facts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Choose another society in the same neighborhood
                </li>
              </ul>
            </div>

            {/* After Signing */}
            <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-bold font-mono tracking-wider text-slate-500 uppercase">
                  After Moving In
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Zero leverage remaining
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  Locked into 11-month lease or 20-year home loan
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  Absorbing unexpected maintenance levies out-of-pocket
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  Living with daily compromises you didn't foresee
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION SECTION */}
      <section className="py-20 sm:py-24 bg-[#09090B] text-white relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8 relative z-10">
          
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-blue-400 bg-blue-950/60 border border-blue-800/60 px-3 py-1 rounded-xl inline-block mb-2 sm:mb-0">
                ₹399 is a very small price
              </span>{" "}
              before making such a big decision.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              When you're spending lakhs or crores on a home, it's better to know everything before you decide.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSearchClick}
              className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Search className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>Search Your Society</span>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};


