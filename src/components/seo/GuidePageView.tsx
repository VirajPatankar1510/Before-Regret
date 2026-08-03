import React, { useEffect } from 'react';
import { EDITORIAL_GUIDES_DATASET, ZIP_PSEO_DATASET } from '../../data/seoDataset';
import { applyHeadSeo } from '../../utils/headSeo';
import { ChevronRight, BookOpen, Clock, Calendar, User, ArrowRight, HelpCircle, FileText } from 'lucide-react';

interface GuidePageViewProps {
  guideSlug: string;
  onNavigate: (path: string) => void;
}

export const GuidePageView: React.FC<GuidePageViewProps> = ({ guideSlug, onNavigate }) => {
  const guide = EDITORIAL_GUIDES_DATASET.find(g => g.slug === guideSlug);

  const canonicalUrl = `https://beforeregret.com/guides/${guideSlug}/`;

  useEffect(() => {
    if (guide) {
      applyHeadSeo({
        title: `${guide.title} | BeforeRegret Guides`,
        description: guide.metaDescription,
        canonicalUrl,
        robotsDirective: guide.robotsDirective,
        jsonLdSchema: [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': guide.title,
            'description': guide.metaDescription,
            'image': 'https://beforeregret.com/hero-bg.png',
            'datePublished': guide.publishDate,
            'author': {
              '@type': 'Organization',
              'name': guide.author
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': guide.faqs.map(faq => ({
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
              { '@type': 'ListItem', 'position': 2, 'name': 'Editorial Guides', 'item': 'https://beforeregret.com/guides/' },
              { '@type': 'ListItem', 'position': 3, 'name': guide.title, 'item': canonicalUrl }
            ]
          }
        ]
      });
    }
  }, [guide, canonicalUrl]);

  if (!guide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Guide Not Found</h1>
        <p className="text-xs text-slate-600">The requested editorial guide is unavailable.</p>
        <button onClick={() => onNavigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  const referencedZipData = guide.referencedZipCodes.map(z => ZIP_PSEO_DATASET[z]).filter(Boolean);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto">
          <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="hover:text-blue-600">Editorial Guides</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate">{guide.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Guide Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-lg">
              EVERGREEN GUIDE
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{guide.readTimeMinutes} min read</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{guide.publishDate}</span>
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{guide.author}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {guide.title}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {guide.summary}
          </p>
        </div>

        {/* Article Markdown Content */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
          <div className="prose max-w-none space-y-4 whitespace-pre-line">
            {guide.contentMarkdown}
          </div>
        </div>

        {/* Supporting Zip Data Panel */}
        {referencedZipData.length > 0 && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Referenced Zip Code Data Points in this Guide</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {referencedZipData.map(z => (
                <div key={z.zipCode} className="bg-white border border-blue-200 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">ZIP {z.zipCode} ({z.neighborhoodName})</span>
                    <button
                      onClick={() => onNavigate(`/state/texas/${z.city.toLowerCase()}/${z.zipCode}/`)}
                      className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    FEMA: {z.floodZone} | Permits: {z.recentPermitsCount12mo}/yr | Fiber: {z.fiberCoveragePercent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-3 text-xs">
            {guide.faqs.map((faq, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900">{faq.question}</div>
                <div className="text-slate-600 leading-relaxed">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
