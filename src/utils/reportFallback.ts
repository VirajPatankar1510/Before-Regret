import { PropertySearchResult, ResearchSummaryData, PropertyReport, CanonicalFinding } from '../types';

export function createFallbackSummary(property: PropertySearchResult | null): ResearchSummaryData {
  const addr = property || {
    placeId: 'default_prop',
    formattedAddress: '1204 Oakridge Dr, Austin, TX 78701',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    county: 'Travis County',
    country: 'United States',
    lat: 30.2672,
    lon: -97.7431,
    propertyType: 'Single Family Residential',
    displayName: '1204 Oakridge Dr, Austin, TX 78701'
  };

  return {
    address: addr,
    totalSourcesSearched: 6,
    usefulSourcesFound: 0,
    estimatedPages: 'Property Research Checklist',
    price: 0,
    priceRationale: 'BeforeRegret does not yet have a live, verified data connection for this address. This checklist links you directly to the official public sources so you can look up the records yourself.',
    includedCategories: [
      'Property Records',
      'Environment',
      'Neighborhood',
      'Hazards',
      'Utilities'
    ],
    publicSourcesList: [
      { id: 's1', name: 'FEMA Flood Map Service Center', category: 'Environmental', foundInfo: false, itemCount: 0, details: 'Not yet independently verified for this address.' },
      { id: 's2', name: 'Municipal Building Permit Records', category: 'Public Records', foundInfo: false, itemCount: 0, details: 'Not yet independently verified for this address.' },
      { id: 's3', name: 'County Assessor Parcel Records', category: 'Public Records', foundInfo: false, itemCount: 0, details: 'Not yet independently verified for this address.' },
      { id: 's4', name: 'EPA Superfund & Toxic Sites', category: 'Hazards', foundInfo: false, itemCount: 0, details: 'Not yet independently verified for this address.' },
      { id: 's5', name: 'City Code Enforcement Portal', category: 'Public Records', foundInfo: false, itemCount: 0, details: 'Not yet independently verified for this address.' },
      { id: 's6', name: 'DOT Highway Noise Index', category: 'Transit & Noise', foundInfo: false, itemCount: 0, details: 'Not yet independently verified for this address.' }
    ]
  };
}

export function createFallbackReport(
  property: PropertySearchResult | null,
  summaryData?: ResearchSummaryData | null
): PropertyReport {
  const addrObj = property || summaryData?.address || {
    placeId: 'default_prop',
    formattedAddress: '1204 Oakridge Dr, Austin, TX 78701',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    county: 'Travis County',
    country: 'United States',
    lat: 30.2672,
    lon: -97.7431,
    propertyType: 'Single Family Residential',
    displayName: '1204 Oakridge Dr, Austin, TX 78701'
  };

  // Ensure clean, deduplicated address formatting
  const rawAddr = addrObj.displayName || addrObj.formattedAddress || '1204 Oakridge Dr, Austin, TX 78701';
  let cleanAddr = rawAddr;
  if (rawAddr.includes('Austin') && rawAddr.split('Austin').length > 2) {
    // Strip repetitive city/state tail
    cleanAddr = rawAddr.split(', Austin')[0] + `, Austin, TX ${addrObj.zipCode || '78701'}`;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const canonicalFindings: CanonicalFinding[] = [
    {
      id: 'f_roof',
      subject: 'Roof & Envelope Replacement Records',
      category: 'Property Records',
      status: 'NOT YET VERIFIED',
      summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal roof permit records for this address.',
      whatWeFound: 'No live data connection to this jurisdiction\'s permit archive exists yet. This is not a confirmed absence of a permit.',
      whyItMatters: 'Roofing materials experience atmospheric weathering over time and represent significant replacement costs if nearing end-of-life.',
      suggestedNextStep: 'Ask the seller for roof replacement receipts or contractor invoice documentation, and check the municipal permit portal directly.',
      actionItem: {
        type: 'sellerQuestion',
        title: 'Roof Installation & Warranty',
        description: 'Has the roof ever been replaced or repaired, and do you have contractor invoices or warranty documentation?',
        why: 'BeforeRegret has not yet independently verified permit records for this address.'
      },
      lastUpdated: 'Not yet integrated',
      sourceAgency: 'City Building Department (not yet queried)'
    },
    {
      id: 'f_elec',
      subject: 'Main Electrical Service Panel',
      category: 'Property Records',
      status: 'NOT YET VERIFIED',
      summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal electrical permit records for this address.',
      whatWeFound: 'No live data connection to this jurisdiction\'s permit archive exists yet.',
      whyItMatters: 'A permitted electrical service panel meets modern safety standards for contemporary household appliances.',
      suggestedNextStep: 'Verify main panel labelling and breaker alignment during physical walkthrough, and check the municipal permit portal directly.',
      actionItem: {
        type: 'walkthroughItem',
        title: 'Main Electrical Panel Walkthrough',
        description: 'Locate the main service panel in garage or utility area and confirm municipal inspection sticker.',
        why: 'BeforeRegret has not yet independently verified permit records for this address.'
      },
      lastUpdated: 'Not yet integrated',
      sourceAgency: 'City Building Department (not yet queried)'
    },
    {
      id: 'f_hvac',
      subject: 'HVAC Compressor & Mechanical System',
      category: 'Property Records',
      status: 'NOT YET VERIFIED',
      summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal mechanical permit records for this address.',
      whatWeFound: 'No live data connection to this jurisdiction\'s permit archive exists yet.',
      whyItMatters: 'Central cooling compressors experience declining efficiency over 12-15 year lifespans.',
      suggestedNextStep: 'Have your home inspector record the manufacturing date on the condenser unit dataplate.',
      actionItem: {
        type: 'sellerQuestion',
        title: 'HVAC Age & Service History',
        description: 'What is the age of the central AC compressor, and are annual maintenance records available?',
        why: 'BeforeRegret has not yet independently verified permit records for this address.'
      },
      lastUpdated: 'Not yet integrated',
      sourceAgency: 'City Mechanical Permitting Division (not yet queried)'
    },
    {
      id: 'f_flood',
      subject: 'FEMA Flood Hazard Risk Zone',
      category: 'Environment',
      status: 'NOT YET VERIFIED',
      summaryText: 'BeforeRegret does not yet have a live, verified connection to the FEMA National Flood Hazard Layer for this address.',
      whatWeFound: 'No live data connection to FEMA NFHL exists yet for this address.',
      whyItMatters: 'Flood zone classification affects whether mortgage lenders require flood insurance.',
      suggestedNextStep: 'Look up the official flood zone yourself at the FEMA Flood Map Service Center before making assumptions about insurance requirements.',
      actionItem: {
        type: 'disclosureLever',
        title: 'Flood Insurance Verification',
        description: 'Ask your insurance agent to pull the official FEMA flood zone determination for this address.',
        why: 'BeforeRegret has not yet independently verified FEMA flood zone data for this address.'
      },
      lastUpdated: 'Not yet integrated',
      sourceAgency: 'FEMA Flood Map Service Center (not yet queried)'
    },
    {
      id: 'f_radon',
      subject: 'EPA Indoor Radon Hazard Zone',
      category: 'Environment',
      status: 'NOT YET VERIFIED',
      summaryText: 'BeforeRegret does not yet have a live, verified connection to USGS/EPA radon zone data for this address.',
      whatWeFound: 'No live data connection to the USGS/EPA radon dataset exists yet for this address.',
      whyItMatters: 'Radon is an odorless soil gas that can accumulate in ground-contact living spaces.',
      suggestedNextStep: 'Deploy a radon test monitor during your home inspection contingency window regardless of zone.',
      actionItem: {
        type: 'walkthroughItem',
        title: 'Radon Test Monitor Placement',
        description: 'Ask your inspector to place a continuous radon monitor on the lowest livable floor during the contingency period.',
        why: 'BeforeRegret has not yet independently verified radon zone data for this address.'
      },
      lastUpdated: 'Not yet integrated',
      sourceAgency: 'USGS / EPA Indoor Radon Map (not yet queried)'
    },
    {
      id: 'f_code',
      subject: 'Municipal Code Enforcement Standing',
      category: 'Neighborhood',
      status: 'NOT YET VERIFIED',
      summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal code enforcement records for this address.',
      whatWeFound: 'No live data connection to this jurisdiction\'s code enforcement system exists yet.',
      whyItMatters: 'Open code violations or municipal orders can affect closing and future liability.',
      suggestedNextStep: 'Check the municipal code enforcement portal directly before closing.',
      lastUpdated: 'Not yet integrated',
      sourceAgency: 'City Code Enforcement Department (not yet queried)'
    }
  ];

  return {
    id: `rep_${Date.now()}`,
    generatedAt: currentDate,
    readingTimeMinutes: 8,
    reportVersion: 'v2.0.0-prod',
    headerInfo: {
      address: cleanAddr,
      reportDate: currentDate,
      reportVersion: 'v2.0.0-prod'
    },
    pricing: {
      amount: summaryData?.price || 0,
      usefulSourcesCount: 0,
      totalSourcesCount: 21
    },
    propertyInfo: {
      address: cleanAddr,
      city: addrObj.city || 'Austin',
      state: addrObj.state || 'TX',
      zipCode: addrObj.zipCode || '78701',
      county: addrObj.county || 'Travis County',
      lat: addrObj.lat || 30.2672,
      lon: addrObj.lon || -97.7431,
      propertyType: addrObj.propertyType || 'Single Family Residential',
      estimatedSqFt: 2450
    },

    // Single Source of Truth
    canonicalFindings,

    // Bottom Line Synthesis
    bottomLine: {
      worthVerifyingSummary: [
        'Roof Replacement Permit: Not yet independently verified. Ask the seller for contractor invoices and check the municipal permit portal directly.',
        'HVAC Mechanical System: Not yet independently verified. Have your inspector check the unit\'s manufacturing date during the walkthrough.'
      ],
      likelyRoutineSummary: [],
      biggerPicture: 'BeforeRegret does not yet have a live, verified data connection to government records for this address. This checklist links you directly to the official public sources below so you can verify each item yourself before closing.'
    }
  };
}
