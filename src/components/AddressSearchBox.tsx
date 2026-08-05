import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Loader2, AlertCircle, MapPin,
  Layers, CheckCircle2, ArrowRight, Search, X
} from 'lucide-react';
import { PropertySearchResult } from '../types';

interface AddressSearchBoxProps {
  onSelectProperty: (property: PropertySearchResult) => void;
}

// Neutral continental-US view shown before the user has searched for anything -- no property is
// pre-selected on load (a prior version defaulted to a sample Austin address, which meant the
// "Analyze Property" button was usable before the user had chosen anything).
const DEFAULT_VIEW = { lat: 39.8, lon: -98.5, zoom: 3.4 };

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

export const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({ onSelectProperty }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerInstanceRef = useRef<maplibregl.Marker | null>(null);

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
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

  // The map is a confirmation preview for a result the user already searched for -- it has
  // nothing to show before that, so it isn't mounted at all until there's a result (or one is
  // being looked up). Rendering a large empty map box on every page load, before any search,
  // wasted prime above-the-fold space and read as broken rather than intentional.
  const showMap = !!(selectedPinResult || isReverseGeocoding);

  // Whether the "Analyze Property" button can actually submit vs. still needs a property-type
  // declaration/unit number vs. is genuinely blocked pending or failing the backend gate check.
  const canAnalyze = !!declaredPropertyType && !gateState?.promptForUnit && gateState?.status === 'passed';
  const analyzeDisabled = !!declaredPropertyType && !gateState?.promptForUnit && gateState?.status !== 'passed';

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

  const updateMarkerPosition = (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;

    if (!markerInstanceRef.current) {
      const pinEl = document.createElement('div');
      pinEl.innerHTML = `
        <div class="relative flex flex-col items-center justify-end transform -translate-x-1/2 -translate-y-full" style="width:36px; height:44px;">
          <div class="w-9 h-9 bg-blue-600 border-2 border-white text-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600 -mt-[1px]"></div>
        </div>
      `;

      // Static confirmation pin only -- not draggable. Selecting a different address means
      // searching again, not repositioning this marker.
      const marker = new maplibregl.Marker({
        element: pinEl,
        draggable: false,
        anchor: 'bottom'
      })
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current);

      markerInstanceRef.current = marker;
    } else {
      markerInstanceRef.current.setLngLat([lon, lat]);
    }
  };

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

        let pType: PropertySearchResult['propertyType'] = 'Residential Society / Complex';
        const itemTypeLower = (item.type || '').toLowerCase();
        const displayNameLower = (item.display_name || '').toLowerCase();

        if (itemTypeLower === 'condominium' || displayNameLower.includes('condo') || displayNameLower.includes('townhouse')) {
          pType = 'Condo / Townhouse Complex';
        } else if (itemTypeLower === 'apartments' || displayNameLower.includes('apartment') || displayNameLower.includes('complex') || displayNameLower.includes('tower')) {
          pType = 'Apartment / Condo Complex';
        } else if (displayNameLower.includes('society') || displayNameLower.includes('residence') || displayNameLower.includes('enclave') || displayNameLower.includes('heights') || displayNameLower.includes('villas')) {
          pType = 'Residential Society / Complex';
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
    // Deliberately does not require mapInstanceRef.current to already exist: the map only
    // mounts once selectedPinResult is set (see showMap above), so gating this on the map
    // already existing would mean neither could ever happen first. The map-init effect reads
    // selectedPinResult for its initial center once it mounts, and the separate recenter effect
    // re-centers/drops the marker whenever selectedPinResult's lat/lon changes -- both handle
    // actually moving the map, so this function only needs to set the result state.
    if (!isNaN(lat) && !isNaN(lon)) {
      if (item && item.address) {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.hamlet || addr.county || '';
        const state = addr.state_code ? addr.state_code.toUpperCase() : (addr.state || '');
        const zip = addr.postcode || '';
        const county = addr.county || '';
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';

        let pType: PropertySearchResult['propertyType'] = 'Residential Society / Complex';
        const itemTypeLower = (item.type || '').toLowerCase();
        const displayNameLower = (item.display_name || '').toLowerCase();

        if (itemTypeLower === 'condominium' || displayNameLower.includes('condo') || displayNameLower.includes('townhouse')) {
          pType = 'Condo / Townhouse Complex';
        } else if (itemTypeLower === 'apartments' || displayNameLower.includes('apartment') || displayNameLower.includes('complex') || displayNameLower.includes('tower')) {
          pType = 'Apartment / Condo Complex';
        } else if (displayNameLower.includes('society') || displayNameLower.includes('residence') || displayNameLower.includes('enclave') || displayNameLower.includes('heights') || displayNameLower.includes('villas')) {
          pType = 'Residential Society / Complex';
        } else {
          pType = 'Single Family Residential';
        }

        const cleanDisplayName = item.display_name.replace(/,\s*United States$/i, '');

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
      if (res.ok) {
        const results = await res.json();
        const first = Array.isArray(results) ? results.find(isSpecificAddress) : null;
        if (first) {
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          selectLocation(lat, lon, first.display_name, first);
        } else {
          setMapSearchError('Please enter a specific street address (e.g. "123 Main St, Austin, TX"), not just a city, county, or state.');
        }
      }
    } catch (err) {
      console.error('Map search error:', err);
      setMapSearchError('Failed to search location.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Init map: a static confirmation preview, not an input surface. No click-to-select, no
  // drag-to-reposition, no pan/zoom-triggered data fetching -- those were the biggest source of
  // background API traffic in the old design (a request on every pan/zoom to fetch nearby
  // building labels, on top of one for every pin drag). Address entry now happens exclusively
  // through the search bar above; the map only ever shows where the searched address resolved.
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedPinResult?.lat || DEFAULT_VIEW.lat;
    const initialLon = selectedPinResult?.lon || DEFAULT_VIEW.lon;
    const initialZoom = selectedPinResult ? 17 : DEFAULT_VIEW.zoom;

    let map: maplibregl.Map;
    try {
      const tileUrl = `${window.location.origin}/api/geocode/tiles/streets/{z}/{x}/{y}.png`;
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'locationiq-streets': {
              type: 'raster',
              tiles: [tileUrl],
              tileSize: 256,
              attribution: '&copy; LocationIQ'
            },
            'esri-satellite': {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: 'Tiles &copy; Esri'
            },
            'esri-labels': {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'streets-layer',
              type: 'raster',
              source: 'locationiq-streets',
              layout: { visibility: isSatelliteView ? 'none' : 'visible' }
            },
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'esri-satellite',
              layout: { visibility: isSatelliteView ? 'visible' : 'none' }
            },
            {
              id: 'satellite-labels-layer',
              type: 'raster',
              source: 'esri-labels',
              layout: { visibility: isSatelliteView ? 'visible' : 'none' }
            }
          ]
        },
        center: [initialLon, initialLat],
        zoom: initialZoom,
        attributionControl: { compact: true },
        interactive: false
      });
    } catch (e) {
      console.warn('Map creation skipped:', e);
      return;
    }

    mapInstanceRef.current = map;
    if (selectedPinResult) {
      updateMarkerPosition(initialLat, initialLon);
    }

    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.resize();
        } catch (e) {}
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      if (markerInstanceRef.current) {
        try { markerInstanceRef.current.remove(); } catch (e) {}
        markerInstanceRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [showMap]);

  // Recenter/show the pin whenever a new address is selected via search.
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPinResult) return;
    mapInstanceRef.current.jumpTo({ center: [selectedPinResult.lon, selectedPinResult.lat], zoom: 17 });
    updateMarkerPosition(selectedPinResult.lat, selectedPinResult.lon);
  }, [selectedPinResult?.lat, selectedPinResult?.lon]);

  // Toggle tile layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    if (!map.isStyleLoaded()) return;

    try {
      if (isSatelliteView) {
        if (map.getLayer('streets-layer')) map.setLayoutProperty('streets-layer', 'visibility', 'none');
        if (map.getLayer('satellite-layer')) map.setLayoutProperty('satellite-layer', 'visibility', 'visible');
        if (map.getLayer('satellite-labels-layer')) map.setLayoutProperty('satellite-labels-layer', 'visibility', 'visible');
      } else {
        if (map.getLayer('streets-layer')) map.setLayoutProperty('streets-layer', 'visibility', 'visible');
        if (map.getLayer('satellite-layer')) map.setLayoutProperty('satellite-layer', 'visibility', 'none');
        if (map.getLayer('satellite-labels-layer')) map.setLayoutProperty('satellite-labels-layer', 'visibility', 'none');
      }
    } catch (err) {
      console.warn('Error toggling layers:', err);
    }
  }, [isSatelliteView]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 text-left">

      {/* Search Bar + View Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-lg relative z-30">
        <form onSubmit={handleMapSearch} className="flex-1 min-w-[260px] flex items-center gap-2 relative">
          <div className="relative flex-1 flex items-center bg-slate-950 border border-slate-700 focus-within:border-blue-500 rounded-xl px-3 py-2 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSatelliteView(!isSatelliteView)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSatelliteView
                ? 'bg-blue-600/90 text-white border-blue-400/50 shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Toggle between Satellite view and Street map"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{isSatelliteView ? 'Satellite View' : 'Street Map'}</span>
          </button>
        </div>
      </div>

      {mapSearchError && (
        <div className="bg-red-950/80 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{mapSearchError}</span>
        </div>
      )}

      {/* Static Confirmation Map -- preview only, not an input. Not mounted until a search
          result exists (see showMap above), so there's nothing to show before that. */}
      {showMap && (
      <div className="relative w-full h-[350px] sm:h-[400px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

        <div ref={mapContainerRef} className="w-full h-full z-0 pointer-events-none" />

        {/* Address Validation Gate Banner */}
        {gateState && gateState.status === 'blocked' && !gateState.isDismissed && (
          <div className="absolute top-4 left-4 right-4 z-20 bg-amber-950/90 border border-amber-500/40 rounded-2xl p-3.5 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-md animate-fade-in flex items-center justify-between gap-3">
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

        {/* Bottom Property Confirmation Panel */}
        {(selectedPinResult || isReverseGeocoding) && (
          <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 bg-slate-900/95 border border-slate-700/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-2xl backdrop-blur-md space-y-3 max-h-[70%] sm:max-h-none overflow-y-auto">
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
                    <span className="text-slate-500">Property type: </span>
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
                  if (!declaredPropertyType || gateState?.promptForUnit) {
                    setShowPropertyTypeModal(true);
                    return;
                  }
                  if (gateState?.status !== 'passed') return;
                  onSelectProperty({ ...selectedPinResult, declaredPropertyType, unitNumber });
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

      </div>
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
                className="text-slate-500 hover:text-white shrink-0 cursor-pointer"
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

            <p className="text-[10px] text-slate-500">
              We haven't independently verified property records for this address yet, so we ask you to confirm this directly. This will be shown on the report as self-reported, not verified.
            </p>

            <button
              type="button"
              disabled={!declaredPropertyType || (declaredPropertyType === 'condo_or_multifamily' && !unitNumber.trim())}
              onClick={() => setShowPropertyTypeModal(false)}
              className={`w-full px-4 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 tracking-tight ${
                !declaredPropertyType || (declaredPropertyType === 'condo_or_multifamily' && !unitNumber.trim())
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
