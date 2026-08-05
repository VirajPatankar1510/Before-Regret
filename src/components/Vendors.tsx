import React, { useEffect } from 'react';
import { 
  Building2, ArrowLeft, Check, Sparkles, MapPin, Target, ShieldCheck, 
  HelpCircle, CreditCard, Mail, ExternalLink, Eye, ArrowRight
} from 'lucide-react';

interface VendorsProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const Vendors: React.FC<VendorsProps> = ({ onBackToHome, onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleReturnHome = () => {
    if (onNavigate) onNavigate('/');
    else onBackToHome();
  };

  const tradeCategories = [
    'Roof Inspection',
    'HVAC Inspection',
    'Sewer Scope',
    'Radon Testing',
    'Foundation Engineer',
    'Electrician',
    'Home Inspector',
    'Insurance Agent',
    'Real Estate Attorney',
    'Moving Company'
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={handleReturnHome}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
            Business Partner Program
          </span>
        </div>

        {/* Hero Banner */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-mono font-bold text-blue-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>Local Business Placements</span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-tight">
              Put your business in front of buyers actively researching properties in your zip codes.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              BeforeRegret users are in active due diligence — comparing addresses, preparing offers, scheduling inspections. These are the highest-intent homebuyer moments in the market.
            </p>
          </div>
        </div>

        {/* Three Core Value Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Contextual, Not Random</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Your placement appears next to the specific finding it's relevant to. A roofer appears beside a missing roof permit finding. A radon tester appears beside a radon zone classification. Not scattered across unrelated pages.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">High-Credibility Intent</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Users who return choose to pay $14.99 to do so. Our freemium model means returning users have already decided the reports are worth paying for. Your placement sits in a trusted, high-credibility context.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Zip-Code Precision</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              You choose exactly which zip codes you appear in. No spend on areas outside your service territory.
            </p>
          </div>

        </div>

        {/* Visual Example of Sponsored Block */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Visual Placement Preview</div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">How Placements Appear in Reports</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Here is a real visual example of the sponsored block as it appears inside a consumer report:
            </p>
          </div>

          {/* Sample Sponsored Block Component */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4 max-w-2xl mx-auto shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Need help verifying this? [Sponsored]</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                FTC DISCLOSED
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Austin Roof & Structure Specialists</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Licensed roof inspector serving ZIP 78701. Available for physical permit gap verification and structural inspection within 24 hours.
              </p>
            </div>

            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Apex Roofing & Inspection LLC</span>
                <span className="text-[10px] text-slate-400 font-mono">TX License #482019 • Rating ★ 4.9</span>
              </div>
              <button className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg">
                Contact Vendor
              </button>
            </div>
          </div>
        </div>

        {/* Trade Categories Available */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Available Trade Categories</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              We accept verified local service providers across these primary residential categories:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-bold text-slate-800">
            {tradeCategories.map((cat, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">Simple Monthly Zip Code Pricing</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              All plans carry a maximum cap of 3 vendors per trade category per zip code to protect placement visibility. Cancel anytime — takes effect at the next billing cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Starter */}
            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Starter Tier</div>
                <div className="text-3xl font-black text-slate-900">$29 <span className="text-xs font-normal text-slate-500">/ month</span></div>
                <div className="text-xs font-bold text-slate-700">Cover 2 Zip Codes</div>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-200">
                  <li className="flex items-center gap-2">✓ Max 3 vendors per category</li>
                  <li className="flex items-center gap-2">✓ Contextual placement</li>
                  <li className="flex items-center gap-2">✓ Cancel anytime</li>
                </ul>
              </div>
            </div>

            {/* Standard */}
            <div className="border-2 border-blue-600 rounded-2xl p-6 space-y-5 bg-white relative shadow-md flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase font-mono px-3 py-0.5 rounded-full">
                Most Popular
              </div>
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">Standard Tier</div>
                <div className="text-3xl font-black text-slate-900">$49 <span className="text-xs font-normal text-slate-500">/ month</span></div>
                <div className="text-xs font-bold text-blue-900">Cover 5 Zip Codes</div>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-200">
                  <li className="flex items-center gap-2">✓ Max 3 vendors per category</li>
                  <li className="flex items-center gap-2">✓ Priority placement slot</li>
                  <li className="flex items-center gap-2">✓ Cancel anytime</li>
                </ul>
              </div>
            </div>

            {/* Pro */}
            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Pro Tier</div>
                <div className="text-3xl font-black text-slate-900">$59 <span className="text-xs font-normal text-slate-500">/ month</span></div>
                <div className="text-xs font-bold text-slate-700">Cover 10 Zip Codes</div>
                <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-200">
                  <li className="flex items-center gap-2">✓ Max 3 vendors per category</li>
                  <li className="flex items-center gap-2">✓ Full metro coverage</li>
                  <li className="flex items-center gap-2">✓ Cancel anytime</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* Disclaimer / What is NOT Guaranteed */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Placement Performance Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            BeforeRegret does not guarantee a specific number of views, clicks, calls, or business outcomes from a sponsored placement. Placement visibility depends on report generation volume in your selected zip codes.
          </p>
        </div>

        {/* Closing CTA */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">Ready to claim your zip codes?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Check availability in your target zip codes today before the 3-vendor category slots fill up.
          </p>

          <div className="pt-2">
            <a
              href="mailto:hello@beforeregret.com?subject=Vendor%20Zip%20Code%20Availability%20Inquiry"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Email hello@beforeregret.com to Apply</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Include your business name, trade category, and target zip codes in your email.
          </p>
        </div>

      </div>
    </div>
  );
};
