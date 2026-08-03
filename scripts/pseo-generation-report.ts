/**
 * Runs the real pSEO generation pass over the full ZIP_PSEO_DATASET, scoped
 * to the single validated launch market, and prints evidence of every page
 * that was published vs. held back by the uniqueness gate and the
 * market-scope gate. This is not a description of the gates — it imports
 * and executes the exact same evaluateZipUniqueness() function the live
 * site calls in ZipHubView, TopicDeepPageView, and the admin panel.
 */
import { ZIP_PSEO_DATASET, VALIDATED_MARKETS, SINGLE_TOPICS_METADATA } from '../src/data/seoDataset';
import { evaluateZipUniqueness, logHeldBackPage, getHeldBackLogs } from '../src/utils/seoUniquenessEvaluator';
import { TopicSlug } from '../src/types/seoTypes';

const validatedCities = new Set(
  VALIDATED_MARKETS.filter(m => m.isValidated).map(m => m.city.toLowerCase())
);

console.log('='.repeat(78));
console.log('pSEO GENERATION REPORT');
console.log('='.repeat(78));
console.log(`Validated launch market(s): ${[...validatedCities].join(', ') || '(none)'}`);
console.log(`Total zips in dataset: ${Object.keys(ZIP_PSEO_DATASET).length}`);
console.log('');

let publishedCount = 0;
let heldBackUniquenessCount = 0;
let skippedOutOfMarketCount = 0;

for (const zip of Object.values(ZIP_PSEO_DATASET)) {
  const inMarket = validatedCities.has(zip.city.toLowerCase());
  const evalRes = evaluateZipUniqueness(zip);

  // --- ZIP HUB PAGE ---
  const zipHubPath = `/state/${zip.stateFullName.toLowerCase().replace(/\s+/g, '')}/${zip.city.toLowerCase()}/${zip.zipCode}/`;

  if (!inMarket) {
    skippedOutOfMarketCount++;
    console.log(`[SKIPPED - OUT OF MARKET] ${zipHubPath}`);
    console.log(`   Zip ${zip.zipCode} (${zip.city}) is not in a validated market. Uniqueness score is irrelevant (would have been ${evalRes.score}/100) — excluded on market scope alone.`);
    logHeldBackPage({
      urlPath: zipHubPath,
      pageType: 'zip_hub',
      zipCode: zip.zipCode,
      uniquenessScore: evalRes.score,
      requiredThreshold: evalRes.threshold,
      holdBackReason: `Zip ${zip.zipCode} (${zip.city}) is outside the single validated launch market. Excluded from generation regardless of its uniqueness score (${evalRes.score}/100).`,
      missingDataFields: [],
      recommendation: 'manual_research'
    });
  } else if (evalRes.passed) {
    publishedCount++;
    console.log(`[PUBLISHED] ${zipHubPath}`);
    console.log(`   Score ${evalRes.score}/100 >= threshold ${evalRes.threshold}. robots: index, follow`);
  } else {
    heldBackUniquenessCount++;
    console.log(`[HELD BACK - UNIQUENESS] ${zipHubPath}`);
    console.log(`   ${evalRes.reason}`);
    logHeldBackPage({
      urlPath: zipHubPath,
      pageType: 'zip_hub',
      zipCode: zip.zipCode,
      uniquenessScore: evalRes.score,
      requiredThreshold: evalRes.threshold,
      holdBackReason: evalRes.reason || 'Uniqueness gate failed.',
      missingDataFields: evalRes.missingDataFields,
      recommendation: evalRes.recommendation
    });
  }

  // --- TOPIC DEEP PAGES (one per topic slug) ---
  for (const topicSlug of Object.keys(SINGLE_TOPICS_METADATA) as TopicSlug[]) {
    const topicPath = `${zipHubPath}${topicSlug}/`;

    if (!inMarket) {
      skippedOutOfMarketCount++;
      logHeldBackPage({
        urlPath: topicPath,
        pageType: 'topic_deep',
        zipCode: zip.zipCode,
        uniquenessScore: evalRes.score,
        requiredThreshold: evalRes.threshold,
        holdBackReason: `Zip ${zip.zipCode} (${zip.city}) is outside the single validated launch market. Excluded from generation regardless of its uniqueness score (${evalRes.score}/100).`,
        missingDataFields: [],
        recommendation: 'manual_research'
      });
    } else if (evalRes.passed) {
      publishedCount++;
    } else {
      heldBackUniquenessCount++;
      logHeldBackPage({
        urlPath: topicPath,
        pageType: 'topic_deep',
        zipCode: zip.zipCode,
        uniquenessScore: evalRes.score,
        requiredThreshold: evalRes.threshold,
        holdBackReason: evalRes.reason || 'Uniqueness gate failed.',
        missingDataFields: evalRes.missingDataFields,
        recommendation: evalRes.recommendation
      });
    }
  }
  console.log('');
}

console.log('='.repeat(78));
console.log('SUMMARY');
console.log('='.repeat(78));
console.log(`Published pages (zip hub + topic deep, in-market + passed gate): ${publishedCount}`);
console.log(`Held back — failed uniqueness gate (in-market but thin data):    ${heldBackUniquenessCount}`);
console.log(`Excluded — out of validated market scope:                       ${skippedOutOfMarketCount}`);
console.log('');
console.log(`Total held-back audit log entries now on record: ${getHeldBackLogs().length}`);
console.log('');
console.log('First 6 audit log entries (most recent first):');
getHeldBackLogs().slice(0, 6).forEach(log => {
  console.log(`  - [${log.pageType}] ${log.urlPath} :: score ${log.uniquenessScore}/${log.requiredThreshold} :: ${log.holdBackReason}`);
});

// --- Independence proof: market-scope gate vs. data-quality gate ---
// Houston's only current zip (77099) happens to fail on uniqueness too, so
// on its own that's not proof the market gate is structural rather than
// coincidental. Prove it directly with a synthetic Houston zip that would
// PASS uniqueness cleanly, and show it still gets excluded on market scope.
console.log('');
console.log('='.repeat(78));
console.log('INDEPENDENCE PROOF: market-scope gate vs. uniqueness gate');
console.log('='.repeat(78));
const syntheticHighQualityHoustonZip = {
  ...ZIP_PSEO_DATASET['78701'], // clone a known 100/100 Austin zip's data shape
  zipCode: '77002',
  city: 'Houston',
  state: 'TX'
};
const syntheticEval = evaluateZipUniqueness(syntheticHighQualityHoustonZip);
const syntheticInMarket = validatedCities.has(syntheticHighQualityHoustonZip.city.toLowerCase());
console.log(`Synthetic zip 77002 (Houston) built from a known 100/100-quality data shape.`);
console.log(`Uniqueness gate result: score ${syntheticEval.score}/100, passed=${syntheticEval.passed}`);
console.log(`Market-scope gate result: inValidatedMarket=${syntheticInMarket}`);
console.log(
  syntheticEval.passed && !syntheticInMarket
    ? 'CONFIRMED: a zip that would PASS the uniqueness gate is still EXCLUDED because Houston is not the validated launch market. The market-scope gate is structural, not a side effect of thin data.'
    : 'UNEXPECTED: synthetic zip did not behave as expected — investigate.'
);
