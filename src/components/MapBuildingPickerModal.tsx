import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { X, MapPin, Search, Building2, Loader2, Navigation, AlertCircle, CheckCircle2, ArrowRight, Layers, Eye } from 'lucide-react';
import { PropertySearchResult } from '../types';

interface MapBuildingPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty: (property: PropertySearchResult) => void;
  initialQuery?: string;
  initialCoords?: { lat: number; lon: number };
}

// Helper to check non-residential places (streets, lanes, gardens, open land, plots, water bodies, commercial, government, public facilities)
const checkNonResidential = (
  displayName: string,
  itemClass?: string,
  itemType?: string,
  tags?: Record<string, string>
): { isNonResidential: boolean; category: string } => {
  const lower = (displayName || '').toLowerCase();
  const cls = (itemClass || '').toLowerCase();
  const type = (itemType || '').toLowerCase();

  // 1. WATER BODIES, RIVERS, LAKES, PONDS, CANALS, SEAS, OCEANS, WETLANDS
  if (cls === 'waterway' || (cls === 'natural' && ['water', 'wetland', 'bay', 'beach', 'coastline', 'spring'].includes(type))) {
    return { isNonResidential: true, category: `Water Body / Aquatic Area (${type || 'Water'})` };
  }
  if (tags) {
    const waterTag = (tags.water || tags.waterway || tags.natural || '').toLowerCase();
    if (['water', 'river', 'lake', 'stream', 'pond', 'canal', 'reservoir', 'wetland', 'bay', 'beach', 'coastline', 'drain', 'ditch'].some(w => waterTag.includes(w))) {
      return { isNonResidential: true, category: 'Water Body / Aquatic Feature' };
    }
  }
  const waterPatterns = /\b(lake|pond|river|stream|creek|canal|reservoir|bay|ocean|sea|beach|waterfall|wetland|marsh|swamp|drainage canal|water basin|dock|harbor|water body)\b/i;
  if (waterPatterns.test(lower) && !/\b(residence|society|apartments|condo|villas|heights|tower|enclave|house|building|park view|lake view|river view|ocean view|bay view)\b/i.test(lower)) {
    if (cls === 'waterway' || cls === 'natural' || ['water', 'river', 'lake', 'pond', 'stream', 'bay'].includes(type)) {
      return { isNonResidential: true, category: 'Water Body / Water Feature' };
    }
  }

  // 2. STREETS, LANES, HIGHWAYS, ROADS, FOOTPATHS, TRANSIT CORRIDORS
  if (cls === 'highway' || ['primary', 'secondary', 'tertiary', 'residential', 'service', 'footway', 'pedestrian', 'path', 'track', 'cycleway', 'living_street', 'unclassified', 'motorway', 'trunk', 'road', 'lane', 'street'].includes(type)) {
    const hasHouseNumber = tags && (tags.house_number || tags['addr:housenumber']);
    const hasBuildingTag = tags && tags.building && !['no', 'unclassified', 'street'].includes((tags.building || '').toLowerCase());
    const isResidentialComplexName = /\b(society|apartments|condo|villas|heights|tower|enclave|complex|residence|house|home|building|manor|estates)\b/i.test(lower);

    if (!hasHouseNumber && !hasBuildingTag && !isResidentialComplexName) {
      return { isNonResidential: true, category: 'Street / Lane / Roadway' };
    }
  }

  // 3. GARDENS, PARKS, PLAYGROUNDS, GOLF COURSES, RECREATION GROUNDS, CEMETERIES
  if (cls === 'leisure' || ['park', 'garden', 'pitch', 'playground', 'golf_course', 'nature_reserve', 'dog_park', 'recreation_ground', 'stadium', 'village_green', 'cemetery'].includes(type)) {
    return { isNonResidential: true, category: `Garden / Public Park / Recreation (${type || 'Park'})` };
  }
  if (tags) {
    const leisureTag = (tags.leisure || '').toLowerCase();
    const landuseTag = (tags.landuse || '').toLowerCase();
    if (leisureTag || ['park', 'recreation_ground', 'garden', 'allotments', 'grass', 'meadow', 'village_green', 'cemetery'].includes(landuseTag)) {
      return { isNonResidential: true, category: `Garden / Public Park / Open Land (${leisureTag || landuseTag})` };
    }
  }
  const parkPatterns = /\b(public park|botanical garden|city park|community garden|playground|golf course|recreation ground|graveyard|cemetery|memorial park)\b/i;
  if (parkPatterns.test(lower) && !/\b(apartments|condo|society|villas|heights|tower|residence|enclave|estates|homes)\b/i.test(lower)) {
    return { isNonResidential: true, category: 'Public Park / Garden / Open Space' };
  }

  // 4. OPEN LAND, VACANT PLOTS, FARMLAND, FORESTS, FIELDS, CONSTRUCTION SITES
  if (tags) {
    const landuseTag = (tags.landuse || '').toLowerCase();
    if (['farmland', 'farmyard', 'forest', 'meadow', 'grass', 'allotments', 'greenfield', 'brownfield', 'construction', 'landfill', 'quarry', 'basin', 'commercial', 'industrial', 'retail', 'institutional', 'civic', 'government'].includes(landuseTag)) {
      return { isNonResidential: true, category: `Open Land / Plot / Non-Residential Area (${landuseTag})` };
    }
  }
  if (['farmland', 'farmyard', 'forest', 'meadow', 'grass', 'allotments', 'greenfield', 'brownfield', 'construction', 'plot', 'vacant'].includes(type)) {
    return { isNonResidential: true, category: `Open Land / Vacant Plot (${type})` };
  }
  const openPlotPatterns = /\b(open land|vacant plot|empty plot|open plot|farmland|farmyard|greenfield|brownfield|construction site|land plot|vacant lot)\b/i;
  if (openPlotPatterns.test(lower) && !/\b(residence|society|apartments|condo|villas|house|building)\b/i.test(lower)) {
    return { isNonResidential: true, category: 'Open Land / Vacant Plot' };
  }

  // 5. PUBLIC FACILITIES, GOVERNMENT, INSTITUTIONAL, COMMERCIAL, RELIGIOUS
  const publicFacilityPatterns = [
    { regex: /\b(assessor|county assessor|tax assessor|tax collector|clerk|county clerk|recorder of deeds|register of deeds)\b/i, cat: 'County / Tax Office' },
    { regex: /\b(police station|law enforcement|sheriff|sheriff's office|precinct)\b/i, cat: 'Police / Law Enforcement' },
    { regex: /\b(fire station|fire department|firehouse)\b/i, cat: 'Fire Station' },
    { regex: /\b(city hall|town hall|courthouse|county court|civic center|municipal building|government center)\b/i, cat: 'Government / Civic' },
    { regex: /\b(post office|usps|postal service)\b/i, cat: 'Postal Service' },
    { regex: /\b(jail|prison|detention center|correctional facility)\b/i, cat: 'Correctional Facility' },
    { regex: /\b(elementary school|middle school|high school|public school|charter school|academy|university|college)\b/i, cat: 'School / Educational' },
    { regex: /\b(hospital|medical center|urgent care|clinic|health center)\b/i, cat: 'Hospital / Healthcare' },
    { regex: /\b(department of|bureau of|agency|administration|office building|corporate|headquarters|office park)\b/i, cat: 'Government / Commercial Office' },
    { regex: /\b(bank|credit union|atm|supermarket|grocery|mall|shopping center|plaza|retail|store|restaurant|cafe|hotel|motel|resort)\b/i, cat: 'Commercial / Retail' },
    { regex: /\b(church|synagogue|mosque|temple|cathedral|chapel|shrine)\b/i, cat: 'Place of Worship' },
    { regex: /\b(stadium|arena|gym|fitness center)\b/i, cat: 'Recreational Facility' }
  ];

  for (const p of publicFacilityPatterns) {
    if (p.regex.test(lower)) {
      return { isNonResidential: true, category: p.cat };
    }
  }

  // 6. FORBIDDEN OSM BUILDING TYPES AND AMENITY/SHOP/OFFICE TAGS
  const forbiddenBuildingTypes = [
    'commercial', 'office', 'retail', 'industrial', 'warehouse', 'supermarket',
    'school', 'university', 'college', 'kindergarten', 'hospital', 'clinic',
    'public', 'civic', 'government', 'courthouse', 'townhall', 'fire_station', 'police',
    'church', 'synagogue', 'mosque', 'temple', 'cathedral', 'chapel', 'shrine',
    'hotel', 'motel', 'guest_house', 'hostel',
    'stadium', 'sports_centre', 'grandstand', 'pavilion', 'hangar', 'garage', 'garages',
    'transportation', 'train_station', 'bus_station', 'terminal', 'kiosk', 'service'
  ];

  if (tags) {
    const buildingTag = (tags.building || '').toLowerCase();
    const amenityTag = (tags.amenity || '').toLowerCase();
    const shopTag = (tags.shop || '').toLowerCase();
    const officeTag = (tags.office || '').toLowerCase();
    const leisureTag = (tags.leisure || '').toLowerCase();
    const tourismTag = (tags.tourism || '').toLowerCase();
    const healthcareTag = (tags.healthcare || '').toLowerCase();
    const governmentTag = (tags.government || '').toLowerCase();

    if (governmentTag) return { isNonResidential: true, category: `Government Office (${governmentTag})` };
    if (forbiddenBuildingTypes.includes(buildingTag)) {
      return { isNonResidential: true, category: `Commercial/Public Building (${buildingTag})` };
    }
    if (amenityTag || shopTag || officeTag || leisureTag || tourismTag || healthcareTag) {
      return { isNonResidential: true, category: amenityTag || shopTag || officeTag || 'Commercial/Public Facility' };
    }
  }

  const forbiddenClasses = ['amenity', 'shop', 'office', 'leisure', 'tourism', 'commercial', 'industrial', 'healthcare', 'historic', 'military', 'aeroway', 'railway', 'government', 'civic'];
  if (cls && forbiddenClasses.includes(cls)) {
    return { isNonResidential: true, category: cls };
  }
  if (type && forbiddenBuildingTypes.includes(type)) {
    return { isNonResidential: true, category: type };
  }

  return { isNonResidential: false, category: '' };
};

export const MapBuildingPickerModal: React.FC<MapBuildingPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
  initialQuery = '',
  initialCoords = { lat: 30.2672, lon: -97.7431 } // Default Austin, TX
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const buildingLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const streetTileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteTileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLabelsLayerRef = useRef<L.TileLayer | null>(null);

  const [mapSearchQuery, setMapSearchQuery] = useState(initialQuery);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [detectedBuildingCount, setDetectedBuildingCount] = useState(0);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [selectedPinResult, setSelectedPinResult] = useState<PropertySearchResult | null>(null);
  const [nonResNotice, setNonResNotice] = useState<{ isFacility: boolean; name: string; category: string } | null>(null);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);

  // Custom SVG marker pin for Leaflet
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex flex-col items-center justify-end" style="width:36px; height:44px; cursor:grab;">
          <div class="w-9 h-9 bg-blue-600 border-2 border-white text-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600 -mt-[1px]"></div>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });
  };

  // Reverse geocode lat/lon into property search result
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    setNonResNotice(null);
    setMapSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`
      );
      if (response.ok) {
        const item = await response.json();
        const addr = item.address || {};
        
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || '';
        const state = addr.state_code ? addr.state_code.toUpperCase() : (addr.state || '');
        const zip = addr.postcode || '';
        const county = addr.county || '';
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || '';
        const street = [houseNumber, road].filter(Boolean).join(' ');

        const nonResCheck = checkNonResidential(item.display_name, item.class, item.type, item.extratags);
        if (nonResCheck.isNonResidential) {
          setNonResNotice({
            isFacility: true,
            name: item.display_name,
            category: nonResCheck.category
          });
        }

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
  const fetchNearbyBuildings = async (map: L.Map) => {
    if (map.getZoom() < 14) {
      if (buildingLayerGroupRef.current) buildingLayerGroupRef.current.clearLayers();
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
          if (!buildingLayerGroupRef.current) {
            buildingLayerGroupRef.current = L.layerGroup().addTo(map);
          } else {
            buildingLayerGroupRef.current.clearLayers();
          }

          let count = 0;
          const elements = data.elements || [];

          elements.forEach((el: any) => {
            const name = el.tags?.name || el.tags?.['building:name'] || el.tags?.description;
            if (!name) return;

            // Skip non-residential places strictly
            const nonRes = checkNonResidential(
              name,
              el.tags?.amenity || el.tags?.shop || el.tags?.office,
              el.tags?.building,
              el.tags
            );
            if (nonRes.isNonResidential) return;

            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;

            if (lat && lon) {
              count++;
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

  // Initialize Map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        buildingLayerGroupRef.current = null;
        streetTileLayerRef.current = null;
        satelliteTileLayerRef.current = null;
        satelliteLabelsLayerRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current || !isOpen) return;

      if (!mapInstanceRef.current) {
        try {
          const map = L.map(mapContainerRef.current, {
            center: [initialCoords.lat, initialCoords.lon],
            zoom: 16,
            zoomControl: false
          });

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          // Tile layers
          streetTileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
          });

          satelliteTileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
          });

          satelliteLabelsLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19
          });

          // Default layer addition based on state
          if (isSatelliteView) {
            satelliteTileLayerRef.current.addTo(map);
            satelliteLabelsLayerRef.current.addTo(map);
          } else {
            streetTileLayerRef.current.addTo(map);
          }

          // Click event to place pin
          map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            updateMarkerPosition(lat, lng);
            fetchAddressFromCoords(lat, lng);
          });

          // Moveend listener to load residential building names in visible area
          map.on('moveend', () => {
            fetchNearbyBuildings(map);
          });

          mapInstanceRef.current = map;

          // Add initial marker & fetch buildings
          updateMarkerPosition(initialCoords.lat, initialCoords.lon);
          fetchAddressFromCoords(initialCoords.lat, initialCoords.lon);
          fetchNearbyBuildings(map);

          setTimeout(() => {
            if (mapInstanceRef.current) {
              try {
                mapInstanceRef.current.invalidateSize();
              } catch (e) {}
            }
          }, 100);
        } catch (err) {
          console.warn('Error initializing Leaflet modal map:', err);
        }
      } else {
        try {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setView([initialCoords.lat, initialCoords.lon], 16);
          updateMarkerPosition(initialCoords.lat, initialCoords.lon);
          fetchAddressFromCoords(initialCoords.lat, initialCoords.lon);
          fetchNearbyBuildings(mapInstanceRef.current);
        } catch (err) {
          console.warn('Error re-centering Leaflet map:', err);
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
        buildingLayerGroupRef.current = null;
        streetTileLayerRef.current = null;
        satelliteTileLayerRef.current = null;
        satelliteLabelsLayerRef.current = null;
      }
    };
  }, [isOpen]);

  // Toggle map tiles (Satellite vs Street)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (isSatelliteView) {
      if (streetTileLayerRef.current) map.removeLayer(streetTileLayerRef.current);
      if (satelliteTileLayerRef.current) satelliteTileLayerRef.current.addTo(map);
      if (satelliteLabelsLayerRef.current) satelliteLabelsLayerRef.current.addTo(map);
    } else {
      if (satelliteTileLayerRef.current) map.removeLayer(satelliteTileLayerRef.current);
      if (satelliteLabelsLayerRef.current) map.removeLayer(satelliteLabelsLayerRef.current);
      if (streetTileLayerRef.current) streetTileLayerRef.current.addTo(map);
    }
  }, [isSatelliteView]);

  const updateMarkerPosition = (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lon]);
      markerInstanceRef.current.setZIndexOffset(1000);
    } else {
      const marker = L.marker([lat, lon], {
        icon: createPinIcon(),
        draggable: true
      }).addTo(mapInstanceRef.current);

      marker.setZIndexOffset(1000);

      marker.on('dragend', (e) => {
        const target = e.target;
        const position = target.getLatLng();
        fetchAddressFromCoords(position.lat, position.lng);
      });

      markerInstanceRef.current = marker;
    }
  };

  // Search location on map
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setIsSearchingMap(true);
    setMapSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(mapSearchQuery)}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 17);
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

          {/* Non-Residential Warning Banner Overlay */}
          {nonResNotice && (
            <div className="absolute top-4 left-4 right-4 z-20 bg-amber-950/90 border border-amber-500/40 rounded-2xl p-3.5 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-md animate-fade-in flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="font-bold text-amber-300 text-sm">
                  This Place is Non-Residential
                </div>
              </div>
              <button
                onClick={() => setNonResNotice(null)}
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
                    disabled={!!nonResNotice?.isFacility}
                    onClick={() => {
                      if (nonResNotice?.isFacility) return;
                      handleConfirmSelection();
                    }}
                    className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 ${
                      nonResNotice?.isFacility
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    }`}
                  >
                    <span>{nonResNotice?.isFacility ? 'Residential Selection Only' : 'Select This Property'}</span>
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
