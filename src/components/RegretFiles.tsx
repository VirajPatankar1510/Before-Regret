import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Users, Compass, CheckCircle2, MessageSquare, ArrowRight, HelpCircle, AlertTriangle, Sparkles, User, ThumbsUp, ChevronRight, Search, Play, Award, Eye, Calendar } from 'lucide-react';

export interface Article {
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

export const ARTICLES: Article[] = [
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
      role: '',
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
      society: 'Supreme Towers Compound, Powai',
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
      role: '',
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
      society: 'Kolshet Road Community, Thane',
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
      role: '',
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
      society: 'Shantiniketan Complex, Whitefield',
      role: 'Civil Engineer & 10-Year Resident',
      rating: '4.8',
      charges: '₹99'
    }
  },
  {
    id: 'hsr-no-oc-trap',
    category: 'redflags',
    categoryLabel: 'Red Flags',
    title: 'Living Without an Occupancy Certificate (OC): The Cauvery Water & Penalty Tax Nightmare in HSR Layout',
    excerpt: 'We bought our semi-luxury apartment in HSR Layout Sector 3 after the builder offered a "discounted spot booking" and assured us the Occupancy Certificate (OC) was just a procedural formality. Three years later, we are paying double property tax, commercial electricity tariffs, and buying 100% of our domestic water from private tankers.',
    readTime: '7 min read',
    date: 'July 14, 2026',
    views: '11.2k reads',
    author: {
      name: 'Pradeep & Kavitha Nair',
      role: '',
      avatarInitials: 'PK'
    },
    content: [
      "Buying a home in Bengaluru is a milestone most tech professionals dream of. When Kavitha and I came across a newly constructed standalone builder-floor apartment with premium Italian marble flooring and custom woodwork in HSR Layout Sector 3, we thought we found a gem. The builder was offering a 10% discount if we registered the property within 30 days. When we asked about the Occupancy Certificate (OC), the sales manager waved it off: 'Sir, the building has a valid Commencement Certificate (CC), and OC is just a procedural stamp that takes 2-3 months. Over 20 families have already moved in.'",
      "Trusting his word, we completed the registration and took possession. That was our biggest mistake. We soon realized the builder had deviated from the BBMP (Bruhat Bengaluru Mahanagara Palike) approved building plan by constructing an extra penthouse floor and ignoring the mandatory setback rules (the open space distance between the building wall and the adjacent property line). Because of these structural deviations, the municipal authorities refused to issue the Occupancy Certificate.",
      "The lack of an Occupancy Certificate has completely ruined our living experience and monthly budget. In Bengaluru, municipal water connections (like Cauvery water) are not sanctioned to buildings without an OC. This forces our society of 16 flats to buy up to 4 private water tankers every single day, costing us an extra ₹4,500 per month per flat just for basic water supply.",
      "It gets worse. Since we do not have an OC, our BESCOM electricity connection remains classified under temporary or commercial tariff rates instead of domestic ones, leading to monthly power bills that are 2.5 times higher than normal. Furthermore, the BBMP charges us a flat double property tax as an annual penalty for residing in an unauthorized building. When we tried to get a top-up home loan for renovation last year, every major bank rejected our application instantly, citing the missing OC. Even worse, the resale value of our flat has plummeted by 30% because no smart buyer will touch a non-OC property."
    ],
    lesson: "Never, under any circumstances, take possession or register a flat without a physical copy of the Occupancy Certificate (OC) issued by the local municipal body (BBMP/MMRDA). Do not fall for builder excuses about 'procurement delays' or 'temporary water connections.' An OC is the only legal proof that the building is safe, fully authorized, and fit for human habitation.",
    theOneQuestion: "Has the municipal body issued a final Occupancy Certificate for this specific tower/unit, and are there any active building deviation penalties being charged?",
    pollQuestion: "Would you consider purchasing an apartment if it has a valid CC (Commencement Certificate) but no OC?",
    pollOptions: [
      "Absolutely not, a missing OC is a legal and financial time-bomb",
      "Only if the developer offers a massive 40%+ discount on market value",
      "Yes, if other families are already residing there and things seem fine"
    ],
    pollResults: [89, 8, 3],
    targetSociety: 'Standalone Premium Floor, HSR Layout',
    targetPincode: '560102',
    expertAvailable: {
      name: 'Sridhar Murthy',
      society: 'HSR Sector 3 Neighbors, Bengaluru',
      role: 'BBMP Property Consultant & 12-Year Resident',
      rating: '4.9',
      charges: '₹199'
    }
  },
  {
    id: 'gurugram-top-floor-seepage',
    category: 'regret',
    categoryLabel: 'Top-Floor Regrets',
    title: 'The Top-Floor Apartment Trap: Blistering Summer Heatwaves & Monsoon Water Seepage in Gurugram',
    excerpt: 'We paid a heavy premium for a penthouse-style top-floor 3BHK in Gurugram, seduced by the promise of private terrace access, zero overhead footstep noise, and fresh air. Instead, we got ₹15,000 monthly AC bills and yellow water dampness stains creeping across our master bedroom ceiling during every monsoon.',
    readTime: '9 min read',
    date: 'July 14, 2026',
    views: '9.5k reads',
    author: {
      name: 'Vikram & Ritika Sen',
      role: '',
      avatarInitials: 'VR'
    },
    content: [
      "When Ritika and I were looking to buy a flat in Gurugram, we wanted privacy. Having lived below a noisy family with two toddlers in our previous rental, we swore we would only buy the topmost floor of a high-rise. We found a beautiful top-floor 3BHK overlooking the skyline. The sales team pitched it as a luxury option with private terrace privileges. Sucked in by the peaceful views and the absence of overhead neighbor noise, we paid a ₹15 Lakhs premium over the middle-floor units.",
      "The reality of top-floor living in North India hit us during our first summer. Gurugram temperatures easily cross 46°C in May and June. Because the concrete terrace slab is directly exposed to the blazing sun all day long, it acts as a massive thermal radiator. Even at midnight, our ceiling was hot to the touch. Our air conditioners had to run 24/7 on maximum power just to make the rooms livable, resulting in a staggering electricity bill of ₹16,500 for June alone.",
      "But summer was just the preamble. The real disaster arrived with the monsoon. Gurugram is infamous for intense, heavy downpours that cause instant waterlogging. Within two weeks of rains, we noticed damp, dark circular stains on our master bedroom ceiling. The joint lines of the terrace tiles had developed microscopic cracks, letting rainwater seep directly into our roof slab. Within a month, the premium plaster of paris ceiling started crumbling, ruining our custom modular wardrobes and leaving a permanent, musty smell of mold in the house.",
      "When we approached the residential management committee to waterproof the terrace, they refused, claiming the terrace is common property and its repairs must be funded by the society's common maintenance reserve. However, the committee delayed the approval for nine months due to 'internal budget constraints' and political infighting. We were trapped: we couldn't waterproof it ourselves because the building rules forbid modifying common areas, yet the committee wouldn't fix it. Our luxury top-floor apartment turned into a damp, humid sauna that was practically unlivable for a quarter of the year."
    ],
    lesson: "If you buy a top-floor flat, inspect the quality of the terrace waterproofing (ask for the developer's warranty certificate) and ensure there is an active heat-reflective paint or polyurethane insulation layer on the slab. Most importantly, check the society's maintenance guidelines on who is financially and legally responsible for immediate terrace leak repairs.",
    theOneQuestion: "What is the warranty period of the terrace waterproofing, and do the building's bylaws explicitly permit the top-floor owner to execute waterproofing repairs if the committee delays?",
    pollQuestion: "Do you think top-floor apartments in India are worth the premium despite heat and leakage risks?",
    pollOptions: [
      "No, the middle floors are far safer and more energy-efficient",
      "Yes, the privacy and lack of overhead noise are worth the extra hassle",
      "Only if the terrace has a double-layered waterproofing warranty in writing"
    ],
    pollResults: [68, 12, 20],
    targetSociety: 'DLF Phase 3 Enclave, Gurugram',
    targetPincode: '122002',
    expertAvailable: {
      name: 'Harpreet Singh',
      society: 'DLF Phase 3 Community, Gurugram',
      role: 'Structural Auditor & Waterproofing Expert',
      rating: '4.8',
      charges: '₹249'
    }
  },
  {
    id: 'pune-rwa-bachelor-ban',
    category: 'confessions',
    categoryLabel: 'Society Insights',
    title: 'Investment Flat Turned Vacant Liability: How a Kharadi Society’s Anti-Bachelor Rules Blocked My Rental Income',
    excerpt: 'I bought a 2BHK flat in Kharadi, Pune, as a pure rental investment, planning to host high-paying IT professionals working nearby. But as soon as the builder handed over control to the resident management committee, they passed arbitrary bylaws banning single tenants, imposing ₹25,000 move-in charges, and subjecting young engineers to moral policing.',
    readTime: '8 min read',
    date: 'July 14, 2026',
    views: '15.1k reads',
    author: {
      name: 'Ganesh Deshmukh',
      role: '',
      avatarInitials: 'GD'
    },
    content: [
      "In 2021, I invested ₹85 Lakhs of my retirement savings in a premium 2BHK apartment in Kharadi, Pune, which is a major IT corridor. My calculation was simple: a continuous stream of young, high-earning software developers from the nearby IT parks would easily rent the flat for ₹30,000 per month, helping me offset my home loan EMIs. For the first two years, things went smoothly. I rented it to three decent, quiet software engineers who paid rent on the first of every month.",
      "The nightmare began when the developer handed over the society administration to an elected resident committee. A group of ultra-conservative, retired homeowners took control of the management committee. Within their first month, they introduced an arbitrary, moral-policing agenda. They passed a new bylaw stating that 'bachelors and single working professionals are strictly banned from renting apartments' in the society, citing vague concerns about 'late-night entries' and 'security threats.'",
      "When my tenant lease expired, I was shocked to learn about this new rule. The security gate refused to let any prospective single tenants inside for viewing. When I protested, the committee pointed to a clause in the society bylaws that allowed them to pass rules 'for the peace and safety of residents.' They also introduced a non-refundable 'tenant move-in fee' of ₹25,000 and slapped a 10% premium on my monthly maintenance bill as a 'Non-Occupancy fee' just because I lived elsewhere.",
      "Because of these hostile policies, my flat remained vacant for seven months. Most families who looked at the society preferred newer, more relaxed projects, and the bachelors who were ready to pay premium rent were locked out. I was forced to pay the monthly EMI of ₹42,000 entirely out of my pension pocket. When I finally found a family, they demanded a deep rent cut because they knew I was desperate. If you are buying a property for rental yield, never assume the rules will remain tenant-friendly. Committee politics can destroy your investment overnight."
    ],
    lesson: "Before buying a flat for rental income, read the draft society bylaws (the 'Deed of Declaration') and talk to existing landlords. Be extremely wary of societies dominated by retired self-appointed moral guardians who frequently target single tenants, as this can severely restrict your tenant pool and kill your rental yield.",
    theOneQuestion: "Does the society's registered bylaws contain any clauses restricting tenant profiling, single professionals, or imposing discriminatory non-occupancy fees?",
    pollQuestion: "Do you think resident committees should have the legal right to ban bachelors or single professionals?",
    pollOptions: [
      "Absolutely not, it is illegal, unconstitutional, and discriminatory",
      "Yes, societies have the right to set rules to preserve their community culture",
      "Only if the ban is approved by 100% of the flat owners in writing"
    ],
    pollResults: [91, 5, 4],
    targetSociety: 'Eon Waterfront Phase 2, Kharadi',
    targetPincode: '411014',
    expertAvailable: {
      name: 'Sandip Thorat',
      society: 'Kharadi Property Owners Group, Pune',
      role: 'Real Estate Lawyer & Active Owner',
      rating: '5.0',
      charges: '₹299'
    }
  }
];

export interface RegretFilesProps {
  onBackToHome: () => void;
  selectedArticleId?: string | null;
  onSelectArticle?: (id: string | null) => void;
}

export const RegretFiles: React.FC<RegretFilesProps> = ({ 
  onBackToHome,
  selectedArticleId = null,
  onSelectArticle
}) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  React.useEffect(() => {
    if (selectedArticleId) {
      const art = ARTICLES.find(a => a.id === selectedArticleId);
      if (art) {
        setSelectedArticle(art);
      } else {
        setSelectedArticle(null);
      }
    } else {
      setSelectedArticle(null);
    }
  }, [selectedArticleId]);

  const handleSelectArticle = (art: Article | null) => {
    setSelectedArticle(art);
    if (onSelectArticle) {
      onSelectArticle(art ? art.id : null);
    }
  };
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
            directly from local residents. Read before you buy.
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
            { id: 'iceberg', label: 'Iceberg Realities' },
            { id: 'redflags', label: 'Red Flags' },
            { id: 'regret', label: 'Top-Floor Regrets' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); handleSelectArticle(null); }}
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
                    onClick={() => { handleSelectArticle(art); window.scrollTo(0, 0); }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-3xs hover:border-blue-200 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          art.category === 'mistake' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          art.category === 'confessions' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          art.category === 'redflags' ? 'bg-red-50 text-red-700 border border-red-100' :
                          art.category === 'regret' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
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
                onClick={() => handleSelectArticle(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer mb-2"
              >
                ← Back to all stories
              </button>

              <header className="border-b border-slate-100 pb-6">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider mb-4 ${
                  selectedArticle.category === 'mistake' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  selectedArticle.category === 'confessions' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  selectedArticle.category === 'redflags' ? 'bg-red-50 text-red-700 border border-red-100' :
                  selectedArticle.category === 'regret' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
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
                  onClick={() => { handleSelectArticle(null); window.scrollTo(0, 0); }}
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
                Don't rely on brochures or sales pitches. Talk directly to resident experts of any society in India to check water quality, sound insulation, and maintenance realities before you rent or buy.
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
              <span>✓ Active Gated Society Residents</span>
              <span>•</span>
              <span>✓ Anonymous & Direct</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
