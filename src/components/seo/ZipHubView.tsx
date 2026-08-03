import React, { useEffect } from 'react';
import { ZIP_PSEO_DATASET, SINGLE_TOPICS_METADATA } from '../../data/seoDataset';
import { evaluateZipUniqueness } from '../../utils/seoUniquenessEvaluator';
import { generateZipHubArticle } from '../../utils/seoLongformGenerator';
import { applyHeadSeo } from '../../utils/headSeo';
import { TopicSlug } from '../../types/seoTypes';
import { 
  ShieldAlert, Waves, Wifi, Building2, Radio, 
  Hospital, Flame, CheckCircle2, ArrowRight, ExternalLink,
  Lock, AlertTriangle, Layers, MapPin, ChevronRight, FileText, Scale, Info
} from 'lucide-react';

interface ZipHubViewProps {
  stateSlug: string;
  citySlug: string;
  zipCode: string;
  onNavigate: (path: string) => void;
}

export const ZipHubView: React.FC<ZipHubViewProps> = ({
  stateSlug,
  citySlug,
  zipCode,
  onNavigate
}) => {
  const data = ZIP_PSEO_DATASET[zipCode];
  const uniquenessEval = evaluateZipUniqueness(data || {});

  const article = data ? generateZipHubArticle(data) : null;

  const canonicalUrl = `https://beforeregret.com/state/${stateSlug}/${citySlug}/${zipCode}/`;
  const isIndexable = uniquenessEval.passed;
  const robotsDirective = isIndexable ? 'index, follow' : 'noindex, follow';

  useEffect(() => {
    if (data && article) {
      applyHeadSeo({
        title: article.title,
        description: article.metaDescription,
        canonicalUrl,
        robotsDirective,
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': article.title,
            'description': article.metaDescription,
            'wordCount': article.wordCount,
            'author': {
              '@type': 'Organization',
              'name': 'BeforeRegret GIS & Environmental Intelligence Team'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Place',
            'name': `Zip Code ${data.zipCode} - ${data.neighborhoodName}`,
            'address': {
              '@type': 'PostalAddress',
              'postalCode': data.zipCode,
              'addressLocality': data.city,
              'addressRegion': data.state,
              'addressCountry': 'US'
            },
            'description': `Public property research and environmental risk profile for ${data.zipCode}.`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': data.stateFullName, 'item': `https://beforeregret.com/state/${stateSlug}/` },
              { '@type': 'ListItem', 'position': 3, 'name': data.city, 'item': `https://beforeregret.com/state/${stateSlug}/${citySlug}/` },
              { '@type': 'ListItem', 'position': 4, 'name': data.zipCode, 'item': canonicalUrl }
            ]
          }
        ]
      });
    }
  }, [data, article, canonicalUrl, robotsDirective, stateSlug, citySlug]);

  if (!data || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Zip Code Data Pending Review</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Data for zip code <strong>{zipCode}</strong> has not yet completed Stage 0–4 processing. To preserve content quality, dedicated pages are published only when data completeness is guaranteed.
        </p>
        <button
          onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/`)}
          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 cursor-pointer"
        >
          Return to {citySlug.toUpperCase()} City Hub
        </button>
      </div>
    );
  }

  const topicSlugList: Array<{ slug: TopicSlug; title: string; icon: React.ReactNode }> = [
    { slug: 'flood-risk', title: 'FEMA Flood Risk & Hydrology', icon: <Waves className="w-5 h-5 text-blue-500" /> },
    { slug: 'permits', title: 'Municipal Building Permits', icon: <Building2 className="w-5 h-5 text-emerald-500" /> },
    { slug: 'noise', title: 'Ambient Noise & Flight Paths', icon: <Radio className="w-5 h-5 text-purple-500" /> },
    { slug: 'radon', title: 'USGS / EPA Radon Zone', icon: <ShieldAlert className="w-5 h-5 text-amber-500" /> },
    { slug: 'broadband', title: 'Gigabit Fiber Broadband', icon: <Wifi className="w-5 h-5 text-indigo-500" /> }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate(`/state/${stateSlug}/`)} className="capitalize hover:text-blue-600">{data.stateFullName}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/`)} className="hover:text-blue-600">{data.city}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{data.zipCode} Hub</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-600 text-white font-mono text-xs font-bold rounded-lg">
              ZIP {data.zipCode}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg">
              {data.neighborhoodName}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg">
              {data.city}, {data.state}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-emerald-400 font-mono text-xs font-bold rounded-lg">
              {article.wordCount.toLocaleString()} Words
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {article.metaDescription}
          </p>
        </div>
      </div>

      {/* Main Prose Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Quick Nav Bar for Deep Topics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Deep Single-Topic Analyses:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {topicSlugList.map(t => (
              <button
                key={t.slug}
                onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${zipCode}/${t.slug}/`)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{t.title}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Article Sections */}
        {article.sections.map((sec) => (
          <article 
            key={sec.id} 
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs"
          >
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              {sec.title}
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {sec.paragraphs.map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))}
            </div>

            {/* Integrated Metrics Callout */}
            {sec.callout && (
              <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{sec.callout.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {sec.callout.content}
                </p>

                {sec.callout.metrics && sec.callout.metrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {sec.callout.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">{m.label}</div>
                        <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">{m.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}

        {/* Deep Single-Topic Cards Navigation */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Explore Granular Single-Topic Deep Pages for Zip {data.zipCode}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each deep page contains 1,200+ words of parcel-level research, GIS methodology, and inspection checklists.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicSlugList.map((topic) => (
              <div 
                key={topic.slug} 
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-all shadow-xs flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      {topic.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      {topic.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {SINGLE_TOPICS_METADATA[topic.slug]?.whyItMattersLine}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${zipCode}/${topic.slug}/`)}
                  className="w-full py-2 bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 group-hover:border-blue-600 cursor-pointer shadow-xs"
                >
                  <span>Read 1,200+ Word {topic.title} Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Public Source Evidence Log */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Public API Data Evidence Trail for {data.zipCode}</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">100% Sourced</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {data.evidenceTrail.map((ev, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{ev.sourceName}</div>
                  <div className="text-slate-500 text-[11px]">{ev.evidenceDataPoint}</div>
                </div>
                <a 
                  href={ev.sourceUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-medium shrink-0"
                >
                  <span>Verify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
            {data.evidenceTrail.length === 0 && (
              <div className="py-3 text-slate-400 text-center text-xs">No external API logs bound to this view.</div>
            )}
          </div>
        </div>

        {/* Comparative Zip Links */}
        <div className="bg-blue-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
          <div className="flex items-center gap-2 font-bold text-blue-300 text-xs font-mono uppercase tracking-wider">
            <Scale className="w-4 h-4 text-blue-400" />
            <span>Popular Neighborhood Comparisons for Zip {data.zipCode}</span>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Compare data density, flood risk, and building permit trends directly between neighboring zip codes:
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => onNavigate('/compare/78701-vs-78704/')}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>78701 vs 78704 Long-Form Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('/compare/78704-vs-78746/')}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>78704 vs 78746 Long-Form Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
