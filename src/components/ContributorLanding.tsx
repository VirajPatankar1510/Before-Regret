import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Coins, 
  Search, 
  Droplets, 
  Car, 
  VolumeX, 
  Building2, 
  Zap, 
  CloudRain, 
  Wifi, 
  Shield, 
  Users, 
  HardHat, 
  Check, 
  MessageSquareQuote,
  ChevronDown,
  ShieldCheck,
  Lock,
  HeartHandshake,
  Building,
  HelpCircle
} from 'lucide-react';

interface ContributorLandingProps {
  onStartAnswering: () => void;
  onBackToHome: () => void;
}

export const ContributorLanding: React.FC<ContributorLandingProps> = ({
  onStartAnswering,
  onBackToHome,
}) => {
  const [unlockCount, setUnlockCount] = useState<number>(10);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const calculatedEarnings = unlockCount * 205;

  const topicsList = [
    {
      title: "Society Management",
      icon: Building2,
      desc: "Is the managing committee active? How fast are common issues fixed?",
      color: "text-blue-600 bg-blue-50 border-blue-100"
    },
    {
      title: "Water Supply",
      icon: Droplets,
      desc: "Do water tankers come in summer? How is the drinking water quality?",
      color: "text-cyan-600 bg-cyan-50 border-cyan-100"
    },
    {
      title: "Parking",
      icon: Car,
      desc: "Is visitor parking easy or a daily headache? Are fixed slots allotted properly?",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100"
    },
    {
      title: "Noise",
      icon: VolumeX,
      desc: "Is it quiet at night? Can you hear traffic or noisy neighbouring flats?",
      color: "text-purple-600 bg-purple-50 border-purple-100"
    },
    {
      title: "Monsoon",
      icon: CloudRain,
      desc: "Does the basement or entrance road get waterlogged during heavy rains?",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    },
    {
      title: "Electricity",
      icon: Zap,
      desc: "Are power cuts frequent? Does the DG backup switch on automatically?",
      color: "text-amber-600 bg-amber-50 border-amber-100"
    },
    {
      title: "Internet",
      icon: Wifi,
      desc: "Which broadband networks (Jio, Airtel, local fiber) give stable speeds here?",
      color: "text-sky-600 bg-sky-50 border-sky-100"
    },
    {
      title: "Safety",
      icon: Shield,
      desc: "Are security guards attentive? Is visitor entry verified properly at the gate?",
      color: "text-rose-600 bg-rose-50 border-rose-100"
    },
    {
      title: "Community",
      icon: Users,
      desc: "Are festivals celebrated together? Is it friendly for kids and pets?",
      color: "text-pink-600 bg-pink-50 border-pink-100"
    },
    {
      title: "Construction",
      icon: HardHat,
      desc: "Any wall dampness or seepage issues? How often do the lifts break down?",
      color: "text-orange-600 bg-orange-50 border-orange-100"
    }
  ];

  const questionCards = [
    { text: "Does water supply reduce during summer?", icon: Droplets, color: "text-cyan-600" },
    { text: "Is visitor parking a daily problem?", icon: Car, color: "text-emerald-600" },
    { text: "Is the locality peaceful at night?", icon: VolumeX, color: "text-purple-600" },
    { text: "Does the society committee resolve issues quickly?", icon: Building2, color: "text-blue-600" },
    { text: "Are power cuts common in this area?", icon: Zap, color: "text-amber-600" },
    { text: "Does waterlogging happen during monsoon?", icon: CloudRain, color: "text-indigo-600" },
    { text: "Which internet providers give uninterrupted speed?", icon: Wifi, color: "text-sky-600" }
  ];

  const emotionalStories = [
    "I wish someone had told us about the water tanker issue before we bought the flat.",
    "I wish we knew construction noise continues till late night in this lane.",
    "I wish someone warned us that guest parking is strictly not allowed.",
    "I wish I knew the society lifts break down every monsoon."
  ];

  const searchQueries = [
    "Is XYZ Society good for families?",
    "Water problem in XYZ Society Pune",
    "Real resident apartment reviews Bangalore",
    "Is XYZ safe for senior citizens?",
    "Internet providers in ABC Society Mumbai",
    "Visitor parking issues in XYZ"
  ];

  const faqs = [
    {
      q: "Do I need to answer every question?",
      a: "No. You only answer the questions you personally know."
    },
    {
      q: "Can I skip topics?",
      a: "Yes. Simply skip any topic you haven't personally experienced."
    },
    {
      q: "How long does it take?",
      a: "It usually takes around 15–20 minutes to complete."
    },
    {
      q: "Can I update my answers later?",
      a: "Yes, absolutely. You can log in and update your answers anytime if things change in your society."
    },
    {
      q: "How do I get paid?",
      a: "Whenever a buyer or renter unlocks your society profile, you earn ₹205 credited directly to your UPI or bank account."
    },
    {
      q: "Can I answer for more than one society?",
      a: "Yes! If you have previously lived in another apartment or housing society, you can share your experience for that society too."
    },
    {
      q: "Is my personal identity shared with buyers?",
      a: "No. Your contact details remain private and confidential. Home buyers only read your answers about the society."
    }
  ];

  return (
    <div className="bg-white text-slate-900 font-sans min-h-screen">
      


      {/* ================= HERO SECTION ================= */}
      <section className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 bg-gradient-to-b from-[#F8FAFC] to-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Share your real resident experience & earn extra income</span>
          </div>

          {/* Main Hook */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Someone is already searching for the answers you have.
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Every day, families buying a flat or renting an apartment want honest housing society reviews that only real residents can give. Share your lived experience about your society and <strong className="text-slate-900 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[#2563EB]">earn ₹205</strong> every time a home buyer unlocks your answers.
          </p>

          {/* Primary CTA */}
          <div className="pt-3 pb-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStartAnswering}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base sm:text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Start Answering</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Trust Ticks */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No expert knowledge needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Answer only what you know</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Takes around 15–20 minutes</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SECTION 2: QUESTIONS YOU ALREADY KNOW ================= */}
      <section className="py-5 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              You already know what buyers wish they knew.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              You don't need any research or documents. These are everyday things you notice just by living in your apartment.
            </p>
          </div>

          {/* Question Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {questionCards.map((q, idx) => {
              const IconComp = q.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs flex items-start gap-3 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className={`p-2 rounded-xl bg-slate-50 shrink-0 mt-0.5 ${q.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">
                    {q.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom Callout */}
          <div className="bg-white border border-blue-100 rounded-2xl p-5 text-center max-w-2xl mx-auto shadow-xs">
            <p className="text-sm sm:text-base text-slate-700 font-medium">
              These are everyday experiences for you.
              <br />
              <span className="text-[#2563EB] font-bold">
                But for someone buying a flat, your answers can prevent an expensive mistake.
              </span>
            </p>
          </div>

        </div>
      </section>


      {/* ================= SECTION 3: NO NEED TO KNOW EVERYTHING ================= */}
      <section className="py-5 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xs">
            
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Zero Pressure</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                You don't need to know everything.
              </h2>
            </div>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              You're not expected to answer every single question. Simply pick the topics you have personally experienced in your society.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-800">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                <span>Never faced parking issues? <strong>Skip Parking.</strong></span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                <span>Don't know about maintenance? <strong>Skip it.</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-sm sm:text-base text-slate-800 font-semibold">
              Only answer what you genuinely know. That's exactly what home buyers are looking for.
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={onStartAnswering}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Pick Your Topics & Start</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* ================= NEW SECTION: EVERY SOCIETY HAS DEMAND ================= */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Every society has interested buyers & tenants.
          </h2>

          <div className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed space-y-3">
            <p>
              Whether your society has 20 flats or 500, people search online before buying or renting a home.
            </p>
            <p>
              A smaller society may have only a few flats available each year, but many more buyers and tenants could be looking for information before making a decision.
            </p>
            <p className="font-semibold text-slate-800">
              That's where your experience becomes valuable.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: EARNING POTENTIAL ================= */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your experience keeps earning.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Answer once in 15–20 minutes. Whenever new home buyers or tenants unlock your society answers, you earn ₹205 every single time.
            </p>
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-xs">
            
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unlocks</span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {unlockCount} {unlockCount === 1 ? 'Unlock' : 'Unlocks'}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">You Earn</span>
                <div className="text-2xl sm:text-3xl font-black text-[#2563EB]">
                  ₹{calculatedEarnings.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>1 unlock</span>
                <span>25 unlocks</span>
                <span>50 unlocks</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={unlockCount}
                onChange={(e) => setUnlockCount(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Milestone Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div 
                onClick={() => setUnlockCount(1)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${unlockCount === 1 ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className="text-xs text-slate-500 font-medium">1 Unlock</div>
                <div className="text-base font-bold text-slate-900">₹205</div>
              </div>

              <div 
                onClick={() => setUnlockCount(5)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${unlockCount === 5 ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className="text-xs text-slate-500 font-medium">5 Unlocks</div>
                <div className="text-base font-bold text-slate-900">₹1,025</div>
              </div>

              <div 
                onClick={() => setUnlockCount(10)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${unlockCount === 10 ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className="text-xs text-slate-500 font-medium">10 Unlocks</div>
                <div className="text-base font-bold text-slate-900">₹2,050</div>
              </div>

              <div 
                onClick={() => setUnlockCount(25)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${unlockCount === 25 ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div className="text-xs text-slate-500 font-medium">25 Unlocks</div>
                <div className="text-base font-bold text-slate-900">₹5,125</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center pt-1 font-normal">
              Your answers stay live on BeforeRegret to help buyers over time. Every new unlock earns you again.
            </p>

          </div>

        </div>
      </section>

      {/* ================= SECTION 6: SIMPLIFIED TIMELINE ================= */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              One time effort. Long-term value.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Simple 3-step process. Takes only 15–20 minutes.
            </p>
          </div>

          {/* Simple 3-step Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 relative shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Select your society</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Search for the housing society where you live or have lived.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 relative shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Answer topics you know</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Pick simple topics and share your lived experience in your own words.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 relative shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Publish & earn</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Receive ₹205 every time a home buyer or renter unlocks your answers.</p>
            </div>

          </div>

          <div className="text-center text-xs text-slate-500 font-medium">
            💡 You can edit or update your answers anytime if things change in your society.
          </div>

        </div>
      </section>

      {/* ================= SECTION 7: TRUST & PRIVACY GUARANTEE ================= */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Safe & Private</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              100% private. Zero awkwardness.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Your safety and privacy are completely protected at every step.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 w-fit">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Details kept private</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your phone number, full name, and flat number are never shared with buyers.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Just your experience</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No technical real-estate terms needed. Just share your everyday experience.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 w-fit">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Skip any question</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If you aren't comfortable or don't know an answer, simply leave it blank.
                </p>
              </div>

            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-center gap-2 text-emerald-900 font-bold text-sm sm:text-base">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Honest experiences help home buyers make better decisions.</span>
            </div>

          </div>

        </div>
      </section>

      {/* ================= SECTION 8: EMOTIONAL VALUE ================= */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              One answer can save someone lakhs.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Most people discover society issues only after moving in. Your home buying tips and real resident experience give them true clarity before signing a agreement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {emotionalStories.map((story, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs relative flex items-start gap-3"
              >
                <MessageSquareQuote className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-800 font-medium italic leading-relaxed">
                  "{story}"
                </p>
              </div>
            ))}
          </div>

          <div className="text-center max-w-2xl mx-auto space-y-1 text-sm text-slate-600">
            <p>These are the small everyday details people learn only after moving in.</p>
            <p className="font-bold text-slate-900">Your experience helps home buyers know before they decide.</p>
          </div>

        </div>
      </section>

      {/* ================= SECTION 9: REAL DEMAND ================= */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              People are already searching for this information.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Thousands of people buying or renting a flat search Google every day for real resident insights.
            </p>
          </div>

          {/* Search cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {searchQueries.map((query, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-medium text-slate-700 shadow-2xs"
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{query}</span>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-slate-600 font-medium">
            Instead of biased broker talk, buyers want genuine answers from real residents.
          </div>

        </div>
      </section>

      {/* ================= SECTION 10: FAQ ================= */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Short, clear answers to help you get started quickly.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 font-bold text-sm sm:text-base text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= SECTION 11: FINAL CTA ================= */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-blue-50/50 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Someone is deciding on a flat in your society right now.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Help someone avoid an expensive mistake before renting or buying a flat.
            <br />
            <span className="font-bold text-slate-900">
              Earn ₹205 every time someone unlocks your answers.
            </span>
          </p>

          <div className="pt-2">
            <button
              onClick={onStartAnswering}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base sm:text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2 group"
            >
              <span>Start Answering</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-center gap-2 font-medium pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Private & Confidential • Direct Bank Payouts • 100% Free to Join</span>
          </div>

        </div>
      </section>

    </div>
  );
};

