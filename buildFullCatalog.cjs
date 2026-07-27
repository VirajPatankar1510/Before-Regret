const fs = require('fs');
const path = require('path');

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function assertOptions(options, label) {
  options.forEach((opt, i) => {
    const wc = countWords(opt);
    if (wc < 45 || wc > 100) {
      throw new Error(`[INVALID WORD COUNT] ${label} -> Option ${i + 1}: ${wc} words (Required: 45-100)\nContent: "${opt}"`);
    }
  });
}

function makeRatingOptions(categoryName) {
  const opts = [
    `1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding ${categoryName} in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.`,
    `2 Stars (Subpar & Below Expectations): Look, the situation with ${categoryName} is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.`,
    `3 Stars (Average & Manageable): Honestly speaking, the experience with ${categoryName} here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.`,
    `4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with ${categoryName} in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.`,
    `5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for ${categoryName} in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind.`
  ];
  assertOptions(opts, `Rating for ${categoryName}`);
  return opts;
}

const topicsData = [
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
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'yearsLiving', label: 'Tenure of Stay', inputType: 'select', options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'], defaultValue: '3 - 5 years' },
      { id: 'floorRange', label: 'Floor Level in Tower', inputType: 'select', options: ['Ground - 5th Floor', '6th - 12th Floor', '13th - 20th Floor', 'Top Floors (20+)'], defaultValue: '13th - 20th Floor' }
    ],
    generateRelevantExperience: (bg) => `${bg.yearsLiving || '3-5 years'} ${(bg.residentType || 'Owner').toLowerCase()} living on ${(bg.floorRange || '13th - 20th Floor').toLowerCase()} experiencing daily tap water pressure.`,
    followUpQuestions: [
      {
        id: 'wp_mq_1',
        questionText: 'Does shower pressure drop significantly during morning peak hours (7:00 AM - 9:30 AM)?',
        inputType: 'radio',
        options: [
          'To be very honest with you, water pressure in our tower is absolutely smooth and consistent throughout the day. Even during peak morning rush hours from 7 to 9 AM when everyone is taking showers before heading to office, we get excellent flow in both bathrooms without any annoying pressure drop at all. Truly zero issues experienced so far.',
          'Look, in our building, around 7:30 to 9:00 AM in the morning when most residents are getting ready for office, the shower pressure definitely drops quite a bit. It does not stop completely, but the flow becomes noticeably weaker compared to afternoons. You get used to it after a few weeks, but it is good to keep in mind before taking a quick morning shower.',
          'Honestly speaking, morning time pressure in our upper floor shower is quite frustrating. Between 8 AM and 9 AM, if somebody runs the kitchen tap or washing machine simultaneously, the shower flow drops to a thin trickle. We actually had to install a small domestic booster pump inside our bathroom to manage decent morning water pressure.',
          'Main problem in our society is during morning peak hours when water pressure drops severely. Many times around 8 AM there is hardly any water coming in the shower head and you have to use bucket and mug instead. Society committee keeps saying they will fix booster pumps, but problem is still continuing every single morning.'
        ]
      },
      {
        id: 'wp_mq_2',
        questionText: 'How is tap and shower water pressure on upper floors (10th floor and above) compared to lower floors?',
        inputType: 'radio',
        options: [
          'Look, on upper floors like our 14th floor, pressure is surprisingly strong and consistent because the society overhead booster pumps work continuously. Taps and showers work with full force round the clock, so living on high floors does not mean weak water pressure at all. Very pleased with the plumbing work done here.',
          'Honestly speaking, upper floor pressure is decent enough for daily usage, though lower floor residents get slightly more force in their showers. Society maintenance team tunes the pressure regulating valves regularly, so while it is not extraordinarily high, you will get smooth continuous flow without any major complaints.',
          'To be frank, upper floors face occasional pressure drops whenever the central booster pump undergoes maintenance or experiences power glitches. We sometimes get air locks in pipes which causes sputtering taps for 10-15 minutes until the air clears out. It happens once or twice a month, especially on Sunday mornings.'
        ]
      },
      {
        id: 'wp_mq_3',
        questionText: 'When multiple taps or washing machines run simultaneously inside your flat, does tap pressure drop?',
        inputType: 'radio',
        options: [
          'In our flat, even if the washing machine is filling up and someone is taking a shower while kitchen utensils are being washed, tap pressure remains completely rock solid. The main internal inlet pipe diameter is quite large, so running multiple outlets simultaneously never causes any pressure reduction anywhere inside the house.',
          'Look, when the washing machine starts pulling water, there is a minor noticeable drop in the shower flow, but it is manageable. It is not severe enough to burn or freeze you, but you can feel the pressure softening slightly until the washing machine inlet valve closes. Quite standard for most apartments.',
          'Actually speaking, multi-tap usage is a major inconvenience in our apartment. If the maid opens the kitchen sink tap while you are in the shower, the shower pressure drops dramatically to a weak dribble. We have to tell family members not to use kitchen or balcony taps when someone is bathing.'
        ]
      },
      {
        id: 'wp_mq_4',
        questionText: 'Do water taps experience sudden air locks, sputtering, or pressure surging when turned on?',
        inputType: 'radio',
        options: [
          'Never faced any sputtering or air lock issues since we moved in. Taps open smoothly with uniform water flow every single time, whether early morning or late night. The plumbing vents on terrace overhead tanks are maintained properly by society plumbers.',
          'Occasional pipe sputtering happens only after major overhead tank cleaning or main pipeline repair work. When supply restarts after a two-hour shutdown, taps cough out air for about thirty seconds with some brownish water before flowing completely clear and smooth again.',
          'Pipe air locks and sudden pressure surges happen quite frequently in our wing, almost every couple of weeks. When you turn on the washbasin tap, it sputters violently and splashes water all over your clothes. Plumber says overhead tank air release valves get stuck regularly.'
        ]
      },
      {
        id: 'wp_mq_5',
        questionText: 'How is water pressure during late night hours (after 11 PM)?',
        inputType: 'radio',
        options: [
          'Night time water pressure is exceptionally strong and continuous 24x7. Since total society water usage is very low after 11 PM, showers and bathroom taps work with maximum force. Great for late night hot showers after coming home from work.',
          'Night pressure is slightly lower because society turns off auxiliary booster pumps after 11 PM to save electricity. However, natural gravity flow from overhead tanks is still sufficient for brushing, washbasin use, and midnight flush tanks without any hassle.',
          'After 11 PM, water pressure drops significantly because overhead supply valves are throttled by security guards to prevent overnight pipe bursts. If you take a bath late night, shower flow is very slow and filling a bucket takes almost five to ten minutes.'
        ]
      },
      {
        id: 'wp_mq_6',
        questionText: 'Rate overall water pressure consistency and shower satisfaction (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Water Pressure')
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
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'yearsLiving', label: 'Tenure of Stay', inputType: 'select', options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'], defaultValue: '3 - 5 years' },
      { id: 'purifierType', label: 'Drinking Water Solution', inputType: 'select', options: ['RO Purifier', 'UV/UF Purifier', 'Bottled 20L Cans', 'Tap Filter Only'], defaultValue: 'RO Purifier' }
    ],
    generateRelevantExperience: (bg) => `${bg.yearsLiving || '3-5 years'} ${(bg.residentType || 'Owner').toLowerCase()} using an in-flat ${(bg.purifierType || 'RO Purifier').toLowerCase()}.`,
    followUpQuestions: [
      {
        id: 'wq_mq_1',
        questionText: 'Is hard water scaling causing white stains or damage to bathroom taps, showerheads, and geysers?',
        inputType: 'radio',
        options: [
          'To be very honest with you, water quality in our society is surprisingly soft and clean. We get direct municipal supply without heavy mineral content, so our bathroom chrome fittings, glass shower partitions, and geysers stay spotless without any white calcium stains or scaling even after years of continuous daily usage.',
          'Look, there is a mild white calcium scaling on bathroom taps and shower nozzles after a few weeks, but it is easily removable. We clean the aerators once every month using vinegar or standard bathroom cleaner spray, and it works completely fine without damaging the expensive bathroom fixtures or plumbing lines.',
          'Honestly speaking, water hardness in our locality is quite high and causes frequent headaches. White mineral crust builds up rapidly on shower heads, blocking small spray holes every fortnight. Geyser heating elements also corrode every two years, so installing a dedicated tap water softener is almost essential for long term relief.',
          'Main problem here is severe groundwater hardness when tanker water gets mixed in summer. Tap aerators choke continuously, hair falls quickly after washing, and glass bathroom doors turn chalky white within days. Society urgently needs a centralized water softening plant to protect flat plumbing and sanitary fittings.'
        ]
      },
      {
        id: 'wq_mq_2',
        questionText: 'What drinking water filtration setup is necessary for safe domestic drinking?',
        inputType: 'radio',
        options: [
          'In our society, municipal supply water TDS stays under 150 PPM, so a basic UV or UF water purifier is more than enough for safe drinking. The water tastes sweet and clean directly from kitchen tap, so high-cost multi-stage RO purifiers are really not necessary at all.',
          'Look, TDS levels fluctuate between 350 and 600 PPM depending on municipal supply and tanker mixing. Having a modern multi-stage RO purifier with mineral cartridge is essential for every flat. Once filtered through RO, drinking water tastes completely pure, odorless, and safe for young children and elderly family members.',
          'Honestly speaking, many families in our wing prefer ordering 20-liter branded drinking water cans for cooking and drinking because tap water TDS changes drastically. Buying water cans costs around 600 rupees per month, but gives complete peace of mind regarding stomach health and drinking safety.',
          'Main concern is tap water is totally unfit for drinking or cooking without heavy multi-layer filtration. Raw water frequently smells earthy during rains and carries high dissolved solids. Even for washing vegetables or making tea, boiling or RO filtration is compulsory to avoid stomach infections.'
        ]
      },
      {
        id: 'wq_mq_3',
        questionText: 'How clean, clear, and odour-free is the flush water supply in bathrooms?',
        inputType: 'radio',
        options: [
          'Recycled flush water coming from society Sewage Treatment Plant is crystal clear and completely odorless. STP filtration plant is maintained expertly by certified technicians, so toilet bowls remain clean without any yellow stains, foul sewage smell, or chemical odor inside guest bathrooms.',
          'Look, flush water is generally clear and odorless on normal days, but during peak hot summer months, you get a slight chemical or chlorine smell when flushing toilets. It is not overwhelming or smelly, but you can tell recycled STP water is treated with excess chlorine tablets.',
          'Honestly speaking, flush water in our tower occasionally comes with a yellowish tint and mild unpleasant odor, especially on Sunday mornings. Sewage treatment plant air blowers break down frequently, causing untreated water to circulate in flushing lines until residents complain on society mobile app.'
        ]
      },
      {
        id: 'wq_mq_4',
        questionText: 'Have you noticed sediment, rust, or turbidity in kitchen or bathroom tap water?',
        inputType: 'radio',
        options: [
          'Water is crystal clear 365 days a year without any muddy sediment, rust particles, or cloudiness. Society underground sumps and overhead tanks are cleaned and disinfected every quarter, so tap water quality is top notch year round.',
          'Occasional mild brownish sediment appears in kitchen taps only after underground tank cleaning or main municipal pipe repair work. It lasts for barely five minutes when you flush the line, after which water flows completely clear again.',
          'Muddy turbidity and fine silt particles appear quite frequently in bathroom taps during monsoon months. We have to tie cloth filters on washbasin taps to catch dirt particles, otherwise tap aerators choke constantly.'
        ]
      },
      {
        id: 'wq_mq_5',
        questionText: 'How frequently do tap aerators or showerheads get clogged by white mineral scaling?',
        inputType: 'radio',
        options: [
          'Aerators remain completely clear round the year without any mineral clogging. We have never had to unscrew shower nozzles or tap filters for descaling since moving into this flat.',
          'Aerators need simple cleaning once every three to four months. A quick soak in citric acid or vinegar clears the tiny mineral deposits easily without calling a plumber.',
          'Shower nozzles and tap aerators choke almost every two to three weeks due to heavy white scale deposits. Shower spray gets sprayed in odd side directions until cleared manually.'
        ]
      },
      {
        id: 'wq_mq_6',
        questionText: 'Rate overall water purity, clarity, and tap health satisfaction (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Water Quality & Tap Health')
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
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'yearsLiving', label: 'Tenure of Stay', inputType: 'select', options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'], defaultValue: '3 - 5 years' }
    ],
    generateRelevantExperience: (bg) => `${bg.yearsLiving || '3-5 years'} ${(bg.residentType || 'Owner').toLowerCase()} relying on society water supply tanks.`,
    followUpQuestions: [
      {
        id: 'wa_mq_1',
        questionText: 'Is municipal tap water available 24x7 without scheduled daily supply cuts?',
        inputType: 'radio',
        options: [
          'To be very honest with you, water supply in our society is 100% continuous 24 hours a day, 365 days a year. Society has massive underground storage sumps that buffer municipal supply seamlessly, so we have never experienced fixed water timing restrictions or empty taps in our flat.',
          'Look, water is supplied continuously throughout the day, but society management strictly monitors overhead tank levels. During scheduled maintenance or cleaning days, water supply is turned off for two hours in the afternoon, but ample advance notice is always posted on society WhatsApp group.',
          'Honestly speaking, water is available only during fixed time slots morning and evening. Taps run from 6 AM to 9 AM in morning and 6 PM to 9 PM in evening to conserve water. Living with fixed water timings requires storing bucket water in bathrooms for afternoon usage.',
          'Main issue in our society is frequent water cuts and erratic supply timings. Tanks run completely dry randomly during weekends, forcing families to wait for emergency tanker arrivals. Storing plastic drums filled with water inside bathrooms is a permanent daily struggle for residents.'
        ]
      },
      {
        id: 'wa_mq_2',
        questionText: 'Are private water tankers required during peak summer months (April to June)?',
        inputType: 'radio',
        options: [
          'Zero water tankers are required even during peak summer months. Our society has dedicated municipal pipeline connection with abundant water allocation, so we never spend a single extra rupee on private water tankers throughout the year.',
          'Look, during May and June peak summer heat, municipal supply drops slightly, so society orders a few private tankers daily to supplement the main underground sump. Maintenance charges increase marginally by 200 rupees during summer, but water flow inside flats remains uninterrupted.',
          'Honestly speaking, summer water crisis is quite severe here. From April to July, society depends heavily on 30 to 40 private water tankers every single day. Water bills shoot up drastically, and management enforces strict water rationing rules during afternoon hours.',
          'Main problem every summer is total dependency on expensive water tanker mafia. Tanker rates skyrocket, society runs out of funds, and severe water cuts are imposed where water is supplied for barely two hours daily. It causes immense frustration for all residents.'
        ]
      },
      {
        id: 'wa_mq_3',
        questionText: 'How often do unscheduled pipeline leakage repairs cause water shutdowns per month?',
        inputType: 'radio',
        options: [
          'Unscheduled pipeline shutdowns practically never happen here because internal CPVC plumbing network is brand new and built with top-quality materials. We have enjoyed completely uninterrupted water supply without emergency repair cuts.',
          'Occasional pipeline repair shutdowns happen maybe once in three or four months when a main riser pipe joints leak. Plumber fixes the line within two to three hours, so water supply is restored before evening without causing major inconvenience.',
          'Frequent pipe bursts and leakage repairs cause sudden unscheduled water cuts at least twice every month. Underground distribution pipes are old and crack frequently, leaving towers without water for five to six hours unexpectedly.'
        ]
      },
      {
        id: 'wa_mq_4',
        questionText: 'How much prior notice does society management provide before scheduled water supply maintenance shutdowns?',
        inputType: 'radio',
        options: [
          'Society management always sends clear mobile app notifications and WhatsApp broadcast alerts at least 24 to 48 hours in advance before any scheduled tank cleaning or pipe maintenance. Gives us plenty of time to store necessary water.',
          'Notice is usually given on the morning of maintenance work via notice board posters and WhatsApp group text. Gives barely an hour or two to fill buckets, but manageable if you are awake early.',
          'Sudden water supply shutdowns happen without any advance notice or announcement whatsoever. You open the kitchen tap in the afternoon only to find zero water, and security guards have no idea when supply will be restored.'
        ]
      },
      {
        id: 'wa_mq_5',
        questionText: 'Do overhead water tanks get refilled reliably every day without running completely dry?',
        inputType: 'radio',
        options: [
          'Overhead water tanks are equipped with automated water level sensors that trigger pump motors automatically. Overhead tanks remain consistently full, so flat taps never run dry due to pump operator negligence.',
          'Overhead tanks are refilled reliably on most days, but once in a while the pump operator forgets to switch on pumps on time, causing temporary ten-minute dry tap periods until pumps kick in.',
          'Overhead tanks frequently run bone dry during afternoon hours because manual pump operator is highly careless. Taps suddenly stop working while washing dishes or taking showers, requiring repeated calls to security.'
        ]
      },
      {
        id: 'wa_mq_6',
        questionText: 'Rate overall 24x7 water availability and summer peace of mind (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('24x7 Water Availability & Summer Peace of Mind')
      }
    ]
  }
];

// Helper script writer to dump code to disk
const generatedTsContent = `import { ContributorQuestion } from '../types';
import { loadCustomExcelDataFromStorage } from '../utils/excelEngine';

export interface TopicDefinition {
  id: string;
  title: string;
  category: string;
  iconName: string;
  description: string;
  defaultAnsweredCount: number;
}

export interface StructuredSubQuestion {
  id: string;
  topicId: string;
  questionText: string;
  type?: 'single-choice' | 'yes-no' | 'rating' | 'frequency' | 'checkbox-group' | string;
  inputType?: string;
  options: string[];
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

  const label1 = \`Resident Profile: \${residentType} (\${yearsLiving})\`;

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
    ? \`Living Context: \${remainingValues.join(' • ')}\`
    : \`Living Context: Verified Resident\`;

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

export const CONTRIBUTOR_TOPICS: TopicDefinition[] = [
  { id: 'water-pressure', title: 'Water Pressure', category: 'Water & Plumbing', iconName: 'Gauge', description: 'Peak morning hour shower pressure, upper floor booster pump reliability, pressure consistency across taps', defaultAnsweredCount: 18 },
  { id: 'water-quality', title: 'Water Quality', category: 'Water & Plumbing', iconName: 'Droplets', description: 'Water clarity/taste, hard water tap scaling & geyser corrosion, in-flat RO/bottled cans necessity, STP flush odor', defaultAnsweredCount: 16 },
  { id: 'water-availability', title: 'Water Availability', category: 'Water & Plumbing', iconName: 'Droplet', description: '24x7 municipal supply continuity, summer tanker dependency, emergency rationing, pipeline shutdown frequency', defaultAnsweredCount: 15 },
  { id: 'parking-usability', title: 'Parking Slot Sizing & Usability', category: 'Parking & Vehicles', iconName: 'Car', description: 'Actual slot dimensions, pillar obstruction tightness, back-to-back dependent slots, double parking & blocking', defaultAnsweredCount: 14 },
  { id: 'visitor-parking', title: 'Visitor Parking & Guest Access', category: 'Parking & Vehicles', iconName: 'Users', description: 'Visitor slot availability, gate entry pass process, weekend evening filling rate, street parking safety', defaultAnsweredCount: 12 },
  { id: 'ev-charging', title: 'EV Charging Infrastructure', category: 'Parking & Vehicles', iconName: 'Zap', description: 'Personal EV charger installation NOC, electrical transformer capacity, sub-meter billing, basement safety', defaultAnsweredCount: 9 },
  { id: 'wfh-tranquility', title: 'WFH Tranquility & Soundproofing', category: 'Noise & Environment', iconName: 'VolumeX', description: 'WFH call tranquility, neighbor wall/ceiling sound leakage, footstep/TV noise transfer, daytime courtyard echo', defaultAnsweredCount: 13 },
  { id: 'traffic-party-noise', title: 'Road Traffic & Event Noise', category: 'Noise & Environment', iconName: 'Volume2', description: 'Main road traffic horn noise on balconies, weekend party/clubhouse music, 10 PM noise cutoff enforcement', defaultAnsweredCount: 11 },
  { id: 'power-cuts', title: 'Power Cut Frequency & Grid Quality', category: 'Electricity & Power', iconName: 'ZapOff', description: 'Locality power cut frequency, voltage fluctuation risk to appliances, summer peak load power trips', defaultAnsweredCount: 10 },
  { id: 'generator-backup', title: 'Generator Backup & AC Coverage', category: 'Electricity & Power', iconName: 'BatteryCharging', description: 'In-flat DG backup coverage for ACs vs basic lights, auto-switchover speed, diesel surcharge billing', defaultAnsweredCount: 12 },
  { id: 'lift-waiting-times', title: 'Lift Waiting Times & Morning Rush', category: 'Elevators & High-Rise', iconName: 'Clock', description: 'Morning peak hour lift wait times (8-9:30 AM), ground lobby queues, upper floor elevator speed', defaultAnsweredCount: 14 },
  { id: 'lift-breakdown-speed', title: 'Lift Reliability & Repair Speed', category: 'Elevators & High-Rise', iconName: 'Wrench', description: 'Elevator breakdown frequency per month, AMC technician repair turnaround time, service lift for moving', defaultAnsweredCount: 10 },
  { id: 'doorstep-deliveries', title: 'Quick Commerce & Doorstep Deliveries', category: 'Daily Convenience', iconName: 'Package', description: 'Blinkit/Zepto 10-min delivery ease, Swiggy rider gate entry speed, cab drop at tower lobby doorstep', defaultAnsweredCount: 15 },
  { id: 'maid-availability', title: 'Domestic Help & Maid Availability', category: 'Daily Convenience', iconName: 'UserCheck', description: 'Ease of finding verified maids & cooks, maid union fixed rate cards, gate digital pass approval speed', defaultAnsweredCount: 11 },
  { id: 'monsoon-gate-flooding', title: 'Monsoon Gate Flooding & Road Access', category: 'Monsoon Realities', iconName: 'CloudRain', description: 'Entrance gate waterlogging, stormwater drainage clearance speed, delivery/cab disruption during heavy rain', defaultAnsweredCount: 13 },
  { id: 'monsoon-seepage', title: 'Monsoon Seepage & Dampness', category: 'Monsoon Realities', iconName: 'ShieldAlert', description: 'Basement parking water leakage, automated sump pump reliability, flat wall dampness & ceiling dripping', defaultAnsweredCount: 12 },
  { id: 'committee-fairness', title: 'Managing Committee Rules & Tenant Equality', category: 'Society Governance', iconName: 'Scale', description: 'Owner vs tenant rule equality, arbitrary fine enforcement, committee responsiveness, AGM audit transparency', defaultAnsweredCount: 14 },
  { id: 'renovation-movein-noc', title: 'Renovation NOCs & Move-In Permissions', category: 'Society Governance', iconName: 'FileCheck', description: 'Turnaround time for renovation NOCs, move-in shifting fees, elevator padding restrictions, deposit refund ease', defaultAnsweredCount: 9 },
  { id: 'hidden-charges-hikes', title: 'Hidden Costs & Maintenance Hikes', category: 'Society Governance', iconName: 'Receipt', description: 'Move-in surprise charges, annual maintenance fee inflation, separate gym/pool user fees, festival collections', defaultAnsweredCount: 11 },
  { id: 'child-safety-play', title: 'Child Safety & Play Area Condition', category: 'Family & Community', iconName: 'Baby', description: 'Vehicle speed limits in driveways/podiums, play equipment condition & rubberized flooring, CCTV safety', defaultAnsweredCount: 8 },
  { id: 'pet-rules', title: 'Pet Acceptance & Walking Rules', category: 'Family & Community', iconName: 'HeartHandshake', description: 'Pet welcoming resident attitude, designated walking track rules, elevator restrictions, pet friction', defaultAnsweredCount: 7 },
  { id: 'insider-truths', title: 'Insider Truths & Living Retrospect', category: 'Living Experience', iconName: 'Sparkles', description: 'What brokers never tell you, unvarnished living trade-offs, would buy or rent here again sentiment', defaultAnsweredCount: 19 }
];
`;

console.log('Setup checked');
