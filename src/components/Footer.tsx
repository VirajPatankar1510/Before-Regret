import React from 'react';
import { Heart, ExternalLink, Tag, Compass, Shield } from 'lucide-react';
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
            <div className="text-[10px] text-zinc-500 leading-normal">
              Disclaimer: Outcomes are self-reported. Not a substitute for professional clinical therapy or advisory. Read our binding{' '}
              <a 
                href="/disclaimer" 
                onClick={(e) => {
                  e.preventDefault();
                  setScreen({ type: 'legal', slug: 'disclaimer' });
                }}
                className="text-[#F4B942] hover:underline cursor-pointer"
              >
                Legal Disclaimer
              </a>.
            </div>
          </div>

          {/* Column 2: Decision Intelligence Hubs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-indigo-400" /> Decision Hubs
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="/should-i-leave"
                  onClick={(e) => {
                    e.preventDefault();
                    setScreen({ type: 'hub', slug: 'should-i-leave' });
                  }} 
                  className="hover:text-white text-[#AAB2C0] transition-colors text-left flex items-center gap-1"
                >
                  Should I Leave Partner?
                </a>
              </li>
              <li>
                <a 
                  href="/will-i-regret"
                  onClick={(e) => {
                    e.preventDefault();
                    setScreen({ type: 'hub', slug: 'will-i-regret' });
                  }} 
                  className="hover:text-white text-[#AAB2C0] transition-colors text-left flex items-center gap-1"
                >
                  Will I Regret It?
                </a>
              </li>
              <li>
                <a 
                  href="/red-flags"
                  onClick={(e) => {
                    e.preventDefault();
                    setScreen({ type: 'hub', slug: 'red-flags' });
                  }} 
                  className="hover:text-white text-[#AAB2C0] transition-colors text-left flex items-center gap-1"
                >
                  Scientific Red Flags
                </a>
              </li>
              <li>
                <a 
                  href="/relationship-regrets"
                  onClick={(e) => {
                    e.preventDefault();
                    setScreen({ type: 'hub', slug: 'relationship-regrets' });
                  }} 
                  className="hover:text-white text-[#AAB2C0] transition-colors text-left flex items-center gap-1"
                >
                  Regret Registry Feed
                </a>
              </li>
              <li>
                <a 
                  href="/commitment-issues"
                  onClick={(e) => {
                    e.preventDefault();
                    setScreen({ type: 'hub', slug: 'commitment-issues' });
                  }} 
                  className="hover:text-white text-[#AAB2C0] transition-colors text-left flex items-center gap-1"
                >
                  Commitment & Ultimatums
                </a>
              </li>
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
                  <a 
                    href={`/tag/${tag.code}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setScreen({ type: 'tag', slug: tag.code });
                    }} 
                    className="hover:text-white transition-colors text-left flex items-center gap-1"
                  >
                    <span className="text-[#AAB2C0]">#</span>{tag.name}
                  </a>
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
            © {currentYear} BeforeRegret. Built with high precision outcome analytics. All cases stored securely and anonymously.
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center md:justify-end">
            <a 
              href="/guides" 
              onClick={(e) => {
                e.preventDefault();
                setScreen({ type: 'guides' });
              }}
              className="hover:text-white text-[11px] font-bold text-[#C9A227] transition-colors cursor-pointer"
            >
              Decision Guides
            </a>
            <a 
              href="/privacy" 
              onClick={(e) => {
                e.preventDefault();
                setScreen({ type: 'legal', slug: 'privacy' });
              }}
              className="hover:text-white text-[11px] transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              onClick={(e) => {
                e.preventDefault();
                setScreen({ type: 'legal', slug: 'terms' });
              }}
              className="hover:text-white text-[11px] transition-colors cursor-pointer"
            >
              Terms of Use
            </a>
            <a 
              href="/disclaimer" 
              onClick={(e) => {
                e.preventDefault();
                setScreen({ type: 'legal', slug: 'disclaimer' });
              }}
              className="hover:text-white text-[11px] transition-colors cursor-pointer"
            >
              Legal Disclaimer
            </a>
            <a 
              href="/admin-feed"
              onClick={(e) => {
                e.preventDefault();
                setScreen({ type: 'admin_feed' });
              }}
              className="hover:text-[#C9A227] text-[11px] flex items-center gap-1.5 transition-colors font-semibold"
            >
              <Shield className="h-3 w-3" />
              <span>Admin Feed</span>
            </a>
            <AdminPanel isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} />
          </div>
        </div>

      </div>
    </footer>
  );
}
