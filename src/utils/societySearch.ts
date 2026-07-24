import { Society } from '../types';

/**
 * Normalizes society names:
 * - Trims and replaces multiple spaces with single space
 * - Removes unnecessary special characters
 * - Converts to clean Title Case
 */
export function normalizeSocietyName(rawName: string): string {
  if (!rawName) return '';

  // 1. Clean extra spaces and punctuation
  let cleaned = rawName
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/gi, ''); // keep alphanumeric, spaces and hyphens

  // 2. Normalize common abbreviations
  cleaned = cleaned
    .replace(/\bchs\b/gi, 'CHS')
    .replace(/\bapts\b/gi, 'Apartments')
    .replace(/\bapt\b/gi, 'Apartment')
    .replace(/\bsoc\b/gi, 'Society');

  // 3. Convert to Title Case
  return cleaned
    .split(' ')
    .map(word => {
      if (word === 'CHS' || word === 'EV') return word;
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Calculates Levenshtein Distance between two strings for fuzzy matching.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenA; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[lenA][lenB];
}

/**
 * Calculate string similarity score between 0 and 1 using fuzzy distance.
 */
export function getStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Substring inclusion bonus
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return 0.75 + (minLen / maxLen) * 0.2;
  }

  const distance = calculateLevenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

export interface FuzzySearchResult {
  exactMatch: Society | null;
  suggestions: Array<{
    society: Society;
    score: number;
    matchedBy: 'DisplayName' | 'NormalizedName' | 'Alias' | 'Landmark';
  }>;
}

/**
 * Performs fuzzy duplicate detection on society name input.
 */
export function fuzzyMatchSociety(inputName: string, existingSocieties: Society[]): FuzzySearchResult {
  const normalizedInput = normalizeSocietyName(inputName).toLowerCase();
  
  if (!normalizedInput) {
    return { exactMatch: null, suggestions: [] };
  }

  let exactMatch: Society | null = null;
  const scoredSuggestions: Array<{
    society: Society;
    score: number;
    matchedBy: 'DisplayName' | 'NormalizedName' | 'Alias' | 'Landmark';
  }> = [];

  for (const society of existingSocieties) {
    const socNameNorm = (society.normalizedName || normalizeSocietyName(society.name)).toLowerCase();
    const socDisplayNameNorm = society.name.toLowerCase();

    // Check exact canonical or normalized match
    if (socNameNorm === normalizedInput || socDisplayNameNorm === normalizedInput) {
      exactMatch = society;
      break;
    }

    // Check alias exact match
    const matchedAlias = (society.aliases || []).find(
      a => normalizeSocietyName(a).toLowerCase() === normalizedInput
    );

    if (matchedAlias) {
      exactMatch = society;
      break;
    }

    // Calculate similarity score
    const nameScore = getStringSimilarity(normalizedInput, socNameNorm);
    const displayScore = getStringSimilarity(normalizedInput, socDisplayNameNorm);
    
    let maxAliasScore = 0;
    (society.aliases || []).forEach(alias => {
      const aScore = getStringSimilarity(normalizedInput, alias.toLowerCase());
      if (aScore > maxAliasScore) maxAliasScore = aScore;
    });

    let landmarkScore = 0;
    if (society.landmark) {
      landmarkScore = getStringSimilarity(normalizedInput, society.landmark.toLowerCase()) * 0.7;
    }

    const topScore = Math.max(nameScore, displayScore, maxAliasScore, landmarkScore);

    // If similarity is above threshold (0.55), add to suggestions
    if (topScore >= 0.55) {
      let matchedBy: 'DisplayName' | 'NormalizedName' | 'Alias' | 'Landmark' = 'DisplayName';
      if (maxAliasScore === topScore) matchedBy = 'Alias';
      else if (landmarkScore === topScore) matchedBy = 'Landmark';
      else if (nameScore === topScore) matchedBy = 'NormalizedName';

      scoredSuggestions.push({
        society,
        score: topScore,
        matchedBy
      });
    }
  }

  // Sort suggestions by similarity score descending
  scoredSuggestions.sort((a, b) => b.score - a.score);

  return {
    exactMatch,
    suggestions: scoredSuggestions.slice(0, 5) // top 5 suggestions
  };
}

/**
 * Primary search engine for society autocomplete and discovery.
 * Supports partial search, typo tolerance, aliases, and landmarks.
 */
export function searchSocietiesEngine(query: string, societies: Society[]): Society[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return societies;

  return societies
    .map(soc => {
      const name = soc.name.toLowerCase();
      const normName = (soc.normalizedName || normalizeSocietyName(soc.name)).toLowerCase();
      const locality = (soc.locality || '').toLowerCase();
      const city = (soc.city || '').toLowerCase();
      const state = (soc.state || '').toLowerCase();
      const landmark = (soc.landmark || '').toLowerCase();
      const aliases = (soc.aliases || []).map(a => a.toLowerCase());

      let score = 0;

      // 1. Exact matches
      if (name === cleanQuery || normName === cleanQuery) score += 100;
      else if (aliases.includes(cleanQuery)) score += 95;

      // 2. Starts with query
      else if (name.startsWith(cleanQuery) || normName.startsWith(cleanQuery)) score += 80;
      else if (aliases.some(a => a.startsWith(cleanQuery))) score += 75;

      // 3. Contains query
      else if (name.includes(cleanQuery) || normName.includes(cleanQuery)) score += 60;
      else if (aliases.some(a => a.includes(cleanQuery))) score += 55;
      else if (locality.includes(cleanQuery) || city.includes(cleanQuery) || state.includes(cleanQuery)) score += 40;
      else if (landmark.includes(cleanQuery)) score += 35;

      // 4. Fuzzy similarity fallback
      else {
        const simScore = getStringSimilarity(cleanQuery, normName);
        if (simScore >= 0.6) score += Math.round(simScore * 30);
      }

      return { society: soc, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.society);
}

/**
 * Pipeline to parse and import society datasets from CSV text.
 */
export function importSocietiesFromCSV(
  csvText: string,
  existingSocieties: Society[]
): {
  newSocieties: Society[];
  updatedSocieties: Society[];
  importedCount: number;
  mergedCount: number;
  skippedCount: number;
  errors: string[];
  reportSummary: string;
} {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      newSocieties: [],
      updatedSocieties: existingSocieties,
      importedCount: 0,
      mergedCount: 0,
      skippedCount: 0,
      errors: ['CSV file is empty or missing header row.'],
      reportSummary: 'Import Failed: Empty file.'
    };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('society'));
  const areaIdx = headers.findIndex(h => h.includes('area') || h.includes('locality'));
  const cityIdx = headers.findIndex(h => h.includes('city'));
  const stateIdx = headers.findIndex(h => h.includes('state'));
  const pincodeIdx = headers.findIndex(h => h.includes('pin') || h.includes('pincode'));
  const builderIdx = headers.findIndex(h => h.includes('builder'));
  const landmarkIdx = headers.findIndex(h => h.includes('landmark'));
  const aliasIdx = headers.findIndex(h => h.includes('alias') || h.includes('aliases'));

  if (nameIdx === -1 || cityIdx === -1) {
    return {
      newSocieties: [],
      updatedSocieties: existingSocieties,
      importedCount: 0,
      mergedCount: 0,
      skippedCount: 0,
      errors: ['Required headers "Society Name" and "City" were not detected in CSV.'],
      reportSummary: 'Import Failed: Missing required column headers.'
    };
  }

  const updatedSocieties = [...existingSocieties];
  const createdNew: Society[] = [];
  let mergedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    const rawName = row[nameIdx];
    const city = row[cityIdx] || 'Thane, Mumbai MMR';

    if (!rawName) {
      skippedCount++;
      errors.push(`Row ${i + 1}: Empty society name.`);
      continue;
    }

    const normName = normalizeSocietyName(rawName);
    const area = areaIdx !== -1 ? row[areaIdx] || 'Central Area' : 'Central Area';
    const state = stateIdx !== -1 ? row[stateIdx] || 'Maharashtra' : 'Maharashtra';
    const pincode = pincodeIdx !== -1 ? row[pincodeIdx] || '' : '';
    const builder = builderIdx !== -1 ? row[builderIdx] || '' : '';
    const landmark = landmarkIdx !== -1 ? row[landmarkIdx] || '' : '';
    const aliasStr = aliasIdx !== -1 ? row[aliasIdx] || '' : '';
    const aliases = aliasStr ? aliasStr.split(';').map(a => normalizeSocietyName(a)).filter(Boolean) : [];

    // Fuzzy duplicate check against updatedSocieties
    const fuzzyResult = fuzzyMatchSociety(normName, updatedSocieties);

    if (fuzzyResult.exactMatch) {
      // Merge aliases into canonical society
      const existing = fuzzyResult.exactMatch;
      const combinedAliases = Array.from(new Set([...(existing.aliases || []), ...aliases, normName]));
      existing.aliases = combinedAliases;
      existing.updatedAt = new Date().toISOString();
      mergedCount++;
    } else {
      // Create new UUID canonical society
      const newSoc: Society = {
        id: 'soc-' + crypto.randomUUID(),
        name: normName,
        normalizedName: normName.toUpperCase(),
        city,
        locality: area,
        state,
        pincode,
        builder,
        landmark,
        verificationStatus: 'Verified',
        aliases,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        residentProfilesCount: 0,
        totalTopicsAvailable: 11,
        lastUpdated: 'Just now',
        description: `Residential society located in ${area}, ${city} near ${landmark || 'key transport links'}.`,
        profiles: [],
        history: [
          {
            timestamp: new Date().toISOString(),
            action: 'IMPORT',
            details: 'Imported via CSV Data Pipeline'
          }
        ]
      };

      updatedSocieties.push(newSoc);
      createdNew.push(newSoc);
    }
  }

  const reportSummary = `CSV Import Complete: ${createdNew.length} New Societies Created, ${mergedCount} Duplicates Merged into Canonical Records, ${skippedCount} Invalid Rows Skipped.`;

  return {
    newSocieties: createdNew,
    updatedSocieties,
    importedCount: createdNew.length,
    mergedCount,
    skippedCount,
    errors,
    reportSummary
  };
}

/**
 * Export societies dataset to CSV format string.
 */
export function exportSocietiesToCSV(societies: Society[]): string {
  const headers = ['UUID', 'Display Name', 'Normalized Name', 'Locality', 'City', 'State', 'Pincode', 'Landmark', 'Builder', 'Status', 'Aliases', 'Profiles Count'];
  const rows = societies.map(s => [
    `"${s.id}"`,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${(s.normalizedName || normalizeSocietyName(s.name)).replace(/"/g, '""')}"`,
    `"${(s.locality || '').replace(/"/g, '""')}"`,
    `"${(s.city || '').replace(/"/g, '""')}"`,
    `"${(s.state || 'Maharashtra').replace(/"/g, '""')}"`,
    `"${s.pincode || ''}"`,
    `"${(s.landmark || '').replace(/"/g, '""')}"`,
    `"${(s.builder || '').replace(/"/g, '""')}"`,
    `"${s.verificationStatus || 'Verified'}"`,
    `"${(s.aliases || []).join(';')}"`,
    s.residentProfilesCount || 0
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
