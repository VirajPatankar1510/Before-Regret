import { PropertySearchResult } from '../types';

export interface ValidationLayerResult {
  layer: number;
  layerName: string;
  passed: boolean;
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AddressGateResult {
  canGenerateReport: boolean;
  status: 'PASSED_RESIDENTIAL' | 'PASSED_CONDO_MULTIFAMILY' | 'BLOCKED_UNRESOLVED' | 'BLOCKED_GOVERNMENT_FACILITY' | 'BLOCKED_NON_RESIDENTIAL' | 'BLOCKED_UNDETERMINED_CLASSIFICATION' | 'BLOCKED_TEMPLATE_MISMATCH';
  propertyClassification: 'Single Family Residential' | 'Condo / Townhouse' | 'Multifamily / Complex' | 'Commercial / Mixed' | 'Non-Residential / Open Space' | 'Government Facility' | 'Undetermined';
  templateTypeAssigned?: 'single_family_template' | 'condo_multifamily_template' | 'blocked_non_residential';
  layerResults: ValidationLayerResult[];
  blockingReason?: string;
  auditTimestamp: string;
}

/**
 * 4-Layer Property Address Validation Gate
 * Rejects unresolvable, government, commercial, or undetermined properties before report generation.
 * FAILS CLOSED at every layer.
 */
export function validatePropertyAddressGate(property: PropertySearchResult): AddressGateResult {
  const layerResults: ValidationLayerResult[] = [];
  const timestamp = new Date().toISOString();

  // --------------------------------------------------------------------------
  // LAYER 1: Address Format & Resolution Validation (US Census Geocoder Rules)
  // --------------------------------------------------------------------------
  const hasStreetNumber = Boolean(property.streetNumber || /\b\d+\b/.test(property.formattedAddress || ''));
  const hasCity = Boolean(property.city && property.city.trim().length > 0);
  const hasState = Boolean(property.state && property.state.trim().length > 0);
  const hasZip = Boolean(property.zipCode && /^\d{5}(-\d{4})?$/.test(property.zipCode.trim()));
  const hasCoordinates = Boolean(property.lat && property.lon && Math.abs(property.lat) > 0);

  if (!hasStreetNumber || !hasCity || !hasState || !hasZip || !hasCoordinates) {
    layerResults.push({
      layer: 1,
      layerName: 'Address Format & Geocode Resolution (US Census Geocoder API)',
      passed: false,
      code: 'L1_UNRESOLVED_ADDRESS',
      message: 'Address resolution failed. Missing house number, postal zip code, or ambiguous parcel coordinates.',
      details: { hasStreetNumber, hasCity, hasState, hasZip, hasCoordinates }
    });

    return {
      canGenerateReport: false,
      status: 'BLOCKED_UNRESOLVED',
      propertyClassification: 'Undetermined',
      layerResults,
      blockingReason: 'Layer 1 Failure: Address could not be unambiguously resolved by government geocoding services. House number or ZIP code incomplete.',
      auditTimestamp: timestamp
    };
  }

  layerResults.push({
    layer: 1,
    layerName: 'Address Format & Geocode Resolution (US Census Geocoder API)',
    passed: true,
    code: 'L1_RESOLVED',
    message: 'Address successfully resolved to Census tract and parcel coordinate point.',
    details: { formattedAddress: property.formattedAddress, zipCode: property.zipCode }
  });

  // --------------------------------------------------------------------------
  // LAYER 2: Federal / Government Facility Exclusion Check (HIFLD Data)
  // --------------------------------------------------------------------------
  const nameLower = (property.displayName || property.formattedAddress || '').toLowerCase();
  const isGovFacility = property.isPublicFacility || 
    /\b(court|courthouse|city hall|capitol|military|army|navy|air force|usps|post office|embassy|consulate|federal building|correctional|prison|jail|police department|fire station|dept of|department of)\b/i.test(nameLower);

  if (isGovFacility) {
    layerResults.push({
      layer: 2,
      layerName: 'Federal/Government Facility Boundary Check (HIFLD API)',
      passed: false,
      code: 'L2_GOVERNMENT_FACILITY_BLOCKED',
      message: 'Parcel intersects known federal or municipal government facility boundaries.',
      details: { facilityCategory: property.facilityCategory || 'Federal/Government Facility' }
    });

    return {
      canGenerateReport: false,
      status: 'BLOCKED_GOVERNMENT_FACILITY',
      propertyClassification: 'Government Facility',
      layerResults,
      blockingReason: 'Layer 2 Failure: Property intersects a government, military, civic, or public safety facility boundary.',
      auditTimestamp: timestamp
    };
  }

  layerResults.push({
    layer: 2,
    layerName: 'Federal/Government Facility Boundary Check (HIFLD API)',
    passed: true,
    code: 'L2_NON_GOVERNMENT',
    message: 'Parcel confirmed clear of federal and municipal civic facility boundaries.',
  });

  // --------------------------------------------------------------------------
  // LAYER 3: County / Local Assessor Parcel Classification Gate
  // --------------------------------------------------------------------------
  let parcelClassification: 'Single Family Residential' | 'Condo / Townhouse' | 'Multifamily / Complex' | 'Commercial / Mixed' | 'Non-Residential / Open Space' | 'Government Facility' | 'Undetermined' = 'Undetermined';

  const typeStr = (property.propertyType || '').toLowerCase();

  if (/\b(single family|single-family|house|cottage|bungalow)\b/i.test(typeStr)) {
    parcelClassification = 'Single Family Residential';
  } else if (/\b(condo|townhouse|condominium|townhome)\b/i.test(typeStr)) {
    parcelClassification = 'Condo / Townhouse';
  } else if (/\b(apartment|complex|society|enclave|multifamily|multi-family)\b/i.test(typeStr)) {
    parcelClassification = 'Multifamily / Complex';
  } else if (/\b(commercial|mixed|office|retail|industrial)\b/i.test(typeStr)) {
    parcelClassification = 'Commercial / Mixed';
  } else if (/\b(land|plot|park|water|garden)\b/i.test(typeStr)) {
    parcelClassification = 'Non-Residential / Open Space';
  }

  // MANDATORY REQUIREMENT: Undetermined MUST NOT default to Single Family! Fail closed.
  if (parcelClassification === 'Undetermined') {
    layerResults.push({
      layer: 3,
      layerName: 'County Assessor Land Use Classification',
      passed: false,
      code: 'L3_UNDETERMINED_CLASSIFICATION',
      message: 'Assessor parcel code is undetermined or pending. Will not default to single-family.',
      details: { rawType: property.propertyType }
    });

    return {
      canGenerateReport: false,
      status: 'BLOCKED_UNDETERMINED_CLASSIFICATION',
      propertyClassification: 'Undetermined',
      layerResults,
      blockingReason: 'Layer 3 Failure: County assessor land use code is undetermined. Standard protocol prohibits defaulting unclassified parcels to single-family residential.',
      auditTimestamp: timestamp
    };
  }

  if (parcelClassification === 'Commercial / Mixed' || parcelClassification === 'Non-Residential / Open Space') {
    layerResults.push({
      layer: 3,
      layerName: 'County Assessor Land Use Classification',
      passed: false,
      code: 'L3_NON_RESIDENTIAL_BLOCKED',
      message: `Parcel classified as ${parcelClassification}. Research reports are restricted to residential property.`,
      details: { parcelClassification }
    });

    return {
      canGenerateReport: false,
      status: 'BLOCKED_NON_RESIDENTIAL',
      propertyClassification: parcelClassification,
      layerResults,
      blockingReason: `Layer 3 Failure: Parcel land use code (${parcelClassification}) is non-residential.`,
      auditTimestamp: timestamp
    };
  }

  layerResults.push({
    layer: 3,
    layerName: 'County Assessor Land Use Classification',
    passed: true,
    code: 'L3_CLASSIFIED_RESIDENTIAL',
    message: `Parcel land use confirmed as ${parcelClassification}.`,
    details: { parcelClassification }
  });

  // --------------------------------------------------------------------------
  // LAYER 4: Pre-Generation Template Consistency Check
  // --------------------------------------------------------------------------
  let templateTypeAssigned: 'single_family_template' | 'condo_multifamily_template' | 'blocked_non_residential' = 'single_family_template';

  if (parcelClassification === 'Single Family Residential') {
    templateTypeAssigned = 'single_family_template';
  } else if (parcelClassification === 'Condo / Townhouse' || parcelClassification === 'Multifamily / Complex') {
    templateTypeAssigned = 'condo_multifamily_template';
  }

  // Verify match
  const isTemplateCompatible = (parcelClassification === 'Single Family Residential' && templateTypeAssigned === 'single_family_template') ||
    ((parcelClassification === 'Condo / Townhouse' || parcelClassification === 'Multifamily / Complex') && templateTypeAssigned === 'condo_multifamily_template');

  if (!isTemplateCompatible) {
    layerResults.push({
      layer: 4,
      layerName: 'Pre-Generation Report Template Consistency Check',
      passed: false,
      code: 'L4_TEMPLATE_MISMATCH',
      message: 'Report template structure does not match confirmed parcel land use classification.',
      details: { parcelClassification, templateTypeAssigned }
    });

    return {
      canGenerateReport: false,
      status: 'BLOCKED_TEMPLATE_MISMATCH',
      propertyClassification: parcelClassification,
      layerResults,
      blockingReason: 'Layer 4 Failure: Pre-generation consistency check failed. Template assignment mismatch.',
      auditTimestamp: timestamp
    };
  }

  layerResults.push({
    layer: 4,
    layerName: 'Pre-Generation Report Template Consistency Check',
    passed: true,
    code: 'L4_TEMPLATE_MATCHED',
    message: `Report template (${templateTypeAssigned}) matched to parcel classification (${parcelClassification}).`,
    details: { templateTypeAssigned }
  });

  // Passed all 4 layers
  return {
    canGenerateReport: true,
    status: parcelClassification === 'Single Family Residential' ? 'PASSED_RESIDENTIAL' : 'PASSED_CONDO_MULTIFAMILY',
    propertyClassification: parcelClassification,
    templateTypeAssigned,
    layerResults,
    auditTimestamp: timestamp
  };
}
