const fs = require('fs');

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function checkWordCounts(options, qContext) {
  options.forEach((opt, idx) => {
    const wc = countWords(opt);
    if (wc < 45 || wc > 100) {
      console.error(`[WORD COUNT ERROR] ${qContext} Option ${idx + 1}: ${wc} words (must be 45-100 words)\nText: "${opt}"`);
      process.exit(1);
    }
  });
}

console.log('Validation helper ready.');
