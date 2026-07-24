import { Society, ResidentKnowledgeProfile, TopicKnowledge, ContributorQuestion } from '../types';

export const CONTRIBUTOR_QUESTIONS: ContributorQuestion[] = [
  // Parking
  {
    id: 'q_parking_visitor',
    topicId: 'parking',
    topicTitle: 'Parking & Vehicle Allocation',
    questionText: 'How easy is visitor parking on evenings and weekends?',
    options: ['Always Available', 'Usually Available', 'Limited After Evening', 'Rarely Available']
  },
  {
    id: 'q_parking_dedicated',
    topicId: 'parking',
    topicTitle: 'Parking & Vehicle Allocation',
    questionText: 'Are dedicated resident parking slots well managed without disputes?',
    options: ['Strictly Managed (No Disputes)', 'Occasional Encroachment', 'Frequent Disputes', 'Unassigned / Open Parking']
  },
  {
    id: 'q_parking_two_wheeler',
    topicId: 'parking',
    topicTitle: 'Parking & Vehicle Allocation',
    questionText: 'Is there sufficient space for second cars or EV charging setup?',
    options: ['EV Points Installed & Space Free', 'EV Points Available On Request', 'Space Limited / Extra Slot Fee', 'No EV Infrastructure']
  },

  // Water Supply
  {
    id: 'q_water_tanker',
    topicId: 'water',
    topicTitle: 'Water Supply & Quality',
    questionText: 'How dependent is the society on water tankers during peak summer (April - June)?',
    options: ['100% Municipal Water (No Tankers)', 'Occasional Tanker Supplement', 'Heavy Tanker Dependency (Daily)', 'Severe Shortages Recorded']
  },
  {
    id: 'q_water_quality',
    topicId: 'water',
    topicTitle: 'Water Supply & Quality',
    questionText: 'What is the water quality and hardness in kitchen/bath taps?',
    options: ['Soft Municipal Water', 'Mildly Hard (RO Recommended)', 'Very Hard Water (Water Softener Needed)', 'Treated STP Recycled Water for Flush']
  },

  // Internet
  {
    id: 'q_internet_providers',
    topicId: 'internet',
    topicTitle: 'Internet & Remote Work Reliability',
    questionText: 'Which internet providers are allowed and how stable is high-speed fiber for WFH?',
    options: ['Multiple Fiber Lines (Jio, Airtel, Tata Play)', 'Only One Exclusive Provider', 'Frequent Fiber Cuts / Slow Repair', 'Cellular Coverage Weak Inside Flats']
  },

  // Noise
  {
    id: 'q_noise_surroundings',
    topicId: 'noise',
    topicTitle: 'Noise, Traffic & Surroundings',
    questionText: 'What are the main sources of ambient noise during early mornings and late nights?',
    options: ['Very Quiet & Peaceful', 'Nearby Highway / Main Road Traffic', 'Construction Activity Nearby', 'Commercial Deliveries & Generator Noise']
  },

  // Security
  {
    id: 'q_security_gate',
    topicId: 'security',
    topicTitle: 'Security & Visitor Protocol',
    questionText: 'How strictly are visitor apps (MyGate / NoBrokerHood) enforced at entry gates?',
    options: ['100% Strictly Enforced (Approval Needed)', 'Moderate Security Verification', 'Lax Guards / Easy Entry', 'Biometric / RFID Gate Access Available']
  },

  // Electricity
  {
    id: 'q_electricity_power',
    topicId: 'electricity',
    topicTitle: 'Electricity & Power Backup',
    questionText: 'Is full power backup available for air conditioners and power plugs inside flats?',
    options: ['100% Full Flat DG Backup (Includes ACs)', 'Partial Backup (Lights, Fans & Wi-Fi only)', 'Common Areas Only', 'Frequent Unannounced Power Cuts']
  },

  // Maintenance
  {
    id: 'q_maintenance_maids',
    topicId: 'maintenance',
    topicTitle: 'Society Maintenance & Staffing',
    questionText: 'How reasonable are maid, cook, and car cleaner rates in this society?',
    options: ['Standard City Rates & Abundant Staff', 'Fixed Society Rate Union', 'High Demand / Difficult to Hire', 'Strict Verification Required']
  },

  // Amenities
  {
    id: 'q_amenities_gym',
    topicId: 'amenities',
    topicTitle: 'Amenities, Gym & Clubhouse Rules',
    questionText: 'Are the gym, swimming pool, and clubhouse well-maintained and included in maintenance?',
    options: ['Pristine Maintenance (Included in Fee)', 'Good Condition (Separate User Fee)', 'Overcrowded During Peak Hours', 'Under Maintenance Frequently']
  },

  // Committee
  {
    id: 'q_committee_rules',
    topicId: 'committee',
    topicTitle: 'Managing Committee & Governance',
    questionText: 'How tenant-friendly and bachelor/pet-friendly is the society management committee?',
    options: ['Progressive & Welcoming to All', 'Strict Guidelines for Bachelors/Pets', 'Heavy NOC Charges for Renters', 'Frequent Rules Friction']
  },

  // Hidden Costs
  {
    id: 'q_hidden_costs',
    topicId: 'hidden-costs',
    topicTitle: 'Hidden Charges & Move-in Expenses',
    questionText: 'Are there surprise charges when moving in or transferring tenancy?',
    options: ['Transparent Standard Move-in Deposit', 'High Non-refundable Shift-in Fee', 'Club Membership Transfer Fees', 'High Electricity Deposit Surcharges']
  },

  // Things I Wish I Knew
  {
    id: 'q_wish_i_knew',
    topicId: 'wish-i-knew',
    topicTitle: 'Things I Wish I Knew Before Moving',
    questionText: 'What is the most unexpected aspect of daily living here that no broker mentions?',
    options: ['Elevator Rush Hour Bottlenecks', 'Sunlight / Tower Shadow Angles', 'Monsoon Wind / Water Seepage', 'Excellent Vibrant Community Events']
  }
];

export const TOPIC_METADATA = [
  { id: 'parking', title: 'Parking & Vehicle Allocation', category: 'Infrastructure', iconName: 'Car' },
  { id: 'water', title: 'Water Supply & Quality', category: 'Utilities', iconName: 'Droplets' },
  { id: 'internet', title: 'Internet & WFH Setup', category: 'Connectivity', iconName: 'Wifi' },
  { id: 'noise', title: 'Noise & Surroundings', category: 'Environment', iconName: 'VolumeX' },
  { id: 'security', title: 'Security & Gate Protocol', category: 'Safety', iconName: 'ShieldCheck' },
  { id: 'electricity', title: 'Electricity & Power Backup', category: 'Utilities', iconName: 'Zap' },
  { id: 'maintenance', title: 'Society Maintenance & Staff', category: 'Operations', iconName: 'Wrench' },
  { id: 'amenities', title: 'Amenities & Clubhouse Rules', category: 'Lifestyle', iconName: 'Dumbbell' },
  { id: 'committee', title: 'Managing Committee & Rules', category: 'Governance', iconName: 'Users' },
  { id: 'hidden-costs', title: 'Hidden Charges & Move-in Fees', category: 'Financials', iconName: 'Receipt' },
  { id: 'wish-i-knew', title: 'Things I Wish I Knew', category: 'Insider Insights', iconName: 'Sparkles' }
];

export const INITIAL_SOCIETIES: Society[] = [
  {
    id: 'lodha-amara',
    name: 'Lodha Amara',
    city: 'Thane, Mumbai MMR',
    locality: 'Kolshet Road, Thane West',
    builder: 'Lodha Group',
    pincode: '400607',
    residentProfilesCount: 14,
    totalTopicsAvailable: 11,
    lastUpdated: '12 Days Ago',
    featured: true,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    description: 'A 40-acre residential township on Kolshet Road featuring 30+ towers with extensive clubhouse amenities.',
    profiles: [
      {
        id: 'res-lodha-101',
        societyId: 'lodha-amara',
        societyName: 'Lodha Amara',
        city: 'Thane',
        locality: 'Kolshet Road',
        livingSince: '2019',
        yearsLiving: 6,
        helpedBuyersCount: 186,
        rating: 4.9,
        verifiedResident: true,
        residentType: 'Owner',
        topicsAnsweredCount: 11,
        lastUpdated: '12 Days Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'parking',
            title: 'Parking & Vehicle Allocation',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Lodha Amara employs a multi-level basement parking system with automated RFID tags at entry. Visitor parking is strictly allocated in Basement 1 and fills up rapidly after 7:30 PM on Friday and Saturday evenings. Resident slots are assigned permanently without ownership disputes. EV charging infrastructure is operational across major wings upon society application.',
            structuredQA: [
              {
                questionId: 'q_parking_visitor',
                question: 'How easy is visitor parking on evenings and weekends?',
                answer: 'Limited After Evening. Visitor slots in Basement 1 fill up early on weekends; guests are advised to arrive before 7 PM.',
                badge: 'Visitor Protocol'
              },
              {
                questionId: 'q_parking_dedicated',
                question: 'Are dedicated resident parking slots well managed without disputes?',
                answer: 'Strictly Managed (No Disputes). Every flat has designated stencil markings and RFID boom barrier entry.',
                badge: 'Resident Security'
              },
              {
                questionId: 'q_parking_two_wheeler',
                question: 'Is there sufficient space for second cars or EV charging setup?',
                answer: 'EV Points Available On Request. The committee permits private EV charger installations with meter connection.',
                badge: 'EV Infrastructure'
              }
            ]
          },
          {
            id: 'water',
            title: 'Water Supply & Quality',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'TMC (Thane Municipal Corporation) water is supplemented by borewells and treated STP water for flushing. During summer months (April–May), TMC water pressure reduces slightly in upper floors, but internal hydro-pneumatic pumps maintain steady tap flow. Water hardness averages ~180 PPM, making a basic RO purifier recommended for drinking.',
            structuredQA: [
              {
                questionId: 'q_water_tanker',
                question: 'How dependent is the society on water tankers during peak summer?',
                answer: 'Occasional Tanker Supplement. Municipal TMC supply is primary; tankers are used only during maintenance shutdowns.',
                badge: 'TMC Supply'
              },
              {
                questionId: 'q_water_quality',
                question: 'What is the water quality and hardness in kitchen/bath taps?',
                answer: 'Mildly Hard (RO Recommended). TDS is around 180-220 PPM; softeners are installed at main supply tanks.',
                badge: 'Quality Grade'
              }
            ]
          },
          {
            id: 'internet',
            title: 'Internet & WFH Setup',
            category: 'Connectivity',
            iconName: 'Wifi',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'JioFiber, Airtel Xstream, and Tata Play Fiber have dedicated fiber risers in every duct. Speeds up to 1 Gbps are consistently achieved with sub-5ms latency, making remote work and video conferencing smooth without line cuts.',
            structuredQA: [
              {
                questionId: 'q_internet_providers',
                question: 'Which internet providers are allowed and how stable is fiber for WFH?',
                answer: 'Multiple Fiber Lines (Jio, Airtel, Tata Play). Excellent reliability with 99.8% uptime recorded by remote workers.',
                badge: 'WFH Verified'
              }
            ]
          },
          {
            id: 'noise',
            title: 'Noise & Surroundings',
            category: 'Environment',
            iconName: 'VolumeX',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Towers facing the internal central park enjoy silence throughout the day. Towers adjacent to Kolshet main road experience moderate traffic hum during morning rush hours (8:00 AM – 10:30 AM). Construction noise from neighboring developments is minimal as major structural work in Phase 4 is completed.',
            structuredQA: [
              {
                questionId: 'q_noise_surroundings',
                question: 'What are the main sources of ambient noise?',
                answer: 'Very Quiet inside central courtyard towers; road-facing wings have mild traffic hum.',
                badge: 'Acoustic Rating'
              }
            ]
          },
          {
            id: 'security',
            title: 'Security & Gate Protocol',
            category: 'Safety',
            iconName: 'ShieldCheck',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'MyGate integration is active across all 6 main entry gates. Delivery partners (Swiggy, Zomato, Amazon) must verify passcode entry at the security desk before accessing residential towers. CCTV covers all lift lobbies, basements, and podium levels.',
            structuredQA: [
              {
                questionId: 'q_security_gate',
                question: 'How strictly are visitor apps enforced at entry gates?',
                answer: '100% Strictly Enforced (Approval Needed). No delivery person enters without resident passcode verification.',
                badge: 'Gate Protocol'
              }
            ]
          },
          {
            id: 'electricity',
            title: 'Electricity & Power Backup',
            category: 'Utilities',
            iconName: 'Zap',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'MSEDCL supply in Kolshet is highly stable. In case of grid failure, automatic Diesel Generator (DG) power kicks in within 12 seconds. Full backup covers all lights, fans, refrigerators, and 1 AC point per master bedroom.',
            structuredQA: [
              {
                questionId: 'q_electricity_power',
                question: 'Is full power backup available inside flats?',
                answer: '100% Full Flat DG Backup (Includes ACs). Seamless 12-second auto-switchover.',
                badge: 'DG Backup'
              }
            ]
          },
          {
            id: 'maintenance',
            title: 'Society Maintenance & Staff',
            category: 'Operations',
            iconName: 'Wrench',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Monthly maintenance ranges between ₹3.8 to ₹4.2 per sq.ft. Housekeeping staff clean corridors twice daily. Maid and cook rates are standard (e.g. ₹3,500–₹4,500 for cooking for 3 people). All domestic helpers undergo mandatory society security background verification.',
            structuredQA: [
              {
                questionId: 'q_maintenance_maids',
                question: 'How reasonable are maid and cook rates in this society?',
                answer: 'Standard City Rates & Abundant Staff. MyGate pass system ensures verified domestic helpers.',
                badge: 'Domestic Help'
              }
            ]
          },
          {
            id: 'amenities',
            title: 'Amenities, Gym & Clubhouse Rules',
            category: 'Lifestyle',
            iconName: 'Dumbbell',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'The 25,000 sq.ft. grand clubhouse features a heated indoor pool, outdoor Olympic-size pool, squash courts, and multi-gym. Gym equipment is maintained under annual vendor contracts. Peak gym hours (6:30 AM – 8:30 AM) see high attendance.',
            structuredQA: [
              {
                questionId: 'q_amenities_gym',
                question: 'Are gym and pool maintained and included in maintenance fee?',
                answer: 'Pristine Maintenance (Included in Fee). No separate monthly club fees required for residents.',
                badge: 'Clubhouse Access'
              }
            ]
          },
          {
            id: 'committee',
            title: 'Managing Committee & Governance',
            category: 'Governance',
            iconName: 'Users',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'The elected Apex Committee operates professionally with digitized ticketing for complaints. Pet guidelines require dogs to be leashed on podiums and service lifts. Renter NOC process takes 48 hours online.',
            structuredQA: [
              {
                questionId: 'q_committee_rules',
                question: 'How tenant-friendly and pet-friendly is the society management?',
                answer: 'Progressive & Welcoming to All. Clear written guidelines without arbitrary restrictions.',
                badge: 'Committee Grade'
              }
            ]
          },
          {
            id: 'hidden-costs',
            title: 'Hidden Charges & Move-in Fees',
            category: 'Financials',
            iconName: 'Receipt',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Move-in and move-out lift protection deposit is ₹5,000 (refundable). The non-refundable society shifting fee is ₹2,500. Water meter deposits are handled directly through TMC billing.',
            structuredQA: [
              {
                questionId: 'q_hidden_costs',
                question: 'Are there surprise charges when moving in?',
                answer: 'Transparent Standard Deposit. ₹2,500 shifting fee and ₹5,000 refundable lift security.',
                badge: 'Fee Transparency'
              }
            ]
          },
          {
            id: 'wish-i-knew',
            title: 'Things I Wish I Knew Before Moving',
            category: 'Insider Insights',
            iconName: 'Sparkles',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: '1. Peak morning elevator wait times between 8:15 AM and 8:45 AM can reach 4-6 minutes in towers above floor 25.\n2. Ordering groceries via Blinkit or Zepto takes 8–12 minutes due to security gate processing.\n3. Sunlight exposure differs significantly between East-facing and West-facing towers due to podium shadows.',
            structuredQA: [
              {
                questionId: 'q_wish_i_knew',
                question: 'What is the most unexpected daily reality no broker mentions?',
                answer: 'Elevator Rush Hour Bottlenecks in high-rise towers between 8:15 AM - 8:45 AM.',
                badge: 'Insider Tip'
              }
            ]
          }
        ]
      },
      {
        id: 'res-lodha-102',
        societyId: 'lodha-amara',
        societyName: 'Lodha Amara',
        city: 'Thane',
        locality: 'Kolshet Road',
        livingSince: '2021',
        yearsLiving: 4,
        helpedBuyersCount: 124,
        rating: 4.8,
        verifiedResident: true,
        residentType: 'Tenant',
        topicsAnsweredCount: 9,
        lastUpdated: '5 Days Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'parking',
            title: 'Parking & Vehicle Allocation',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '5 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'As a tenant, my parking slot was clearly specified in the registered rent agreement. RFID tag issuance took 3 working days at the facility management office upon paying ₹500 tag fee.',
            structuredQA: [
              {
                questionId: 'q_parking_dedicated',
                question: 'How smooth was tag allocation for tenants?',
                answer: 'Strictly Managed. Smooth process with landlord authorization letter.',
                badge: 'Tenant Parking'
              }
            ]
          },
          {
            id: 'maintenance',
            title: 'Society Maintenance & Staff',
            category: 'Operations',
            iconName: 'Wrench',
            readingTime: '2 min read',
            lastUpdated: '5 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Maintenance is included in rent for most apartments, but tenants directly pay for maid verification (₹300 one-time fee) and facility pass generation.',
            structuredQA: [
              {
                questionId: 'q_maintenance_maids',
                question: 'Are there extra tenant fees for maid passes?',
                answer: 'Standard City Rates. One-time ₹300 verification fee per domestic helper.',
                badge: 'Tenant Operations'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'hiranandani-gardens',
    name: 'Hiranandani Gardens',
    city: 'Powai, Mumbai',
    locality: 'Central Avenue, Powai',
    builder: 'Hiranandani Group',
    pincode: '400076',
    residentProfilesCount: 18,
    totalTopicsAvailable: 11,
    lastUpdated: '3 Days Ago',
    featured: true,
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80',
    description: 'Premier neoclassical township overlooking Powai Lake, renowned for pedestrian avenues, top schools, and vibrant high-street dining.',
    profiles: [
      {
        id: 'res-hiranandani-201',
        societyId: 'hiranandani-gardens',
        societyName: 'Hiranandani Gardens',
        city: 'Mumbai',
        locality: 'Powai',
        livingSince: '2017',
        yearsLiving: 8,
        helpedBuyersCount: 240,
        rating: 5.0,
        verifiedResident: true,
        residentType: 'Owner',
        topicsAnsweredCount: 11,
        lastUpdated: '3 Days Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'parking',
            title: 'Parking & Vehicle Allocation',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '3 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Older Hiranandani buildings (built pre-2010) have open stilt parking where slots are allocated on an annual rotational basis by society AGM vote. Newer high-rise towers have multi-level podium basements. Visitor parking along Central Avenue is pay-and-park.',
            structuredQA: [
              {
                questionId: 'q_parking_dedicated',
                question: 'Are parking slots fixed or rotational?',
                answer: 'Rotational in older buildings; fixed stenciled slots in newer towers.',
                badge: 'Parking Structure'
              }
            ]
          },
          {
            id: 'water',
            title: 'Water Supply & Quality',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '3 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'BMC water supply is extremely clean and reliable. Hiranandani township has dedicated overhead reservoirs. TDS levels stay around 80-110 PPM, among the cleanest municipal water in Mumbai.',
            structuredQA: [
              {
                questionId: 'q_water_tanker',
                question: 'How is water reliability?',
                answer: '100% Municipal BMC Water. Zero tanker requirement reported throughout the year.',
                badge: 'BMC Grade'
              }
            ]
          },
          {
            id: 'wish-i-knew',
            title: 'Things I Wish I Knew Before Moving',
            category: 'Insider Insights',
            iconName: 'Sparkles',
            readingTime: '2 min read',
            lastUpdated: '3 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: '1. Traffic bottleneck at JVLR junction during peak hours (8:30 AM – 10:30 AM) can add 20 minutes to your commute.\n2. High-rise wind speeds during monsoon require reinforced balcony safety nets.\n3. Walkability inside Hiranandani is world-class, with grocery stores and cafes within 3 minutes of walking.',
            structuredQA: [
              {
                questionId: 'q_wish_i_knew',
                question: 'What is the top commute tip?',
                answer: 'JVLR Junction bottleneck during morning peak hours.',
                badge: 'Commute Insight'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'godrej-emerald',
    name: 'Godrej Emerald',
    city: 'Thane, Mumbai MMR',
    locality: 'Ghodbunder Road, Thane',
    builder: 'Godrej Properties',
    pincode: '400615',
    residentProfilesCount: 9,
    totalTopicsAvailable: 11,
    lastUpdated: '8 Days Ago',
    featured: true,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
    description: 'Modern high-rise development situated near Yeoor Hills backdrop with scenic green views and resort-style amenities.',
    profiles: [
      {
        id: 'res-godrej-301',
        societyId: 'godrej-emerald',
        societyName: 'Godrej Emerald',
        city: 'Thane',
        locality: 'Ghodbunder Road',
        livingSince: '2020',
        yearsLiving: 5,
        helpedBuyersCount: 92,
        rating: 4.8,
        verifiedResident: true,
        residentType: 'Owner',
        topicsAnsweredCount: 11,
        lastUpdated: '8 Days Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'water',
            title: 'Water Supply & Quality',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '8 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Ghodbunder Road location relies on a mixture of STEM water supply and society borewells. Water hardness is higher (~280 PPM), making water softeners or anti-scaling filters on showerheads beneficial.',
            structuredQA: [
              {
                questionId: 'q_water_quality',
                question: 'What is the water hardness?',
                answer: 'Very Hard Water. TDS 280+ PPM; softeners recommended for bathrooms.',
                badge: 'Hardness Alert'
              }
            ]
          },
          {
            id: 'noise',
            title: 'Noise & Surroundings',
            category: 'Environment',
            iconName: 'VolumeX',
            readingTime: '1 min read',
            lastUpdated: '8 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Yeoor Hills facing apartments enjoy fresh mountain air and quiet surroundings. Ghodbunder front towers hear heavy vehicle diesel engine noise at night when trucks operate.',
            structuredQA: [
              {
                questionId: 'q_noise_surroundings',
                question: 'Is heavy vehicle noise noticeable?',
                answer: 'Main road facing flats experience night truck traffic noise.',
                badge: 'Acoustics'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'rustomjee-urbania',
    name: 'Rustomjee Urbania',
    city: 'Thane, Mumbai MMR',
    locality: 'Majiwada Junction, Thane West',
    builder: 'Rustomjee',
    pincode: '400601',
    residentProfilesCount: 12,
    totalTopicsAvailable: 11,
    lastUpdated: '15 Days Ago',
    featured: true,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    description: 'Self-contained 127-acre mega township at Majiwada featuring Urbania International School and urban plazas.',
    profiles: [
      {
        id: 'res-rustomjee-401',
        societyId: 'rustomjee-urbania',
        societyName: 'Rustomjee Urbania',
        city: 'Thane',
        locality: 'Majiwada',
        livingSince: '2018',
        yearsLiving: 7,
        helpedBuyersCount: 155,
        rating: 4.9,
        verifiedResident: true,
        residentType: 'Owner',
        topicsAnsweredCount: 11,
        lastUpdated: '15 Days Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'parking',
            title: 'Parking & Vehicle Allocation',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '15 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Podium parking is spacious and well ventilated. Visitor parking is managed via NoBrokerHood digital queue with 2 hours free visitor pass.',
            structuredQA: [
              {
                questionId: 'q_parking_visitor',
                question: 'How easy is visitor parking?',
                answer: 'Usually Available with 2 hours free pass via app.',
                badge: 'Visitor App'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'prestige-falcon-city',
    name: 'Prestige Falcon City',
    city: 'Bengaluru',
    locality: 'Kanakapura Road, Anjanadri Layout',
    builder: 'Prestige Group',
    pincode: '560062',
    residentProfilesCount: 16,
    totalTopicsAvailable: 11,
    lastUpdated: '1 Day Ago',
    featured: true,
    image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80',
    description: 'Iconic 41-acre high-rise township connected directly to Forum Falcon City Mall and Metro Station.',
    profiles: [
      {
        id: 'res-prestige-501',
        societyId: 'prestige-falcon-city',
        societyName: 'Prestige Falcon City',
        city: 'Bengaluru',
        locality: 'Kanakapura Road',
        livingSince: '2020',
        yearsLiving: 5,
        helpedBuyersCount: 210,
        rating: 4.9,
        verifiedResident: true,
        residentType: 'Owner',
        topicsAnsweredCount: 11,
        lastUpdated: '1 Day Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'water',
            title: 'Water Supply & Quality',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '1 Day Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'BWSSB Cauvery water line supplies the complex alongside automated internal water treatment plants. Tanker dependency is zero even during dry Bengaluru months due to large underground sump storage capacity.',
            structuredQA: [
              {
                questionId: 'q_water_tanker',
                question: 'Is Cauvery water active?',
                answer: '100% Municipal Cauvery Water active with zero tanker dependency.',
                badge: 'Cauvery Active'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'dlf-phase-5',
    name: 'DLF Phase 5 (The Crest & Park Place)',
    city: 'Gurugram',
    locality: 'Golf Course Road, Sector 54',
    builder: 'DLF Limited',
    pincode: '122009',
    residentProfilesCount: 21,
    totalTopicsAvailable: 11,
    lastUpdated: '4 Days Ago',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-luxury residential enclave on Golf Course Road featuring 24/7 private security patrols and high-end concierge.',
    profiles: [
      {
        id: 'res-dlf-601',
        societyId: 'dlf-phase-5',
        societyName: 'DLF Phase 5',
        city: 'Gurugram',
        locality: 'Golf Course Road',
        livingSince: '2016',
        yearsLiving: 9,
        helpedBuyersCount: 310,
        rating: 5.0,
        verifiedResident: true,
        residentType: 'Owner',
        topicsAnsweredCount: 11,
        lastUpdated: '4 Days Ago',
        freshnessStatus: 'Current',
        unlockSinglePrice: 129,
        unlockAllPrice: 399,
        topics: [
          {
            id: 'security',
            title: 'Security & Gate Protocol',
            category: 'Safety',
            iconName: 'ShieldCheck',
            readingTime: '2 min read',
            lastUpdated: '4 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'DLF Phase 5 features 3-tier security with armed quick-response vehicles patrolling Golf Course Road perimeter. Visitor verification is instant via digital RFID plates and biometric lobby locks.',
            structuredQA: [
              {
                questionId: 'q_security_gate',
                question: 'How security is maintained?',
                answer: '3-tier military grade private security force.',
                badge: 'Elite Security'
              }
            ]
          }
        ]
      }
    ]
  }
];
