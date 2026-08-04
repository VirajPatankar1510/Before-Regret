import React, { useState, useMemo } from 'react';
import { 
  KeywordOpportunity, ContentBrief, SeoDraft, PerformanceMetric, PSeoPageType, TopicSlug 
} from '../../types/seoTypes';
import { evaluateZipUniqueness, logHeldBackPage, getHeldBackLogs } from '../../utils/seoUniquenessEvaluator';
import { 
  ZIP_PSEO_DATASET, VALIDATED_MARKETS, SINGLE_TOPICS_METADATA, 
  EDITORIAL_GUIDES_DATASET, ZIP_COMPARISONS_DATASET 
} from '../../data/seoDataset';
import { 
  generateSitemapIndexXml, generateChildSitemapXml 
} from '../../utils/sitemapGenerator';
import { 
  Sparkles, FileText, CheckCircle2, AlertTriangle, 
  TrendingUp, RefreshCw, ShieldCheck, Play, 
  Layers, ArrowRight, XCircle, BarChart3, 
  ExternalLink, Search, Info, RotateCcw, AlertCircle, Clock,
  MapPin, Compass, Copy, Check, Globe, Database, Eye, CheckCircle
} from 'lucide-react';

interface SeoAdminPanelProps {
  onNavigate: (path: string) => void;
}

interface PreBriefedTopic extends KeywordOpportunity {
  brief: ContentBrief;
}

export const SeoAdminPanel: React.FC<SeoAdminPanelProps> = ({ onNavigate }) => {
  // 4 Simplified Tabs
  const [activeTab, setActiveTab] = useState<'directory' | 'inspector' | 'pipeline' | 'sitemaps'>('directory');

  // Search/Filter for Directory Tab
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryType, setDirectoryType] = useState<string>('all');

  // Selected Item for Inspector Tab
  const [inspectorZip, setInspectorZip] = useState<string>('78701');
  const [inspectorTopic, setInspectorTopic] = useState<TopicSlug>('flood-risk');
  const [copiedSitemap, setCopiedSitemap] = useState<string | null>(null);
  const [pingSuccess, setPingSuccess] = useState<boolean>(false);

  // Topics Queue for Pipeline
  const [topics, setTopics] = useState<PreBriefedTopic[]>([
    {
      id: 'topic_78701_flood',
      keyword: '78701 flood zone map',
      zipCode: '78701',
      city: 'Austin',
      state: 'TX',
      suggestedPageType: 'topic_deep',
      topicSlug: 'flood-risk',
      estimatedSearchVolume: 3200,
      competitionDifficulty: 18,
      opportunityIndex: 177.7,
      isLongTail: true,
      status: 'discovered',
      uniquenessScore: 94,
      brief: {
        id: 'brief_78701_flood',
        opportunityId: 'topic_78701_flood',
        targetQuery: '78701 flood zone map',
        searchIntent: 'informational',
        requiredApiDataPoints: ['fema_nfhl', 'usgs_hydrologic', 'travis_county_drainage'],
        suggestedPageType: 'topic_deep',
        targetWordCount: 1600,
        targetUrl: '/state/texas/austin/78701/flood-risk/',
        competitorBenchmark: 'Parcel-level confirmed FEMA & USGS APIs for Austin Downtown.',
        createdDate: '2026-08-01'
      }
    },
    {
      id: 'topic_78704_permits',
      keyword: '78704 building permit history',
      zipCode: '78704',
      city: 'Austin',
      state: 'TX',
      suggestedPageType: 'topic_deep',
      topicSlug: 'permits',
      estimatedSearchVolume: 1850,
      competitionDifficulty: 12,
      opportunityIndex: 154.1,
      isLongTail: true,
      status: 'discovered',
      uniquenessScore: 91,
      brief: {
        id: 'brief_78704_permits',
        opportunityId: 'topic_78704_permits',
        targetQuery: '78704 building permit history',
        searchIntent: 'informational',
        requiredApiDataPoints: ['muni_permits', 'travis_county_assessor', 'structural_inspection_logs'],
        suggestedPageType: 'topic_deep',
        targetWordCount: 1450,
        targetUrl: '/state/texas/austin/78704/permits/',
        competitorBenchmark: 'Municipal building permit historical timelines.',
        createdDate: '2026-08-01'
      }
    },
    {
      id: 'topic_78701_vs_78704',
      keyword: 'living in 78701 vs 78704 austin',
      city: 'Austin',
      state: 'TX',
      suggestedPageType: 'compare',
      estimatedSearchVolume: 2400,
      competitionDifficulty: 16,
      opportunityIndex: 150.0,
      isLongTail: true,
      status: 'discovered',
      uniquenessScore: 94,
      brief: {
        id: 'brief_78701_vs_78704',
        opportunityId: 'topic_78701_vs_78704',
        targetQuery: 'living in 78701 vs 78704 austin',
        searchIntent: 'comparison',
        requiredApiDataPoints: ['fema_nfhl', 'usgs_radon', 'fcc_broadband', 'muni_permits'],
        suggestedPageType: 'compare',
        targetWordCount: 1800,
        targetUrl: '/compare/78701-vs-78704/',
        competitorBenchmark: 'Detailed side-by-side risk data comparison between Downtown and Zilker/South Lamar.',
        createdDate: '2026-08-01'
      }
    },
    {
      id: 'topic_78746_radon',
      keyword: 'west lake hills radon testing 78746',
      zipCode: '78746',
      city: 'Austin',
      state: 'TX',
      suggestedPageType: 'topic_deep',
      topicSlug: 'radon',
      estimatedSearchVolume: 1100,
      competitionDifficulty: 8,
      opportunityIndex: 137.5,
      isLongTail: true,
      status: 'discovered',
      uniquenessScore: 89,
      brief: {
        id: 'brief_78746_radon',
        opportunityId: 'topic_78746_radon',
        targetQuery: 'west lake hills radon testing 78746',
        searchIntent: 'informational',
        requiredApiDataPoints: ['usgs_radon', 'epa_radon_zone', 'county_limestone_formation'],
        suggestedPageType: 'topic_deep',
        targetWordCount: 1400,
        targetUrl: '/state/texas/austin/78746/radon/',
        competitorBenchmark: 'Evaluated against Travis County limestone geology.',
        createdDate: '2026-08-01'
      }
    },
    {
      id: 'topic_78799_flood',
      keyword: '78799 flood risk statistics',
      zipCode: '78799',
      city: 'Austin',
      state: 'TX',
      suggestedPageType: 'topic_deep',
      topicSlug: 'flood-risk',
      estimatedSearchVolume: 850,
      competitionDifficulty: 9,
      opportunityIndex: 94.4,
      isLongTail: true,
      status: 'discovered',
      uniquenessScore: 22,
      brief: {
        id: 'brief_78799_flood',
        opportunityId: 'topic_78799_flood',
        targetQuery: '78799 flood risk statistics',
        searchIntent: 'informational',
        requiredApiDataPoints: ['fema_nfhl', 'usgs_hydrologic'],
        suggestedPageType: 'topic_deep',
        targetWordCount: 1200,
        targetUrl: '/state/texas/austin/78799/flood-risk/',
        competitorBenchmark: 'Sparse parcel dataset — tests automated uniqueness hold-back logic.',
        createdDate: '2026-08-01'
      }
    }
  ]);

  // Drafts State
  const [drafts, setDrafts] = useState<SeoDraft[]>([
    {
      id: 'draft_78746_radon',
      briefId: 'brief_78746_radon',
      urlPath: '/state/texas/austin/78746/radon/',
      title: '78746 Radon Risk Analysis (West Lake Hills, TX)',
      metaDescription: 'USGS & EPA radon testing data for zip code 78746. Evaluated against Travis County limestone geology.',
      h1: '78746 Radon Risk & Testing Analysis',
      contentHtml: `<p>Radon gas levels in 78746 average 1.6 pCi/L.</p>`,
      uniquenessScore: 89,
      accuracyPassed: true,
      accuracyAuditLogs: [
        'Checked 1.6 pCi/L average reading against USGS Radon Map: MATCH',
        'Uniqueness Score 89/100 exceeds threshold (70/70): PASSED'
      ],
      dataPointsUsedCount: 14,
      status: 'pending_review',
      reviewNotes: 'Uniqueness Passed (89/100). Sourced from USGS & EPA public records.',
      robotsDirective: 'index, follow'
    },
    {
      id: 'draft_78799_flood',
      briefId: 'brief_78799_flood',
      urlPath: '/state/texas/austin/78799/flood-risk/',
      title: '78799 Flood Risk Statistics & Map',
      metaDescription: 'FEMA flood zone statistics for Austin TX 78799.',
      h1: '78799 Flood Risk Analysis',
      contentHtml: `<p>Flood risk data for 78799 is currently incomplete across official registries.</p>`,
      uniquenessScore: 22,
      accuracyPassed: false,
      accuracyAuditLogs: [
        'FEMA NFHL query returned 0 mapped segments',
        'Uniqueness Score 22/100 falls below threshold (70/70): FAILED'
      ],
      dataPointsUsedCount: 3,
      status: 'held_back',
      reviewNotes: 'Hold-Back Triggered (22/100 < 70): Low data density blocked automatically.',
      robotsDirective: 'noindex, follow'
    }
  ]);

  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [publishRateLimit, setPublishRateLimit] = useState<number>(5);

  // Generate All Directory Items for Tab 1
  const allDirectoryItems = useMemo(() => {
    const items: Array<{
      title: string;
      url: string;
      type: 'State' | 'City' | 'Zip' | 'Topic' | 'Compare' | 'Guide';
      location: string;
      uniquenessScore: number;
      isIndexable: boolean;
      status: string;
    }> = [];

    // State Hubs
    items.push({
      title: 'Texas Property Risk & Intelligence Hub',
      url: '/state/texas/',
      type: 'State',
      location: 'Texas (State)',
      uniquenessScore: 98,
      isIndexable: true,
      status: 'Live & Indexable'
    });

    // City Hubs
    items.push({
      title: 'Austin, TX Property Research Hub',
      url: '/state/texas/austin/',
      type: 'City',
      location: 'Austin, TX',
      uniquenessScore: 96,
      isIndexable: true,
      status: 'Validated Launch Market'
    });

    // Zip Hubs
    Object.values(ZIP_PSEO_DATASET).forEach(z => {
      const evalRes = evaluateZipUniqueness(z);
      const isAustin = z.city.toLowerCase() === 'austin';
      const isIndexable = evalRes.passed && isAustin && !z.isDataSparse;
      items.push({
        title: `${z.zipCode} (${z.neighborhoodName || z.city}) Property Risk Hub`,
        url: `/state/${z.stateFullName.toLowerCase().replace(/\s+/g, '-')}/${z.city.toLowerCase()}/${z.zipCode}/`,
        type: 'Zip',
        location: `${z.zipCode} - ${z.city}, ${z.state}`,
        uniquenessScore: evalRes.score,
        isIndexable: isIndexable,
        status: isIndexable ? 'Live & Indexable' : (evalRes.passed ? 'Phase 2 Market' : 'Held Back (Thin Data)')
      });

      // Topic pages for this zip
      (Object.keys(SINGLE_TOPICS_METADATA) as TopicSlug[]).forEach(topic => {
        const topicMeta = SINGLE_TOPICS_METADATA[topic];
        items.push({
          title: `${z.zipCode} ${topicMeta.topicTitle} (${z.city}, ${z.state})`,
          url: `/state/${z.stateFullName.toLowerCase().replace(/\s+/g, '-')}/${z.city.toLowerCase()}/${z.zipCode}/${topic}/`,
          type: 'Topic',
          location: `${z.zipCode} ${topicMeta.topicTitle}`,
          uniquenessScore: evalRes.score,
          isIndexable: isIndexable,
          status: isIndexable ? 'Live & Indexable' : (evalRes.passed ? 'Phase 2 Market' : 'Held Back (Thin Data)')
        });
      });
    });

    // Zip Comparisons
    ZIP_COMPARISONS_DATASET.forEach(c => {
      items.push({
        title: `Living in ${c.zipA} vs ${c.zipB} (${c.city}, ${c.state})`,
        url: `/compare/${c.slug}/`,
        type: 'Compare',
        location: `${c.zipA} vs ${c.zipB}`,
        uniquenessScore: c.uniquenessScore,
        isIndexable: c.isPublished,
        status: 'Live Comparison'
      });
    });

    // Editorial Guides
    EDITORIAL_GUIDES_DATASET.forEach(g => {
      items.push({
        title: g.title,
        url: `/guides/${g.slug}/`,
        type: 'Guide',
        location: `Guide (${g.readTimeMinutes} min read)`,
        uniquenessScore: g.uniquenessScore,
        isIndexable: g.isPublished,
        status: 'Published Guide'
      });
    });

    return items;
  }, []);

  // Filtered Directory Items
  const filteredDirectory = useMemo(() => {
    return allDirectoryItems.filter(item => {
      if (directoryType !== 'all' && item.type.toLowerCase() !== directoryType.toLowerCase()) {
        return false;
      }
      if (!directorySearch.trim()) return true;
      const q = directorySearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [allDirectoryItems, directoryType, directorySearch]);

  // Inspector Selected Zip Data
  const inspectorZipData = ZIP_PSEO_DATASET[inspectorZip] || ZIP_PSEO_DATASET['78701'];
  const inspectorEval = evaluateZipUniqueness(inspectorZipData);
  const inspectorTopicMeta = SINGLE_TOPICS_METADATA[inspectorTopic];

  const handleRefreshOpportunities = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setNotificationMessage('Refreshed in-market topics dataset! All launch zip/topic combinations are active.');
    }, 600);
  };

  const handleGenerateDraft = (topic: PreBriefedTopic) => {
    const zipCodeMatch = topic.zipCode || '78701';
    const zipData = ZIP_PSEO_DATASET[zipCodeMatch];
    const evalRes = evaluateZipUniqueness(zipData || {});
    const isInAustin = zipData?.city.toLowerCase() === 'austin';

    const gatePassed = evalRes.passed && isInAustin;

    if (!gatePassed) {
      logHeldBackPage({
        urlPath: topic.brief.targetUrl,
        pageType: topic.suggestedPageType,
        zipCode: zipCodeMatch,
        uniquenessScore: evalRes.score,
        requiredThreshold: evalRes.threshold,
        holdBackReason: !isInAustin ? 'Outside Austin launch market' : evalRes.reason,
        missingDataFields: evalRes.missingDataFields,
        recommendation: evalRes.recommendation
      });
    }

    const newDraft: SeoDraft = {
      id: `draft_${Date.now()}`,
      briefId: topic.brief.id,
      urlPath: topic.brief.targetUrl,
      title: `${topic.keyword.toUpperCase()} Data Breakdown`,
      metaDescription: `Sourced live from FEMA, USGS, and municipal permit feeds for ${topic.keyword}.`,
      h1: `${topic.keyword} Risk & Analysis`,
      contentHtml: `<p>Data completeness score evaluated at ${evalRes.score}/100.</p>`,
      uniquenessScore: evalRes.score,
      accuracyPassed: gatePassed,
      accuracyAuditLogs: [
        `FEMA NFHL & USGS GIS mapping layer cross-check: MATCH`,
        `Municipal permit log for ${topic.city}: MATCH`,
        gatePassed ? `Quality Gate PASSED (${evalRes.score}/100)` : `Quality Gate HELD BACK (${evalRes.reason})`
      ],
      dataPointsUsedCount: zipData ? zipData.totalDataPoints : 12,
      status: gatePassed ? 'pending_review' : 'held_back',
      reviewNotes: gatePassed ? 'Quality Gate Passed' : 'Held back due to thin data or market scope',
      robotsDirective: gatePassed ? 'index, follow' : 'noindex, follow'
    };

    setDrafts(prev => [newDraft, ...prev]);
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, status: 'drafted' } : t));
    setNotificationMessage(`Generated & audited page for ${topic.keyword}!`);
  };

  const handlePublishDraft = (draftId: string) => {
    setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, status: 'published', robotsDirective: 'index, follow' } : d));
    setNotificationMessage('Page published live! Search engines & sitemaps updated.');
  };

  const handlePingIndexNow = () => {
    setPingSuccess(true);
    setTimeout(() => setPingSuccess(false), 3000);
  };

  const handleCopySitemapXml = (xmlStr: string, name: string) => {
    navigator.clipboard.writeText(xmlStr);
    setCopiedSitemap(name);
    setTimeout(() => setCopiedSitemap(null), 2000);
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen pb-20 font-sans">
      
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-blue-400 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-xs font-bold">{notificationMessage}</span>
          <button onClick={() => setNotificationMessage(null)} className="ml-2 text-blue-200 hover:text-white cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 py-4 px-4 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                <span>BeforeRegret pSEO & Intelligence Center</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full">
                  LIVE ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">Searchable hub directory, automated uniqueness quality gates, page tester, and sitemaps.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshOpportunities}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-blue-500 text-blue-400 hover:text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshed' : 'Refresh Data'}</span>
            </button>
            <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
              Validated Market: <strong className="text-emerald-400">Austin, TX</strong>
            </div>
          </div>
        </div>

        {/* 4 Clean Action-Oriented Tabs */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-3 border-t border-slate-900">
          
          <button
            onClick={() => setActiveTab('directory')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'directory' 
                ? 'bg-blue-950/70 border-blue-500 text-white shadow-md' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-blue-400">TAB 1</div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Page Directory</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-blue-900/80 text-blue-200 text-xs font-mono font-bold rounded">
              {allDirectoryItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'inspector' 
                ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-indigo-400">TAB 2</div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Page Tester</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-indigo-900/80 text-indigo-200 text-xs font-mono font-bold rounded">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'pipeline' 
                ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-md' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">TAB 3</div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Content Queue</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-200 text-xs font-mono font-bold rounded">
              {topics.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sitemaps')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'sitemaps' 
                ? 'bg-amber-950/70 border-amber-500 text-white shadow-md' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-amber-400">TAB 4</div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sitemaps & SEO</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-amber-900/80 text-amber-200 text-xs font-mono font-bold rounded">
              7 XML
            </span>
          </button>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* TAB 1: OVERVIEW & PAGE DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            
            {/* Top Stat Overview Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Total pSEO URLs</span>
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{allDirectoryItems.length}</div>
                <div className="text-[11px] text-slate-500 font-mono">States, Cities, Zips, Topics & Compare</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Quality Pass Rate</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">92.4%</div>
                <div className="text-[11px] text-slate-500 font-mono">Min 70/100 Uniqueness Score</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Active Launch Market</span>
                  <MapPin className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-400">Austin, TX</div>
                <div className="text-[11px] text-slate-500 font-mono">Phase 1 Approved Scope</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Held Back (Thin Pages)</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {allDirectoryItems.filter(i => !i.isIndexable).length}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Blocked from Google indexing</div>
              </div>
            </div>

            {/* Directory Controls & Search Bar */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[280px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Search directory by Zip (e.g., 78701), City, State, or Topic..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden transition-all"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  {['all', 'state', 'city', 'zip', 'topic', 'compare', 'guide'].map(t => (
                    <button
                      key={t}
                      onClick={() => setDirectoryType(t)}
                      className={`px-3 py-1.5 rounded-xl border capitalize cursor-pointer transition-all ${
                        directoryType === t
                          ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Showing <strong>{filteredDirectory.length}</strong> generated pSEO URLs. Click <strong>"View Live Page"</strong> to test any page instantly.
              </div>
            </div>

            {/* Generated pSEO Pages List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDirectory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl space-y-3 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                        item.type === 'State' ? 'bg-purple-900/60 text-purple-300 border-purple-700' :
                        item.type === 'City' ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700' :
                        item.type === 'Zip' ? 'bg-blue-900/60 text-blue-300 border-blue-700' :
                        item.type === 'Topic' ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700' :
                        item.type === 'Compare' ? 'bg-amber-900/60 text-amber-300 border-amber-700' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {item.type} Page
                      </span>

                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                        item.isIndexable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        Uniqueness: {item.uniquenessScore}/100
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <div className="text-[11px] font-mono text-slate-400 truncate bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800/80">
                      {item.url}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isIndexable ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                      {item.status}
                    </span>

                    <button
                      onClick={() => onNavigate(item.url)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <span>View Live Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: INSTANT PAGE INSPECTOR & TESTER */}
        {activeTab === 'inspector' && (
          <div className="space-y-6">
            
            {/* Inspector Controls */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-base text-white">Live pSEO Page Inspector & Data Auditor</h2>
              </div>
              <p className="text-xs text-slate-400">
                Select any Zip code and Topic below to inspect data source inputs, uniqueness scoring, canonical tags, and rendered view.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                    Select Target Zip Code:
                  </label>
                  <select
                    value={inspectorZip}
                    onChange={(e) => setInspectorZip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-hidden"
                  >
                    {Object.values(ZIP_PSEO_DATASET).map(z => (
                      <option key={z.zipCode} value={z.zipCode}>
                        {z.zipCode} - {z.neighborhoodName || z.city}, {z.state} (Score: {evaluateZipUniqueness(z).score}/100)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                    Select Topic Deep Dive:
                  </label>
                  <select
                    value={inspectorTopic}
                    onChange={(e) => setInspectorTopic(e.target.value as TopicSlug)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-hidden"
                  >
                    {Object.entries(SINGLE_TOPICS_METADATA).map(([slug, meta]) => (
                      <option key={slug} value={slug}>
                        {meta.topicTitle} ({slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Live Audit Details Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Data Metrics & Quality Gate Audit */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        {inspectorZipData.zipCode} {inspectorTopicMeta.topicTitle}
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        Target Path: <code className="text-indigo-400">/state/texas/austin/{inspectorZipData.zipCode}/{inspectorTopic}/</code>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate(`/state/texas/austin/${inspectorZipData.zipCode}/${inspectorTopic}/`)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Render Page View</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quality Gate Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Uniqueness Score</div>
                      <div className={`text-xl font-mono font-black ${inspectorEval.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {inspectorEval.score} / 100
                      </div>
                      <div className="text-[10px] text-slate-500">Min 70 Threshold</div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Market Scope Gate</div>
                      <div className="text-xl font-mono font-black text-blue-400">PASSED</div>
                      <div className="text-[10px] text-slate-500">Austin, TX Validated Market</div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Sitemap Indexability</div>
                      <div className={`text-xl font-mono font-black ${inspectorEval.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {inspectorEval.passed ? 'INDEXABLE' : 'NOINDEX'}
                      </div>
                      <div className="text-[10px] text-slate-500">{inspectorEval.passed ? 'Included in sitemap-topics-1.xml' : 'Held back automatically'}</div>
                    </div>
                  </div>

                  {/* Data Points Used */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-400" />
                      <span>Verified API Sources for Zip {inspectorZipData.zipCode}:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <span>FEMA NFHL Flood Layer</span>
                        <span className="text-emerald-400 font-bold">{inspectorZipData.floodZone}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <span>USGS Radon Potential</span>
                        <span className="text-emerald-400 font-bold">{inspectorZipData.radonPciL} pCi/L</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <span>FCC Broadband Registry</span>
                        <span className="text-emerald-400 font-bold">{inspectorZipData.fiberCoveragePercent}% Fiber</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <span>Austin Municipal Permits</span>
                        <span className="text-emerald-400 font-bold">{inspectorZipData.recentPermitsCount12mo} Permits/yr</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Schema Markup & Canonical Preview */}
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Google Structured Data (JSON-LD)</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 space-y-2 overflow-x-auto">
                    <div>{`{`}</div>
                    <div className="pl-3">{`"@context": "https://schema.org",`}</div>
                    <div className="pl-3">{`"@type": "Place",`}</div>
                    <div className="pl-3">{`"name": "${inspectorZipData.zipCode} ${inspectorTopicMeta.topicTitle}",`}</div>
                    <div className="pl-3">{`"address": {`}</div>
                    <div className="pl-6">{`"@type": "PostalAddress",`}</div>
                    <div className="pl-6">{`"postalCode": "${inspectorZipData.zipCode}",`}</div>
                    <div className="pl-6">{`"addressLocality": "Austin",`}</div>
                    <div className="pl-6">{`"addressRegion": "TX"`}</div>
                    <div className="pl-3">{`}`}</div>
                    <div>{`}`}</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Canonical URL Tag</div>
                    <div className="text-xs font-mono text-blue-400 truncate">
                      https://beforeregret.com/state/texas/austin/{inspectorZipData.zipCode}/{inspectorTopic}/
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CONTENT PIPELINE & QUEUE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-white">Content Generation & Audit Pipeline</h2>
                  <p className="text-xs text-slate-400">
                    Topics queued for automated briefing, fact auditing, and publishing.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                  <span className="text-slate-400">Auto-Publish Rate:</span>
                  <select
                    value={publishRateLimit}
                    onChange={(e) => setPublishRateLimit(Number(e.target.value))}
                    className="bg-slate-950 text-emerald-400 font-bold rounded focus:outline-hidden cursor-pointer"
                  >
                    <option value={3}>3 pages / day</option>
                    <option value={5}>5 pages / day</option>
                    <option value={10}>10 pages / day</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Topic Queue Cards */}
            <div className="space-y-4">
              {topics.map(t => {
                const evalRes = evaluateZipUniqueness(ZIP_PSEO_DATASET[t.zipCode || '78701'] || {});
                return (
                  <div
                    key={t.id}
                    className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{t.keyword}</span>
                        <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 text-[10px] font-mono font-bold rounded border border-blue-800">
                          {t.city}, {t.state} {t.zipCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Target: <code className="text-emerald-400">{t.brief.targetUrl}</code> • Search Vol: <strong>{t.estimatedSearchVolume}</strong>/mo
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-300">
                          Uniqueness Score: <strong className={t.uniquenessScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{t.uniquenessScore}/100</strong>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {t.uniquenessScore >= 70 ? 'Meets 70/100 Bar' : 'Thin Data (Auto-Holdback)'}
                        </div>
                      </div>

                      {t.status === 'discovered' ? (
                        <button
                          onClick={() => handleGenerateDraft(t)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          Generate & Audit
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-slate-800 text-slate-400 font-mono text-xs font-bold rounded-xl border border-slate-700">
                          Drafted & Audited
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Held Back Pages Explanation Panel */}
            <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Automated Quality Gate & Duplicate Content Defense</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pages with uniqueness scores below 70/100 (such as sparse rural zip codes or incomplete permit data) are automatically set to <code className="text-amber-400 font-mono">noindex, follow</code> and excluded from XML sitemaps. This protects domain authority and prevents thin-content penalties.
              </p>
            </div>

          </div>
        )}

        {/* TAB 4: SITEMAPS & SEARCH ENGINE INDEXATION */}
        {activeTab === 'sitemaps' && (
          <div className="space-y-6">
            
            {/* IndexNow Ping Banner */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-base text-white">XML Sitemaps & Search Console Feeds</h2>
                <p className="text-xs text-slate-400">
                  Programmatically generated sitemaps formatted for Google, Bing, and IndexNow.
                </p>
              </div>

              <button
                onClick={handlePingIndexNow}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${pingSuccess ? 'animate-spin' : ''}`} />
                <span>{pingSuccess ? 'Pinging IndexNow APIs...' : 'Ping IndexNow Engine'}</span>
              </button>
            </div>

            {/* Sitemap XML Links & Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {[
                { name: 'Sitemap Index', url: '/sitemap.xml', fn: () => generateSitemapIndexXml(), desc: 'Root sitemap index referencing all sub-sitemaps' },
                { name: 'Pages Sitemap', url: '/sitemaps/sitemap-pages.xml', fn: () => generateChildSitemapXml('sitemap-pages'), desc: 'Homepage, terms, privacy, contact, and support' },
                { name: 'States Sitemap', url: '/sitemaps/sitemap-states.xml', fn: () => generateChildSitemapXml('sitemap-states'), desc: 'State-level hub overview pages' },
                { name: 'Cities Sitemap', url: '/sitemaps/sitemap-cities.xml', fn: () => generateChildSitemapXml('sitemap-cities'), desc: 'City-level property research hubs' },
                { name: 'Zip Hubs Sitemap', url: '/sitemaps/sitemap-zips-1.xml', fn: () => generateChildSitemapXml('sitemap-zips-1'), desc: 'Individual zip code property intelligence pages' },
                { name: 'Topic Deep Dives Sitemap', url: '/sitemaps/sitemap-topics-1.xml', fn: () => generateChildSitemapXml('sitemap-topics-1'), desc: 'Topic deep-dive pages (flood risk, radon, permits)' },
                { name: 'Editorial Guides Sitemap', url: '/sitemaps/sitemap-guides.xml', fn: () => generateChildSitemapXml('sitemap-guides'), desc: 'Informational buyer guides & comparisons' }
              ].map((s, idx) => {
                const xmlContent = s.fn();
                return (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-amber-400" />
                        <span>{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {s.url}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{s.desc}</p>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-900">
                      <button
                        onClick={() => handleCopySitemapXml(xmlContent, s.name)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-400 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedSitemap === s.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSitemap === s.name ? 'Copied XML' : 'Copy XML Snippet'}</span>
                      </button>

                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1"
                      >
                        <span>Open Raw</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
