import React from 'react';
import { Compass, ShieldAlert, Heart, HelpCircle, Flame, ExternalLink, Globe, Tag } from 'lucide-react';
import AdminPanel from './AdminPanel';

interface FooterProps {
  setScreen: (screen: { type: string; slug?: string }) => void;
  isAdmin: boolean;
  onToggleAdmin: (status: boolean) => void;
}

export default function Footer({ setScreen, isAdmin, onToggleAdmin }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const resources = [
    { name: "National Domestic Violence Support", link: "https://thehotline.org" },
    { name: "Loveisrespect (Teen Counseling)", link: "https://loveisrespect.org" },
    { name: "BetterHelp Couples Therapy Directory", link: "https://betterhelp.com" },
    { name: "Gottman Institute Relationship Method", link: "https://gottman.com" }
  ];

  const popularCountries = [
    { name: "United States", code: "usa" },
    { name: "India", code: "india" },
    { name: "Canada", code: "canada" }
  ];

  const popularTags = [
    { name: "Marriage Commitment", code: "marriage" },
    { name: "Trust & Infidelity", code: "cheating" },
    { name: "Long Distance (LDR)", code: "long-distance" },
    { name: "Having Children", code: "children" }
  ];

  return (
    <footer className="mt-auto border-t border-[#30363D] bg-[#090D13] py-12 text-[#AAB2C0] transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Column 1: Info and Tagline */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F8CFF] font-bold text-white text-md">
                BR
              </div>
              <span className="font-extrabold text-white text-md">BeforeRegret</span>
            </div>
            <p className="text-xs text-[#AAB2C0] leading-relaxed max-w-xs">
              See what happened before making the same decision. Analyze thousands of genuine, anonymous relationship timelines, regret ratios, and post-decision updates.
            </p>
            <div className="text-[10px] text-zinc-500">
              Disclaimer: Outcomes are self-reported by community contributors. Not a substitute for professional legal or psychological advisory.
            </div>
          </div>

          {/* Column 2: Popular Situations & Directories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-[#4F8CFF]" /> Explore Directories
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setScreen({ type: 'explore' })} className="hover:text-white transition-colors text-left">
                  All Relationship Situations
                </button>
              </li>
              <li>
                <button onClick={() => setScreen({ type: 'court_list' })} className="hover:text-white transition-colors text-left">
                  Before Regret Court
                </button>
              </li>
              <li>
                <button onClick={() => setScreen({ type: 'question_list' })} className="hover:text-white transition-colors text-left">
                  Community Q&A Panels
                </button>
              </li>
              <li className="pt-2 text-[11px] font-semibold text-white/90">Country Directories:</li>
              {popularCountries.map(c => (
                <li key={c.code} className="inline-block mr-2">
                  <button onClick={() => setScreen({ type: 'country', slug: c.code })} className="hover:text-white text-[11px] underline flex items-center gap-0.5">
                    <Globe className="h-2.5 w-2.5 text-zinc-400" /> {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Tag Directories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-pink-400" /> Tag Archives
            </h3>
            <ul className="space-y-2 text-xs">
              {popularTags.map(tag => (
                <li key={tag.code}>
                  <button 
                    onClick={() => setScreen({ type: 'tag', slug: tag.code })} 
                    className="hover:text-white transition-colors text-left flex items-center gap-1"
                  >
                    <span className="text-[#AAB2C0]">#</span>{tag.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Help Resources */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-[#FF5D5D]" /> Crisis & Therapy Resources
            </h3>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              If you are in an unsafe or emotionally abusive situation, direct counseling can help:
            </p>
            <ul className="space-y-2 text-xs">
              {resources.map((r, i) => (
                <li key={i}>
                  <a 
                    href={r.link} 
                    target="_blank" 
                    rel="noreferrer noopener" 
                    className="hover:text-white transition-colors underline flex items-center gap-1 text-[11px]"
                  >
                    {r.name} <ExternalLink className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-[#30363D] pt-6 text-center text-xs text-zinc-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            © {currentYear} BeforeRegret. Built with high precision outcome analytics. Zero tracking cookies. All cases stored fully locally and anonymously.
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center md:justify-end">
            <a href="#privacy" className="hover:text-white text-[11px]">Privacy Policy</a>
            <a href="#terms" className="hover:text-white text-[11px]">Terms of Use</a>
            <a href="#cookie" className="hover:text-white text-[11px]">Ad Policy</a>
            <AdminPanel isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} />
          </div>
        </div>

      </div>
    </footer>
  );
}
