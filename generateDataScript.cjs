const fs = require('fs');
const path = require('path');

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function assertOptions(options, label) {
  options.forEach((opt, i) => {
    const wc = countWords(opt);
    if (wc < 45 || wc > 100) {
      throw new Error(`[WORD COUNT FAIL] ${label} -> Choice ${i + 1}: ${wc} words (Allowed: 45-100)\nText: "${opt}"`);
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

const mainCatalog = [
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
          'To be frank, upper floors face occasional pressure drops whenever the central booster pump undergoes maintenance or experiences power glitches. We sometimes get air locks in pipes which causes sputtering taps for 10-15 minutes until the air clears out. It happens once or twice a month, especially on Sunday mornings.',
          'Main difficulty on top floors is that when overhead tanks run low in the afternoon, pressure drops sharply. You can clearly notice the difference between 5th floor and 20th floor water flow. Management should recalibrate the auto-start water level sensors on the terrace tanks.'
        ]
      },
      {
        id: 'wp_mq_3',
        questionText: 'When multiple taps or washing machines run simultaneously inside your flat, does tap pressure drop?',
        inputType: 'radio',
        options: [
          'In our flat, even if the washing machine is filling up and someone is taking a shower while kitchen utensils are being washed, tap pressure remains completely rock solid. The main internal inlet pipe diameter is quite large, so running multiple outlets simultaneously never causes any pressure reduction anywhere inside the house.',
          'Look, when the washing machine starts pulling water, there is a minor noticeable drop in the shower flow, but it is manageable. It is not severe enough to burn or freeze you, but you can feel the pressure softening slightly until the washing machine inlet valve closes. Quite standard for most apartments.',
          'Actually speaking, multi-tap usage is a major inconvenience in our apartment. If the maid opens the kitchen sink tap while you are in the shower, the shower pressure drops dramatically to a weak dribble. We have to tell family members not to use kitchen or balcony taps when someone is bathing.',
          'To be very honest, running two bathrooms at the same time is almost impossible in our flat without severe pressure loss. If both showers are turned on together, water pressure cuts by half in both bathrooms. It forces family members to take baths one by one in the morning.'
        ]
      },
      {
        id: 'wp_mq_4',
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
          'Honestly speaking, flush water in our tower occasionally comes with a yellowish tint and mild unpleasant odor, especially on Sunday mornings. Sewage treatment plant air blowers break down frequently, causing untreated water to circulate in flushing lines until residents complain on society mobile app.',
          'Main problem is STP flush water is murky brownish and smells terrible quite often. Toilet flush tanks accumulate dark sludge at the bottom, making guest bathrooms look unhygienic and forcing us to clean flush tanks manually with bleaching powder every few weeks.'
        ]
      },
      {
        id: 'wq_mq_4',
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
          'Frequent pipe bursts and leakage repairs cause sudden unscheduled water cuts at least twice every month. Underground distribution pipes are old and crack frequently, leaving towers without water for five to six hours unexpectedly.',
          'Main problem in our building is plumbing valves break down continuously due to high pressure. Water supply gets shut down without any warning almost every week, disrupting cooking and bathing schedules for entire tower wings.'
        ]
      },
      {
        id: 'wa_mq_4',
        questionText: 'Rate overall 24x7 water availability and summer peace of mind (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('24x7 Water Availability & Summer Peace of Mind')
      }
    ]
  },

  // 4. Parking Usability
  {
    id: 'mq_parking_usability',
    topicId: 'parking-usability',
    category: 'Parking & Vehicles',
    title: 'How spacious, accessible, and easy to maneuver are allotted parking slots in basements?',
    description: 'Assesses slot width, pillar obstruction tightness, puzzle/stack parking ease, and double parking issues.',
    iconName: 'Car',
    badge: 'Vehicle Mobility',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'vehicleType', label: 'Primary Vehicle Class', inputType: 'select', options: ['Large SUV / MUV', 'Sedan', 'Hatchback', 'Electric Vehicle (EV)', 'Two Wheeler Only'], defaultValue: 'Large SUV / MUV' }
    ],
    generateRelevantExperience: (bg) => `Resident driving a ${(bg.vehicleType || 'Large SUV').toLowerCase()} in society basement parking.`,
    followUpQuestions: [
      {
        id: 'pk_mq_1',
        questionText: 'Is your allotted car parking slot wide enough to park comfortably without touching pillars or neighbor cars?',
        inputType: 'radio',
        options: [
          'To be very honest with you, parking slots in our basement are extremely wide and well designed. Even with a large SUV like Cretta or Fortuner, you can park effortlessly with plenty of space on both sides to open car doors fully without scratching adjacent vehicles or hitting concrete pillars.',
          'Look, parking width is decent for regular sedans and hatchbacks, but if you drive a wide SUV, it is a tight fit. You have to park carefully close to the left side line so that driver side door can open comfortably. Manageable once you get used to reversing into the slot.',
          'Honestly speaking, parking slots are quite cramped and tight in our basement level. Building pillars take up significant space, forcing car doors to hit concrete edges if you are not extra careful while stepping out. Installing rubber edge guards on car doors is almost compulsory here.',
          'Main issue in our parking area is extremely narrow slot layout designed by builder. Parking two full sized cars side by side leaves barely six inches gap between mirrors. Drivers constantly scrape bumpers while reversing, leading to frequent heated arguments between neighbors.'
        ]
      },
      {
        id: 'pk_mq_2',
        questionText: 'Are basement driving ramps, turns, and pillars easy to navigate for large cars or SUVs?',
        inputType: 'radio',
        options: [
          'Basement entry and exit ramps are remarkably wide with gentle sloping curves and clear Convex mirror sightlines. Driving a large SUV up and down basement levels is completely smooth and stress-free without any fear of scraping underbody or side rims.',
          'Look, basement ramps are standard width, but B2 and B3 sharp turning corners require slow driving and careful steering. Blind spots exist near ramp turns, so you must honk before taking sharp corners, but manageable with normal daily driving experience.',
          'Honestly speaking, basement ramp turns are very narrow with sharp blind angles and steep inclines. SUV drivers frequently scrape side panels against concrete pillar edges while navigating lower basement levels. Corner rubber guards installed on pillars are full of paint scratches.',
          'Main hazard in our basement is incredibly tight spiral ramps with zero visibility mirrors. Two cars cannot pass each other simultaneously on the ramp, causing dangerous standoffs during peak morning office exit hours where one driver has to reverse uphill.'
        ]
      },
      {
        id: 'pk_mq_3',
        questionText: 'Do neighbors double-park, block access, or park two-wheelers illegally inside car slots?',
        inputType: 'radio',
        options: [
          'Society security guards enforce strict parking discipline across all basement levels. Nobody is allowed to park two-wheelers outside designated lines or block neighboring car slots. Security regularly sticks warning clamps on improperly parked vehicles.',
          'Look, parking discipline is generally good, but occasionally guests or delivery guys park two-wheelers near pillar edges that encroach slightly on driving lanes. Security guard clears them quickly if you call management office.',
          'Honestly speaking, neighbor parking encroachment is a constant annoyance. Adjacent slot owners park two-wheelers in car slots, making it very difficult to swing your car into the slot without making a three-point turn.',
          'Main complaint in our basement is total lack of parking enforcement. Neighbors park extra bikes directly in driving aisles, completely blocking car movement. Repeated complaints to society office fall on deaf ears.'
        ]
      },
      {
        id: 'pk_mq_4',
        questionText: 'Rate overall parking slot width, driveway space, and parking ease (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Parking Usability & Slot Space')
      }
    ]
  },

  // 5. Visitor Parking
  {
    id: 'mq_visitor_parking',
    topicId: 'visitor-parking',
    category: 'Parking & Vehicles',
    title: 'How easy is it for visiting guests, family, and vendors to park vehicles inside society premises?',
    description: 'Evaluates visitor slot availability, gate entry pass process, weekend evening filling rate, and street safety.',
    iconName: 'Users',
    badge: 'Guest Hospitality',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'yearsLiving', label: 'Tenure of Stay', inputType: 'select', options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'], defaultValue: '3 - 5 years' }
    ],
    generateRelevantExperience: (bg) => `${bg.yearsLiving || '3-5 years'} ${(bg.residentType || 'Owner').toLowerCase()} hosting guests and family visitors.`,
    followUpQuestions: [
      {
        id: 'vp_mq_1',
        questionText: 'Are dedicated visitor parking slots easily available on weekend evenings (7 PM - 10 PM)?',
        inputType: 'radio',
        options: [
          'To be very honest with you, visitor parking in our society is exceptionally well planned with over 50 dedicated guest slots near the main clubhouse. Even on busy Saturday evenings when residents hold dinner parties, visiting family and friends find secure indoor parking easily without any hassle.',
          'Look, visitor slots are available on weekdays, but on Friday and Saturday nights after 8 PM, visitor parking fills up quickly. If your guests arrive early around 7 PM they get a slot easily, otherwise security allows temporary parking in open podium bays with resident approval on society app.',
          'Honestly speaking, visitor parking capacity is very limited compared to the total number of flats. On weekend evenings, all guest slots are full by 7:30 PM, forcing guest cars to be turned away at the gate and park on dusty external road outside society premises.',
          'Main drawback of this society is practically zero visitor parking allotment. Security flatly refuses entry to guest vehicles on weekends, forcing elderly relatives to walk long distances from outside road gates. It makes hosting family functions or dinner parties very embarrassing.'
        ]
      },
      {
        id: 'vp_mq_2',
        questionText: 'How smooth and quick is the gate security verification process for guest vehicles?',
        inputType: 'radio',
        options: [
          'Gate verification for visiting guests is super smooth through MyGate mobile app. Residents pre-approve guest vehicle numbers in advance, so booming barrier gates open automatically via ANPR cameras without stopping guest cars or making them fill physical register books.',
          'Look, security gate process takes barely two minutes. Security calls the flat via intercom or app approval notification before issuing entry token. It is a quick disciplined procedure that ensures safety while keeping entry delays minimal for invited visitors.',
          'Honestly speaking, security gate verification is slow and creates long vehicle traffic queues outside the main gate on weekend evenings. Guards make guests manually write phone numbers and flat details in paper registers, delaying entry by ten to fifteen minutes.',
          'Main nuisance at the entrance gate is rude security behavior towards guest drivers. Guards argue unnecessarily, misplace guest entry logs, and frequently deny entry even when residents have already approved the visitor request on the mobile app.'
        ]
      },
      {
        id: 'vp_mq_3',
        questionText: 'Is external roadside parking outside the main gate safe from towing or theft?',
        inputType: 'radio',
        options: [
          'Roadside parking outside main gate is wide, well-lit, and monitored by society security CCTV cameras. Traffic police never tow vehicles from outer service road, making it completely safe for overflow guest parking during large events.',
          'Look, external roadside parking is generally okay during daytime, but after 9 PM traffic police sometimes patrol and issue parking fine slips. Visitors parking outside should park strictly inside designated white lane markings to avoid traffic fines.',
          'Honestly speaking, roadside parking outside society main gate is quite unsafe and risky. Traffic police frequently tow away guest cars parked outside gate without warning, and dark stretches suffer occasional side mirror theft incidents at night.'
        ]
      },
      {
        id: 'vp_mq_4',
        questionText: 'Rate overall visitor parking availability and guest entry convenience (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Visitor Parking & Guest Entry Convenience')
      }
    ]
  },

  // 6. EV Charging
  {
    id: 'mq_ev_charging',
    topicId: 'ev-charging',
    category: 'Parking & Vehicles',
    title: 'How EV-ready is the society regarding personal charger NOCs, common charging stations, and power capacity?',
    description: 'Evaluates personal EV charger installation NOC turnaround, sub-meter billing, and common charging bays.',
    iconName: 'Zap',
    badge: 'Modern Infra',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'vehicleType', label: 'Vehicle Type', inputType: 'select', options: ['Electric Car (EV)', 'Electric Scooter (2W)', 'Planning EV Purchase', 'Petrol / Diesel Vehicle'], defaultValue: 'Electric Car (EV)' }
    ],
    generateRelevantExperience: (bg) => `Resident with ${(bg.vehicleType || 'EV Vehicle').toLowerCase()} using society EV infrastructure.`,
    followUpQuestions: [
      {
        id: 'ev_mq_1',
        questionText: 'How fast and supportive is the managing committee in granting NOC for personal EV charger installation in your parking slot?',
        inputType: 'radio',
        options: [
          'To be very honest with you, our society committee is extremely forward-thinking and supportive regarding EV adoption. They issue personal charger installation NOC within 48 hours of applying on app, and society electrical team helps guide cabling from main meter board down to basement parking slot smoothly.',
          'Look, getting an EV charger NOC takes about one to two weeks. You have to submit official load test certificate and charger specification documents from Tata Power or Ather. Once paperwork is submitted, committee approves installation with standard safety guidelines.',
          'Honestly speaking, getting NOC for EV charger installation requires multiple follow-ups with society office. Committee raises technical objections about electrical cable tray capacity and demands non-refundable inspection deposit, delaying charger installation by over a month.',
          'Main hurdle in our society is total reluctance of committee to permit personal EV chargers in basements. They cite fire safety hazards and transformer load overload, flatly denying personal charger permissions to residents wanting to buy electric cars.'
        ]
      },
      {
        id: 'ev_mq_2',
        questionText: 'Does the society have common shared EV charging stations available in visitor bays?',
        inputType: 'radio',
        options: [
          'Yes, society has partnered with Kazam and Tata Power to install eight fast DC and AC common EV charging stations in visitor bays. Any resident or guest can easily scan QR code on mobile app and charge electric vehicles conveniently 24x7.',
          'Look, society has four shared 15A slow charging sockets installed near the main clubhouse for emergency charging. It works fine for overnight 2W electric scooter charging or top-up EV car charging at reasonable per-unit billing rates.',
          'Honestly speaking, society has no common shared EV charging bays yet. If you do not have personal charger installed in your allotted parking slot, charging your EV car or scooter inside society premises is completely impossible.'
        ]
      },
      {
        id: 'ev_mq_3',
        questionText: 'Is the society electrical transformer capacity adequate for running multiple EV chargers simultaneously?',
        inputType: 'radio',
        options: [
          'Transformer load capacity was upgraded recently to handle high-power EV charging loads easily. Multiple 7.2 kW EV chargers run simultaneously across basement slots during night hours without causing main breaker trips or power fluctuations.',
          'Look, transformer load capacity is fine currently, but society management limits total approved EV charger installations to 50 slots. Once that threshold is reached, electrical audit will be required before approving new charger load connections.',
          'Honestly speaking, electrical transformer load is already near peak limit. Whenever multiple EV cars start fast charging at night, basement sub-station breakers trip occasionally, causing temporary power cuts in common basement lights.'
        ]
      },
      {
        id: 'ev_mq_4',
        questionText: 'Rate overall EV charging readiness and committee support (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('EV Charging Infrastructure & Readiness')
      }
    ]
  },

  // 7. WFH Tranquility
  {
    id: 'mq_wfh_tranquility',
    topicId: 'wfh-tranquility',
    category: 'Noise & Environment',
    title: 'How quiet and peaceful is the flat environment for conducting remote WFH work calls and deep focus?',
    description: 'Assesses WFH call tranquility, neighbor wall/ceiling acoustic insulation, footstep/TV noise transfer, and courtyard echo.',
    iconName: 'VolumeX',
    badge: 'Work From Home',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'wfhMode', label: 'WFH Routine', inputType: 'select', options: ['Full-Time WFH', 'Hybrid WFH (2-3 Days)', 'Office Going'], defaultValue: 'Full-Time WFH' }
    ],
    generateRelevantExperience: (bg) => `${bg.residentType || 'Owner'} doing ${(bg.wfhMode || 'Full-Time WFH').toLowerCase()} evaluating flat acoustic tranquility.`,
    followUpQuestions: [
      {
        id: 'wfh_mq_1',
        questionText: 'Can you conduct important WFH client video calls without disturbing external background noise?',
        inputType: 'radio',
        options: [
          'To be very honest with you, our flat is pin-drop silent and peaceful throughout the day. Double-glazed UPVC window systems block external noise completely, allowing me to take crucial client presentation calls on Zoom and Teams without any background noise suppression filters.',
          'Look, during daytime WFH hours, environment is generally peaceful. Closing balcony doors keeps out most ambient sounds, though occasional lawn mower noise or afternoon delivery calls can be heard if windows are kept wide open. Very comfortable for hybrid remote work.',
          'Honestly speaking, taking WFH calls without noise-cancelling headphones is quite difficult here. Daytime drill noise from nearby flat interior renovation work and echoing voices from internal garden courtyards seep into study room, forcing me to mute microphone frequently.',
          'Main drawback for remote workers is continuous disturbing noise. Children screaming in central podiums, loud TV noise from adjacent walls, and frequent hallway door slamming make conducting professional work calls a stressful daily ordeal.'
        ]
      },
      {
        id: 'wfh_mq_2',
        questionText: 'How effective is inter-flat acoustic wall and ceiling soundproofing against neighbor footsteps or TV noise?',
        inputType: 'radio',
        options: [
          'Acoustic soundproofing between flats is exceptional. Heavy RCC shear wall construction prevents sound transmission entirely, so we never hear upper floor heavy footsteps, furniture moving, or adjacent neighbor TV sound through shared walls.',
          'Look, wall soundproofing is decent, but impact noise from upper floor ceiling is slightly audible if kids jump or drag heavy chairs at night. Normal talking and TV audio does not bleed through walls, so basic privacy is well preserved.',
          'Honestly speaking, internal partition walls are quite thin AAC block construction. You can easily hear neighbor TV news broadcasts, washing machine spin cycles, and upper floor dragging furniture noise during quiet late night hours.',
          'Main nuisance in our building is zero acoustic isolation. You can clearly hear neighbor bathroom flush sounds, loud arguments, and constant heavy footstep thumps from upper floor, making restful sleep and peaceful focus work very difficult.'
        ]
      },
      {
        id: 'wfh_mq_3',
        questionText: 'Does daytime children playing noise in podium gardens echo into flat rooms?',
        inputType: 'radio',
        options: [
          'Podium play areas are located far from residential tower wings, so evening children playing noise never echoes into bedrooms or living rooms. Complete serenity maintained round the clock inside flats.',
          'Look, children play in central courtyard between 5 PM and 7:30 PM, so some echoing shouts reach lower floor balconies. Closing balcony glass doors reduces sound level by 80%, so it does not bother WFH routines.',
          'Honestly speaking, central courtyard acts like a giant sound amplifier. Shrieking noise from kids playing football in podium echoes loudly across all floors from 4 PM till 9 PM, making living room conversation difficult.'
        ]
      },
      {
        id: 'wfh_mq_4',
        questionText: 'Rate overall WFH acoustic tranquility and soundproofing quality (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('WFH Acoustic Tranquility & Soundproofing')
      }
    ]
  },

  // 8. Traffic & Party Noise
  {
    id: 'mq_traffic_party_noise',
    topicId: 'traffic-party-noise',
    category: 'Noise & Environment',
    title: 'How severe is main road traffic horn noise, street traffic, and weekend clubhouse party disturbance?',
    description: 'Evaluates main road vehicle horn noise, weekend clubhouse events, poolside party loudness, and 10 PM cutoff enforcement.',
    iconName: 'Volume2',
    badge: 'Acoustic Comfort',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'flatFacing', label: 'Balcony View Facing', inputType: 'select', options: ['Facing Main Road / Highway', 'Facing Internal Garden', 'Facing Courtyard', 'Facing Side Street'], defaultValue: 'Facing Main Road / Highway' }
    ],
    generateRelevantExperience: (bg) => `Resident in flat ${(bg.flatFacing || 'Facing Main Road').toLowerCase()} assessing street and party noise levels.`,
    followUpQuestions: [
      {
        id: 'tp_mq_1',
        questionText: 'How disturbing is main road traffic horn noise and heavy vehicle rumble on flat balconies?',
        inputType: 'radio',
        options: [
          'To be very honest with you, even though our balcony faces the main arterial road, high-grade acoustic glass balcony sliding doors reduce external traffic sound to a faint whisper. You can sit peacefully in living room without hearing annoying vehicle horns or bus engines.',
          'Look, main road traffic noise is noticeable during peak morning and evening traffic rush hours if balcony doors are open. However, once you slide closed the sound-insulated glass windows, interior noise levels drop significantly to comfortable peaceful levels.',
          'Honestly speaking, main road traffic noise is relentless and loud. Continuous heavy truck rumble, pressure horns, and emergency sirens bleed into bedrooms throughout the day and late night, forcing us to keep windows permanently shut.',
          'Main nightmare for road-facing flats is unbearable traffic noise. Loud modified silencer bikes and state transport bus pressure horns blast continuously past midnight, disrupting sleep and making peaceful living room relaxation impossible.'
        ]
      },
      {
        id: 'tp_mq_2',
        questionText: 'Do weekend clubhouse events, weddings, or poolside parties cause loud music noise in flats?',
        inputType: 'radio',
        options: [
          'Clubhouse party hall is located in a dedicated basement zone away from residential towers, so weekend birthday parties or poolside events never cause loud music noise inside flat bedrooms. Complete peace maintained every weekend.',
          'Look, weekend birthday celebrations and festival DJ events at the clubhouse create lively music sound until 9:30 PM. It is energetic festive atmosphere that stops promptly before bedtime, so residents do not mind it at all.',
          'Honestly speaking, weekend party noise from open lawn celebrations is quite loud and annoying. High-decibel bass speakers vibrate flat window panes during late evening parties, making early sleeping impossible for young kids and seniors.',
          'Main problem in our society is unchecked party noise. Private clubhouse parties blast loud DJ music past midnight on weekends, and security guards refuse to stop party hosts despite repeated resident phone calls.'
        ]
      },
      {
        id: 'tp_mq_3',
        questionText: 'How strictly does society security enforce the 10:00 PM late-night noise cutoff policy?',
        inputType: 'radio',
        options: [
          'Society security team strictly enforces 10 PM quiet hours rule across all common lawns and clubhouses. At 10 PM sharp, security guards respectfully ask party organizers to shut off outdoor speakers and move indoors.',
          'Look, security enforces 10 PM cutoff reasonably well on regular days. On major festival nights like Diwali or New Year Eve, celebrations extend till 11:30 PM with prior general body approval, which is acceptable to most residents.',
          'Honestly speaking, 10 PM noise regulation is poorly enforced. Late night outdoor drinking parties near swimming pool deck continue playing loud music till 1 AM without security intervention, leading to heated arguments on society WhatsApp group.'
        ]
      },
      {
        id: 'tp_mq_4',
        questionText: 'Rate overall freedom from external traffic and party noise disturbance (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Freedom from Traffic & Party Noise')
      }
    ]
  },

  // 9. Power Cuts
  {
    id: 'mq_power_cuts',
    topicId: 'power-cuts',
    category: 'Electricity & Power',
    title: 'How frequent are municipal electricity power outages, voltage fluctuations, and grid trip risks?',
    description: 'Evaluates locality grid power cut frequency, voltage fluctuations, summer load trips, and appliance safety.',
    iconName: 'ZapOff',
    badge: 'Grid Quality',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'yearsLiving', label: 'Tenure of Stay', inputType: 'select', options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'], defaultValue: '3 - 5 years' }
    ],
    generateRelevantExperience: (bg) => `${bg.yearsLiving || '3-5 years'} ${(bg.residentType || 'Owner').toLowerCase()} monitoring local power grid reliability.`,
    followUpQuestions: [
      {
        id: 'pc_mq_1',
        questionText: 'How often does the state electricity grid experience unscheduled power outages per week?',
        inputType: 'radio',
        options: [
          'To be very honest with you, local electricity grid in our area is remarkably stable and reliable. We experience zero unscheduled power cuts on most weeks, and grid power runs continuously 24x7 without sudden blackouts or power drops.',
          'Look, grid power is generally good, but during monsoon thunderstorms or hot summer afternoons, short ten-minute power cuts happen once or twice a week. Society generator kicks in quickly, so daily routine is barely impacted.',
          'Honestly speaking, unscheduled power outages are quite frequent in our locality, happening three to four times every week. Electricity grid trips regularly during peak afternoon heat due to heavy local transformer load across the neighborhood.',
          'Main nuisance in our locality is chronic electricity grid instability. Power cuts last for two to three hours every single afternoon during summer months, putting immense pressure on society diesel generator backup systems.'
        ]
      },
      {
        id: 'pc_mq_2',
        questionText: 'Do voltage fluctuations or high-voltage spikes occur that risk damaging AC compressors or refrigerators?',
        inputType: 'radio',
        options: [
          'Society sub-station is equipped with heavy-duty automatic voltage regulators and surge arrestors. Voltage remains perfectly steady at 230V without dangerous voltage spikes or dimming lights, keeping modern inverter ACs and appliances 100% safe.',
          'Look, minor voltage dips happen occasionally when grid power switches over to generator mode, but modern appliances handle it fine. We use digital voltage stabilizers for expensive OLED TVs and refrigerators as standard safety precaution.',
          'Honestly speaking, severe voltage fluctuations happen frequently during summer peak load hours. Tube lights flicker and AC compressors trip automatically due to low voltage drops below 180V, requiring dedicated stabilizers on every appliance.',
          'Main risk here is severe high-voltage surges during grid power restoration. Last year two residents suffered burnt motherboard electronics in split ACs due to sudden power surges when grid power snapped back on.'
        ]
      },
      {
        id: 'pc_mq_3',
        questionText: 'How much advance notification does electricity DISCOM provide before scheduled weekly maintenance blackouts?',
        inputType: 'radio',
        options: [
          'State DISCOM and society office post official SMS alerts and app notifications 24 hours in advance before any scheduled Thursday grid maintenance blackout. Gives complete clarity to plan WFH schedules accordingly.',
          'Look, scheduled maintenance blackout alerts are posted on society WhatsApp group on the morning of maintenance day. Power cuts usually run from 10 AM to 2 PM, during which full generator backup is provided.',
          'Sudden unscheduled grid maintenance shutdowns happen without any prior notice. You sit down for WFH work only to find total blackout, and customer care line has no timeline for power restoration.'
        ]
      },
      {
        id: 'pc_mq_4',
        questionText: 'Rate overall grid power reliability and voltage stability (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Grid Power Reliability & Voltage Stability')
      }
    ]
  },

  // 10. Generator Backup
  {
    id: 'mq_generator_backup',
    topicId: 'generator-backup',
    category: 'Electricity & Power',
    title: 'How comprehensive is diesel generator backup for running high-load appliances like air conditioners during blackouts?',
    description: 'Assesses in-flat DG appliance load limits, auto-switchover speed, diesel surcharge transparency, and AC backup.',
    iconName: 'BatteryCharging',
    badge: 'Power Backup',
    backgroundFields: [
      { id: 'residentType', label: 'Resident Type', inputType: 'radio', options: ['Owner', 'Tenant'], defaultValue: 'Owner' },
      { id: 'applianceLoad', label: 'In-Flat AC Usage', inputType: 'select', options: ['Multiple Split ACs', 'Centralized AC', '1 AC + Fans', 'Fans & Basic Appliances'], defaultValue: 'Multiple Split ACs' }
    ],
    generateRelevantExperience: (bg) => `Resident running ${(bg.applianceLoad || 'Multiple ACs').toLowerCase()} on society diesel generator backup.`,
    followUpQuestions: [
      {
        id: 'gb_mq_1',
        questionText: 'Does diesel generator backup support running heavy appliances like inverter ACs, geysers, or microwave ovens inside flats?',
        inputType: 'radio',
        options: [
          'To be very honest with you, generator backup in our society is 100% full load 24x7. Each flat gets up to 5 kW to 8 kW generator allocation, allowing us to run multiple 1.5 ton inverter ACs, refrigerator, TV, and lights simultaneously during prolonged power blackouts without any breaker tripping.',
          'Look, generator backup supports up to 3 kW load per flat. It runs all fans, lights, Wi-Fi router, refrigerator, and one 1.5-ton inverter AC comfortably. If you turn on a second AC or geyser, internal automatic current limiter trips to protect generator circuit.',
          'Honestly speaking, generator backup is restricted to basic lights, fans, and TV only (1.5 kW max limit). Running heavy appliances like air conditioners or induction cooktops on DG backup is strictly prohibited by society committee to conserve diesel fuel.',
          'Main drawback in our building is zero in-flat generator backup. Diesel generator powers only common area lifts, corridor lighting, and water pumps. Inside flats, you have to depend entirely on personal home inverter batteries during power outages.'
        ]
      },
      {
        id: 'gb_mq_2',
        questionText: 'How fast does the diesel generator auto-switchover kick in when main grid power fails?',
        inputType: 'radio',
        options: [
          'Auto-switchover panel is lightning fast, restoring power within 5 to 10 seconds of grid failure. Wi-Fi routers with small UPS do not even reboot, and AC compressors resume cooling smoothly without manual reset.',
          'Look, generator switchover takes around 20 to 30 seconds. Lights flicker briefly and go dark for half a minute before DG engine revs up and powers the tower, which is quite acceptable for residential buildings.',
          'Honestly speaking, DG switchover is sluggish and takes two to three minutes every time power fails. Manual operator sometimes takes five minutes to start generator set at night, leaving lifts stuck between floors temporarily.',
          'Main complaint is generator auto-start panel breaks down frequently. Power outages leave towers pitch dark for 15-20 minutes until security guards manually go to generator yard to pull start manual switches.'
        ]
      },
      {
        id: 'vp_mq_3',
        questionText: 'Are diesel generator backup usage charges billed transparently through prepaid sub-meters or monthly maintenance?',
        inputType: 'radio',
        options: [
          'DG power usage is metered accurately through smart dual-source prepaid electricity meters. You pay exactly for units consumed on DG backup at transparent government approved diesel per-unit tariffs without any hidden surcharges.',
          'Look, generator diesel cost is included directly in monthly maintenance bill based on actual monthly diesel purchase invoices shared on app. It is fair and transparent, adding around 300 to 500 rupees during summer power cuts.',
          'Honestly speaking, society levies heavy ad-hoc generator surcharge fees on monthly bills without sharing audited fuel consumption logs, causing frequent disputes between residents and managing committee.'
        ]
      },
      {
        id: 'gb_mq_4',
        questionText: 'Rate overall generator backup power sufficiency and switchover speed (1 to 5):',
        inputType: 'rating',
        options: makeRatingOptions('Generator Power Backup & Switchover Speed')
      }
    ]
  }
];

console.log('Script definitions complete');
