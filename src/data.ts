import { Neighborhood, ExpertProfile, Review, PricingPlan } from "./types";

export const pricingPlans: PricingPlan[] = [
  {
    id: 'QUICK',
    badge: 'Basic Clarity',
    badgeStyle: 'bg-blue-50 text-blue-700 font-semibold',
    title: 'Quick Question',
    description: 'Ask one specific question and get a swift, precise answer about standard society rules or amenities.',
    price: 99,
    pricePeriod: '/ question',
    features: [
      'Ask 1 specific question',
      'Local resident response within 24 hours',
      'Secure escrow protection (48h)',
      '100% refund if not answered'
    ],
    cta: 'Select Basic'
  },
  {
    id: 'BUNDLE',
    badge: 'Detailed Consultation',
    badgeStyle: 'bg-emerald-50 text-emerald-700 font-semibold',
    title: 'Three Questions',
    description: 'Get a detailed custom report covering your requested society topics, like water tanks and maid charges.',
    price: 199,
    pricePeriod: '/ 3 questions',
    features: [
      'Ask up to 3 detailed questions',
      'Direct messaging with local expert',
      'Contact protection (no spam/broker calls)',
      'Escrow released only upon satisfaction'
    ],
    cta: 'Select Standard'
  },
  {
    id: 'LIVE_CHAT',
    badge: '30-Min Live Consultation',
    badgeStyle: 'bg-orange-50 text-orange-700 font-semibold',
    title: '30 Mins Live Chat',
    description: 'Book a direct real-time 30-minute chat consultation with the resident at a scheduled convenient slot.',
    price: 299,
    pricePeriod: '/ 30 min session',
    features: [
      '30-minute real-time chat with the resident',
      'Select from verified convenient time slots',
      'Instant slot booking confirmation',
      'Secure escrow protection (48h)'
    ],
    cta: 'Select Live Chat'
  }
];

export const INITIAL_LOCALITIES: Neighborhood[] = [
  {
    id: 'loc_bimbisar_nagar',
    name: 'Bimbisar Nagar',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400063',
    society: 'MHADA Complex',
    builder: 'MHADA',
    apartmentName: 'Bimbisar Nagar Co-op Society',
    expertCount: 1,
    averageRating: 4.9,
    waterTankerDependency: 15,
    parkingDisputes: 40,
    powerCutHistory: 5,
    bachelorPetRules: 10,
    monsoonFlooding: 25,
    noiseIndex: 30
  },
  {
    id: 'loc_prestige_shantiniketan',
    name: 'Prestige Shantiniketan',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560048',
    society: 'Prestige Residential',
    builder: 'Prestige Group',
    apartmentName: 'Prestige Shantiniketan Apartments',
    expertCount: 3,
    averageRating: 4.8,
    waterTankerDependency: 85,
    parkingDisputes: 15,
    powerCutHistory: 10,
    bachelorPetRules: 30,
    monsoonFlooding: 5,
    noiseIndex: 20
  },
  {
    id: 'loc_dlf_phase_5',
    name: 'DLF Phase 5',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122009',
    society: 'The Crest',
    builder: 'DLF',
    apartmentName: 'DLF The Crest Complex',
    expertCount: 2,
    averageRating: 4.9,
    waterTankerDependency: 20,
    parkingDisputes: 25,
    powerCutHistory: 15,
    bachelorPetRules: 45,
    monsoonFlooding: 50,
    noiseIndex: 35
  },
  {
    id: 'loc_lodha_amara',
    name: 'Lodha Amara',
    city: 'Thane',
    state: 'Maharashtra',
    pincode: '400607',
    society: 'Kolshet Road Complex',
    builder: 'Lodha Group',
    apartmentName: 'Lodha Amara Phase 1-4',
    expertCount: 2,
    averageRating: 5.0,
    waterTankerDependency: 40,
    parkingDisputes: 10,
    powerCutHistory: 5,
    bachelorPetRules: 15,
    monsoonFlooding: 15,
    noiseIndex: 25
  },
  {
    id: 'loc_hsr_layout',
    name: 'HSR Layout Sector 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
    society: 'HSR Layout Block A',
    builder: 'BDA Layout',
    apartmentName: 'Standalone builder floor grid',
    expertCount: 2,
    averageRating: 4.7,
    waterTankerDependency: 90,
    parkingDisputes: 65,
    powerCutHistory: 20,
    bachelorPetRules: 70,
    monsoonFlooding: 75,
    noiseIndex: 40
  }
];

export const INITIAL_EXPERTS: ExpertProfile[] = [
  {
    id: 'exp_priya',
    userId: 'user_priya',
    fullName: 'Priya',
    bio: 'Resident since 2016. I can consult you on water supply hours, maid availability, parking constraints, and MHADA complex rules. Very active in the local resident association.',
    localityId: 'loc_bimbisar_nagar',
    localityName: 'Bimbisar Nagar, Jogeshwari',
    city: 'Mumbai',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    memberSince: 'Oct 2018',
    questionsAnsweredCount: 15,
    responseRate: 98,
    responseTime: 'Replies within 2 hours',
    rating: 4.9,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ['Schools', 'Safety', 'Water hours', 'Maids coordination', 'Pets rules'],
    areasCovered: ['Bimbisar Nagar', 'Jogeshwari East'],
    yearsLivingThere: 10,
    repeatBuyersCount: 6,
    experienceLevel: 'Trusted Local',
    trustScore: 95,
    languages: ['Hindi', 'English', 'Marathi'],
    availability: 'Everyday (10 AM - 9 PM)',
    availableSlots: [
      'Today, 04:30 PM - 05:00 PM',
      'Today, 06:00 PM - 06:30 PM',
      'Tomorrow, 11:00 AM - 11:30 AM',
      'Tomorrow, 03:00 PM - 03:30 PM',
      'Tomorrow, 07:30 PM - 08:00 PM'
    ]
  },
  {
    id: 'exp_rahul',
    userId: 'user_rahul',
    fullName: 'Rahul K.',
    bio: 'Corporate manager living in Prestige Shantiniketan since 2018. If you want real facts about the borewell dependency, water tanker bills, guest guidelines, and school bus routes, ask me directly.',
    localityId: 'loc_prestige_shantiniketan',
    localityName: 'Prestige Shantiniketan, Whitefield',
    city: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    memberSince: 'Mar 2019',
    questionsAnsweredCount: 24,
    responseRate: 100,
    responseTime: 'Replies within 1 hour',
    rating: 4.8,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ['Water Tankers', 'School Bus Routes', 'Gym & Amenities', 'Parking rules'],
    areasCovered: ['Whitefield', 'Hoodi'],
    yearsLivingThere: 8,
    repeatBuyersCount: 11,
    experienceLevel: 'Neighborhood Specialist',
    trustScore: 98,
    languages: ['English', 'Hindi', 'Kannada'],
    availability: 'Weekends & Evenings',
    availableSlots: [
      'Today, 05:00 PM - 05:30 PM',
      'Today, 08:00 PM - 08:30 PM',
      'Tomorrow, 10:00 AM - 10:30 AM',
      'Tomorrow, 04:00 PM - 04:30 PM',
      'Tomorrow, 06:30 PM - 07:00 PM'
    ]
  },
  {
    id: 'exp_sneha',
    userId: 'user_sneha',
    fullName: 'Sneha Roy',
    bio: 'Software engineer residing in HSR Layout. I know the local water tankers schedules, high electricity load shedding history, standard maid rates, and absolute worst waterlogged spots in the sector during heavy rains.',
    localityId: 'loc_hsr_layout',
    localityName: 'HSR Layout Sector 2',
    city: 'Bengaluru',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    memberSince: 'Jul 2020',
    questionsAnsweredCount: 18,
    responseRate: 95,
    responseTime: 'Replies within 4 hours',
    rating: 4.7,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ['Waterlogging', 'Maids rates', 'Cafes & Cafeterias', 'Remote work spots'],
    areasCovered: ['HSR Layout', 'Sector 1-3'],
    yearsLivingThere: 6,
    repeatBuyersCount: 4,
    experienceLevel: 'Established Local',
    trustScore: 91,
    languages: ['English', 'Bengali', 'Hindi'],
    availability: 'Flexible timing',
    availableSlots: [
      'Today, 03:00 PM - 03:30 PM',
      'Today, 07:00 PM - 07:30 PM',
      'Tomorrow, 09:30 AM - 10:00 AM',
      'Tomorrow, 02:00 PM - 02:30 PM',
      'Tomorrow, 05:00 PM - 05:30 PM'
    ]
  },
  {
    id: 'exp_amit',
    userId: 'user_amit',
    fullName: 'Amit Sharma',
    bio: 'Long-term resident at DLF Phase 5. If you are moving with your family and want unvarnished reviews about nearby CBSE/ICSE schools, safety for late-night walks, and strict pet constraints inside high-rises, let me assist.',
    localityId: 'loc_dlf_phase_5',
    localityName: 'DLF Phase 5',
    city: 'Gurugram',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    memberSince: 'Dec 2017',
    questionsAnsweredCount: 42,
    responseRate: 99,
    responseTime: 'Replies within 3 hours',
    rating: 4.9,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ['Schools', 'Safety after dark', 'Parks & Pets', 'Maintenance fee'],
    areasCovered: ['DLF Phase 5', 'Golf Course Road'],
    yearsLivingThere: 9,
    repeatBuyersCount: 15,
    experienceLevel: 'Community Favorite',
    trustScore: 99,
    languages: ['Hindi', 'English', 'Punjabi'],
    availability: 'Daily (9 AM - 10 PM)',
    availableSlots: [
      'Today, 04:00 PM - 04:30 PM',
      'Today, 06:30 PM - 07:00 PM',
      'Tomorrow, 11:30 AM - 12:00 PM',
      'Tomorrow, 03:30 PM - 04:00 PM',
      'Tomorrow, 08:00 PM - 08:30 PM'
    ]
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    queryId: 'q_mock_1',
    buyerName: 'Rohan Deshmukh',
    expertId: 'exp_priya',
    rating: 5,
    comment: 'Priya gave a stellar breakdown of Bimbisar Nagar. She pointed out that Block A and B have 24/7 water whereas C has brief morning limits. Saved me a major relocation headache!',
    createdAt: '2026-06-20T10:30:00Z'
  },
  {
    id: 'rev_2',
    queryId: 'q_mock_2',
    buyerName: 'Karthik Rao',
    expertId: 'exp_rahul',
    rating: 5,
    comment: 'Extremely detailed assessment of Prestige Shantiniketan. Clear answer regarding maid restrictions and visitor protocols. Highly recommended!',
    createdAt: '2026-07-02T14:15:00Z'
  },
  {
    id: 'rev_3',
    queryId: 'q_mock_3',
    buyerName: 'Shalini S.',
    expertId: 'exp_sneha',
    rating: 4,
    comment: 'Very practical guide about HSR layouts sector 2 flooding spots. Good to know which basements leak during heavy rainfall. Saved my sedan!',
    createdAt: '2026-07-05T08:45:00Z'
  },
  {
    id: 'rev_4',
    queryId: 'q_mock_4',
    buyerName: 'Vikram Grover',
    expertId: 'exp_amit',
    rating: 5,
    comment: 'Amit answered all my school bus and pet guidelines questions on Gurugram DLF. Truly professional resident response.',
    createdAt: '2026-07-10T18:20:00Z'
  }
];

export const TOPICS_OF_EXPERTISE = [
  'Schools',
  'Safety',
  'Parking',
  'Restaurants',
  'Traffic',
  'Public Transport',
  'Families',
  'Nightlife',
  'Pets',
  'Remote Work',
  'Water Quality',
  'Maids availability',
  'Flooding / Water Logging',
  'Cleanliness & Dust',
  'Power Cuts & Backup',
  'Mobile Network Strength',
  'Society Maintenance Fees',
  'Mosquito & Pest Control',
  'Bachelors & Tenant Rules',
  'Maid & Cook Wages',
  'Gym & Club Amenities',
  'Delivery & Courier Rules'
];

export const MOCK_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sneha&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Amit&backgroundColor=d1f4c9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Anya&backgroundColor=ffdf70',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Dev&backgroundColor=ffb070',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Riya&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram&backgroundColor=b6e3f4'
];
