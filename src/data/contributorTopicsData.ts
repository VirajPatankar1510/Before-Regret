import { ContributorQuestion } from '../types';
import { loadCustomExcelDataFromStorage } from '../utils/excelEngine';

export interface TopicDefinition {
  id: string;
  title: string;
  mainQuestion?: string;
  category: string;
  iconName: string;
  description: string;
  defaultAnsweredCount: number;
}

export interface StructuredSubQuestion {
  id: string;
  topicId: string;
  mainQuestionText?: string;
  questionText: string;
  type?: 'single-choice' | 'yes-no' | 'rating' | 'frequency' | 'checkbox-group' | string;
  inputType?: string;
  options: string[];
  answers?: string[];
  helpText?: string;
}

export interface BackgroundQuestionConfig {
  id: string;
  label: string;
  inputType: 'select' | 'radio' | 'text';
  options: string[];
  placeholder?: string;
  defaultValue?: string;
}

export interface FollowUpQuestionConfig {
  id: string;
  questionText: string;
  inputType: 'radio' | 'checkbox' | 'dropdown' | 'rating' | 'slider';
  options?: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderUnit?: string;
  helpText?: string;
}

export interface RelevantExperienceLabels {
  label1: string;
  label2: string;
}

export function generateRelevantExperienceLabels(bgData: Record<string, string>): RelevantExperienceLabels {
  const residentType = bgData.residentType || 'Resident';
  const yearsLiving = bgData.yearsLiving || 'Local Resident';

  const label1 = `Resident Profile: ${residentType} (${yearsLiving})`;

  const remainingValues: string[] = [];
  if (bgData.floorRange) remainingValues.push(bgData.floorRange);
  if (bgData.vehicleType) remainingValues.push(bgData.vehicleType);
  if (bgData.flatFacing) remainingValues.push(bgData.flatFacing);
  if (bgData.wfhMode) remainingValues.push(bgData.wfhMode);

  Object.keys(bgData).forEach(key => {
    if (!['residentType', 'yearsLiving', 'floorRange', 'vehicleType', 'flatFacing', 'wfhMode'].includes(key)) {
      if (bgData[key]) remainingValues.push(bgData[key]);
    }
  });

  const label2 = remainingValues.length > 0 
    ? `Living Context: ${remainingValues.join(' • ')}`
    : `Living Context: Verified Resident`;

  return { label1, label2 };
}

export interface MainQuestionItem {
  id: string;
  topicId: string;
  category: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  backgroundFields: BackgroundQuestionConfig[];
  generateRelevantExperience: (bgData: Record<string, string>) => string;
  generateRelevantExperienceLabels?: (bgData: Record<string, string>) => RelevantExperienceLabels;
  followUpQuestions: FollowUpQuestionConfig[];
}

// HIGHLY FOCUSED DECISION BUNDLES CATALOG (HUMAN EXPERIENCE & REGRET ORIENTED)
export const CONTRIBUTOR_TOPICS: TopicDefinition[] = [
  // Water Domain
  {
    id: 'water-pressure',
    title: 'Water Pressure & Shower Experience',
    category: 'Water & Plumbing',
    iconName: 'Gauge',
    description: 'Peak morning shower pressure, high floor flow strength, multi-tap pressure drops during everyday use',
    defaultAnsweredCount: 18
  },
  {
    id: 'water-quality',
    title: 'Water Quality, Flush Odor & Scaling',
    category: 'Water & Plumbing',
    iconName: 'Droplets',
    description: 'Toilet flush water odor & color, tap hard water scaling on geysers/fixtures, RO purification & drinking water realities',
    defaultAnsweredCount: 16
  },
  {
    id: 'water-availability',
    title: 'Water Shortages & Tanker Dependency',
    category: 'Water & Plumbing',
    iconName: 'Droplet',
    description: '24x7 water continuity, summer dry tap hours, tanker dependency & skin/hair impact, unannounced cut-offs',
    defaultAnsweredCount: 15
  },

  // Parking Domain
  {
    id: 'parking-usability',
    title: 'Parking Slot Sizing & Daily Parking Hassle',
    category: 'Parking & Vehicles',
    iconName: 'Car',
    description: 'Slot width for SUVs/Sedans, tight pillar obstructions, dependent back-to-back spots & basement ramp blindspots',
    defaultAnsweredCount: 14
  },
  {
    id: 'visitor-parking',
    title: 'Visitor Parking & Guest Access',
    category: 'Parking & Vehicles',
    iconName: 'Users',
    description: 'Guest slot availability on weekends, security gate entry delays for visitors, street parking safety & towing risks',
    defaultAnsweredCount: 12
  },
  {
    id: 'ev-charging',
    title: 'EV Charger Permission & Installation',
    category: 'Parking & Vehicles',
    iconName: 'Zap',
    description: 'Ease of getting society NOC for private EV chargers, meter-to-slot cabling feasibility & common charging points',
    defaultAnsweredCount: 9
  },

  // Noise & Environment Domain
  {
    id: 'wfh-tranquility',
    title: 'WFH Peace, Thin Walls & Neighbor Noise',
    category: 'Noise & Environment',
    iconName: 'VolumeX',
    description: 'Inter-flat wall & ceiling sound leakage, footstep/TV noise transfer, podium child play echo into flat bedrooms',
    defaultAnsweredCount: 13
  },
  {
    id: 'traffic-party-noise',
    title: 'Road Traffic & Late Night Party Noise',
    category: 'Noise & Environment',
    iconName: 'Volume2',
    description: 'Main road traffic honking on balconies, weekend clubhouse party noise after 10 PM, street dog barking at night',
    defaultAnsweredCount: 11
  },

  // Power & Electricity Domain
  {
    id: 'power-cuts',
    title: 'Power Cut Frequency & Voltage Trips',
    category: 'Electricity & Power',
    iconName: 'ZapOff',
    description: 'Locality power cut frequency, summer voltage drops risking AC/appliance damage, monsoon outage durations',
    defaultAnsweredCount: 10
  },
  {
    id: 'generator-backup',
    title: 'Generator Backup & AC Coverage',
    category: 'Electricity & Power',
    iconName: 'BatteryCharging',
    description: 'In-flat DG backup coverage for Air Conditioners vs basic lights, auto-switchover speed, diesel surcharge billing',
    defaultAnsweredCount: 12
  },

  // Elevators & High-Rise Domain
  {
    id: 'lift-waiting-times',
    title: 'Lift Waiting Times & Morning Rush',
    category: 'Elevators & High-Rise',
    iconName: 'Clock',
    description: 'Peak morning rush lift wait times (8-9:30 AM), lobby queues, elevator capacity relative to tower flats',
    defaultAnsweredCount: 14
  },
  {
    id: 'lift-breakdown-speed',
    title: 'Elevator Breakdown & Repair Speed',
    category: 'Elevators & High-Rise',
    iconName: 'Wrench',
    description: 'Elevator breakdown frequency per month, repair turnaround speed, sudden jerks or door sensor jams',
    defaultAnsweredCount: 10
  },

  // Daily Convenience Domain
  {
    id: 'doorstep-deliveries',
    title: '10-Min Deliveries & Doorstep Cab Entry',
    category: 'Daily Convenience',
    iconName: 'Package',
    description: 'Blinkit/Zepto 10-min grocery delivery ease to flat door, Swiggy rider entry speed, cab pickup at tower entrance',
    defaultAnsweredCount: 15
  },
  {
    id: 'maid-availability',
    title: 'Maid, Cook & Domestic Help Availability',
    category: 'Daily Convenience',
    iconName: 'UserCheck',
    description: 'Ease of hiring verified maids & cooks, local maid union rate cards, security gate digital pass approval',
    defaultAnsweredCount: 11
  },

  // Monsoon Realities Domain
  {
    id: 'monsoon-gate-flooding',
    title: 'Monsoon Gate Flooding & Approach Roads',
    category: 'Monsoon Realities',
    iconName: 'CloudRain',
    description: 'Entrance gate waterlogging during downpours, pothole-ridden approach roads, cab/delivery shutdowns in rain',
    defaultAnsweredCount: 13
  },
  {
    id: 'monsoon-seepage',
    title: 'Monsoon Wall Seepage & Basement Drips',
    category: 'Monsoon Realities',
    iconName: 'ShieldAlert',
    description: 'Flat exterior wall dampness, window seepage, basement parking ceiling water dripping onto parked cars',
    defaultAnsweredCount: 12
  },

  // Society Governance Domain
  {
    id: 'committee-fairness',
    title: 'Committee Rules, Transparency & Tenant Rights',
    category: 'Society Governance',
    iconName: 'Scale',
    description: 'Owner vs tenant rule equality, arbitrary fines, guest curfews, maintenance spending transparency & audit reports',
    defaultAnsweredCount: 14
  },
  {
    id: 'renovation-movein-noc',
    title: 'Renovation NOCs, Move-In & Deposit Hassle',
    category: 'Society Governance',
    iconName: 'FileCheck',
    description: 'Turnaround for interior renovation NOCs, move-in shifting fees, elevator padding rules, deposit refund delays',
    defaultAnsweredCount: 9
  },
  {
    id: 'hidden-charges-hikes',
    title: 'Hidden Maintenance Hikes & Unexpected Costs',
    category: 'Society Governance',
    iconName: 'Receipt',
    description: 'Unexpected maintenance fee inflation, separate user charges for gym/pool, mandatory ad-hoc festival funds',
    defaultAnsweredCount: 11
  },

  // Family, Pets & Retrospect Domain
  {
    id: 'child-safety-play',
    title: 'Child Safety & Play Area Upkeep',
    category: 'Family & Community',
    iconName: 'Baby',
    description: 'Vehicle-free play areas for kids, play equipment condition & soft flooring, active CCTV coverage',
    defaultAnsweredCount: 8
  },
  {
    id: 'pet-rules',
    title: 'Pet Acceptance & Walking Restrictions',
    category: 'Family & Community',
    iconName: 'HeartHandshake',
    description: 'Neighbor attitude toward pets, designated walking zones inside compound, elevator access policies',
    defaultAnsweredCount: 7
  },
  {
    id: 'insider-truths',
    title: 'Insider Regrets & Would-You-Buy-Again Sentiment',
    category: 'Living Experience',
    iconName: 'Sparkles',
    description: 'What brokers and builders hide from buyers, operational trade-offs, would buy or rent here again verdict',
    defaultAnsweredCount: 19
  }
];

export const MAIN_QUESTIONS_CATALOG: MainQuestionItem[] = [
  // 1. Water Pressure
  {
    id: 'mq_water_pressure',
    topicId: 'water-pressure',
    category: 'Water & Plumbing',
    title: 'How strong and consistent is the water pressure during peak morning hours across all floors?',
    description: 'Evaluates peak hour shower pressure, upper floor booster pump performance, and multi-tap pressure drops.',
    iconName: 'Gauge',
    badge: 'Daily Comfort',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '3 - 5 years'
      },
      {
        id: 'floorRange',
        label: 'Floor Level in Tower',
        inputType: 'select',
        options: ['Ground - 5th Floor', '6th - 12th Floor', '13th - 20th Floor', 'Top Floors (20+)'],
        defaultValue: '13th - 20th Floor'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '3-5 years';
      const floor = bg.floorRange || '13th - 20th Floor';
      return `${years} ${resType.toLowerCase()} living on ${floor.toLowerCase()} experiencing daily tap water pressure.`;
    },
    followUpQuestions: [
      {
        id: 'wp_mq_1',
        questionText: 'Does shower pressure drop significantly during morning peak hours (7:00 AM - 9:30 AM)?',
        inputType: 'radio',
        options: [
          'Constant High Pressure (No Drop Observed)',
          'Slight Pressure Drop (Slightly Reduced Shower Flow)',
          'Noticeable Low Flow in Showers During Peak Rush',
          'Severe Flow Loss / Very Weak Pressure Every Morning'
        ]
      },
      {
        id: 'wp_mq_2',
        questionText: 'How is tap and shower water pressure on upper floors (10th floor and above) compared to lower floors?',
        inputType: 'radio',
        options: [
          'Consistently Strong Pressure On Upper Floors',
          'Adequate & Even Pressure Maintained Across Floors',
          'Upper Floors Suffer Weaker Pressure Than Lower Floors'
        ]
      },
      {
        id: 'wp_mq_3',
        questionText: 'When multiple taps or washing machines run simultaneously inside your flat, does tap pressure drop?',
        inputType: 'radio',
        options: [
          'Zero Drop (Strong Simultaneous Flow everywhere)',
          'Minor Acceptable Drop',
          'Noticeable Pressure Cut when Flush/Washing Machine runs',
          'Severe Pressure Drop (Hard to Shower if Tap in Kitchen is On)'
        ]
      },
      {
        id: 'wp_mq_4',
        questionText: 'Do water taps experience sudden air locks, sputtering, or pressure surging when turned on?',
        inputType: 'radio',
        options: [
          'Never (Smooth Flow Always)',
          'Occasional Sputtering After Main Line Repairs',
          'Frequent Pipe Sputtering & Pressure Surges'
        ]
      },
      {
        id: 'wp_mq_5',
        questionText: 'How is water pressure during late night hours (after 11 PM)?',
        inputType: 'radio',
        options: [
          'Strong & Consistent 24x7',
          'Slightly Lower Night Pressure',
          'Significantly Reduced Night Flow'
        ]
      },
      {
        id: 'wp_mq_6',
        questionText: 'Rate overall water pressure consistency and shower satisfaction (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Very Weak & Frustrating Pressure, 5 = Powerful & Flawless Pressure'
      }
    ]
  },

  // 2. Water Quality
  {
    id: 'mq_water_quality',
    topicId: 'water-quality',
    category: 'Water & Plumbing',
    title: 'What is the quality, hardness, and clarity of water in bathroom taps and kitchen lines?',
    description: 'Examines tap scaling, RO purifier necessity, 20L water can dependency, and STP recycled flush water odor.',
    iconName: 'Droplets',
    badge: 'Health & Plumbing',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '3 - 5 years'
      },
      {
        id: 'purifierType',
        label: 'Drinking Water Solution',
        inputType: 'select',
        options: ['RO Purifier', 'UV/UF Purifier', 'Bottled 20L Cans', 'Tap Filter Only'],
        defaultValue: 'RO Purifier'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '3-5 years';
      const pur = bg.purifierType || 'RO Purifier';
      return `${years} ${resType.toLowerCase()} using an in-flat ${pur.toLowerCase()}.`;
    },
    followUpQuestions: [
      {
        id: 'wq_mq_1',
        questionText: 'Is hard water scaling causing white stains or damage to bathroom taps, showerheads, and geysers?',
        inputType: 'radio',
        options: [
          'Zero Hardness Damage (Soft Municipal Supply)',
          'Mild White Stains (Easy to Clean with Vinegar/Cleaner)',
          'High Hardness (Causes Frequent Tap Corrosion & Geyser Scaling)',
          'Severe Hard Water (Requires Central Water Softener Plant)'
        ]
      },
      {
        id: 'wq_mq_2',
        questionText: 'What drinking water filtration setup is necessary for safe domestic drinking?',
        inputType: 'radio',
        options: [
          'Municipal Tap Water Clean & Safe (Basic RO/UV Suffices)',
          'Multi-Stage RO Essential Due to High TDS',
          'Many Residents Prefer Purchasing 20L Drinking Cans',
          'Tap Water Unfit for Cooking / Drinking'
        ]
      },
      {
        id: 'wq_mq_3',
        questionText: 'How clean, clear, and odour-free is the flush water supply in bathrooms?',
        inputType: 'radio',
        options: [
          'Clear & Completely Odourless Flush Water',
          'Minor Chemical Odour on Hot Summer Days',
          'Yellowish Tint & Noticeable Smell in Bathrooms',
          'Fresh Municipal Water Used for Flushing'
        ]
      },
      {
        id: 'wq_mq_4',
        questionText: 'Have you noticed sediment, rust, or turbidity in kitchen or bathroom tap water?',
        inputType: 'radio',
        options: [
          'Always Crystal Clear Water',
          'Occasional Sediment After Main Line Cleaning',
          'Frequent Turbidity / Muddy Water'
        ]
      },
      {
        id: 'wq_mq_5',
        questionText: 'How frequently do tap aerators or showerheads get clogged by white mineral scaling?',
        inputType: 'radio',
        options: [
          'Rarely / Clean Filters Year-Round',
          'Cleaned Every Few Months',
          'Frequent Clogging Every Few Weeks'
        ]
      },
      {
        id: 'wq_mq_6',
        questionText: 'Rate overall water purity, clarity, and tap health satisfaction (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Poor Quality & Heavy Scaling, 5 = Clean, Pure & Soft Water'
      }
    ]
  },

  // 3. Water Availability
  {
    id: 'mq_water_availability',
    topicId: 'water-availability',
    category: 'Water & Plumbing',
    title: 'How reliable is the 24x7 water supply, summer tanker dependency, and pipeline shutdown frequency?',
    description: 'Assesses municipal supply continuity, summer tanker shortages, emergency rationing, and main line repairs.',
    iconName: 'Droplet',
    badge: 'Essential Supply',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '3 - 5 years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '3-5 years';
      return `${years} ${resType.toLowerCase()} relying on society water supply tanks.`;
    },
    followUpQuestions: [
      {
        id: 'wa_mq_1',
        questionText: 'Is municipal tap water available 24x7 without scheduled daily supply cuts?',
        inputType: 'radio',
        options: [
          '24x7 Uninterrupted Supply (Sufficient Sump Capacity)',
          'Supplied Continuously with Occasional Tank Maintenance',
          'Scheduled Timings Enforced (Water Available 6-8 Hours Daily)',
          'Frequent Water Shortages & Emergency Supply Cutoffs'
        ]
      },
      {
        id: 'wa_mq_2',
        questionText: 'Are private water tankers required during peak summer months (April to June)?',
        inputType: 'radio',
        options: [
          'Zero Water Tankers Needed (100% Municipal Supply Year-Round)',
          'Occasional Tanker Supplement in Peak May',
          'Heavy Summer Tanker Dependency (Dozens of Tankers Daily)',
          'Severe Summer Water Crisis with High Maintenance Surcharges'
        ]
      },
      {
        id: 'wa_mq_3',
        questionText: 'How often do unscheduled pipeline leakage repairs cause water shutdowns per month?',
        inputType: 'radio',
        options: [
          'Zero Unscheduled Shutdowns (Robust Plumbing Pipelines)',
          'Rare Shutdown (1-2 Times a Year with Prior Notice)',
          'Monthly Pipeline Repair Outages',
          'Frequent Sudden Supply Disruptions Without Notice'
        ]
      },
      {
        id: 'wa_mq_4',
        questionText: 'How much prior notice does society management provide before scheduled water supply maintenance shutdowns?',
        inputType: 'radio',
        options: [
          '24+ Hours Advance App/SMS Alert',
          'Notified Same Morning',
          'Sudden Cuts Without Advance Alert'
        ]
      },
      {
        id: 'wa_mq_5',
        questionText: 'Do overhead water tanks get refilled reliably every day without running completely dry?',
        inputType: 'radio',
        options: [
          'Always Refilled Reliably',
          'Occasional Delay During Peak Summer',
          'Frequent Dry Overhead Tanks'
        ]
      },
      {
        id: 'wa_mq_6',
        questionText: 'Rate overall 24x7 water availability and summer peace of mind (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Frequent Scarcity & Rationing, 5 = Abundant & 100% Continuous Water'
      }
    ]
  },

  // 4. Parking Slot Usability
  {
    id: 'mq_parking_usability',
    topicId: 'parking-usability',
    category: 'Parking & Vehicles',
    title: 'How practical, spacious, and easy to maneuver is your designated parking slot?',
    description: 'Evaluates pillar obstructions, stack/puzzle parking inconvenience, double parking, and SUV clearances.',
    iconName: 'Car',
    badge: 'Parking Usability',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'vehicleType',
        label: 'Primary Vehicle Owned',
        inputType: 'select',
        options: ['Large SUV / MUV', 'Sedan', 'Hatchback', 'Electric Vehicle (EV)', 'Two Wheeler Only'],
        defaultValue: 'Large SUV / MUV'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const vehicle = bg.vehicleType || 'Large SUV / MUV';
      return `${resType.toLowerCase()} parking a ${vehicle.toLowerCase()} daily.`;
    },
    followUpQuestions: [
      {
        id: 'pu_mq_1',
        questionText: 'Is your allotted parking slot easy to park in without awkward pillar obstructions?',
        inputType: 'radio',
        options: [
          'Spacious & Easy Clearance (Wide Driving Alley)',
          'Tight Alignment (Pillars Require Careful Reversing)',
          'Dependent / Stack / Puzzle Slot (Requires Neighbor Movement)',
          'Awkward Angle / Frequent Vehicle Door Scratch Risks'
        ]
      },
      {
        id: 'pu_mq_2',
        questionText: 'Do neighboring car owners double-park or block your designated slot access?',
        inputType: 'radio',
        options: [
          'Never Blocked (Strictly Monitored by Basement Guards)',
          'Occasional Minor Blocking (Quickly Resolved)',
          'Frequent Double Parking & Blocked Access',
          'Unorganized Parking Chaos in Basement Driveways'
        ]
      },
      {
        id: 'pu_mq_3',
        questionText: 'How easy is driving through society parking ramps and basement driveways for cars and SUVs?',
        inputType: 'radio',
        options: [
          'Wide Ramps & Easy Turning Clearance',
          'Standard Ramps (Manageable with Normal Driving Care)',
          'Tight Ramps & Narrow Turning Curves'
        ]
      },
      {
        id: 'pu_mq_4',
        questionText: 'Is the parking driveway adequately lit and clearly marked with pillar numbers?',
        inputType: 'radio',
        options: [
          'Well-Lit with High Visibility & Column Padding',
          'Adequately Lit',
          'Dimly Lit / Missing Bay Numbers'
        ]
      },
      {
        id: 'pu_mq_5',
        questionText: 'How clean and dry are the basement parking floors overall?',
        inputType: 'radio',
        options: [
          'Swept Regularly & Completely Dry',
          'Generally Clean',
          'Frequent Water Drips or Heavy Dust'
        ]
      },
      {
        id: 'pu_mq_6',
        questionText: 'Rate overall designated parking slot usability and drive-in ease (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Frustratingly Narrow & Obstructed, 5 = Broad, Spacious & Effortless'
      }
    ]
  },

  // 5. Visitor Parking
  {
    id: 'mq_visitor_parking',
    topicId: 'visitor-parking',
    category: 'Parking & Vehicles',
    title: 'How easily can visiting guests park inside the society on weekends and evenings?',
    description: 'Covers visitor slot availability, gate security clearance speed, evening filling, and street parking.',
    iconName: 'Users',
    badge: 'Guest Access',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Tenant'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '1 - 3 years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Tenant';
      return `${resType.toLowerCase()} hosting visiting guests and relatives.`;
    },
    followUpQuestions: [
      {
        id: 'vp_mq_1',
        questionText: 'Are dedicated visitor parking slots available when guests arrive in the evening?',
        inputType: 'radio',
        options: [
          'Dedicated Visitor Slots Always Available',
          'Available on First-Come Basis (Fills Up after 8 PM)',
          'Extremely Limited Visitor Slots (Guests Struggle to Park)',
          'Zero Visitor Parking Inside (Guests Must Park on Public Street)'
        ]
      },
      {
        id: 'vp_mq_2',
        questionText: 'How fast is the gate security pass clearance for guest vehicles entering the society?',
        inputType: 'radio',
        options: [
          'Instant Gate Clearance via Mobile App Entry Approval',
          'Quick Manual Register Verification (Under 2 Mins)',
          'Slow Gate Queue (Guards Hold Up Visitor Cars)',
          'Strict Unfriendly Security Interrogation for Guests'
        ]
      },
      {
        id: 'vp_mq_3',
        questionText: 'Is external street parking outside the society gate safe for guest cars if visitor slots fill up?',
        inputType: 'radio',
        options: [
          'Safe Broad Service Road with Ample Parking Space',
          'Adequate Street Space (Monitored by Security Cameras)',
          'Narrow Congested Street (Towing / Scraping Risk)',
          'No Street Parking Allowed (Traffic Police Towing Zone)'
        ]
      },
      {
        id: 'vp_mq_4',
        questionText: 'Rate overall guest vehicle parking convenience and gate access ease (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Nightmare for Visiting Guests, 5 = Welcoming, Fast & Effortless'
      }
    ]
  },

  // 6. EV Charging
  {
    id: 'mq_ev_charging',
    topicId: 'ev-charging',
    category: 'Parking & Vehicles',
    title: 'Is installing a personal EV charger in your basement slot permitted, smooth, and safe?',
    description: 'Examines society NOC approval speed, transformer load capacity, sub-meter billing, and basement safety.',
    iconName: 'Zap',
    badge: 'EV Readiness',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      return `${resType.toLowerCase()} evaluating electric vehicle charging infrastructure.`;
    },
    followUpQuestions: [
      {
        id: 'ev_mq_1',
        questionText: 'What is the process and attitude toward installing a personal EV charger in parking slots?',
        inputType: 'radio',
        options: [
          'Approved Smoothly with Clear NOC Guidelines',
          'Requires Standard Committee Review & Deposit',
          'Slow Unclear Approval Process',
          'Personal EV Charger Installation Currently Restricted'
        ]
      },
      {
        id: 'ev_mq_2',
        questionText: 'Is the society electrical transformer capacity adequate for multiple EV chargers running simultaneously?',
        inputType: 'radio',
        options: [
          'High Grid Capacity (Dedicated EV Substation/Panel)',
          'Adequate for Current EV Owners',
          'Transformer Near Peak Capacity (Limits on New Installations)',
          'Power Trips Recorded During Peak EV Charging Hours'
        ]
      },
      {
        id: 'ev_mq_3',
        questionText: 'Are common shared EV charging bays installed in the society for general resident use?',
        inputType: 'radio',
        options: [
          'Operational Fast-Charging Stations Active in Visitor/Common Bays',
          'Basic Slow-Charging Points Available',
          'No Common EV Charging Points Available',
          'Under Consideration by Managing Committee'
        ]
      },
      {
        id: 'ev_mq_4',
        questionText: 'Rate overall society EV readiness and charging infrastructure (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Hostile / Prohibited for EVs, 5 = Future-Proof & Fully EV Enabled'
      }
    ]
  },

  // 7. WFH Tranquility
  {
    id: 'mq_wfh_tranquility',
    topicId: 'wfh-tranquility',
    category: 'Noise & Environment',
    title: 'How peaceful and quiet is the society for work-from-home focus and video call tranquility?',
    description: 'Evaluates WFH call peace, neighbor wall sound leakage, footstep/TV noise transfer, and daytime echo.',
    iconName: 'VolumeX',
    badge: 'WFH & Peace',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Tenant'
      },
      {
        id: 'wfhMode',
        label: 'Work From Home Routine',
        inputType: 'select',
        options: ['Full-Time WFH', 'Hybrid WFH (2-3 Days)', 'Office Going'],
        defaultValue: 'Full-Time WFH'
      },
      {
        id: 'flatFacing',
        label: 'Balcony Facing Orientation',
        inputType: 'select',
        options: ['Facing Internal Podium / Garden', 'Facing Main Road', 'Facing Courtyard', 'Facing Adjacent Wing'],
        defaultValue: 'Facing Internal Podium / Garden'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Tenant';
      const wfh = bg.wfhMode || 'Full-Time WFH';
      const facing = bg.flatFacing || 'Podium facing';
      return `${resType.toLowerCase()} doing ${wfh.toLowerCase()} in a ${facing.toLowerCase()} flat.`;
    },
    followUpQuestions: [
      {
        id: 'wt_mq_1',
        questionText: 'Can you comfortably conduct remote work video calls without background noise disruption?',
        inputType: 'radio',
        options: [
          '100% Pin-Drop Quiet for Video Calls All Day',
          'Good Focus (Minor Acceptable Daytime Activity)',
          'Requires Noise-Canceling Headphones due to Echo/Noise',
          'Difficult WFH Environment due to Frequent Distractions'
        ]
      },
      {
        id: 'wt_mq_2',
        questionText: 'Is neighbor wall or ceiling sound insulation good (TV noise, heavy footsteps, talking)?',
        inputType: 'radio',
        options: [
          'Thick Wall Construction (Zero Sound Leakage)',
          'Normal Insulation (Voices unheard, minor door thuds)',
          'Thin Shared Walls (Neighbor TV / Music audible in bedroom)',
          'Poor Soundproofing (Overhead footsteps & furniture dragging loud)'
        ]
      },
      {
        id: 'wt_mq_3',
        questionText: 'Does daytime children shouting in internal courtyards or podiums echo loudly inside flats?',
        inputType: 'radio',
        options: [
          'Zero Echo / Very Well Shielded',
          'Minor Evening Play Noise (Pleasant Community Feel)',
          'Loud Daytime Echo in Courtyard-Facing Flats',
          'Constant Screaming & Ball Bouncing Noise'
        ]
      },
      {
        id: 'wt_mq_4',
        questionText: 'Rate overall acoustic quietness and WFH tranquility inside the flat (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Extremely Loud & Distracting, 5 = Serene, Quiet & Work-Friendly'
      }
    ]
  },

  // 8. Traffic & Party Noise
  {
    id: 'mq_traffic_party_noise',
    topicId: 'traffic-party-noise',
    category: 'Noise & Environment',
    title: 'How severe is main road traffic horn noise and weekend clubhouse party disturbance?',
    description: 'Examines road vehicle horn noise, weekend party music, late-night noise enforcement, and construction dust.',
    iconName: 'Volume2',
    badge: 'Acoustic Peace',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'flatFacing',
        label: 'Balcony Facing Orientation',
        inputType: 'select',
        options: ['Facing Main Road / Highway', 'Facing Internal Garden', 'Facing Courtyard', 'Facing Side Street'],
        defaultValue: 'Facing Main Road / Highway'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const facing = bg.flatFacing || 'Road facing';
      return `${resType.toLowerCase()} living in a ${facing.toLowerCase()} apartment.`;
    },
    followUpQuestions: [
      {
        id: 'tp_mq_1',
        questionText: 'How disturbing is main road traffic, heavy truck rumble, or vehicle horn noise on balcony doors?',
        inputType: 'radio',
        options: [
          'Zero Road Noise (Deep Inside Landlord Township)',
          'Mild Far-away Traffic Hum (Easily Ignored)',
          'Noticeable Traffic Horn Noise during Rush Hours',
          'Severe Constant Traffic Noise & Horn Honking Day and Night'
        ]
      },
      {
        id: 'tp_mq_2',
        questionText: 'Are weekend clubhouse events, lawn celebrations, or pool parties excessively loud at night?',
        inputType: 'radio',
        options: [
          'Quiet Events (Well Soundproofed Hall)',
          'Moderate Event Activity (Concludes Early)',
          'Loud Party Music on Balconies / Poolside on Weekends',
          'Frequent Late-Night Loud Music Disturbance'
        ]
      },
      {
        id: 'tp_mq_3',
        questionText: 'How strictly is the 10:00 PM late-night music & party cutoff enforced by security guards?',
        inputType: 'radio',
        options: [
          'Strict 10:00 PM Cutoff Enforced Promptly',
          'Events End By 10:30 PM peacefully',
          'Lax Enforcement (Parties Continue Till Midnight)',
          'Frequent Late-Night Resident Arguments over Noise'
        ]
      },
      {
        id: 'tp_mq_4',
        questionText: 'Rate freedom from external traffic and party noise disruption (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Constant High Noise & Horns, 5 = Peaceful, Quiet & Restful'
      }
    ]
  },

  // 9. Power Cut Frequency
  {
    id: 'mq_power_cuts',
    topicId: 'power-cuts',
    category: 'Electricity & Power',
    title: 'How stable is the state DISCOM grid power supply and how frequent are unscheduled outages?',
    description: 'Covers locality power cut frequency, voltage spike risks, summer grid trips, and scheduled maintenance.',
    iconName: 'ZapOff',
    badge: 'Grid Reliability',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '3 - 5 years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '3-5 years';
      return `${years} ${resType.toLowerCase()} experiencing local electricity grid behavior.`;
    },
    followUpQuestions: [
      {
        id: 'pc_mq_1',
        questionText: 'How frequently do unscheduled electricity grid power cuts happen in this locality?',
        inputType: 'radio',
        options: [
          'Zero Power Cuts (Top-Tier Metro City Grid)',
          'Rare Outages (1-2 Short Cuts per Month)',
          'Weekly Outages (Common during Summer / Rains)',
          'Daily Frequent Power Cuts (Multiple Outages Daily)'
        ]
      },
      {
        id: 'pc_mq_2',
        questionText: 'Are voltage fluctuations or voltage spikes common, threatening TV and AC compressor safety?',
        inputType: 'radio',
        options: [
          '100% Stable Voltage (No Stabilizer Needed)',
          'Minor Safe Fluctuations',
          'Frequent Low Voltage in Peak Summer',
          'Dangerous Voltage Spikes (Stabilizers Essential)'
        ]
      },
      {
        id: 'pc_mq_3',
        questionText: 'Are scheduled power maintenance outages announced in advance via SMS or Mobile App?',
        inputType: 'radio',
        options: [
          'Prior SMS & Mobile App Alerts Sent 24 Hours Ahead',
          'Notified on Resident WhatsApp Group',
          'Rarely Announced in Advance',
          'No Notification System Active'
        ]
      },
      {
        id: 'pc_mq_4',
        questionText: 'Rate overall state grid power reliability and stability (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Unreliable & High Outages, 5 = Uninterrupted Premium City Grid'
      }
    ]
  },

  // 10. Generator Backup
  {
    id: 'mq_generator_backup',
    topicId: 'generator-backup',
    category: 'Electricity & Power',
    title: 'How fast is generator switchover speed and does DG backup cover air conditioners inside flats?',
    description: 'Evaluates in-flat DG backup coverage for ACs vs basic lights, auto-switchover speed, and diesel costs.',
    iconName: 'BatteryCharging',
    badge: 'Power Backup',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'acSetup',
        label: 'In-Flat AC Setup',
        inputType: 'select',
        options: ['Multiple Split ACs', 'Centralized AC', '1 AC + Fans', 'Fans & Basic Appliances'],
        defaultValue: 'Multiple Split ACs'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const ac = bg.acSetup || 'Multiple Split ACs';
      return `${resType.toLowerCase()} running ${ac.toLowerCase()} during power outages.`;
    },
    followUpQuestions: [
      {
        id: 'gb_mq_1',
        questionText: 'What level of electrical appliances does the society generator backup support inside flats during power cuts?',
        inputType: 'radio',
        options: [
          'Full Flat Backup (Includes All ACs, Geysers & Heavy Appliances)',
          'Partial Backup (1 AC + Lights + Fans + Wi-Fi)',
          'Basic Backup (Lights + Fans + Wi-Fi Only)',
          'Common Areas & Lifts Only (No In-Flat DG Backup)'
        ]
      },
      {
        id: 'gb_mq_2',
        questionText: 'How fast does the automated generator turn on after a main grid failure?',
        inputType: 'radio',
        options: [
          'Instant Auto-Switchover (Under 10 Seconds)',
          'Quick Switchover (10 to 30 Seconds)',
          'Slow Switchover (1 to 3 Minutes)',
          'Manual Generator Start (Takes 5+ Minutes)'
        ]
      },
      {
        id: 'gb_mq_3',
        questionText: 'Are monthly diesel generator fuel usage charges billed separately or included in maintenance?',
        inputType: 'radio',
        options: [
          'Included in Standard Monthly Maintenance Dues',
          'Itemized Pro-Rata Generator Meter Billing',
          'Heavy Separate Diesel Surcharge Billed in Summer',
          'Unclear / Variable Generator Surcharge'
        ]
      },
      {
        id: 'gb_mq_4',
        questionText: 'Rate overall generator backup speed and in-flat power coverage (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Slow / Zero Flat Backup, 5 = Seamless 100% Heavy Appliance Backup'
      }
    ]
  },

  // 11. Lift Waiting Times
  {
    id: 'mq_lift_waiting_times',
    topicId: 'lift-waiting-times',
    category: 'Elevators & High-Rise',
    title: 'How long is elevator waiting time during morning peak school/office rush hours?',
    description: 'Evaluates morning rush queues (8-9:30 AM), high floor wait times, ground lobby bottlenecks, and lift speed.',
    iconName: 'Clock',
    badge: 'High-Rise Convenience',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Tenant'
      },
      {
        id: 'floorLevel',
        label: 'Flat Floor Level',
        inputType: 'select',
        options: ['Floor 1 - 10', 'Floor 11 - 20', 'Floor 21 - 30', 'Floor 31+'],
        defaultValue: 'Floor 11 - 20'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Tenant';
      const floor = bg.floorLevel || 'Floor 11-20';
      return `${resType.toLowerCase()} taking lifts daily from ${floor.toLowerCase()}.`;
    },
    followUpQuestions: [
      {
        id: 'lw_mq_1',
        questionText: 'What is your average morning peak elevator wait time (8:00 AM - 9:30 AM)?',
        inputType: 'radio',
        options: [
          'Fast (Under 2 Minutes Wait)',
          'Normal Wait (2 to 4 Minutes)',
          'Long Wait (5 to 8 Minutes on High Floors)',
          'Severe Elevator Bottleneck (10+ Minutes Wait & Full Lifts)'
        ]
      },
      {
        id: 'lw_mq_2',
        questionText: 'Do long queues form in the ground floor lobby during morning school bus & office rush?',
        inputType: 'radio',
        options: [
          'Zero Queues (Smart Destination Dispatch Allocates Lifts Well)',
          'Short Orderly Queue (Clears Rapidly)',
          'Noticeable Lobby Crowding at 8:00 AM',
          'Frustrating Chaos & Overcrowded Elevator Cabs'
        ]
      },
      {
        id: 'lw_mq_3',
        questionText: 'Are the elevators high-speed and smooth for tall towers (20+ floors)?',
        inputType: 'radio',
        options: [
          'High-Speed Modern Elevators (Under 30 Secs to Top Floor)',
          'Good Standard Speed Elevators',
          'Slow Elevator Motion (Noticeably Long Transit Time)',
          'Frequent Jerks / Mechanical Vibration in Lift Cab'
        ]
      },
      {
        id: 'lw_mq_4',
        questionText: 'Rate overall elevator waiting speed and morning peak hour efficiency (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Severe Waiting Bottleneck, 5 = Ultra-Fast & Effortless Elevator Service'
      }
    ]
  },

  // 12. Lift Breakdown Speed
  {
    id: 'mq_lift_breakdown_speed',
    topicId: 'lift-breakdown-speed',
    category: 'Elevators & High-Rise',
    title: 'How frequently do elevators break down and how fast does the AMC engineer repair them?',
    description: 'Assesses breakdown frequency, lift company repair turnaround time, service lift availability, and ARD safety.',
    iconName: 'Wrench',
    badge: 'Lift Maintenance',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      return `${resType.toLowerCase()} monitoring high-rise elevator reliability.`;
    },
    followUpQuestions: [
      {
        id: 'lb_mq_1',
        questionText: 'How often does an elevator break down or get shut down for maintenance per month?',
        inputType: 'radio',
        options: [
          'Rare / Zero Breakdowns (High Brand Quality like Otis/Schindler/KONE)',
          'Occasional Minor Breakdown (1-2 Times a Year)',
          'Monthly Breakdown (At least one lift out of service frequently)',
          'Frequent Recurrent Elevator Failures (Multiple lifts shut down)'
        ]
      },
      {
        id: 'lb_mq_2',
        questionText: 'When a lift breaks down, how quickly is the OEM lift company technician on-site to fix it?',
        inputType: 'radio',
        options: [
          'Repaired Within 2-4 Hours (Active Full AMC Response)',
          'Repaired Same Day',
          'Takes 2-3 Days due to Spare Part Procurement Delays',
          'Lifts Remain Out of Service for Weeks'
        ]
      },
      {
        id: 'lb_mq_3',
        questionText: 'Is a dedicated, padded service elevator available for furniture movers & interior renovation material?',
        inputType: 'radio',
        options: [
          'Dedicated Large Service Lift Reserved for Shifting',
          'Service Lift Shared with Normal Passenger Duty',
          'No Dedicated Service Lift (Passenger Lifts Used for Furniture)',
          'Strict Shifting Time Slot Restrictions Enforced'
        ]
      },
      {
        id: 'lb_mq_4',
        questionText: 'Rate overall elevator reliability, safety inspection, and repair response speed (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Frequent Breakdowns & Neglected, 5 = Reliable, Safe & Prompt AMC Repair'
      }
    ]
  },

  // 13. Quick Commerce & Deliveries
  {
    id: 'mq_doorstep_deliveries',
    topicId: 'doorstep-deliveries',
    category: 'Daily Convenience',
    title: 'How smoothly do Blinkit, Zepto, Swiggy, cabs, and couriers enter the gate to your doorstep?',
    description: 'Covers 10-min grocery delivery, food rider gate delays, tower lobby cab pickups, and parcel drop desks.',
    iconName: 'Package',
    badge: 'Doorstep Convenience',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Tenant'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '1 - 3 years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Tenant';
      return `${resType.toLowerCase()} ordering daily quick-commerce deliveries and cabs.`;
    },
    followUpQuestions: [
      {
        id: 'dd_mq_1',
        questionText: 'Do quick-commerce apps (Blinkit, Zepto, Instamart) deliver right to your flat doorstep in 10-15 minutes?',
        inputType: 'radio',
        options: [
          'Fast Doorstep Flat Delivery (10-15 Mins Guaranteed)',
          'Delivered to Tower Lobby Drop Desk (Flat pickup required)',
          'Must Collect at Main Gate Entrance Security Desk',
          'Out-of-Service Zone / Slow Unreliable Delivery'
        ]
      },
      {
        id: 'dd_mq_2',
        questionText: 'Do Swiggy/Zomato food delivery riders face long security gate verification delays?',
        inputType: 'radio',
        options: [
          'Seamless Digital Pass Gate Approval (Fast Entry)',
          'Quick Gate Entry with Phone Call Verification',
          'Riders Held at Gate for 5-10 Minutes by Security',
          'Riders Refuse to Enter / Ask Resident to Come to Gate'
        ]
      },
      {
        id: 'dd_mq_3',
        questionText: 'Are Uber / Ola cab drivers willing to enter internal tower driveways right up to the lobby?',
        inputType: 'radio',
        options: [
          'Cabs Drive Right to Tower Lobby Doorstep',
          'Cabs Enter Gate with Pass Approval',
          'Drivers Frequently Cancel / Ask Resident to Walk to Gate',
          'High Cab Cancellation Rate near Society Gate'
        ]
      },
      {
        id: 'dd_mq_4',
        questionText: 'Rate overall daily delivery convenience and doorstep accessibility (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Restricted & Frustrating Gate Bottlenecks, 5 = Effortless Doorstep Delivery'
      }
    ]
  },

  // 14. Maid Availability
  {
    id: 'mq_maid_availability',
    topicId: 'maid-availability',
    category: 'Daily Convenience',
    title: 'How easy is it to hire verified domestic maids, cooks, and daily car washers in the society?',
    description: 'Examines ease of finding verified maids, cook availability, maid union fixed rate cards, and car washers.',
    iconName: 'UserCheck',
    badge: 'Domestic Help',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'domesticHelp',
        label: 'Help Employed',
        inputType: 'select',
        options: ['Maid & Cook', 'Maid Only', 'Car Washer Only', 'Self-Managed'],
        defaultValue: 'Maid & Cook'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const help = bg.domesticHelp || 'Maid & Cook';
      return `${resType.toLowerCase()} employing ${help.toLowerCase()}.`;
    },
    followUpQuestions: [
      {
        id: 'ma_mq_1',
        questionText: 'Is it easy to find reliable, background-checked maids and cooks in the society?',
        inputType: 'radio',
        options: [
          'Very Easy (Abundant Experienced Maids Available)',
          'Moderate Ease (Takes 1-2 Weeks via Society Contacts)',
          'Difficult (High Scarcity / Frequent Maid Turnover)',
          'Strict External Maid Agency Requirements'
        ]
      },
      {
        id: 'ma_mq_2',
        questionText: 'Are maid monthly salary rates standardized by a society maid union or open market rates?',
        inputType: 'radio',
        options: [
          'Reasonable Market Rates (Flexible Direct Negotiation)',
          'Standard Fixed Society Rate Card Enforced',
          'Strict Local Union Controls High Monthly Rates',
          'High Maid Salary Demands compared to Neighborhood'
        ]
      },
      {
        id: 'ma_mq_3',
        questionText: 'Are dedicated daily car washing staff available for basement parking slots?',
        inputType: 'radio',
        options: [
          'Organized Car Washer Staff Active in Basement',
          'Individual Car Washers Available on Request',
          'Difficult to Find Car Washers for Basement',
          'Car Washing Prohibited inside Basement Slots'
        ]
      },
      {
        id: 'ma_mq_4',
        questionText: 'Rate overall availability, reliability, and cost fairness of domestic help (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Scarcity & High Union Rates, 5 = Abundant, Verified & Reasonable Rates'
      }
    ]
  },

  // 15. Monsoon Gate Flooding
  {
    id: 'mq_monsoon_gate_flooding',
    topicId: 'monsoon-gate-flooding',
    category: 'Monsoon Realities',
    title: 'Does the society main entrance gate or access road flood during heavy monsoon downpours?',
    description: 'Evaluates entrance waterlogging, stormwater drainage clearance speed, delivery disruption, and cab access.',
    iconName: 'CloudRain',
    badge: 'Monsoon Flooding',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '5+ years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '5+ years';
      return `${years} ${resType.toLowerCase()} who experienced multiple heavy monsoons.`;
    },
    followUpQuestions: [
      {
        id: 'mg_mq_1',
        questionText: 'Does the road outside the main gate experience severe waterlogging during heavy rainstorms?',
        inputType: 'radio',
        options: [
          'Zero Waterlogging (High Elevation & Excellent Storm Drains)',
          'Temporary Puddles (Clears Within 30 Minutes of Rain Stop)',
          'Knee-Deep Waterlogging Outside Gate for Hours',
          'Severe Gate Flooding (Completely Blocks Vehicle Entry)'
        ]
      },
      {
        id: 'mg_mq_2',
        questionText: 'How quickly do society stormwater drains flush rainwater away from internal driveways?',
        inputType: 'radio',
        options: [
          'Instant Drainage (Driveways Remain Dry)',
          'Drains Smoothly within 15-20 Mins',
          'Slow Drainage (Driveway Puddles Remain for Hours)',
          'Drain Overflow onto Podium / Driveway'
        ]
      },
      {
        id: 'mg_mq_3',
        questionText: 'Are cabs, Swiggy, and Blinkit services disrupted near the gate on heavy rain days?',
        inputType: 'radio',
        options: [
          'Uninterrupted Delivery & Cab Service Year-Round',
          'Minor Surge Delays during Peak Downpour',
          'Cabs & Deliveries Stop Coming to Gate on Heavy Rain Days',
          'Total Access Blockade during Heavy Rain'
        ]
      },
      {
        id: 'mg_mq_4',
        questionText: 'Rate overall entrance drainage and monsoon road flood resilience (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Flooding Hazard & Blocked Road, 5 = Dry, Weatherproof & Resilient Road Access'
      }
    ]
  },

  // 16. Monsoon Seepage
  {
    id: 'mq_monsoon_seepage',
    topicId: 'monsoon-seepage',
    category: 'Monsoon Realities',
    title: 'Are basement parking levels prone to water accumulation or flat walls prone to dampness seepage?',
    description: 'Examines basement sump pump reliability, flat wall seepage, ceiling drips, and exterior waterproofing.',
    iconName: 'ShieldAlert',
    badge: 'Monsoon Seepage',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'basementLevel',
        label: 'Basement Level',
        inputType: 'select',
        options: ['Basement 1 (B1)', 'Basement 2 (B2)', 'Basement 3 (B3)', 'Ground / Podium'],
        defaultValue: 'Basement 2 (B2)'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const bmt = bg.basementLevel || 'B2 Basement';
      return `${resType.toLowerCase()} parking in ${bmt.toLowerCase()} during monsoons.`;
    },
    followUpQuestions: [
      {
        id: 'ms_mq_1',
        questionText: 'Do basement parking floors experience water leakage or sump pump failures during heavy rains?',
        inputType: 'radio',
        options: [
          'Dry Basements (24x7 Automated Sump Pumps Active)',
          'Minor Water Seepage near Retaining Walls (Managed Well)',
          'Water Accumulation in Lowest Basement Level',
          'Severe Basement Inundation Risk / Vehicle Safety Hazard'
        ]
      },
      {
        id: 'ms_mq_2',
        questionText: 'Do water leaks or wall dampness appear inside flat walls or balconies during heavy monsoons?',
        inputType: 'radio',
        options: [
          'Zero Wall Seepage (High-Quality Exterior Facade Waterproofing)',
          'Minor Cosmetic Dampness near Window Slits',
          'Wall Seepage in Outer Balcony / Bedroom Walls',
          'Frequent Ceiling Dripping & Severe Wall Seepage Issues'
        ]
      },
      {
        id: 'ms_mq_3',
        questionText: 'Are elevator pits protected from basement water leakage during peak monsoon storms?',
        inputType: 'radio',
        options: [
          'Dry Elevator Pits (Zero Rain Disruption)',
          'Minor Water Seepage Managed by Maintenance',
          'Lifts Frequently Shut Down Due to Pit Water Accumulation',
          'Recurrent Elevator Damage from Rain Water Seepage'
        ]
      },
      {
        id: 'ms_mq_4',
        questionText: 'Rate overall building waterproofing and basement flood protection (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Poor Waterproofing & Dampness, 5 = 100% Dry, Seepage-Free Construction'
      }
    ]
  },

  // 17. Committee Fairness
  {
    id: 'mq_committee_fairness',
    topicId: 'committee-fairness',
    category: 'Society Governance',
    title: 'How fair, unbiased, and cooperative is the managing committee regarding rules, fines, and tenant rights?',
    description: 'Covers owner vs tenant equality, arbitrary fine enforcement, committee responsiveness, and AGM audit transparency.',
    iconName: 'Scale',
    badge: 'Governance Check',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '5+ years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '5+ years';
      return `${years} ${resType.toLowerCase()} interacting with society governance.`;
    },
    followUpQuestions: [
      {
        id: 'cf_mq_1',
        questionText: 'Are society bylaws and amenity access rules applied equally to both owners and tenants?',
        inputType: 'radio',
        options: [
          '100% Fair & Equal Treatment for Owners & Tenants',
          'Generally Fair with Clear Published Bylaws',
          'Noticeable Bias / Restrictions on Tenants',
          'Strict Discriminatory Restrictions on Tenants'
        ]
      },
      {
        id: 'cf_mq_2',
        questionText: 'Does the managing committee levy arbitrary or harassing monetary fines for minor issues?',
        inputType: 'radio',
        options: [
          'No Arbitrary Fines (Clear Warnings Issued First)',
          'Fair Enforcement of Published Penalties',
          'Frequent Harsh Fines for Minor Gate / Parking Violations',
          'Hostile Governance & Heavy Arbitrary Fines'
        ]
      },
      {
        id: 'cf_mq_3',
        questionText: 'Are annual financial statements, maintenance budgets, and AGM audit accounts published transparently?',
        inputType: 'radio',
        options: [
          'Transparent Audited Accounts Published Promptly on App',
          'Accounts Shared Annually before AGM',
          'Delayed Financial Audits / Hard to Access Reports',
          'Opaque Financial Management'
        ]
      },
      {
        id: 'cf_mq_4',
        questionText: 'Rate overall managing committee fairness, transparency, and resident helpfulness (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Hostile, Arbitrary & Opaque, 5 = Fair, Transparent & Progressive'
      }
    ]
  },

  // 18. Renovation & Move-In NOC
  {
    id: 'mq_renovation_movein_noc',
    topicId: 'renovation-movein-noc',
    category: 'Society Governance',
    title: 'How fast and hassle-free is getting interior renovation NOCs and move-in shifting approvals?',
    description: 'Evaluates renovation NOC turnaround time, move-in shifting fees, elevator padding rules, and deposit refunds.',
    iconName: 'FileCheck',
    badge: 'NOC & Shifting',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      return `${resType.toLowerCase()} who went through society NOC approval processes.`;
    },
    followUpQuestions: [
      {
        id: 'rm_mq_1',
        questionText: 'How fast does the managing committee issue flat interior renovation NOCs?',
        inputType: 'radio',
        options: [
          'Quick Approval Within 48 Hours via App / Office',
          'Approved Smoothly within 1 Week with Deposit',
          'Requires Multiple Follow-ups & Physical Signatures',
          'Strict Unreasonable Construction Hours & Slow Approvals'
        ]
      },
      {
        id: 'rm_mq_2',
        questionText: 'Is the tenant move-in NOC paperwork process or move-in shifting deposit refund smooth?',
        inputType: 'radio',
        options: [
          'Seamless Digital Move-in Approval & Quick Deposit Refund',
          'Standard Paperwork Completed smoothly',
          'High Non-Refundable Shifting Surcharge Billed',
          'Onerous Bureaucratic Delays for Tenant NOCs'
        ]
      },
      {
        id: 'rm_mq_3',
        questionText: 'Are shifting hours and elevator padding for furniture movement strictly managed?',
        inputType: 'radio',
        options: [
          'Well-Organized Padded Lift Reserved during Shifting Slot',
          'Managed Smoothly with Guard Supervision',
          'Tight Time Slot Restrictions (Fine levied if shifting runs late)',
          'No Assistance / Elevator Padding Neglected'
        ]
      },
      {
        id: 'rm_mq_4',
        questionText: 'Rate overall renovation NOC and move-in process ease (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Bureaucratic Nightmare, 5 = Fast, Digital & Effortless'
      }
    ]
  },

  // 19. Hidden Costs & Hikes
  {
    id: 'mq_hidden_charges_hikes',
    topicId: 'hidden-charges-hikes',
    category: 'Society Governance',
    title: 'Are there unexpected move-in charges, unannounced maintenance hikes, or separate amenity fees?',
    description: 'Examines unexpected move-in surcharges, annual maintenance fee hikes, separate gym/pool fees, and event levies.',
    iconName: 'Receipt',
    badge: 'Financial Clarity',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      return `${resType.toLowerCase()} paying monthly society maintenance dues.`;
    },
    followUpQuestions: [
      {
        id: 'hc_mq_1',
        questionText: 'Did you discover any unexpected non-refundable charges after moving in?',
        inputType: 'radio',
        options: [
          '100% Transparent (No Hidden Charges)',
          'Standard Refundable Security Deposit Only',
          'High Non-Refundable Move-in / Lift Padding Fee',
          'Multiple Surprise Transfer / Club Surcharges'
        ]
      },
      {
        id: 'hc_mq_2',
        questionText: 'What is the typical annual maintenance fee escalation percentage agreed at AGMs?',
        inputType: 'radio',
        options: [
          'Predictable 5% or Less Annual Inflation Hike',
          'Moderate 5% to 10% Annual Increase',
          'High Unpredictable Maintenance Fee Hikes (>10%)',
          'Frequent Special Ad-Hoc Capital Levies'
        ]
      },
      {
        id: 'hc_mq_3',
        questionText: 'Are clubhouse, gym, and swimming pool facilities included in monthly maintenance fees?',
        inputType: 'radio',
        options: [
          'All Major Amenities Included in Monthly Maintenance',
          'Nominal Annual Club Membership Fee',
          'Separate Monthly Fee Billed per User',
          'High Commercial Rates for Amenity Usage'
        ]
      },
      {
        id: 'hc_mq_4',
        questionText: 'Rate overall fee transparency and financial predictability (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Frequent Surprise Costs, 5 = 100% Predictable & Transparent'
      }
    ]
  },

  // 20. Child Safety & Play Area
  {
    id: 'mq_child_safety_play',
    topicId: 'child-safety-play',
    category: 'Family & Community',
    title: 'Is the society safe, vehicle-controlled, and equipped with clean, well-maintained play zones for kids?',
    description: 'Evaluates vehicle speed limits in driveways/podiums, play equipment condition, rubberized flooring, and CCTV safety.',
    iconName: 'Baby',
    badge: 'Family & Safety',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'familyProfile',
        label: 'Family Profile',
        inputType: 'select',
        options: ['Family with Young Kids', 'Family with Teenagers', 'Couple Without Kids', 'Senior Citizens'],
        defaultValue: 'Family with Young Kids'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const fam = bg.familyProfile || 'Family with Young Kids';
      return `${resType.toLowerCase()} in a ${fam.toLowerCase()} using play areas.`;
    },
    followUpQuestions: [
      {
        id: 'cs_mq_1',
        questionText: 'How strictly is vehicle speed controlled inside internal driveways near children play areas?',
        inputType: 'radio',
        options: [
          'Strict 10 km/h Speed Limit & Vehicle-Free Vehicle Podium Zone',
          'Slow Vehicle Speeds Monitored by Security Guards',
          'Lax Control (Vehicles Move Fast near Play Areas)',
          'Dangerous Speeding Risk in Internal Driveways'
        ]
      },
      {
        id: 'cs_mq_2',
        questionText: 'Is the children play equipment well-maintained with rubberized safety flooring?',
        inputType: 'radio',
        options: [
          'Spotless & High-Quality Play Equipment with Soft Rubber Flooring',
          'Well-Maintained Standard Play Area',
          'Aging Equipment with Occasional Maintenance Delays',
          'Neglected Broken Swings / Hard Surface Hazard'
        ]
      },
      {
        id: 'cs_mq_3',
        questionText: 'Are play zones and common garden corridors monitored by 24x7 active CCTV cameras?',
        inputType: 'radio',
        options: [
          '100% Comprehensive CCTV Monitoring Across All Play Zones',
          'Adequate CCTV Coverage Active',
          'Blind Spots in Play Areas',
          'Inoperative / Sparse CCTV Cameras'
        ]
      },
      {
        id: 'cs_mq_4',
        questionText: 'Rate overall child safety and play area maintenance quality (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Unsafe & Neglected, 5 = Exceptionally Safe & Top-Tier Play Facilities'
      }
    ]
  },

  // 21. Pet Rules
  {
    id: 'mq_pet_rules',
    topicId: 'pet-rules',
    category: 'Family & Community',
    title: 'How welcoming is the community towards pet owners and how clear are pet walking guidelines?',
    description: 'Assesses pet welcoming attitude, designated walking track rules, elevator restrictions, and pet dispute frequency.',
    iconName: 'HeartHandshake',
    badge: 'Pet Living',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      return `${resType.toLowerCase()} observing society pet community environment.`;
    },
    followUpQuestions: [
      {
        id: 'pr_mq_1',
        questionText: 'How welcoming and pet-friendly is the society resident attitude overall?',
        inputType: 'radio',
        options: [
          '100% Pet-Friendly & Welcoming Atmosphere',
          'Friendly with Clear Published Walking Guidelines',
          'Noticeable Resident Friction towards Pet Owners',
          'Hostile Attitude & Heavy Restrictions'
        ]
      },
      {
        id: 'pr_mq_2',
        questionText: 'Are designated pet walking tracks or pet defecation cleanup rules enforced?',
        inputType: 'radio',
        options: [
          'Dedicated Clean Pet Walking Track Available',
          'Clear Poop Scoop Guidelines Followed Responsibly',
          'Unclear Guidelines leading to Poop Hygiene Friction',
          'Strict Bans on Pets in Common Gardens'
        ]
      },
      {
        id: 'pr_mq_3',
        questionText: 'Are pets allowed in main elevator cabs or restricted to service lifts?',
        inputType: 'radio',
        options: [
          'Pets Allowed in All Elevators Courteously',
          'Service Lift Designated for Pets during Peak Hours',
          'Strict Elevator Restrictions for Pets',
          'Frequent Arguments over Pets in Elevators'
        ]
      },
      {
        id: 'pr_mq_4',
        questionText: 'Rate overall pet friendliness and community harmony (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Hostile & Restrictive, 5 = Exceptionally Pet-Friendly & Harmonious'
      }
    ]
  },

  // 22. Insider Truths
  {
    id: 'mq_insider_truths',
    topicId: 'insider-truths',
    category: 'Living Experience',
    title: 'What are the unvarnished insider truths and trade-offs you wish you knew before moving in?',
    description: 'Captures first-hand retrospective wisdom: broker myths vs reality, unvarnished trade-offs, and buy/rent again sentiment.',
    iconName: 'Sparkles',
    badge: 'Unvarnished Wisdom',
    backgroundFields: [
      {
        id: 'residentType',
        label: 'Resident Type',
        inputType: 'radio',
        options: ['Owner', 'Tenant'],
        defaultValue: 'Owner'
      },
      {
        id: 'yearsLiving',
        label: 'Tenure of Stay',
        inputType: 'select',
        options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
        defaultValue: '5+ years'
      }
    ],
    generateRelevantExperience: (bg) => {
      const resType = bg.residentType || 'Owner';
      const years = bg.yearsLiving || '5+ years';
      return `${years} ${resType.toLowerCase()} sharing long-term unvarnished living retrospective experience.`;
    },
    followUpQuestions: [
      {
        id: 'it_mq_1',
        questionText: 'Looking back at your total living experience, would you buy or rent in this society again without hesitation?',
        inputType: 'radio',
        options: [
          '100% Would Buy / Rent Here Again Without Hesitation',
          'Satisfied Overall (Minor Acceptable Trade-Offs)',
          'Neutral Sentiment (Meets Basic Functional Expectations)',
          'Would Look for Alternative Better Societies in locality'
        ]
      },
      {
        id: 'it_mq_2',
        questionText: 'What is the biggest surprise or trade-off that brokers or builders never tell prospective buyers?',
        inputType: 'checkbox',
        options: [
          'Peak morning lift waiting queues',
          'Summer water pressure drops on high floors',
          'Main road traffic noise on lower floors',
          'Tight parking slot alignment',
          'Strict committee NOC rules for tenants'
        ]
      },
      {
        id: 'it_mq_3',
        questionText: 'Which positive aspects make living in this society genuinely worthwhile?',
        inputType: 'checkbox',
        options: [
          'Excellent highway & metro connectivity',
          '24x7 reliable power backup and water',
          'Clean, spotless society grounds & gardens',
          'Friendly, helpful neighbor community',
          'High rental demand and steady resale value'
        ]
      },
      {
        id: 'it_mq_4',
        questionText: 'Overall Recommendation Score for Prospective Buyers / Tenants (1 to 5):',
        inputType: 'rating',
        helpText: '1 = Do Not Recommend, 5 = Highly Recommended Top-Choice Society'
      }
    ]
  }
];

// STRUCTURED QUESTIONS DATABASE (3-5 SPECIFIC STRUCTURED QUESTIONS PER FOCUSED BUNDLE)
export const STRUCTURED_QUESTIONS_DATABASE: Record<string, StructuredSubQuestion[]> = {
  'water-pressure': [
    {
      id: 'wp_peak_drop',
      topicId: 'water-pressure',
      mainQuestionText: 'How strong and consistent is the water pressure during peak morning hours across all floors?',
      questionText: 'Have you ever experienced weak water flow or shower pressure drops when everyone is getting ready in the morning?',
      type: 'single-choice',
      options: [
        'Constant Strong Flow (Zero Pressure Drop)',
        'Slight Acceptable Drop in Peak Rush',
        'Noticeable Low Pressure in Showers & Taps',
        'Severe Pressure Cut Every Morning'
      ],
      answers: [
        "I've rarely noticed any drop in water pressure during the morning rush. Whether I'm taking a shower or using the kitchen tap, the flow has stayed strong enough for everyday use. It hasn't been something I've had to plan around or worry about, even during the busiest part of the morning.",
        "Around the usual morning rush, I do notice the water pressure becoming slightly lower than normal, but it's never caused any major inconvenience. Showers and taps still work well enough for my daily routine, and the difference isn't significant enough to disrupt my morning.",
        "During busy morning hours, I've experienced the water pressure dropping enough to notice the difference. The shower doesn't feel as strong, and taps take a little longer to provide a steady flow. It still works, but I can usually tell when many people are using water at the same time.",
        "Mornings can sometimes be difficult because the water pressure drops so much that even taking a normal shower becomes inconvenient. I've had to wait for the pressure to improve on a few occasions before getting ready. It's one of the issues I've personally noticed while living here."
      ]
    },
    {
      id: 'wp_booster_pumps',
      topicId: 'water-pressure',
      mainQuestionText: 'How strong and consistent is the water pressure during peak morning hours across all floors?',
      questionText: 'If you live on an upper floor (10th floor+), do booster pumps maintain comfortable shower pressure without air locks?',
      type: 'single-choice',
      options: [
        'Booster Pumps Maintain Powerful Flow on All Floors',
        'Adequate Flow Maintained',
        'Upper Floors Have Weaker Pressure Than Lower Floors',
        'Frequent Air Locks in Pipes on Top Floors'
      ],
      answers: [
        "Living on a higher floor, I've found the water pressure comfortable for everyday use. Showers, bathroom taps and other water outlets have generally worked well without any noticeable interruptions or air locks. From my experience, the flow has been reliable enough that I don't even think about it during daily use.",
        "The water pressure in my flat has been good enough for normal day-to-day use. While it may not always feel extremely strong, I haven't had any real difficulty using the shower or taps. Overall, the flow has been reasonable and sufficient for my everyday morning routine.",
        "I've observed that the water flow in my flat feels somewhat weaker compared to what you'd expect. Everyday tasks are still manageable, but showers don't feel very strong and filling buckets takes a bit longer. It's something I've noticed regularly while going about my routine.",
        "There have been repeated instances where the water pressure suddenly becomes very weak, and occasionally sputtering air comes out of the taps before water flows smoothly again. It doesn't happen every single day, but it has happened often enough that I keep it in mind while living here."
      ]
    },
    {
      id: 'wp_multi_tap',
      topicId: 'water-pressure',
      mainQuestionText: 'How strong and consistent is the water pressure during peak morning hours across all floors?',
      questionText: 'Does shower water pressure drop if someone turns on a kitchen tap or washing machine inside the flat?',
      type: 'single-choice',
      options: [
        'Zero Drop (Strong Simultaneous Flow)',
        'Minor Acceptable Pressure Drop',
        'Noticeable Pressure Cut',
        'Severe Flow Reduction Across Taps'
      ],
      answers: [
        "In my experience, running the washing machine or kitchen sink while taking a shower doesn't cause any problem. The water flow stays steady across all taps inside the flat, so family members don't have to coordinate when using water at the same time.",
        "Most of the time, turning on another tap inside the flat causes only a slight, temporary dip in shower pressure. It's noticeable for a second, but it doesn't interrupt your shower or make the water stop flowing. It's quite manageable for daily living.",
        "Whenever someone turns on the kitchen tap or starts the washing machine while someone is showering, the shower pressure drops noticeably. We usually end up shouting across the flat or letting each other know before turning on another water outlet during showers.",
        "Using two taps simultaneously in the flat causes the water flow to drop down to a trickle. If the shower is running and a tap opens in the kitchen, the shower almost stops. We have to be careful and use water strictly one tap at a time."
      ]
    },
    {
      id: 'wp_satisfaction',
      topicId: 'water-pressure',
      mainQuestionText: 'How strong and consistent is the water pressure during peak morning hours across all floors?',
      questionText: 'Overall satisfaction rating with daily shower & tap water pressure (1 to 5):',
      type: 'rating',
      options: ['1 - Weak & Frustrating', '2 - Below Average', '3 - Acceptable', '4 - Good', '5 - Powerful & Flawless'],
      answers: [
        "Giving this a 1 star rating because I find the daily water pressure quite disappointing. The weak flow makes simple routines like taking a quick shower or washing utensils take longer than they should. It's a persistent annoyance that regularly affects everyday comfort inside the flat.",
        "I'd rate the water pressure at 2 stars as it feels below average. You can manage your basic daily chores, but shower pressure is often lukewarm and filling buckets takes time, especially during peak hours. It leaves room for improvement for a comfortable home experience.",
        "A 3 star rating fits well because the water pressure is fairly decent and functional for day-to-day living. It isn't super strong, but it isn't frustratingly weak either. It's just average enough to handle daily showers, dishwashing, and laundry without any major complaints.",
        "I would rate the water pressure 4 stars because the flow across taps and showers in my flat has been consistently good. The water pressure feels comfortably strong for daily showers and kitchen work, making everyday household routines hassle-free and dependable almost all the time.",
        "I'm happy to give a 5 star rating here because the water pressure has been excellent throughout. Showers feel refreshing with strong pressure, and every tap in the flat delivers a full, steady stream without any drops, even during busy morning hours."
      ]
    }
  ],

  'water-quality': [
    {
      id: 'wq_hardness_scaling',
      topicId: 'water-quality',
      mainQuestionText: 'Does the tap water quality cause scaling, plumbing corrosion, or unpleasant smells in daily life?',
      questionText: 'Have you noticed white scaling, ruined geyser elements, or corroded bathroom taps due to hard water?',
      type: 'single-choice',
      options: [
        'Zero Tap Scaling (Soft Supply)',
        'Mild Hardness (Easy to Clean)',
        'High Hardness (Causes White Stains & Tap Corrosion)',
        'Central Water Softener Active in Society'
      ],
      answers: [
        "So far, I haven't noticed any white hard water stains or scaling on bathroom taps and tiles. The tap water feels gentle on skin and hair, and appliances like geysers haven't needed frequent servicing for scale buildup. It's been very clean and easy to maintain.",
        "The water does carry a mild level of hardness, so you might see light white spots on chrome taps or glass partitions over time. However, these wipe off easily during weekly cleaning and haven't damaged bathroom fittings or heating elements in a major way.",
        "Hard water is definitely something you notice while living here. White mineral scaling accumulates quickly on shower heads, taps, and glass partitions. I've had to scrub bathroom fittings frequently, and tap finishes tend to lose their shine unless you wipe them down almost every single day.",
        "From what I've observed, the water quality inside the flat remains comfortable because the treated supply keeps hard water scaling well under control. Bathroom taps stay shiny, tiles don't build up heavy white crusts, and water heaters function smoothly without getting choked up by mineral deposits."
      ]
    },
    {
      id: 'wq_drinking_purifier',
      topicId: 'water-quality',
      mainQuestionText: 'Does the tap water quality cause scaling, plumbing corrosion, or unpleasant smells in daily life?',
      questionText: 'Can you safely drink municipal tap water with a standard purifier, or do you have to buy bottled 20L water cans?',
      type: 'single-choice',
      options: [
        'Safe Municipal Tap Water (RO/UV Suffices)',
        'Multi-Stage RO Essential due to High TDS',
        'Many Residents Buy 20L Water Cans for Drinking',
        'Unfit for Direct Tap Consumption'
      ],
      answers: [
        "For drinking water, we rely completely on a standard home water purifier fitted at the kitchen sink. The water tastes clean and normal, and we haven't needed to order 20-liter water cans or extra bottled water. It's convenient and works seamlessly for our daily cooking and drinking.",
        "A basic water filter might not be enough here, so we use a multi-stage RO purifier in the kitchen. Once purified through RO, the taste is good and safe for drinking. As long as you have a proper RO unit maintained regularly, you won't need to purchase bottled water.",
        "Many people I know in the building prefer ordering 20-liter drinking water cans instead of relying solely on tap water purifiers. The raw tap water can sometimes taste a bit heavy or metallic, so keeping a couple of water cans at home feels like a safer and better-tasting option.",
        "Direct tap water really isn't suitable for drinking here, even after simple filtering or boiling. The raw taste is quite off, so buying sealed 20-liter mineral water cans has become a necessary daily routine for drinking and cooking to ensure complete safety and peace of mind."
      ]
    },
    {
      id: 'wq_stp_flush',
      topicId: 'water-quality',
      mainQuestionText: 'Does the tap water quality cause scaling, plumbing corrosion, or unpleasant smells in daily life?',
      questionText: 'Have you ever noticed an unpleasant smell or yellowish tint from the toilet flush water (recycled STP water)?',
      type: 'single-choice',
      options: [
        'Clear & Odourless STP Water in Flush Lines',
        'Slight Odour on Hot Days',
        'Yellowish Tint & Noticeable Smell',
        'Fresh Water Used for Flushing (No STP)'
      ],
      answers: [
        "The toilet flush water has always been clean and completely odourless in my flat. Even though it's recycled water, it looks clear and doesn't leave any unpleasant smell or discoloration in the bathroom. It's been managed so well that you wouldn't notice any difference.",
        "On particularly hot summer days, I've occasionally noticed a faint damp smell from the flush water in the bathroom. It isn't overwhelming or foul, and keeping the bathroom window open or fan on handles it easily. Most of the year, it remains completely fine.",
        "One thing I've noticed is that the flush water sometimes comes with a pale yellowish tint and a distinct, stale odour. It can be uncomfortable when stepping into the bathroom, especially if the door has been closed for a while. You often need bathroom fresheners to keep it pleasant.",
        "Flush lines in our bathrooms use regular clean water, so we've never faced any problems with foul smells or discolored water in the toilet bowls. It stays clear and fresh, which helps keep the bathrooms clean and pleasant without needing constant ventilation or heavy air fresheners."
      ]
    },
    {
      id: 'wq_overall_rating',
      topicId: 'water-quality',
      mainQuestionText: 'Does the tap water quality cause scaling, plumbing corrosion, or unpleasant smells in daily life?',
      questionText: 'Overall rating of domestic water clarity, purity, and plumbing health (1 to 5):',
      type: 'rating',
      options: ['1 - Poor Quality & Scaling', '2 - Subpar', '3 - Moderate', '4 - Clean', '5 - Pure & Crystal Clear'],
      answers: [
        "I'd rate overall water quality at 1 star because of persistent issues with scaling and water clarity. Bathrooms require frequent cleaning to remove white marks, and you always feel cautious about tap water quality. It takes extra effort to maintain plumbing fittings in good condition.",
        "A 2 star rating feels accurate because the overall water quality stays somewhat below expectations. You can manage basic daily needs like washing and cleaning, but mild hardness and occasional clarity issues mean you have to be extra cautious with kitchen purifiers and bathroom fixtures.",
        "I would give this a 3 star rating because the domestic water quality is fairly average. It works well enough for routine bathing, washing clothes, and daily cleaning without causing major problems, though having a reliable kitchen water purifier is definitely recommended for drinking water.",
        "Rating this 4 stars because the tap water supply is clean, clear, and dependable. We haven't had issues with murky water or unpleasant odors, and bathroom fittings stay in good shape with simple weekly cleaning. It makes daily household routines feel comfortable and worry-free.",
        "I am happy to rate this 5 stars for water quality. The tap water looks crystal clear, feels clean, and has no foul smell or heavy scaling. From bathing to kitchen chores, the water supply has been consistently fresh and problem-free since day one."
      ]
    }
  ],

  'water-availability': [
    {
      id: 'wa_24x7_supply',
      topicId: 'water-availability',
      mainQuestionText: 'How reliable is the continuous 24x7 water supply, especially during peak summer months?',
      questionText: 'Do you get continuous 24x7 water at taps, or are you forced to store water due to fixed daily timing cuts?',
      type: 'single-choice',
      options: [
        '24x7 Uninterrupted Supply Year-Round',
        'Continuous Supply with Rare Maintenance Cuts',
        'Scheduled Daily Timings Enforced (6-8 Hours)',
        'Frequent Unscheduled Water Disruptions'
      ],
      answers: [
        "Water supply in my flat has been genuinely continuous 24 hours a day, 7 days a week. We've never had to store water in buckets or fill tanks in advance for daily routines. It's a huge relief not having to worry about fixed water timings or unexpected morning dry taps.",
        "For the most part, we enjoy round-the-clock water supply at all taps. On very rare occasions, there might be a short pause for tank cleaning or pipe maintenance, but notice is usually given beforehand. Day-to-day living feels very comfortable without water storage hassles.",
        "Water is released only during specific morning and evening hours rather than running all day. We've adapted by filling buckets and keeping water stored for afternoon use. While it takes a bit of planning around those scheduled timings, it becomes a predictable part of your routine.",
        "Dealing with water cuts can be frustrating here because the supply stops unexpectedly without prior warning. You often find taps running dry in the middle of the day, forcing us to keep stored water handy in the bathroom and kitchen at all times just in case."
      ]
    },
    {
      id: 'wa_summer_tankers',
      topicId: 'water-availability',
      mainQuestionText: 'How reliable is the continuous 24x7 water supply, especially during peak summer months?',
      questionText: 'During peak summer (April-June), does the society run dry and rely heavily on expensive private water tankers?',
      type: 'single-choice',
      options: [
        'Zero Tankers Needed (100% Municipal Supply)',
        'Occasional Tanker Supplement in May',
        'Heavy Tanker Dependency Daily in Summer',
        'Severe Summer Water Scarcity'
      ],
      answers: [
        "Even during the hottest summer months like May and June, water supply remains steady without needing private water tankers. The society's municipal connection handles the demand well, so we haven't faced summer water shortages or extra tanker maintenance surcharges on our monthly bills.",
        "During peak summer heat in May, the society occasionally brings in a few water tankers to supplement the main supply. You might notice a slight change in water pressure on those days, but taps never go completely dry and daily routines continue normally.",
        "Summers can get tricky because municipal water supply drops, making the society rely heavily on daily private water tankers. You'll see tanker trucks coming in regularly through April and May, which usually leads to extra maintenance charges added to our monthly society bills.",
        "Water scarcity during peak summer is a real challenge here. Taps frequently run low or dry during hot afternoon hours, and the society relies heavily on tankers every day. Managing water usage carefully during April and May becomes essential for everyone living in the complex."
      ]
    },
    {
      id: 'wa_pipeline_repairs',
      topicId: 'water-availability',
      mainQuestionText: 'How reliable is the continuous 24x7 water supply, especially during peak summer months?',
      questionText: 'How often do sudden main line pipe bursts leave your flat without water for hours unexpectedly?',
      type: 'single-choice',
      options: [
        'Zero Shutdowns (Flawless Plumbing Infrastructure)',
        'Rare Shutdown (1-2 Times a Year)',
        'Monthly Pipeline Repair Outages',
        'Frequent Sudden Outages Without Notice'
      ],
      answers: [
        'Plumbing infrastructure is robust; zero unexpected pipeline shutdowns occur.',
        'Pipeline breakdowns are rare, occurring only once or twice a year with advance warning.',
        'Main line pipe repairs cause water shutdowns almost every month.',
        'Sudden, unannounced water supply shutdowns happen frequently due to aging pipes.'
      ]
    },
    {
      id: 'wa_overall_rating',
      topicId: 'water-availability',
      mainQuestionText: 'How reliable is the continuous 24x7 water supply, especially during peak summer months?',
      questionText: 'Overall rating of 24x7 water supply reliability and summer peace of mind (1 to 5):',
      type: 'rating',
      options: ['1 - Severe Scarcity', '2 - Poor', '3 - Adequate', '4 - Reliable', '5 - 100% Continuous & Abundant'],
      answers: [
        'Rating 1/5: Severe water scarcity causing significant lifestyle disruption.',
        'Rating 2/5: Unreliable water supply requiring active storage planning.',
        'Rating 3/5: Adequate water availability meeting basic daily needs.',
        'Rating 4/5: Highly reliable water supply with peace of mind year-round.',
        'Rating 5/5: 100% continuous, abundant water supply without any scarcity.'
      ]
    }
  ],

  'parking-usability': [
    {
      id: 'pu_dimensions',
      topicId: 'parking-usability',
      mainQuestionText: 'How spacious, accessible, and hassle-free is your assigned parking space?',
      questionText: 'Is your allotted parking slot wide enough to easily park and get out of your car without scraping pillars or walls?',
      type: 'single-choice',
      options: [
        'Spacious & Easy Clearance',
        'Tight Alignment (Pillars require careful reversing)',
        'Dependent / Stack / Puzzle Slot Awkwardness',
        'Awkward Angle / Scratches Common'
      ],
      answers: [
        'Parking slot is broad and open, allowing easy door opening and effortless maneuvering.',
        'Alignment is tight; pillars require slow, careful reversing to avoid door or bumper scratches.',
        'Stack or puzzle parking mechanism creates awkward waiting and manual operation hassles.',
        'Narrow angles and pillar obstructions frequently lead to car bumper or mirror scratches.'
      ]
    },
    {
      id: 'pu_blocking',
      topicId: 'parking-usability',
      mainQuestionText: 'How spacious, accessible, and hassle-free is your assigned parking space?',
      questionText: 'Do neighbors or illegally parked cars ever block your parking slot or make reversing out a struggle?',
      type: 'single-choice',
      options: [
        'Never Blocked (Monitored by Basement Guards)',
        'Occasional Temporary Blocking (Resolved Quickly)',
        'Frequent Double Parking & Blocked Access',
        'Unorganized Driveway Chaos'
      ],
      answers: [
        'Basement security actively keeps driveways clear; parking slots are never blocked.',
        'Occasional temporary blocking occurs but is resolved quickly via resident WhatsApp groups.',
        'Neighbors frequently double-park in driveways, blocking access to assigned slots.',
        'Unorganized driveway parking creates constant friction and blocked cars.'
      ]
    },
    {
      id: 'pu_suv_clearance',
      topicId: 'parking-usability',
      mainQuestionText: 'How spacious, accessible, and hassle-free is your assigned parking space?',
      questionText: 'Can an SUV/large vehicle easily navigate basement entrance ramps, turning corners, and stack mechanisms?',
      type: 'single-choice',
      options: [
        'Wide Ramps & High Clearance (SUV Friendly)',
        'Standard Ramps (Manageable with Care)',
        'Narrow Steep Ramps (Bumper Scratches Common)',
        'Stack Parking Restrictions for SUVs'
      ],
      answers: [
        'Ramps and turning radii are wide and generous; large SUVs fit comfortably.',
        'Ramps are standard; SUVs navigate fine with normal driving care.',
        'Ramps are steep and narrow with tight turns, risking underbody or bumper scrapes.',
        'Stack parking height/weight limits strictly restrict large SUVs.'
      ]
    },
    {
      id: 'pu_overall_rating',
      topicId: 'parking-usability',
      mainQuestionText: 'How spacious, accessible, and hassle-free is your assigned parking space?',
      questionText: 'Overall rating of designated parking slot usability and drive-in ease (1 to 5):',
      type: 'rating',
      options: ['1 - Narrow & Obstructed', '2 - Difficult', '3 - Acceptable', '4 - Good', '5 - Broad & Effortless'],
      answers: [
        'Rating 1/5: Narrow, obstructed parking slot creating constant driving anxiety.',
        'Rating 2/5: Difficult parking slot requiring multi-point turns and risk of scratches.',
        'Rating 3/5: Acceptable parking space suitable for standard hatchback/sedan cars.',
        'Rating 4/5: Good, comfortable parking slot with clear access.',
        'Rating 5/5: Broad, effortless parking space with ample opening clearance.'
      ]
    }
  ],

  'visitor-parking': [
    {
      id: 'vp_availability',
      topicId: 'visitor-parking',
      mainQuestionText: 'Can your guests park safely inside the society when visiting in the evening?',
      questionText: 'When guests or family visit on weekends or evenings, can they actually find visitor parking slots inside the gate?',
      type: 'single-choice',
      options: [
        'Dedicated Visitor Slots Always Available',
        'Available on First-Come Basis (Fills up after 8 PM)',
        'Extremely Limited Visitor Slots',
        'Zero Visitor Parking Inside Gate'
      ],
      answers: [
        'Ample dedicated visitor parking bays are always available inside the gate.',
        'Visitor parking is available on first-come basis but usually fills up after 8 PM.',
        'Visitor slots are extremely scarce, forcing guests to search repeatedly.',
        'Zero visitor parking is allowed inside the main gate.'
      ]
    },
    {
      id: 'vp_gate_clearance',
      topicId: 'visitor-parking',
      mainQuestionText: 'Can your guests park safely inside the society when visiting in the evening?',
      questionText: 'Does gate security clear guest vehicles quickly, or do your visitors get delayed in long queues or aggressive questioning?',
      type: 'single-choice',
      options: [
        'Instant Clearance via Mobile App Entry Pass',
        'Quick Register Verification (Under 2 Mins)',
        'Slow Gate Queue (Guards hold up visitor cars)',
        'Strict Unfriendly Security Interrogation'
      ],
      answers: [
        'Security clears guests instantly via mobile app pass approval.',
        'Quick gate register check takes under 2 minutes.',
        'Long security queues at the main gate hold up guest cars during peak hours.',
        'Security guard interrogation feels unwelcoming and hostile to visiting guests.'
      ]
    },
    {
      id: 'vp_street_overflow',
      topicId: 'visitor-parking',
      mainQuestionText: 'Can your guests park safely inside the society when visiting in the evening?',
      questionText: 'If visitor slots are full inside, is street parking outside the main gate safe from towing, traffic scrapes, or theft?',
      type: 'single-choice',
      options: [
        'Safe Broad Service Road with Ample Space',
        'Adequate Street Space (Monitored by Cameras)',
        'Narrow Congested Street (Towing / Scraping Risk)',
        'No Street Parking Allowed (Traffic Police Towing Zone)'
      ],
      answers: [
        'A wide service road outside the gate provides safe, comfortable overflow parking.',
        'Street space outside is adequate and covered by security CCTV cameras.',
        'The outside street is narrow and congested, posing traffic scrape or towing risks.',
        'Outside street is a strict no-parking towing zone, making guest visits stressful.'
      ]
    },
    {
      id: 'vp_overall_rating',
      topicId: 'visitor-parking',
      mainQuestionText: 'Can your guests park safely inside the society when visiting in the evening?',
      questionText: 'Overall rating of visitor vehicle parking convenience and guest welcoming ease (1 to 5):',
      type: 'rating',
      options: ['1 - Extremely Difficult', '2 - Subpar', '3 - Moderate', '4 - Good', '5 - Welcoming & Effortless'],
      answers: [
        'Rating 1/5: Extremely difficult visitor parking that discourages friends and family from visiting.',
        'Rating 2/5: Subpar visitor parking options requiring street parking compromises.',
        'Rating 3/5: Moderate visitor parking availability for daytime guests.',
        'Rating 4/5: Good visitor parking setup with quick gate verification.',
        'Rating 5/5: Welcoming, effortless visitor parking for all guests.'
      ]
    }
  ],

  'ev-charging': [
    {
      id: 'ev_noc_speed',
      topicId: 'ev-charging',
      mainQuestionText: 'How easy is it to install a personal EV charger or charge an electric vehicle in the society?',
      questionText: 'If you buy an EV, does the committee issue the installation NOC smoothly without months of delays or objections?',
      type: 'single-choice',
      options: [
        'Fast Digital NOC Approval Within 48 Hours',
        'Approved Smoothly with Security Deposit',
        'Bureaucratic Delays & Multiple Meetings Required',
        'EV Charger Installation Currently Restricted'
      ],
      answers: [
        'Committee approves EV charger NOCs digitally within 48 hours without friction.',
        'NOC is issued smoothly after submitting standard documents and refundable deposit.',
        'Obtaining an EV NOC requires multiple follow-ups, committee meetings, and delays.',
        'Committee currently restricts personal EV charger installations in parking slots.'
      ]
    },
    {
      id: 'ev_grid_load',
      topicId: 'ev-charging',
      mainQuestionText: 'How easy is it to install a personal EV charger or charge an electric vehicle in the society?',
      questionText: 'Is the electrical transformer capacity sufficient for EV charging without tripping power breakers?',
      type: 'single-choice',
      options: [
        'High Grid Capacity (Dedicated EV Substation)',
        'Adequate for Current EV Owners',
        'Near Peak Capacity (Limits on New Chargers)',
        'Unsure / Power Trips During Charging'
      ],
      answers: [
        'Dedicated EV electrical infrastructure ensures seamless charging for all flats.',
        'Transformer capacity easily supports current EV owners in the society.',
        'Electrical transformer is near peak load limit; committee restricts new charger setups.',
        'Power trips or voltage fluctuations occur when multiple EVs charge overnight.'
      ]
    },
    {
      id: 'ev_common_bays',
      topicId: 'ev-charging',
      mainQuestionText: 'How easy is it to install a personal EV charger or charge an electric vehicle in the society?',
      questionText: 'Are there functional shared EV charging stations available in common bays for quick top-ups?',
      type: 'single-choice',
      options: [
        'Operational Fast-Charging Stations Active',
        'Basic Slow-Charging Points Available',
        'No Common EV Points Available',
        'Under Planning Stage'
      ],
      answers: [
        'Operational commercial fast chargers are installed in visitor bays.',
        'Basic slow-charging points are available in common parking areas.',
        'No common EV charging stations exist in the society.',
        'Common EV charging infrastructure is currently in planning stage.'
      ]
    },
    {
      id: 'ev_overall_rating',
      topicId: 'ev-charging',
      mainQuestionText: 'How easy is it to install a personal EV charger or charge an electric vehicle in the society?',
      questionText: 'Overall rating of society EV readiness and charging infrastructure (1 to 5):',
      type: 'rating',
      options: ['1 - Hostile / Restricted', '2 - Poor', '3 - Basic', '4 - Good', '5 - Future-Proof & Fully Enabled'],
      answers: [
        'Rating 1/5: Hostile or restricted EV policies that make owning an electric vehicle impractical.',
        'Rating 2/5: Poor EV readiness with heavy bureaucratic delays for charger NOCs.',
        'Rating 3/5: Basic EV setup requiring individual effort and negotiation.',
        'Rating 4/5: Good EV support with smooth NOC procedures.',
        'Rating 5/5: Future-proof, fully enabled EV infrastructure and common fast chargers.'
      ]
    }
  ],

  'wfh-tranquility': [
    {
      id: 'wt_call_peace',
      topicId: 'wfh-tranquility',
      mainQuestionText: 'Is your flat quiet enough for high-focus Work-From-Home and uninterrupted video calls?',
      questionText: 'Can you take crucial work video calls without background noise from construction, echoes, or children shouting?',
      type: 'single-choice',
      options: [
        '100% Pin-Drop Quiet for Video Calls All Day',
        'Good Focus (Minor Acceptable Daytime Activity)',
        'Requires Noise-Canceling Headphones',
        'Difficult WFH Environment due to Distractions'
      ],
      answers: [
        'Indoors is pin-drop quiet all day, perfect for important video meetings.',
        'Minor daytime community sounds occur but do not disturb remote work focus.',
        'Active noise-canceling headphones are essential during daytime working hours.',
        'Frequent heavy noise from construction or podium activity makes WFH difficult.'
      ]
    },
    {
      id: 'wt_wall_soundproofing',
      topicId: 'wfh-tranquility',
      mainQuestionText: 'Is your flat quiet enough for high-focus Work-From-Home and uninterrupted video calls?',
      questionText: 'Can you hear your neighbor\'s TV, conversation, or footsteps through bedroom walls and ceilings?',
      type: 'single-choice',
      options: [
        'Thick Wall Construction (Zero Sound Leakage)',
        'Normal Insulation (Voices unheard, minor door thuds)',
        'Thin Shared Walls (Neighbor TV audible in bedroom)',
        'Poor Soundproofing (Overhead footsteps loud)'
      ],
      answers: [
        'Thick wall construction prevents any sound leakage between neighboring flats.',
        'Wall insulation is normal; voices are unheard, with only rare heavy door thuds.',
        'Shared walls are thin; neighbor TV or loud conversations carry into bedrooms.',
        'Poor ceiling and wall soundproofing makes overhead footsteps and talking clearly audible.'
      ]
    },
    {
      id: 'wt_podium_echo',
      topicId: 'wfh-tranquility',
      mainQuestionText: 'Is your flat quiet enough for high-focus Work-From-Home and uninterrupted video calls?',
      questionText: 'Does noise from children playing in internal podiums or courtyards echo loudly into your flat living room?',
      type: 'single-choice',
      options: [
        'Zero Echo / Well Shielded',
        'Minor Evening Play Noise (Pleasant)',
        'Loud Daytime Echo in Courtyard Flats',
        'Constant Screaming & Ball Bouncing Noise'
      ],
      answers: [
        'Flats are well shielded from courtyard or podium acoustics.',
        'Courtyard play noise in evenings is mild and pleasant.',
        'Podium courtyard acts like an acoustic echo chamber, projecting noise into flats.',
        'Constant screaming and ball bouncing noise echoes loudly into living room balconies.'
      ]
    },
    {
      id: 'wt_overall_rating',
      topicId: 'wfh-tranquility',
      mainQuestionText: 'Is your flat quiet enough for high-focus Work-From-Home and uninterrupted video calls?',
      questionText: 'Overall rating of acoustic quietness and WFH focus tranquility (1 to 5):',
      type: 'rating',
      options: ['1 - Loud & Distracting', '2 - Subpar', '3 - Moderate', '4 - Quiet', '5 - Serene & Work-Friendly'],
      answers: [
        'Rating 1/5: Loud, distracting environment unfit for work-from-home concentration.',
        'Rating 2/5: Subpar acoustic privacy requiring constant window closure.',
        'Rating 3/5: Moderate quietness suitable for standard remote work.',
        'Rating 4/5: Quiet, comfortable atmosphere for daily office work.',
        'Rating 5/5: Serene, peaceful work-from-home sanctuary.'
      ]
    }
  ],
  'traffic-party-noise': [
    {
      id: 'tp_road_horn_noise',
      topicId: 'traffic-party-noise',
      mainQuestionText: 'Are you disturbed by main road traffic honking, truck rumble, or late-night party music?',
      questionText: 'Do you hear constant traffic noise, heavy truck rumbles, or vehicle horns with balcony doors open?',
      type: 'single-choice',
      options: [
        'Zero Road Noise (Deep Inside Township)',
        'Mild Far-away Traffic Hum',
        'Noticeable Horn Noise during Peak Hours',
        'Severe Constant Traffic & Horn Noise Day and Night'
      ],
      answers: [
        'Deep township placement insulates flats completely from road traffic noise.',
        'Distances attenuate road traffic to a mild, non-intrusive background hum.',
        'Main road traffic and honking carry noticeably into balconies during rush hours.',
        'Heavy traffic rumble and relentless honking persist day and night.'
      ]
    },
    {
      id: 'tp_clubhouse_parties',
      topicId: 'traffic-party-noise',
      mainQuestionText: 'Are you disturbed by main road traffic honking, truck rumble, or late-night party music?',
      questionText: 'Do weekend clubhouse events, poolside gatherings, or lawn celebrations flood your home with loud music?',
      type: 'single-choice',
      options: [
        'Quiet Events (Well Soundproofed)',
        'Moderate Event Activity (Ends Early)',
        'Loud Party Music on Balconies / Poolside',
        'Frequent Late-Night Loud Music Disturbance'
      ],
      answers: [
        'Clubhouse events are well soundproofed and never disturb nearby towers.',
        'Weekend celebrations are moderate and wrap up early in the evening.',
        'Party sound and loudspeakers echo loudly across balconies facing pools or lawns.',
        'Frequent loud late-night parties and music disrupt sleep and evening peace.'
      ]
    },
    {
      id: 'tp_cutoff_enforcement',
      topicId: 'traffic-party-noise',
      mainQuestionText: 'Are you disturbed by main road traffic honking, truck rumble, or late-night party music?',
      questionText: 'Does security strictly enforce the 10:00 PM late-night music cutoff when events run noisy?',
      type: 'single-choice',
      options: [
        'Strict 10:00 PM Cutoff Enforced Promptly',
        'Events End By 10:30 PM peacefully',
        'Lax Enforcement (Parties Continue Till Midnight)',
        'Frequent Late-Night Resident Disputes'
      ],
      answers: [
        'Security guards strictly shut down music and party noise at 10:00 PM sharp.',
        'Events naturally wrap up peacefully by 10:30 PM.',
        'Lax enforcement allows loud parties to continue past midnight.',
        'Repeated late-night noise violations trigger frequent resident disputes.'
      ]
    },
    {
      id: 'tp_overall_rating',
      topicId: 'traffic-party-noise',
      mainQuestionText: 'Are you disturbed by main road traffic honking, truck rumble, or late-night party music?',
      questionText: 'Overall rating of freedom from external traffic and late-night party noise (1 to 5):',
      type: 'rating',
      options: ['1 - Constant Noise Disruption', '2 - Poor', '3 - Moderate', '4 - Quiet', '5 - Restful & Peaceful'],
      answers: [
        'Rating 1/5: Constant noise disruption affecting daily sleep and mental peace.',
        'Rating 2/5: Subpar noise insulation requiring closed windows continuously.',
        'Rating 3/5: Moderate noise levels acceptable for urban living.',
        'Rating 4/5: Quiet, peaceful environment day and night.',
        'Rating 5/5: Restful, tranquil living environment free from external noise.'
      ]
    }
  ],

  'power-cuts': [
    {
      id: 'pc_outage_frequency',
      topicId: 'power-cuts',
      mainQuestionText: 'How frequent are electricity outages and voltage fluctuations in this area?',
      questionText: 'How often does main grid power go out in this locality during summer or rainy seasons?',
      type: 'single-choice',
      options: [
        'Zero Power Cuts (Top-Tier Metro Grid)',
        'Rare Outages (1-2 Short Cuts per Month)',
        'Weekly Outages (Common in Summer / Rains)',
        'Daily Frequent Power Cuts'
      ],
      answers: [
        'Main grid supply is top-tier; power cuts are virtually non-existent.',
        'Power outages are rare, lasting under 15 minutes once or twice a month.',
        'Power cuts occur weekly during summer heat waves or heavy rains.',
        'Daily power outages interrupt work and household routines.'
      ]
    },
    {
      id: 'pc_voltage_stability',
      topicId: 'power-cuts',
      mainQuestionText: 'How frequent are electricity outages and voltage fluctuations in this area?',
      questionText: 'Have voltage fluctuations ever tripped your AC, damaged home appliances, or caused light flickering?',
      type: 'single-choice',
      options: [
        '100% Stable Voltage (No Stabilizer Needed)',
        'Minor Safe Fluctuations',
        'Frequent Low Voltage in Peak Summer',
        'Dangerous Spikes (Stabilizers Essential)'
      ],
      answers: [
        'Voltage is 100% rock-solid stable without requiring heavy external stabilizers.',
        'Minor, safe voltage variations occur without endangering appliances.',
        'Frequent low voltage during peak summer limits heavy AC operation.',
        'Dangerous voltage spikes require heavy stabilizers for expensive electronics.'
      ]
    },
    {
      id: 'pc_alert_system',
      topicId: 'power-cuts',
      mainQuestionText: 'How frequent are electricity outages and voltage fluctuations in this area?',
      questionText: 'Does society management notify residents in advance before scheduled power maintenance shutdowns?',
      type: 'single-choice',
      options: [
        'Prior SMS & Mobile App Alerts Sent 24 Hours Ahead',
        'Notified on Resident WhatsApp Group',
        'Rarely Announced in Advance',
        'No Notification System Active'
      ],
      answers: [
        'Maintenance team issues automated mobile app and SMS alerts 24 hours prior.',
        'Scheduled cuts are communicated via resident WhatsApp broadcast groups.',
        'Power maintenance cuts are rarely announced in advance.',
        'Zero prior notice is given before power shutdowns.'
      ]
    },
    {
      id: 'pc_overall_rating',
      topicId: 'power-cuts',
      mainQuestionText: 'How frequent are electricity outages and voltage fluctuations in this area?',
      questionText: 'Overall rating of state grid power reliability and voltage stability (1 to 5):',
      type: 'rating',
      options: ['1 - Unreliable Grid', '2 - Poor', '3 - Moderate', '4 - Stable', '5 - Uninterrupted Premium Supply'],
      answers: [
        'Rating 1/5: Unreliable electrical grid causing severe inconvenience.',
        'Rating 2/5: Subpar grid stability requiring reliance on back-up systems.',
        'Rating 3/5: Moderate power reliability typical for the region.',
        'Rating 4/5: Stable, trustworthy power supply.',
        'Rating 5/5: Uninterrupted premium power supply year-round.'
      ]
    }
  ],

  'generator-backup': [
    {
      id: 'gb_in_flat_ac_coverage',
      topicId: 'generator-backup',
      mainQuestionText: 'How fast and comprehensive is the diesel generator power backup during outages?',
      questionText: 'Does generator backup power your air conditioner, refrigerator, and heavy appliances inside the flat?',
      type: 'single-choice',
      options: [
        '100% Full Flat Backup (Includes All ACs & Appliances)',
        'Partial Backup (1 AC + Lights + Fans + Fridge)',
        'Essential Backup Only (2 Lights + 2 Fans)',
        'Common Areas & Lifts Only (Zero In-Flat DG)'
      ],
      answers: [
        'Generator backup covers 100% of flat load, including all air conditioners.',
        'Backup runs 1 AC unit, refrigerator, lights, and fans comfortably.',
        'Backup covers basic lighting and fans only; ACs cannot be used.',
        'Generator covers common area lighting and elevators only—zero backup inside flats.'
      ]
    },
    {
      id: 'gb_switchover_speed',
      topicId: 'generator-backup',
      mainQuestionText: 'How fast and comprehensive is the diesel generator power backup during outages?',
      questionText: 'How fast does the generator kick in after a power cut—does it switch on before your Wi-Fi router reboots?',
      type: 'single-choice',
      options: [
        'Instant Auto-Switchover (Under 10 Seconds)',
        'Quick Switchover (10 to 30 Seconds)',
        'Slow Switchover (1 to 3 Minutes)',
        'Manual Generator Start (5+ Minutes)'
      ],
      answers: [
        'Automated switchover takes under 10 seconds, preserving Wi-Fi router sessions.',
        'Generator turns on within 10-30 seconds after grid outage.',
        'Switchover takes 1-3 minutes, causing brief darkness and reboots.',
        'Manual generator startup takes over 5 minutes.'
      ]
    },
    {
      id: 'gb_fuel_surcharge',
      topicId: 'generator-backup',
      mainQuestionText: 'How fast and comprehensive is the diesel generator power backup during outages?',
      questionText: 'Are diesel generator running costs included in maintenance or billed as extra monthly surprise surcharges?',
      type: 'single-choice',
      options: [
        'Included in Standard Monthly Maintenance Dues',
        'Itemized Pro-Rata Generator Meter Billing',
        'Heavy Separate Diesel Surcharge in Summer',
        'Unclear / Variable Surcharges'
      ],
      answers: [
        'Diesel generator fuel is fully covered under normal monthly maintenance dues.',
        'DG power usage is transparently billed via individual digital sub-meters.',
        'Frequent summer power cuts trigger heavy extra diesel surcharges on monthly bills.',
        'Unpredictable, variable diesel surcharges cause financial surprises.'
      ]
    },
    {
      id: 'gb_overall_rating',
      topicId: 'generator-backup',
      mainQuestionText: 'How fast and comprehensive is the diesel generator power backup during outages?',
      questionText: 'Overall rating of generator backup speed and in-flat power coverage (1 to 5):',
      type: 'rating',
      options: ['1 - Zero Flat Backup', '2 - Poor', '3 - Adequate', '4 - Fast', '5 - 100% Full Appliance Coverage'],
      answers: [
        'Rating 1/5: Zero generator backup inside flats.',
        'Rating 2/5: Slow, minimal generator backup causing significant inconvenience.',
        'Rating 3/5: Adequate basic generator backup for essential lights and fans.',
        'Rating 4/5: Fast auto-switchover generator backup with partial AC support.',
        'Rating 5/5: Instant, full flat generator backup including all air conditioners.'
      ]
    }
  ],

  'lift-waiting-times': [
    {
      id: 'lw_peak_wait_time',
      topicId: 'lift-waiting-times',
      mainQuestionText: 'How long do you have to wait for an elevator during peak morning rush hours?',
      questionText: 'During morning office & school rush (8:00 AM - 9:30 AM), do you wait more than 3-5 minutes for an elevator?',
      type: 'single-choice',
      options: [
        'Fast (Under 2 Minutes Wait)',
        'Normal Wait (2 to 4 Minutes)',
        'Long Wait (5 to 8 Minutes on High Floors)',
        'Severe Elevator Bottleneck (10+ Mins Wait)'
      ],
      answers: [
        'Elevator wait time is under 2 minutes even during peak 8:00 AM rush.',
        'Normal 2-4 minute wait time during peak morning rush hours.',
        'High floors experience long 5-8 minute waits during morning peak hours.',
        'Severe elevator bottleneck leads to frustrating 10+ minute morning wait times.'
      ]
    },
    {
      id: 'lw_lobby_queues',
      topicId: 'lift-waiting-times',
      mainQuestionText: 'How long do you have to wait for an elevator during peak morning rush hours?',
      questionText: 'Do frustrating queues and crowd bottlenecks build up in the ground floor lobby waiting for lifts?',
      type: 'single-choice',
      options: [
        'Zero Queues (Smart Destination Dispatch Allocates Well)',
        'Short Orderly Queue (Clears Rapidly)',
        'Noticeable Lobby Crowding at 8:00 AM',
        'Frustrating Chaos & Overcrowded Cabs'
      ],
      answers: [
        'Smart elevator dispatch algorithms allocate cabs efficiently with zero lobby queuing.',
        'Short, orderly queues clear rapidly without overcrowding.',
        'Ground floor lobby experiences crowding between 8:00 AM and 8:45 AM.',
        'Frustrating lobby queues and overcrowded cabs cause morning stress.'
      ]
    },
    {
      id: 'lw_elevator_speed',
      topicId: 'lift-waiting-times',
      mainQuestionText: 'How long do you have to wait for an elevator during peak morning rush hours?',
      questionText: 'Are the elevators fast and smooth, or do high-floor residents face slow travel times?',
      type: 'single-choice',
      options: [
        'High-Speed Modern Elevators (Under 30 Secs to Top)',
        'Good Standard Speed Elevators',
        'Slow Elevator Motion',
        'Frequent Jerks / Mechanical Vibration'
      ],
      answers: [
        'High-speed modern elevators reach top floors smoothly in under 30 seconds.',
        'Standard elevator speed is smooth and reliable.',
        'Elevator travel speed is noticeably slow for high-rise towers.',
        'Vibrations and jerks indicate poor elevator tuning.'
      ]
    },
    {
      id: 'lw_overall_rating',
      topicId: 'lift-waiting-times',
      mainQuestionText: 'How long do you have to wait for an elevator during peak morning rush hours?',
      questionText: 'Overall rating of elevator waiting speed and morning rush efficiency (1 to 5):',
      type: 'rating',
      options: ['1 - Severe Bottleneck', '2 - Slow', '3 - Acceptable', '4 - Fast', '5 - Effortless High-Speed Service'],
      answers: [
        'Rating 1/5: Severe elevator bottlenecks disrupting morning schedules daily.',
        'Rating 2/5: Slow elevator service causing long waits.',
        'Rating 3/5: Acceptable elevator wait times for standard high-rise living.',
        'Rating 4/5: Fast, efficient elevator service.',
        'Rating 5/5: Effortless high-speed elevator service with minimal wait.'
      ]
    }
  ],
  'lift-breakdown-speed': [
    {
      id: 'lb_breakdown_freq',
      topicId: 'lift-breakdown-speed',
      mainQuestionText: 'When an elevator breaks down, how frequently does it happen and how quickly is it repaired?',
      questionText: 'How often do elevators break down or stall in your tower—have you ever been stuck or had to use stairs?',
      type: 'single-choice',
      options: [
        'Rare / Zero Breakdowns (High Brand Quality)',
        'Occasional Minor Breakdown (1-2 Times a Year)',
        'Monthly Breakdown (One lift out of service frequently)',
        'Frequent Recurrent Elevator Failures'
      ],
      answers: [
        'High brand quality lift machinery ensures zero breakdowns or elevator trap incidents.',
        'Breakdowns are rare, occurring once or twice a year with prompt resolution.',
        'Elevators break down monthly, keeping one lift out of service regularly.',
        'Frequent elevator breakdowns force high-floor residents to take the stairs.'
      ]
    },
    {
      id: 'lb_amc_turnaround',
      topicId: 'lift-breakdown-speed',
      mainQuestionText: 'When an elevator breaks down, how frequently does it happen and how quickly is it repaired?',
      questionText: 'When a lift breaks down, does the manufacturer technician arrive immediately or do lifts stay broken for days?',
      type: 'single-choice',
      options: [
        'Repaired Within 2-4 Hours (Active Full AMC Response)',
        'Repaired Same Day',
        'Takes 2-3 Days due to Spare Part Delays',
        'Lifts Remain Out of Service for Weeks'
      ],
      answers: [
        'Active comprehensive OEM service contract guarantees technicians fix breakdowns within 2-4 hours.',
        'Lift repairs are completed reliably on the same day.',
        'Lack of spare parts causes broken elevators to stay out of service for 2-3 days.',
        'Inordinate delays leave elevators broken for weeks at a time.'
      ]
    },
    {
      id: 'lb_service_lift',
      topicId: 'lift-breakdown-speed',
      mainQuestionText: 'When an elevator breaks down, how frequently does it happen and how quickly is it repaired?',
      questionText: 'Is there a dedicated padded service elevator so delivery staff and furniture movers do not block passenger lifts?',
      type: 'single-choice',
      options: [
        'Dedicated Large Service Lift Reserved for Shifting',
        'Service Lift Shared with Normal Passenger Duty',
        'No Dedicated Service Lift (Passenger Lifts Used)',
        'Strict Time Restrictions Enforced'
      ],
      answers: [
        'A dedicated, padded service elevator absorbs heavy goods movement without affecting passenger lifts.',
        'Service lift operates smoothly while sharing passenger duty.',
        'No dedicated service lift exists; furniture and trash bins share regular passenger elevators.',
        'Strict shifting rules restrict heavy goods movement to tight time windows.'
      ]
    },
    {
      id: 'lb_overall_rating',
      topicId: 'lift-breakdown-speed',
      mainQuestionText: 'When an elevator breaks down, how frequently does it happen and how quickly is it repaired?',
      questionText: 'Overall rating of elevator reliability, passenger safety, and repair turnaround time (1 to 5):',
      type: 'rating',
      options: ['1 - Frequent Breakdowns', '2 - Poor', '3 - Moderate', '4 - Reliable', '5 - Safe & Prompt Repair'],
      answers: [
        'Rating 1/5: Frequent elevator failures threatening safety and convenience.',
        'Rating 2/5: Subpar elevator maintenance and delayed technician response.',
        'Rating 3/5: Moderate reliability typical of standard elevator maintenance.',
        'Rating 4/5: Reliable elevator performance with quick repair response.',
        'Rating 5/5: Exceptionally safe, smooth elevator operation backed by rapid repair response.'
      ]
    }
  ],

  'doorstep-deliveries': [
    {
      id: 'dd_quick_commerce_speed',
      topicId: 'doorstep-deliveries',
      mainQuestionText: 'Do quick-commerce apps, food delivery riders, and cabs reach your doorstep without gate friction?',
      questionText: 'Do quick-commerce apps (Blinkit, Zepto, Instamart) deliver directly to your flat doorstep within 10-15 minutes?',
      type: 'single-choice',
      options: [
        'Fast Doorstep Flat Delivery (10-15 Mins Guaranteed)',
        'Delivered to Tower Lobby Drop Desk',
        'Must Collect at Main Gate Entrance Security Desk',
        'Out-of-Service Zone / Slow Delivery'
      ],
      answers: [
        'Delivery riders come directly to flat doorsteps within guaranteed 10-15 minute windows.',
        'Deliveries are dropped safely at the tower lobby desk for convenient collection.',
        'Security rules force residents to walk all the way to the main gate to pick up packages.',
        'Society location is underserved or quick-commerce delivery times exceed 30-40 minutes.'
      ]
    },
    {
      id: 'dd_rider_gate_pass',
      topicId: 'doorstep-deliveries',
      mainQuestionText: 'Do quick-commerce apps, food delivery riders, and cabs reach your doorstep without gate friction?',
      questionText: 'Do food delivery riders face long security gate verification queues that make your food arrive cold?',
      type: 'single-choice',
      options: [
        'Seamless Digital Pass Gate Approval (Fast Entry)',
        'Quick Gate Entry with Phone Call Verification',
        'Riders Held at Gate for 5-10 Mins by Security',
        'Riders Refuse to Enter / Ask Resident to Come to Gate'
      ],
      answers: [
        'Pre-approved digital gate passes allow riders to bypass security queues instantly.',
        'Quick phone verification grants prompt entry for delivery riders.',
        'Strict gate checks delay riders by 5-10 minutes, risking cold food delivery.',
        'Security friction leads riders to refuse entry, forcing residents to walk to the main gate.'
      ]
    },
    {
      id: 'dd_cab_lobby_access',
      topicId: 'doorstep-deliveries',
      mainQuestionText: 'Do quick-commerce apps, food delivery riders, and cabs reach your doorstep without gate friction?',
      questionText: 'Do Ola/Uber cab drivers come straight to your tower lobby, or do they cancel when seeing society security gates?',
      type: 'single-choice',
      options: [
        'Cabs Drive Right to Tower Lobby Doorstep',
        'Cabs Enter Gate with Pass Approval',
        'Drivers Frequently Cancel / Ask Resident to Walk to Gate',
        'High Cab Cancellation Rate near Gate'
      ],
      answers: [
        'Cab drivers easily enter society driveways right up to the tower lobby.',
        'Cabs enter smoothly after brief digital pass verification at the gate.',
        'Drivers routinely refuse internal driveway entry, asking residents to walk to the main gate.',
        'High cab cancellation rates occur due to security hassle at the entrance.'
      ]
    },
    {
      id: 'dd_overall_rating',
      topicId: 'doorstep-deliveries',
      mainQuestionText: 'Do quick-commerce apps, food delivery riders, and cabs reach your doorstep without gate friction?',
      questionText: 'Overall rating of daily delivery convenience, cab pickup ease, and doorstep accessibility (1 to 5):',
      type: 'rating',
      options: ['1 - Restricted Gate Bottlenecks', '2 - Subpar', '3 - Moderate', '4 - Good', '5 - Seamless Doorstep Ease'],
      answers: [
        'Rating 1/5: Extreme gate restrictions causing daily hassle for deliveries and cabs.',
        'Rating 2/5: Subpar delivery access requiring frequent walks to main security gate.',
        'Rating 3/5: Moderate delivery experience with occasional minor gate delays.',
        'Rating 4/5: Good doorstep delivery convenience.',
        'Rating 5/5: Seamless, effortless doorstep access for all deliveries and cabs.'
      ]
    }
  ],

  'maid-availability': [
    {
      id: 'ma_ease_of_hiring',
      topicId: 'maid-availability',
      mainQuestionText: 'How easy is it to hire reliable maids, cooks, and daily help, and are rates reasonable?',
      questionText: 'Can you easily find reliable, background-checked maids and cooks, or is there a severe domestic help shortage?',
      type: 'single-choice',
      options: [
        'Very Easy (Abundant Experienced Maids Available)',
        'Moderate Ease (Takes 1-2 Weeks via Society Contacts)',
        'Difficult (High Scarcity / Frequent Maid Turnover)',
        'Strict External Maid Agency Requirements'
      ],
      answers: [
        'Abundant experienced domestic help is readily available within the society.',
        'Finding a maid or cook takes 1-2 weeks through society contacts.',
        'Severe maid scarcity and high turnover make hiring domestic help frustrating.',
        'Hiring requires expensive external agencies due to local help shortages.'
      ]
    },
    {
      id: 'ma_salary_rate_cards',
      topicId: 'maid-availability',
      mainQuestionText: 'How easy is it to hire reliable maids, cooks, and daily help, and are rates reasonable?',
      questionText: 'Are monthly maid and cook salaries fair and negotiable, or controlled by an aggressive local maid union?',
      type: 'single-choice',
      options: [
        'Reasonable Market Rates (Flexible Negotiation)',
        'Standard Fixed Society Rate Card Enforced',
        'Strict Local Union Controls High Monthly Rates',
        'High Maid Salary Demands compared to Neighborhood'
      ],
      answers: [
        'Maid salaries follow fair market rates with flexible mutual negotiation.',
        'Society enforces a standardized, reasonable maid rate card.',
        'Local maid unions strictly dictate inflated monthly rates.',
        'Exorbitant salary demands make domestic help significantly pricier than neighboring societies.'
      ]
    },
    {
      id: 'ma_car_washers',
      topicId: 'maid-availability',
      mainQuestionText: 'How easy is it to hire reliable maids, cooks, and daily help, and are rates reasonable?',
      questionText: 'Are reliable daily car-wash staff available for your basement parking slot?',
      type: 'single-choice',
      options: [
        'Organized Car Washer Staff Active in Basement',
        'Individual Car Washers Available on Request',
        'Difficult to Find Car Washers for Basement',
        'Car Washing Prohibited inside Basement Slots'
      ],
      answers: [
        'Organized, trustworthy car washing staff operate daily in basement parking levels.',
        'Independent car washers are available upon asking security or neighbors.',
        'Finding a dedicated car washer for basement slots is difficult.',
        'Society rules prohibit car washing inside basement parking areas.'
      ]
    },
    {
      id: 'ma_overall_rating',
      topicId: 'maid-availability',
      mainQuestionText: 'How easy is it to hire reliable maids, cooks, and daily help, and are rates reasonable?',
      questionText: 'Overall rating of domestic help availability, reliability, and cost fairness (1 to 5):',
      type: 'rating',
      options: ['1 - High Scarcity & Union Rates', '2 - Poor', '3 - Moderate', '4 - Good', '5 - Abundant & Reasonable'],
      answers: [
        'Rating 1/5: Severe domestic help scarcity and unreasonable union rates.',
        'Rating 2/5: Subpar maid availability causing frequent household disruption.',
        'Rating 3/5: Moderate availability of cooks and maids at standard rates.',
        'Rating 4/5: Good domestic help network with reliable staff.',
        'Rating 5/5: Abundant, trustworthy, and reasonably priced domestic help.'
      ]
    }
  ],

  'monsoon-gate-flooding': [
    {
      id: 'mg_road_waterlogging',
      topicId: 'monsoon-gate-flooding',
      mainQuestionText: 'Does the entrance gate or approach road flood during heavy monsoon rainstorms?',
      questionText: 'Does the approach road outside the main gate drown in knee-deep water during heavy downpours?',
      type: 'single-choice',
      options: [
        'Zero Waterlogging (High Elevation & Excellent Storm Drains)',
        'Temporary Puddles (Clears Within 30 Mins of Rain Stop)',
        'Knee-Deep Waterlogging Outside Gate for Hours',
        'Severe Gate Flooding (Blocks Vehicle Entry)'
      ],
      answers: [
        'High elevation and heavy-duty storm drains keep the approach road 100% dry.',
        'Minor puddles clear within 30 minutes after rain stops.',
        'Knee-deep waterlogging outside the gate traps vehicles for hours during heavy rains.',
        'Severe gate flooding blocks all vehicle entry and exit during monsoon downpours.'
      ]
    },
    {
      id: 'mg_drain_clearance',
      topicId: 'monsoon-gate-flooding',
      mainQuestionText: 'Does the entrance gate or approach road flood during heavy monsoon rainstorms?',
      questionText: 'Do internal society drains flush stormwater immediately, or do driveways flood with murky water?',
      type: 'single-choice',
      options: [
        'Instant Drainage (Driveways Remain Dry)',
        'Drains Smoothly within 15-20 Mins',
        'Slow Drainage (Driveway Puddles Remain for Hours)',
        'Drain Overflow onto Podium / Driveway'
      ],
      answers: [
        'Internal stormwater drains flush rainwater instantly, keeping driveways clear.',
        'Driveways drain smoothly within 15-20 minutes after heavy rain.',
        'Sluggish internal drainage leaves murky water puddles on driveways for hours.',
        'Drain overflow causes waterlogging across podiums and internal walkways.'
      ]
    },
    {
      id: 'mg_delivery_disruption',
      topicId: 'monsoon-gate-flooding',
      mainQuestionText: 'Does the entrance gate or approach road flood during heavy monsoon rainstorms?',
      questionText: 'Do cabs, milkmen, and grocery delivery apps stop coming to the society on rainy days due to waterlogging?',
      type: 'single-choice',
      options: [
        'Uninterrupted Delivery & Cab Service Year-Round',
        'Minor Surge Delays during Peak Downpour',
        'Cabs & Deliveries Stop Coming to Gate on Heavy Rain Days',
        'Total Access Blockade during Heavy Rain'
      ],
      answers: [
        'Deliveries and cabs operate uninterrupted even during heavy monsoon downpours.',
        'Minor delivery surge delays occur only during peak rainstorms.',
        'Waterlogging causes delivery riders and cab drivers to cancel orders on heavy rain days.',
        'Total road blockade prevents deliveries and cabs from reaching society gates.'
      ]
    },
    {
      id: 'mg_overall_rating',
      topicId: 'monsoon-gate-flooding',
      mainQuestionText: 'Does the entrance gate or approach road flood during heavy monsoon rainstorms?',
      questionText: 'Overall rating of entrance drainage and monsoon road flood resilience (1 to 5):',
      type: 'rating',
      options: ['1 - Flooding Hazard & Blocked Road', '2 - Poor', '3 - Moderate', '4 - Good', '5 - Dry & Fully Resilient'],
      answers: [
        'Rating 1/5: Severe monsoon flooding hazard blocking access roads.',
        'Rating 2/5: Subpar drainage causing waterlogging and delivery disruption.',
        'Rating 3/5: Moderate drainage handling normal rains adequately.',
        'Rating 4/5: Good flood resilience with minor monsoon impact.',
        'Rating 5/5: Completely dry, flood-resilient entrance and approach roads year-round.'
      ]
    }
  ],

  'monsoon-seepage': [
    {
      id: 'ms_basement_seepage',
      topicId: 'monsoon-seepage',
      mainQuestionText: 'Have you noticed dampness, wall paint peeling, or water seepage during monsoons?',
      questionText: 'Do basement parking levels experience water seepage, damp walls, or sump pump failures during heavy rains?',
      type: 'single-choice',
      options: [
        'Dry Basements (24x7 Automated Sump Pumps Active)',
        'Minor Water Seepage near Retaining Walls (Managed)',
        'Water Accumulation in Lowest Basement Level',
        'Severe Basement Inundation Risk'
      ],
      answers: [
        'Automated sump pumps keep all basement parking levels completely dry.',
        'Minor seepage near retaining walls is managed effectively by maintenance.',
        'Lowest basement level accumulates standing water during heavy monsoon spells.',
        'Severe basement seepage risks waterlogging cars during heavy downpours.'
      ]
    },
    {
      id: 'ms_flat_wall_dampness',
      topicId: 'monsoon-seepage',
      mainQuestionText: 'Have you noticed dampness, wall paint peeling, or water seepage during monsoons?',
      questionText: 'Does rainwater seep through exterior building walls, causing damp patches, peeling paint, or ceiling leaks in flats?',
      type: 'single-choice',
      options: [
        'Zero Wall Seepage (High-Quality Exterior Facade Waterproofing)',
        'Minor Cosmetic Dampness near Window Slits',
        'Wall Seepage in Outer Balcony / Bedroom Walls',
        'Frequent Ceiling Dripping & Severe Seepage'
      ],
      answers: [
        'High-grade exterior waterproofing prevents any water dampness inside flats.',
        'Minor cosmetic dampness occurs around window frames during heavy driving rain.',
        'Rainwater seeps through outer bedroom walls, causing peeling paint and damp patches.',
        'Severe ceiling dripping and wall seepage ruin interior paint and furniture.'
      ]
    },
    {
      id: 'ms_elevator_pit_water',
      topicId: 'monsoon-seepage',
      mainQuestionText: 'Have you noticed dampness, wall paint peeling, or water seepage during monsoons?',
      questionText: 'Does water accumulate in elevator pits during monsoons, forcing lifts to be shut down for safety?',
      type: 'single-choice',
      options: [
        'Dry Elevator Pits (Zero Rain Disruption)',
        'Minor Water Seepage Managed by Maintenance',
        'Lifts Frequently Shut Down Due to Pit Water Accumulation',
        'Recurrent Elevator Damage from Rain Water'
      ],
      answers: [
        'Elevator pits remain dry, ensuring uninterrupted lift operation during monsoons.',
        'Minor seepage in elevator pits is promptly pumped out by maintenance.',
        'Monsoon water accumulation in elevator pits causes frequent lift shutdowns.',
        'Recurrent elevator pit flooding damages mechanical components.'
      ]
    },
    {
      id: 'ms_overall_rating',
      topicId: 'monsoon-seepage',
      mainQuestionText: 'Have you noticed dampness, wall paint peeling, or water seepage during monsoons?',
      questionText: 'Overall rating of building waterproofing, wall dryness, and monsoon seepage protection (1 to 5):',
      type: 'rating',
      options: ['1 - Poor Waterproofing & Seepage', '2 - Poor', '3 - Moderate', '4 - Good', '5 - 100% Dry & Seepage-Free'],
      answers: [
        'Rating 1/5: Poor waterproofing resulting in severe wall seepage and ceiling leaks.',
        'Rating 2/5: Subpar dampness protection requiring annual interior repainting.',
        'Rating 3/5: Moderate waterproofing with minor manageable dampness.',
        'Rating 4/5: Good waterproofing keeping flat interiors dry.',
        'Rating 5/5: 100% dry, flawless building facade waterproofing.'
      ]
    }
  ],
  'committee-fairness': [
    {
      id: 'cf_tenant_equality',
      topicId: 'committee-fairness',
      mainQuestionText: 'Is the society managing committee fair, transparent, and unbiased toward owners and tenants?',
      questionText: 'Does the managing committee treat tenants fairly, or do they face restrictive rules and discrimination?',
      type: 'single-choice',
      options: [
        '100% Fair & Equal Treatment for Owners & Tenants',
        'Generally Fair with Clear Published Bylaws',
        'Noticeable Bias / Restrictions on Tenants',
        'Strict Discriminatory Restrictions on Tenants'
      ],
      answers: [
        'Managing committee treats owners and tenants with complete equality and respect.',
        'Society rules and amenity access policies are published clearly and applied fairly.',
        'Noticeable bias exists against tenants regarding amenity usage or guest entry.',
        'Discriminatory society rules restrict tenant movement, pets, or vehicle access.'
      ]
    },
    {
      id: 'cf_fine_harassment',
      topicId: 'committee-fairness',
      mainQuestionText: 'Is the society managing committee fair, transparent, and unbiased toward owners and tenants?',
      questionText: 'Does the managing committee impose unfair fines, moral policing, or aggressive penalty notices?',
      type: 'single-choice',
      options: [
        'No Arbitrary Fines (Clear Warnings Issued First)',
        'Fair Enforcement of Published Penalties',
        'Frequent Harsh Fines for Minor Violations',
        'Hostile Governance & Heavy Arbitrary Fines'
      ],
      answers: [
        'Committee resolves issues constructively without levying arbitrary monetary fines.',
        'Penalties for rule breaches follow transparent, published society guidelines.',
        'Committee frequently levies harsh monetary fines for minor, trivial infractions.',
        'Hostile committee governance leads to constant penalty notices and harassment.'
      ]
    },
    {
      id: 'cf_audit_transparency',
      topicId: 'committee-fairness',
      mainQuestionText: 'Is the society managing committee fair, transparent, and unbiased toward owners and tenants?',
      questionText: 'Are annual financial budgets, maintenance expenses, and audit reports published openly on the app?',
      type: 'single-choice',
      options: [
        'Transparent Audited Accounts Published Promptly on App',
        'Accounts Shared Annually before AGM',
        'Delayed Financial Audits / Hard to Access Reports',
        'Opaque Financial Management'
      ],
      answers: [
        'Audited accounts and vendor contracts are published transparently on the society app.',
        'Financial accounts are shared regularly prior to annual general body meetings.',
        'Financial audits suffer long delays, making accounts hard for residents to verify.',
        'Opaque financial management raises frequent resident doubts during meetings.'
      ]
    },
    {
      id: 'cf_overall_rating',
      topicId: 'committee-fairness',
      mainQuestionText: 'Is the society managing committee fair, transparent, and unbiased toward owners and tenants?',
      questionText: 'Overall rating of managing committee governance, fairness, and transparency (1 to 5):',
      type: 'rating',
      options: ['1 - Arbitrary & Opaque', '2 - Subpar', '3 - Moderate', '4 - Fair', '5 - Transparent & Progressive'],
      answers: [
        'Rating 1/5: High-handed, arbitrary committee governance causing constant friction.',
        'Rating 2/5: Subpar governance with slow issue resolution and bias.',
        'Rating 3/5: Moderate committee management performing basic duties satisfactorily.',
        'Rating 4/5: Fair, helpful, and transparent society management.',
        'Rating 5/5: Exemplary, progressive, and 100% transparent society leadership.'
      ]
    }
  ],

  'renovation-movein-noc': [
    {
      id: 'rm_renovation_approval_speed',
      topicId: 'renovation-movein-noc',
      mainQuestionText: 'How smooth and reasonable is the process for move-in NOCs, shifting, and flat renovation work?',
      questionText: 'Does getting a renovation NOC take days of bureaucracy and endless signatures from the committee?',
      type: 'single-choice',
      options: [
        'Quick Approval Within 48 Hours via App / Office',
        'Approved Smoothly within 1 Week with Deposit',
        'Requires Multiple Follow-ups & Physical Signatures',
        'Strict Unreasonable Construction Hours & Slow Approvals'
      ],
      answers: [
        'Renovation NOCs are approved digitally within 48 hours of submitting plans.',
        'Approval is granted smoothly within 1 week upon paying standard refundable deposits.',
        'Bureaucratic red tape requires multiple physical visits and signatures for NOCs.',
        'Strict, unreasonable construction restrictions and slow approvals stall flat work.'
      ]
    },
    {
      id: 'rm_shifting_deposit_refund',
      topicId: 'renovation-movein-noc',
      mainQuestionText: 'How smooth and reasonable is the process for move-in NOCs, shifting, and flat renovation work?',
      questionText: 'Is the move-in shifting deposit refunded promptly without unjustified maintenance deductions?',
      type: 'single-choice',
      options: [
        'Seamless Digital Move-in Approval & Quick Deposit Refund',
        'Standard Paperwork Completed smoothly',
        'High Non-Refundable Shifting Surcharge Billed',
        'Onerous Bureaucratic Delays for Tenant NOCs'
      ],
      answers: [
        'Shifting security deposit is refunded digitally within 7 days of moving.',
        'Standard move-in paperwork and deposit refunds are handled smoothly.',
        'Society levies heavy non-refundable move-in shifting charges.',
        'Onerous delays and arbitrary deductions hold up shifting deposit refunds for months.'
      ]
    },
    {
      id: 'rm_lift_padding_rules',
      topicId: 'renovation-movein-noc',
      mainQuestionText: 'How smooth and reasonable is the process for move-in NOCs, shifting, and flat renovation work?',
      questionText: 'Does security provide padded elevators and clear shifting time slots for movers and packers?',
      type: 'single-choice',
      options: [
        'Well-Organized Padded Lift Reserved during Shifting Slot',
        'Managed Smoothly with Guard Supervision',
        'Tight Time Slot Restrictions (Fine if late)',
        'No Assistance / Elevator Padding Neglected'
      ],
      answers: [
        'Security reserves protective padded lifts for movers, ensuring zero damage.',
        'Shifting is managed smoothly with guard supervision at service bays.',
        'Overly rigid time restrictions lead to fines if moving trucks are delayed in traffic.',
        'Lack of elevator padding leads to elevator scratches and friction with neighbors.'
      ]
    },
    {
      id: 'rm_overall_rating',
      topicId: 'renovation-movein-noc',
      mainQuestionText: 'How smooth and reasonable is the process for move-in NOCs, shifting, and flat renovation work?',
      questionText: 'Overall rating of renovation NOC approvals, move-in logistics, and shifting deposit ease (1 to 5):',
      type: 'rating',
      options: ['1 - Bureaucratic Nightmare', '2 - Poor', '3 - Moderate', '4 - Good', '5 - Fast, Digital & Effortless'],
      answers: [
        'Rating 1/5: Bureaucratic nightmare causing extreme frustration during move-in or renovation.',
        'Rating 2/5: Subpar NOC process with unnecessary delays and heavy fees.',
        'Rating 3/5: Standard move-in process requiring routine follow-ups.',
        'Rating 4/5: Good, hassle-free shifting and NOC management.',
        'Rating 5/5: Fast, digital, and completely effortless move-in and renovation NOC process.'
      ]
    }
  ],

  'hidden-charges-hikes': [
    {
      id: 'hc_surprise_charges',
      topicId: 'hidden-charges-hikes',
      mainQuestionText: 'Are monthly maintenance fees transparent, or do unexpected surprise charges keep popping up?',
      questionText: 'Did you get hit with surprise fees after moving in—like move-in fees, lift charges, or club entry surcharges?',
      type: 'single-choice',
      options: [
        '100% Transparent (No Hidden Charges)',
        'Standard Refundable Security Deposit Only',
        'High Non-Refundable Move-in / Lift Padding Fee',
        'Multiple Surprise Transfer / Club Surcharges'
      ],
      answers: [
        '100% financial transparency with zero surprise fees after moving in.',
        'Only standard refundable deposits are charged prior to move-in.',
        'Unannounced non-refundable move-in and lift padding fees catch residents by surprise.',
        'Multiple hidden transfer fees and club entrance surcharges increase living costs.'
      ]
    },
    {
      id: 'hc_annual_hikes',
      topicId: 'hidden-charges-hikes',
      mainQuestionText: 'Are monthly maintenance fees transparent, or do unexpected surprise charges keep popping up?',
      questionText: 'Does monthly maintenance fee go up drastically every year or demand sudden ad-hoc cash collections?',
      type: 'single-choice',
      options: [
        'Predictable 5% or Less Annual Inflation Hike',
        'Moderate 5% to 10% Annual Increase',
        'High Unpredictable Maintenance Fee Hikes (>10%)',
        'Frequent Special Ad-Hoc Capital Levies'
      ],
      answers: [
        'Maintenance fee hikes are capped at a predictable 3-5% inflation adjustment.',
        'Maintenance charges rise by a moderate 5-10% annually.',
        'Unpredictable maintenance fee hikes exceeding 10-15% happen regularly.',
        'Frequent ad-hoc lump sum levies are collected for unexpected repairs.'
      ]
    },
    {
      id: 'hc_amenity_user_fees',
      topicId: 'hidden-charges-hikes',
      mainQuestionText: 'Are monthly maintenance fees transparent, or do unexpected surprise charges keep popping up?',
      questionText: 'Are the gym, swimming pool, and clubhouse free for residents or do they charge extra per user?',
      type: 'single-choice',
      options: [
        'All Major Amenities Included in Monthly Maintenance',
        'Nominal Annual Club Membership Fee',
        'Separate Monthly Fee Billed per User',
        'High Commercial Rates for Amenity Usage'
      ],
      answers: [
        'Swimming pool, gym, and clubhouse access are fully included in monthly maintenance.',
        'Nominal token annual fee covers clubhouse and sports facility usage.',
        'High separate monthly user fees are charged for gym or pool access.',
        'Commercial rates make using society amenities uncomfortably expensive.'
      ]
    },
    {
      id: 'hc_overall_rating',
      topicId: 'hidden-charges-hikes',
      mainQuestionText: 'Are monthly maintenance fees transparent, or do unexpected surprise charges keep popping up?',
      questionText: 'Overall rating of financial transparency, maintenance charge predictability, and fee fairness (1 to 5):',
      type: 'rating',
      options: ['1 - Frequent Hidden Costs', '2 - Subpar', '3 - Moderate', '4 - Transparent', '5 - 100% Predictable & Clear'],
      answers: [
        'Rating 1/5: Frequent hidden costs and steep maintenance hikes causing resentment.',
        'Rating 2/5: Subpar fee predictability with unexpected annual surcharges.',
        'Rating 3/5: Moderate transparency with standard annual increases.',
        'Rating 4/5: Transparent, fair financial charges.',
        'Rating 5/5: 100% predictable, transparent maintenance fee structure.'
      ]
    }
  ],

  'child-safety-play': [
    {
      id: 'cs_vehicle_speeds',
      topicId: 'child-safety-play',
      mainQuestionText: 'Is the society safe for children to play freely without traffic or equipment hazards?',
      questionText: 'Do cars speed inside internal driveways near children play areas, posing a safety risk for toddlers?',
      type: 'single-choice',
      options: [
        'Strict 10 km/h Speed Limit & Vehicle-Free Vehicle Podium Zone',
        'Slow Vehicle Speeds Monitored by Security Guards',
        'Lax Control (Vehicles Move Fast near Play Areas)',
        'Dangerous Speeding Risk in Internal Driveways'
      ],
      answers: [
        'Podium layout is 100% vehicle-free, guaranteeing child safety from internal traffic.',
        'Security guards strictly enforce slow vehicle speeds around common play areas.',
        'Lax speed controls allow delivery vehicles and resident cars to drive fast near play zones.',
        'Dangerous vehicle speeding inside internal driveways forces parents to supervise children constantly.'
      ]
    },
    {
      id: 'cs_equipment_condition',
      topicId: 'child-safety-play',
      mainQuestionText: 'Is the society safe for children to play freely without traffic or equipment hazards?',
      questionText: 'Is children play equipment well-maintained with rubberized impact flooring, or rusted and broken?',
      type: 'single-choice',
      options: [
        'Spotless & High-Quality Play Equipment with Soft Rubber Flooring',
        'Well-Maintained Standard Play Area',
        'Aging Equipment with Occasional Maintenance Delays',
        'Neglected Broken Swings / Hard Surface Hazard'
      ],
      answers: [
        'Children play zone features soft shock-absorbing rubber flooring and pristine play equipment.',
        'Play equipment is well-maintained and safe for kids.',
        'Aging play equipment suffers occasional maintenance delays.',
        'Neglected swings, broken slides, and hard concrete surfaces present injury hazards.'
      ]
    },
    {
      id: 'cs_cctv_play_coverage',
      topicId: 'child-safety-play',
      mainQuestionText: 'Is the society safe for children to play freely without traffic or equipment hazards?',
      questionText: 'Are play areas and garden lawns covered by 24x7 active CCTV cameras for child safety?',
      type: 'single-choice',
      options: [
        '100% Comprehensive CCTV Monitoring Across All Play Zones',
        'Adequate CCTV Coverage Active',
        'Blind Spots in Play Areas',
        'Inoperative / Sparse CCTV Cameras'
      ],
      answers: [
        'Active CCTV cameras thoroughly monitor all play zones and garden pathways with zero blind spots.',
        'Adequate CCTV coverage monitors main play areas reliably.',
        'Unmonitored blind spots exist around play zones and garden corridors.',
        'Sparse or non-functional CCTV cameras reduce child security monitoring.'
      ]
    },
    {
      id: 'cs_overall_rating',
      topicId: 'child-safety-play',
      mainQuestionText: 'Is the society safe for children to play freely without traffic or equipment hazards?',
      questionText: 'Overall rating of child safety, play zone maintenance quality, and toddler security (1 to 5):',
      type: 'rating',
      options: ['1 - Unsafe & Neglected', '2 - Poor', '3 - Moderate', '4 - Safe', '5 - Exceptionally Safe & Top-Tier'],
      answers: [
        'Rating 1/5: Unsafe, neglected environment unsuited for raising young children.',
        'Rating 2/5: Subpar child safety controls requiring constant adult vigilance.',
        'Rating 3/5: Moderate play area safety for standard apartment complexes.',
        'Rating 4/5: Safe, child-friendly environment with well-kept play zones.',
        'Rating 5/5: Exceptionally safe, car-free child haven with top-tier play facilities.'
      ]
    }
  ],

  'pet-rules': [
    {
      id: 'pr_resident_attitude',
      topicId: 'pet-rules',
      mainQuestionText: 'Is the society pet-friendly and harmonious, or host to constant pet complaints?',
      questionText: 'Are residents welcoming toward pets, or do pet owners face hostile complaints, stare-downs, and friction?',
      type: 'single-choice',
      options: [
        '100% Pet-Friendly & Welcoming Atmosphere',
        'Friendly with Clear Published Walking Guidelines',
        'Noticeable Resident Friction towards Pet Owners',
        'Hostile Attitude & Heavy Restrictions'
      ],
      answers: [
        'Warm, pet-friendly community atmosphere where pets are genuinely welcomed.',
        'Friendly community with clear, published pet-walking and leash guidelines.',
        'Noticeable resident friction and frequent complaints directed at pet owners.',
        'Hostile resident attitude and aggressive pet bans create severe daily tension.'
      ]
    },
    {
      id: 'pr_walking_tracks',
      topicId: 'pet-rules',
      mainQuestionText: 'Is the society pet-friendly and harmonious, or host to constant pet complaints?',
      questionText: 'Are there dedicated pet walking tracks, or are pets banned from stepping on main garden lawns?',
      type: 'single-choice',
      options: [
        'Dedicated Clean Pet Walking Track Available',
        'Clear Poop Scoop Guidelines Followed Responsibly',
        'Unclear Guidelines leading to Poop Hygiene Friction',
        'Strict Bans on Pets in Common Gardens'
      ],
      answers: [
        'Dedicated pet-walking trail complete with waste disposal stations.',
        'Responsible pet owners follow clear poop-scoop and leash guidelines.',
        'Unclear pet rules cause occasional arguments over garden hygiene.',
        'Strict bans prohibit pets from walking in common gardens or green lawns.'
      ]
    },
    {
      id: 'pr_elevator_rules',
      topicId: 'pet-rules',
      mainQuestionText: 'Is the society pet-friendly and harmonious, or host to constant pet complaints?',
      questionText: 'Are pets allowed in all passenger elevators, or forced into service lifts during rush hours?',
      type: 'single-choice',
      options: [
        'Pets Allowed in All Elevators Courteously',
        'Service Lift Designated for Pets during Peak Hours',
        'Strict Elevator Restrictions for Pets',
        'Frequent Arguments over Pets in Elevators'
      ],
      answers: [
        'Pets are welcome in all elevators with polite neighbor etiquette.',
        'Service lift is designated for pets during morning peak hours to manage crowding.',
        'Strict rules restrict pets from passenger elevators.',
        'Frequent verbal arguments erupt over pets entering elevators with neighbors.'
      ]
    },
    {
      id: 'pr_overall_rating',
      topicId: 'pet-rules',
      mainQuestionText: 'Is the society pet-friendly and harmonious, or host to constant pet complaints?',
      questionText: 'Overall rating of pet friendliness, walking convenience, and community harmony (1 to 5):',
      type: 'rating',
      options: ['1 - Hostile & Restrictive', '2 - Subpar', '3 - Moderate', '4 - Friendly', '5 - Exceptionally Pet-Friendly'],
      answers: [
        'Rating 1/5: Hostile and overly restrictive environment for pet parents.',
        'Rating 2/5: Subpar pet setup with frequent resident friction.',
        'Rating 3/5: Moderate pet tolerance following standard rules.',
        'Rating 4/5: Friendly, welcoming environment for pets.',
        'Rating 5/5: Exceptionally pet-friendly sanctuary with dedicated amenities.'
      ]
    }
  ],

  'insider-truths': [
    {
      id: 'it_buy_again_sentiment',
      topicId: 'insider-truths',
      mainQuestionText: 'Knowing everything you know today after living here, would you buy or rent in this society again?',
      questionText: 'If you could turn back time, would you buy or rent in this society again without hesitation?',
      type: 'single-choice',
      options: [
        '100% Would Buy / Rent Here Again Without Hesitation',
        'Satisfied Overall (Minor Acceptable Trade-Offs)',
        'Neutral Sentiment (Meets Basic Functional Expectations)',
        'Would Look for Alternative Better Societies'
      ],
      answers: [
        '100% conviction: would happily buy or rent in this society again without hesitation.',
        'Overall satisfied living experience; minor trade-offs are acceptable.',
        'Neutral sentiment; meets basic living needs but lacks standout charm.',
        'Would actively seek alternative, better-managed societies in the area.'
      ]
    },
    {
      id: 'it_unvarnished_surprises',
      topicId: 'insider-truths',
      mainQuestionText: 'Knowing everything you know today after living here, would you buy or rent in this society again?',
      questionText: 'What is the single biggest unvarnished truth or trade-off that brokers and builders hide from buyers?',
      type: 'single-choice',
      options: [
        'Peak Morning Lift Waiting Queues',
        'Summer Water Pressure Drops on High Floors',
        'Main Road Traffic Noise on Lower Floors',
        'Tight Parking Slot Alignment'
      ],
      answers: [
        'Brokers hide the severe morning elevator waiting bottlenecks.',
        'Builders hide summer water pressure drops on upper floors.',
        'Sellers hide constant main road traffic noise on lower balconies.',
        'Tight parking slot geometry makes daily parking frustrating for large cars.'
      ]
    },
    {
      id: 'it_top_positives',
      topicId: 'insider-truths',
      mainQuestionText: 'Knowing everything you know today after living here, would you buy or rent in this society again?',
      questionText: 'Which single standout positive aspect makes living in this society genuinely worth every rupee?',
      type: 'single-choice',
      options: [
        'Excellent Highway & Metro Connectivity',
        '24x7 Reliable Power Backup and Water',
        'Spotless Society Grounds & Gardens',
        'Friendly & Helpful Neighbor Community'
      ],
      answers: [
        'Unbeatable highway and metro connectivity saves hours of commuting time daily.',
        'Rock-solid 24x7 power backup and abundant water supply offer complete peace of mind.',
        'Spotless grounds, lush landscaping, and clean swimming pools elevate daily life.',
        'A warm, cultured, and supportive neighbor community makes living here joyful.'
      ]
    },
    {
      id: 'it_overall_rating',
      topicId: 'insider-truths',
      mainQuestionText: 'Knowing everything you know today after living here, would you buy or rent in this society again?',
      questionText: 'Overall Net Promoter Score & recommendation for prospective buyers spending ₹50L-₹5Cr (1 to 5):',
      type: 'rating',
      options: ['1 - Do Not Recommend', '2 - Below Average', '3 - Acceptable Choice', '4 - Highly Recommended', '5 - Top Choice Society'],
      answers: [
        'Rating 1/5: Do not buy or rent here; severe hidden flaws risk buyer regret.',
        'Rating 2/5: Below average living experience with notable unaddressed issues.',
        'Rating 3/5: Acceptable choice if priced attractively compared to neighbors.',
        'Rating 4/5: Highly recommended society providing solid quality of life.',
        'Rating 5/5: Top choice luxury society—a premier investment guarantee.'
      ]
    }
  ]
};

export function getMainQuestionForTopic(topicId: string): string {
  const custom = loadCustomExcelDataFromStorage();
  if (custom && custom.topics) {
    const t = custom.topics.find(top => top.id === topicId);
    if (t && t.mainQuestion && t.mainQuestion.trim()) {
      return t.mainQuestion.trim();
    }
  }
  const defaultMq = MAIN_QUESTIONS_CATALOG.find(mq => mq.topicId === topicId);
  if (defaultMq && defaultMq.title) return defaultMq.title;
  const topic = CONTRIBUTOR_TOPICS.find(t => t.id === topicId);
  if (topic) return `How is the overall performance and experience regarding ${topic.title}?`;
  return 'How is the overall resident living experience?';
}

// Getters that prioritize custom uploaded Excel data from LocalStorage
export function getActiveTopics(): TopicDefinition[] {
  const custom = loadCustomExcelDataFromStorage();
  if (custom && custom.topics && custom.topics.length > 0) {
    return custom.topics.map(t => ({
      ...t,
      mainQuestion: t.mainQuestion || getMainQuestionForTopic(t.id)
    }));
  }
  return CONTRIBUTOR_TOPICS.map(t => ({
    ...t,
    mainQuestion: getMainQuestionForTopic(t.id)
  }));
}

export function getActiveQuestionsMap(): Record<string, StructuredSubQuestion[]> {
  const custom = loadCustomExcelDataFromStorage();
  if (custom && custom.questionsMap && Object.keys(custom.questionsMap).length > 0) {
    return custom.questionsMap;
  }
  return STRUCTURED_QUESTIONS_DATABASE;
}

export function getMainQuestionsCatalog(): MainQuestionItem[] {
  const activeTopics = getActiveTopics();
  const activeQuestionsMap = getActiveQuestionsMap();

  return activeTopics.map(t => {
    const defaultMq = MAIN_QUESTIONS_CATALOG.find(mq => mq.topicId === t.id);
    const mainQTitle = t.mainQuestion || defaultMq?.title || getMainQuestionForTopic(t.id);
    const subQs = activeQuestionsMap[t.id] || [];

    const followUpQuestions: FollowUpQuestionConfig[] = subQs.map((sq, idx) => ({
      id: sq.id || `${t.id}_q_${idx + 1}`,
      questionText: sq.questionText,
      inputType: (sq.type === 'rating' || sq.inputType === 'rating' ? 'rating' : 'radio') as any,
      options: sq.options || ['Yes', 'No', 'Sometimes'],
      helpText: sq.helpText
    }));

    return {
      id: defaultMq?.id || `mq_${t.id}`,
      topicId: t.id,
      category: t.category || 'General',
      title: mainQTitle,
      description: t.description || `Evaluates key operational and resident living experience factors for ${t.title}.`,
      iconName: t.iconName || defaultMq?.iconName || 'HelpCircle',
      badge: defaultMq?.badge || 'Resident Insight',
      backgroundFields: defaultMq?.backgroundFields || [
        { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
        { id: 'yearsLiving', label: 'Tenure of Stay', inputType: 'select', options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'], defaultValue: '3 - 5 years' }
      ],
      generateRelevantExperience: defaultMq?.generateRelevantExperience || ((bg) => `${bg.yearsLiving || '3+ years'} resident experiencing ${t.title}.`),
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : (defaultMq?.followUpQuestions || [])
    };
  });
}

// DETERMINISTIC CONVERSATIONAL SCENARIO MAPPER (HUMAN EDITORIAL LIBRARY - NO AI GENERATION)
// Converts selected answers into simple, natural, unvarnished Indian resident conversations.
export function generateHumanConversationalSummary(
  topicId: string,
  answers: Record<string, string>,
  yearsLiving: number = 3,
  residentType: 'Owner' | 'Tenant' = 'Owner'
): { summaryText: string; scenarioId: string } {
  const activeTopics = getActiveTopics();
  const topic = activeTopics.find(t => t.id === topicId);
  const topicTitle = topic ? topic.title : topicId;

  // Compute a deterministic scenario seed from the answer string combination
  const answerValues = Object.values(answers).join(' | ');
  let hash = 0;
  for (let i = 0; i < answerValues.length; i++) {
    hash = (hash << 5) - hash + answerValues.charCodeAt(i);
    hash |= 0;
  }
  const scenarioNum = Math.abs(hash % 240) + 1; // Scenario #1 to #240
  const scenarioId = `Scenario #${scenarioNum}`;

  const livingDurationText = yearsLiving === 1 ? 'one year' : `${yearsLiving} years`;
  const residentTypeWord = residentType === 'Owner' ? 'homeowner' : 'tenant';

  // Universal unvarnished human conversation assembler for all topics
  const ansList = Object.entries(answers)
    .map(([_, val]) => val)
    .filter(val => val && val !== 'Skipped');

  const firstAns = ansList[0] || 'on-ground realities require attention to peak usage hours';
  const secondAns = ansList[1] || 'facility performance varies between seasons';
  const thirdAns = ansList[2] || 'thorough pre-purchase verification is strongly recommended';

  const naturalOpenings = [
    `Having lived here as a ${residentTypeWord} for ${livingDurationText}, here is what you genuinely need to know about ${topicTitle.toLowerCase()}: `,
    `As a long-term ${residentTypeWord} of ${livingDurationText}, here is our unvarnished insight on ${topicTitle.toLowerCase()}: `,
    `If my own family were buying an apartment here today, here is what I would tell them regarding ${topicTitle.toLowerCase()}: `
  ];

  const opening = naturalOpenings[Math.abs(hash) % naturalOpenings.length];
  const conversationText = `${opening}${firstAns}. From a practical standpoint, ${secondAns.toLowerCase()}. For prospective buyers, ${thirdAns.toLowerCase()}.`;

  return {
    summaryText: conversationText,
    scenarioId
  };
}
