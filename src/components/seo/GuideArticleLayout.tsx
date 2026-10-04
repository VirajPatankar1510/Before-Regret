import React from 'react';
import { ArrowRight, ChevronRight, ExternalLink, Flag, ListOrdered, MessageCircleQuestion } from 'lucide-react';
import { renderArticleMarkdown, parseInline, articleSections } from '../../utils/renderArticleMarkdown';
import { resolveKnownSource } from '../../data/knownSources';
import { classifyGuideTopic, GUIDE_CLUSTER_META } from '../../utils/homeContent';
import { ArticleClosingNote } from './ArticleClosingNote';
import { BookPromoCard, BookPromoSkyscraper } from '../BookPromo';
import { ContentLink } from '../home/ContentLink';
import { GUIDE_AD_SLOT_PLACEHOLDER } from '../GuideAdSlot';
import type { GuideSummary } from '../../utils/relatedGuides';

/**
 * The guide page, ONE component for both renders (2026-10-04 redesign).
 *
 * Before this, the page existed twice: GuidePageView.tsx for the live app and GuideStaticBody in
 * scripts/prerender-guides.tsx for the HTML a crawler reads. The two had drifted -- different
 * footer links, an FAQ accordion in one and an expanded list in the other, county sections in only
 * one -- and because main.tsx mounts with createRoot (a full replace, not a hydrate), every
 * difference was a visible jump the moment the app booted. The homepage solved the same problem
 * with shared components; this does it for guides. Both callers now pass data in and get the same
 * markup out. Only things that need the browser stay outside: the ad slot's fetch (passed in as
 * a node, with a same-height placeholder statically) and the error-report modal.
 *
 * WHAT THE REDESIGN DID NOT CHANGE, on purpose -- these carry the page's search standing:
 * the h1 text, the description text, the Quick Answer text, the article body and its heading
 * order, every internal link (breadcrumbs, Related Guides, prose links), the visible FAQs, the
 * Sources list, the section headings "Related Guides" / "Frequently Asked Questions" / "Sources",
 * and the order of the blocks. The ad slot stays directly under the Quick Answer, which is the
 * position Topic Ads sell.
 *
 * FAQs now render open, as a plain question-and-answer list, in both renders. The live page used
 * to collapse them behind buttons while the static one showed them open; open is the version that
 * reads the same with or without JavaScript, prints whole, and keeps every answer on screen for
 * the reader and for answer engines.
 */

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface GuideLayoutArticle {
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  quickAnswer: string;
  sources: string[];
  faqItems: GuideFaqItem[];
  articleType: string;
  publishedAt: string | null;
  updatedAt: string | null;
}

type CountyLink = { slug: string; countyName: string; stateAbbrev: string };

interface GuideArticleLayoutProps {
  article: GuideLayoutArticle;
  relatedGuides: GuideSummary[];
  onNavigate?: (path: string) => void;
  /** The live ad slot. Omitted statically, where a placeholder of the slot's loading height stands in. */
  adSlot?: React.ReactNode;
  /** Opens the correction modal. Statically the button renders inert until the app boots. */
  onReportError?: () => void;
  /** Static-only sections, kept for when county pages return; both render nothing while empty. */
  permitCounty?: CountyLink;
  relevantCounties?: CountyLink[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Only worth showing as a distinct "Updated" date when it is a different calendar day from the
// publish date; two identical dates read as noise, not as freshness.
function hasVisibleUpdate(a: Pick<GuideLayoutArticle, 'publishedAt' | 'updatedAt'>): boolean {
  if (!a.updatedAt || !a.publishedAt) return false;
  return new Date(a.publishedAt).toDateString() !== new Date(a.updatedAt).toDateString();
}

/** The reader-facing topic name for the eyebrow, from the same rules the /guides/ hub groups by. */
function topicLabel(article: Pick<GuideLayoutArticle, 'slug' | 'title'>): string | null {
  const id = classifyGuideTopic(article);
  return GUIDE_CLUSTER_META.find((c) => c.id === id)?.title ?? null;
}

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-home-ink tracking-tight">{children}</h2>
);

export const GuideArticleLayout: React.FC<GuideArticleLayoutProps> = ({
  article,
  relatedGuides,
  onNavigate,
  adSlot,
  onReportError,
  permitCounty,
  relevantCounties = [],
}) => {
  const wordCount = article.bodyMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const canonicalUrl = `https://www.beforeregret.com/guides/${article.slug}/`;
  const sections = articleSections(article.bodyMarkdown);
  const topic = topicLabel(article);
  const kind = article.articleType === 'news' ? 'County update' : 'Guide';

  return (
    <div className="bg-home-stone min-h-screen pb-16">
      {/* Breadcrumbs -- real links in both renders, same three steps as the BreadcrumbList schema. */}
      <div className="border-b border-home-linen bg-white/70">
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto">
          <ContentLink href="/" onNavigate={onNavigate} className="shrink-0 hover:text-home-ink">Before Regret</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <ContentLink href="/guides/" onNavigate={onNavigate} className="shrink-0 hover:text-home-ink">Editorial Guides</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="text-home-ink font-semibold truncate">{article.title}</span>
        </nav>
      </div>

      {/* Header: on the page ground, not in a card -- the title is the thing, not a box around it. */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-home-brass">
            {kind}
            {topic && <span className="text-home-oak"> &middot; {topic}</span>}
          </p>
          <h1 className="mt-3 font-serif text-[2.1rem] leading-[1.1] sm:text-5xl sm:leading-[1.05] font-semibold text-home-ink tracking-[-0.01em] [text-wrap:balance]">
            {article.title}
          </h1>
          {article.metaDescription && (
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">{article.metaDescription}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500">
            <span>{readTimeMinutes} min read</span>
            {article.publishedAt && <span>Published {fmtDate(article.publishedAt)}</span>}
            {hasVisibleUpdate(article) && (
              <span className="font-semibold text-home-moss">Updated {fmtDate(article.updatedAt!)}</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:flex lg:gap-10 lg:items-start lg:justify-between">
        <div className="space-y-6 sm:space-y-8 lg:flex-1 lg:min-w-0 max-w-3xl">

          {/* Quick Answer: the short, self-contained answer for skimmers and answer engines. */}
          {article.quickAnswer && (
            <section aria-label="Quick answer" className="rounded-3xl bg-white border border-home-linen shadow-sm p-6 sm:p-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-home-sage px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-home-moss">
                <MessageCircleQuestion className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Quick answer</span>
              </div>
              <p className="mt-4 text-[17px] sm:text-lg text-home-ink leading-relaxed font-medium">
                {parseInline(article.quickAnswer)}
              </p>
            </section>
          )}

          {/* Vendor ad slot -- below the Quick Answer, above the body, one per guide. The static
              render holds the slot's loading height so nothing jumps when the live slot mounts. */}
          {adSlot ?? <div className={GUIDE_AD_SLOT_PLACEHOLDER} aria-hidden="true" />}

          {/* On this page: built from the article's own ## headings. A native <details>, so it
              works identically with or without JavaScript and costs a phone one line until opened. */}
          {sections.length >= 3 && (
            <details className="group rounded-2xl bg-white border border-home-linen shadow-sm">
              <summary className="flex items-center justify-between gap-3 cursor-pointer select-none list-none px-5 sm:px-6 py-4 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-home-ink">
                  <ListOrdered className="w-4 h-4 text-home-brass" aria-hidden="true" />
                  On this page
                  <span className="font-medium text-slate-500">&middot; {sections.length} sections</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <nav aria-label="On this page" className="border-t border-home-linen px-5 sm:px-6 py-4">
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm list-decimal list-outside pl-5 marker:text-home-brass marker:font-semibold">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="text-slate-700 hover:text-home-ink hover:underline underline-offset-2">{s.label}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>
          )}

          {/* Article body. 17px on a white sheet, held to a reading measure. */}
          <article className="rounded-3xl bg-white border border-home-linen shadow-sm px-5 py-7 sm:px-10 sm:py-10 text-base sm:text-[17px]">
            {renderArticleMarkdown(article.bodyMarkdown, { pageUrl: canonicalUrl })}
          </article>

          {/* The book on phones and tablets; desktop carries it in the right rail instead. */}
          <BookPromoCard className="lg:hidden" />

          <ArticleClosingNote onNavigate={onNavigate} />

          {permitCounty && (
            <a
              href={`/county/${permitCounty.slug}/`}
              className="flex items-center justify-between gap-3 rounded-3xl bg-white border border-home-linen hover:border-home-oak p-6 sm:p-8 transition-colors"
            >
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-home-brass mb-1">County data for this guide</span>
                <span className="block text-sm font-bold text-home-ink">
                  See {permitCounty.countyName} County, {permitCounty.stateAbbrev} property research →
                </span>
              </span>
            </a>
          )}

          {relatedGuides.length > 0 && (
            <section className="rounded-3xl bg-white border border-home-linen shadow-sm p-6 sm:p-8">
              <SectionHeading>Related Guides</SectionHeading>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedGuides.map((g) => (
                  <ContentLink
                    key={g.slug}
                    href={`/guides/${g.slug}/`}
                    onNavigate={onNavigate}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-home-linen bg-home-stone/60 hover:bg-white hover:border-home-oak p-4 transition-colors"
                  >
                    <span className="text-sm sm:text-[15px] font-semibold text-home-ink leading-snug">{g.title}</span>
                    <ArrowRight className="w-4 h-4 text-home-oak shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </ContentLink>
                ))}
              </div>
            </section>
          )}

          {relevantCounties.length > 0 && (
            <section className="rounded-3xl bg-white border border-home-linen shadow-sm p-6 sm:p-8">
              <SectionHeading>Where This Comes Up</SectionHeading>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Real county data where this is a common issue based on housing age, not a guess:
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relevantCounties.map((c) => (
                  <a
                    key={c.slug}
                    href={`/county/${c.slug}/`}
                    className="rounded-2xl border border-home-linen bg-home-stone/60 hover:bg-white p-4 text-sm font-semibold text-home-ink"
                  >
                    {c.countyName} County, {c.stateAbbrev}
                  </a>
                ))}
              </div>
            </section>
          )}

          {article.faqItems.length > 0 && (
            <section className="rounded-3xl bg-white border border-home-linen shadow-sm p-6 sm:p-8">
              <SectionHeading>Frequently Asked Questions</SectionHeading>
              <div className="mt-5 divide-y divide-home-linen">
                {article.faqItems.map((item, idx) => (
                  <div key={idx} data-print-block className="py-5 first:pt-0 last:pb-0">
                    <div className="text-base font-bold text-home-ink leading-snug">{item.question}</div>
                    <p className="mt-2 text-[15px] sm:text-base text-slate-700 leading-relaxed">{parseInline(item.answer)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sources -- resolved from the hand-verified list in src/data/knownSources.ts only. */}
          {article.sources.length > 0 && (
            <section className="rounded-3xl bg-white/70 border border-home-linen p-6 sm:p-8">
              <SectionHeading>Sources</SectionHeading>
              <ul className="mt-4 space-y-2.5">
                {article.sources.map((code) => {
                  const source = resolveKnownSource(code);
                  if (!source) return null;
                  return (
                    <li key={code}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-1.5 text-sm text-blue-700 hover:text-blue-900 hover:underline underline-offset-2"
                      >
                        <span>{source.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Methodology link + correction path. The correction control stays a BUTTON, never a
              link: no URL for a crawler to follow or index. */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 pt-2 text-xs">
            <ContentLink href="/about/" onNavigate={onNavigate} className="font-semibold text-slate-600 hover:text-home-ink hover:underline underline-offset-2">
              How we research and write these guides
            </ContentLink>
            <button
              type="button"
              onClick={onReportError}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-home-ink transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Something wrong on this page? Tell us.</span>
            </button>
          </div>
        </div>

        {/* Right rail, desktop only: the book, sticky beside a long guide. Plain div, not <aside>:
            BookPromoSkyscraper renders its own labelled <aside>. */}
        {/* self-stretch is what lets the book actually stick: with the row's items-start, the rail
            was only as tall as the book, so `sticky` had no room to move in and the book scrolled
            away with the first screen -- true before the 2026-10-04 redesign as well. */}
        <div className="hidden lg:block lg:w-[300px] lg:shrink-0 lg:self-stretch">
          <div className="sticky top-24">
            <BookPromoSkyscraper />
          </div>
        </div>
      </div>
    </div>
  );
};
