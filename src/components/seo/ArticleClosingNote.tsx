import React from 'react';

interface ArticleClosingNoteProps {
  onNavigate: (path: string) => void;
}

// A closing editorial note for guide articles -- the same pattern a publication uses for an
// "About the newsroom" box at the end of a piece: one paragraph of real context about what the
// organization does, ending in a single inline link. Deliberately not a banner, not a button in
// brand-blue chrome, no "click here" language -- it reads as part of the article, not an ad slot
// bolted onto it.
export const ArticleClosingNote: React.FC<ArticleClosingNoteProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
      <p className="text-sm text-slate-600 leading-relaxed">
        BeforeRegret is a property research platform helping buyers uncover historical permits, zoning decisions, hazard classifications, and publicly available building records before making an offer.{' '}
        <button
          onClick={() => onNavigate('/')}
          className="text-blue-700 font-semibold hover:underline underline-offset-2 cursor-pointer"
        >
          Start a property search
        </button>{' '}
        to access property research and guides in your area.
      </p>
    </div>
  );
};
