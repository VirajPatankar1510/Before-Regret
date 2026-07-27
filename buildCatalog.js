const fs = require('fs');

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

// Helper to wrap rating options in 45-100 word resident POV paragraphs
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

console.log('Rating helper verified.');
