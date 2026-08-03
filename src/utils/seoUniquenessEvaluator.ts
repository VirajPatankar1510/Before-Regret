import { ZipPSeoData, HeldBackLog, PSeoPageType } from '../types/seoTypes';

export interface UniquenessResult {
  passed: boolean;
  score: number;
  threshold: number;
  reason?: string;
  missingDataFields: string[];
  recommendation: 'delay_for_data' | 'fold_into_city_hub' | 'manual_research';
}

export interface QualityEvaluationResult {
  wordCount: number;
  minWordCountRequired: number;
  wordCountPassed: boolean;
  repetitionPercent: number;
  repetitionPassed: boolean;
  fillerPhrasesFound: string[];
  fillerPassed: boolean;
  factualDensityScore: number;
  explanatoryDepthScore: number;
  passed: boolean;
  qualityLogs: string[];
}

export const UNIQUENESS_THRESHOLD = 70;

export function evaluateZipUniqueness(data: Partial<ZipPSeoData>): UniquenessResult {
  const missingFields: string[] = [];
  let score = 0;

  // 1. Check basic metadata (20 points)
  if (data.zipCode && data.city && data.state) score += 20;
  else missingFields.push('basic_location_metadata');

  // 2. Check flood hazard data (20 points)
  if (data.floodZone && !data.floodZone.includes('Unknown') && !data.floodZone.includes('Unmapped')) {
    score += 20;
  } else {
    missingFields.push('fema_flood_zone_data');
  }

  // 3. Check municipal permit records (20 points)
  if (data.permitActivityLevel && data.permitActivityLevel !== 'Sparse / Missing' && (data.recentPermitsCount12mo ?? 0) > 10) {
    score += 20;
  } else {
    missingFields.push('municipal_permit_records');
  }

  // 4. Check broadband connectivity facts (20 points)
  if ((data.broadbandProvidersCount ?? 0) >= 2 && (data.fiberCoveragePercent ?? 0) > 0) {
    score += 20;
  } else {
    missingFields.push('broadband_provider_records');
  }

  // 5. Check environmental/hazard metrics (radon, noise, wildfire) (20 points)
  if (data.radonZone && data.radonZone !== 'Unclassified' && (data.ambientNoiseLevelDb ?? 0) > 0) {
    score += 20;
  } else {
    missingFields.push('environmental_hazard_metrics');
  }

  const passed = score >= UNIQUENESS_THRESHOLD;
  
  let recommendation: 'delay_for_data' | 'fold_into_city_hub' | 'manual_research' = 'delay_for_data';
  if (score < 40) {
    recommendation = 'fold_into_city_hub';
  } else if (missingFields.includes('municipal_permit_records')) {
    recommendation = 'delay_for_data';
  } else {
    recommendation = 'manual_research';
  }

  const reason = passed 
    ? `Page satisfies Stage 2 uniqueness threshold with a score of ${score}/100.` 
    : `Fails Stage 2 uniqueness threshold (${score}/100 < ${UNIQUENESS_THRESHOLD}). Missing key datasets: ${missingFields.join(', ')}. Page held back to prevent publishing thin content.`;

  return {
    passed,
    score,
    threshold: UNIQUENESS_THRESHOLD,
    reason,
    missingDataFields: missingFields,
    recommendation
  };
}

/**
 * Evaluates a generated long-form draft article for genuine explanatory depth,
 * word count minimums, repetition index, and banned corporate fluff/filler phrases.
 */
export function evaluateDraftQuality(
  contentHtmlOrText: string,
  suggestedPageType: PSeoPageType = 'topic_deep',
  minWordCountRequired: number = 800
): QualityEvaluationResult {
  // Strip HTML tags for clean word & sentence analysis
  const plainText = contentHtmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Minimum Word Count Check (800 - 1500 words for deep pages)
  const targetMin = suggestedPageType === 'topic_deep' ? 800 : 600;
  const wordCountPassed = wordCount >= targetMin;

  // 2. Banned Fluff & Corporate Filler Phrases Check
  const bannedFillerPhrases = [
    'overall satisfactory',
    'generally acceptable',
    'meets expectations',
    'standard residential experience',
    'well balanced community',
    'good residential environment',
    'supercharge',
    'empower',
    'luxury lifestyle',
    'dream home',
    'unmatched experience',
    'jaw-dropping',
    'stellar'
  ];

  const lowerText = plainText.toLowerCase();
  const fillerPhrasesFound: string[] = [];
  bannedFillerPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      fillerPhrasesFound.push(phrase);
    }
  });
  const fillerPassed = fillerPhrasesFound.length === 0;

  // 3. Repetition & Restated Sentence Check (n-gram similarity across paragraphs)
  const paragraphs = plainText.split(/(?:\r?\n)+/).filter(p => p.trim().length > 30);
  let totalPhrases = 0;
  let repeatedPhrases = 0;
  const phraseSet = new Set<string>();

  for (const p of paragraphs) {
    const pWords = p.toLowerCase().split(/\s+/).filter(Boolean);
    for (let i = 0; i < pWords.length - 3; i++) {
      const quad = `${pWords[i]} ${pWords[i+1]} ${pWords[i+2]} ${pWords[i+3]}`;
      totalPhrases++;
      if (phraseSet.has(quad)) {
        repeatedPhrases++;
      } else {
        phraseSet.add(quad);
      }
    }
  }

  const repetitionPercent = totalPhrases > 0 ? Math.min(100, Math.round((repeatedPhrases / totalPhrases) * 100)) : 0;
  const repetitionPassed = repetitionPercent <= 15;

  // 4. Factual Density Score (number of numbers, percentages, zone identifiers, dBA, pCi/L per 100 words)
  const numbersAndMetrics = plainText.match(/\b(?:\d+|\d+\.\d+|zone\s+[a-z0-9]+|\d+\s*dba|\d+\.\d+\s*pci\/l|fema|usgs|fcc|\d+%\s*fiber)\b/gi) || [];
  const metricsCount = numbersAndMetrics.length;
  const factualDensityRatio = wordCount > 0 ? (metricsCount / wordCount) * 100 : 0;
  const factualDensityScore = Math.min(100, Math.round(factualDensityRatio * 15));

  // 5. Calculate Explanatory Depth Score (0-100)
  let depthScore = 50;
  if (wordCount >= targetMin) depthScore += 25;
  else depthScore += Math.round((wordCount / targetMin) * 25);

  if (repetitionPassed) depthScore += 15;
  else depthScore -= 15;

  if (fillerPassed) depthScore += 10;
  else depthScore -= 15;

  const explanatoryDepthScore = Math.max(0, Math.min(100, depthScore));
  const passed = wordCountPassed && repetitionPassed && fillerPassed && explanatoryDepthScore >= 70;

  const logs: string[] = [];
  logs.push(wordCountPassed 
    ? `Word Count Check: PASSED (${wordCount} words >= minimum ${targetMin})` 
    : `Word Count Deficit: FAILED (${wordCount} words < minimum ${targetMin})`);

  logs.push(repetitionPassed 
    ? `Repetition Index: PASSED (${repetitionPercent}% phrase repetition <= 15% threshold)` 
    : `Repetition Flag: HIGH REPETITION DETECTED (${repetitionPercent}% repeated 4-grams)`);

  logs.push(fillerPassed 
    ? `Corporate Fluff & Filler Check: PASSED (0 banned phrases found)` 
    : `Filler Flag: DETECTED BANNED PHRASES [${fillerPhrasesFound.join(', ')}]`);

  logs.push(`Factual Data Point Density: ${factualDensityScore}/100 (${metricsCount} verified metrics integrated across ${wordCount} words)`);
  logs.push(`Overall Explanatory Depth Score: ${explanatoryDepthScore}/100`);

  return {
    wordCount,
    minWordCountRequired: targetMin,
    wordCountPassed,
    repetitionPercent,
    repetitionPassed,
    fillerPhrasesFound,
    fillerPassed,
    factualDensityScore,
    explanatoryDepthScore,
    passed,
    qualityLogs: logs
  };
}

// In-memory held-back logs store
let HELD_BACK_LOGS_STORE: HeldBackLog[] = [
  {
    id: 'hb_78799',
    urlPath: '/state/texas/austin/78799/',
    pageType: 'zip_hub',
    zipCode: '78799',
    uniquenessScore: 22,
    requiredThreshold: 70,
    holdBackReason: 'Fails Stage 2 uniqueness bar: zero municipal permit records, unmapped flood zone data, zero broadband provider records, and 0 population. Held back to prevent thin pSEO publishing.',
    missingDataFields: ['fema_flood_zone_data', 'municipal_permit_records', 'broadband_provider_records', 'environmental_hazard_metrics'],
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    recommendation: 'fold_into_city_hub'
  },
  {
    id: 'hb_77099',
    urlPath: '/state/texas/houston/77099/',
    pageType: 'zip_hub',
    zipCode: '77099',
    uniquenessScore: 54,
    requiredThreshold: 70,
    holdBackReason: 'Fails Stage 2 uniqueness bar: Harris County municipal permit feeds incomplete for this parcel sub-quadrant. Held back per Stage 5 Phase 2 validation requirement.',
    missingDataFields: ['municipal_permit_records', 'broadband_provider_records'],
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    recommendation: 'delay_for_data'
  }
];

export function getHeldBackLogs(): HeldBackLog[] {
  return HELD_BACK_LOGS_STORE;
}

export function logHeldBackPage(entry: Omit<HeldBackLog, 'id' | 'timestamp'>): HeldBackLog {
  const newLog: HeldBackLog = {
    ...entry,
    id: `hb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };
  HELD_BACK_LOGS_STORE.unshift(newLog);
  return newLog;
}
