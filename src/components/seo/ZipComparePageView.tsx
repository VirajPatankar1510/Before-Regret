import React, { useEffect } from 'react';
import { ZIP_COMPARISONS_DATASET, ZIP_PSEO_DATASET } from '../../data/seoDataset';
import { generateZipComparisonArticle } from '../../utils/seoLongformGenerator';
import { applyHeadSeo } from '../../utils/headSeo';
import { Scale, ChevronRight, CheckCircle2, Trophy, ArrowRight, ShieldAlert, Info } from 'lucide-react';

interface ZipComparePageViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ZipComparePageView: React.FC<ZipComparePageViewProps> = ({ slug, onNavigate }) => {
  const comparison = ZIP_COMPARISONS_DATASET.find(c => c.slug === slug);
  const canonicalUrl = `https://beforeregret.com/compare/${slug}/`;

  const zipAData = comparison ? ZIP_PSEO_DATASET[comparison.zipA] : undefined;
  const zipBData = comparison ? ZIP_PSEO_DATASET[comparison.zipB] : undefined;

  const article = (zipAData && zipBData && comparison) 
    ? generateZipComparisonArticle(zipAData, zipBData, comparison.summaryVerdict) 
    : null;

  useEffect(() => {
    if (comparison && article) {
      applyHeadSeo({
        title: article.title,
        description: article.metaDescription,
        canonicalUrl,
        robotsDirective: comparison.robotsDirective,
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
            '@type': 'WebPage',
            'name': `${comparison.zipA} vs ${comparison.zipB} Real Estate Comparison`,
            'description': comparison.summaryVerdict
          }
        ]
      });
    }
  }, [comparison, article, canonicalUrl]);

  if (!comparison || !zipAData || !zipBData || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Comparison Data Unavailable</h1>
        <p className="text-xs text-slate-600">Per Stage 2 rules, comparison pages are only generated when both zip codes have rich underlying data.</p>
        <button onClick={() => onNavigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-blue-600">Comparisons</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{comparison.zipA} vs {comparison.zipB}</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-600 text-white font-mono text-xs font-bold rounded-lg">
              ZIP COMPARISON
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg">
              {comparison.city}, {comparison.state}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-emerald-400 font-mono text-xs font-bold rounded-lg">
              {article.wordCount.toLocaleString()} Words
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {article.title}
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {article.metaDescription}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Executive Summary Verdict Box */}
        <div className="bg-blue-900 text-white border border-blue-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Data-Backed Comparative Verdict</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-blue-100 font-medium">
            {comparison.summaryVerdict}
          </p>
        </div>

        {/* Article Sections */}
        {article.sections.map((sec, idx) => (
          <React.Fragment key={sec.id}>
            <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                {sec.title}
              </h2>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {sec.paragraphs.map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            </article>

            {/* Insert Side-by-Side Comparison Table after section 2 */}
            {idx === 1 && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-600" />
                    <span>Direct Metric Comparison Table: Zip {comparison.zipA} vs Zip {comparison.zipB}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">100% Sourced</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-mono uppercase text-[11px]">
                        <th className="p-4 font-bold">Category</th>
                        <th className="p-4 font-bold text-blue-700">ZIP {comparison.zipA} ({zipAData.neighborhoodName})</th>
                        <th className="p-4 font-bold text-indigo-700">ZIP {comparison.zipB} ({zipBData.neighborhoodName})</th>
                        <th className="p-4 font-bold text-emerald-700">Winner / Advantage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {comparison.comparisonPoints.map((pt, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{pt.category}</td>
                          <td className="p-4 font-mono font-semibold text-slate-800">{pt.zipAVal}</td>
                          <td className="p-4 font-mono font-semibold text-slate-800">{pt.zipBVal}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                              {pt.winner}
                            </span>
                            <div className="text-[11px] text-slate-500 pt-1 font-normal">{pt.context}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Links to Full Zip Hubs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button
            onClick={() => onNavigate(`/state/texas/${comparison.city.toLowerCase()}/${comparison.zipA}/`)}
            className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-500 transition-all text-left space-y-2 group cursor-pointer shadow-xs"
          >
            <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 flex items-center justify-between">
              <span>View Full Zip {comparison.zipA} Intelligence Hub</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <p className="text-xs text-slate-500">Explore complete flood hazard layers, permit logs, and fiber availability for {comparison.zipA}.</p>
          </button>

          <button
            onClick={() => onNavigate(`/state/texas/${comparison.city.toLowerCase()}/${comparison.zipB}/`)}
            className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-500 transition-all text-left space-y-2 group cursor-pointer shadow-xs"
          >
            <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 flex items-center justify-between">
              <span>View Full Zip {comparison.zipB} Intelligence Hub</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <p className="text-xs text-slate-500">Explore complete flood hazard layers, permit logs, and fiber availability for {comparison.zipB}.</p>
          </button>
        </div>

      </div>
    </div>
  );
};

