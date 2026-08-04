import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, MapPin, Search, Building2, Loader2, Navigation, AlertCircle, CheckCircle2, ArrowRight, Layers, Eye } from 'lucide-react';
import { PropertySearchResult } from '../types';

interface MapBuildingPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty: (property: PropertySearchResult) => void;
  initialQuery?: string;
  initialCoords?: { lat: number; lon: number };
}

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

export const MapBuildingPickerModal: React.FC<MapBuildingPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
  initialQuery = '',
  initialCoords = { lat: 30.2672, lon: -97.7431 } // Default Austin, TX
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerInstanceRef = useRef<maplibregl.Marker | null>(null);
  const buildingMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [mapSearchQuery, setMapSearchQuery] = useState(initialQuery);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [detectedBuildingCount, setDetectedBuildingCount] = useState(0);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [selectedPinResult, setSelectedPinResult] = useState<PropertySearchResult | null>(null);
  const [gateState, setGateState] = useState<{ status: 'checking' | 'passed' | 'blocked'; message: string; isDismissed?: boolean } | null>(null);
  const gateRequestIdRef = useRef(0);

  // Layer 4 gate: every time a pin/search result is selected, synchronously (from the user's
  // point of view) re-verify it against the real backend gate (Census geocoder + government
  // facility check + jurisdiction support) before the "Select This Property" button can be
  // enabled.
  useEffect(() => {
    if (!selectedPinResult) {
      setGateState(null);
      return;
    }
    const requestId = ++gateRequestIdRef.current;
    setGateState({ status: 'checking', message: 'Verifying this address…' });

    const addressForGate = selectedPinResult.formattedAddress || selectedPinResult.displayName;
    validateAddressGate(addressForGate, selectedPinResult.city, selectedPinResult.state).then((outcome) => {
      if (requestId !== gateRequestIdRef.current) return;
      setGateState({ status: outcome.passed ? 'passed' : 'blocked', message: outcome.message });
    });
  }, [selectedPinResult]);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);

  // Reverse geocode lat/lon into property search result
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    setMapSearchError(null);

    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lon}`
      );
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const item = await response.json();
        const addr = item.address || {};

        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || '';
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

        const propResult: PropertySearchResult = {
          placeId: `osm_${item.place_id || Date.now()}`,
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
        };

        setSelectedPinResult(propResult);
      } else {
        setMapSearchError('Could not retrieve address details for this pin location.');
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setMapSearchError('Failed to load address for selected pin location.');
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Fetch nearby residential buildings in map bounding box
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

    // Strict Overpass query ONLY targeting residential buildings, apartment complexes, condos, and housing societies
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
          console.warn('Modal building layer addition error:', layerErr);
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

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLngLat([lon, lat]);
    } else {
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
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        buildingMarkersRef.current.forEach(m => m.remove());
        buildingMarkersRef.current = [];
      }
      return;
    }

    if (!mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current || !isOpen) return;

      if (!mapInstanceRef.current) {
        try {
          const tileUrl = `${window.location.origin}/api/geocode/tiles/streets/{z}/{x}/{y}.png`;
          const map = new maplibregl.Map({
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
            center: [initialCoords.lon, initialCoords.lat],
            zoom: 16,
            attributionControl: { compact: true }
          });

          map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

          // Click event to place pin
          map.on('click', (e) => {
            const { lat, lng } = e.lngLat;
            updateMarkerPosition(lat, lng);
            fetchAddressFromCoords(lat, lng);
          });

          // Moveend listener to load residential building names in visible area
          map.on('moveend', () => {
            if (mapInstanceRef.current) {
              fetchNearbyBuildings(mapInstanceRef.current);
            }
          });

          mapInstanceRef.current = map;

          // Add initial marker & fetch buildings
          updateMarkerPosition(initialCoords.lat, initialCoords.lon);
          fetchAddressFromCoords(initialCoords.lat, initialCoords.lon);
          fetchNearbyBuildings(map);

          setTimeout(() => {
            if (mapInstanceRef.current) {
              try {
                mapInstanceRef.current.resize();
              } catch (e) {}
            }
          }, 100);
        } catch (err) {
          console.warn('Error initializing MapLibre modal map:', err);
        }
      } else {
        try {
          mapInstanceRef.current.resize();
          mapInstanceRef.current.jumpTo({ center: [initialCoords.lon, initialCoords.lat], zoom: 16 });
          updateMarkerPosition(initialCoords.lat, initialCoords.lon);
          fetchAddressFromCoords(initialCoords.lat, initialCoords.lon);
          fetchNearbyBuildings(mapInstanceRef.current);
        } catch (err) {
          console.warn('Error re-centering modal map:', err);
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        buildingMarkersRef.current.forEach(m => m.remove());
        buildingMarkersRef.current = [];
      }
    };
  }, [isOpen]);

  // Toggle map tiles (Satellite vs Street)
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
      console.warn('Error toggling modal map layers:', err);
    }
  }, [isSatelliteView]);

  // Search location on map
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setIsSearchingMap(true);
    setMapSearchError(null);

    try {
      const res = await fetch(
        `/api/geocode/search?countrycodes=us&q=${encodeURIComponent(mapSearchQuery)}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.jumpTo({ center: [lon, lat], zoom: 17 });
            updateMarkerPosition(lat, lon);
            fetchAddressFromCoords(lat, lon);
          }
        } else {
          setMapSearchError('Location not found. Try searching a city, street, or building name.');
        }
      }
    } catch (err) {
      console.error('Map search error:', err);
      setMapSearchError('Failed to search location on map.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedPinResult) {
      onSelectProperty(selectedPinResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Select Building on Map</span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full uppercase">
                  Interactive Pin
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Click anywhere on the map or drag the pin to select a building.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Close map picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Control Bar (Controls Only - No Search Bar) */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2.5 z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Pan & Zoom Street Map to Select Residential Building</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSatelliteView(!isSatelliteView)}
              className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSatelliteView
                  ? 'bg-blue-600/90 text-white border-blue-400/50 shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle between Satellite imagery and Street map view"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSatelliteView ? 'Satellite View' : 'Street Map'}</span>
            </button>
          </div>
        </div>

        {/* Map Container Area */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
          
          {/* Leaflet Map Div */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Status Badge for Residential Building Names */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
            {isLoadingBuildings ? (
              <span className="flex items-center gap-1.5 text-blue-300">
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                <span>Scanning residential names...</span>
              </span>
            ) : detectedBuildingCount > 0 ? (
              <span className="text-slate-200 font-semibold">
                <strong className="text-blue-400">{detectedBuildingCount}</strong> Building Labels Active
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Zoom in to see building labels
              </span>
            )}
          </div>

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
                className="text-amber-400 hover:text-white font-bold text-xs cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Search / Reverse Geocode Error Banner */}
          {mapSearchError && (
            <div className="absolute top-4 left-4 right-4 z-20 bg-blue-950/90 border border-blue-500/40 rounded-2xl p-3.5 text-xs text-blue-100 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{mapSearchError}</span>
              </div>
              <button
                onClick={() => setMapSearchError(null)}
                className="text-blue-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Floating Building Selection Card Overlay at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-20 max-w-xl mx-auto bg-slate-900/95 border border-slate-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white animate-fade-in">
            {isReverseGeocoding ? (
              <div className="flex items-center justify-center gap-3 py-3 text-slate-300 text-xs font-medium">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span>Identifying building address at selected pin...</span>
              </div>
            ) : selectedPinResult ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Selected Location
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedPinResult.lat.toFixed(4)}, {selectedPinResult.lon.toFixed(4)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-white mt-1.5 truncate">
                      {selectedPinResult.displayName}
                    </h3>
                  </div>
                  <div className="p-2 bg-slate-800 text-blue-400 rounded-xl shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400">Type:</span>
                    <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      {selectedPinResult.propertyType}
                    </span>
                  </div>

                  <button
                    disabled={gateState?.status !== 'passed'}
                    onClick={() => {
                      if (gateState?.status !== 'passed') return;
                      handleConfirmSelection();
                    }}
                    className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 ${
                      gateState?.status !== 'passed'
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    }`}
                  >
                    {gateState?.status === 'checking' ? (
                      <Loader2 className="w-4 h-4 text-blue-200 animate-spin" />
                    ) : null}
                    <span>
                      {gateState?.status === 'checking'
                        ? 'Verifying Address…'
                        : gateState?.status === 'blocked'
                          ? 'Residential Selection Only'
                          : 'Select This Property'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-200" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400 font-medium">
                Click anywhere on the map or drag the pin to select a building.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
