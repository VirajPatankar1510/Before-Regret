import React, { useState, useRef, useEffect } from 'react';
import { TOPICS_OF_EXPERTISE, MOCK_AVATARS } from '../data';
import { ExpertProfile, Neighborhood } from '../types';
import { Sparkles, Check, ChevronRight, HelpCircle, Heart, ShieldCheck, RefreshCw, MapPin } from 'lucide-react';

interface OnboardingProps {
  localities: Neighborhood[];
  onAddExpert: (expert: ExpertProfile, newLocality?: Neighborhood) => void;
  setView: (view: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  localities,
  onAddExpert,
  setView,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [landmarks, setLandmarks] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPincodeSearching, setIsPincodeSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleaned = pincode.trim();
    if (cleaned.length === 6 && /^\d+$/.test(cleaned)) {
      // 1. Check local static database of prefix fallback first for instant resolution
      const PINCODE_FALLBACKS: Record<string, string> = {
        '400063': 'Goregaon East',
        '400001': 'Colaba',
        '560102': 'HSR Layout',
        '560001': 'Kanteerava',
        '560048': 'Whitefield',
        '560066': 'Whitefield',
        '110001': 'Connaught Place',
        '122001': 'Gurugram Sector 14',
        '122002': 'DLF Phase 1',
        '122009': 'DLF Phase 5',
        '122011': 'DLF Phase 5',
        '122018': 'Gurugram Sector 32',
        '400607': 'Kolshet Road, Thane',
        '400601': 'Thane West',
        '401203': 'Nallasopara West',
      };

      if (PINCODE_FALLBACKS[cleaned]) {
        setCity(PINCODE_FALLBACKS[cleaned]);
        return;
      }

      const getAreaFromPrefix = (pin: string): string => {
        if (pin.startsWith('11')) return 'Connaught Place, Delhi';
        if (pin.startsWith('122')) return 'DLF Phase, Gurugram';
        if (pin.startsWith('121')) return 'Faridabad Area';
        if (pin.startsWith('201')) return 'Noida Sector';
        if (pin.startsWith('560102')) return 'HSR Layout, Bengaluru';
        if (pin.startsWith('56')) return 'Whitefield / Bengaluru';
        if (pin.startsWith('400063')) return 'Goregaon East';
        if (pin.startsWith('400') || pin.startsWith('401')) return 'Mumbai / Thane';
        if (pin.startsWith('411')) return 'Pune Area';
        if (pin.startsWith('500')) return 'Hyderabad Area';
        if (pin.startsWith('600')) return 'Chennai Area';
        if (pin.startsWith('700')) return 'Kolkata Area';
        return '';
      };

      const prefixArea = getAreaFromPrefix(cleaned);
      if (prefixArea) {
        setCity(prefixArea);
      }

      // 2. Fetch from India Post API asynchronously for exact precision
      setIsPincodeSearching(true);
      fetch(`https://api.postalpincode.in/pincode/${cleaned}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffices = data[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              const officeName = postOffices[0].Name;
              const district = postOffices[0].District;
              if (officeName) {
                // If the office name is Nallasopara, we might format it or display as Nallasopara
                // Let's check if the name already contains West/East, or present it nicely
                setCity(officeName);
              } else if (district) {
                setCity(district);
              }
            }
          }
        })
        .catch(err => {
          console.error('Error auto-detecting area:', err);
        })
        .finally(() => {
          setIsPincodeSearching(false);
        });
    }
  }, [pincode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter static local list based on user search query
  const combinedLocalities = React.useMemo(() => {
    const query = neighborhood.toLowerCase().trim();
    if (!query) return [];

    const localMatches = localities.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.pincode.includes(query) ||
        (loc.society && loc.society.toLowerCase().includes(query)) ||
        (loc.apartmentName && loc.apartmentName.toLowerCase().includes(query))
      );
    });

    const list = [...localMatches];

    // If the user has typed a custom neighborhood/society, always ensure they can select it
    // with their entered city and pincode, as a custom layout fallback
    if (query.length >= 2) {
      const exactMatchExists = list.some(
        (loc) => loc.name.toLowerCase() === query
      );
      if (!exactMatchExists) {
        list.push({
          id: `custom_onboarding_${Date.now()}`,
          name: neighborhood.trim(),
          city: city.trim() || 'Your City',
          state: 'India',
          pincode: pincode.trim() || '',
          society: neighborhood.trim(),
          apartmentName: `${neighborhood.trim()}, ${city.trim() || 'Residential Area'}`,
          builder: 'Independent / Custom Layout',
          expertCount: 0,
          averageRating: 5.0,
          landmarks: landmarks.trim(),
          detailedAddress: detailedAddress.trim()
        });
      }
    }

    return list;
  }, [localities, neighborhood, city, pincode, landmarks, detailedAddress]);
  const [yearsLiving, setYearsLiving] = useState('5');
  const [languages, setLanguages] = useState<string[]>(['English', 'Hindi']);
  const [selectedAvatar, setSelectedAvatar] = useState(MOCK_AVATARS[0]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Schools', 'Safety']);
  const [availability, setAvailability] = useState('Weekends & Evenings');
  const [submitted, setSubmitted] = useState(false);

  const availableLanguages = [
    'English',
    'Hindi',
    'Marathi',
    'Gujarati',
    'Kannada',
    'Bengali',
    'Tamil',
    'Telugu',
    'Punjabi',
    'Malayalam',
    'Odia',
    'Assamese',
    'Urdu'
  ];

  const handleLanguageToggle = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleTopicToggle = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !neighborhood.trim() || !bio.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const localityId = `loc_${neighborhood.toLowerCase().replace(/\s+/g, '_')}`;

    const newExpert: ExpertProfile = {
      id: `exp_${Date.now()}`,
      userId: `user_expert_${Date.now()}`,
      fullName,
      bio,
      localityId,
      localityName: `${neighborhood}`,
      city,
      avatarUrl: selectedAvatar,
      memberSince: `Jul 2026`,
      questionsAnsweredCount: 0,
      responseRate: 100,
      responseTime: 'Replies within 2 hours',
      rating: 5.0,
      pricingPerQuery: 99,
      active: true,
      expertiseTags: selectedTopics,
      areasCovered: [neighborhood],
      yearsLivingThere: parseInt(yearsLiving),
      repeatBuyersCount: 0,
      experienceLevel: 'New Local',
      trustScore: 90,
      languages,
      availability
    };

    const newLocality: Neighborhood = {
      id: localityId,
      name: neighborhood.trim(),
      city: city.trim() || 'Your City',
      state: 'India',
      pincode: pincode.trim(),
      society: neighborhood.trim(),
      apartmentName: `${neighborhood.trim()}, ${city.trim() || 'Residential Area'}`,
      builder: 'Independent / Custom Layout',
      expertCount: 1,
      averageRating: 5.0,
      landmarks: landmarks.trim(),
      detailedAddress: detailedAddress.trim()
    };

    onAddExpert(newExpert, newLocality);
    setSubmitted(true);
    setTimeout(() => {
      setView('home');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Banner introduction */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
          Earn by Sharing Honest Facts About Your Society
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed">
          People moving into your apartment building or neighborhood want accurate facts before buying or renting. Answer their basic queries and receive payouts held in secure payments.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto text-xl animate-bounce">
            ✓
          </div>
          <h2 className="font-black text-slate-900 text-lg">Onboarding Form Submitted Successfully!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Congratulations! You are now listed as a local expert in {neighborhood}. We are redirecting you to the home catalog...
          </p>
          <div className="flex justify-center pt-2">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-3xs">
          
          {/* Section 1: Persona details */}
          <div>
            <h3 className="font-display font-black text-slate-900 text-base border-b border-slate-100 pb-3 mb-5">
              1. Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">First Name (required)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shalini"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px]"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Last Name (required)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roy"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px]"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Pincode / Postal Code (required)</span>
                  {isPincodeSearching && <span className="text-[9px] text-blue-600 animate-pulse font-mono lowercase">Searching...</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 560102"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Area of Residence (Auto-detected)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  placeholder="Enter pincode to auto-detect area"
                  value={city || (isPincodeSearching ? 'Detecting...' : '')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-bold outline-hidden cursor-not-allowed"
                />
              </div>

              <div className="relative" ref={suggestionsRef}>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Society or Layout Name (required)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bimbisar Nagar or Prestige Shantiniketan"
                    value={neighborhood}
                    onChange={(e) => {
                      setNeighborhood(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px]"
                  />
                </div>
                {showSuggestions && combinedLocalities.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                    {combinedLocalities.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => {
                          setNeighborhood(loc.name);
                          setCity(loc.city);
                          setPincode(loc.pincode);
                          setLandmarks(loc.landmarks || '');
                          setDetailedAddress(loc.detailedAddress || '');
                          setShowSuggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-left border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">
                            {loc.name} {loc.society && loc.society !== loc.name ? `(${loc.society})` : ''}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {loc.apartmentName || 'Residential Area'}, {loc.city}, {loc.state} - {loc.pincode}
                          </p>
                        </div>
                        {loc.expertCount > 0 ? (
                          <span className="shrink-0 text-[8px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                            {loc.expertCount} Experts
                          </span>
                        ) : (
                          <span className="shrink-0 text-[8px] font-mono font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center gap-0.5">
                            <MapPin className="w-2 h-2 text-blue-500" />
                            <span>Select Layout</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Building Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bimbisar Tower A, Iris Court, etc. (Strictly NO wing names, flat/house numbers, or floor details)"
                  value={detailedAddress}
                  onChange={(e) => setDetailedAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px]"
                />
                <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ For privacy & safety reasons, do not write house, flat, unit, wing, or floor numbers. Only include the general building name.</p>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Key Landmark & Navigation Guide (required)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Behind Hub Mall, near Gate No. 2, opposite Axis Bank ATM"
                  value={landmarks}
                  onChange={(e) => setLandmarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Choose Avatar */}
          <div>
            <h3 className="font-display font-black text-slate-900 text-base border-b border-slate-100 pb-3 mb-4">
              2. Choose Your Illustrated Avatar preset
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Before Regret does not display raw photos of residents to guarantee complete safety and anonymity from local brokers or builders.
            </p>
            
            <div className="flex flex-wrap gap-3">
              {MOCK_AVATARS.map((avatar) => (
                <div
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-1.5 rounded-full border-2 cursor-pointer transition-all ${
                    selectedAvatar === avatar ? 'border-blue-600 bg-blue-50/50 scale-105' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <img
                    src={avatar}
                    alt="avatar option"
                    className="w-12 h-12 bg-white rounded-full p-0.5 border"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Verification stats */}
          <div>
            <h3 className="font-display font-black text-slate-900 text-base border-b border-slate-100 pb-3 mb-5">
              3. Verification & Core Knowledge
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-medium mb-6">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Years Living in this society</label>
                <select
                  required
                  value={yearsLiving}
                  onChange={(e) => setYearsLiving(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="0">Less than 1 year</option>
                  {Array.from({ length: 49 }, (_, i) => {
                    const val = i + 1;
                    return (
                      <option key={val} value={String(val)}>
                        {val} {val === 1 ? 'year' : 'years'}
                      </option>
                    );
                  })}
                  <option value="50">50+ years</option>
                </select>
              </div>
            </div>

            {/* Languages Multi-select */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Languages Spoken (select all that apply):</label>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => {
                  const active = languages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                        active 
                          ? 'bg-blue-600 border-blue-600 text-white font-bold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Knowledge Topics Multi-select */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 font-sans">Select Topics You Know Best:</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS_OF_EXPERTISE.map((topic) => {
                  const active = selectedTopics.includes(topic);
                  return (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => handleTopicToggle(topic)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
                        active 
                          ? 'bg-emerald-600 border-emerald-600 text-white font-bold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Bio / Intro */}
          <div>
            <h3 className="font-display font-black text-slate-900 text-base border-b border-slate-100 pb-3 mb-5">
              4. Short Introduction Bio
            </h3>
            
            <div className="space-y-2">
              <textarea
                rows={4}
                required
                placeholder="Explain what details you can share for prospective buyers (e.g. water tanker bills frequency, local maid rates, parking space guidelines, basement dampness, late-night safety, etc.). Provide specific honest insights."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 text-xs sm:text-sm border border-slate-200 focus:border-blue-600 rounded-xl outline-hidden leading-relaxed text-slate-800 placeholder:text-[10px] sm:placeholder:text-xs"
              />
              <span className="block text-[10px] text-slate-400 font-medium">Please compile a brief description of at least 30 characters.</span>
            </div>
          </div>

          {/* Verification terms */}
          <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-3.5 border border-slate-200/60 text-xs">
            <input type="checkbox" required defaultChecked className="mt-1 h-4 w-4 text-blue-600 border-slate-200 rounded-md shrink-0 cursor-pointer" />
            <div className="text-slate-500">
              <h4 className="font-bold text-slate-800">I certify that I am an actual resident of this society</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Before Regret is built on absolute trust. Providing fake profiles or malicious details will result in permanent ban and withholding of payouts.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs hover:shadow-md"
          >
            <span>Register & List My Profile</span>
            <ChevronRight className="w-4 h-4" />
          </button>

        </form>
      )}

    </div>
  );
};
