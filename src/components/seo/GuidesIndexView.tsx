import React, { useEffect, useMemo, useState } from 'react';
import { applyHeadSeo } from '../../utils/headSeo';
import { Loader2 } from 'lucide-react';
import { classifyGuideTopic } from '../../utils/homeContent';
import { GuidesHubLayout } from './GuidesHubLayout';

interface GuidesIndexViewProps {
  onNavigate: (path: string) => void;
}

interface GuideRow {
  slug: string;
  title: string;
  metaDescription: string;
  publishedAt: string | null;
}

// The one page every guide should be reachable from with a single click -- before this existed,
// the only way to a specific guide was the sitemap or a Related Guides link on another guide,
// which meant a reader landing on the homepage had no path to "see everything you've written."
// Also gives search engines one canonical hub to attach authority to instead of 27 disconnected
// leaf pages. See scripts/prerender-guides.tsx for the crawler-facing static twin of this page.
function readPreloadedHub(): GuideRow[] | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('__PRELOADED_GUIDES_HUB__');
  if (!el?.textContent) return null;
  try {
    const parsed = JSON.parse(el.textContent);
    return Array.isArray(parsed) ? (parsed as GuideRow[]) : null;
  } catch {
    return null;
  }
}

export const GuidesIndexView: React.FC<GuidesIndexViewProps> = ({ onNavigate }) => {
  // Seeded from the list scripts/prerender-guides.tsx embeds in the static hub, so the first render
  // matches the static page rather than swapping it for a spinner.
  const [guides, setGuides] = useState<GuideRow[] | null>(readPreloadedHub);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Filtering is CLIENT-SIDE ONLY, and that is a hard constraint rather than an implementation
  // shortcut. scripts/prerender-guides.tsx renders this page's crawler-facing static twin, and its
  // entire job is to give every published guide one crawlable inbound link from a single hub.
  // Anything that removed links from that static HTML would trade the page's whole SEO purpose for
  // a browsing convenience. So the prerender still emits every guide, unfiltered; this state only
  // narrows what a booted human sees.
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.articles)) {
          setGuides(data.articles);
        } else {
          setLoadError(data?.error || 'Could not load the guide list.');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the server.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canonicalUrl = 'https://www.beforeregret.com/guides/';

  // Only offer a chip for a topic that actually has guides behind it, and show the real count on
  // it -- a filter that returns nothing is worse than no filter, and the count tells the reader
  // whether a topic is worth opening before they click it.
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guides ?? []) {
      const id = classifyGuideTopic(g);
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [guides]);

  const visibleGuides = useMemo(() => {
    if (!guides) return [];
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (topic && classifyGuideTopic(g) !== topic) return false;
      if (!q) return true;
      // Matches the meta description too, not just the title: a reader searching "aluminum" should
      // find a guide whose headline says "Stab-Lok" but whose description names the material.
      return `${g.title} ${g.metaDescription ?? ''}`.toLowerCase().includes(q);
    });
  }, [guides, query, topic]);

  useEffect(() => {
    if (!guides) return;
    applyHeadSeo({
      title: 'Editorial Guides | Before Regret',
      description: 'Every Before Regret research guide in one place -- what to check for a home\'s age, permit history, and inspection blind spots before you sign.',
      canonicalUrl,
      robotsDirective: 'index, follow',
      jsonLdSchema: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Before Regret', 'item': 'https://www.beforeregret.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Editorial Guides', 'item': canonicalUrl }
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          'itemListElement': guides.map((g, idx) => ({
            '@type': 'ListItem',
            'position': idx + 1,
            'url': `https://www.beforeregret.com/guides/${g.slug}/`,
            'name': g.title
          }))
        }
      ]
    });
  }, [guides, canonicalUrl]);

  // Same layout the static hub ships (see GuidesHubLayout.tsx). Before the list loads it renders
  // with no guides plus a status line; once loaded, the resting view is identical to the static
  // page and only the filters change what is shown.
  return (
    <GuidesHubLayout<GuideRow>
      guides={guides ?? []}
      visibleGuides={visibleGuides}
      onNavigate={onNavigate}
      query={query}
      topic={topic}
      topicCounts={topicCounts}
      onQueryChange={setQuery}
      onTopicChange={setTopic}
      status={
        loadError ? (
          <div className="mt-6 rounded-3xl bg-white border border-home-linen p-8 text-center text-sm text-slate-500">{loadError}</div>
        ) : !guides ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
        ) : guides.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-white border border-home-linen p-8 text-center text-sm text-slate-500">No guides published yet -- check back soon.</div>
        ) : null
      }
    />
  );
};
