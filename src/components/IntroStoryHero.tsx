import React, { useState, useEffect } from 'react';

interface Regret {
  quote: string;
  author: string;
}

const REGRETS: Regret[] = [
  { quote: "I wish someone had told me about the water shortages.", author: "Homebuyer, Pune" },
  { quote: "We loved the apartment. We hated the commute.", author: "Family, Bengaluru" },
  { quote: "The maintenance doubled within a year.", author: "Apartment Owner, Mumbai" },
  { quote: "We only discovered the construction noise after moving.", author: "Resident, Hyderabad" },
  { quote: "Everything looked perfect during the site visit.", author: "First-time Buyer" },
  { quote: "The seepage in the master bedroom started with the first monsoon.", author: "Tenant, Gurgaon" },
  { quote: "The society rules here are incredibly restrictive for kids and pets.", author: "Mother of two, Noida" },
  { quote: "We paid a premium for the garden view, but a new tower blocked it in six months.", author: "Owner, Chennai" },
  { quote: "The lift stops working at least twice every week.", author: "Senior Citizen, Kolkata" },
  { quote: "The nearby landfill smell becomes unbearable every evening.", author: "Resident, Pune" },
  { quote: "Power backups here don't support heavy appliances like ACs.", author: "Tenant, Bengaluru" },
  { quote: "They promised a fully functioning clubhouse that is still not built after 3 years.", author: "Buyer, Thane" },
  { quote: "Our deposit was withheld for the most absurd reasons.", author: "Bachelor, Mumbai" },
  { quote: "Traffic outside the main gate adds 20 minutes to every single trip.", author: "Commuter, Delhi NCR" },
  { quote: "The water pressure is so low on the higher floors.", author: "Resident, Navi Mumbai" },
  { quote: "Visitor parking is practically non-existent, causing constant disputes.", author: "Resident, Bangalore" },
  { quote: "The cell phone reception inside the lower floor apartments is zero.", author: "Professional, Hyderabad" },
  { quote: "We were promised 24/7 security, but the gates are left open all night.", author: "Homeowner, Noida" },
  { quote: "The nearby drain overflows every single rainy season.", author: "Tenant, Chennai" },
  { quote: "Our neighbors play loud music till 2 AM, and the management does nothing.", author: "Resident, Pune" }
];

export const IntroStoryHero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % REGRETS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentRegret = REGRETS[currentIndex];

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] overflow-hidden flex items-center justify-center select-none bg-slate-950">
      <style>{`
        @keyframes slowZoom {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes calmFadeInOut {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          16% {
            opacity: 1;
            transform: translateY(0);
          }
          84% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-8px);
          }
        }

        .animate-slow-zoom {
          animation: slowZoom 20s ease-in-out infinite;
        }

        .animate-calm-fade-io {
          animation: calmFadeInOut 5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
      `}</style>

      {/* Cinematic background photograph with zoom animation and soft dark overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1568941159284-3b299541ee63?auto=format&fit=crop&w=1920&q=80"
          alt="Modern residential community at dusk"
          className="w-full h-full object-cover animate-slow-zoom opacity-40 brightness-75 filter contrast-105"
          referrerPolicy="no-referrer"
        />
        {/* Soft dark radial & linear overlay blend for dramatic narrative focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90 z-10" />
      </div>

      {/* Centered Content Container */}
      <div className="relative z-20 w-full max-w-[700px] px-6 text-center flex flex-col items-center justify-center py-8">
        <div className="space-y-4">
          {/* Static Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
            Is This Home Really Worth It?
          </h1>

          {/* Static Subheading */}
          <p className="text-slate-300 text-base sm:text-lg md:text-xl font-sans font-medium max-w-lg mx-auto leading-relaxed">
            Learn from people who already live there before renting or buying your next home.
          </p>
        </div>

        {/* Subheading above rotating text */}
        <p className="text-slate-400 text-sm sm:text-base font-sans font-medium max-w-md mx-auto leading-relaxed mt-10">
          Most people only discover the truth after moving in.
        </p>

        {/* Minimal Quote Block (Animated Content) */}
        <div className="mt-6 min-h-[120px] flex items-center justify-center w-full">
          <div
            key={currentIndex}
            className="animate-calm-fade-io text-center max-w-xl px-4"
          >
            <p className="text-lg sm:text-xl md:text-2xl font-serif italic text-amber-200/90 leading-relaxed font-light">
              "{currentRegret.quote}"
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-sans tracking-wide uppercase font-semibold mt-3">
              — {currentRegret.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
