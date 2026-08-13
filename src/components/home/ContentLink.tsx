import React from 'react';

interface ContentLinkProps {
  href: string;
  onNavigate?: (path: string) => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Always a real <a href> -- the homepage's whole job in these sections is to pass link equity to
 * ~40 guide and county pages, and a <button onClick> (the pattern Footer.tsx uses) is invisible to
 * a crawler. When an onNavigate handler is supplied by the client app, the click is intercepted for
 * SPA routing; the static prerender passes none, so the markup degrades to an ordinary link.
 *
 * Modified clicks (cmd/ctrl/shift/middle) fall through untouched so "open in new tab" keeps working
 * -- preventDefault on those is the classic SPA regression.
 */
export const ContentLink: React.FC<ContentLinkProps> = ({ href, onNavigate, className, children }) => (
  <a
    href={href}
    className={className}
    onClick={(e) => {
      if (!onNavigate) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      onNavigate(href);
    }}
  >
    {children}
  </a>
);
