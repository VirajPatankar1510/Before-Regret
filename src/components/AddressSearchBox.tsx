import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, Loader2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { PropertySearchResult } from '../types';

interface AddressSearchBoxProps {
  onSelectProperty: (property: PropertySearchResult) => void;
}

const SAMPLE_PROPERTIES: PropertySearchResult[] = [
  {
    placeId: 'sample_austin',
    formattedAddress: '1204 Oakridge Dr, Austin, TX 78701',
    streetNumber: '1204',
    streetName: 'Oakridge Dr',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    county: 'Travis County',
    country: 'United States',
    lat: 30.2672,
    lon: -97.7431,
    propertyType: 'Single Family Home',
    displayName: '1204 Oakridge Dr, Austin, TX 78701'
  },
  {
    placeId: 'sample_sf',
    formattedAddress: '450 Sutter St, San Francisco, CA 94108',
    streetNumber: '450',
    streetName: 'Sutter St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94108',
    county: 'San Francisco County',
    country: 'United States',
    lat: 37.7897,
    lon: -122.4080,
    propertyType: 'Condo / Townhouse',
    displayName: '450 Sutter St, San Francisco, CA 94108'
  },
  {
    placeId: 'sample_miami',
    formattedAddress: '1100 Ocean Dr, Miami Beach, FL 33139',
    streetNumber: '1100',
    streetName: 'Ocean Dr',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    county: 'Miami-Dade County',
    country: 'United States',
    lat: 25.7820,
    lon: -80.1303,
    propertyType: 'Condo / Townhouse',
    displayName: '1100 Ocean Dr, Miami Beach, FL 33139'
  },
  {
    placeId: 'sample_springfield',
    formattedAddress: '742 Evergreen Terrace, Springfield, OR 97477',
    streetNumber: '742',
    streetName: 'Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    zipCode: '97477',
    county: 'Lane County',
    country: 'United States',
    lat: 44.0462,
    lon: -123.0220,
    propertyType: 'Single Family Home',
    displayName: '742 Evergreen Terrace, Springfield, OR 97477'
  }
];

export const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({ onSelectProperty }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PropertySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search with OpenStreetMap Nominatim
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&q=${encodeURIComponent(query)}&limit=6`
        );
        if (response.ok) {
          const data = await response.json();
          const mappedResults: PropertySearchResult[] = data.map((item: any, idx: number) => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || 'Austin';
            const state = addr.state_code ? addr.state_code.toUpperCase() : (addr.state || 'TX');
            const zip = addr.postcode || '78701';
            const county = addr.county || '';
            const street = [addr.house_number, addr.road].filter(Boolean).join(' ');

            let pType: PropertySearchResult['propertyType'] = 'Single Family Home';
            if (item.type === 'condominium' || item.type === 'apartments' || query.toLowerCase().includes('condo') || query.toLowerCase().includes('apt')) {
              pType = 'Condo / Townhouse';
            } else if (item.type === 'building' || item.type === 'commercial') {
              pType = 'Apartment Complex';
            }

            return {
              placeId: `osm_${item.place_id || idx}`,
              formattedAddress: item.display_name,
              streetNumber: addr.house_number,
              streetName: addr.road,
              city,
              state,
              zipCode: zip,
              county,
              country: 'United States',
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              propertyType: pType,
              displayName: street ? `${street}, ${city}, ${state} ${zip}` : item.display_name
            };
          });

          setSuggestions(mappedResults);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Nominatim address search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [publicFacilityNotice, setPublicFacilityNotice] = useState<{ isFacility: boolean; name: string; category: string } | null>(null);

  // Helper function to check if query or result is a public/government facility
  const checkPublicFacility = (displayName: string, itemType?: string): { isFacility: boolean; category: string } => {
    const lower = displayName.toLowerCase();
    const facilityKeywords = [
      { key: 'school', cat: 'Educational Institution / School' },
      { key: 'high school', cat: 'Educational Institution / School' },
      { key: 'elementary', cat: 'Educational Institution / School' },
      { key: 'university', cat: 'University / College' },
      { key: 'college', cat: 'University / College' },
      { key: 'park', cat: 'Public Park / Recreation Facility' },
      { key: 'courthouse', cat: 'Government / Judicial Facility' },
      { key: 'court', cat: 'Government / Judicial Facility' },
      { key: 'city hall', cat: 'Municipal / Government Facility' },
      { key: 'post office', cat: 'U.S. Postal Service Facility' },
      { key: 'hospital', cat: 'Medical / Healthcare Facility' },
      { key: 'military', cat: 'Military / Defense Facility' },
      { key: 'base', cat: 'Military / Defense Facility' },
      { key: 'museum', cat: 'Public Cultural / Museum' },
      { key: 'police', cat: 'Public Safety / Law Enforcement' },
      { key: 'fire station', cat: 'Public Safety / Fire Station' },
      { key: 'library', cat: 'Public Library' }
    ];

    for (const f of facilityKeywords) {
      if (lower.includes(f.key)) {
        return { isFacility: true, category: f.cat };
      }
    }
    return { isFacility: false, category: '' };
  };

  const handleSelect = (prop: PropertySearchResult) => {
    const facilityCheck = checkPublicFacility(prop.displayName || prop.formattedAddress);
    if (facilityCheck.isFacility) {
      setPublicFacilityNotice({
        isFacility: true,
        name: prop.displayName || prop.formattedAddress,
        category: facilityCheck.category
      });
      setIsOpen(false);
      return;
    }

    setPublicFacilityNotice(null);
    setQuery(prop.displayName || prop.formattedAddress);
    setIsOpen(false);
    onSelectProperty(prop);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } else {
      // Create fallback property result from entered string
      const parts = query.split(',').map(s => s.trim());
      const customProp: PropertySearchResult = {
        placeId: `custom_${Date.now()}`,
        formattedAddress: query,
        city: parts[1] || 'Austin',
        state: parts[2]?.slice(0, 2) || 'TX',
        zipCode: '78701',
        county: 'Travis County',
        country: 'United States',
        lat: 30.2672,
        lon: -97.7431,
        propertyType: query.toLowerCase().includes('condo') ? 'Condo / Townhouse' : 'Single Family Home',
        displayName: query
      };
      handleSelect(customProp);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4" ref={dropdownRef}>
      
      {/* Public / Government Facility Notification Banner */}
      {publicFacilityNotice && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-lg space-y-3 relative text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Public or Government Facility Detected</span>
            </div>
            <button
              onClick={() => setPublicFacilityNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="text-xs text-amber-950 font-medium space-y-1.5 leading-relaxed">
            <p>
              <strong className="font-bold">{publicFacilityNotice.name}</strong> is classified as a <strong className="font-bold">{publicFacilityNotice.category}</strong>.
            </p>
            <p className="text-amber-900">
              BeforeRegret is specifically designed for residential property buyers (single-family homes, condos, townhouses, and residential land). Residential public record research and home buyer insights do not apply to public or government facilities.
            </p>
          </div>
          <div className="pt-1 text-xs text-slate-700 font-bold">
            Please enter a residential home address, condo building, or off-market property.
          </div>
        </div>
      )}

      {/* Main Search Input Form */}
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative flex items-center bg-white border-2 border-slate-300 hover:border-slate-400 focus-within:border-blue-600 rounded-2xl shadow-xl transition-all p-2">
          
          <div className="pl-3 pr-2 text-slate-400 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-slate-500" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Enter US address, condo building, or community..."
            className="w-full py-3.5 px-2 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 font-sans font-medium focus:outline-none bg-transparent"
          />

          <button
            type="submit"
            className="px-6 py-3.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Research Property</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete Dropdown List */}
        {isOpen && (suggestions.length > 0 || isLoading) && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {suggestions.map((prop) => (
              <button
                key={prop.placeId}
                type="button"
                onClick={() => handleSelect(prop)}
                className="w-full text-left p-4 hover:bg-blue-50/70 transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {prop.displayName}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{prop.propertyType}</span>
                    <span>•</span>
                    <span>{prop.county ? `${prop.county}, ` : ''}{prop.state}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Select →
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Sample Searches */}
      <div className="pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Try a Sample US Address:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROPERTIES.map((prop) => (
            <button
              key={prop.placeId}
              type="button"
              onClick={() => handleSelect(prop)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-full text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{prop.displayName}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
