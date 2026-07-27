import { ContributorQuestion } from '../types';
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

export const MAIN_QUESTIONS_CATALOG: MainQuestionItem[] = [
{
  "id": "mq_water_pressure",
  "topicId": "water-pressure",
  "category": "Water & Plumbing",
  "title": "How strong and consistent is the water pressure during peak morning hours across all floors?",
  "description": "Evaluates peak hour shower pressure, upper floor booster pump performance, and multi-tap pressure drops.",
  "iconName": "Gauge",
  "badge": "Daily Comfort",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    },
    {
      "id": "floorRange",
      "label": "Floor Level in Tower",
      "inputType": "select",
      "options": [
        "Ground - 5th Floor",
        "6th - 12th Floor",
        "13th - 20th Floor",
        "Top Floors (20+)"
      ],
      "defaultValue": "13th - 20th Floor"
    }
  ],
  "followUpQuestions": [
    {
      "id": "wp_mq_1",
      "questionText": "Does shower pressure drop significantly during morning peak hours (7:00 AM - 9:30 AM)?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, water pressure in our tower is absolutely smooth and consistent throughout the day. Even during peak morning rush hours from 7 to 9 AM when everyone is taking showers before heading to office, we get excellent flow in both bathrooms without any annoying pressure drop at all. Truly zero issues experienced so far.",
        "Look, in our building, around 7:30 to 9:00 AM in the morning when most residents are getting ready for office, the shower pressure definitely drops quite a bit. It does not stop completely, but the flow becomes noticeably weaker compared to afternoons. You get used to it after a few weeks, but it is good to keep in mind before taking a quick morning shower.",
        "Honestly speaking, morning time pressure in our upper floor shower is quite frustrating. Between 8 AM and 9 AM, if somebody runs the kitchen tap or washing machine simultaneously, the shower flow drops to a thin trickle. We actually had to install a small domestic booster pump inside our bathroom to manage decent morning water pressure.",
        "Main problem in our society is during morning peak hours when water pressure drops severely. Many times around 8 AM there is hardly any water coming in the shower head and you have to use bucket and mug instead. Society committee keeps saying they will fix booster pumps, but problem is still continuing every single morning."
      ]
    },
    {
      "id": "wp_mq_2",
      "questionText": "How is tap and shower water pressure on upper floors (10th floor and above) compared to lower floors?",
      "inputType": "radio",
      "options": [
        "Look, on upper floors like our 14th floor, pressure is surprisingly strong and consistent because the society overhead booster pumps work continuously. Taps and showers work with full force round the clock, so living on high floors does not mean weak water pressure at all. Very pleased with the plumbing work done here.",
        "Honestly speaking, upper floor pressure is decent enough for daily usage, though lower floor residents get slightly more force in their showers. Society maintenance team tunes the pressure regulating valves regularly, so while it is not extraordinarily high, you will get smooth continuous flow without any major complaints.",
        "To be frank, upper floors face occasional pressure drops whenever the central booster pump undergoes maintenance or experiences power glitches. We sometimes get air locks in pipes which causes sputtering taps for 10-15 minutes until the air clears out. It happens once or twice a month, especially on Sunday mornings.",
        "Main difficulty on top floors is that when overhead tanks run low in the afternoon, pressure drops quite sharply. You can clearly notice the difference between 5th floor and 20th floor water flow during peak daytime hours. Management really should recalibrate the auto-start water level sensors on the terrace tanks."
      ]
    },
    {
      "id": "wp_mq_3",
      "questionText": "When multiple taps or washing machines run simultaneously inside your flat, does tap pressure drop?",
      "inputType": "radio",
      "options": [
        "In our flat, even if the washing machine is filling up and someone is taking a shower while kitchen utensils are being washed, tap pressure remains completely rock solid. The main internal inlet pipe diameter is quite large, so running multiple outlets simultaneously never causes any pressure reduction anywhere inside the house.",
        "Look, when the washing machine starts pulling water, there is a minor noticeable drop in the shower flow, but it is manageable. It is not severe enough to burn or freeze you, but you can feel the pressure softening slightly until the washing machine inlet valve closes. Quite standard for most apartments.",
        "Actually speaking, multi-tap usage is a major inconvenience in our apartment. If the maid opens the kitchen sink tap while you are in the shower, the shower pressure drops dramatically to a weak dribble. We have to tell family members not to use kitchen or balcony taps when someone is bathing.",
        "To be very honest, running two bathrooms at the same time is almost impossible in our flat without severe pressure loss. If both showers are turned on together, water pressure cuts by half in both bathrooms. It forces family members to take baths one by one in the morning."
      ]
    },
    {
      "id": "wp_mq_4",
      "questionText": "Rate overall water pressure consistency and shower satisfaction (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Water Pressure in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Water Pressure is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Water Pressure here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Water Pressure in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Water Pressure in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_water_quality",
  "topicId": "water-quality",
  "category": "Water & Plumbing",
  "title": "What is the quality, hardness, and clarity of water in bathroom taps and kitchen lines?",
  "description": "Examines tap scaling, RO purifier necessity, 20L water can dependency, and STP recycled flush water odor.",
  "iconName": "Droplets",
  "badge": "Health & Plumbing",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    },
    {
      "id": "purifierType",
      "label": "Drinking Water Solution",
      "inputType": "select",
      "options": [
        "RO Purifier",
        "UV/UF Purifier",
        "Bottled 20L Cans",
        "Tap Filter Only"
      ],
      "defaultValue": "RO Purifier"
    }
  ],
  "followUpQuestions": [
    {
      "id": "wq_mq_1",
      "questionText": "Is hard water scaling causing white stains or damage to bathroom taps, showerheads, and geysers?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, water quality in our society is surprisingly soft and clean. We get direct municipal supply without heavy mineral content, so our bathroom chrome fittings, glass shower partitions, and geysers stay spotless without any white calcium stains or scaling even after years of continuous daily usage.",
        "Look, there is a mild white calcium scaling on bathroom taps and shower nozzles after a few weeks, but it is easily removable. We clean the aerators once every month using vinegar or standard bathroom cleaner spray, and it works completely fine without damaging the expensive bathroom fixtures or plumbing lines.",
        "Honestly speaking, water hardness in our locality is quite high and causes frequent headaches. White mineral crust builds up rapidly on shower heads, blocking small spray holes every fortnight. Geyser heating elements also corrode every two years, so installing a dedicated tap water softener is almost essential for long term relief.",
        "Main problem here is severe groundwater hardness when tanker water gets mixed in summer. Tap aerators choke continuously, hair falls quickly after washing, and glass bathroom doors turn chalky white within days. Society urgently needs a centralized water softening plant to protect flat plumbing and sanitary fittings."
      ]
    },
    {
      "id": "wq_mq_2",
      "questionText": "What drinking water filtration setup is necessary for safe domestic drinking?",
      "inputType": "radio",
      "options": [
        "In our society, municipal supply water TDS stays under 150 PPM, so a basic UV or UF water purifier is more than enough for safe drinking. The water tastes sweet and clean directly from kitchen tap, so high-cost multi-stage RO purifiers are really not necessary at all.",
        "Look, TDS levels fluctuate between 350 and 600 PPM depending on municipal supply and tanker mixing. Having a modern multi-stage RO purifier with mineral cartridge is essential for every flat. Once filtered through RO, drinking water tastes completely pure, odorless, and safe for young children and elderly family members.",
        "Honestly speaking, many families in our wing prefer ordering 20-liter branded drinking water cans for cooking and drinking because tap water TDS changes drastically. Buying water cans costs around 600 rupees per month, but gives complete peace of mind regarding stomach health and drinking safety.",
        "Main concern is tap water is totally unfit for drinking or cooking without heavy multi-layer filtration. Raw water frequently smells earthy during rains and carries high dissolved solids. Even for washing vegetables or making tea, boiling or RO filtration is compulsory to avoid stomach infections."
      ]
    },
    {
      "id": "wq_mq_3",
      "questionText": "How clean, clear, and odour-free is the flush water supply in bathrooms?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, recycled flush water coming from society Sewage Treatment Plant is crystal clear and completely odorless. STP filtration plant is maintained expertly by certified technicians, so toilet bowls remain clean without any yellow stains, foul sewage smell, or chemical odor inside guest bathrooms.",
        "Look, flush water is generally clear and odorless on normal days, but during peak hot summer months, you get a slight chemical or chlorine smell when flushing toilets. It is not overwhelming or smelly, but you can tell recycled STP water is treated with excess chlorine tablets.",
        "Honestly speaking, flush water in our tower occasionally comes with a yellowish tint and mild unpleasant odor, especially on hot Sunday mornings. Sewage treatment plant air blowers break down quite frequently, causing untreated water to circulate in flushing lines until residents log complaints on the society mobile app.",
        "Main problem in our building is STP flush water comes out murky brownish and smells terrible quite often. Toilet flush tanks accumulate dark sludge at the bottom, making guest bathrooms look unhygienic and forcing us to scrub flush tanks manually with bleaching powder every few weeks to keep them clean."
      ]
    },
    {
      "id": "wq_mq_4",
      "questionText": "Rate overall water purity, clarity, and tap health satisfaction (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Water Quality & Tap Health in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Water Quality & Tap Health is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Water Quality & Tap Health here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Water Quality & Tap Health in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Water Quality & Tap Health in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_water_availability",
  "topicId": "water-availability",
  "category": "Water & Plumbing",
  "title": "How reliable is the 24x7 water supply, summer tanker dependency, and pipeline shutdown frequency?",
  "description": "Assesses municipal supply continuity, summer tanker shortages, emergency rationing, and main line repairs.",
  "iconName": "Droplet",
  "badge": "Essential Supply",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "wa_mq_1",
      "questionText": "Is municipal tap water available 24x7 without scheduled daily supply cuts?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, water supply in our society is 100% continuous 24 hours a day, 365 days a year. Society has massive underground storage sumps that buffer municipal supply seamlessly, so we have never experienced fixed water timing restrictions or empty taps in our flat.",
        "Look, water is supplied continuously throughout the day, but society management strictly monitors overhead tank levels. During scheduled maintenance or monthly tank cleaning days, water supply is turned off for two hours in the afternoon, but ample advance notice is always posted on the official society WhatsApp group.",
        "Honestly speaking, water is available only during fixed time slots morning and evening. Taps run from 6 AM to 9 AM in morning and 6 PM to 9 PM in evening to conserve water. Living with fixed water timings requires storing bucket water in bathrooms for afternoon usage.",
        "Main issue in our society is frequent unscheduled water cuts and erratic supply timings. Overhead tanks run completely dry randomly during weekends, forcing families to wait for emergency tanker arrivals. Storing large plastic drums filled with water inside bathrooms is a permanent daily struggle for all resident families."
      ]
    },
    {
      "id": "wa_mq_2",
      "questionText": "Are private water tankers required during peak summer months (April to June)?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, zero private water tankers are required even during peak summer months from April to June. Our society has a dedicated municipal water pipeline connection with abundant daily volume allocation, so residents never spend a single extra rupee on private water tanker surcharges throughout the year.",
        "Look, during May and June peak summer heat, municipal supply pressure drops slightly, so society management orders a few private tankers daily to supplement the main underground sump. Monthly maintenance charges increase marginally by 200 rupees during summer, but water flow inside flats remains completely uninterrupted throughout the day.",
        "Honestly speaking, the summer water crisis is quite severe in our locality. From April to July, our society depends heavily on 30 to 40 private water tankers every single day. Maintenance bills shoot up drastically during these peak months, and management enforces strict water rationing rules during afternoon hours.",
        "Main problem every summer in our area is total dependency on expensive private water tankers. Tanker rates skyrocket without warning, society reserves run out of funds, and severe water cuts are imposed where water is supplied for barely two hours daily. It causes immense frustration for all residing families."
      ]
    },
    {
      "id": "wa_mq_3",
      "questionText": "How often do unscheduled pipeline leakage repairs cause water shutdowns per month?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, unscheduled pipeline shutdowns practically never happen here because our society internal CPVC plumbing network is brand new and built with top-quality materials. We have enjoyed completely uninterrupted water supply without any emergency repair cuts or sudden plumbing shutdowns since moving into this flat.",
        "Look, occasional pipeline repair shutdowns happen maybe once in three or four months when a main riser pipe joint develops a small leakage. Society plumber fixes the line within two to three hours, so water supply is restored before evening without causing any major inconvenience to working families.",
        "Honestly speaking, frequent pipe bursts and leakage repairs cause sudden unscheduled water cuts at least twice every month. Underground distribution pipes are quite old and crack under pressure, leaving entire towers without water for five to six hours unexpectedly until plumbing contractors replace the damaged section.",
        "Main problem in our building is plumbing valves and riser pipes break down continuously due to high pressure. Water supply gets shut down without any advance warning almost every week, disrupting cooking, cleaning, and bathing schedules for entire tower wings and causing severe frustration among resident families."
      ]
    },
    {
      "id": "wa_mq_4",
      "questionText": "Rate overall 24x7 water availability and summer peace of mind (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding 24x7 Water Availability & Summer Peace of Mind in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with 24x7 Water Availability & Summer Peace of Mind is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with 24x7 Water Availability & Summer Peace of Mind here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with 24x7 Water Availability & Summer Peace of Mind in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for 24x7 Water Availability & Summer Peace of Mind in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_parking_usability",
  "topicId": "parking-usability",
  "category": "Parking & Vehicles",
  "title": "How spacious, accessible, and easy to maneuver are allotted parking slots in basements?",
  "description": "Assesses slot width, pillar obstruction tightness, puzzle/stack parking ease, and double parking issues.",
  "iconName": "Car",
  "badge": "Vehicle Mobility",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "vehicleType",
      "label": "Primary Vehicle Class",
      "inputType": "select",
      "options": [
        "Large SUV / MUV",
        "Sedan",
        "Hatchback",
        "Electric Vehicle (EV)",
        "Two Wheeler Only"
      ],
      "defaultValue": "Large SUV / MUV"
    }
  ],
  "followUpQuestions": [
    {
      "id": "pk_mq_1",
      "questionText": "Is your allotted car parking slot wide enough to park comfortably without touching pillars or neighbor cars?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, parking slots in our basement are extremely wide and well designed. Even with a large SUV like Creta or Fortuner, you can park effortlessly with plenty of space on both sides to open car doors fully without scratching adjacent vehicles or hitting concrete pillars.",
        "Look, parking width is decent for regular sedans and hatchbacks, but if you drive a wide SUV, it is a tight fit. You have to park carefully close to the left side line so that driver side door can open comfortably. Manageable once you get used to reversing into the slot.",
        "Honestly speaking, parking slots are quite cramped and tight in our basement level. Building pillars take up significant space, forcing car doors to hit concrete edges if you are not extra careful while stepping out. Installing rubber edge guards on car doors is almost compulsory here.",
        "Main issue in our parking area is the extremely narrow slot layout originally designed by the builder. Parking two full-sized cars side by side leaves barely six inches gap between side mirrors. Drivers constantly scrape bumpers while reversing, leading to frequent heated arguments between neighboring residents."
      ]
    },
    {
      "id": "pk_mq_2",
      "questionText": "Are basement driving ramps, turns, and pillars easy to navigate for large cars or SUVs?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, basement entry and exit ramps are remarkably wide with gentle sloping curves and clear Convex mirror sightlines. Driving a large SUV up and down basement levels is completely smooth and stress-free without any fear of scraping underbody chassis or side alloy rims.",
        "Look, basement ramps are standard width, but B2 and B3 sharp turning corners require slow driving and careful steering wheel adjustment. Blind spots exist near ramp turns, so you must honk before taking sharp corners, but it is completely manageable with normal daily driving experience for resident drivers.",
        "Honestly speaking, basement ramp turns are very narrow with sharp blind angles and steep inclines. SUV drivers frequently scrape side panels against concrete pillar edges while navigating lower basement levels. Corner rubber guards installed on basement pillars are full of deep paint scratches from vehicles.",
        "Main hazard in our basement is incredibly tight spiral ramps with zero visibility mirrors at turning points. Two cars cannot pass each other simultaneously on the ramp, causing dangerous standoffs during peak morning office exit hours where one driver has to reverse uphill with great difficulty."
      ]
    },
    {
      "id": "pk_mq_3",
      "questionText": "Do neighbors double-park, block access, or park two-wheelers illegally inside car slots?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, society estate security guards enforce strict parking discipline across all basement levels. Nobody is allowed to park two-wheelers outside designated yellow lines or block neighboring car slots. Security personnel regularly stick yellow warning clamps on improperly parked guest or visitor vehicles.",
        "Look, parking discipline is generally good across all residential wings, but occasionally visiting guests or delivery personnel park two-wheelers near pillar edges that encroach slightly on driving lanes. Estate security guards clear them quickly if you call the management office or raise a ticket on the society mobile app.",
        "Honestly speaking, neighbor parking encroachment is a constant daily annoyance in our basement. Adjacent slot owners frequently park extra two-wheelers inside designated car slots, making it very difficult to swing your car into your slot without making a tedious three-point turn every single evening when returning from work.",
        "Main complaint in our basement parking levels is total lack of enforcement by management. Neighbors park extra motorbikes and bicycles directly in narrow driving aisles, completely blocking car movement. Repeated complaints to society office fall on deaf ears without any wheel clamps or penalty fines ever issued."
      ]
    },
    {
      "id": "pk_mq_4",
      "questionText": "Rate overall parking slot width, driveway space, and parking ease (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Parking Usability & Slot Space in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Parking Usability & Slot Space is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Parking Usability & Slot Space here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Parking Usability & Slot Space in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Parking Usability & Slot Space in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_visitor_parking",
  "topicId": "visitor-parking",
  "category": "Parking & Vehicles",
  "title": "How easy is it for visiting guests, family, and vendors to park vehicles inside society premises?",
  "description": "Evaluates visitor slot availability, gate entry pass process, weekend evening filling rate, and street safety.",
  "iconName": "Users",
  "badge": "Guest Hospitality",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "vp_mq_1",
      "questionText": "Are dedicated visitor parking slots easily available on weekend evenings (7 PM - 10 PM)?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, visitor parking in our society is exceptionally well planned with over 50 dedicated guest slots near the main clubhouse. Even on busy Saturday evenings when residents hold dinner parties, visiting family and friends find secure indoor parking easily without any hassle.",
        "Look, visitor slots are available on weekdays, but on Friday and Saturday nights after 8 PM, visitor parking fills up quickly. If your guests arrive early around 7 PM they get a slot easily, otherwise security allows temporary parking in open podium bays with resident approval on society app.",
        "Honestly speaking, visitor parking capacity is very limited compared to the total number of flats. On weekend evenings, all guest slots are full by 7:30 PM, forcing guest cars to be turned away at the gate and park on dusty external road outside society premises.",
        "Main drawback of this society is practically zero visitor parking allotment for guests. Security flatly refuses entry to guest vehicles on weekends, forcing elderly relatives to walk long distances from outside dusty road gates. It makes hosting family functions, birthday parties, or dinner gatherings very embarrassing."
      ]
    },
    {
      "id": "vp_mq_2",
      "questionText": "How smooth and quick is the gate security verification process for guest vehicles?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, gate verification for visiting guests is super smooth through MyGate mobile app. Residents pre-approve guest vehicle numbers in advance, so booming barrier gates open automatically via ANPR camera recognition without stopping guest cars or making them fill tedious physical register books at the gate.",
        "Look, security gate entry process takes barely two minutes. Security guard calls the flat via intercom or sends an instant app approval notification before issuing the visitor entry token. It is a quick disciplined procedure that ensures community safety while keeping entry delays minimal for invited visitors.",
        "Honestly speaking, security gate verification is very slow and creates long vehicle traffic queues outside the main entrance gate on weekend evenings. Guards make guests manually write phone numbers and flat details in paper registers, delaying entry by ten to fifteen minutes every single time.",
        "Main nuisance at the main entrance gate is rude security guard behavior towards visiting guest drivers and delivery personnel. Guards argue unnecessarily, misplace guest entry logs, and frequently deny entry even when residents have already approved the visitor request on the society mobile app well in advance."
      ]
    },
    {
      "id": "vp_mq_3",
      "questionText": "Is external roadside parking outside the main gate safe from towing or theft?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, roadside parking outside society main gate is wide, well-lit with streetlights, and monitored by society security CCTV cameras. Traffic police never tow vehicles from our outer service road, making it completely safe for overflow guest parking during large weekend events.",
        "Look, external roadside parking is generally okay during daytime hours, but after 9 PM traffic police patrol vehicles sometimes arrive and issue heavy parking fine slips. Visiting guests parking outside should park strictly inside designated white lane markings on the outer service road to avoid sudden traffic fines.",
        "Honestly speaking, roadside parking outside society main gate is quite unsafe and risky for visiting guests. Traffic towing vans frequently tow away guest cars parked outside gate without any advance warning, and dark unlit stretches suffer occasional side mirror theft and window glass breaking incidents at night.",
        "Main problem outside our main society gate is severe narrow street congestion and traffic chaos. Parking guest cars outside on the road blocks main traffic flow, leading to frequent shouting matches between local street vendors, auto rickshaw drivers, and visiting drivers trying to find a safe parking spot."
      ]
    },
    {
      "id": "vp_mq_4",
      "questionText": "Rate overall visitor parking availability and guest entry convenience (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Visitor Parking & Guest Entry Convenience in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Visitor Parking & Guest Entry Convenience is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Visitor Parking & Guest Entry Convenience here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Visitor Parking & Guest Entry Convenience in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Visitor Parking & Guest Entry Convenience in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_ev_charging",
  "topicId": "ev-charging",
  "category": "Parking & Vehicles",
  "title": "How EV-ready is the society regarding personal charger NOCs, common charging stations, and power capacity?",
  "description": "Evaluates personal EV charger installation NOC turnaround, sub-meter billing, and common charging bays.",
  "iconName": "Zap",
  "badge": "Modern Infra",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "vehicleType",
      "label": "Vehicle Type",
      "inputType": "select",
      "options": [
        "Electric Car (EV)",
        "Electric Scooter (2W)",
        "Planning EV Purchase",
        "Petrol / Diesel Vehicle"
      ],
      "defaultValue": "Electric Car (EV)"
    }
  ],
  "followUpQuestions": [
    {
      "id": "ev_mq_1",
      "questionText": "How fast and supportive is the managing committee in granting NOC for personal EV charger installation in your parking slot?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society committee is extremely forward-thinking and supportive regarding EV adoption. They issue personal charger installation NOC within 48 hours of applying on app, and society electrical team helps guide cabling from main meter board down to basement parking slot smoothly.",
        "Look, getting an EV charger NOC from society takes about one to two weeks. You have to submit an official load test certificate and charger specification documents from certified installers like Tata Power or Ather. Once paperwork is submitted, committee approves the installation with standard safety guidelines.",
        "Honestly speaking, getting NOC for personal EV charger installation requires multiple tedious follow-ups with society office staff and electrical committee members. Managing committee raises technical objections about electrical cable tray capacity and demands a heavy non-refundable inspection deposit, delaying charger installation by over a month for excited EV buyers.",
        "Main hurdle in our society is total reluctance of managing committee members to permit personal EV chargers in basement parking slots. They cite fire safety hazards and electrical transformer load overload, flatly denying personal charger NOC permissions to all resident families wanting to buy new electric cars."
      ]
    },
    {
      "id": "ev_mq_2",
      "questionText": "Does the society have common shared EV charging stations available in visitor bays?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, society has partnered with Kazam and Tata Power to install eight fast DC and AC common EV charging stations in visitor bays. Any resident or guest can easily scan QR code on mobile app and charge electric vehicles conveniently 24x7 without installing personal chargers.",
        "Look, society has four shared 15A slow charging sockets installed near the main clubhouse for emergency vehicle charging. It works completely fine for overnight two-wheeler electric scooter charging or top-up EV car charging at reasonable per-unit electricity billing rates managed directly through the society mobile application.",
        "Honestly speaking, society has no common shared EV charging bays or public sockets installed anywhere yet. If you do not have a personal dedicated charger installed in your allotted basement parking slot, charging your EV car or electric scooter inside society premises is completely impossible.",
        "Main complaint in our society is that common public charging sockets are constantly blocked by non-EV petrol cars parked illegally inside designated charging bays. Estate security guards rarely enforce charging bay reservation rules, making public EV charging extremely frustrating for electric vehicle owners living in this society."
      ]
    },
    {
      "id": "ev_mq_3",
      "questionText": "Is the society electrical transformer capacity adequate for running multiple EV chargers simultaneously?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, society transformer load capacity was upgraded recently to handle high-power EV charging loads easily. Multiple 7.2 kW personal EV chargers run simultaneously across basement slots during night hours without causing main breaker trips or electrical voltage fluctuations inside flats.",
        "Look, electrical transformer load capacity is fine currently, but society management limits total approved EV charger installations to 50 slots for safety reasons. Once that threshold is reached, a comprehensive electrical load audit will be required before approving any new personal charger load connections for resident applicants.",
        "Honestly speaking, our electrical transformer load is already near peak capacity during hot summer nights. Whenever multiple EV cars start fast charging simultaneously at night, basement sub-station circuit breakers trip occasionally, causing temporary power cuts in common basement lighting and elevator operations across residential towers.",
        "Main bottleneck in our society is old electrical wiring infrastructure and outdated sub-station panels. Managing committee claims the main electrical distribution panel cannot take any additional EV charger load without charging residents two lakh rupees per floor for transformer capacity upgrade and heavy armored cabling work."
      ]
    },
    {
      "id": "ev_mq_4",
      "questionText": "Rate overall EV charging readiness and committee support (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding EV Charging Infrastructure & Readiness in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with EV Charging Infrastructure & Readiness is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with EV Charging Infrastructure & Readiness here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with EV Charging Infrastructure & Readiness in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for EV Charging Infrastructure & Readiness in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_wfh_tranquility",
  "topicId": "wfh-tranquility",
  "category": "Noise & Environment",
  "title": "How quiet and peaceful is the flat environment for conducting remote WFH work calls and deep focus?",
  "description": "Assesses WFH call tranquility, neighbor wall/ceiling acoustic insulation, footstep/TV noise transfer, and courtyard echo.",
  "iconName": "VolumeX",
  "badge": "Work From Home",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "wfhMode",
      "label": "WFH Routine",
      "inputType": "select",
      "options": [
        "Full-Time WFH",
        "Hybrid WFH (2-3 Days)",
        "Office Going"
      ],
      "defaultValue": "Full-Time WFH"
    }
  ],
  "followUpQuestions": [
    {
      "id": "wfh_mq_1",
      "questionText": "Can you conduct important WFH client video calls without disturbing external background noise?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our flat is pin-drop silent and peaceful throughout the day. High-grade double-glazed UPVC window systems block external noise completely, allowing me to conduct crucial client presentation calls on Zoom and Teams without activating any AI background noise suppression filters.",
        "Look, during daytime WFH hours, the indoor environment is generally very peaceful. Closing double balcony glass doors keeps out most ambient outdoor sounds, though occasional lawn mower noise or afternoon delivery guy calls can be heard if windows are kept wide open. Very comfortable for hybrid remote work routines.",
        "Honestly speaking, taking WFH client calls without noise-cancelling headphones is quite difficult in our flat. Daytime hammering and drill noise from nearby flat interior renovation work, combined with echoing voices from internal garden courtyards, seep into the study room, forcing me to mute my microphone frequently.",
        "Main drawback for remote workers living here is continuous disturbing background noise throughout office hours. Children screaming in central podiums, loud TV noise bleeding through adjacent walls, and frequent heavy hallway fire door slamming make conducting professional work calls a stressful daily ordeal for IT professionals."
      ]
    },
    {
      "id": "wfh_mq_2",
      "questionText": "How effective is inter-flat acoustic wall and ceiling soundproofing against neighbor footsteps or TV noise?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, acoustic soundproofing between flats in our building is truly exceptional. Heavy monolithic RCC shear wall construction prevents internal sound transmission entirely, so we never hear upper floor heavy footsteps, furniture dragging noise, or adjacent neighbor TV audio through shared bedroom walls.",
        "Look, wall soundproofing is decent, but impact noise from upper floor ceiling is slightly audible if kids jump or drag heavy dining chairs at night. Normal talking voices and TV audio do not bleed through walls, so basic living privacy between adjacent flats is well preserved.",
        "Honestly speaking, internal partition walls in our residential tower are quite thin AAC block construction without acoustic dampening. You can easily hear neighbor TV news broadcasts, washing machine spin cycles, and upper floor dragging furniture noise during quiet late night hours when trying to read or sleep peacefully.",
        "Main nuisance in our building is near-zero acoustic isolation between floors. You can clearly hear neighbor bathroom flush sounds, loud family arguments, and constant heavy footstep thumps from upper floor, making restful sleep and peaceful focus work very difficult without earplugs or white noise machines."
      ]
    },
    {
      "id": "wfh_mq_3",
      "questionText": "Does daytime children playing noise in podium gardens echo into flat rooms?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, podium play areas are located far from residential tower wings, so evening children playing noise never echoes into bedrooms or living rooms. Complete acoustic serenity is maintained round the clock inside flats regardless of what floor you reside on.",
        "Look, children play in central podium courtyard between 5 PM and 7:30 PM, so some echoing shouts reach lower floor balcony windows. Closing balcony double glass sliding doors reduces indoor sound level by 80%, so it does not bother standard WFH evening work routines for remote employees.",
        "Honestly speaking, central courtyard acts like a giant sound amplifier in our wing. Shrieking noise from kids playing cricket and football in podium echoes loudly across all upper floors from 4 PM till 9 PM, making living room conversation and relaxing after work quite difficult.",
        "Main issue for podium facing flats is unbearable shrieking echo during evening play hours. Loud sound bounces off concrete tower facades, forcing residents to keep all balcony doors locked and curtains drawn tightly from 4 PM to 9 PM daily to maintain peace and quiet inside bedrooms."
      ]
    },
    {
      "id": "wfh_mq_4",
      "questionText": "Rate overall WFH acoustic tranquility and soundproofing quality (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding WFH Acoustic Tranquility & Soundproofing in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with WFH Acoustic Tranquility & Soundproofing is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with WFH Acoustic Tranquility & Soundproofing here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with WFH Acoustic Tranquility & Soundproofing in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for WFH Acoustic Tranquility & Soundproofing in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_traffic_party_noise",
  "topicId": "traffic-party-noise",
  "category": "Noise & Environment",
  "title": "How severe is main road traffic horn noise, street traffic, and weekend clubhouse party disturbance?",
  "description": "Evaluates main road vehicle horn noise, weekend clubhouse events, poolside party loudness, and 10 PM cutoff enforcement.",
  "iconName": "Volume2",
  "badge": "Acoustic Comfort",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "flatFacing",
      "label": "Balcony View Facing",
      "inputType": "select",
      "options": [
        "Facing Main Road / Highway",
        "Facing Internal Garden",
        "Facing Courtyard",
        "Facing Side Street"
      ],
      "defaultValue": "Facing Main Road / Highway"
    }
  ],
  "followUpQuestions": [
    {
      "id": "tp_mq_1",
      "questionText": "How disturbing is main road traffic horn noise and heavy vehicle rumble on flat balconies?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, even though our flat balcony faces the main arterial road, high-grade double-glazed acoustic glass balcony sliding doors reduce external traffic sound to a faint whisper. You can sit peacefully in living room without hearing annoying vehicle horns or bus engines.",
        "Look, main road traffic noise is noticeable during peak morning and evening traffic rush hours if balcony sliding doors are kept open. However, once you slide closed the double-glazed sound-insulated glass windows, interior noise levels drop significantly to comfortable peaceful levels for working and sleeping inside.",
        "Honestly speaking, main road traffic noise is relentless and loud in our residential building. Continuous heavy truck rumble, loud pressure horns, and emergency sirens bleed into bedrooms throughout the day and late night, forcing us to keep all balcony windows and sliding glass doors permanently shut and locked.",
        "Main nightmare for road-facing flats in our tower is unbearable traffic noise from the busy main road. Loud modified silencer motorbikes and state transport bus pressure horns blast continuously past midnight, disrupting sleep and making peaceful living room family relaxation completely impossible for residents living on lower floors."
      ]
    },
    {
      "id": "tp_mq_2",
      "questionText": "Do weekend clubhouse events, weddings, or poolside parties cause loud music noise in flats?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, clubhouse party hall is located in a dedicated basement zone far away from residential towers, so weekend birthday parties or poolside events never cause loud music noise inside flat bedrooms. Complete acoustic peace is maintained every weekend for residents.",
        "Look, weekend birthday party celebrations and festival DJ events at the clubhouse create a lively music sound until 9:30 PM sharp. It is an energetic festive atmosphere that stops promptly before bedtime, so most resident families do not mind it at all during weekend evenings here.",
        "Honestly speaking, weekend party noise from open lawn celebrations is quite loud and annoying for residents living in facing towers. Heavy high-decibel bass speakers vibrate flat window glass panes during late evening parties, making early sleeping impossible for young kids, elderly parents, and working professionals alike.",
        "Main problem in our society is unchecked party noise during weekends. Private clubhouse parties blast loud DJ music past midnight on weekend nights, and estate security guards refuse to stop party hosts despite repeated resident phone calls and angry messages on official society mobile application."
      ]
    },
    {
      "id": "tp_mq_3",
      "questionText": "How strictly does society security enforce the 10:00 PM late-night noise cutoff policy?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society security team strictly enforces 10 PM quiet hours rule across all common lawns and clubhouse facilities. At 10 PM sharp, patrolling security guards respectfully ask party organizers to shut off outdoor music speakers and move indoors without any exception.",
        "Look, society security staff enforces 10 PM noise cutoff rules reasonably well on regular weekdays. On major Indian festival nights like Diwali or New Year Eve, celebrations extend till 11:30 PM with prior general body approval, which is completely acceptable to most resident families living here.",
        "Honestly speaking, 10 PM noise regulation policy is very poorly enforced by estate management. Late night outdoor drinking parties near the swimming pool deck continue playing loud DJ music till 1 AM without security intervention, leading to heated arguments on our official society WhatsApp group every weekend.",
        "Main failure in our society is the complete absence of night security intervention during late hours. Loud brawls and drunken yelling near clubhouse lawns past midnight are common occurrence, and security guards claim they have no authority to stop wealthy committee members or influential flat owners."
      ]
    },
    {
      "id": "tp_mq_4",
      "questionText": "Rate overall freedom from external traffic and party noise disturbance (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Freedom from Traffic & Party Noise in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Freedom from Traffic & Party Noise is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Freedom from Traffic & Party Noise here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Freedom from Traffic & Party Noise in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Freedom from Traffic & Party Noise in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_power_cuts",
  "topicId": "power-cuts",
  "category": "Electricity & Power",
  "title": "How frequent are municipal electricity power outages, voltage fluctuations, and grid trip risks?",
  "description": "Evaluates locality grid power cut frequency, voltage fluctuations, summer load trips, and appliance safety.",
  "iconName": "ZapOff",
  "badge": "Grid Quality",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "pc_mq_1",
      "questionText": "How often does the state electricity grid experience unscheduled power outages per week?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, the local state electricity grid in our locality is remarkably stable and reliable. We experience zero unscheduled power cuts on most weeks, and municipal grid power runs continuously 24x7 without sudden blackouts, neighborhood transformer trips, or annoying voltage drops.",
        "Look, municipal grid power is generally good, but during monsoon thunderstorms or hot summer afternoons, short ten-minute power cuts happen once or twice a week. Society heavy diesel generator kicks in automatically within fifteen seconds, so daily household routine and WFH office work is barely impacted at all.",
        "Honestly speaking, unscheduled power outages are quite frequent in our locality, happening three to four times every single week. Municipal electricity grid trips regularly during peak afternoon heat due to heavy local transformer load and weak overhead feeder lines across our surrounding neighborhood residential area.",
        "Main nuisance in our locality is chronic electricity grid instability and poor feeder line maintenance by municipal authorities. Power cuts last for two to three hours every single afternoon during summer months, putting immense pressure on society diesel generator backup systems and increasing monthly maintenance bills for flat residents."
      ]
    },
    {
      "id": "pc_mq_2",
      "questionText": "Do voltage fluctuations or high-voltage spikes occur that risk damaging AC compressors or refrigerators?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society sub-station transformer is equipped with heavy-duty automatic voltage regulators and industrial surge arrestors. Electrical voltage remains perfectly steady at 230V without dangerous voltage spikes or dimming lights, keeping modern inverter ACs, double-door refrigerators, and expensive home electronics 100% safe.",
        "Look, minor voltage dips happen occasionally when municipal grid power switches over to society diesel generator mode, but modern home appliances handle it fine. Still, we use dedicated digital voltage stabilizers for expensive OLED televisions and double-door refrigerators as a standard safety precaution inside our flat.",
        "Honestly speaking, severe voltage fluctuations happen frequently during hot summer peak load hours in our tower. LED tube lights flicker noticeably and split AC compressors trip automatically due to low voltage drops below 180V, requiring dedicated electronic voltage stabilizers on every major home appliance to prevent damage.",
        "Main risk here in our society is severe high-voltage surges during grid power restoration after blackouts. Last summer, two neighboring residents suffered burnt motherboard circuit electronics in split ACs and smart televisions due to sudden high-voltage power surges when municipal grid power snapped back on unexpectedly."
      ]
    },
    {
      "id": "pc_mq_3",
      "questionText": "How much advance notification does electricity DISCOM provide before scheduled weekly maintenance blackouts?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, state electricity DISCOM and society estate office post official SMS alerts and app notifications 24 hours in advance before any scheduled Thursday grid maintenance blackout. This gives complete clarity to plan WFH laptop charges and remote work schedules accordingly for all resident employees.",
        "Look, scheduled grid maintenance blackout alerts are posted on society WhatsApp group on the morning of maintenance day. Power cuts usually run from 10 AM to 2 PM, during which full society diesel generator backup is provided for essential flat lighting, ceiling fans, and Wi-Fi routers.",
        "Honestly speaking, sudden unscheduled grid maintenance shutdowns happen without any prior notice from the local electricity department. You sit down for important WFH client work only to find total blackout, and DISCOM customer care helpline has no clear timeline for power restoration for hours together.",
        "Main headache in our locality area is the total lack of advance communication from state electricity department. DISCOM cuts grid power for eight hours straight on weekdays without any advance warning, causing severe WFH work disruption and draining personal UPS inverter batteries completely long before evening."
      ]
    },
    {
      "id": "pc_mq_4",
      "questionText": "Rate overall grid power reliability and voltage stability (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Grid Power Reliability & Voltage Stability in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Grid Power Reliability & Voltage Stability is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Grid Power Reliability & Voltage Stability here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Grid Power Reliability & Voltage Stability in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Grid Power Reliability & Voltage Stability in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_generator_backup",
  "topicId": "generator-backup",
  "category": "Electricity & Power",
  "title": "How comprehensive is diesel generator backup for running high-load appliances like air conditioners during blackouts?",
  "description": "Assesses in-flat DG appliance load limits, auto-switchover speed, diesel surcharge transparency, and AC backup.",
  "iconName": "BatteryCharging",
  "badge": "Power Backup",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "applianceLoad",
      "label": "In-Flat AC Usage",
      "inputType": "select",
      "options": [
        "Multiple Split ACs",
        "Centralized AC",
        "1 AC + Fans",
        "Fans & Basic Appliances"
      ],
      "defaultValue": "Multiple Split ACs"
    }
  ],
  "followUpQuestions": [
    {
      "id": "gb_mq_1",
      "questionText": "Does diesel generator backup support running heavy appliances like inverter ACs, geysers, or microwave ovens inside flats?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, generator backup in our society is 100% full load 24x7. Each flat gets up to 5 kW to 8 kW generator allocation, allowing us to run multiple 1.5 ton inverter ACs, refrigerator, television, and lights simultaneously during prolonged power blackouts without any breaker tripping.",
        "Look, generator backup supports up to 3 kW load per flat. It runs all fans, lights, Wi-Fi router, refrigerator, and one 1.5-ton inverter AC comfortably. If you attempt to turn on a second AC or heavy water geyser, internal automatic current limiter trips immediately to protect generator circuit.",
        "Honestly speaking, generator backup is strictly restricted to basic lights, fans, and TV only (1.5 kW max limit per flat). Running heavy power appliances like split air conditioners, washing machines, or induction cooktops on DG backup is strictly prohibited by society committee to conserve expensive diesel fuel.",
        "Main drawback in our building is zero in-flat generator power backup. Diesel generator powers only common area elevator lifts, staircase corridor lighting, and domestic water supply pumps. Inside private flats, you have to depend entirely on personal home inverter batteries during long municipal grid power outages."
      ]
    },
    {
      "id": "gb_mq_2",
      "questionText": "How fast does the diesel generator auto-switchover kick in when main grid power fails?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, auto-switchover panel is lightning fast, restoring power within 5 to 10 seconds of grid failure. Wi-Fi routers connected with small mini UPS do not even reboot, and inverter AC compressors resume cooling smoothly without requiring manual reset or intervention.",
        "Look, generator switchover takes around 20 to 30 seconds after grid failure. Flat lights flicker briefly and go dark for half a minute before heavy DG engine revs up and powers the tower, which is quite acceptable and standard for residential apartment buildings in India.",
        "Honestly speaking, DG auto-switchover is sluggish and takes two to three minutes every time municipal grid power fails. Manual operator sometimes takes five minutes to start generator set at night, leaving elevator lifts stuck between floors temporarily and dark staircase corridors until DG starts up properly.",
        "Main complaint in our building is generator auto-start control panel breaks down frequently. Sudden grid power outages leave residential towers pitch dark for 15 to 20 minutes until security guards manually go to generator yard to pull start manual switches, causing severe panic among family residents stuck inside elevator cars."
      ]
    },
    {
      "id": "gb_mq_3",
      "questionText": "Are diesel generator backup usage charges billed transparently through prepaid sub-meters or monthly maintenance?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, DG power usage is metered accurately through smart dual-source prepaid electricity sub-meters. You pay exactly for actual units consumed on DG backup at transparent government approved diesel per-unit tariffs without any hidden surcharges or unfair extra estimates on monthly bills.",
        "Look, generator diesel fuel cost is included directly in monthly maintenance bill based on actual monthly diesel purchase invoices shared on society mobile application. It is fair and transparent, adding around 300 to 500 rupees extra per flat during peak summer power cuts without hidden fees.",
        "Honestly speaking, our society managing committee levies heavy ad-hoc generator surcharge fees on monthly maintenance bills without sharing audited fuel consumption logs or actual diesel fuel purchase receipts, causing frequent heated arguments and disputes between flat residents and managing committee members during our monthly general body society meetings.",
        "Main issue in our building is exorbitant per-unit rates charged for generator power during outages. Flat residents are forced to pay 30 rupees per unit without any breakdown of diesel fuel consumption, making running split AC on generator backup extremely expensive and unaffordable during long summer blackouts."
      ]
    },
    {
      "id": "gb_mq_4",
      "questionText": "Rate overall generator backup power sufficiency and switchover speed (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Generator Power Backup & Switchover Speed in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Generator Power Backup & Switchover Speed is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Generator Power Backup & Switchover Speed here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Generator Power Backup & Switchover Speed in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Generator Power Backup & Switchover Speed in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_lift_waiting_times",
  "topicId": "lift-waiting-times",
  "category": "Elevators & High-Rise",
  "title": "How long are elevator wait times during peak morning office hours (8:00 AM - 9:30 AM)?",
  "description": "Evaluates morning rush hour lift delays, ground lobby school queues, high-speed elevator smoothness, and lift density.",
  "iconName": "Clock",
  "badge": "Elevator Speed",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "floorRange",
      "label": "Floor Level",
      "inputType": "select",
      "options": [
        "Floor 1 - 10",
        "Floor 11 - 20",
        "Floor 21 - 30",
        "Floor 31+"
      ],
      "defaultValue": "Floor 11 - 20"
    }
  ],
  "followUpQuestions": [
    {
      "id": "lw_mq_1",
      "questionText": "How long do you typically wait for an elevator during peak morning office hours (8:00 AM - 9:30 AM)?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevator service in our tower is incredibly fast and efficient. With four high-speed Schindler lifts serving 20 floors, average wait time during peak morning office rush is less than 60 seconds. You never face crowded lobbies or missed lift cars.",
        "Look, morning wait time is around two to three minutes between 8:30 AM and 9:00 AM when office goers and school kids head down together. It gets a little busy in the lobby, but the intelligent lift dispatch algorithm manages passenger traffic smoothly so nobody gets delayed significantly.",
        "Honestly speaking, elevator waiting during morning rush hours takes five to seven minutes in our tower. Lifts stop at almost every single floor on the way down, arriving completely full at middle floors and forcing residents to wait for two or three lift cycles continuously.",
        "Main nightmare in our tower is morning elevator lift queue. Waiting time exceeds 10 to 12 minutes every single morning because two lifts out of four are constantly out of service or reserved for service staff, causing massive lobby congestion and missed office cabs continuously."
      ]
    },
    {
      "id": "lw_mq_2",
      "questionText": "How crowded does the ground floor entrance lobby get during peak evening return hours (6 PM - 8 PM)?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our ground floor lobby remains completely organized, pleasant, and spacious during peak evening return hours. Returning residents and arriving family guests board lifts smoothly without long standing queues or chaotic crowds gathering near elevator landing doors inside our tower lobby.",
        "Look, ground entrance lobby gets moderately busy between 7 PM and 8 PM when delivery agents, domestic maids, and returning residents arrive together. It takes about two to three minutes to catch an ascending lift car, which is quite normal, manageable, and acceptable for high-rise apartment towers.",
        "Honestly speaking, ground entrance lobby gets heavily congested during peak evening return hours in our building. Delivery executive boys carrying big backpacks and returning office residents jam the lift lobby area completely, making waiting for ascending lifts uncomfortable, hot, stuffy, and crowded for resident families.",
        "Main frustration in our high-rise tower is ground lobby chaos every single evening between 6 PM and 8 PM. Delivery riders block elevator entrance doors, returning residents push forward aggressively, and lift wait times stretch beyond six to eight minutes during peak evening office return hours."
      ]
    },
    {
      "id": "lw_mq_3",
      "questionText": "Are elevator cars equipped with high-speed smooth motor drive systems for high-rise floors?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevators in our tower are modern high-speed 2.5 m/s gearless traction lifts equipped with ultra-smooth acceleration drive systems. Reaching the 30th floor penthouse takes barely 25 seconds without any jerky stops, sudden drops, or unsettling mechanical vibration sound inside the lift car.",
        "Look, elevator lift speed is decent, steady, and smooth enough for high-rise living. Lift moves at a standard pace suitable for a 15-story residential building, though magnetic gear braking makes a slight thud sound when stopping at top floors during quiet late night hours without causing major concern.",
        "Honestly speaking, elevator lifts in our residential tower are quite slow, jerky, and creaky. It takes over a full minute to travel from ground floor up to the 12th floor, with noticeable side-to-side sway motion and uncomfortable rattling metal sounds during high wind monsoon weather conditions.",
        "Main safety concern among residents is slow, jerky, and noisy elevator movement in our high-rise building. The motor drive produces loud grinding noises during ascent, making high-floor residents very nervous and anxious about potential mechanical failures or motor breakdowns during daily travel with family members."
      ]
    },
    {
      "id": "lw_mq_4",
      "questionText": "Rate overall elevator waiting time efficiency and lift speed satisfaction (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Elevator Waiting Time & Lift Speed in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Elevator Waiting Time & Lift Speed is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Elevator Waiting Time & Lift Speed here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Elevator Waiting Time & Lift Speed in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Elevator Waiting Time & Lift Speed in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_lift_breakdown_speed",
  "topicId": "lift-breakdown-speed",
  "category": "Elevators & High-Rise",
  "title": "How reliable are elevators and how quickly does OEM technician repair team fix lift breakdowns?",
  "description": "Evaluates elevator breakdown frequency, OEM AMC repair turnaround time, dedicated service lift availability, and lift safety.",
  "iconName": "Wrench",
  "badge": "Lift Reliability",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "lb_mq_1",
      "questionText": "How often do elevators experience technical breakdowns, door sensor errors, or unexpected shutdowns per month?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevators in our tower are top-quality Otis / Mitsubishi units that almost never break down. Monthly preventative maintenance is done diligently by certified OEM engineers and technicians, so we have experienced zero sudden lift stoppages or door sensor jams during our stay here.",
        "Look, elevator lift breakdowns happen rarely, maybe once in two or three months. Usually it is a minor door sensor recalibration issue caused by delivery boys holding lift doors forcibly. It gets fixed within an hour or two by our resident maintenance technician without major inconvenience.",
        "Honestly speaking, elevator breakdowns are quite frequent in our wing, happening two to three times every single month. Lifts get stuck between floors unexpectedly or display error codes on control screens, forcing high-floor residents to climb multiple flights of stairs while carrying heavy grocery bags.",
        "Main safety concern in our building is chronic lift failure. At least one elevator out of three is permanently broken or under repair, leaving hundreds of tower residents dependent on a single overworked elevator, causing long queue delays and frequent unexpected door sensor jams during peak office hours."
      ]
    },
    {
      "id": "lb_mq_2",
      "questionText": "How fast is the OEM AMC technician response time when a major elevator technical defect occurs?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society maintains a comprehensive OEM annual maintenance contract with a dedicated 24x7 resident elevator technician stationed on site. Mechanical repairs are initiated immediately after defect registration and resolved within 2 to 4 hours maximum without extended lift downtime.",
        "Look, OEM AMC technician arrives within three to four hours of a logged technical breakdown complaint. Replacement spare parts take a day or two for major drive motor issues, but status updates are posted transparently on society mobile app for all tower residents to stay informed.",
        "Honestly speaking, repair response time for broken lifts is very slow in our wing. Defective lifts remain shut down for four to five days continuously because society committee delays approving OEM spare part purchase estimates, causing severe daily inconvenience to high-floor residents and senior citizens alike.",
        "Main complaint in our building is broken lifts remain out of order for weeks together. Management committee delays releasing repair funds to OEM contractor, forcing senior citizens to walk down multiple stair flights daily, which is completely unacceptable, hazardous, and unsafe for high-rise apartment living."
      ]
    },
    {
      "id": "lb_mq_3",
      "questionText": "Is a dedicated padded service elevator reserved exclusively for house shifting and material movement?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our residential tower has a dedicated stretcher-sized service lift equipped with heavy protective wall padding reserved specifically for house shifting, furniture moving, construction material transport, and daily service vendors, ensuring main passenger lifts remain clean, unblocked, and completely undamaged.",
        "Look, dedicated service elevator lift is available in our wing, but resident families must book shifting time slots in advance with the security gate office for furniture moving to avoid blocking passenger lifts during peak morning and evening office rush hours for other commuting residents.",
        "Honestly speaking, there is no separate service elevator available in our residential wing. Laborers carry heavy cement sacks, ceramic floor tiles, and bulky wooden furniture inside regular passenger lifts, causing scratched glass mirrors, dented stainless steel walls, and frequent door sensor alignment breakdowns for everyone.",
        "Main problem in our building is service lift is perpetually out of service or heavily misused. Laborers overload passenger lifts with heavy construction debris and cement bags, causing frequent mechanical motor breakdowns, scratched mirror walls, and cracked floor tiles inside the lift car during renovation works."
      ]
    },
    {
      "id": "lb_mq_4",
      "questionText": "Rate overall elevator mechanical reliability and repair turnaround speed (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Elevator Reliability & Repair Turnaround Speed in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Elevator Reliability & Repair Turnaround Speed is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Elevator Reliability & Repair Turnaround Speed here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Elevator Reliability & Repair Turnaround Speed in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Elevator Reliability & Repair Turnaround Speed in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_doorstep_deliveries",
  "topicId": "doorstep-deliveries",
  "category": "Daily Convenience",
  "title": "How fast and seamless are Blinkit, Zepto, Swiggy, and Amazon doorstep deliveries at your flat door?",
  "description": "Evaluates Blinkit 10-min delivery ease, Swiggy rider gate security verification delays, cab lobby access, and parcel desk safety.",
  "iconName": "Package",
  "badge": "Delivery Ease",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "dd_mq_1",
      "questionText": "Do quick commerce apps like Blinkit, Zepto, and Instamart deliver grocery orders to your flat door within 10-15 minutes?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, quick commerce deliveries in our society are ultra-fast and convenient. Blinkit, Zepto, and Instamart dark stores are located barely one kilometer away, and delivery riders reach our 18th floor flat door within 10 to 12 minutes flat without any gate delays.",
        "Look, quick commerce deliveries usually take around 15 to 20 minutes in our society. Gate entry verification via MyGate app takes barely a minute, after which riders come straight up to our flat door. It is very reliable, smooth, and hassle-free for daily grocery needs.",
        "Honestly speaking, quick commerce deliveries take 25 to 35 minutes because main gate security guards make delivery riders queue up and leave physical ID cards at the entry barrier. Riders often call complaining about long security verification queues, causing frustrated riders and delayed food deliveries.",
        "Main annoyance is society management strictly bans delivery riders from coming up to flat doors. You have to walk all the way down to the main entrance gate or ground parcel collection desk every single time you order grocery or food items, which is very inconvenient during monsoon season."
      ]
    },
    {
      "id": "dd_mq_2",
      "questionText": "Can Uber, Ola, and BluSmart ride-hailing cabs drive right up to your tower lobby doorstep for pickup and drop?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, Uber, Ola, and BluSmart cabs can drive directly right up to the tower main lobby drop-off porch without any restriction. Security checks cab registration automatically on app, making early morning airport drops and rainy day cab pick-ups super comfortable and smooth for families.",
        "Look, cabs are allowed up to tower lobby drop-off point after driver enters flat number at main gate barrier. It takes about two minutes for cab to reach lobby drop-off area, which works fine, safely, comfortably, and smoothly for daily commuting residents in our society.",
        "Honestly speaking, cab entry process is very slow in our society because security guards stop every single cab and demand manual driver phone number verification, causing frustrated cab drivers to cancel rides frequently outside the main entrance gate during peak morning office commute hours in our area.",
        "Main problem in our society is cabs are strictly prohibited inside society internal driveways. Elderly senior citizens and passengers carrying heavy travel luggage are forced to walk long distances from main gate to tower lobby, which is very inconvenient and tiresome during hot summer days."
      ]
    },
    {
      "id": "dd_mq_3",
      "questionText": "Is the common tower parcel collection desk safe and well-organized for keeping Amazon and Flipkart packages?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, ground floor tower entrance lobby has a dedicated CCTV-monitored parcel room with organized shelving. Security guards log every incoming courier package digitally on society mobile app, so uncollected Amazon parcels remain 100% safe until picked up by flat residents.",
        "Look, lobby parcel collection desk is generally safe and well-organized in our residential building. Delivery personnel leave courier packages on designated tables sorted by flat wing numbers. We have never experienced any missing, misplaced, or damaged courier parcels so far in our tower entrance lobby area.",
        "Honestly speaking, common tower lobby parcel desk is messy and completely unmonitored by security personnel. Delivery packages are dumped randomly on floor near elevators, and residents often spend ten to fifteen minutes searching for their courier parcels among stacked cardboard boxes during peak evening hours.",
        "Main issue in our residential building is courier parcels left at ground lobby frequently go missing or get damaged. Complete lack of dedicated parcel shelving or security guard supervision creates continuous disputes among flat residents regarding lost Amazon and Flipkart delivery boxes on a regular basis."
      ]
    },
    {
      "id": "dd_mq_4",
      "questionText": "Rate overall doorstep delivery speed, cab access, and quick commerce convenience (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Doorstep Delivery Speed & Cab Convenience in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Doorstep Delivery Speed & Cab Convenience is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Doorstep Delivery Speed & Cab Convenience here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Doorstep Delivery Speed & Cab Convenience in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Doorstep Delivery Speed & Cab Convenience in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_maid_availability",
  "topicId": "maid-availability",
  "category": "Daily Convenience",
  "title": "How easy is it to hire verified domestic maids, cooks, and car washers at reasonable salary rates?",
  "description": "Evaluates maid/cook availability, local union salary rate control, car washer reliability, and gate digital pass pass-through.",
  "iconName": "UserCheck",
  "badge": "Domestic Help",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "maidSetup",
      "label": "Domestic Help Setup",
      "inputType": "select",
      "options": [
        "Maid & Cook",
        "Maid Only",
        "Car Washer Only",
        "Self-Managed"
      ],
      "defaultValue": "Maid & Cook"
    }
  ],
  "followUpQuestions": [
    {
      "id": "ma_mq_1",
      "questionText": "How easy is it to find and hire reliable, verified domestic maids, cooks, and babysitters in this society?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, finding experienced domestic help in our society is completely effortless. Over 200 verified maids, cooks, and babysitters work across towers daily. You can easily find highly recommended cooks or maids within two days by asking security guards or checking society mobile app directory.",
        "Look, hiring experienced maids and cooks is reasonably easy through resident WhatsApp group references. Monthly salary rates are standard across the complex, though finding specialized North Indian or South Indian cooks during festive seasons takes about a week of active networking among neighboring flat residents.",
        "Honestly speaking, finding reliable domestic help is quite challenging in our residential society. Local maid union controls labor supply very tightly, and maids demand very high monthly wages for basic sweeping, mopping, cooking, and utensil washing compared to neighboring housing societies in this immediate locality.",
        "Main difficulty in our building is an acute shortage of reliable domestic help. Maids take frequent unannounced leaves without informing residents, quit abruptly without prior notice, and demand exorbitant monthly salaries while refusing basic housework duties like cleaning balcony floors, window glass, and dusting furniture."
      ]
    },
    {
      "id": "ma_mq_2",
      "questionText": "Are monthly salary rates for maids and cooks fair and reasonable or artificially inflated by local unions?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, monthly maid salary rates are fair, standardized, and market competitive (around 2,000 to 2,500 rupees per household work item). No aggressive union wage cartelization exists here, allowing resident families to negotiate salary mutually based on expected work quality and hours.",
        "Look, society management committee publishes recommended salary rate guidelines for domestic staff which keeps monthly wages reasonable. Experienced cooks charge 4,000 to 6,000 rupees monthly for preparing three family meals daily, which is quite fair and reasonable for the good quality home-cooked food provided for residents.",
        "Honestly speaking, local maid union dictates non-negotiable artificially inflated monthly rates in our society. Maids strictly refuse to work if you offer standard market salary rates, making daily domestic help, sweeping, cleaning, dusting, washing, and cooking support quite expensive for small nuclear families living here.",
        "Main complaint among residents is extreme wage inflation enforced by the local village union. Monthly rates are 50% higher than nearby sectors, and local union workers intimidate and threaten outside maids who try to work in our society at standard market rates without union approval."
      ]
    },
    {
      "id": "ma_mq_3",
      "questionText": "How reliable and well-organized are daily basement car washing vendor services?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, basement car washing vendors are highly organized and disciplined in our society. Dedicated car washers clean vehicles daily using clean micro-fiber cloths and water buckets at reasonable monthly rates of 600 to 800 rupees per sedan car for flat residents.",
        "Look, basement car washing services are decent and acceptable overall in our society. Our family vehicle gets cleaned five days a week, though car washers occasionally skip cleaning on rainy monsoon days, but overall vehicles stay dust-free, clean, and presentable in covered basement parking slots.",
        "Honestly speaking, basement car washers are very irregular, rushed, and careless in their work. They use dirty, muddy cloths that leave visible swirl scratches on glossy car body paint, and frequently miss washing wheels, side mirrors, and lower bumpers despite taking full monthly charges from residents.",
        "Main issue in our basement parking is a complete lack of disciplined car washing service. Vendors demand high monthly fees, spray dirty groundwater on vehicles, wipe windshield glass with greasy rags, and disappear for days without informing vehicle owners or providing replacement washers in our building."
      ]
    },
    {
      "id": "ma_mq_4",
      "questionText": "Rate overall domestic help availability, salary fairness, and car washer reliability (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Domestic Help Availability & Salary Fairness in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Domestic Help Availability & Salary Fairness is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Domestic Help Availability & Salary Fairness here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Domestic Help Availability & Salary Fairness in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Domestic Help Availability & Salary Fairness in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_monsoon_gate_flooding",
  "topicId": "monsoon-gate-flooding",
  "category": "Monsoon Realities",
  "title": "Does the main entrance gate or access road experience severe waterlogging during heavy monsoon rainstorms?",
  "description": "Evaluates entrance road waterlogging, stormwater drainage clearance speed, delivery/cab disruption, and flood resilience.",
  "iconName": "CloudRain",
  "badge": "Monsoon Flood",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "5+ years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "mg_mq_1",
      "questionText": "Does the road outside the main entrance gate experience severe waterlogging during heavy rainstorms?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society entrance and main access road are situated on elevated land with excellent storm drains. Even during torrential 100mm heavy downpours, zero waterlogging occurs outside the gate, allowing cars and hatchbacks to pass smoothly without any rain flooding.",
        "Look, temporary rainwater puddles accumulate outside the main entrance gate during heavy cloudbursts, but society high-capacity storm drains clear accumulated standing water within 20 to 30 minutes of rain stopping. The main access road remains completely passable for vehicles and pedestrians throughout the monsoon season.",
        "Honestly speaking, the outer access road suffers severe knee-deep waterlogging during heavy monsoon rainstorms. Municipal storm drains overflow rapidly, forcing low-clearance sedans, two-wheelers, auto-rickshaws, and hatchbacks to stall their engines while attempting to cross the flooded society entrance road during peak monsoon rains in our area.",
        "Main monsoon hazard in our society is severe gate flooding. Water levels rise up to two feet outside the gate during heavy rain downpours, completely trapping residents inside the complex and blocking entry for emergency ambulances, daily delivery riders, and cabs for several hours at a time."
      ]
    },
    {
      "id": "mg_mq_2",
      "questionText": "How quickly do society internal stormwater drains flush rainwater away from podium driveways and walking paths?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our internal storm drainage network is masterfully designed with proper slope gradient and heavy-duty catch pits. Rainwater drains instantly off podium driveways and garden walking paths, keeping society grounds completely dry, safe, clean, and slip-free during heavy monsoon downpours.",
        "Look, internal society driveways clear rainwater smoothly within 15 minutes of heavy downpour ending. High-capacity automated electric sump pumps installed near basement ramps operate continuously to prevent surface rain runoff from entering underground vehicle parking levels during severe monsoon rainstorms in our residential apartment complex.",
        "Honestly speaking, internal driveway storm drains get clogged by fallen dry tree leaves during heavy rainstorms, causing persistent standing water puddles on podium walking paths, jogging tracks, and garden play areas that take two to three hours to drain away completely after heavy rainfall stops.",
        "Main failure in our complex is defective internal storm drainage design. Rainwater frequently overflows from clogged podium catch basins and pours directly down basement entry ramps, creating dangerous standing water pools near lower basement vehicle parking slots during severe monsoon rainstorms in our residential society."
      ]
    },
    {
      "id": "mg_mq_3",
      "questionText": "Are food delivery apps, Blinkit, and cab services disrupted near the entrance gate on heavy monsoon rain days?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, food delivery apps and cab services operate completely uninterrupted year-round including peak monsoon storm days in our area. Delivery riders and cab drivers reach our main gate effortlessly without reporting flooded road obstacles or refusing society doorstep delivery orders.",
        "Look, minor delivery surge delays happen during heavy rain downpours as riders slow down for road safety, but Swiggy, Zomato, Zepto, and Blinkit grocery delivery services continue arriving at flat doors reliably even during peak monsoon storm days in our society without major logistical issues.",
        "Honestly speaking, cabs and online food delivery riders completely cancel orders and stop coming to our society gate during heavy monsoon rains due to outer access road waterlogging, forcing resident families to cook at home and manage without any delivery support on rainy monsoon days.",
        "Main issue on heavy monsoon days is complete isolation due to online delivery app blackouts. Uber, Ola, Swiggy, and Blinkit suspend delivery services in our area for several hours because the main entrance access road gets heavily submerged under dirty floodwater during severe rainstorms in our locality."
      ]
    },
    {
      "id": "mg_mq_4",
      "questionText": "Rate overall entrance drainage and monsoon road flood resilience (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Monsoon Gate Flooding & Road Resilience in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Monsoon Gate Flooding & Road Resilience is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Monsoon Gate Flooding & Road Resilience here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Monsoon Gate Flooding & Road Resilience in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Monsoon Gate Flooding & Road Resilience in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_monsoon_seepage",
  "topicId": "monsoon-seepage",
  "category": "Monsoon Realities",
  "title": "Are basement parking levels prone to water accumulation or flat walls prone to dampness seepage during heavy rains?",
  "description": "Examines basement sump pump reliability, flat wall seepage, ceiling drips, and exterior waterproofing.",
  "iconName": "ShieldAlert",
  "badge": "Waterproofing",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "basementLevel",
      "label": "Basement Level",
      "inputType": "select",
      "options": [
        "Basement 1 (B1)",
        "Basement 2 (B2)",
        "Basement 3 (B3)",
        "Ground / Podium"
      ],
      "defaultValue": "Basement 2 (B2)"
    }
  ],
  "followUpQuestions": [
    {
      "id": "ms_mq_1",
      "questionText": "Do basement parking floors experience water leakage, pooling, or sump pump failures during heavy rains?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, basement parking levels in our society remain 100% bone dry throughout heavy monsoon downpours. Automated dual electric sump pumps operate continuously in drainage sumps, preventing any rainwater accumulation, standing puddle formation, or wall dampness near parked resident vehicles at all times.",
        "Look, minor water dampness appears near concrete retaining wall expansion joints in lower basement levels during heavy monsoon downpours, but automated electric sump pumps flush it out quickly without allowing any standing water pooling around car tires or basement parking slot walkways in our complex.",
        "Honestly speaking, the lowest basement parking level suffers severe standing water accumulation during heavy monsoon rains. Water leaks through concrete retaining wall cracks, forming dirty water puddles that force flat residents to step carefully through puddles to reach their parked car doors in the mornings.",
        "Main structural defect in our society is severe basement inundation during monsoons. Sump pumps fail frequently during power cuts, flooding lower basement parking levels with six inches of dirty water and posing serious flood damage risk to parked resident cars and electronic lift equipment in our complex."
      ]
    },
    {
      "id": "ms_mq_2",
      "questionText": "Do water leaks, dampness patches, or ceiling drips appear inside flat walls or balcony ceilings during monsoons?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, exterior facade waterproofing and paint quality are top tier in our society towers. We have experienced zero water leakage, dampness patches, wall paint peeling, or ceiling drips inside flat walls or balconies even during relentless monsoon rainstorms in our area.",
        "Look, minor cosmetic paint flaking appears near bedroom window frame corners during monsoons due to heavy driving rain, but it dries up quickly after rainstorms stop without causing structural wall seepage, plaster damage, or deep moisture retention inside flat living rooms and master bedrooms in our building.",
        "Honestly speaking, flat outer walls suffer noticeable water seepage during monsoons in our building. Damp yellow water patches develop on bedroom walls and window corners, causing unpleasant damp smell, toxic mold growth, wall peeling, and paint blistering inside flats every rainy monsoon season in our area.",
        "Main nightmare for residents in our tower is severe wall seepage and ceiling water dripping. Rainwater leaks continuously through balcony ceilings and outer facade cracks, damaging expensive wooden wardrobes, bedroom wallpapers, electronic appliances, and valuable home furniture during heavy monsoon rainstorms in our residential society."
      ]
    },
    {
      "id": "ms_mq_3",
      "questionText": "Are elevator pits protected from basement water leakage during peak monsoon storms?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevator pits are fully waterproofed with heavy rubber membrane sealing in our building. Zero rainwater enters lift shafts, keeping elevators operating smoothly and safely 24x7 without any monsoon emergency shutdowns or electrical motor short circuits during heavy rainstorms in our area.",
        "Look, elevator pits remain dry on normal rain days, but society facility maintenance team proactively places temporary electric sump pumps near lift pit bases during heavy downpours as a standard safety precaution to keep lift shafts completely dry, safe, and functioning smoothly without breakdowns in our society.",
        "Honestly speaking, elevator pits flood frequently during heavy monsoon storms in our tower, forcing society management to shut down passenger lifts for several days together to prevent dangerous electrical motor short circuits, heavy rust damage, and electronic controller failures in our high-rise residential apartment building.",
        "Main danger during monsoon season is complete flooding of elevator shafts in our building. Floodwater pours directly into basement lift pits, submerging delicate sensor wiring, burning motors, and grounding all tower elevators for several weeks at a time during heavy monsoon rainstorms in our complex."
      ]
    },
    {
      "id": "ms_mq_4",
      "questionText": "Rate overall building waterproofing and basement flood protection (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Monsoon Waterproofing & Seepage Protection in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Monsoon Waterproofing & Seepage Protection is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Monsoon Waterproofing & Seepage Protection here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Monsoon Waterproofing & Seepage Protection in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Monsoon Waterproofing & Seepage Protection in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_committee_fairness",
  "topicId": "committee-fairness",
  "category": "Society Governance",
  "title": "How fair, unbiased, and cooperative is the managing committee regarding rules, fines, and tenant rights?",
  "description": "Covers owner vs tenant equality, arbitrary fine enforcement, committee responsiveness, and AGM audit transparency.",
  "iconName": "Scale",
  "badge": "Society Rules",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "3 - 5 years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "cf_mq_1",
      "questionText": "Are society bylaws, clubhouse access rules, and amenity permissions applied equally to both owners and tenants?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society managing committee treats apartment owners and tenant families with complete equality and respect. Tenant families enjoy identical clubhouse access, swimming pool rights, sports facilities, and festival event participation without any discriminatory rules, extra charges, or bias whatsoever.",
        "Look, society governance is generally fair, transparent, and progressive. Published bylaws apply equally to everyone, though new tenant families are required to register tenant police verification NOC on the society mobile app before obtaining full gym and swimming pool biometric access passes for facility entry.",
        "Honestly speaking, there is noticeable bias against tenant residents in our society. The managing committee restricts tenants from booking clubhouse halls for private family functions and routinely imposes extra move-in registration fees and amenity charges that flat owners do not ever have to pay at all.",
        "Main drawback in our society is hostile discriminatory committee attitude towards tenant families. Tenants are treated like second-class citizens, barred from using the main swimming pool during weekend peak hours, and automatically blamed for all visitor parking disputes and late-night noise complaints in our residential complex."
      ]
    },
    {
      "id": "cf_mq_2",
      "questionText": "Does the managing committee levy arbitrary, unreasonable, or harassing monetary fines for minor issues?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our managing committee is very reasonable, patient, and helpful. They issue polite advisory warnings on the society mobile app first for minor parking or trash placement mistakes, never imposing hasty, unfair, or arbitrary monetary penalties on residents in our society.",
        "Look, monetary fines are levied strictly for repeated severe violations like wet balcony clothes dripping or illegal guest parking. Penalties follow clearly published AGM guidelines, so flat residents consider the rule enforcement disciplined, transparent, and overall very fair for peaceful community living in our society.",
        "Honestly speaking, the committee imposes heavy arbitrary fines without giving formal warning notices. Society security guards photograph minor luggage placement in apartment corridors and slap 2,000 rupees fines directly onto monthly maintenance bills without offering flat residents any opportunity for a fair written explanation in person.",
        "Main grievance in our society is corrupt harassment by committee office bearers. Heavy arbitrary fines are imposed selectively on vocal residents who criticize society management, while committee members blatantly violate visitor parking and apartment construction noise rules themselves with total, complete impunity in our complex."
      ]
    },
    {
      "id": "cf_mq_3",
      "questionText": "Are annual maintenance budgets, vendor contracts, and AGM financial audit statements published transparently?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, financial management in our society is 100% transparent. Audited financial statements, bank balance statements, and vendor contract tenders are uploaded monthly on the society mobile app for all flat owners to inspect before annual general body AGM meetings in our society.",
        "Look, audited financial accounts are shared annually two weeks prior to the mandatory AGM meeting. Society maintenance expenditure details are presented clearly, and the managing committee answers resident financial queries and vendor contract questions satisfactorily during open general body meetings in person without any hesitation.",
        "Honestly speaking, society financial transparency is extremely poor in our building. Annual audited accounts are delayed by over six months, and the managing committee routinely avoids answering detailed resident questions regarding large security agency and landscaping vendor contract expenditures during annual general body AGM meetings.",
        "Main issue in our complex is complete opacity regarding society funds management. Millions in maintenance collections are spent without owner approval, and the managing committee flatly refuses to share bank audit statements, vendor contracts, or expense receipts with resident flat owners during annual general meetings."
      ]
    },
    {
      "id": "cf_mq_4",
      "questionText": "Rate overall managing committee fairness, transparency, and resident helpfulness (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Managing Committee Fairness & Governance in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Managing Committee Fairness & Governance is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Managing Committee Fairness & Governance here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Managing Committee Fairness & Governance in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Managing Committee Fairness & Governance in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_renovation_movein_noc",
  "topicId": "renovation-movein-noc",
  "category": "Society Governance",
  "title": "How fast and hassle-free is getting interior renovation NOCs and move-in shifting approvals?",
  "description": "Evaluates renovation NOC turnaround time, move-in shifting fees, elevator padding rules, and deposit refunds.",
  "iconName": "FileCheck",
  "badge": "NOC & Shifting",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    }
  ],
  "followUpQuestions": [
    {
      "id": "rm_mq_1",
      "questionText": "How fast does the managing committee issue flat interior renovation NOC approvals?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, getting flat interior renovation NOC in our society is completely digital and lightning fast. You upload interior contractor details, work timeline, and refundable security deposit on the society mobile app, and official NOC letter is generated within 48 hours without visiting society office in person.",
        "Look, getting renovation NOC approval takes about five to seven working days. You submit basic carpenter and electrician details along with structural undertaking form at society estate office. The approval process is standard and smooth if all required documents and contractor ID proofs are complete.",
        "Honestly speaking, getting interior renovation NOC involves tedious bureaucratic delays in our residential society. Managing committee members demand physical paper signatures from multiple busy office bearers who are rarely available at the society manager office, delaying our flat interior work start by over three frustrating weeks.",
        "Main nightmare for flat owners in our residential building is bureaucratic harassment for simple renovation permissions. Managing committee demands unreasonable structural architectural layout approvals, structural engineer safety certificates, and expensive non-refundable NOC processing fees before allowing basic flat painting, plumbing repair, and interior carpentry work."
      ]
    },
    {
      "id": "rm_mq_2",
      "questionText": "Is the tenant move-in NOC paperwork process and move-in shifting deposit refund smooth and prompt?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, tenant move-in NOC verification is completely digital and online through MyGate mobile application in our society. Shifting security deposit is refunded automatically into resident bank account within 3 business days of final move-out inspection without any unnecessary deductions or administrative delays.",
        "Look, tenant move-in paperwork takes about two working days in our residential building. Security estate office verifies tenant police verification NOC copy before issuing permanent gate entry pass. Refund of shifting security deposit takes about a week after vacating flat and completing property hand-over inspection.",
        "Honestly speaking, tenant move-in process in our residential complex involves tedious physical paperwork, police NOC submissions, and high non-refundable shifting charges. Getting tenant shifting security deposit refunded takes over a month of constant daily phone calls and personal follow-ups with society accountant and estate manager.",
        "Main complaint in our society is that managing committee levies illegal non-refundable move-in shifting charges of 10,000 rupees on tenant families and deliberately delays refunding shifting security deposits for several months together despite no damage to elevator mirrors or building lobby common property during moving."
      ]
    },
    {
      "id": "rm_mq_3",
      "questionText": "Are shifting hours and elevator padding for furniture movement strictly managed by security?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, allowed shifting hours between 9 AM and 6 PM are strictly enforced in our residential tower. Gate security guards proactively install heavy protective wall padding inside the service lift during shifting time slots to prevent heavy furniture damage to elevator mirrors and stainless steel wall panels.",
        "Look, household furniture shifting is managed smoothly and efficiently by our estate security team. Security guard actively supervises furniture loading into the padded service lift, ensuring main passenger elevators remain completely unblocked for tower residents during morning peak hours without causing any inconvenience to walking neighbors.",
        "Honestly speaking, society gate security provides zero assistance or oversight during household furniture shifting in our complex. Elevator protective wall padding is frequently missing or torn, leading to badly scratched lift walls, damaged marble floor tiles, and heated daily arguments with security guards regarding allowed shifting time slots.",
        "Main hassle during furniture shifting in our residential building is complete chaos due to total lack of security supervision. Unpadded passenger lifts get blocked for hours by movers, causing severe daily inconvenience to high-floor family residents and badly damaging elevator interior mirrors and stainless steel wall panels."
      ]
    },
    {
      "id": "rm_mq_4",
      "questionText": "Rate overall renovation NOC and move-in process ease (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Renovation NOC & Move-In Process Ease in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Renovation NOC & Move-In Process Ease is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Renovation NOC & Move-In Process Ease here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Renovation NOC & Move-In Process Ease in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Renovation NOC & Move-In Process Ease in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_hidden_charges_hikes",
  "topicId": "hidden-charges-hikes",
  "category": "Society Governance",
  "title": "Are there unexpected move-in charges, unannounced maintenance fee hikes, or separate amenity usage fees?",
  "description": "Examines unexpected move-in surcharges, annual maintenance fee hikes, separate gym/pool fees, and event levies.",
  "iconName": "Receipt",
  "badge": "Fee Clarity",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    }
  ],
  "followUpQuestions": [
    {
      "id": "hc_mq_1",
      "questionText": "Did you discover any unexpected non-refundable charges or hidden fees after moving into this society?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, financial billing in our residential society is 100% transparent without a single hidden rupee. All monthly maintenance charges, clubhouse access fees, and allotted parking costs were clearly listed upfront before moving in without any surprise fees or unexpected hidden levies later.",
        "Look, society move-in charges are mostly transparent and fair in our building. A standard refundable move-in security deposit of 5,000 rupees is collected, along with a minor one-time app registration fee of 500 rupees per flat, which is clearly communicated and completely reasonable for maintaining digital gate visitor records.",
        "Honestly speaking, we faced unexpected surprise fees after moving into this residential society. Society management office demanded a steep 15,000 rupees non-refundable tenant move-in charge and extra elevator protective padding fees that our real estate broker never disclosed before we signed the rental lease agreement.",
        "Main financial shock in our residential society is multiple hidden surcharges levied unexpectedly by the managing committee. Heavy flat ownership transfer fees, mandatory festival celebration collections, and separate clubhouse sports facility membership fees add thousands of unexpected extra rupees to our monthly household living budget."
      ]
    },
    {
      "id": "hc_mq_2",
      "questionText": "What is the typical annual maintenance fee escalation percentage agreed during General Body AGMs?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, annual maintenance fee increases in our residential society are predictable and modest, capped strictly at 3% to 5% annually to cover standard inflation. All proposed annual budget revisions are presented clearly and voted on democratically during general body AGMs with detailed financial justifications.",
        "Look, annual maintenance hikes average around 5% to 8% per year in our residential building. Increased security guard minimum wages and rising diesel generator fuel operating costs justify the moderate fee increase, which keeps society common infrastructure, elevators, clubhouse, and landscaping amenities in top shape.",
        "Honestly speaking, maintenance fee hikes are high and unpredictable in our residential complex, jumping by 15% to 20% every single year. The managing committee routinely imposes sudden special ad-hoc capital levies for tower repainting and elevator repairs without obtaining proper prior general body AGM meeting consensus.",
        "Main grievance in our residential housing complex is steep unannounced maintenance fee hikes introduced every few months by committee. Our monthly society maintenance charges have almost doubled in three years without any visible improvement in society maintenance quality, grounds cleanliness, elevator reliability, or security guard service standards."
      ]
    },
    {
      "id": "hc_mq_3",
      "questionText": "Are clubhouse, gym, and swimming pool facilities included in regular monthly maintenance fees?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, all major society clubhouse amenities including modern gym, swimming pool, indoor badminton courts, table tennis, and squash courts are 100% included in our regular monthly maintenance bill without any extra user subscription fees or hidden charges for resident families.",
        "Look, indoor gym and outdoor swimming pool usage are completely included in our regular monthly society maintenance, but night floodlight illumination for outdoor tennis courts or private professional sports coaching sessions carry nominal extra hourly charges, which is completely fair, transparent, reasonable, and well managed by our active society committee.",
        "Honestly speaking, clubhouse sports amenities carry separate expensive monthly membership fees per user in our residential society. Flat residents must pay an extra 1,500 rupees per person every single month to use the gym and swimming pool despite already paying high regular monthly maintenance charges.",
        "Main disappointment in our residential building is that major clubhouse amenities carry heavy extra user charges and strict restricted operating timings. Swimming pool and fitness gym passes require mandatory additional annual membership subscriptions, making basic recreational amenity access unnecessarily expensive for flat resident owner and tenant families."
      ]
    },
    {
      "id": "hc_mq_4",
      "questionText": "Rate overall fee transparency and financial predictability (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Fee Transparency & Financial Predictability in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Fee Transparency & Financial Predictability is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Fee Transparency & Financial Predictability here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Fee Transparency & Financial Predictability in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Fee Transparency & Financial Predictability in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_child_safety_play",
  "topicId": "child-safety-play",
  "category": "Family & Community",
  "title": "Is the society safe, vehicle-controlled, and equipped with clean, well-maintained play zones for children?",
  "description": "Evaluates vehicle speed limits in driveways/podiums, play equipment condition, rubberized flooring, and CCTV safety.",
  "iconName": "Baby",
  "badge": "Child Safety",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "familyProfile",
      "label": "Family Profile",
      "inputType": "select",
      "options": [
        "Family with Young Kids",
        "Family with Teenagers",
        "Couple Without Kids",
        "Senior Citizens"
      ],
      "defaultValue": "Family with Young Kids"
    }
  ],
  "followUpQuestions": [
    {
      "id": "cs_mq_1",
      "questionText": "How strictly is vehicle speed controlled inside internal driveways near children play areas?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, child safety in our residential society is world-class. Main podium children play area is completely 100% vehicle-free, safely elevated above basement driveway level. Young children can run around, play sports, and cycle freely without any risk of moving cars or fast delivery bikes nearby.",
        "Look, vehicle speed inside society internal driveways is strictly capped at 10 km/h with heavy rubber speed bumps installed every 20 meters. Gate security guards actively monitor driveway vehicle speed, keeping kids play zones, garden walking paths, and main building entrance lobbies very safe and secure for toddlers.",
        "Honestly speaking, internal driveway vehicle speed enforcement is somewhat lax in our housing complex. Cabs, visitor cars, and delivery motorbikes sometimes speed along internal driveways near children play zones, forcing worried parents to accompany young toddler kids constantly during evening play hours to ensure their safety.",
        "Main safety hazard in our residential society is fast-moving visitor cars and delivery scooters driving carelessly in podium driveways near the main park. Complete lack of rubber speed bumps and negligent delivery drivers pose dangerous collision safety risks to playing children during peak evening outdoor play hours."
      ]
    },
    {
      "id": "cs_mq_2",
      "questionText": "Is the children play equipment well-maintained with soft rubberized safety flooring?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, children play park equipment in our residential society is premium quality with soft 50mm shock-absorbing rubber mat flooring. Swings, slides, and climbing frames are inspected weekly by estate maintenance staff and kept spotless without any rust, splinters, or broken parts.",
        "Look, children play equipment is kept in good, well maintained condition in our central park. Swings and slides are sturdy and clean, though rubber mat flooring shows minor wear in high-use areas near the main slide landing zone, which is addressed promptly during annual maintenance cycles.",
        "Honestly speaking, children play equipment is aging and poorly maintained in our residential complex by society estate management. Broken swing chains take several weeks to repair, and hard unpadded concrete surfaces under slides pose constant fall injury hazards for young toddler children during evening outdoor playtime.",
        "Main concern for resident parents in our society is neglected, poorly maintained broken play equipment. Rusted iron swings, sharp cracked plastic edges on slides, and dirty unhygienic sand pits make the main children play park area completely unsafe, dirty, and hazardous for neighborhood young toddler kids."
      ]
    },
    {
      "id": "cs_mq_3",
      "questionText": "Are play zones and garden corridors monitored by 24x7 active CCTV security cameras?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, all children play zones, garden corridors, basement lift lobbies, and building entrance entry gates are 100% covered by high-definition 24x7 CCTV security cameras monitored live by security control room staff, giving resident parents complete physical safety and peace of mind.",
        "Look, main children play park area has active CCTV camera coverage and bright night LED lighting. Estate security guards patrol garden pathways regularly during evening play hours, ensuring a safe, secure, well lit, and closely monitored environment for all playing neighborhood children and walking parents.",
        "Honestly speaking, CCTV camera surveillance coverage has significant blind spots around kids play zones in our residential complex. Multiple security cameras have been out of order for months, and estate security guards rarely monitor play area activities or dark garden corridors during evening peak play hours.",
        "Main drawback regarding child safety in our residential society is total lack of active CCTV camera monitoring around children play areas. Security guards stay parked lazily at the main entry gate, leaving dark garden corners and kids play zones completely unmonitored during evening play times."
      ]
    },
    {
      "id": "cs_mq_4",
      "questionText": "Rate overall child safety, play area quality, and vehicle control (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Child Safety & Play Area Maintenance in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Child Safety & Play Area Maintenance is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Child Safety & Play Area Maintenance here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Child Safety & Play Area Maintenance in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Child Safety & Play Area Maintenance in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_pet_rules",
  "topicId": "pet-rules",
  "category": "Family & Community",
  "title": "How welcoming is the community towards pet owners and how clear are pet walking guidelines?",
  "description": "Assesses pet welcoming attitude, designated walking track rules, elevator restrictions, and pet dispute frequency.",
  "iconName": "HeartHandshake",
  "badge": "Pet Living",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    }
  ],
  "followUpQuestions": [
    {
      "id": "pr_mq_1",
      "questionText": "How welcoming and pet-friendly is the overall resident community attitude towards dog and cat owners?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our residential society is exceptionally pet-friendly, compassionate, and welcoming towards all resident animal lovers. Neighbors love pet dogs and cats, and pet parents meet happily during morning walking hours. Zero harassment or anti-pet bias exists anywhere in our housing complex.",
        "Look, resident community attitude towards domestic pets is balanced, respectful, and reasonable in our building. As long as pet owners keep dogs leashed and follow basic waste hygiene rules, community atmosphere remains friendly, peaceful, and harmonious for both pet owners and non-pet residents alike across all towers.",
        "Honestly speaking, there is noticeable friction between pet owners and non-pet residents in our residential building. A few senior managing committee members object to pet dogs in central common gardens, leading to frequent verbal arguments in elevators, garden walking corridors, and main building lobby areas.",
        "Main drawback for pet parents in our housing society is hostile community behavior and arbitrary rules enforced by the managing committee. Unreasonable committee restrictions, complete bans on dogs in central gardens, and constant complaints from neighbors make living here very stressful for all pet-owning families."
      ]
    },
    {
      "id": "pr_mq_2",
      "questionText": "Are designated pet walking tracks available and are pet poop scoop cleanup rules strictly enforced?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our residential society has a dedicated clean pet walking track equipped with poop bag dispenser stations and waste bins. Pet owners responsibly scoop waste immediately, keeping society lawns, central gardens, and walking pathways spotless, hygienic, pleasant, and clean for everyone.",
        "Look, pet walking guidelines are clear and well-followed in our residential complex. Responsible pet owners carry poop scoops and clean up after pets responsibly. Estate security guards issue polite reminders if someone forgets waste disposal guidelines, keeping garden walking tracks clean and odorless at all times.",
        "Honestly speaking, pet poop hygiene rules are poorly enforced in our residential society. Uncleaned dog waste on garden walking paths leads to frequent hygiene complaints from walking residents, unpleasant foul odors, and heated verbal arguments between non-pet walking residents and pet owners during evening peak hours.",
        "Main nuisance in our housing society is uncleaned dog waste left everywhere on lawns due to careless, irresponsible pet owners. Society managing committee has failed to create dedicated pet relief zones or enforce strict poop cleanup fines, creating dirty, unhygienic walking paths for all resident families."
      ]
    },
    {
      "id": "pr_mq_3",
      "questionText": "Are pets permitted in main passenger elevators or restricted to service lifts during peak hours?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, domestic pets are welcome courteously in all passenger elevators across all high-rise residential towers. Neighbors and residents share lift space politely, and pet parents thoughtfully wait for the next lift if a co-passenger expresses fear of dogs, allergies, or personal discomfort.",
        "Look, service lift is designated for domestic pets during peak morning hours between 8 AM and 9:30 AM to avoid elevator crowd congestion, which works smoothly, prevents unnecessary tower delays, and respects everyone convenience in our high-rise residential tower building during busy office rush hours.",
        "Honestly speaking, passenger elevator usage with domestic pets causes frequent heated arguments in our tower lobby. Non-pet residents demand that pets be taken strictly by service stairs or service lifts, making high-floor living very difficult, frustrating, and exhausting for dog owners and elderly pet parents.",
        "Main issue in our high-rise apartment building is strict, hostile elevator rules imposed on pet owners by society managing committee members. Pets are barred from main passenger elevators completely, forcing dog owners to wait indefinitely for slow service lifts during daily morning and evening dog walks."
      ]
    },
    {
      "id": "pr_mq_4",
      "questionText": "Rate overall pet friendliness and community harmony (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Pet Friendliness & Community Harmony in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Pet Friendliness & Community Harmony is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Pet Friendliness & Community Harmony here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Pet Friendliness & Community Harmony in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Pet Friendliness & Community Harmony in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
},
{
  "id": "mq_insider_truths",
  "topicId": "insider-truths",
  "category": "Living Experience",
  "title": "What are the unvarnished insider truths and trade-offs you wish you knew before moving in?",
  "description": "Captures first-hand retrospective wisdom: broker myths vs reality, unvarnished trade-offs, and buy/rent again sentiment.",
  "iconName": "Sparkles",
  "badge": "Insider Wisdom",
  "backgroundFields": [
    {
      "id": "residentType",
      "label": "Resident Type",
      "inputType": "radio",
      "options": [
        "Owner",
        "Tenant"
      ],
      "defaultValue": "Owner"
    },
    {
      "id": "yearsLiving",
      "label": "Tenure of Stay",
      "inputType": "select",
      "options": [
        "Less than 1 year",
        "1 - 3 years",
        "3 - 5 years",
        "5+ years"
      ],
      "defaultValue": "5+ years"
    }
  ],
  "followUpQuestions": [
    {
      "id": "it_mq_1",
      "questionText": "Looking back at your total living experience, would you buy or rent a flat in this society again without hesitation?",
      "inputType": "radio",
      "options": [
        "To be very honest with you, moving into this residential society was the best decision for our family. Quality of life, top-class maintenance, peaceful green environment, and strong security make it 100% worth every rupee. I would buy or rent a flat here again without a single second thought!",
        "Look, living here has been a very good overall living experience for our family over the years. While minor trade-offs like morning lift wait times exist, the excellent power backup, clean central grounds, and convenient locality location make it a very solid, safe, and comfortable residential society.",
        "Honestly speaking, daily apartment living experience here is average with several annoying daily trade-offs. High monthly maintenance charges, recurring summer water supply shortages, and overly strict managing committee rules make me feel there are better alternative residential societies available in this same immediate locality for families.",
        "Main regret for our family is moving into this housing complex. False initial builder sales promises, poor construction finishing quality, chronic elevator breakdowns, and hostile managing committee governance make daily apartment living very frustrating. I would definitely look for alternative residential societies if given a second choice today."
      ]
    },
    {
      "id": "it_mq_2",
      "questionText": "What is the biggest unexpected trade-off or reality that real estate brokers or builders never reveal to buyers?",
      "inputType": "radio",
      "options": [
        "To be very frank, the biggest hidden reality is peak morning elevator queues between 8:15 AM and 9 AM. Real estate brokers show empty lifts during afternoon site visits, but during morning rush hours you must factor in an extra five minutes wait time to reach ground floor main entrance lobby.",
        "Look, real estate sales brokers never mention that peak summer water tanker surcharges increase monthly maintenance bills by 10% to 15% from April to June. It is a manageable cost, but very good to know beforehand when budgeting monthly household living expenses in this residential society.",
        "Honestly speaking, main road vehicular traffic noise on lower floor flats is much louder than expected by buyers. Open balcony doors sound noisy during peak evening traffic rush hours, so installing double-glazed acoustic glass soundproof windows is essential for peaceful indoor living in our tower flat.",
        "Main hidden surprise is narrow basement parking slot alignment near large concrete pillars throughout the lower basement level. Big SUV car drivers struggle to reverse into cramped pillar slots, and brokers conveniently skip showing actual allotted parking slot locations during initial flat walk-through sales visits."
      ]
    },
    {
      "id": "it_mq_3",
      "questionText": "Which positive aspects make living in this society genuinely worthwhile and enjoyable for families?",
      "inputType": "radio",
      "options": [
        "Best positive aspect is the vibrant, warm, active, and helpful resident community in our residential society. Major Indian cultural festivals like Diwali, Holi, and Navratri are celebrated grandly, creating wonderful childhood memories for young kids and a supportive, friendly neighborhood atmosphere for everyone living here.",
        "Look, the lush green park landscaping, spotless central gardens, and 24x7 gated security guards give resident families complete safety and peace of mind. Young children play safely in vehicle-free podiums, and senior citizens enjoy peaceful, clean evening walking tracks without any vehicular noise or safety disturbance.",
        "Honestly speaking, prime strategic location near the main metro train station, top international schools, multi-specialty healthcare hospitals, shopping malls, and major expressways makes daily office commute and household grocery shopping extremely convenient, saving precious commuting hours every single day for working corporate professionals living here in our complex.",
        "Main highlight of living in this residential society is reliable infrastructure including 24x7 full power generator backup and clean uninterrupted water supply. The well-equipped clubhouse, outdoor swimming pool, badminton courts, and indoor sports facilities provide excellent recreational avenues for both children and adults during leisure weekends."
      ]
    },
    {
      "id": "it_mq_4",
      "questionText": "Overall Recommendation Rating for Prospective Buyers / Tenants (1 to 5):",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Overall Recommendation Score in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Overall Recommendation Score is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Overall Recommendation Score here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Overall Recommendation Score in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Overall Recommendation Score in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  generateRelevantExperience: (bg: Record<string, string>) => `${bg.yearsLiving || '5+ years'} ${(bg.residentType || 'Owner').toLowerCase()} sharing retrospective unvarnished living experience.`,
  generateRelevantExperienceLabels
}
];

export const STRUCTURED_QUESTIONS_DATABASE: Record<string, StructuredSubQuestion[]> = {
  "water-pressure": [
    {
      "id": "wp_mq_1",
      "topicId": "water-pressure",
      "questionText": "Does shower pressure drop significantly during morning peak hours (7:00 AM - 9:30 AM)?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, water pressure in our tower is absolutely smooth and consistent throughout the day. Even during peak morning rush hours from 7 to 9 AM when everyone is taking showers before heading to office, we get excellent flow in both bathrooms without any annoying pressure drop at all. Truly zero issues experienced so far.",
        "Look, in our building, around 7:30 to 9:00 AM in the morning when most residents are getting ready for office, the shower pressure definitely drops quite a bit. It does not stop completely, but the flow becomes noticeably weaker compared to afternoons. You get used to it after a few weeks, but it is good to keep in mind before taking a quick morning shower.",
        "Honestly speaking, morning time pressure in our upper floor shower is quite frustrating. Between 8 AM and 9 AM, if somebody runs the kitchen tap or washing machine simultaneously, the shower flow drops to a thin trickle. We actually had to install a small domestic booster pump inside our bathroom to manage decent morning water pressure.",
        "Main problem in our society is during morning peak hours when water pressure drops severely. Many times around 8 AM there is hardly any water coming in the shower head and you have to use bucket and mug instead. Society committee keeps saying they will fix booster pumps, but problem is still continuing every single morning."
      ]
    },
    {
      "id": "wp_mq_2",
      "topicId": "water-pressure",
      "questionText": "How is tap and shower water pressure on upper floors (10th floor and above) compared to lower floors?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "Look, on upper floors like our 14th floor, pressure is surprisingly strong and consistent because the society overhead booster pumps work continuously. Taps and showers work with full force round the clock, so living on high floors does not mean weak water pressure at all. Very pleased with the plumbing work done here.",
        "Honestly speaking, upper floor pressure is decent enough for daily usage, though lower floor residents get slightly more force in their showers. Society maintenance team tunes the pressure regulating valves regularly, so while it is not extraordinarily high, you will get smooth continuous flow without any major complaints.",
        "To be frank, upper floors face occasional pressure drops whenever the central booster pump undergoes maintenance or experiences power glitches. We sometimes get air locks in pipes which causes sputtering taps for 10-15 minutes until the air clears out. It happens once or twice a month, especially on Sunday mornings.",
        "Main difficulty on top floors is that when overhead tanks run low in the afternoon, pressure drops quite sharply. You can clearly notice the difference between 5th floor and 20th floor water flow during peak daytime hours. Management really should recalibrate the auto-start water level sensors on the terrace tanks."
      ]
    },
    {
      "id": "wp_mq_3",
      "topicId": "water-pressure",
      "questionText": "When multiple taps or washing machines run simultaneously inside your flat, does tap pressure drop?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "In our flat, even if the washing machine is filling up and someone is taking a shower while kitchen utensils are being washed, tap pressure remains completely rock solid. The main internal inlet pipe diameter is quite large, so running multiple outlets simultaneously never causes any pressure reduction anywhere inside the house.",
        "Look, when the washing machine starts pulling water, there is a minor noticeable drop in the shower flow, but it is manageable. It is not severe enough to burn or freeze you, but you can feel the pressure softening slightly until the washing machine inlet valve closes. Quite standard for most apartments.",
        "Actually speaking, multi-tap usage is a major inconvenience in our apartment. If the maid opens the kitchen sink tap while you are in the shower, the shower pressure drops dramatically to a weak dribble. We have to tell family members not to use kitchen or balcony taps when someone is bathing.",
        "To be very honest, running two bathrooms at the same time is almost impossible in our flat without severe pressure loss. If both showers are turned on together, water pressure cuts by half in both bathrooms. It forces family members to take baths one by one in the morning."
      ]
    },
    {
      "id": "wp_mq_4",
      "topicId": "water-pressure",
      "questionText": "Rate overall water pressure consistency and shower satisfaction (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Water Pressure in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Water Pressure is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Water Pressure here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Water Pressure in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Water Pressure in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "water-quality": [
    {
      "id": "wq_mq_1",
      "topicId": "water-quality",
      "questionText": "Is hard water scaling causing white stains or damage to bathroom taps, showerheads, and geysers?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, water quality in our society is surprisingly soft and clean. We get direct municipal supply without heavy mineral content, so our bathroom chrome fittings, glass shower partitions, and geysers stay spotless without any white calcium stains or scaling even after years of continuous daily usage.",
        "Look, there is a mild white calcium scaling on bathroom taps and shower nozzles after a few weeks, but it is easily removable. We clean the aerators once every month using vinegar or standard bathroom cleaner spray, and it works completely fine without damaging the expensive bathroom fixtures or plumbing lines.",
        "Honestly speaking, water hardness in our locality is quite high and causes frequent headaches. White mineral crust builds up rapidly on shower heads, blocking small spray holes every fortnight. Geyser heating elements also corrode every two years, so installing a dedicated tap water softener is almost essential for long term relief.",
        "Main problem here is severe groundwater hardness when tanker water gets mixed in summer. Tap aerators choke continuously, hair falls quickly after washing, and glass bathroom doors turn chalky white within days. Society urgently needs a centralized water softening plant to protect flat plumbing and sanitary fittings."
      ]
    },
    {
      "id": "wq_mq_2",
      "topicId": "water-quality",
      "questionText": "What drinking water filtration setup is necessary for safe domestic drinking?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "In our society, municipal supply water TDS stays under 150 PPM, so a basic UV or UF water purifier is more than enough for safe drinking. The water tastes sweet and clean directly from kitchen tap, so high-cost multi-stage RO purifiers are really not necessary at all.",
        "Look, TDS levels fluctuate between 350 and 600 PPM depending on municipal supply and tanker mixing. Having a modern multi-stage RO purifier with mineral cartridge is essential for every flat. Once filtered through RO, drinking water tastes completely pure, odorless, and safe for young children and elderly family members.",
        "Honestly speaking, many families in our wing prefer ordering 20-liter branded drinking water cans for cooking and drinking because tap water TDS changes drastically. Buying water cans costs around 600 rupees per month, but gives complete peace of mind regarding stomach health and drinking safety.",
        "Main concern is tap water is totally unfit for drinking or cooking without heavy multi-layer filtration. Raw water frequently smells earthy during rains and carries high dissolved solids. Even for washing vegetables or making tea, boiling or RO filtration is compulsory to avoid stomach infections."
      ]
    },
    {
      "id": "wq_mq_3",
      "topicId": "water-quality",
      "questionText": "How clean, clear, and odour-free is the flush water supply in bathrooms?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, recycled flush water coming from society Sewage Treatment Plant is crystal clear and completely odorless. STP filtration plant is maintained expertly by certified technicians, so toilet bowls remain clean without any yellow stains, foul sewage smell, or chemical odor inside guest bathrooms.",
        "Look, flush water is generally clear and odorless on normal days, but during peak hot summer months, you get a slight chemical or chlorine smell when flushing toilets. It is not overwhelming or smelly, but you can tell recycled STP water is treated with excess chlorine tablets.",
        "Honestly speaking, flush water in our tower occasionally comes with a yellowish tint and mild unpleasant odor, especially on hot Sunday mornings. Sewage treatment plant air blowers break down quite frequently, causing untreated water to circulate in flushing lines until residents log complaints on the society mobile app.",
        "Main problem in our building is STP flush water comes out murky brownish and smells terrible quite often. Toilet flush tanks accumulate dark sludge at the bottom, making guest bathrooms look unhygienic and forcing us to scrub flush tanks manually with bleaching powder every few weeks to keep them clean."
      ]
    },
    {
      "id": "wq_mq_4",
      "topicId": "water-quality",
      "questionText": "Rate overall water purity, clarity, and tap health satisfaction (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Water Quality & Tap Health in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Water Quality & Tap Health is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Water Quality & Tap Health here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Water Quality & Tap Health in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Water Quality & Tap Health in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "water-availability": [
    {
      "id": "wa_mq_1",
      "topicId": "water-availability",
      "questionText": "Is municipal tap water available 24x7 without scheduled daily supply cuts?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, water supply in our society is 100% continuous 24 hours a day, 365 days a year. Society has massive underground storage sumps that buffer municipal supply seamlessly, so we have never experienced fixed water timing restrictions or empty taps in our flat.",
        "Look, water is supplied continuously throughout the day, but society management strictly monitors overhead tank levels. During scheduled maintenance or monthly tank cleaning days, water supply is turned off for two hours in the afternoon, but ample advance notice is always posted on the official society WhatsApp group.",
        "Honestly speaking, water is available only during fixed time slots morning and evening. Taps run from 6 AM to 9 AM in morning and 6 PM to 9 PM in evening to conserve water. Living with fixed water timings requires storing bucket water in bathrooms for afternoon usage.",
        "Main issue in our society is frequent unscheduled water cuts and erratic supply timings. Overhead tanks run completely dry randomly during weekends, forcing families to wait for emergency tanker arrivals. Storing large plastic drums filled with water inside bathrooms is a permanent daily struggle for all resident families."
      ]
    },
    {
      "id": "wa_mq_2",
      "topicId": "water-availability",
      "questionText": "Are private water tankers required during peak summer months (April to June)?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, zero private water tankers are required even during peak summer months from April to June. Our society has a dedicated municipal water pipeline connection with abundant daily volume allocation, so residents never spend a single extra rupee on private water tanker surcharges throughout the year.",
        "Look, during May and June peak summer heat, municipal supply pressure drops slightly, so society management orders a few private tankers daily to supplement the main underground sump. Monthly maintenance charges increase marginally by 200 rupees during summer, but water flow inside flats remains completely uninterrupted throughout the day.",
        "Honestly speaking, the summer water crisis is quite severe in our locality. From April to July, our society depends heavily on 30 to 40 private water tankers every single day. Maintenance bills shoot up drastically during these peak months, and management enforces strict water rationing rules during afternoon hours.",
        "Main problem every summer in our area is total dependency on expensive private water tankers. Tanker rates skyrocket without warning, society reserves run out of funds, and severe water cuts are imposed where water is supplied for barely two hours daily. It causes immense frustration for all residing families."
      ]
    },
    {
      "id": "wa_mq_3",
      "topicId": "water-availability",
      "questionText": "How often do unscheduled pipeline leakage repairs cause water shutdowns per month?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, unscheduled pipeline shutdowns practically never happen here because our society internal CPVC plumbing network is brand new and built with top-quality materials. We have enjoyed completely uninterrupted water supply without any emergency repair cuts or sudden plumbing shutdowns since moving into this flat.",
        "Look, occasional pipeline repair shutdowns happen maybe once in three or four months when a main riser pipe joint develops a small leakage. Society plumber fixes the line within two to three hours, so water supply is restored before evening without causing any major inconvenience to working families.",
        "Honestly speaking, frequent pipe bursts and leakage repairs cause sudden unscheduled water cuts at least twice every month. Underground distribution pipes are quite old and crack under pressure, leaving entire towers without water for five to six hours unexpectedly until plumbing contractors replace the damaged section.",
        "Main problem in our building is plumbing valves and riser pipes break down continuously due to high pressure. Water supply gets shut down without any advance warning almost every week, disrupting cooking, cleaning, and bathing schedules for entire tower wings and causing severe frustration among resident families."
      ]
    },
    {
      "id": "wa_mq_4",
      "topicId": "water-availability",
      "questionText": "Rate overall 24x7 water availability and summer peace of mind (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding 24x7 Water Availability & Summer Peace of Mind in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with 24x7 Water Availability & Summer Peace of Mind is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with 24x7 Water Availability & Summer Peace of Mind here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with 24x7 Water Availability & Summer Peace of Mind in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for 24x7 Water Availability & Summer Peace of Mind in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "parking-usability": [
    {
      "id": "pk_mq_1",
      "topicId": "parking-usability",
      "questionText": "Is your allotted car parking slot wide enough to park comfortably without touching pillars or neighbor cars?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, parking slots in our basement are extremely wide and well designed. Even with a large SUV like Creta or Fortuner, you can park effortlessly with plenty of space on both sides to open car doors fully without scratching adjacent vehicles or hitting concrete pillars.",
        "Look, parking width is decent for regular sedans and hatchbacks, but if you drive a wide SUV, it is a tight fit. You have to park carefully close to the left side line so that driver side door can open comfortably. Manageable once you get used to reversing into the slot.",
        "Honestly speaking, parking slots are quite cramped and tight in our basement level. Building pillars take up significant space, forcing car doors to hit concrete edges if you are not extra careful while stepping out. Installing rubber edge guards on car doors is almost compulsory here.",
        "Main issue in our parking area is the extremely narrow slot layout originally designed by the builder. Parking two full-sized cars side by side leaves barely six inches gap between side mirrors. Drivers constantly scrape bumpers while reversing, leading to frequent heated arguments between neighboring residents."
      ]
    },
    {
      "id": "pk_mq_2",
      "topicId": "parking-usability",
      "questionText": "Are basement driving ramps, turns, and pillars easy to navigate for large cars or SUVs?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, basement entry and exit ramps are remarkably wide with gentle sloping curves and clear Convex mirror sightlines. Driving a large SUV up and down basement levels is completely smooth and stress-free without any fear of scraping underbody chassis or side alloy rims.",
        "Look, basement ramps are standard width, but B2 and B3 sharp turning corners require slow driving and careful steering wheel adjustment. Blind spots exist near ramp turns, so you must honk before taking sharp corners, but it is completely manageable with normal daily driving experience for resident drivers.",
        "Honestly speaking, basement ramp turns are very narrow with sharp blind angles and steep inclines. SUV drivers frequently scrape side panels against concrete pillar edges while navigating lower basement levels. Corner rubber guards installed on basement pillars are full of deep paint scratches from vehicles.",
        "Main hazard in our basement is incredibly tight spiral ramps with zero visibility mirrors at turning points. Two cars cannot pass each other simultaneously on the ramp, causing dangerous standoffs during peak morning office exit hours where one driver has to reverse uphill with great difficulty."
      ]
    },
    {
      "id": "pk_mq_3",
      "topicId": "parking-usability",
      "questionText": "Do neighbors double-park, block access, or park two-wheelers illegally inside car slots?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, society estate security guards enforce strict parking discipline across all basement levels. Nobody is allowed to park two-wheelers outside designated yellow lines or block neighboring car slots. Security personnel regularly stick yellow warning clamps on improperly parked guest or visitor vehicles.",
        "Look, parking discipline is generally good across all residential wings, but occasionally visiting guests or delivery personnel park two-wheelers near pillar edges that encroach slightly on driving lanes. Estate security guards clear them quickly if you call the management office or raise a ticket on the society mobile app.",
        "Honestly speaking, neighbor parking encroachment is a constant daily annoyance in our basement. Adjacent slot owners frequently park extra two-wheelers inside designated car slots, making it very difficult to swing your car into your slot without making a tedious three-point turn every single evening when returning from work.",
        "Main complaint in our basement parking levels is total lack of enforcement by management. Neighbors park extra motorbikes and bicycles directly in narrow driving aisles, completely blocking car movement. Repeated complaints to society office fall on deaf ears without any wheel clamps or penalty fines ever issued."
      ]
    },
    {
      "id": "pk_mq_4",
      "topicId": "parking-usability",
      "questionText": "Rate overall parking slot width, driveway space, and parking ease (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Parking Usability & Slot Space in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Parking Usability & Slot Space is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Parking Usability & Slot Space here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Parking Usability & Slot Space in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Parking Usability & Slot Space in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "visitor-parking": [
    {
      "id": "vp_mq_1",
      "topicId": "visitor-parking",
      "questionText": "Are dedicated visitor parking slots easily available on weekend evenings (7 PM - 10 PM)?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, visitor parking in our society is exceptionally well planned with over 50 dedicated guest slots near the main clubhouse. Even on busy Saturday evenings when residents hold dinner parties, visiting family and friends find secure indoor parking easily without any hassle.",
        "Look, visitor slots are available on weekdays, but on Friday and Saturday nights after 8 PM, visitor parking fills up quickly. If your guests arrive early around 7 PM they get a slot easily, otherwise security allows temporary parking in open podium bays with resident approval on society app.",
        "Honestly speaking, visitor parking capacity is very limited compared to the total number of flats. On weekend evenings, all guest slots are full by 7:30 PM, forcing guest cars to be turned away at the gate and park on dusty external road outside society premises.",
        "Main drawback of this society is practically zero visitor parking allotment for guests. Security flatly refuses entry to guest vehicles on weekends, forcing elderly relatives to walk long distances from outside dusty road gates. It makes hosting family functions, birthday parties, or dinner gatherings very embarrassing."
      ]
    },
    {
      "id": "vp_mq_2",
      "topicId": "visitor-parking",
      "questionText": "How smooth and quick is the gate security verification process for guest vehicles?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, gate verification for visiting guests is super smooth through MyGate mobile app. Residents pre-approve guest vehicle numbers in advance, so booming barrier gates open automatically via ANPR camera recognition without stopping guest cars or making them fill tedious physical register books at the gate.",
        "Look, security gate entry process takes barely two minutes. Security guard calls the flat via intercom or sends an instant app approval notification before issuing the visitor entry token. It is a quick disciplined procedure that ensures community safety while keeping entry delays minimal for invited visitors.",
        "Honestly speaking, security gate verification is very slow and creates long vehicle traffic queues outside the main entrance gate on weekend evenings. Guards make guests manually write phone numbers and flat details in paper registers, delaying entry by ten to fifteen minutes every single time.",
        "Main nuisance at the main entrance gate is rude security guard behavior towards visiting guest drivers and delivery personnel. Guards argue unnecessarily, misplace guest entry logs, and frequently deny entry even when residents have already approved the visitor request on the society mobile app well in advance."
      ]
    },
    {
      "id": "vp_mq_3",
      "topicId": "visitor-parking",
      "questionText": "Is external roadside parking outside the main gate safe from towing or theft?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, roadside parking outside society main gate is wide, well-lit with streetlights, and monitored by society security CCTV cameras. Traffic police never tow vehicles from our outer service road, making it completely safe for overflow guest parking during large weekend events.",
        "Look, external roadside parking is generally okay during daytime hours, but after 9 PM traffic police patrol vehicles sometimes arrive and issue heavy parking fine slips. Visiting guests parking outside should park strictly inside designated white lane markings on the outer service road to avoid sudden traffic fines.",
        "Honestly speaking, roadside parking outside society main gate is quite unsafe and risky for visiting guests. Traffic towing vans frequently tow away guest cars parked outside gate without any advance warning, and dark unlit stretches suffer occasional side mirror theft and window glass breaking incidents at night.",
        "Main problem outside our main society gate is severe narrow street congestion and traffic chaos. Parking guest cars outside on the road blocks main traffic flow, leading to frequent shouting matches between local street vendors, auto rickshaw drivers, and visiting drivers trying to find a safe parking spot."
      ]
    },
    {
      "id": "vp_mq_4",
      "topicId": "visitor-parking",
      "questionText": "Rate overall visitor parking availability and guest entry convenience (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Visitor Parking & Guest Entry Convenience in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Visitor Parking & Guest Entry Convenience is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Visitor Parking & Guest Entry Convenience here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Visitor Parking & Guest Entry Convenience in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Visitor Parking & Guest Entry Convenience in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "ev-charging": [
    {
      "id": "ev_mq_1",
      "topicId": "ev-charging",
      "questionText": "How fast and supportive is the managing committee in granting NOC for personal EV charger installation in your parking slot?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society committee is extremely forward-thinking and supportive regarding EV adoption. They issue personal charger installation NOC within 48 hours of applying on app, and society electrical team helps guide cabling from main meter board down to basement parking slot smoothly.",
        "Look, getting an EV charger NOC from society takes about one to two weeks. You have to submit an official load test certificate and charger specification documents from certified installers like Tata Power or Ather. Once paperwork is submitted, committee approves the installation with standard safety guidelines.",
        "Honestly speaking, getting NOC for personal EV charger installation requires multiple tedious follow-ups with society office staff and electrical committee members. Managing committee raises technical objections about electrical cable tray capacity and demands a heavy non-refundable inspection deposit, delaying charger installation by over a month for excited EV buyers.",
        "Main hurdle in our society is total reluctance of managing committee members to permit personal EV chargers in basement parking slots. They cite fire safety hazards and electrical transformer load overload, flatly denying personal charger NOC permissions to all resident families wanting to buy new electric cars."
      ]
    },
    {
      "id": "ev_mq_2",
      "topicId": "ev-charging",
      "questionText": "Does the society have common shared EV charging stations available in visitor bays?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, society has partnered with Kazam and Tata Power to install eight fast DC and AC common EV charging stations in visitor bays. Any resident or guest can easily scan QR code on mobile app and charge electric vehicles conveniently 24x7 without installing personal chargers.",
        "Look, society has four shared 15A slow charging sockets installed near the main clubhouse for emergency vehicle charging. It works completely fine for overnight two-wheeler electric scooter charging or top-up EV car charging at reasonable per-unit electricity billing rates managed directly through the society mobile application.",
        "Honestly speaking, society has no common shared EV charging bays or public sockets installed anywhere yet. If you do not have a personal dedicated charger installed in your allotted basement parking slot, charging your EV car or electric scooter inside society premises is completely impossible.",
        "Main complaint in our society is that common public charging sockets are constantly blocked by non-EV petrol cars parked illegally inside designated charging bays. Estate security guards rarely enforce charging bay reservation rules, making public EV charging extremely frustrating for electric vehicle owners living in this society."
      ]
    },
    {
      "id": "ev_mq_3",
      "topicId": "ev-charging",
      "questionText": "Is the society electrical transformer capacity adequate for running multiple EV chargers simultaneously?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, society transformer load capacity was upgraded recently to handle high-power EV charging loads easily. Multiple 7.2 kW personal EV chargers run simultaneously across basement slots during night hours without causing main breaker trips or electrical voltage fluctuations inside flats.",
        "Look, electrical transformer load capacity is fine currently, but society management limits total approved EV charger installations to 50 slots for safety reasons. Once that threshold is reached, a comprehensive electrical load audit will be required before approving any new personal charger load connections for resident applicants.",
        "Honestly speaking, our electrical transformer load is already near peak capacity during hot summer nights. Whenever multiple EV cars start fast charging simultaneously at night, basement sub-station circuit breakers trip occasionally, causing temporary power cuts in common basement lighting and elevator operations across residential towers.",
        "Main bottleneck in our society is old electrical wiring infrastructure and outdated sub-station panels. Managing committee claims the main electrical distribution panel cannot take any additional EV charger load without charging residents two lakh rupees per floor for transformer capacity upgrade and heavy armored cabling work."
      ]
    },
    {
      "id": "ev_mq_4",
      "topicId": "ev-charging",
      "questionText": "Rate overall EV charging readiness and committee support (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding EV Charging Infrastructure & Readiness in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with EV Charging Infrastructure & Readiness is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with EV Charging Infrastructure & Readiness here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with EV Charging Infrastructure & Readiness in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for EV Charging Infrastructure & Readiness in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "wfh-tranquility": [
    {
      "id": "wfh_mq_1",
      "topicId": "wfh-tranquility",
      "questionText": "Can you conduct important WFH client video calls without disturbing external background noise?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our flat is pin-drop silent and peaceful throughout the day. High-grade double-glazed UPVC window systems block external noise completely, allowing me to conduct crucial client presentation calls on Zoom and Teams without activating any AI background noise suppression filters.",
        "Look, during daytime WFH hours, the indoor environment is generally very peaceful. Closing double balcony glass doors keeps out most ambient outdoor sounds, though occasional lawn mower noise or afternoon delivery guy calls can be heard if windows are kept wide open. Very comfortable for hybrid remote work routines.",
        "Honestly speaking, taking WFH client calls without noise-cancelling headphones is quite difficult in our flat. Daytime hammering and drill noise from nearby flat interior renovation work, combined with echoing voices from internal garden courtyards, seep into the study room, forcing me to mute my microphone frequently.",
        "Main drawback for remote workers living here is continuous disturbing background noise throughout office hours. Children screaming in central podiums, loud TV noise bleeding through adjacent walls, and frequent heavy hallway fire door slamming make conducting professional work calls a stressful daily ordeal for IT professionals."
      ]
    },
    {
      "id": "wfh_mq_2",
      "topicId": "wfh-tranquility",
      "questionText": "How effective is inter-flat acoustic wall and ceiling soundproofing against neighbor footsteps or TV noise?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, acoustic soundproofing between flats in our building is truly exceptional. Heavy monolithic RCC shear wall construction prevents internal sound transmission entirely, so we never hear upper floor heavy footsteps, furniture dragging noise, or adjacent neighbor TV audio through shared bedroom walls.",
        "Look, wall soundproofing is decent, but impact noise from upper floor ceiling is slightly audible if kids jump or drag heavy dining chairs at night. Normal talking voices and TV audio do not bleed through walls, so basic living privacy between adjacent flats is well preserved.",
        "Honestly speaking, internal partition walls in our residential tower are quite thin AAC block construction without acoustic dampening. You can easily hear neighbor TV news broadcasts, washing machine spin cycles, and upper floor dragging furniture noise during quiet late night hours when trying to read or sleep peacefully.",
        "Main nuisance in our building is near-zero acoustic isolation between floors. You can clearly hear neighbor bathroom flush sounds, loud family arguments, and constant heavy footstep thumps from upper floor, making restful sleep and peaceful focus work very difficult without earplugs or white noise machines."
      ]
    },
    {
      "id": "wfh_mq_3",
      "topicId": "wfh-tranquility",
      "questionText": "Does daytime children playing noise in podium gardens echo into flat rooms?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, podium play areas are located far from residential tower wings, so evening children playing noise never echoes into bedrooms or living rooms. Complete acoustic serenity is maintained round the clock inside flats regardless of what floor you reside on.",
        "Look, children play in central podium courtyard between 5 PM and 7:30 PM, so some echoing shouts reach lower floor balcony windows. Closing balcony double glass sliding doors reduces indoor sound level by 80%, so it does not bother standard WFH evening work routines for remote employees.",
        "Honestly speaking, central courtyard acts like a giant sound amplifier in our wing. Shrieking noise from kids playing cricket and football in podium echoes loudly across all upper floors from 4 PM till 9 PM, making living room conversation and relaxing after work quite difficult.",
        "Main issue for podium facing flats is unbearable shrieking echo during evening play hours. Loud sound bounces off concrete tower facades, forcing residents to keep all balcony doors locked and curtains drawn tightly from 4 PM to 9 PM daily to maintain peace and quiet inside bedrooms."
      ]
    },
    {
      "id": "wfh_mq_4",
      "topicId": "wfh-tranquility",
      "questionText": "Rate overall WFH acoustic tranquility and soundproofing quality (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding WFH Acoustic Tranquility & Soundproofing in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with WFH Acoustic Tranquility & Soundproofing is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with WFH Acoustic Tranquility & Soundproofing here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with WFH Acoustic Tranquility & Soundproofing in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for WFH Acoustic Tranquility & Soundproofing in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "traffic-party-noise": [
    {
      "id": "tp_mq_1",
      "topicId": "traffic-party-noise",
      "questionText": "How disturbing is main road traffic horn noise and heavy vehicle rumble on flat balconies?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, even though our flat balcony faces the main arterial road, high-grade double-glazed acoustic glass balcony sliding doors reduce external traffic sound to a faint whisper. You can sit peacefully in living room without hearing annoying vehicle horns or bus engines.",
        "Look, main road traffic noise is noticeable during peak morning and evening traffic rush hours if balcony sliding doors are kept open. However, once you slide closed the double-glazed sound-insulated glass windows, interior noise levels drop significantly to comfortable peaceful levels for working and sleeping inside.",
        "Honestly speaking, main road traffic noise is relentless and loud in our residential building. Continuous heavy truck rumble, loud pressure horns, and emergency sirens bleed into bedrooms throughout the day and late night, forcing us to keep all balcony windows and sliding glass doors permanently shut and locked.",
        "Main nightmare for road-facing flats in our tower is unbearable traffic noise from the busy main road. Loud modified silencer motorbikes and state transport bus pressure horns blast continuously past midnight, disrupting sleep and making peaceful living room family relaxation completely impossible for residents living on lower floors."
      ]
    },
    {
      "id": "tp_mq_2",
      "topicId": "traffic-party-noise",
      "questionText": "Do weekend clubhouse events, weddings, or poolside parties cause loud music noise in flats?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, clubhouse party hall is located in a dedicated basement zone far away from residential towers, so weekend birthday parties or poolside events never cause loud music noise inside flat bedrooms. Complete acoustic peace is maintained every weekend for residents.",
        "Look, weekend birthday party celebrations and festival DJ events at the clubhouse create a lively music sound until 9:30 PM sharp. It is an energetic festive atmosphere that stops promptly before bedtime, so most resident families do not mind it at all during weekend evenings here.",
        "Honestly speaking, weekend party noise from open lawn celebrations is quite loud and annoying for residents living in facing towers. Heavy high-decibel bass speakers vibrate flat window glass panes during late evening parties, making early sleeping impossible for young kids, elderly parents, and working professionals alike.",
        "Main problem in our society is unchecked party noise during weekends. Private clubhouse parties blast loud DJ music past midnight on weekend nights, and estate security guards refuse to stop party hosts despite repeated resident phone calls and angry messages on official society mobile application."
      ]
    },
    {
      "id": "tp_mq_3",
      "topicId": "traffic-party-noise",
      "questionText": "How strictly does society security enforce the 10:00 PM late-night noise cutoff policy?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society security team strictly enforces 10 PM quiet hours rule across all common lawns and clubhouse facilities. At 10 PM sharp, patrolling security guards respectfully ask party organizers to shut off outdoor music speakers and move indoors without any exception.",
        "Look, society security staff enforces 10 PM noise cutoff rules reasonably well on regular weekdays. On major Indian festival nights like Diwali or New Year Eve, celebrations extend till 11:30 PM with prior general body approval, which is completely acceptable to most resident families living here.",
        "Honestly speaking, 10 PM noise regulation policy is very poorly enforced by estate management. Late night outdoor drinking parties near the swimming pool deck continue playing loud DJ music till 1 AM without security intervention, leading to heated arguments on our official society WhatsApp group every weekend.",
        "Main failure in our society is the complete absence of night security intervention during late hours. Loud brawls and drunken yelling near clubhouse lawns past midnight are common occurrence, and security guards claim they have no authority to stop wealthy committee members or influential flat owners."
      ]
    },
    {
      "id": "tp_mq_4",
      "topicId": "traffic-party-noise",
      "questionText": "Rate overall freedom from external traffic and party noise disturbance (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Freedom from Traffic & Party Noise in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Freedom from Traffic & Party Noise is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Freedom from Traffic & Party Noise here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Freedom from Traffic & Party Noise in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Freedom from Traffic & Party Noise in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "power-cuts": [
    {
      "id": "pc_mq_1",
      "topicId": "power-cuts",
      "questionText": "How often does the state electricity grid experience unscheduled power outages per week?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, the local state electricity grid in our locality is remarkably stable and reliable. We experience zero unscheduled power cuts on most weeks, and municipal grid power runs continuously 24x7 without sudden blackouts, neighborhood transformer trips, or annoying voltage drops.",
        "Look, municipal grid power is generally good, but during monsoon thunderstorms or hot summer afternoons, short ten-minute power cuts happen once or twice a week. Society heavy diesel generator kicks in automatically within fifteen seconds, so daily household routine and WFH office work is barely impacted at all.",
        "Honestly speaking, unscheduled power outages are quite frequent in our locality, happening three to four times every single week. Municipal electricity grid trips regularly during peak afternoon heat due to heavy local transformer load and weak overhead feeder lines across our surrounding neighborhood residential area.",
        "Main nuisance in our locality is chronic electricity grid instability and poor feeder line maintenance by municipal authorities. Power cuts last for two to three hours every single afternoon during summer months, putting immense pressure on society diesel generator backup systems and increasing monthly maintenance bills for flat residents."
      ]
    },
    {
      "id": "pc_mq_2",
      "topicId": "power-cuts",
      "questionText": "Do voltage fluctuations or high-voltage spikes occur that risk damaging AC compressors or refrigerators?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society sub-station transformer is equipped with heavy-duty automatic voltage regulators and industrial surge arrestors. Electrical voltage remains perfectly steady at 230V without dangerous voltage spikes or dimming lights, keeping modern inverter ACs, double-door refrigerators, and expensive home electronics 100% safe.",
        "Look, minor voltage dips happen occasionally when municipal grid power switches over to society diesel generator mode, but modern home appliances handle it fine. Still, we use dedicated digital voltage stabilizers for expensive OLED televisions and double-door refrigerators as a standard safety precaution inside our flat.",
        "Honestly speaking, severe voltage fluctuations happen frequently during hot summer peak load hours in our tower. LED tube lights flicker noticeably and split AC compressors trip automatically due to low voltage drops below 180V, requiring dedicated electronic voltage stabilizers on every major home appliance to prevent damage.",
        "Main risk here in our society is severe high-voltage surges during grid power restoration after blackouts. Last summer, two neighboring residents suffered burnt motherboard circuit electronics in split ACs and smart televisions due to sudden high-voltage power surges when municipal grid power snapped back on unexpectedly."
      ]
    },
    {
      "id": "pc_mq_3",
      "topicId": "power-cuts",
      "questionText": "How much advance notification does electricity DISCOM provide before scheduled weekly maintenance blackouts?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, state electricity DISCOM and society estate office post official SMS alerts and app notifications 24 hours in advance before any scheduled Thursday grid maintenance blackout. This gives complete clarity to plan WFH laptop charges and remote work schedules accordingly for all resident employees.",
        "Look, scheduled grid maintenance blackout alerts are posted on society WhatsApp group on the morning of maintenance day. Power cuts usually run from 10 AM to 2 PM, during which full society diesel generator backup is provided for essential flat lighting, ceiling fans, and Wi-Fi routers.",
        "Honestly speaking, sudden unscheduled grid maintenance shutdowns happen without any prior notice from the local electricity department. You sit down for important WFH client work only to find total blackout, and DISCOM customer care helpline has no clear timeline for power restoration for hours together.",
        "Main headache in our locality area is the total lack of advance communication from state electricity department. DISCOM cuts grid power for eight hours straight on weekdays without any advance warning, causing severe WFH work disruption and draining personal UPS inverter batteries completely long before evening."
      ]
    },
    {
      "id": "pc_mq_4",
      "topicId": "power-cuts",
      "questionText": "Rate overall grid power reliability and voltage stability (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Grid Power Reliability & Voltage Stability in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Grid Power Reliability & Voltage Stability is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Grid Power Reliability & Voltage Stability here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Grid Power Reliability & Voltage Stability in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Grid Power Reliability & Voltage Stability in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "generator-backup": [
    {
      "id": "gb_mq_1",
      "topicId": "generator-backup",
      "questionText": "Does diesel generator backup support running heavy appliances like inverter ACs, geysers, or microwave ovens inside flats?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, generator backup in our society is 100% full load 24x7. Each flat gets up to 5 kW to 8 kW generator allocation, allowing us to run multiple 1.5 ton inverter ACs, refrigerator, television, and lights simultaneously during prolonged power blackouts without any breaker tripping.",
        "Look, generator backup supports up to 3 kW load per flat. It runs all fans, lights, Wi-Fi router, refrigerator, and one 1.5-ton inverter AC comfortably. If you attempt to turn on a second AC or heavy water geyser, internal automatic current limiter trips immediately to protect generator circuit.",
        "Honestly speaking, generator backup is strictly restricted to basic lights, fans, and TV only (1.5 kW max limit per flat). Running heavy power appliances like split air conditioners, washing machines, or induction cooktops on DG backup is strictly prohibited by society committee to conserve expensive diesel fuel.",
        "Main drawback in our building is zero in-flat generator power backup. Diesel generator powers only common area elevator lifts, staircase corridor lighting, and domestic water supply pumps. Inside private flats, you have to depend entirely on personal home inverter batteries during long municipal grid power outages."
      ]
    },
    {
      "id": "gb_mq_2",
      "topicId": "generator-backup",
      "questionText": "How fast does the diesel generator auto-switchover kick in when main grid power fails?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, auto-switchover panel is lightning fast, restoring power within 5 to 10 seconds of grid failure. Wi-Fi routers connected with small mini UPS do not even reboot, and inverter AC compressors resume cooling smoothly without requiring manual reset or intervention.",
        "Look, generator switchover takes around 20 to 30 seconds after grid failure. Flat lights flicker briefly and go dark for half a minute before heavy DG engine revs up and powers the tower, which is quite acceptable and standard for residential apartment buildings in India.",
        "Honestly speaking, DG auto-switchover is sluggish and takes two to three minutes every time municipal grid power fails. Manual operator sometimes takes five minutes to start generator set at night, leaving elevator lifts stuck between floors temporarily and dark staircase corridors until DG starts up properly.",
        "Main complaint in our building is generator auto-start control panel breaks down frequently. Sudden grid power outages leave residential towers pitch dark for 15 to 20 minutes until security guards manually go to generator yard to pull start manual switches, causing severe panic among family residents stuck inside elevator cars."
      ]
    },
    {
      "id": "gb_mq_3",
      "topicId": "generator-backup",
      "questionText": "Are diesel generator backup usage charges billed transparently through prepaid sub-meters or monthly maintenance?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, DG power usage is metered accurately through smart dual-source prepaid electricity sub-meters. You pay exactly for actual units consumed on DG backup at transparent government approved diesel per-unit tariffs without any hidden surcharges or unfair extra estimates on monthly bills.",
        "Look, generator diesel fuel cost is included directly in monthly maintenance bill based on actual monthly diesel purchase invoices shared on society mobile application. It is fair and transparent, adding around 300 to 500 rupees extra per flat during peak summer power cuts without hidden fees.",
        "Honestly speaking, our society managing committee levies heavy ad-hoc generator surcharge fees on monthly maintenance bills without sharing audited fuel consumption logs or actual diesel fuel purchase receipts, causing frequent heated arguments and disputes between flat residents and managing committee members during our monthly general body society meetings.",
        "Main issue in our building is exorbitant per-unit rates charged for generator power during outages. Flat residents are forced to pay 30 rupees per unit without any breakdown of diesel fuel consumption, making running split AC on generator backup extremely expensive and unaffordable during long summer blackouts."
      ]
    },
    {
      "id": "gb_mq_4",
      "topicId": "generator-backup",
      "questionText": "Rate overall generator backup power sufficiency and switchover speed (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Generator Power Backup & Switchover Speed in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Generator Power Backup & Switchover Speed is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Generator Power Backup & Switchover Speed here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Generator Power Backup & Switchover Speed in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Generator Power Backup & Switchover Speed in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "lift-waiting-times": [
    {
      "id": "lw_mq_1",
      "topicId": "lift-waiting-times",
      "questionText": "How long do you typically wait for an elevator during peak morning office hours (8:00 AM - 9:30 AM)?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevator service in our tower is incredibly fast and efficient. With four high-speed Schindler lifts serving 20 floors, average wait time during peak morning office rush is less than 60 seconds. You never face crowded lobbies or missed lift cars.",
        "Look, morning wait time is around two to three minutes between 8:30 AM and 9:00 AM when office goers and school kids head down together. It gets a little busy in the lobby, but the intelligent lift dispatch algorithm manages passenger traffic smoothly so nobody gets delayed significantly.",
        "Honestly speaking, elevator waiting during morning rush hours takes five to seven minutes in our tower. Lifts stop at almost every single floor on the way down, arriving completely full at middle floors and forcing residents to wait for two or three lift cycles continuously.",
        "Main nightmare in our tower is morning elevator lift queue. Waiting time exceeds 10 to 12 minutes every single morning because two lifts out of four are constantly out of service or reserved for service staff, causing massive lobby congestion and missed office cabs continuously."
      ]
    },
    {
      "id": "lw_mq_2",
      "topicId": "lift-waiting-times",
      "questionText": "How crowded does the ground floor entrance lobby get during peak evening return hours (6 PM - 8 PM)?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our ground floor lobby remains completely organized, pleasant, and spacious during peak evening return hours. Returning residents and arriving family guests board lifts smoothly without long standing queues or chaotic crowds gathering near elevator landing doors inside our tower lobby.",
        "Look, ground entrance lobby gets moderately busy between 7 PM and 8 PM when delivery agents, domestic maids, and returning residents arrive together. It takes about two to three minutes to catch an ascending lift car, which is quite normal, manageable, and acceptable for high-rise apartment towers.",
        "Honestly speaking, ground entrance lobby gets heavily congested during peak evening return hours in our building. Delivery executive boys carrying big backpacks and returning office residents jam the lift lobby area completely, making waiting for ascending lifts uncomfortable, hot, stuffy, and crowded for resident families.",
        "Main frustration in our high-rise tower is ground lobby chaos every single evening between 6 PM and 8 PM. Delivery riders block elevator entrance doors, returning residents push forward aggressively, and lift wait times stretch beyond six to eight minutes during peak evening office return hours."
      ]
    },
    {
      "id": "lw_mq_3",
      "topicId": "lift-waiting-times",
      "questionText": "Are elevator cars equipped with high-speed smooth motor drive systems for high-rise floors?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevators in our tower are modern high-speed 2.5 m/s gearless traction lifts equipped with ultra-smooth acceleration drive systems. Reaching the 30th floor penthouse takes barely 25 seconds without any jerky stops, sudden drops, or unsettling mechanical vibration sound inside the lift car.",
        "Look, elevator lift speed is decent, steady, and smooth enough for high-rise living. Lift moves at a standard pace suitable for a 15-story residential building, though magnetic gear braking makes a slight thud sound when stopping at top floors during quiet late night hours without causing major concern.",
        "Honestly speaking, elevator lifts in our residential tower are quite slow, jerky, and creaky. It takes over a full minute to travel from ground floor up to the 12th floor, with noticeable side-to-side sway motion and uncomfortable rattling metal sounds during high wind monsoon weather conditions.",
        "Main safety concern among residents is slow, jerky, and noisy elevator movement in our high-rise building. The motor drive produces loud grinding noises during ascent, making high-floor residents very nervous and anxious about potential mechanical failures or motor breakdowns during daily travel with family members."
      ]
    },
    {
      "id": "lw_mq_4",
      "topicId": "lift-waiting-times",
      "questionText": "Rate overall elevator waiting time efficiency and lift speed satisfaction (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Elevator Waiting Time & Lift Speed in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Elevator Waiting Time & Lift Speed is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Elevator Waiting Time & Lift Speed here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Elevator Waiting Time & Lift Speed in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Elevator Waiting Time & Lift Speed in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "lift-breakdown-speed": [
    {
      "id": "lb_mq_1",
      "topicId": "lift-breakdown-speed",
      "questionText": "How often do elevators experience technical breakdowns, door sensor errors, or unexpected shutdowns per month?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevators in our tower are top-quality Otis / Mitsubishi units that almost never break down. Monthly preventative maintenance is done diligently by certified OEM engineers and technicians, so we have experienced zero sudden lift stoppages or door sensor jams during our stay here.",
        "Look, elevator lift breakdowns happen rarely, maybe once in two or three months. Usually it is a minor door sensor recalibration issue caused by delivery boys holding lift doors forcibly. It gets fixed within an hour or two by our resident maintenance technician without major inconvenience.",
        "Honestly speaking, elevator breakdowns are quite frequent in our wing, happening two to three times every single month. Lifts get stuck between floors unexpectedly or display error codes on control screens, forcing high-floor residents to climb multiple flights of stairs while carrying heavy grocery bags.",
        "Main safety concern in our building is chronic lift failure. At least one elevator out of three is permanently broken or under repair, leaving hundreds of tower residents dependent on a single overworked elevator, causing long queue delays and frequent unexpected door sensor jams during peak office hours."
      ]
    },
    {
      "id": "lb_mq_2",
      "topicId": "lift-breakdown-speed",
      "questionText": "How fast is the OEM AMC technician response time when a major elevator technical defect occurs?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society maintains a comprehensive OEM annual maintenance contract with a dedicated 24x7 resident elevator technician stationed on site. Mechanical repairs are initiated immediately after defect registration and resolved within 2 to 4 hours maximum without extended lift downtime.",
        "Look, OEM AMC technician arrives within three to four hours of a logged technical breakdown complaint. Replacement spare parts take a day or two for major drive motor issues, but status updates are posted transparently on society mobile app for all tower residents to stay informed.",
        "Honestly speaking, repair response time for broken lifts is very slow in our wing. Defective lifts remain shut down for four to five days continuously because society committee delays approving OEM spare part purchase estimates, causing severe daily inconvenience to high-floor residents and senior citizens alike.",
        "Main complaint in our building is broken lifts remain out of order for weeks together. Management committee delays releasing repair funds to OEM contractor, forcing senior citizens to walk down multiple stair flights daily, which is completely unacceptable, hazardous, and unsafe for high-rise apartment living."
      ]
    },
    {
      "id": "lb_mq_3",
      "topicId": "lift-breakdown-speed",
      "questionText": "Is a dedicated padded service elevator reserved exclusively for house shifting and material movement?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our residential tower has a dedicated stretcher-sized service lift equipped with heavy protective wall padding reserved specifically for house shifting, furniture moving, construction material transport, and daily service vendors, ensuring main passenger lifts remain clean, unblocked, and completely undamaged.",
        "Look, dedicated service elevator lift is available in our wing, but resident families must book shifting time slots in advance with the security gate office for furniture moving to avoid blocking passenger lifts during peak morning and evening office rush hours for other commuting residents.",
        "Honestly speaking, there is no separate service elevator available in our residential wing. Laborers carry heavy cement sacks, ceramic floor tiles, and bulky wooden furniture inside regular passenger lifts, causing scratched glass mirrors, dented stainless steel walls, and frequent door sensor alignment breakdowns for everyone.",
        "Main problem in our building is service lift is perpetually out of service or heavily misused. Laborers overload passenger lifts with heavy construction debris and cement bags, causing frequent mechanical motor breakdowns, scratched mirror walls, and cracked floor tiles inside the lift car during renovation works."
      ]
    },
    {
      "id": "lb_mq_4",
      "topicId": "lift-breakdown-speed",
      "questionText": "Rate overall elevator mechanical reliability and repair turnaround speed (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Elevator Reliability & Repair Turnaround Speed in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Elevator Reliability & Repair Turnaround Speed is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Elevator Reliability & Repair Turnaround Speed here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Elevator Reliability & Repair Turnaround Speed in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Elevator Reliability & Repair Turnaround Speed in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "doorstep-deliveries": [
    {
      "id": "dd_mq_1",
      "topicId": "doorstep-deliveries",
      "questionText": "Do quick commerce apps like Blinkit, Zepto, and Instamart deliver grocery orders to your flat door within 10-15 minutes?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, quick commerce deliveries in our society are ultra-fast and convenient. Blinkit, Zepto, and Instamart dark stores are located barely one kilometer away, and delivery riders reach our 18th floor flat door within 10 to 12 minutes flat without any gate delays.",
        "Look, quick commerce deliveries usually take around 15 to 20 minutes in our society. Gate entry verification via MyGate app takes barely a minute, after which riders come straight up to our flat door. It is very reliable, smooth, and hassle-free for daily grocery needs.",
        "Honestly speaking, quick commerce deliveries take 25 to 35 minutes because main gate security guards make delivery riders queue up and leave physical ID cards at the entry barrier. Riders often call complaining about long security verification queues, causing frustrated riders and delayed food deliveries.",
        "Main annoyance is society management strictly bans delivery riders from coming up to flat doors. You have to walk all the way down to the main entrance gate or ground parcel collection desk every single time you order grocery or food items, which is very inconvenient during monsoon season."
      ]
    },
    {
      "id": "dd_mq_2",
      "topicId": "doorstep-deliveries",
      "questionText": "Can Uber, Ola, and BluSmart ride-hailing cabs drive right up to your tower lobby doorstep for pickup and drop?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, Uber, Ola, and BluSmart cabs can drive directly right up to the tower main lobby drop-off porch without any restriction. Security checks cab registration automatically on app, making early morning airport drops and rainy day cab pick-ups super comfortable and smooth for families.",
        "Look, cabs are allowed up to tower lobby drop-off point after driver enters flat number at main gate barrier. It takes about two minutes for cab to reach lobby drop-off area, which works fine, safely, comfortably, and smoothly for daily commuting residents in our society.",
        "Honestly speaking, cab entry process is very slow in our society because security guards stop every single cab and demand manual driver phone number verification, causing frustrated cab drivers to cancel rides frequently outside the main entrance gate during peak morning office commute hours in our area.",
        "Main problem in our society is cabs are strictly prohibited inside society internal driveways. Elderly senior citizens and passengers carrying heavy travel luggage are forced to walk long distances from main gate to tower lobby, which is very inconvenient and tiresome during hot summer days."
      ]
    },
    {
      "id": "dd_mq_3",
      "topicId": "doorstep-deliveries",
      "questionText": "Is the common tower parcel collection desk safe and well-organized for keeping Amazon and Flipkart packages?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, ground floor tower entrance lobby has a dedicated CCTV-monitored parcel room with organized shelving. Security guards log every incoming courier package digitally on society mobile app, so uncollected Amazon parcels remain 100% safe until picked up by flat residents.",
        "Look, lobby parcel collection desk is generally safe and well-organized in our residential building. Delivery personnel leave courier packages on designated tables sorted by flat wing numbers. We have never experienced any missing, misplaced, or damaged courier parcels so far in our tower entrance lobby area.",
        "Honestly speaking, common tower lobby parcel desk is messy and completely unmonitored by security personnel. Delivery packages are dumped randomly on floor near elevators, and residents often spend ten to fifteen minutes searching for their courier parcels among stacked cardboard boxes during peak evening hours.",
        "Main issue in our residential building is courier parcels left at ground lobby frequently go missing or get damaged. Complete lack of dedicated parcel shelving or security guard supervision creates continuous disputes among flat residents regarding lost Amazon and Flipkart delivery boxes on a regular basis."
      ]
    },
    {
      "id": "dd_mq_4",
      "topicId": "doorstep-deliveries",
      "questionText": "Rate overall doorstep delivery speed, cab access, and quick commerce convenience (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Doorstep Delivery Speed & Cab Convenience in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Doorstep Delivery Speed & Cab Convenience is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Doorstep Delivery Speed & Cab Convenience here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Doorstep Delivery Speed & Cab Convenience in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Doorstep Delivery Speed & Cab Convenience in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "maid-availability": [
    {
      "id": "ma_mq_1",
      "topicId": "maid-availability",
      "questionText": "How easy is it to find and hire reliable, verified domestic maids, cooks, and babysitters in this society?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, finding experienced domestic help in our society is completely effortless. Over 200 verified maids, cooks, and babysitters work across towers daily. You can easily find highly recommended cooks or maids within two days by asking security guards or checking society mobile app directory.",
        "Look, hiring experienced maids and cooks is reasonably easy through resident WhatsApp group references. Monthly salary rates are standard across the complex, though finding specialized North Indian or South Indian cooks during festive seasons takes about a week of active networking among neighboring flat residents.",
        "Honestly speaking, finding reliable domestic help is quite challenging in our residential society. Local maid union controls labor supply very tightly, and maids demand very high monthly wages for basic sweeping, mopping, cooking, and utensil washing compared to neighboring housing societies in this immediate locality.",
        "Main difficulty in our building is an acute shortage of reliable domestic help. Maids take frequent unannounced leaves without informing residents, quit abruptly without prior notice, and demand exorbitant monthly salaries while refusing basic housework duties like cleaning balcony floors, window glass, and dusting furniture."
      ]
    },
    {
      "id": "ma_mq_2",
      "topicId": "maid-availability",
      "questionText": "Are monthly salary rates for maids and cooks fair and reasonable or artificially inflated by local unions?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, monthly maid salary rates are fair, standardized, and market competitive (around 2,000 to 2,500 rupees per household work item). No aggressive union wage cartelization exists here, allowing resident families to negotiate salary mutually based on expected work quality and hours.",
        "Look, society management committee publishes recommended salary rate guidelines for domestic staff which keeps monthly wages reasonable. Experienced cooks charge 4,000 to 6,000 rupees monthly for preparing three family meals daily, which is quite fair and reasonable for the good quality home-cooked food provided for residents.",
        "Honestly speaking, local maid union dictates non-negotiable artificially inflated monthly rates in our society. Maids strictly refuse to work if you offer standard market salary rates, making daily domestic help, sweeping, cleaning, dusting, washing, and cooking support quite expensive for small nuclear families living here.",
        "Main complaint among residents is extreme wage inflation enforced by the local village union. Monthly rates are 50% higher than nearby sectors, and local union workers intimidate and threaten outside maids who try to work in our society at standard market rates without union approval."
      ]
    },
    {
      "id": "ma_mq_3",
      "topicId": "maid-availability",
      "questionText": "How reliable and well-organized are daily basement car washing vendor services?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, basement car washing vendors are highly organized and disciplined in our society. Dedicated car washers clean vehicles daily using clean micro-fiber cloths and water buckets at reasonable monthly rates of 600 to 800 rupees per sedan car for flat residents.",
        "Look, basement car washing services are decent and acceptable overall in our society. Our family vehicle gets cleaned five days a week, though car washers occasionally skip cleaning on rainy monsoon days, but overall vehicles stay dust-free, clean, and presentable in covered basement parking slots.",
        "Honestly speaking, basement car washers are very irregular, rushed, and careless in their work. They use dirty, muddy cloths that leave visible swirl scratches on glossy car body paint, and frequently miss washing wheels, side mirrors, and lower bumpers despite taking full monthly charges from residents.",
        "Main issue in our basement parking is a complete lack of disciplined car washing service. Vendors demand high monthly fees, spray dirty groundwater on vehicles, wipe windshield glass with greasy rags, and disappear for days without informing vehicle owners or providing replacement washers in our building."
      ]
    },
    {
      "id": "ma_mq_4",
      "topicId": "maid-availability",
      "questionText": "Rate overall domestic help availability, salary fairness, and car washer reliability (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Domestic Help Availability & Salary Fairness in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Domestic Help Availability & Salary Fairness is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Domestic Help Availability & Salary Fairness here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Domestic Help Availability & Salary Fairness in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Domestic Help Availability & Salary Fairness in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "monsoon-gate-flooding": [
    {
      "id": "mg_mq_1",
      "topicId": "monsoon-gate-flooding",
      "questionText": "Does the road outside the main entrance gate experience severe waterlogging during heavy rainstorms?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society entrance and main access road are situated on elevated land with excellent storm drains. Even during torrential 100mm heavy downpours, zero waterlogging occurs outside the gate, allowing cars and hatchbacks to pass smoothly without any rain flooding.",
        "Look, temporary rainwater puddles accumulate outside the main entrance gate during heavy cloudbursts, but society high-capacity storm drains clear accumulated standing water within 20 to 30 minutes of rain stopping. The main access road remains completely passable for vehicles and pedestrians throughout the monsoon season.",
        "Honestly speaking, the outer access road suffers severe knee-deep waterlogging during heavy monsoon rainstorms. Municipal storm drains overflow rapidly, forcing low-clearance sedans, two-wheelers, auto-rickshaws, and hatchbacks to stall their engines while attempting to cross the flooded society entrance road during peak monsoon rains in our area.",
        "Main monsoon hazard in our society is severe gate flooding. Water levels rise up to two feet outside the gate during heavy rain downpours, completely trapping residents inside the complex and blocking entry for emergency ambulances, daily delivery riders, and cabs for several hours at a time."
      ]
    },
    {
      "id": "mg_mq_2",
      "topicId": "monsoon-gate-flooding",
      "questionText": "How quickly do society internal stormwater drains flush rainwater away from podium driveways and walking paths?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our internal storm drainage network is masterfully designed with proper slope gradient and heavy-duty catch pits. Rainwater drains instantly off podium driveways and garden walking paths, keeping society grounds completely dry, safe, clean, and slip-free during heavy monsoon downpours.",
        "Look, internal society driveways clear rainwater smoothly within 15 minutes of heavy downpour ending. High-capacity automated electric sump pumps installed near basement ramps operate continuously to prevent surface rain runoff from entering underground vehicle parking levels during severe monsoon rainstorms in our residential apartment complex.",
        "Honestly speaking, internal driveway storm drains get clogged by fallen dry tree leaves during heavy rainstorms, causing persistent standing water puddles on podium walking paths, jogging tracks, and garden play areas that take two to three hours to drain away completely after heavy rainfall stops.",
        "Main failure in our complex is defective internal storm drainage design. Rainwater frequently overflows from clogged podium catch basins and pours directly down basement entry ramps, creating dangerous standing water pools near lower basement vehicle parking slots during severe monsoon rainstorms in our residential society."
      ]
    },
    {
      "id": "mg_mq_3",
      "topicId": "monsoon-gate-flooding",
      "questionText": "Are food delivery apps, Blinkit, and cab services disrupted near the entrance gate on heavy monsoon rain days?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, food delivery apps and cab services operate completely uninterrupted year-round including peak monsoon storm days in our area. Delivery riders and cab drivers reach our main gate effortlessly without reporting flooded road obstacles or refusing society doorstep delivery orders.",
        "Look, minor delivery surge delays happen during heavy rain downpours as riders slow down for road safety, but Swiggy, Zomato, Zepto, and Blinkit grocery delivery services continue arriving at flat doors reliably even during peak monsoon storm days in our society without major logistical issues.",
        "Honestly speaking, cabs and online food delivery riders completely cancel orders and stop coming to our society gate during heavy monsoon rains due to outer access road waterlogging, forcing resident families to cook at home and manage without any delivery support on rainy monsoon days.",
        "Main issue on heavy monsoon days is complete isolation due to online delivery app blackouts. Uber, Ola, Swiggy, and Blinkit suspend delivery services in our area for several hours because the main entrance access road gets heavily submerged under dirty floodwater during severe rainstorms in our locality."
      ]
    },
    {
      "id": "mg_mq_4",
      "topicId": "monsoon-gate-flooding",
      "questionText": "Rate overall entrance drainage and monsoon road flood resilience (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Monsoon Gate Flooding & Road Resilience in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Monsoon Gate Flooding & Road Resilience is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Monsoon Gate Flooding & Road Resilience here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Monsoon Gate Flooding & Road Resilience in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Monsoon Gate Flooding & Road Resilience in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "monsoon-seepage": [
    {
      "id": "ms_mq_1",
      "topicId": "monsoon-seepage",
      "questionText": "Do basement parking floors experience water leakage, pooling, or sump pump failures during heavy rains?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, basement parking levels in our society remain 100% bone dry throughout heavy monsoon downpours. Automated dual electric sump pumps operate continuously in drainage sumps, preventing any rainwater accumulation, standing puddle formation, or wall dampness near parked resident vehicles at all times.",
        "Look, minor water dampness appears near concrete retaining wall expansion joints in lower basement levels during heavy monsoon downpours, but automated electric sump pumps flush it out quickly without allowing any standing water pooling around car tires or basement parking slot walkways in our complex.",
        "Honestly speaking, the lowest basement parking level suffers severe standing water accumulation during heavy monsoon rains. Water leaks through concrete retaining wall cracks, forming dirty water puddles that force flat residents to step carefully through puddles to reach their parked car doors in the mornings.",
        "Main structural defect in our society is severe basement inundation during monsoons. Sump pumps fail frequently during power cuts, flooding lower basement parking levels with six inches of dirty water and posing serious flood damage risk to parked resident cars and electronic lift equipment in our complex."
      ]
    },
    {
      "id": "ms_mq_2",
      "topicId": "monsoon-seepage",
      "questionText": "Do water leaks, dampness patches, or ceiling drips appear inside flat walls or balcony ceilings during monsoons?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, exterior facade waterproofing and paint quality are top tier in our society towers. We have experienced zero water leakage, dampness patches, wall paint peeling, or ceiling drips inside flat walls or balconies even during relentless monsoon rainstorms in our area.",
        "Look, minor cosmetic paint flaking appears near bedroom window frame corners during monsoons due to heavy driving rain, but it dries up quickly after rainstorms stop without causing structural wall seepage, plaster damage, or deep moisture retention inside flat living rooms and master bedrooms in our building.",
        "Honestly speaking, flat outer walls suffer noticeable water seepage during monsoons in our building. Damp yellow water patches develop on bedroom walls and window corners, causing unpleasant damp smell, toxic mold growth, wall peeling, and paint blistering inside flats every rainy monsoon season in our area.",
        "Main nightmare for residents in our tower is severe wall seepage and ceiling water dripping. Rainwater leaks continuously through balcony ceilings and outer facade cracks, damaging expensive wooden wardrobes, bedroom wallpapers, electronic appliances, and valuable home furniture during heavy monsoon rainstorms in our residential society."
      ]
    },
    {
      "id": "ms_mq_3",
      "topicId": "monsoon-seepage",
      "questionText": "Are elevator pits protected from basement water leakage during peak monsoon storms?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, elevator pits are fully waterproofed with heavy rubber membrane sealing in our building. Zero rainwater enters lift shafts, keeping elevators operating smoothly and safely 24x7 without any monsoon emergency shutdowns or electrical motor short circuits during heavy rainstorms in our area.",
        "Look, elevator pits remain dry on normal rain days, but society facility maintenance team proactively places temporary electric sump pumps near lift pit bases during heavy downpours as a standard safety precaution to keep lift shafts completely dry, safe, and functioning smoothly without breakdowns in our society.",
        "Honestly speaking, elevator pits flood frequently during heavy monsoon storms in our tower, forcing society management to shut down passenger lifts for several days together to prevent dangerous electrical motor short circuits, heavy rust damage, and electronic controller failures in our high-rise residential apartment building.",
        "Main danger during monsoon season is complete flooding of elevator shafts in our building. Floodwater pours directly into basement lift pits, submerging delicate sensor wiring, burning motors, and grounding all tower elevators for several weeks at a time during heavy monsoon rainstorms in our complex."
      ]
    },
    {
      "id": "ms_mq_4",
      "topicId": "monsoon-seepage",
      "questionText": "Rate overall building waterproofing and basement flood protection (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Monsoon Waterproofing & Seepage Protection in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Monsoon Waterproofing & Seepage Protection is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Monsoon Waterproofing & Seepage Protection here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Monsoon Waterproofing & Seepage Protection in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Monsoon Waterproofing & Seepage Protection in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "committee-fairness": [
    {
      "id": "cf_mq_1",
      "topicId": "committee-fairness",
      "questionText": "Are society bylaws, clubhouse access rules, and amenity permissions applied equally to both owners and tenants?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our society managing committee treats apartment owners and tenant families with complete equality and respect. Tenant families enjoy identical clubhouse access, swimming pool rights, sports facilities, and festival event participation without any discriminatory rules, extra charges, or bias whatsoever.",
        "Look, society governance is generally fair, transparent, and progressive. Published bylaws apply equally to everyone, though new tenant families are required to register tenant police verification NOC on the society mobile app before obtaining full gym and swimming pool biometric access passes for facility entry.",
        "Honestly speaking, there is noticeable bias against tenant residents in our society. The managing committee restricts tenants from booking clubhouse halls for private family functions and routinely imposes extra move-in registration fees and amenity charges that flat owners do not ever have to pay at all.",
        "Main drawback in our society is hostile discriminatory committee attitude towards tenant families. Tenants are treated like second-class citizens, barred from using the main swimming pool during weekend peak hours, and automatically blamed for all visitor parking disputes and late-night noise complaints in our residential complex."
      ]
    },
    {
      "id": "cf_mq_2",
      "topicId": "committee-fairness",
      "questionText": "Does the managing committee levy arbitrary, unreasonable, or harassing monetary fines for minor issues?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our managing committee is very reasonable, patient, and helpful. They issue polite advisory warnings on the society mobile app first for minor parking or trash placement mistakes, never imposing hasty, unfair, or arbitrary monetary penalties on residents in our society.",
        "Look, monetary fines are levied strictly for repeated severe violations like wet balcony clothes dripping or illegal guest parking. Penalties follow clearly published AGM guidelines, so flat residents consider the rule enforcement disciplined, transparent, and overall very fair for peaceful community living in our society.",
        "Honestly speaking, the committee imposes heavy arbitrary fines without giving formal warning notices. Society security guards photograph minor luggage placement in apartment corridors and slap 2,000 rupees fines directly onto monthly maintenance bills without offering flat residents any opportunity for a fair written explanation in person.",
        "Main grievance in our society is corrupt harassment by committee office bearers. Heavy arbitrary fines are imposed selectively on vocal residents who criticize society management, while committee members blatantly violate visitor parking and apartment construction noise rules themselves with total, complete impunity in our complex."
      ]
    },
    {
      "id": "cf_mq_3",
      "topicId": "committee-fairness",
      "questionText": "Are annual maintenance budgets, vendor contracts, and AGM financial audit statements published transparently?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, financial management in our society is 100% transparent. Audited financial statements, bank balance statements, and vendor contract tenders are uploaded monthly on the society mobile app for all flat owners to inspect before annual general body AGM meetings in our society.",
        "Look, audited financial accounts are shared annually two weeks prior to the mandatory AGM meeting. Society maintenance expenditure details are presented clearly, and the managing committee answers resident financial queries and vendor contract questions satisfactorily during open general body meetings in person without any hesitation.",
        "Honestly speaking, society financial transparency is extremely poor in our building. Annual audited accounts are delayed by over six months, and the managing committee routinely avoids answering detailed resident questions regarding large security agency and landscaping vendor contract expenditures during annual general body AGM meetings.",
        "Main issue in our complex is complete opacity regarding society funds management. Millions in maintenance collections are spent without owner approval, and the managing committee flatly refuses to share bank audit statements, vendor contracts, or expense receipts with resident flat owners during annual general meetings."
      ]
    },
    {
      "id": "cf_mq_4",
      "topicId": "committee-fairness",
      "questionText": "Rate overall managing committee fairness, transparency, and resident helpfulness (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Managing Committee Fairness & Governance in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Managing Committee Fairness & Governance is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Managing Committee Fairness & Governance here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Managing Committee Fairness & Governance in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Managing Committee Fairness & Governance in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "renovation-movein-noc": [
    {
      "id": "rm_mq_1",
      "topicId": "renovation-movein-noc",
      "questionText": "How fast does the managing committee issue flat interior renovation NOC approvals?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, getting flat interior renovation NOC in our society is completely digital and lightning fast. You upload interior contractor details, work timeline, and refundable security deposit on the society mobile app, and official NOC letter is generated within 48 hours without visiting society office in person.",
        "Look, getting renovation NOC approval takes about five to seven working days. You submit basic carpenter and electrician details along with structural undertaking form at society estate office. The approval process is standard and smooth if all required documents and contractor ID proofs are complete.",
        "Honestly speaking, getting interior renovation NOC involves tedious bureaucratic delays in our residential society. Managing committee members demand physical paper signatures from multiple busy office bearers who are rarely available at the society manager office, delaying our flat interior work start by over three frustrating weeks.",
        "Main nightmare for flat owners in our residential building is bureaucratic harassment for simple renovation permissions. Managing committee demands unreasonable structural architectural layout approvals, structural engineer safety certificates, and expensive non-refundable NOC processing fees before allowing basic flat painting, plumbing repair, and interior carpentry work."
      ]
    },
    {
      "id": "rm_mq_2",
      "topicId": "renovation-movein-noc",
      "questionText": "Is the tenant move-in NOC paperwork process and move-in shifting deposit refund smooth and prompt?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, tenant move-in NOC verification is completely digital and online through MyGate mobile application in our society. Shifting security deposit is refunded automatically into resident bank account within 3 business days of final move-out inspection without any unnecessary deductions or administrative delays.",
        "Look, tenant move-in paperwork takes about two working days in our residential building. Security estate office verifies tenant police verification NOC copy before issuing permanent gate entry pass. Refund of shifting security deposit takes about a week after vacating flat and completing property hand-over inspection.",
        "Honestly speaking, tenant move-in process in our residential complex involves tedious physical paperwork, police NOC submissions, and high non-refundable shifting charges. Getting tenant shifting security deposit refunded takes over a month of constant daily phone calls and personal follow-ups with society accountant and estate manager.",
        "Main complaint in our society is that managing committee levies illegal non-refundable move-in shifting charges of 10,000 rupees on tenant families and deliberately delays refunding shifting security deposits for several months together despite no damage to elevator mirrors or building lobby common property during moving."
      ]
    },
    {
      "id": "rm_mq_3",
      "topicId": "renovation-movein-noc",
      "questionText": "Are shifting hours and elevator padding for furniture movement strictly managed by security?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, allowed shifting hours between 9 AM and 6 PM are strictly enforced in our residential tower. Gate security guards proactively install heavy protective wall padding inside the service lift during shifting time slots to prevent heavy furniture damage to elevator mirrors and stainless steel wall panels.",
        "Look, household furniture shifting is managed smoothly and efficiently by our estate security team. Security guard actively supervises furniture loading into the padded service lift, ensuring main passenger elevators remain completely unblocked for tower residents during morning peak hours without causing any inconvenience to walking neighbors.",
        "Honestly speaking, society gate security provides zero assistance or oversight during household furniture shifting in our complex. Elevator protective wall padding is frequently missing or torn, leading to badly scratched lift walls, damaged marble floor tiles, and heated daily arguments with security guards regarding allowed shifting time slots.",
        "Main hassle during furniture shifting in our residential building is complete chaos due to total lack of security supervision. Unpadded passenger lifts get blocked for hours by movers, causing severe daily inconvenience to high-floor family residents and badly damaging elevator interior mirrors and stainless steel wall panels."
      ]
    },
    {
      "id": "rm_mq_4",
      "topicId": "renovation-movein-noc",
      "questionText": "Rate overall renovation NOC and move-in process ease (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Renovation NOC & Move-In Process Ease in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Renovation NOC & Move-In Process Ease is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Renovation NOC & Move-In Process Ease here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Renovation NOC & Move-In Process Ease in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Renovation NOC & Move-In Process Ease in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "hidden-charges-hikes": [
    {
      "id": "hc_mq_1",
      "topicId": "hidden-charges-hikes",
      "questionText": "Did you discover any unexpected non-refundable charges or hidden fees after moving into this society?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, financial billing in our residential society is 100% transparent without a single hidden rupee. All monthly maintenance charges, clubhouse access fees, and allotted parking costs were clearly listed upfront before moving in without any surprise fees or unexpected hidden levies later.",
        "Look, society move-in charges are mostly transparent and fair in our building. A standard refundable move-in security deposit of 5,000 rupees is collected, along with a minor one-time app registration fee of 500 rupees per flat, which is clearly communicated and completely reasonable for maintaining digital gate visitor records.",
        "Honestly speaking, we faced unexpected surprise fees after moving into this residential society. Society management office demanded a steep 15,000 rupees non-refundable tenant move-in charge and extra elevator protective padding fees that our real estate broker never disclosed before we signed the rental lease agreement.",
        "Main financial shock in our residential society is multiple hidden surcharges levied unexpectedly by the managing committee. Heavy flat ownership transfer fees, mandatory festival celebration collections, and separate clubhouse sports facility membership fees add thousands of unexpected extra rupees to our monthly household living budget."
      ]
    },
    {
      "id": "hc_mq_2",
      "topicId": "hidden-charges-hikes",
      "questionText": "What is the typical annual maintenance fee escalation percentage agreed during General Body AGMs?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, annual maintenance fee increases in our residential society are predictable and modest, capped strictly at 3% to 5% annually to cover standard inflation. All proposed annual budget revisions are presented clearly and voted on democratically during general body AGMs with detailed financial justifications.",
        "Look, annual maintenance hikes average around 5% to 8% per year in our residential building. Increased security guard minimum wages and rising diesel generator fuel operating costs justify the moderate fee increase, which keeps society common infrastructure, elevators, clubhouse, and landscaping amenities in top shape.",
        "Honestly speaking, maintenance fee hikes are high and unpredictable in our residential complex, jumping by 15% to 20% every single year. The managing committee routinely imposes sudden special ad-hoc capital levies for tower repainting and elevator repairs without obtaining proper prior general body AGM meeting consensus.",
        "Main grievance in our residential housing complex is steep unannounced maintenance fee hikes introduced every few months by committee. Our monthly society maintenance charges have almost doubled in three years without any visible improvement in society maintenance quality, grounds cleanliness, elevator reliability, or security guard service standards."
      ]
    },
    {
      "id": "hc_mq_3",
      "topicId": "hidden-charges-hikes",
      "questionText": "Are clubhouse, gym, and swimming pool facilities included in regular monthly maintenance fees?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, all major society clubhouse amenities including modern gym, swimming pool, indoor badminton courts, table tennis, and squash courts are 100% included in our regular monthly maintenance bill without any extra user subscription fees or hidden charges for resident families.",
        "Look, indoor gym and outdoor swimming pool usage are completely included in our regular monthly society maintenance, but night floodlight illumination for outdoor tennis courts or private professional sports coaching sessions carry nominal extra hourly charges, which is completely fair, transparent, reasonable, and well managed by our active society committee.",
        "Honestly speaking, clubhouse sports amenities carry separate expensive monthly membership fees per user in our residential society. Flat residents must pay an extra 1,500 rupees per person every single month to use the gym and swimming pool despite already paying high regular monthly maintenance charges.",
        "Main disappointment in our residential building is that major clubhouse amenities carry heavy extra user charges and strict restricted operating timings. Swimming pool and fitness gym passes require mandatory additional annual membership subscriptions, making basic recreational amenity access unnecessarily expensive for flat resident owner and tenant families."
      ]
    },
    {
      "id": "hc_mq_4",
      "topicId": "hidden-charges-hikes",
      "questionText": "Rate overall fee transparency and financial predictability (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Fee Transparency & Financial Predictability in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Fee Transparency & Financial Predictability is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Fee Transparency & Financial Predictability here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Fee Transparency & Financial Predictability in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Fee Transparency & Financial Predictability in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "child-safety-play": [
    {
      "id": "cs_mq_1",
      "topicId": "child-safety-play",
      "questionText": "How strictly is vehicle speed controlled inside internal driveways near children play areas?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, child safety in our residential society is world-class. Main podium children play area is completely 100% vehicle-free, safely elevated above basement driveway level. Young children can run around, play sports, and cycle freely without any risk of moving cars or fast delivery bikes nearby.",
        "Look, vehicle speed inside society internal driveways is strictly capped at 10 km/h with heavy rubber speed bumps installed every 20 meters. Gate security guards actively monitor driveway vehicle speed, keeping kids play zones, garden walking paths, and main building entrance lobbies very safe and secure for toddlers.",
        "Honestly speaking, internal driveway vehicle speed enforcement is somewhat lax in our housing complex. Cabs, visitor cars, and delivery motorbikes sometimes speed along internal driveways near children play zones, forcing worried parents to accompany young toddler kids constantly during evening play hours to ensure their safety.",
        "Main safety hazard in our residential society is fast-moving visitor cars and delivery scooters driving carelessly in podium driveways near the main park. Complete lack of rubber speed bumps and negligent delivery drivers pose dangerous collision safety risks to playing children during peak evening outdoor play hours."
      ]
    },
    {
      "id": "cs_mq_2",
      "topicId": "child-safety-play",
      "questionText": "Is the children play equipment well-maintained with soft rubberized safety flooring?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, children play park equipment in our residential society is premium quality with soft 50mm shock-absorbing rubber mat flooring. Swings, slides, and climbing frames are inspected weekly by estate maintenance staff and kept spotless without any rust, splinters, or broken parts.",
        "Look, children play equipment is kept in good, well maintained condition in our central park. Swings and slides are sturdy and clean, though rubber mat flooring shows minor wear in high-use areas near the main slide landing zone, which is addressed promptly during annual maintenance cycles.",
        "Honestly speaking, children play equipment is aging and poorly maintained in our residential complex by society estate management. Broken swing chains take several weeks to repair, and hard unpadded concrete surfaces under slides pose constant fall injury hazards for young toddler children during evening outdoor playtime.",
        "Main concern for resident parents in our society is neglected, poorly maintained broken play equipment. Rusted iron swings, sharp cracked plastic edges on slides, and dirty unhygienic sand pits make the main children play park area completely unsafe, dirty, and hazardous for neighborhood young toddler kids."
      ]
    },
    {
      "id": "cs_mq_3",
      "topicId": "child-safety-play",
      "questionText": "Are play zones and garden corridors monitored by 24x7 active CCTV security cameras?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, all children play zones, garden corridors, basement lift lobbies, and building entrance entry gates are 100% covered by high-definition 24x7 CCTV security cameras monitored live by security control room staff, giving resident parents complete physical safety and peace of mind.",
        "Look, main children play park area has active CCTV camera coverage and bright night LED lighting. Estate security guards patrol garden pathways regularly during evening play hours, ensuring a safe, secure, well lit, and closely monitored environment for all playing neighborhood children and walking parents.",
        "Honestly speaking, CCTV camera surveillance coverage has significant blind spots around kids play zones in our residential complex. Multiple security cameras have been out of order for months, and estate security guards rarely monitor play area activities or dark garden corridors during evening peak play hours.",
        "Main drawback regarding child safety in our residential society is total lack of active CCTV camera monitoring around children play areas. Security guards stay parked lazily at the main entry gate, leaving dark garden corners and kids play zones completely unmonitored during evening play times."
      ]
    },
    {
      "id": "cs_mq_4",
      "topicId": "child-safety-play",
      "questionText": "Rate overall child safety, play area quality, and vehicle control (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Child Safety & Play Area Maintenance in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Child Safety & Play Area Maintenance is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Child Safety & Play Area Maintenance here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Child Safety & Play Area Maintenance in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Child Safety & Play Area Maintenance in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "pet-rules": [
    {
      "id": "pr_mq_1",
      "topicId": "pet-rules",
      "questionText": "How welcoming and pet-friendly is the overall resident community attitude towards dog and cat owners?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our residential society is exceptionally pet-friendly, compassionate, and welcoming towards all resident animal lovers. Neighbors love pet dogs and cats, and pet parents meet happily during morning walking hours. Zero harassment or anti-pet bias exists anywhere in our housing complex.",
        "Look, resident community attitude towards domestic pets is balanced, respectful, and reasonable in our building. As long as pet owners keep dogs leashed and follow basic waste hygiene rules, community atmosphere remains friendly, peaceful, and harmonious for both pet owners and non-pet residents alike across all towers.",
        "Honestly speaking, there is noticeable friction between pet owners and non-pet residents in our residential building. A few senior managing committee members object to pet dogs in central common gardens, leading to frequent verbal arguments in elevators, garden walking corridors, and main building lobby areas.",
        "Main drawback for pet parents in our housing society is hostile community behavior and arbitrary rules enforced by the managing committee. Unreasonable committee restrictions, complete bans on dogs in central gardens, and constant complaints from neighbors make living here very stressful for all pet-owning families."
      ]
    },
    {
      "id": "pr_mq_2",
      "topicId": "pet-rules",
      "questionText": "Are designated pet walking tracks available and are pet poop scoop cleanup rules strictly enforced?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, our residential society has a dedicated clean pet walking track equipped with poop bag dispenser stations and waste bins. Pet owners responsibly scoop waste immediately, keeping society lawns, central gardens, and walking pathways spotless, hygienic, pleasant, and clean for everyone.",
        "Look, pet walking guidelines are clear and well-followed in our residential complex. Responsible pet owners carry poop scoops and clean up after pets responsibly. Estate security guards issue polite reminders if someone forgets waste disposal guidelines, keeping garden walking tracks clean and odorless at all times.",
        "Honestly speaking, pet poop hygiene rules are poorly enforced in our residential society. Uncleaned dog waste on garden walking paths leads to frequent hygiene complaints from walking residents, unpleasant foul odors, and heated verbal arguments between non-pet walking residents and pet owners during evening peak hours.",
        "Main nuisance in our housing society is uncleaned dog waste left everywhere on lawns due to careless, irresponsible pet owners. Society managing committee has failed to create dedicated pet relief zones or enforce strict poop cleanup fines, creating dirty, unhygienic walking paths for all resident families."
      ]
    },
    {
      "id": "pr_mq_3",
      "topicId": "pet-rules",
      "questionText": "Are pets permitted in main passenger elevators or restricted to service lifts during peak hours?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, domestic pets are welcome courteously in all passenger elevators across all high-rise residential towers. Neighbors and residents share lift space politely, and pet parents thoughtfully wait for the next lift if a co-passenger expresses fear of dogs, allergies, or personal discomfort.",
        "Look, service lift is designated for domestic pets during peak morning hours between 8 AM and 9:30 AM to avoid elevator crowd congestion, which works smoothly, prevents unnecessary tower delays, and respects everyone convenience in our high-rise residential tower building during busy office rush hours.",
        "Honestly speaking, passenger elevator usage with domestic pets causes frequent heated arguments in our tower lobby. Non-pet residents demand that pets be taken strictly by service stairs or service lifts, making high-floor living very difficult, frustrating, and exhausting for dog owners and elderly pet parents.",
        "Main issue in our high-rise apartment building is strict, hostile elevator rules imposed on pet owners by society managing committee members. Pets are barred from main passenger elevators completely, forcing dog owners to wait indefinitely for slow service lifts during daily morning and evening dog walks."
      ]
    },
    {
      "id": "pr_mq_4",
      "topicId": "pet-rules",
      "questionText": "Rate overall pet friendliness and community harmony (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Pet Friendliness & Community Harmony in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Pet Friendliness & Community Harmony is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Pet Friendliness & Community Harmony here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Pet Friendliness & Community Harmony in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Pet Friendliness & Community Harmony in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ],
  "insider-truths": [
    {
      "id": "it_mq_1",
      "topicId": "insider-truths",
      "questionText": "Looking back at your total living experience, would you buy or rent a flat in this society again without hesitation?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very honest with you, moving into this residential society was the best decision for our family. Quality of life, top-class maintenance, peaceful green environment, and strong security make it 100% worth every rupee. I would buy or rent a flat here again without a single second thought!",
        "Look, living here has been a very good overall living experience for our family over the years. While minor trade-offs like morning lift wait times exist, the excellent power backup, clean central grounds, and convenient locality location make it a very solid, safe, and comfortable residential society.",
        "Honestly speaking, daily apartment living experience here is average with several annoying daily trade-offs. High monthly maintenance charges, recurring summer water supply shortages, and overly strict managing committee rules make me feel there are better alternative residential societies available in this same immediate locality for families.",
        "Main regret for our family is moving into this housing complex. False initial builder sales promises, poor construction finishing quality, chronic elevator breakdowns, and hostile managing committee governance make daily apartment living very frustrating. I would definitely look for alternative residential societies if given a second choice today."
      ]
    },
    {
      "id": "it_mq_2",
      "topicId": "insider-truths",
      "questionText": "What is the biggest unexpected trade-off or reality that real estate brokers or builders never reveal to buyers?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "To be very frank, the biggest hidden reality is peak morning elevator queues between 8:15 AM and 9 AM. Real estate brokers show empty lifts during afternoon site visits, but during morning rush hours you must factor in an extra five minutes wait time to reach ground floor main entrance lobby.",
        "Look, real estate sales brokers never mention that peak summer water tanker surcharges increase monthly maintenance bills by 10% to 15% from April to June. It is a manageable cost, but very good to know beforehand when budgeting monthly household living expenses in this residential society.",
        "Honestly speaking, main road vehicular traffic noise on lower floor flats is much louder than expected by buyers. Open balcony doors sound noisy during peak evening traffic rush hours, so installing double-glazed acoustic glass soundproof windows is essential for peaceful indoor living in our tower flat.",
        "Main hidden surprise is narrow basement parking slot alignment near large concrete pillars throughout the lower basement level. Big SUV car drivers struggle to reverse into cramped pillar slots, and brokers conveniently skip showing actual allotted parking slot locations during initial flat walk-through sales visits."
      ]
    },
    {
      "id": "it_mq_3",
      "topicId": "insider-truths",
      "questionText": "Which positive aspects make living in this society genuinely worthwhile and enjoyable for families?",
      "type": "single-choice",
      "inputType": "radio",
      "options": [
        "Best positive aspect is the vibrant, warm, active, and helpful resident community in our residential society. Major Indian cultural festivals like Diwali, Holi, and Navratri are celebrated grandly, creating wonderful childhood memories for young kids and a supportive, friendly neighborhood atmosphere for everyone living here.",
        "Look, the lush green park landscaping, spotless central gardens, and 24x7 gated security guards give resident families complete safety and peace of mind. Young children play safely in vehicle-free podiums, and senior citizens enjoy peaceful, clean evening walking tracks without any vehicular noise or safety disturbance.",
        "Honestly speaking, prime strategic location near the main metro train station, top international schools, multi-specialty healthcare hospitals, shopping malls, and major expressways makes daily office commute and household grocery shopping extremely convenient, saving precious commuting hours every single day for working corporate professionals living here in our complex.",
        "Main highlight of living in this residential society is reliable infrastructure including 24x7 full power generator backup and clean uninterrupted water supply. The well-equipped clubhouse, outdoor swimming pool, badminton courts, and indoor sports facilities provide excellent recreational avenues for both children and adults during leisure weekends."
      ]
    },
    {
      "id": "it_mq_4",
      "topicId": "insider-truths",
      "questionText": "Overall Recommendation Rating for Prospective Buyers / Tenants (1 to 5):",
      "type": "rating",
      "inputType": "rating",
      "options": [
        "1 Star (Very Poor & Frustrating): To be very frank with you, the overall performance and experience regarding Overall Recommendation Score in this society is completely unacceptable. We face severe daily difficulties that make living here quite frustrating for our entire family, and management has failed to take effective corrective action so far.",
        "2 Stars (Subpar & Below Expectations): Look, the situation with Overall Recommendation Score is quite inconsistent and well below what was promised by the builder. While it functions fine on quiet afternoons, peak hours bring noticeable problems that disrupt our daily routine and require constant personal adjustments to manage smoothly.",
        "3 Stars (Average & Manageable): Honestly speaking, the experience with Overall Recommendation Score here is reasonably average and manageable for daily living. You will encounter minor hiccups occasionally during busy hours, but it is acceptable overall and does not cause any major disruption to our family lifestyle.",
        "4 Stars (Good & Satisfactory): To be honest, we are quite satisfied with Overall Recommendation Score in our tower overall. The arrangements function smoothly on most days with very rare minor issues that are promptly addressed by maintenance staff. Truly a comfortable and hassle-free experience for most residents here.",
        "5 Stars (Flawless & Premium Quality): Look, the management and infrastructure for Overall Recommendation Score in this society is absolutely top-class without doubt. Everything runs seamlessly 24x7 with zero complaints from our side. Truly a high-quality, reliable, and premium living setup that makes staying here a complete peace of mind."
      ]
    }
  ]
};


export function getStructuredQuestionsForTopic(topicId: string): StructuredSubQuestion[] {
  const customData = loadCustomExcelDataFromStorage();
  if (customData && customData.questionsMap && customData.questionsMap[topicId] && customData.questionsMap[topicId].length > 0) {
    return customData.questionsMap[topicId];
  }
  return STRUCTURED_QUESTIONS_DATABASE[topicId] || [];
}

export function getAllStructuredQuestionsMap(): Record<string, StructuredSubQuestion[]> {
  const customData = loadCustomExcelDataFromStorage();
  if (customData && customData.questionsMap) {
    return { ...STRUCTURED_QUESTIONS_DATABASE, ...customData.questionsMap };
  }
  return STRUCTURED_QUESTIONS_DATABASE;
}

export function getQuestionsForTopic(topicId: string): ContributorQuestion[] {
  const subQuestions = getStructuredQuestionsForTopic(topicId);
  const topicDef = CONTRIBUTOR_TOPICS.find(t => t.id === topicId);
  const topicTitle = topicDef ? topicDef.title : 'General';
  return subQuestions.map((sq, idx) => ({
    id: sq.id,
    topicId: sq.topicId,
    topicTitle: topicTitle,
    questionText: sq.questionText,
    category: sq.type || 'General',
    order: idx + 1,
    options: sq.options,
    inputType: sq.inputType || (sq.type === 'rating' ? 'rating' : 'radio')
  }));
}
