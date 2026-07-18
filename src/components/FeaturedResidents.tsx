import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Droplet, 
  EyeOff, 
  VolumeX, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { ExpertProfile, Neighborhood } from '../types';

interface OutcomeStory {
  id: string;
  category: string;
  categoryIcon: React.ReactNode;
  outcomeBadge: string;
  badgeColor: string;
  locality: string;
  city: string;
  society: string;
  story: string;
  savingsDetail: string;
  impactType: 'high' | 'medium';
}

interface FeaturedResidentsProps {
  experts: ExpertProfile[];
  localities: Neighborhood[];
  onSelectExpert: (expert: ExpertProfile) => void;
}

export const FeaturedResidents: React.FC<FeaturedResidentsProps> = ({
  experts,
  localities,
  onSelectExpert,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stories: OutcomeStory[] = [
    {
      id: 'story_1',
      category: 'Water Supply & TDS',
      categoryIcon: <Droplet className="w-4 h-4 text-blue-500" />,
      outcomeBadge: 'Saved ₹2.4 Lakhs in maintenance',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      society: 'Bimbisar Nagar',
      locality: 'Jogeshwari East',
      city: 'Mumbai',
      story: 'Brokers promised 24/7 municipal water. Spoke to a block resident Priya who revealed that the municipal line was broken for 8 months and residents spent ₹6,000/month on tankers, plus dealing with high TDS levels that ruined geysers and hair. I negotiated ₹3 Lakhs off my rent budget and got water softeners pre-installed before moving in.',
      savingsDetail: 'TDS & Water Softener issue detected',
      impactType: 'high'
    },
    {
      id: 'story_2',
      category: 'Future Construction',
      categoryIcon: <EyeOff className="w-4 h-4 text-amber-500" />,
      outcomeBadge: 'Avoided ₹1.8 Cr Blind Purchase',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-100',
      society: 'Prestige Shantiniketan',
      locality: 'Whitefield',
      city: 'Bengaluru',
      story: 'Was about to pay a premium for a 15th-floor apartment with a "permanent green view". A 20-minute discussion with resident expert Rahul revealed the society committee had already approved a brand new 20-story building right on that green patch, starting construction in 2 months. Saved myself from a lifelong regret of staring at a brick wall.',
      savingsDetail: 'View blockage & construction noise avoided',
      impactType: 'high'
    },
    {
      id: 'story_3',
      category: 'Structural Noise',
      categoryIcon: <VolumeX className="w-4 h-4 text-purple-500" />,
      outcomeBadge: 'Saved from insomnia & deposit loss',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-100',
      society: 'DLF Phase 5',
      locality: 'Golf Course Road',
      city: 'Gurugram',
      story: 'The apartment looked flawless during our daytime visits. Spoke to a resident Amit, who warned us that the heavy-duty water pumps right below the master bedroom wall vibrate intensely between 2 AM to 5 AM. As light sleepers, my wife and I would have been miserable. We walked away and saved our advance deposit.',
      savingsDetail: 'Hidden night vibration issue uncovered',
      impactType: 'high'
    },
    {
      id: 'story_4',
      category: 'Association Restrictions',
      categoryIcon: <Users className="w-4 h-4 text-teal-500" />,
      outcomeBadge: 'Avoided Rent Penalty & Drama',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-100',
      society: 'HSR Sector 2 Layout',
      locality: 'HSR Layout',
      city: 'Bengaluru',
      story: 'The landlord said "tenants are welcome." A resident expert Neha revealed the RWA doesn\'t allow tenant vehicles in the main gate and bachelors can\'t have guests over after 8 PM. Found a friendly, supportive society next door before signing any agreement.',
      savingsDetail: 'Strict RWA tenant bylaws discovered',
      impactType: 'medium'
    },
    {
      id: 'story_5',
      category: 'Monsoon Dampness',
      categoryIcon: <ShieldAlert className="w-4 h-4 text-red-500" />,
      outcomeBadge: 'Avoided severe health risks',
      badgeColor: 'bg-red-50 text-red-700 border-red-100',
      society: 'Thane West Complex',
      locality: 'Thane West',
      city: 'Mumbai',
      story: 'A beautiful top-floor penthouse. A resident expert Rohan warned us that despite the fresh coat of paint, the entire ceiling suffers from severe rainwater leakage every monsoon, causing mold. Since my son has asthma, this was a massive health hazard saved.',
      savingsDetail: 'Severe top-floor monsoon seepage uncovered',
      impactType: 'high'
    }
  ];

  useEffect(() => {
    if (!paused) {
      autoplayTimerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % stories.length);
      }, 7000);
    }
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [paused, stories.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % stories.length);
  };

  const handleConsultForStory = (story: OutcomeStory) => {
    // Attempt to find a matching expert for this society or city
    const matchedExpert = experts.find(
      (e) => e.localityName.toLowerCase().includes(story.society.toLowerCase())
    ) || experts.find(
      (e) => e.city.toLowerCase() === story.city.toLowerCase()
    ) || experts[0];

    if (matchedExpert) {
      onSelectExpert(matchedExpert);
    }
  };

  return (
    <section className="bg-slate-50/50 py-16 sm:py-20 font-sans border-b border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 border border-blue-100 rounded-full inline-block mb-3">
            Real Insights from Real Neighbors
          </span>
          <h2 id="outcomes-section-title" className="text-3xl sm:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
            Real Advice. Better Decisions.
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-3 font-medium leading-relaxed">
            See how conversations with local residents are helping buyers and renters make smarter property decisions every day.
          </p>
        </div>

        {/* Carousel & Social Proof Layout */}
        <div 
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Main Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            
            {/* Ambient Background Glow Effect */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/40 rounded-full blur-3xl -z-1" />

            {/* Top Row: Category badge & Concrete Outcome */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                  {stories[activeIndex].categoryIcon}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {stories[activeIndex].category}
                </span>
              </div>
              <span className={`text-[11px] sm:text-xs font-black px-3 py-1 border rounded-full w-fit ${stories[activeIndex].badgeColor}`}>
                ✓ {stories[activeIndex].outcomeBadge}
              </span>
            </div>

            {/* Narrative Content */}
            <div className="py-8">
              <span className="text-5xl text-blue-200 font-serif leading-none absolute select-none">“</span>
              <p className="text-base sm:text-lg text-slate-700 font-semibold leading-relaxed pl-6 italic">
                {stories[activeIndex].story}
              </p>
            </div>

            {/* Bottom Row: Locality & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100/80">
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                  Anonymous Consultation Outcome
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {stories[activeIndex].society}, {stories[activeIndex].locality} • {stories[activeIndex].city}
                </p>
              </div>

              <button
                onClick={() => handleConsultForStory(stories[activeIndex])}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-xs hover:shadow-md"
              >
                <span>Consult a Resident of this Society</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

          </div>

          {/* Manual Chevron Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 w-10 sm:w-12 h-10 sm:h-12 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-hidden"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 w-10 sm:w-12 h-10 sm:h-12 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 cursor-pointer focus:outline-hidden"
            aria-label="Next story"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Sliding Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {stories.map((story, idx) => (
              <button
                key={story.id}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

        {/* Dynamic Social Impact Tickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 sm:mt-20 pt-10 border-t border-slate-200/60">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 font-mono">100%</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
              Anonymous Neighbors
            </p>
          </div>
          <div className="text-center border-y sm:border-y-0 sm:border-x border-slate-200/60 py-4 sm:py-0">
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 font-mono">₹42+ Lakhs</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
              Estimated Total User Savings
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 font-mono">0%</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
              Renting/Buying Regret Rate
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
