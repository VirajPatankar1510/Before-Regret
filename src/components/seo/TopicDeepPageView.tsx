import React, { useEffect } from 'react';
import { ZIP_PSEO_DATASET, SINGLE_TOPICS_METADATA } from '../../data/seoDataset';
import { evaluateZipUniqueness } from '../../utils/seoUniquenessEvaluator';
import { generateTopicDeepArticle } from '../../utils/seoLongformGenerator';
import { applyHeadSeo } from '../../utils/headSeo';
import { TopicSlug } from '../../types/seoTypes';
import { 
  ShieldAlert, Waves, Wifi, Building2, Radio, 
  ChevronRight, ArrowLeft, HelpCircle, CheckCircle, ExternalLink, Info, AlertTriangle, FileText, CheckCircle2
} from 'lucide-react';

interface TopicDeepPageViewProps {
  stateSlug: string;
  citySlug: string;
  zipCode: string;
  topicSlug: TopicSlug;
  onNavigate: (path: string) => void;
}

export const TopicDeepPageView: React.FC<TopicDeepPageViewProps> = ({
  stateSlug,
  citySlug,
  zipCode,
  topicSlug,
  onNavigate
}) => {
  const zipData = ZIP_PSEO_DATASET[zipCode];
  const topicMeta = SINGLE_TOPICS_METADATA[topicSlug];
  const uniquenessEval = evaluateZipUniqueness(zipData || {});

  const article = zipData ? generateTopicDeepArticle(zipData, topicSlug) : null;

  const canonicalUrl = `https://beforeregret.com/state/${stateSlug}/${citySlug}/${zipCode}/${topicSlug}/`;
  const isIndexable = uniquenessEval.passed;
  const robotsDirective = isIndexable ? 'index, follow' : 'noindex, follow';

  useEffect(() => {
    if (zipData && topicMeta && article) {
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
            '@type': 'FAQPage',
            'mainEntity': article.faqs.map(faq => ({
              '@type': 'Question',
              'name': faq.question,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer
              }
            }))
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://beforeregret.com/' },
              { '@type': 'ListItem', 'position': 2, 'name': zipData.stateFullName, 'item': `https://beforeregret.com/state/${stateSlug}/` },
              { '@type': 'ListItem', 'position': 3, 'name': zipData.city, 'item': `https://beforeregret.com/state/${stateSlug}/${citySlug}/` },
              { '@type': 'ListItem', 'position': 4, 'name': zipData.zipCode, 'item': `https://beforeregret.com/state/${stateSlug}/${citySlug}/${zipCode}/` },
              { '@type': 'ListItem', 'position': 5, 'name': topicMeta.topicTitle, 'item': canonicalUrl }
            ]
          }
        ]
      });
    }
  }, [zipData, topicMeta, article, canonicalUrl, robotsDirective, stateSlug, citySlug, zipCode, topicSlug]);

  if (!zipData || !topicMeta || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Topic Page Unavailable</h1>
        <p className="text-xs text-slate-600">The requested topic analysis for zip code {zipCode} is currently missing required data.</p>
        <button onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${zipCode}/`)} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Back to Zip Hub
        </button>
      </div>
    );
  }

  const topicIconMap: Record<TopicSlug, React.ReactNode> = {
    'flood-risk': <Waves className="w-6 h-6 text-blue-500" />,
    'permits': <Building2 className="w-6 h-6 text-emerald-500" />,
    'noise': <Radio className="w-6 h-6 text-purple-500" />,
    'radon': <ShieldAlert className="w-6 h-6 text-amber-500" />,
    'broadband': <Wifi className="w-6 h-6 text-indigo-500" />
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate(`/state/${stateSlug}/`)} className="capitalize hover:text-blue-600">{zipData.stateFullName}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/`)} className="hover:text-blue-600">{zipData.city}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${zipCode}/`)} className="hover:text-blue-600">{zipData.zipCode}</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold capitalize">{topicSlug.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <button
            onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${zipCode}/`)}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {zipData.zipCode} Hub Overview</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
              {topicIconMap[topicSlug]}
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>Zip {zipData.zipCode} Deep Analysis</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-md">
                  {article.wordCount.toLocaleString()} Words
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {article.title}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {article.metaDescription}
          </p>
        </div>
      </div>

      {/* Main Long-Form Article Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Render Each Article Section */}
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

            {/* Integrated Data Visualization / Callout Box */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

        {/* Actionable Due Diligence Checklist */}
        <div className="bg-blue-900 text-white border border-blue-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-md">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Buyer & Renter Option Period Action Protocol</span>
          </div>

          <h3 className="text-lg font-extrabold text-white">
            Practical Due Diligence Checklist for Properties in Zip {zipData.zipCode}
          </h3>

          <ul className="space-y-3 text-xs sm:text-sm text-blue-100">
            {article.actionableChecklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-blue-950/60 p-3.5 rounded-xl border border-blue-800/60">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ Section */}
        {article.faqs.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Frequently Asked Questions ({topicMeta.topicTitle})</span>
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              {article.faqs.map((faq, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="font-bold text-slate-900">{faq.question}</div>
                  <div className="text-slate-600 leading-relaxed">{faq.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Ledger Trail */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Public API Source Evidence Trail</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">100% Sourced</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {zipData.evidenceTrail.map((ev, i) => (
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
          </div>
        </div>

        {/* Back Link to Hub */}
        <div className="pt-4 text-center">
          <button
            onClick={() => onNavigate(`/state/${stateSlug}/${citySlug}/${zipCode}/`)}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            ← Return to Full {zipData.zipCode} Zip Hub Overview
          </button>
        </div>

      </div>
    </div>
  );
};

