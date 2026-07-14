import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Users, Compass, CheckCircle2, MessageSquare, ArrowRight, HelpCircle, AlertTriangle, Sparkles, User, ThumbsUp, ChevronRight, Search, Play, Award, Eye, Calendar } from 'lucide-react';

interface Article {
  id: string;
  category: 'mistake' | 'confessions' | 'iceberg' | 'redflags' | 'regret';
  categoryLabel: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  views: string;
  author: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  content: string[];
  lesson: string;
  theOneQuestion: string;
  pollQuestion: string;
  pollOptions: string[];
  pollResults: number[]; // percentages
  targetSociety: string;
  targetPincode: string;
  expertAvailable: {
    name: string;
    society: string;
    role: string;
    rating: string;
    charges: string;
  };
}

const ARTICLES: Article[] = [
  {
    id: 'powai-mistake',
    category: 'mistake',
    categoryLabel: 'The ₹1 Crore Mistake',
    title: 'The Price of Balcony Sunsets: How We Lost Our View on a Corner Flat in Powai',
    excerpt: 'We bought a gorgeous corner 3BHK with double balconies overlooking what we thought was a permanent green belt. Four months later, construction began on a new private residential wing just 35 feet away.',
    readTime: '6 min read',
    date: 'July 12, 2026',
    views: '4.8k reads',
    author: {
      name: 'Anirudh & Meera K.',
      role: 'Former Tech Lead & Product Designer',
      avatarInitials: 'AM'
    },
    content: [
      "Meera and I had been renting in HSR Layout for five years when we finally decided to purchase our forever home in Powai, Mumbai. We fell in love with a spacious 1,800 sq ft corner apartment in a premium high-rise. The clincher was the massive double balcony that looked directly over an empty, green 2-acre plot. It felt like an oasis in Mumbai.",
      "The sales office assured us the land was set aside for a low-rise private amenity area or lawn and would remain open space. We paid a premium of ₹25 Lakhs specifically for this 'unblocked view' and 'corner peace.' The total cost was ₹2.85 Crores.",
      "Four months after moving in, Meera was working from home when a thunderous vibration shook our living room. We ran to the balcony. Two massive construction rigs and excavators had breached the boundary fence. The developer had decided to revise their phase plans to accommodate an additional 40-storey luxury tower instead of the low-rise amenity space.",
      "What followed was pure psychological stress. Construction noise operates at 90+ decibels. The drilling went on from 8:00 AM to late evening. Dust covered our balconies, meaning we couldn't open a single door for 18 months. Our 2-year-old toddler struggled with the constant construction dust.",
      "The unblocked view we paid ₹25 Lakhs for was replaced by a towering concrete wall and direct sightlines of construction workers just 35 feet away. If we had spoken to even one resident of the neighboring existing phase, they would have told us the developer had already updated their master blueprint plan a year prior to reflect this expansion."
    ],
    lesson: "Never, under any circumstances, take verbal assurances on adjacent vacant land. Always ask to see the officially signed layout blueprint of the entire project phases and inspect if there are open-ended clauses allowing layout revisions.",
    theOneQuestion: "Does the master layout plan have an option for future construction or phase extensions on this adjacent land parcel?",
    pollQuestion: "Would you still buy a flat with an amazing view if there is an empty plot adjacent to it?",
    pollOptions: [
      "No way, empty plots are active construction sites waiting to happen",
      "Only if the master blueprint guarantees it will remain open space in writing",
      "Yes, if the apartment price is discounted heavily enough"
    ],
    pollResults: [82, 12, 6],
    targetSociety: 'Supreme Eden, Powai',
    targetPincode: '400076',
    expertAvailable: {
      name: 'Rakesh Mehta',
      society: 'Supreme Towers (Adjacent to Eden), Powai',
      role: 'Local Resident & Property Inspector',
      rating: '4.9',
      charges: '₹199'
    }
  },
  {
    id: 'gated-confessions',
    category: 'confessions',
    categoryLabel: 'Society Insights',
    title: 'Water Allocation Realities: The Hidden Cost of Water Softeners on Kolshet Road, Thane',
    excerpt: 'I served as the Management Committee member for three years in a 400-flat society in Thane. Here is how we manage high-mineral water supply, and why your maintenance bills might surprise you.',
    readTime: '8 min read',
    date: 'July 10, 2026',
    views: '12.4k reads',
    author: {
      name: 'Anonymous Resident',
      role: 'Ex-Committee Member (Thane Gated Society)',
      avatarInitials: 'AR'
    },
    content: [
      "Most homebuyers believe that a brand-new society with a grand clubhouse, high-speed elevators, and a gorgeous facade is immune to basic utility issues. The reality is that managing water hardness and distribution requires immense coordination.",
      "In our Thane society, the main water line had high mineral content (TDS levels above 1200 ppm). This raw water ruined our hot-water geysers, scaling the pipes and leaving chalky deposits on glass shower screens and luxury fittings within just six months.",
      "To counter this, our resident committee had to install a large-scale commercial water softener plant. Operating this system requires purchasing tons of industrial salt weekly to regenerate the resin filters. This additional expense, combined with routine maintenance of the pumps, added an unexpected ₹3,500 to every resident's monthly maintenance bill.",
      "Moreover, during peak dry months, the supply needs to be augmented with private water tankers to keep up with the society's high-volume usage (including swimming pools and landscaping). Coordinating these deliveries and scheduling water-cutoff timings became a full-time task for our volunteer committee.",
      "If you are buying a flat, always check if there is an operational RO water softener in the complex, and calculate the true monthly maintenance cost including water plant operations. Otherwise, you will spend thousands on individual appliance repairs."
    ],
    lesson: "High-mineral water is common in new development areas. Always demand to see the society's previous year's audited balance sheet (under 'Water Utility & Plant Operations') to know the real cost before buying a flat.",
    theOneQuestion: "What is the average TDS level of the water supply in this wing, and what is the society's monthly expenditure on water treatment?",
    pollQuestion: "How much would water quality affect your decision to buy or rent a property?",
    pollOptions: [
      "Dealbreaker - I would cancel the transaction",
      "I would buy, but install my own private softener system",
      "I don't mind as long as there is an RO purifier in the kitchen"
    ],
    pollResults: [74, 21, 5],
    targetSociety: 'Lodha Amara, Kolshet Road',
    targetPincode: '400607',
    expertAvailable: {
      name: 'Vikram Phadke',
      society: 'Kolshet Road Federations, Thane',
      role: 'Water Quality Inspector & 8-Year Resident',
      rating: '5.0',
      charges: '₹299'
    }
  },
  {
    id: 'whitefield-iceberg',
    category: 'iceberg',
    categoryLabel: 'Neighborhood Icebergs',
    title: 'The Bengaluru Gated Society Iceberg: The Reality of Sound Insulation in Drywalls',
    excerpt: 'The hidden layers of high-density living. While the brochures highlight premium finishes, the physical partitions between adjacent apartments can lead to unexpected acoustic issues.',
    readTime: '5 min read',
    date: 'July 05, 2026',
    views: '8.1k reads',
    author: {
      name: 'Pranav S.',
      role: 'Acoustic Analyst & Whitefield Resident',
      avatarInitials: 'PS'
    },
    content: [
      "Let's map out the modern Gated Society Iceberg. At the very top (The Exposed Tip), you have developer-funded brochures: pictures of sprawling tennis courts, reflexology paths, and 'soundproof serene study lounges.' This is what you see when visiting the model flat.",
      "Just below the surface (The Mid-Tier), you find things that are open secrets among residents: the walls separating adjacent flats are often built using lightweight aerated concrete blocks or drywall systems instead of solid clay bricks. While structurally safe, they offer poor sound dampening.",
      "At the very bottom of the iceberg (The Deep Reality), there is a frustrating acoustic lifestyle. If your neighbor hosts a movie night or has a toddler, you will hear the low-frequency vibrations through your living room wall. Some residents find themselves forced to install expensive custom acoustic panelling or acoustic foam to get a peaceful night's sleep.",
      "Furthermore, plumbing shafts running behind master bedrooms are sometimes not insulated, meaning you will hear the rushing water from upper floors throughout the night. These are things you only realize after moving in."
    ],
    lesson: "When touring a flat, bring a friend and ask them to stand in the adjacent corridor or room and speak at a normal volume. Tap on the demising walls to check if they sound hollow, indicating drywall or thin block construction.",
    theOneQuestion: "Are the demising walls between adjacent apartments made of solid clay bricks, solid concrete, or lightweight drywall panels?",
    pollQuestion: "Have you ever experienced noise leakage or poor sound insulation from neighboring apartments?",
    pollOptions: [
      "Yes, I can easily hear my neighbors talking or watching TV",
      "Occasionally, but it is manageable and doesn't bother me",
      "No, my apartment has excellent sound insulation"
    ],
    pollResults: [61, 31, 8],
    targetSociety: 'Prestige Shantiniketan, Whitefield',
    targetPincode: '560048',
    expertAvailable: {
      name: 'Suhas K. Swamy',
      society: 'Shantiniketan Block B, Whitefield',
      role: 'Civil Engineer & 10-Year Resident',
      rating: '4.8',
      charges: '₹99'
    }
  }
];

interface RegretFilesProps {
  onBackToHome: () => void;
}

export const RegretFiles: React.FC<RegretFilesProps> = ({ onBackToHome }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [votedPolls, setVotedPolls] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const filteredArticles = ARTICLES.filter(art => {
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.targetSociety.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVote = (articleId: string, optionIndex: number) => {
    if (votedPolls[articleId] !== undefined) return;
    setVotedPolls(prev => ({ ...prev, [articleId]: optionIndex }));
  };

  const handleBookExpert = (expertName: string) => {
    setBookingSuccess(expertName);
    setTimeout(() => {
      setBookingSuccess(null);
    }, 5000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-md border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Regret Files Editorial</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-tight">
            I Wish Someone Had Told Me...
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Real estate portals hide negative factors to keep brokers happy. 
            We publish unvarnished, anonymous confessions and cautionary tales 
            directly from verified residents. Read before you buy.
          </p>
        </div>
      </div>



      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b border-slate-100">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Stories' },
            { id: 'mistake', label: '₹1 Cr Mistakes' },
            { id: 'confessions', label: 'Society Insights' },
            { id: 'iceberg', label: 'Iceberg Realities' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedArticle(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search stories & societies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Article List or Single Article view */}
        <div className="lg:col-span-2 space-y-6">
          
          {!selectedArticle ? (
            // LIST VIEW
            <div className="space-y-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <div className="text-slate-400 mb-2">No editorial stories match your search filters.</div>
                  <button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }} className="text-xs font-bold text-blue-600 hover:underline">
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredArticles.map((art) => (
                  <article 
                    key={art.id}
                    onClick={() => { setSelectedArticle(art); window.scrollTo(0, 0); }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-3xs hover:border-blue-200 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          art.category === 'mistake' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          art.category === 'confessions' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {art.categoryLabel}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{art.views}</span>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-display font-black text-slate-900 tracking-tight mb-3 group-hover:text-blue-600 transition-colors">
                        {art.title}
                      </h3>
                      
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-50 mt-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200/50">
                          {art.author.avatarInitials}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">{art.author.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{art.author.role}</div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 group-hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all">
                        <span>Read Full Story</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : (
            // ARTICLE DETAIL VIEW
            <article className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-10 shadow-3xs space-y-6">
              
              <button
                onClick={() => setSelectedArticle(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer mb-2"
              >
                ← Back to all stories
              </button>

              <header className="border-b border-slate-100 pb-6">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider mb-4 ${
                  selectedArticle.category === 'mistake' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  selectedArticle.category === 'confessions' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}>
                  {selectedArticle.categoryLabel}
                </span>

                <h2 className="text-xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-tight">
                  {selectedArticle.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400 font-medium pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center font-mono">
                      {selectedArticle.author.avatarInitials}
                    </div>
                    <span className="font-bold text-slate-700">{selectedArticle.author.name}</span>
                  </div>
                  <span>•</span>
                  <span>{selectedArticle.date}</span>
                  <span>•</span>
                  <span>{selectedArticle.readTime}</span>
                </div>
              </header>

              {/* Story Narrative Paragraphs */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {selectedArticle.content.map((p, index) => (
                  <p key={index}>{p}</p>
                ))}
              </div>

              {/* Core takeaways box */}
              <div className="p-5 bg-amber-50/50 border border-amber-100/50 rounded-2xl space-y-2.5 mt-8">
                <h4 className="font-black text-amber-800 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>The Real Estate Takeaway & Lesson</span>
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                  {selectedArticle.lesson}
                </p>
                <div className="pt-2 border-t border-amber-100/40 text-xs">
                  <span className="font-bold text-amber-800">The One Question to ask:</span>{' '}
                  <span className="text-slate-700 font-mono italic">"{selectedArticle.theOneQuestion}"</span>
                </div>
              </div>

              {/* Dynamic Interactive Poll Section */}
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Interactive Reader Opinion Poll</span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{selectedArticle.pollQuestion}</h4>
                
                <div className="space-y-2">
                  {selectedArticle.pollOptions.map((opt, optIdx) => {
                    const isVoted = votedPolls[selectedArticle.id] !== undefined;
                    const userVotedForThis = votedPolls[selectedArticle.id] === optIdx;
                    const resultPercent = selectedArticle.pollResults[optIdx];
                    
                    return (
                      <button
                        key={optIdx}
                        disabled={isVoted}
                        onClick={() => handleVote(selectedArticle.id, optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-semibold relative overflow-hidden ${
                          isVoted 
                            ? userVotedForThis
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-white text-slate-500'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 cursor-pointer'
                        }`}
                      >
                        {isVoted && (
                          <div 
                            className={`absolute top-0 left-0 bottom-0 pointer-events-none transition-all duration-500 ${
                              userVotedForThis ? 'bg-blue-500/10' : 'bg-slate-100'
                            }`}
                            style={{ width: `${resultPercent}%` }}
                          />
                        )}
                        <div className="relative flex justify-between items-center">
                          <span className="pr-4">{opt}</span>
                          {isVoted && <span className="font-mono font-bold shrink-0">{resultPercent}%</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {votedPolls[selectedArticle.id] !== undefined && (
                  <p className="text-[10px] text-slate-400 font-mono text-center">
                    ✔ Poll response recorded. Thank you for voting!
                  </p>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => { setSelectedArticle(null); window.scrollTo(0, 0); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Back to stories
                </button>
                <div className="text-xs text-slate-400 font-mono font-medium">
                  Ref: {selectedArticle.id.toUpperCase()}
                </div>
              </div>

            </article>
          )}

        </div>

        {/* Right pane: SIDEBAR HOMEPAGE BANNER AD */}
        <div className="lg:col-span-1">
          
          <div className="p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl border border-indigo-500/20 shadow-xl space-y-6 sticky top-24 overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-3 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Resident Network</span>
              </span>
              <h3 className="font-display font-black text-xl sm:text-2xl tracking-tight text-slate-100 leading-tight">
                Uncover the Real Truth of Gated Societies.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Don't rely on brochures or sales pitches. Talk directly to verified residents of any society in India to check water quality, sound insulation, and maintenance realities before you rent or buy.
              </p>
            </div>

            <button
              onClick={onBackToHome}
              className="w-full relative z-10 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-400/10 cursor-pointer font-bold"
            >
              <span>Explore Gated Societies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center relative z-10 flex items-center justify-center gap-4">
              <span>✓ 100% Verified Residents</span>
              <span>•</span>
              <span>✓ Anonymous & Direct</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
