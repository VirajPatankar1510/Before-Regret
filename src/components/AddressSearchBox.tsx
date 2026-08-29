import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, AlertCircle, MapPin,
  CheckCircle2, ArrowRight, Search, X
} from 'lucide-react';
import { PropertySearchResult } from '../types';
import { isPlausibleYearBuilt } from '../engine/inspectionPriorities';

interface AddressSearchBoxProps {
  onSelectProperty: (property: PropertySearchResult) => void;
}

// Real residential-only validation gate: calls the backend, which runs Census geocoder
// (Layer 1) + HIFLD-successor federal/military/protected-area checks (Layer 2) + a
// requester-declared property type (Layer 3). BeforeRegret has no real, legally-cleared county
// assessor data source for any jurisdiction, and testing showed OSM/geocoder metadata alone
// isn't reliable enough to auto-detect residential vs. commercial (it false-positives on real
// commercial buildings). So Layer 3 asks the requester to declare the property type directly,
// and every report is honest that this field is self-reported, not independently verified.
export type DeclaredPropertyType = 'single_family' | 'condo_or_multifamily' | 'other';

interface AddressGateOutcome {
  passed: boolean;
  message: string;
  blockedAtLayer: 1 | 2 | 3 | null;
  promptForUnit?: boolean;
}

async function validateAddressGate(
  address: string,
  city: string,
  state: string,
  declaredPropertyType: DeclaredPropertyType | null,
  unitNumber: string
): Promise<AddressGateOutcome> {
  try {
    const res = await fetch('/api/address/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, city, state, declaredPropertyType, unitNumber })
    });
    if (!res.ok) {
      return { passed: false, message: 'Address verification is temporarily unavailable. Please try again.', blockedAtLayer: 1 };
    }
    const data = await res.json();
    const gate = data?.gate;
    return {
      passed: !!gate?.canGenerateReport,
      message: gate?.message || "This location isn't a residential address. Try searching for a specific home or condo address.",
      blockedAtLayer: gate?.blockedAtLayer ?? 1,
      promptForUnit: gate?.promptForUnit
    };
  } catch (err) {
    console.warn('Address gate request failed:', err);
    // Fail closed: a network error is never treated as a pass.
    return { passed: false, message: 'Address verification is temporarily unavailable. Please try again.', blockedAtLayer: 1 };
  }
}

// Soft, non-blocking sanity check only -- NOT a validation gate. Tested empirically: OSM
// class/type tags are not reliable enough to trust as a hard pass/fail (real commercial
// buildings frequently get generic "house" tags too), so this only ever produces a dismissible
// warning nudge, never a block. The actual gate decision is the requester's own declaration.
function looksCommercial(itemClass?: string, itemType?: string): boolean {
  const cls = (itemClass || '').toLowerCase();
  const type = (itemType || '').toLowerCase();
  const commercialSignals = ['shop', 'amenity', 'office', 'commercial', 'industrial', 'retail', 'restaurant', 'tourism', 'government', 'civic'];
  return commercialSignals.includes(cls) || commercialSignals.includes(type);
}

// Unlike residential-vs-commercial (proven unreliable above), "specific address vs. generic
// area" IS a reliable signal: a real street-level match always carries a house_number in
// LocationIQ's address breakdown, while a county/city/state-level match never does. Filtering on
// this keeps results like "Washington County, Pennsylvania, USA" out of the picker entirely,
// rather than letting the user select something the backend gate would reject anyway.
function isSpecificAddress(item: any): boolean {
  return !!item?.address?.house_number;
}

// The geocoder returns THREE shapes, not two -- verified live against the real API, and the
// reason the search error below used to be actively wrong:
//
//   "1211 Brazos St, Austin, TX" -> class=highway, road="Brazos Street", NO house_number
//   "Washington County, PA"      -> class=boundary/administrative, no road, no house_number
//   "301 Congress Ave, Austin"   -> house_number present
//
// The middle case is a real, correctly-typed street address that LocationIQ simply has no
// house-number entry for. It has no house_number, so isSpecificAddress rejects it -- and the old
// single catch-all message then told that user they had entered "just a city, county, or state,"
// which is false and reads as though they made a mistake they did not make. This distinguishes it
// so the message can say what actually happened.
function isStreetLevel(item: any): boolean {
  const addr = item?.address || {};
  return !addr.house_number && !!(addr.road || addr.street);
}

/** "Brazos Street, Austin, TX" -- what the geocoder DID find, for an error message that quotes it
 *  back rather than leaving the reader guessing which part of their input failed. */
function describeMatch(item: any): string {
  const addr = item?.address || {};
  const road = addr.road || addr.street || '';
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
  const state = addr.state_code ? String(addr.state_code).toUpperCase() : (addr.state || '');
  return [road, city, state].filter(Boolean).join(', ');
}

export const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({ onSelectProperty }) => {
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const [selectedPinResult, setSelectedPinResult] = useState<PropertySearchResult | null>(() => {
    try {
      const saved = sessionStorage.getItem('beforeregret_map_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.selectedPinResult) return parsed.selectedPinResult;
      }
    } catch (e) {}
    return null;
  });
  const [gateState, setGateState] = useState<{ status: 'checking' | 'passed' | 'blocked'; message: string; promptForUnit?: boolean; isDismissed?: boolean } | null>(null);
  const gateRequestIdRef = useRef(0);
  const [declaredPropertyType, setDeclaredPropertyType] = useState<DeclaredPropertyType | null>(null);
  const [unitNumber, setUnitNumber] = useState('');
  // Required, not optional -- a skippable year built meant the Inspection Budget Priorities
  // section (the report's most useful part for older homes) silently never rendered unless the
  // buyer happened to fill in an optional field. Gating on it means every report either shows
  // era-specific priorities or the requester actively declared "other" and skipped it, not "we
  // just didn't ask."
  const [yearBuilt, setYearBuilt] = useState('');
  const [commercialHint, setCommercialHint] = useState(false);
  const [commercialHintDismissed, setCommercialHintDismissed] = useState(false);
  // Property type is a required next step, not one of several optional things to fill in on the
  // same panel as the address confirmation -- shown as its own modal so it reads as a distinct
  // step rather than adding more clutter to an already-busy confirmation panel.
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);

  const [mapSearchQuery, setMapSearchQuery] = useState(() => {
    try {
      const saved = sessionStorage.getItem('beforeregret_map_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mapSearchQuery) return parsed.mapSearchQuery;
      }
    } catch (e) {}
    return '';
  });
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // True once the reader has picked an address, or while one is being resolved. Gates the whole
  // confirmation block below -- validation gate banner, property panel, submit button. This was
  // called `showMap` until the confirmation map was removed on 2026-08-29; the map was only ever
  // one child of the block this guards, so the condition outlived it and only the name changed.
  const hasSelection = !!(selectedPinResult || isReverseGeocoding);

  const yearBuiltValid = isPlausibleYearBuilt(parseInt(yearBuilt, 10));

  // Whether the "Analyze Property" button can actually submit vs. still needs a property-type
  // declaration/unit number/year built vs. is genuinely blocked pending or failing the backend
  // gate check.
  const canAnalyze = !!declaredPropertyType && yearBuiltValid && !gateState?.promptForUnit && gateState?.status === 'passed';
  const analyzeDisabled = !!declaredPropertyType && yearBuiltValid && !gateState?.promptForUnit && gateState?.status !== 'passed';

  // Synchronize draft selection with sessionStorage
  useEffect(() => {
    try {
      if (selectedPinResult || mapSearchQuery) {
        sessionStorage.setItem('beforeregret_map_draft', JSON.stringify({
          selectedPinResult,
          mapSearchQuery
        }));
      } else {
        sessionStorage.removeItem('beforeregret_map_draft');
      }
    } catch (e) {}
  }, [selectedPinResult, mapSearchQuery]);

  // A newly selected address clears any prior property-type declaration -- it belongs to the
  // previous address, not this one. Opens the property-type modal automatically as the next
  // step (only when an address actually just got selected, not on initial mount with none).
  useEffect(() => {
    setDeclaredPropertyType(null);
    setUnitNumber('');
    setYearBuilt('');
    setCommercialHintDismissed(false);
    if (selectedPinResult) {
      setShowPropertyTypeModal(true);
    }
  }, [selectedPinResult?.placeId]);

  // Layer 4 gate: does NOT run until the requester has declared a property type (Layer 3 needs
  // it -- there's no external data source to check property type against, see
  // geoValidationGate.ts). Re-verifies against the real backend gate (Census geocoder +
  // government facility check + the declared type) every time the address or declaration
  // changes, before the "Analyze Property" button can be enabled.
  useEffect(() => {
    if (!selectedPinResult) {
      setGateState(null);
      return;
    }
    if (!declaredPropertyType) {
      // Don't call the gate yet -- wait for the requester to pick a property type below.
      setGateState(null);
      return;
    }

    const requestId = ++gateRequestIdRef.current;
    setGateState({ status: 'checking', message: 'Verifying this address…' });

    // Debounce so typing a unit number doesn't fire a request per keystroke.
    const timer = setTimeout(() => {
      const addressForGate = selectedPinResult.formattedAddress || selectedPinResult.displayName;
      validateAddressGate(addressForGate, selectedPinResult.city, selectedPinResult.state, declaredPropertyType, unitNumber).then((outcome) => {
        // Ignore stale responses if the user already selected a different result/declaration.
        if (requestId !== gateRequestIdRef.current) return;
        setGateState({ status: outcome.passed ? 'passed' : 'blocked', message: outcome.message, promptForUnit: outcome.promptForUnit });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedPinResult, declaredPropertyType, unitNumber]);

  // Debounced auto-suggestions as user types in search
  useEffect(() => {
    if (!mapSearchQuery.trim() || mapSearchQuery.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Over-fetch (limit=8) since filtering to specific addresses below can drop several
        // results (e.g. a query matching a county name alongside real street addresses in it).
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(mapSearchQuery.trim())}&addressdetails=1&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          const specific = Array.isArray(data) ? data.filter(isSpecificAddress).slice(0, 5) : [];
          if (specific.length > 0) {
            setSuggestions(specific);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.warn('Suggestions fetch error:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [mapSearchQuery]);


  // Reverse geocode a resolved coordinate into a display-ready property result. Only called
  // after a search selection, not from any map interaction (the map is a static confirmation
  // preview, not an input).
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);

    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const item = await response.json();
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.hamlet || addr.county || '';
        const state = addr.state_code ? addr.state_code.toUpperCase() : (addr.state || '');
        const zip = addr.postcode || '';
        const county = addr.county || '';
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
        const street = [houseNumber, road].filter(Boolean).join(' ');

        let pType: PropertySearchResult['propertyType'] = 'Multi-Unit Residential Complex';
        const itemTypeLower = (item.type || '').toLowerCase();
        const displayNameLower = (item.display_name || '').toLowerCase();

        if (itemTypeLower === 'condominium' || displayNameLower.includes('condo') || displayNameLower.includes('townhouse')) {
          pType = 'Condo / Townhouse Complex';
        } else if (itemTypeLower === 'apartments' || displayNameLower.includes('apartment') || displayNameLower.includes('complex') || displayNameLower.includes('tower')) {
          pType = 'Apartment / Condo Complex';
        } else if (displayNameLower.includes('residence') || displayNameLower.includes('enclave') || displayNameLower.includes('heights') || displayNameLower.includes('villas')) {
          pType = 'Multi-Unit Residential Complex';
        } else {
          pType = 'Single Family Residential';
        }

        let cleanDisplayName = item.display_name;
        if (street && city && state) {
          cleanDisplayName = zip ? `${street}, ${city}, ${state} ${zip}` : `${street}, ${city}, ${state}`;
        } else {
          cleanDisplayName = item.display_name.replace(/,\s*United States$/i, '');
        }

        setCommercialHint(looksCommercial(item.class, item.type));
        setSelectedPinResult({
          placeId: `search_${item.place_id || Math.random().toString(36).substring(7)}`,
          formattedAddress: cleanDisplayName,
          streetNumber: houseNumber,
          streetName: road,
          city,
          state,
          zipCode: zip,
          county,
          country: 'United States',
          lat,
          lon,
          propertyType: pType,
          displayName: cleanDisplayName
        });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const selectLocation = (lat: number, lon: number, name?: string, item?: any) => {
    setShowSuggestions(false);
    if (name) setMapSearchQuery(name);
    // Sets result state only. This used to coexist with a confirmation map that had to be
    // re-centred here; that map was removed on 2026-08-29 and nothing else needs to react to a
    // selection beyond the state set below.
    if (!isNaN(lat) && !isNaN(lon)) {
      if (item && item.address) {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.hamlet || addr.county || '';
        const state = addr.state_code ? addr.state_code.toUpperCase() : (addr.state || '');
        const zip = addr.postcode || '';
        const county = addr.county || '';
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';

        let pType: PropertySearchResult['propertyType'] = 'Multi-Unit Residential Complex';
        const itemTypeLower = (item.type || '').toLowerCase();
        const displayNameLower = (item.display_name || '').toLowerCase();

        if (itemTypeLower === 'condominium' || displayNameLower.includes('condo') || displayNameLower.includes('townhouse')) {
          pType = 'Condo / Townhouse Complex';
        } else if (itemTypeLower === 'apartments' || displayNameLower.includes('apartment') || displayNameLower.includes('complex') || displayNameLower.includes('tower')) {
          pType = 'Apartment / Condo Complex';
        } else if (displayNameLower.includes('residence') || displayNameLower.includes('enclave') || displayNameLower.includes('heights') || displayNameLower.includes('villas')) {
          pType = 'Multi-Unit Residential Complex';
        } else {
          pType = 'Single Family Residential';
        }

        // Reconstruct "house_number street, city, state zip" rather than trusting
        // item.display_name directly -- LocationIQ prefixes a POI/building name (e.g. "White
        // House, 1600, Pennsylvania Avenue Northwest, ...") for well-known addresses, which put
        // the street number nowhere near the start of the string and tripped Layer 1's "must
        // start with a street number" check even though the address itself is perfectly valid.
        // Mirrors the same reconstruction fetchAddressFromCoords below already does.
        const street = [houseNumber, road].filter(Boolean).join(' ');
        let cleanDisplayName = item.display_name;
        if (street && city && state) {
          cleanDisplayName = zip ? `${street}, ${city}, ${state} ${zip}` : `${street}, ${city}, ${state}`;
        } else {
          cleanDisplayName = item.display_name.replace(/,\s*United States$/i, '');
        }

        setCommercialHint(looksCommercial(item.class, item.type));
        setSelectedPinResult({
          placeId: `search_${item.place_id || Math.random().toString(36).substring(7)}`,
          formattedAddress: cleanDisplayName,
          streetNumber: houseNumber,
          streetName: road,
          city,
          state,
          zipCode: zip,
          county,
          country: 'United States',
          lat,
          lon,
          propertyType: pType,
          displayName: cleanDisplayName
        });
      } else {
        fetchAddressFromCoords(lat, lon);
      }
    }
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setShowSuggestions(false);
    setIsSearchingMap(true);
    setMapSearchError(null);

    try {
      const res = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(mapSearchQuery.trim())}&addressdetails=1&limit=8`
      );
      // A non-OK response previously fell through this whole block silently: no result, no error,
      // the spinner just stopped and the user was left staring at an unchanged form with no idea
      // anything had failed. A geocoder 5xx or rate-limit is exactly when a person most needs to
      // be told to try again, so it gets a real message now.
      if (!res.ok) {
        setMapSearchError('Address lookup is temporarily unavailable. Please try again in a moment.');
        return;
      }

      const json = await res.json();
      const results = Array.isArray(json) ? json : [];
      const first = results.find(isSpecificAddress);
      if (first) {
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        selectLocation(lat, lon, first.display_name, first);
        return;
      }

      // Three genuinely different failures, three different messages -- see isStreetLevel above
      // for why collapsing them into one was wrong rather than merely vague.
      const street = results.find(isStreetLevel);
      if (street) {
        const where = describeMatch(street);
        setMapSearchError(
          `We found ${where || 'that street'}, but no records for that exact house number. Double-check the number, or try adding the ZIP code.`
        );
      } else if (results.length > 0) {
        setMapSearchError('That looks like a city, county, or state. Please enter a specific street address (e.g. "301 Congress Ave, Austin, TX").');
      } else {
        setMapSearchError("We couldn't find that address. Check the spelling, and include the city and state.");
      }
    } catch (err) {
      console.error('Map search error:', err);
      setMapSearchError('Failed to search location. Please try again.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Init map: a static confirmation preview, not an input surface. No click-to-select, no
  // drag-to-reposition, no pan/zoom-triggered data fetching -- those were the biggest source of
  // background API traffic in the old design (a request on every pan/zoom to fetch nearby
  // building labels, on top of one for every pin drag). Address entry now happens exclusively
  // through the search bar above; the map only ever shows where the searched address resolved.

  // Recenter/show the pin whenever a new address is selected via search.


  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 text-left">

      {/* Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-lg relative z-30">
        <form onSubmit={handleMapSearch} className="flex items-center gap-2 relative">
          <div className="relative flex-1 flex items-center bg-slate-950 border border-slate-700 focus-within:border-blue-500 rounded-xl px-3 py-2 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            {/* aria-label, not a visible <label>: this is the homepage's primary conversion control
                and its design is a placeholder-only search field, but a placeholder is not an
                accessible name (it vanishes on input and is skipped by some screen readers), so the
                field previously had no programmatic label at all. autoComplete lets browsers offer a
                saved street address. */}
            <input
              type="text"
              id="address-search-input"
              aria-label="Full street address to research"
              autoComplete="street-address"
              value={mapSearchQuery}
              onChange={(e) => {
                setMapSearchQuery(e.target.value);
                if (mapSearchError) setMapSearchError(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Enter your full street address..."
              className="w-full text-xs sm:text-sm text-white placeholder:text-slate-500 bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingMap}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSearchingMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search</span>}
          </button>

          {/* Search Auto-suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800">
              {suggestions.map((item, idx) => (
                <button
                  key={item.place_id || idx}
                  type="button"
                  onClick={() => selectLocation(parseFloat(item.lat), parseFloat(item.lon), item.display_name, item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-600/20 transition-colors flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span className="truncate leading-relaxed font-medium">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {mapSearchError && (
        <div className="bg-red-950/80 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{mapSearchError}</span>
        </div>
      )}

      {/* The confirmation map that used to sit here was removed on 2026-08-29. It rendered a
          maplibre-gl canvas with LocationIQ tiles once an address was picked, purely to show the
          reader where it was -- it carried `pointer-events-none` and wrote nothing back, so it was
          a preview and never an input. Removing it costs no functionality.

          What did NOT go with it: /api/geocode/search and /api/geocode/reverse. Those resolve the
          address the reader types and produce the lat/lon that server.ts hands to
          fetchSeismicHazardFinding() for the live USGS query -- one of the two live checks this
          product advertises. Verified against 1280 Riverwalk Ter, Jenks, OK 74037: LocationIQ
          returns 36.0309871 / -95.9638813, and USGS answers seismic design category B from those
          coordinates. Do not "finish the job" by deleting the geocode routes.

          `hasSelection` below was called `showMap`. It still gates this whole block, because the
          gate banner and the confirmation panel were nested inside the map's fragment -- the name
          was the only thing that was ever about the map. */}
      {hasSelection && (
      <>
      {/* Address Validation Gate Banner */}
      {gateState && gateState.status === 'blocked' && !gateState.isDismissed && (
        <div className="bg-amber-950/90 border border-amber-500/40 rounded-2xl p-3.5 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-md animate-fade-in flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="font-bold text-amber-300 text-sm">
              {gateState.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGateState(prev => prev ? { ...prev, isDismissed: true } : null)}
            className="text-amber-400 hover:text-white font-bold cursor-pointer shrink-0 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Property Confirmation Panel */}
      {(selectedPinResult || isReverseGeocoding) && (
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-2xl backdrop-blur-md space-y-3">
            <div className="min-w-0 space-y-0.5 sm:space-y-1">
              <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                {isReverseGeocoding ? (
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400 shrink-0" />
                    <span>Looking Up Address...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Address Found</span>
                  </span>
                )}
              </div>

              {selectedPinResult && (
                <>
                  <div className="text-xs sm:text-base font-bold text-white truncate leading-tight sm:leading-normal">
                    {selectedPinResult.displayName}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 truncate">
                    {[selectedPinResult.city, selectedPinResult.state, selectedPinResult.county].filter(Boolean).join(', ')}
                  </div>
                </>
              )}
            </div>

            {selectedPinResult && commercialHint && !commercialHintDismissed && (
              <div className="bg-amber-950/60 border border-amber-600/40 rounded-xl p-2.5 text-[11px] text-amber-200 flex items-start justify-between gap-2">
                <span>This address looks like it might be a business, not a home. Double-check before continuing.</span>
                <button type="button" onClick={() => setCommercialHintDismissed(true)} className="text-amber-400 hover:text-white font-bold shrink-0 cursor-pointer">Dismiss</button>
              </div>
            )}

            {selectedPinResult && (
              declaredPropertyType ? (
                <button
                  type="button"
                  onClick={() => setShowPropertyTypeModal(true)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 transition-all cursor-pointer"
                >
                  <span className="text-xs text-slate-300">
                    <span className="text-slate-400">Property type: </span>
                    <span className="font-bold text-white">
                      {declaredPropertyType === 'single_family'
                        ? 'Single-Family Home'
                        : declaredPropertyType === 'condo_or_multifamily'
                          ? `Condo / Multifamily${unitNumber.trim() ? ` — Unit ${unitNumber.trim()}` : ''}`
                          : 'Other'}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-400 shrink-0">Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPropertyTypeModal(true)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <span>What type of property is this?</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              )
            )}

            {selectedPinResult && (
              <button
                type="button"
                disabled={analyzeDisabled}
                onClick={() => {
                  if (!declaredPropertyType || !yearBuiltValid || gateState?.promptForUnit) {
                    setShowPropertyTypeModal(true);
                    return;
                  }
                  if (gateState?.status !== 'passed') return;
                  onSelectProperty({
                    ...selectedPinResult,
                    declaredPropertyType,
                    unitNumber,
                    yearBuilt: parseInt(yearBuilt, 10),
                  });
                }}
                className={`w-full px-4 sm:px-5 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 tracking-tight ${
                  canAnalyze
                    ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer hover:shadow-blue-500/25'
                    : analyzeDisabled
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white cursor-pointer'
                }`}
              >
                {gateState?.status === 'checking' ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 animate-spin" />
                ) : null}
                <span>
                  {!declaredPropertyType
                    ? 'Set Property Type to Continue'
                    : !yearBuiltValid
                      ? 'Enter Year Built to Continue'
                      : gateState?.status === 'checking'
                      ? 'Verifying Address…'
                      : gateState?.promptForUnit
                        ? 'Enter Unit Number'
                        : gateState?.status === 'blocked'
                          ? 'Not Supported Yet'
                          : 'Analyze Property'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
            )}
        </div>
      )}
      </>
      )}

      {/* Property Type Modal -- the required next step after an address is confirmed, shown as
          its own step rather than crammed into the confirmation panel above. Non-blocking: it
          can be dismissed (backdrop click or the X) and reopened via the prompt in the panel,
          since "Analyze Property" already stays disabled until a type is declared regardless. */}
      {showPropertyTypeModal && selectedPinResult && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPropertyTypeModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                  Step 2 of 2
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">What type of property is this?</h3>
                <p className="text-xs text-slate-400 truncate">{selectedPinResult.displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPropertyTypeModal(false)}
                className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {commercialHint && !commercialHintDismissed && (
              <div className="bg-amber-950/60 border border-amber-600/40 rounded-xl p-2.5 text-[11px] text-amber-200 flex items-start justify-between gap-2">
                <span>This address looks like it might be a business, not a home. Double-check before continuing.</span>
                <button type="button" onClick={() => setCommercialHintDismissed(true)} className="text-amber-400 hover:text-white font-bold shrink-0 cursor-pointer">Dismiss</button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {([
                ['single_family', 'Single-Family Home'],
                ['condo_or_multifamily', 'Condo / Multifamily'],
                ['other', 'Other'],
              ] as [DeclaredPropertyType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeclaredPropertyType(value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                    declaredPropertyType === value
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {declaredPropertyType === 'condo_or_multifamily' && (
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="Unit number (e.g. #705)"
                autoFocus
                className="w-full text-xs sm:text-sm text-white placeholder:text-slate-500 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 focus:outline-none"
              />
            )}

            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <label htmlFor="year-built-input" className="block text-[11px] font-bold text-slate-300 pt-2">
                Year built <span className="font-normal text-slate-400">— usually on the listing</span>
              </label>
              <input
                id="year-built-input"
                type="text"
                inputMode="numeric"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 1968"
                className="w-full text-xs sm:text-sm text-white placeholder:text-slate-500 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Lets us show which checks matter most for homes of that era. We can't verify it — it's used exactly as you enter it. Don't know it exactly? A close estimate is fine.
              </p>
            </div>

            <button
              type="button"
              disabled={!declaredPropertyType || !yearBuiltValid || (declaredPropertyType === 'condo_or_multifamily' && !unitNumber.trim())}
              onClick={() => setShowPropertyTypeModal(false)}
              className={`w-full px-4 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 tracking-tight ${
                !declaredPropertyType || !yearBuiltValid || (declaredPropertyType === 'condo_or_multifamily' && !unitNumber.trim())
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer hover:shadow-blue-500/25'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
