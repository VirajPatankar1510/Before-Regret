import { Society, ResidentKnowledgeProfile, TopicKnowledge, ContributorQuestion } from '../types';
import { CONTRIBUTOR_TOPICS, STRUCTURED_QUESTIONS_DATABASE } from './contributorTopicsData';

export const TOPIC_METADATA = CONTRIBUTOR_TOPICS.map(t => ({
  id: t.id,
  title: t.title,
  category: t.category,
  iconName: t.iconName,
  defaultAnsweredCount: t.defaultAnsweredCount
}));

export const CONTRIBUTOR_QUESTIONS: ContributorQuestion[] = CONTRIBUTOR_TOPICS.flatMap(topic => {
  const subQuestions = STRUCTURED_QUESTIONS_DATABASE[topic.id] || [];
  return subQuestions.map(q => ({
    id: q.id,
    topicId: topic.id,
    topicTitle: topic.title,
    questionText: q.questionText,
    options: q.options
  }));
});


export const INITIAL_SOCIETIES: Society[] = [
  {
    id: 'lodha-amara',
    name: 'Lodha Amara',
    city: 'Thane, Mumbai MMR',
    locality: 'Kolshet Road, Thane West',
    builder: 'Lodha Group',
    pincode: '400607',
    residentProfilesCount: 14,
    totalTopicsAvailable: 22,
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
            id: 'parking-usability',
            title: 'Parking Slot Usability & Parking Clearance',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Lodha Amara employs a multi-level basement parking system with automated RFID tags at entry. Resident slots are assigned permanently without ownership disputes. Overhead clearances and pillar maneuvering are well designed.',
            structuredQA: [
              {
                questionId: 'q_parking_dedicated',
                question: 'Are dedicated resident parking slots well managed without disputes?',
                answer: 'Strictly Managed (No Disputes). Every flat has designated stencil markings and RFID boom barrier entry.',
                badge: 'Resident Security'
              }
            ]
          },
          {
            id: 'water-pressure',
            title: 'Water Pressure & Upper Floor Flow',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'TMC water pressure is boosted by hydro-pneumatic pumps. During peak morning hours (7 AM–9 AM), tap pressure stays consistent across middle and upper floors.',
            structuredQA: [
              {
                questionId: 'q_water_tanker',
                question: 'Is tap water pressure adequate during peak morning usage?',
                answer: 'Strong & Consistent. Hydro-pneumatic booster pumps ensure strong tap flow across all floors.',
                badge: 'Tap Flow'
              }
            ]
          },
          {
            id: 'wfh-tranquility',
            title: 'WFH & Flat Acoustic Isolation',
            category: 'Connectivity',
            iconName: 'Wifi',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'JioFiber and Airtel Xstream provide robust fiber lines. Sound insulation between adjoining flats is good, making calls and WFH quiet.',
            structuredQA: [
              {
                questionId: 'q_internet_providers',
                question: 'Which internet providers are allowed and how stable is fiber for WFH?',
                answer: 'Multiple Fiber Lines (Jio, Airtel, Tata Play). Excellent reliability with 99.8% uptime.',
                badge: 'WFH Verified'
              }
            ]
          },
          {
            id: 'traffic-party-noise',
            title: 'Traffic & Community Noise Levels',
            category: 'Environment',
            iconName: 'VolumeX',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Towers facing internal central park enjoy quiet surroundings. Road-facing wings experience mild traffic hum during peak morning rush.',
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
            id: 'doorstep-deliveries',
            title: 'Doorstep Courier & Delivery Access',
            category: 'Safety',
            iconName: 'ShieldCheck',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'MyGate integration is active across main entry gates. Delivery partners verify passcode entry at the gate before accessing residential towers.',
            structuredQA: [
              {
                questionId: 'q_security_gate',
                question: 'How strictly are visitor apps enforced at entry gates?',
                answer: '100% Strictly Enforced (Approval Needed). Gate pass verification required for all entry.',
                badge: 'Gate Protocol'
              }
            ]
          },
          {
            id: 'power-cuts',
            title: 'Grid Power Supply & Cut Frequency',
            category: 'Utilities',
            iconName: 'Zap',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'MSEDCL supply in Kolshet is highly stable. Power cuts are rare and usually limited to scheduled maintenance once a month.',
            structuredQA: [
              {
                questionId: 'q_electricity_power',
                question: 'Is full power backup available inside flats?',
                answer: '100% Full Flat DG Backup. Seamless switchover in case of grid failure.',
                badge: 'Power Stability'
              }
            ]
          },
          {
            id: 'maid-availability',
            title: 'Maid & Domestic Help Availability',
            category: 'Operations',
            iconName: 'Wrench',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Maid and cook rates are standard. Housekeeping staff clean corridors twice daily. Domestic helpers undergo mandatory society verification.',
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
            id: 'renovation-movein-noc',
            title: 'Move-in & Flat Renovation Rules',
            category: 'Financials',
            iconName: 'Receipt',
            readingTime: '1 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Move-in lift protection deposit is ₹5,000 (refundable). The non-refundable society shifting fee is ₹2,500.',
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
            id: 'insider-truths',
            title: 'Surprises & Ground Realities',
            category: 'Insider Insights',
            iconName: 'Sparkles',
            readingTime: '2 min read',
            lastUpdated: '12 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: '1. Peak morning elevator wait times between 8:15 AM and 8:45 AM can reach 4-5 minutes in high floors.\n2. Grocery delivery via Blinkit takes 8–10 minutes due to security gate processing.',
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
            id: 'parking-usability',
            title: 'Parking Slot Usability & Parking Clearance',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '5 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'As a tenant, my parking slot was clearly specified in the registered rent agreement. RFID tag issuance took 3 working days.',
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
            id: 'maid-availability',
            title: 'Maid & Domestic Help Availability',
            category: 'Operations',
            iconName: 'Wrench',
            readingTime: '2 min read',
            lastUpdated: '5 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Tenants directly pay for maid verification (₹300 one-time fee) and facility pass generation.',
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
    totalTopicsAvailable: 22,
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
            id: 'parking-usability',
            title: 'Parking Slot Usability & Parking Clearance',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '3 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Older Hiranandani buildings have open stilt parking where slots are allocated on an annual rotational basis. Newer towers have multi-level podium basements.',
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
            id: 'water-quality',
            title: 'Water Taste, TDS & Hardness Levels',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '3 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'BMC water supply is extremely clean. TDS levels stay around 80-110 PPM, among the cleanest municipal water in Mumbai.',
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
            id: 'insider-truths',
            title: 'Surprises & Ground Realities',
            category: 'Insider Insights',
            iconName: 'Sparkles',
            readingTime: '2 min read',
            lastUpdated: '3 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: '1. Traffic bottleneck at JVLR junction during peak hours can add 20 minutes to your commute.\n2. Walkability inside Hiranandani is world-class.',
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
    totalTopicsAvailable: 22,
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
            id: 'water-quality',
            title: 'Water Taste, TDS & Hardness Levels',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '8 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Ghodbunder Road location relies on a mixture of STEM water supply and borewells. Water hardness is higher (~280 PPM), making water softeners recommended.',
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
            id: 'traffic-party-noise',
            title: 'Traffic & Community Noise Levels',
            category: 'Environment',
            iconName: 'VolumeX',
            readingTime: '1 min read',
            lastUpdated: '8 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Yeoor Hills facing apartments enjoy quiet surroundings. Ghodbunder front towers hear heavy vehicle diesel engine noise at night.',
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
    totalTopicsAvailable: 22,
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
            id: 'visitor-parking',
            title: 'Visitor Parking Availability & Night Rush',
            category: 'Infrastructure',
            iconName: 'Car',
            readingTime: '2 min read',
            lastUpdated: '15 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'Podium parking is spacious and well ventilated. Visitor parking is managed via NoBrokerHood digital queue with 2 hours free pass.',
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
    totalTopicsAvailable: 22,
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
            id: 'water-availability',
            title: 'Water Supply Reliability & Tanker Cuts',
            category: 'Utilities',
            iconName: 'Droplets',
            readingTime: '2 min read',
            lastUpdated: '1 Day Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'BWSSB Cauvery water line supplies the complex alongside automated internal water treatment plants. Tanker dependency is zero even during dry months.',
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
    totalTopicsAvailable: 22,
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
            id: 'doorstep-deliveries',
            title: 'Doorstep Courier & Delivery Access',
            category: 'Safety',
            iconName: 'ShieldCheck',
            readingTime: '2 min read',
            lastUpdated: '4 Days Ago',
            freshnessStatus: 'Current',
            singlePrice: 129,
            summary: 'DLF Phase 5 features 3-tier security with armed quick-response vehicles patrolling Golf Course Road perimeter. Visitor verification is instant via digital RFID plates.',
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
