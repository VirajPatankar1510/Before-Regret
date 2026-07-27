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

// Data definitions for the 22 main topics
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
  }
];

console.log('Water Pressure topic created.');
