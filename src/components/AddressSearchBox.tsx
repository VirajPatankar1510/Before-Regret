import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Building2, Loader2, AlertCircle, MapPin, 
  Layers, Navigation, CheckCircle2, ArrowRight, Search 
} from 'lucide-react';
import { PropertySearchResult } from '../types';

interface AddressSearchBoxProps {
  onSelectProperty: (property: PropertySearchResult) => void;
}

const SAMPLE_PROPERTIES: PropertySearchResult[] = [
  {
    placeId: 'sample_austin_society',
    formattedAddress: 'Oakridge Residential Society, 1204 Oakridge Dr, Austin, TX 78701',
    streetNumber: '1204',
    streetName: 'Oakridge Dr',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    county: 'Travis County',
    country: 'United States',
    lat: 30.2672,
    lon: -97.7431,
    propertyType: 'Residential Society / Complex',
    displayName: 'Oakridge Residential Society, 1204 Oakridge Dr, Austin, TX 78701'
  },
  {
    placeId: 'sample_sf_condo',
    formattedAddress: 'Sutter Street Condo Complex, 450 Sutter St, San Francisco, CA 94108',
    streetNumber: '450',
    streetName: 'Sutter St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94108',
    county: 'San Francisco County',
    country: 'United States',
    lat: 37.7897,
    lon: -122.4080,
    propertyType: 'Condo / Townhouse Complex',
    displayName: 'Sutter Street Condo Complex, 450 Sutter St, San Francisco, CA 94108'
  },
  {
    placeId: 'sample_miami_enclave',
    formattedAddress: 'Ocean Palms Residential Enclave, 1100 Ocean Dr, Miami Beach, FL 33139',
    streetNumber: '1100',
    streetName: 'Ocean Dr',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    county: 'Miami-Dade County',
    country: 'United States',
    lat: 25.7820,
    lon: -80.1303,
    propertyType: 'Residential Society / Complex',
    displayName: 'Ocean Palms Residential Enclave, 1100 Ocean Dr, Miami Beach, FL 33139'
  },
  {
    placeId: 'sample_willow_maple',
    formattedAddress: 'Willow & Maple, 6918 Willow Street NW, Washington, DC 20012',
    streetNumber: '6918',
    streetName: 'Willow St NW',
    city: 'Washington',
    state: 'DC',
    zipCode: '20012',
    county: 'District of Columbia',
    country: 'United States',
    lat: 38.9760,
    lon: -77.0272,
    propertyType: 'Apartment / Condo Complex',
    displayName: 'Willow & Maple, 6918 Willow Street NW, Washington, DC 20012'
  },
  {
    placeId: 'sample_glade_laurel',
    formattedAddress: 'The Glade on Laurel, 6896 Laurel Street NW, Washington, DC 20012',
    streetNumber: '6896',
    streetName: 'Laurel St NW',
    city: 'Washington',
    state: 'DC',
    zipCode: '20012',
    county: 'District of Columbia',
    country: 'United States',
    lat: 38.9752,
    lon: -77.0268,
    propertyType: 'Apartment / Condo Complex',
    displayName: 'The Glade on Laurel, 6896 Laurel Street NW, Washington, DC 20012'
  }
];

// Real residential-only validation gate: calls the backend, which runs Census geocoder
// (Layer 1) + HIFLD-successor federal/military/protected-area checks (Layer 2) + the
// supported-jurisdiction assessor gate (Layer 3). This replaces the old OSM class/type/tag
// keyword heuristic, which was guessing from Nominatim display names and tags rather than
// checking any authoritative government data source.
interface AddressGateOutcome {
  passed: boolean;
  message: string;
  blockedAtLayer: 1 | 2 | 3 | null;
}

async function validateAddressGate(address: string, city: string, state: string): Promise<AddressGateOutcome> {
  try {
    const res = await fetch('/api/address/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, city, state })
    });
    if (!res.ok) {
      return { passed: false, message: 'Address verification is temporarily unavailable. Please try again.', blockedAtLayer: 1 };
    }
    const data = await res.json();
    const gate = data?.gate;
    return {
      passed: !!gate?.canGenerateReport,
      message: gate?.message || "This location isn't a residential address. Try searching for a specific home or condo address.",
      blockedAtLayer: gate?.blockedAtLayer ?? 1
    };
  } catch (err) {
    console.warn('Address gate request failed:', err);
    // Fail closed: a network error is never treated as a pass.
    return { passed: false, message: 'Address verification is temporarily unavailable. Please try again.', blockedAtLayer: 1 };
  }
}

export const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({ onSelectProperty }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerInstanceRef = useRef<maplibregl.Marker | null>(null);
  const buildingMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [detectedBuildingCount, setDetectedBuildingCount] = useState(0);
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
  const [gateState, setGateState] = useState<{ status: 'checking' | 'passed' | 'blocked'; message: string; isDismissed?: boolean } | null>(null);
  const gateRequestIdRef = useRef(0);

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

  // Synchronize draft map selection with sessionStorage
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

  // Layer 4 gate: every time a pin/search result is selected, synchronously (from the user's
  // point of view) re-verify it against the real backend gate (Census geocoder + government
  // facility check + jurisdiction support) before the "Analyze Property" button can be enabled.
  useEffect(() => {
    if (!selectedPinResult) {
      setGateState(null);
      return;
    }
    const requestId = ++gateRequestIdRef.current;
    setGateState({ status: 'checking', message: 'Verifying this address…' });

    const addressForGate = selectedPinResult.formattedAddress || selectedPinResult.displayName;
    validateAddressGate(addressForGate, selectedPinResult.city, selectedPinResult.state).then((outcome) => {
      // Ignore stale responses if the user already selected a different pin.
      if (requestId !== gateRequestIdRef.current) return;
      setGateState({ status: outcome.passed ? 'passed' : 'blocked', message: outcome.message });
    });
  }, [selectedPinResult]);

  // Debounced auto-suggestions as user types in search
  useEffect(() => {
    if (!mapSearchQuery.trim() || mapSearchQuery.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(mapSearchQuery.trim())}&addressdetails=1&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setSuggestions(data);
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

  const selectLocation = (lat: number, lon: number, name?: string, item?: any) => {
    setShowSuggestions(false);
    if (name) setMapSearchQuery(name);
    if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lon)) {
      mapInstanceRef.current.flyTo({ center: [lon, lat], zoom: 18, duration: 1200 });
      updateMarkerPosition(lat, lon);
      
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

        setSelectedPinResult({
          placeId: `map_pin_${item.place_id || Math.random().toString(36).substring(7)}`,
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
        `/api/geocode/search?q=${encodeURIComponent(mapSearchQuery.trim())}&addressdetails=1&limit=5`
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          selectLocation(lat, lon, first.display_name, first);
        } else {
          setMapSearchError('Location not found. Please try entering a city, address, or society name.');
        }
      }
    } catch (err) {
      console.error('Map search error:', err);
      setMapSearchError('Failed to search location.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Reverse geocode
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);

    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lon}`
      );
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

        setSelectedPinResult({
          placeId: `map_pin_${item.place_id || Math.random().toString(36).substring(7)}`,
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
      console.error('Map pin reverse geocoding error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Fetch nearby residential buildings
  const fetchNearbyBuildings = async (map: maplibregl.Map) => {
    if (map.getZoom() < 14) {
      buildingMarkersRef.current.forEach(m => m.remove());
      buildingMarkersRef.current = [];
      setDetectedBuildingCount(0);
      return;
    }

    setIsLoadingBuildings(true);
    const bounds = map.getBounds();
    const s = bounds.getSouth();
    const w = bounds.getWest();
    const n = bounds.getNorth();
    const e = bounds.getEast();

    // Strict Overpass query ONLY for residential buildings & societies
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:12];(` +
      `way["building"="apartments"]["name"](${s},${w},${n},${e});` +
      `way["building"="residential"]["name"](${s},${w},${n},${e});` +
      `way["building"="condominium"]["name"](${s},${w},${n},${e});` +
      `way["building"="townhouse"]["name"](${s},${w},${n},${e});` +
      `way["landuse"="residential"]["name"](${s},${w},${n},${e});` +
      `way["place"="housing_estate"]["name"](${s},${w},${n},${e});` +
      `relation["building"="apartments"]["name"](${s},${w},${n},${e});` +
      `relation["building"="residential"]["name"](${s},${w},${n},${e});` +
      `relation["place"="housing_estate"]["name"](${s},${w},${n},${e});` +
      `node["place"="housing_estate"]["name"](${s},${w},${n},${e});` +
      `);out center 35;`;

    try {
      const res = await fetch(overpassUrl);
      if (res.ok) {
        const data = await res.json();
        if (!mapInstanceRef.current || mapInstanceRef.current !== map) return;

        try {
          buildingMarkersRef.current.forEach(m => m.remove());
          buildingMarkersRef.current = [];

          let count = 0;
          const elements = data.elements || [];

          elements.forEach((el: any) => {
            const name = el.tags?.name || el.tags?.['building:name'] || el.tags?.description;
            if (!name) return;

            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;

            if (lat && lon) {
              count++;
              const labelEl = document.createElement('div');
              labelEl.className = 'bg-slate-900/90 text-emerald-400 border border-emerald-500/50 text-[10px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none';
              labelEl.innerText = name;

              const bMarker = new maplibregl.Marker({ element: labelEl, anchor: 'center' })
                .setLngLat([lon, lat])
                .addTo(map);
              buildingMarkersRef.current.push(bMarker);
            }
          });

          setDetectedBuildingCount(count);
        } catch (layerErr) {
          console.warn('Building layer addition error:', layerErr);
        }
      }
    } catch (err) {
      console.warn('Overpass building fetch error:', err);
    } finally {
      setIsLoadingBuildings(false);
    }
  };

  const updateMarkerPosition = (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;

    if (!markerInstanceRef.current) {
      const pinEl = document.createElement('div');
      pinEl.innerHTML = `
        <div class="relative flex flex-col items-center justify-end cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-full" style="width:36px; height:44px;">
          <div class="w-9 h-9 bg-blue-600 border-2 border-white text-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600 -mt-[1px]"></div>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: pinEl,
        draggable: true,
        anchor: 'bottom'
      })
        .setLngLat([lon, lat])
        .addTo(mapInstanceRef.current);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        fetchAddressFromCoords(lngLat.lat, lngLat.lng);
      });

      markerInstanceRef.current = marker;
    } else {
      markerInstanceRef.current.setLngLat([lon, lat]);
    }
  };

  // Init Map directly inline
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedPinResult?.lat || SAMPLE_PROPERTIES[0].lat;
    const initialLon = selectedPinResult?.lon || SAMPLE_PROPERTIES[0].lon;

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
        zoom: 16,
        attributionControl: { compact: true }
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    } catch (e) {
      console.warn('Map creation skipped:', e);
      return;
    }

    map.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      updateMarkerPosition(lat, lng);
      fetchAddressFromCoords(lat, lng);
    });

    map.on('moveend', () => {
      if (mapInstanceRef.current) {
        fetchNearbyBuildings(mapInstanceRef.current);
      }
    });

    mapInstanceRef.current = map;
    updateMarkerPosition(initialLat, initialLon);
    fetchAddressFromCoords(initialLat, initialLon);
    fetchNearbyBuildings(map);

    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.resize();
        } catch (e) {}
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      buildingMarkersRef.current.forEach(m => m.remove());
      buildingMarkersRef.current = [];
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
  }, []);

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

  const handleSelectSample = (prop: PropertySearchResult) => {
    if (mapInstanceRef.current && prop.lat && prop.lon) {
      mapInstanceRef.current.jumpTo({ center: [prop.lon, prop.lat], zoom: 17 });
      updateMarkerPosition(prop.lat, prop.lon);
      fetchAddressFromCoords(prop.lat, prop.lon);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 text-left">
      
      {/* Map Control Bar (Search + View Controls) */}
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
              placeholder="Search city, street address, or society name..."
              className="w-full text-xs sm:text-sm text-white placeholder:text-slate-500 bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingMap}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSearchingMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Search Map</span>}
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

      {/* Map View Container */}
      <div className="relative w-full h-[450px] sm:h-[500px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Leaflet Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />



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

        {/* Bottom Property Selection Panel */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 bg-slate-900/95 border border-slate-700/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 max-h-[50%] sm:max-h-none overflow-y-auto">
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              {isReverseGeocoding ? (
                <span className="flex items-center gap-1.5 text-blue-300">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400 shrink-0" />
                  <span>Identifying Building Address...</span>
                </span>
              ) : selectedPinResult ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Property Selected</span>
                </span>
              ) : (
                <span>Click Any Building on Map</span>
              )}
            </div>

            <div className="text-xs sm:text-base font-bold text-white truncate leading-tight sm:leading-normal">
              {selectedPinResult ? selectedPinResult.displayName : 'Click on a residential building or drag the pin on the map'}
            </div>
            
            {selectedPinResult && (
              <div className="text-[11px] sm:text-xs text-slate-400 truncate">
                {[selectedPinResult.city, selectedPinResult.state, selectedPinResult.county].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          {selectedPinResult && (
            <button
              type="button"
              disabled={gateState?.status !== 'passed'}
              onClick={() => {
                if (gateState?.status !== 'passed') return;
                onSelectProperty(selectedPinResult);
              }}
              className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 tracking-tight ${
                gateState?.status !== 'passed'
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer hover:shadow-blue-500/25'
              }`}
            >
              {gateState?.status === 'checking' ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 animate-spin" />
              ) : null}
              <span>
                {gateState?.status === 'checking'
                  ? 'Verifying Address…'
                  : gateState?.status === 'blocked'
                    ? 'Residential Selection Only'
                    : 'Analyze Property'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
