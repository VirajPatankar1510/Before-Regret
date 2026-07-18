import React, { useState, useRef, useEffect } from 'react';
import { TOPICS_OF_EXPERTISE, MOCK_AVATARS } from '../data';
import { ExpertProfile, Neighborhood, DayAvailability } from '../types';
import { Sparkles, Check, ChevronRight, HelpCircle, Heart, ShieldCheck, RefreshCw, MapPin, Bell, Play, Volume2, ArrowRight, ChevronUp, ChevronDown, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { isPushSupported, requestAndSavePushToken, triggerTestPushNotification } from '../lib/notificationService';
import { useAuth } from '../context/AuthContext';
import { generateAvailableSlotsFromWeekly } from '../utils/slotHelper';

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
  const { user, loginWithMockUser, isClerkActive, triggerClerkSignIn } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [calcTextCount, setCalcTextCount] = useState(5);
  const [calcChatCount, setCalcChatCount] = useState(2);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [landmarks, setLandmarks] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [listingHeadline, setListingHeadline] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPincodeSearching, setIsPincodeSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [upiId, setUpiId] = useState('');
  const [pushStatus, setPushStatus] = useState<'idle' | 'enabling' | 'enabled' | 'denied'>('idle');
  const [leadTested, setLeadTested] = useState(false);
  const [createdExpert, setCreatedExpert] = useState<ExpertProfile | null>(null);
  const [createdLocality, setCreatedLocality] = useState<Neighborhood | null>(null);

  useEffect(() => {
    if (firstName) {
      setUpiId(`${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`);
    }
  }, [firstName]);

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
  const [stillLivesThere, setStillLivesThere] = useState(true);
  const [languages, setLanguages] = useState<string[]>(['English', 'Hindi']);
  const [selectedAvatar, setSelectedAvatar] = useState(MOCK_AVATARS[0]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Schools', 'Safety']);
  const [availability, setAvailability] = useState('Weekends & Evenings');
  const [submitted, setSubmitted] = useState(false);
  const [isLiveChatAvailable, setIsLiveChatAvailable] = useState(false);
  const [liveChatSlots, setLiveChatSlots] = useState<string[]>([]);

  const [weeklyAvailability, setWeeklyAvailability] = useState<DayAvailability[]>([
    { day: 'Monday', available: true, timeWindows: [{ start: '07:00 PM', end: '09:00 PM' }] },
    { day: 'Tuesday', available: true, timeWindows: [{ start: '07:00 PM', end: '09:00 PM' }] },
    { day: 'Wednesday', available: true, timeWindows: [{ start: '07:00 PM', end: '09:00 PM' }] },
    { day: 'Thursday', available: true, timeWindows: [{ start: '07:00 PM', end: '09:00 PM' }] },
    { day: 'Friday', available: true, timeWindows: [{ start: '07:00 PM', end: '10:00 PM' }] },
    { day: 'Saturday', available: true, timeWindows: [{ start: '10:00 AM', end: '01:00 PM' }] },
    { day: 'Sunday', available: true, timeWindows: [{ start: '04:00 PM', end: '08:00 PM' }] }
  ]);
  const [isInstantChatEnabled, setIsInstantChatEnabled] = useState(true);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newStart, setNewStart] = useState('19:00');
  const [newEnd, setNewEnd] = useState('21:00');
  const [timeError, setTimeError] = useState<{ day: string; message: string } | null>(null);

  const convertToMinutes = (timeStr: string): number => {
    // Check for 12-hour format with AM/PM (e.g. "07:00 PM")
    const ampmMatch = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hrs = parseInt(ampmMatch[1], 10);
      const mins = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hrs < 12) hrs += 12;
      else if (ampm === 'AM' && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    }
    // Check for 24-hour format (e.g. "19:00")
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      const hrs = parseInt(parts[0], 10);
      const mins = parseInt(parts[1], 10);
      return hrs * 60 + mins;
    }
    return 0;
  };

  const adjustTime = (currentVal: string, direction: 'up' | 'down'): string => {
    const parts = currentVal.split(':');
    if (parts.length < 2) return currentVal;
    let hrs = parseInt(parts[0], 10);
    let mins = parseInt(parts[1], 10);
    
    // Increment or decrement by 30-minute intervals
    if (direction === 'up') {
      mins += 30;
      if (mins >= 60) {
        mins = 0;
        hrs = (hrs + 1) % 24;
      }
    } else {
      mins -= 30;
      if (mins < 0) {
        mins = 30;
        hrs = (hrs - 1 + 24) % 24;
      }
    }
    const hStr = hrs < 10 ? '0' + hrs : hrs.toString();
    const mStr = mins < 10 ? '0' + mins : mins.toString();
    return `${hStr}:${mStr}`;
  };

  const formatTimeToAMPM = (time24: string): string => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12; // '0' should be '12'
    const minsStr = mins < 10 ? '0' + mins : mins;
    return `${hrs}:${minsStr} ${ampm}`;
  };

  const handleToggleDay = (dayName: string) => {
    setWeeklyAvailability(prev => prev.map(item => {
      if (item.day === dayName) {
        return { ...item, available: !item.available };
      }
      return item;
    }));
  };

  const handleRemoveTimeWindow = (dayName: string, index: number) => {
    setWeeklyAvailability(prev => prev.map(item => {
      if (item.day === dayName) {
        const updated = [...item.timeWindows];
        updated.splice(index, 1);
        return { ...item, timeWindows: updated };
      }
      return item;
    }));
  };

  const handleSaveTimeWindow = (dayName: string) => {
    setTimeError(null);
    const formattedStart = formatTimeToAMPM(newStart);
    const formattedEnd = formatTimeToAMPM(newEnd);
    if (!formattedStart || !formattedEnd) return;

    const newStartMin = convertToMinutes(newStart);
    const newEndMin = convertToMinutes(newEnd);

    if (newStartMin >= newEndMin) {
      setTimeError({ day: dayName, message: "Start time must be before end time!" });
      alert("Error: Start time must be before end time!");
      return;
    }

    const dayConfig = weeklyAvailability.find(item => item.day === dayName);
    if (dayConfig) {
      const hasOverlap = dayConfig.timeWindows.some(window => {
        const existingStartMin = convertToMinutes(window.start);
        const existingEndMin = convertToMinutes(window.end);
        // Overlap if new start is before existing end AND new end is after existing start
        return newStartMin < existingEndMin && newEndMin > existingStartMin;
      });

      if (hasOverlap) {
        setTimeError({ day: dayName, message: "This time window overlaps with an already existing slot on this day!" });
        alert("Error: This time window overlaps with an already existing slot on this day!");
        return;
      }
    }

    setWeeklyAvailability(prev => prev.map(item => {
      if (item.day === dayName) {
        return {
          ...item,
          timeWindows: [...item.timeWindows, { start: formattedStart, end: formattedEnd }]
        };
      }
      return item;
    }));
    setAddingDay(null);
    setTimeError(null);
  };

  const generateDynamicSlots = () => {
    const slots: string[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeRanges = [
      '09:00 AM - 09:30 AM',
      '10:30 AM - 11:00 AM',
      '11:30 AM - 12:00 PM',
      '02:00 PM - 02:30 PM',
      '04:30 PM - 05:00 PM',
      '06:00 PM - 06:30 PM',
      '08:00 PM - 08:30 PM'
    ];
    
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const dayName = days[d.getDay()];
      const monthName = months[d.getMonth()];
      const dateNum = d.getDate();
      
      const label = `${monthName} ${dateNum} (${dayName})`;
      // Mix of slots per day to keep choices interesting
      const slotsForDay = i % 2 === 0 ? [0, 2, 4, 6] : [1, 3, 5];
      slotsForDay.forEach(idx => {
        slots.push(`${label}, ${timeRanges[idx]}`);
      });
    }
    return slots;
  };

  const AVAILABLE_SLOT_OPTIONS = generateDynamicSlots();

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

    // Prohibited Real Estate Broker & Landlord check
    const prohibitedKeywords = [
      'broker', 'brokerage', 'real estate', 'dealer', 'property dealer', 
      'builder', 'developer', 'landlord', 'commission', 'flat for rent', 
      'flats for rent', 'flat sale', 'flats sale', 'realty', 'realtor', 
      'agent', 'property agent', 'agency'
    ];

    const checkText = `${fullName} ${bio} ${neighborhood} ${landmarks} ${detailedAddress}`.toLowerCase();
    const foundProhibited = prohibitedKeywords.find(keyword => checkText.includes(keyword));

    if (foundProhibited) {
      alert(`Registration Blocked:\nTo preserve authentic resident-only feedback, we do not allow real estate brokers, developers, builders, or landlords on BeforeRegret.\n\nYour profile details contain a blocked reference: "${foundProhibited}".`);
      return;
    }

    const localityId = `loc_${neighborhood.toLowerCase().replace(/\s+/g, '_')}`;

    const newExpert: ExpertProfile = {
      id: `exp_${Date.now()}`,
      userId: user ? user.uid : `user_expert_${Date.now()}`,
      fullName,
      bio,
      listingHeadline: listingHeadline.trim() || undefined,
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
      stillLivesThere,
      repeatBuyersCount: 0,
      experienceLevel: 'New Local',
      trustScore: 90,
      languages,
      availability,
      upiId: upiId.trim() || undefined,
      isLiveChatAvailable,
      weeklyAvailability,
      isInstantChatEnabled,
      availableSlots: isLiveChatAvailable ? generateAvailableSlotsFromWeekly(weeklyAvailability) : [],
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
    setCreatedExpert(newExpert);
    setCreatedLocality(newLocality);
    setSubmitted(true);
  };

  const estimatedWeeklyEarnings = (calcTextCount * 89) + (calcChatCount * 220);
  const estimatedMonthlyEarnings = estimatedWeeklyEarnings * 4;

  if (showLanding) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-14 font-sans space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-3.5 py-1.5 text-orange-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Turn Your Everyday Living Facts Into Income</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 tracking-tight leading-[1.1] max-w-2xl mx-auto">
            Share Honest Facts About Your Society. Earn Payouts.
          </h1>
          
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            Prospective home buyers want real, unbiased facts before renting or buying. Help them make the right choice by answering basic queries about maintenance, security, and amenities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={() => setShowLanding(false)}
              className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Start Earning Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('home')}
              className="w-full sm:w-auto px-8 py-4 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-2xl transition-all cursor-pointer"
            >
              Back to Marketplace
            </button>
          </div>
        </div>

        {/* Three Steps Grid */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-800 mt-1">How BeforeRegret Resident Platform Works</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">1. Register Your Society</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your pincode and select your society or building name. List topics of expertise you're comfortable answering (e.g. water supply, parking issues, safety). Your actual block or flat number remains 100% hidden.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">2. Answer Buyer Queries</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Home buyers can choose to purchase a Quick Consultation (₹89 earnings to you) or book a 20-Minute Scheduled Live Chat (₹220 earnings to you) based on the weekly convenient slot windows you configure.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">3. Instant UPI Settlement</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No draft phases or withdrawal waiting limits. Earnings are automatically wired straight to your registered UPI ID once a buyer query is answered or a scheduled live session is completed.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Structure Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
              Transparent Pricing Structure
            </span>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">How Much You Earn</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              We charge a minimal standard platform commission on text queries and 0% platform commission on live chats, allowing you to maximize your local expertise payout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Text Consultation</span>
                <h3 className="font-extrabold text-slate-800 text-base mt-2">Quick Query</h3>
                <p className="text-xs text-slate-400 mt-1">Simple quick single question answer</p>
                <div className="mt-4 border-t border-slate-100 pt-4 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-slate-800">₹89</span>
                  <span className="text-slate-400 text-[10px] font-bold">your share / query</span>
                </div>
              </div>
              <ul className="text-[11px] text-slate-500 space-y-2 pt-4 border-t border-slate-50">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Buyer pays ₹99</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Answered via text anytime within 24h</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Text Consultation</span>
                <h3 className="font-extrabold text-slate-800 text-base mt-2">Comprehensive Bundle</h3>
                <p className="text-xs text-slate-400 mt-1">Detailed evaluation spanning up to 5 topics</p>
                <div className="mt-4 border-t border-slate-100 pt-4 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-slate-800">₹179</span>
                  <span className="text-slate-400 text-[10px] font-bold">your share / query</span>
                </div>
              </div>
              <ul className="text-[11px] text-slate-500 space-y-2 pt-4 border-t border-slate-50">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Buyer pays ₹199</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Prioritized in-depth detailed response</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md mt-1 inline-block">Live Consult</span>
                <h3 className="font-extrabold text-slate-800 text-base mt-2">20-Min Live Chat</h3>
                <p className="text-xs text-slate-400 mt-1">Scheduled instant real-time discussion</p>
                <div className="mt-4 border-t border-slate-100 pt-4 flex items-baseline gap-1.5 font-sans">
                  <span className="text-2xl font-black text-orange-600">₹220</span>
                  <span className="text-slate-400 text-[10px] font-bold">your share / session</span>
                </div>
              </div>
              <ul className="text-[11px] text-slate-500 space-y-2 pt-4 border-t border-slate-50">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Buyer pays ₹220 (0% platform fee)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Conducted securely in our live chatroom</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Calculator Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-3xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Earnings Calculator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Calculate Your Potential Weekly Earnings</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Slide or input the number of consultations you think you can easily handle on weekends or during your evenings to see your projected monthly passive payout.
            </p>

            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Text Consultations / week</span>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono">{calcTextCount} queries</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={calcTextCount}
                  onChange={(e) => setCalcTextCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Live 20-Min Chats / week</span>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono">{calcChatCount} sessions</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={calcChatCount}
                  onChange={(e) => setCalcChatCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-center pb-2 border-b border-slate-200">
              Projected Earnings Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white border border-slate-150 rounded-xl p-3.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Weekly Passive</span>
                <p className="text-2xl font-black text-slate-800 mt-1">₹{estimatedWeeklyEarnings.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white border border-slate-150 rounded-xl p-3.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Monthly Passive</span>
                <p className="text-2xl font-black text-orange-600 mt-1">₹{estimatedMonthlyEarnings.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 space-y-1.5 leading-relaxed bg-white/50 border border-slate-150 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <span>Text query payout share (₹89 x {calcTextCount}):</span>
                <span className="font-bold text-slate-700 font-mono">₹{calcTextCount * 89}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Live chat payout share (₹220 x {calcChatCount}):</span>
                <span className="font-bold text-slate-700 font-mono">₹{calcChatCount * 220}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 rounded-full filter blur-3xl opacity-20 translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full filter blur-3xl opacity-20 -translate-x-12 translate-y-12"></div>
          
          <div className="relative space-y-4 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-tight">
              Ready to Share Factual Facts & Start Earning?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Register your profile in less than 3 minutes.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowLanding(false)}
                className="w-full sm:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Become an Expert Now
              </button>
              <button
                onClick={() => setView('home')}
                className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {!user ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto shadow-sm text-center space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Please sign in to register as a local resident expert.
          </p>
          <button
            type="button"
            onClick={() => {
              if (isClerkActive) {
                triggerClerkSignIn();
              } else {
                loginWithMockUser({
                  uid: 'user_rahul',
                  displayName: 'Rahul K.',
                  email: 'rahul.expert@beforeregret.com',
                  photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                });
              }
            }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
          >
            Sign In to Continue
          </button>
          <button
            type="button"
            onClick={() => setView('home')}
            className="w-full py-2 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : submitted ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
              ✓
            </div>
            <h2 className="font-black text-slate-900 text-xl tracking-tight">Resident Profile Registered & Live!</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your expert listing for <span className="font-bold text-slate-800">{neighborhood}</span> is now active. Buyers can find and query you instantly. Let's verify your production channels.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 space-y-5">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-left pb-2 border-b border-slate-200">
              Expert Launch Checkup & Verification
            </h3>

            {/* Step 1: Verification Status */}
            <div className="flex items-start gap-3.5 text-xs text-left">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl mt-0.5 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800">1. Instant Listing Activation (Zero-Onboarding Gate)</h4>
                  <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    LIVE & LISTED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  We bypass manual onboarding roadblocks. Your profile is 100% active immediately. Quality and safety is governed reactively through buyer reviews and ratings. Zero friction.
                </p>
              </div>
            </div>

            {/* Step 2: Push Notifications */}
            <div className="flex items-start gap-3.5 text-xs text-left pt-2 border-t border-slate-200/60">
              <div className={`p-1.5 border rounded-xl mt-0.5 shrink-0 ${
                pushStatus === 'enabled' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-800">2. Instant Lead Alert Channel (Web Push Notifications)</h4>
                  {pushStatus === 'enabled' ? (
                    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      ENABLED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full">⚠️ ACTION REQUIRED</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  BeforeRegret routes inquiries immediately using browser push notifications. You must authorize this channel to receive paid resident queries on your mobile or desktop device the exact second they are submitted.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {pushStatus !== 'enabled' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setPushStatus('enabling');
                        try {
                          const token = await requestAndSavePushToken(createdExpert?.userId || `expert_${Date.now()}`);
                          if (token) {
                            setPushStatus('enabled');
                          } else {
                            setPushStatus('denied');
                          }
                        } catch (e) {
                          setPushStatus('denied');
                        }
                      }}
                      disabled={pushStatus === 'enabling'}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{pushStatus === 'enabling' ? 'Authorizing...' : 'Enable Notifications'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        setLeadTested(true);
                        // Trigger test lead push alert
                        await triggerTestPushNotification(
                          createdExpert?.userId || `expert_${Date.now()}`,
                          "🔔 Instant Lead Alert: New Buyer Inquiry",
                          `A buyer is asking about ${neighborhood}: 'Are water tankers common here and how are the summer water cuts?'`,
                          "expert_dashboard"
                        );
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Simulate Live Lead Sound Alert</span>
                    </button>
                  )}
                </div>

                {leadTested && (
                  <div className="mt-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-800 leading-relaxed font-medium">
                    ✓ Mock Lead Notification dispatched successfully! You should have heard/seen a native browser alert showing how you will get client requests instantly in real production.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                // Navigate to expert dashboard
                setView('dashboard');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
            >
              <span>Enter Resident Expert Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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
                          setListingHeadline(`I will consult you on ${loc.name}'s water hours, maid rates, and actual society guidelines`);
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

              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Main Listing Headline / Hook (required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. I will consult you on Prestige Shantiniketan's water supply, power history, and security"
                  value={listingHeadline}
                  onChange={(e) => setListingHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 placeholder:text-[10px] sm:placeholder:text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">This will be the main header/title displayed on your profile page to prospective buyers. Make it descriptive and trustworthy.</p>
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

            <div className="grid grid-cols-1 gap-5 text-xs font-medium mb-6">
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

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="text-left">
                <h4 className="font-bold text-slate-800 text-xs">Do you still live in this society?</h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setStillLivesThere(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    stillLivesThere
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Yes, Still Live Here
                </button>
                <button
                  type="button"
                  onClick={() => setStillLivesThere(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !stillLivesThere
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  No, Moved Out
                </button>
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

          {/* Section 4: Live Chat Availability */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="font-display font-black text-slate-900 text-base flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-mono tracking-wider font-bold uppercase">⚡ NEW</span>
                <span>4. Live Chat Availability (Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Offer real-time 20-minute consultation chats to home seekers for premium payouts. When a buyer books a slot, a secure chatroom opens automatically at that exact scheduled time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-xl">
              <div>
                <span className="block text-xs font-bold text-slate-700">Enable Live Chat consultations</span>
                <span className="text-[10px] text-slate-400">Receive ₹220 (per 20 mins session)</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveChatAvailable(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isLiveChatAvailable
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Yes, Enable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveChatAvailable(false);
                    setLiveChatSlots([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !isLiveChatAvailable
                      ? 'bg-slate-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  No, Skip
                </button>
              </div>
            </div>

            {isLiveChatAvailable && (
              <div className="space-y-6 pt-4 border-t border-slate-200/60">
                {/* Weekly Recurring Availability Section */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Weekly Consultation Schedule (Recurring)
                  </h4>

                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {/* Headers */}
                    <div className="hidden sm:grid grid-cols-12 bg-slate-50 border-b border-slate-200/80 px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-3">Day of Week</div>
                      <div className="col-span-2 text-center">Available</div>
                      <div className="col-span-7">Time Windows</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-150">
                      {weeklyAvailability.map((day) => (
                        <div key={day.day} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center px-4 py-3.5 gap-2.5 sm:gap-0">
                          {/* Day Column */}
                          <div className="col-span-3">
                            <span className="text-xs font-bold text-slate-800 font-display">{day.day}</span>
                          </div>

                          {/* Available Toggle Column */}
                          <div className="col-span-2 w-full sm:w-auto flex justify-start sm:justify-center">
                            <label className="flex items-center gap-2 cursor-pointer sm:justify-center w-full">
                              <input
                                type="checkbox"
                                checked={day.available}
                                onChange={() => handleToggleDay(day.day)}
                                className="h-4.5 w-4.5 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              />
                              <span className="text-[11px] sm:hidden font-medium text-slate-500">Available</span>
                            </label>
                          </div>

                          {/* Time Windows Column */}
                          <div className="col-span-7 w-full space-y-2">
                            {day.available ? (
                              <div className="space-y-2">
                                {/* Time Windows list */}
                                {day.timeWindows && day.timeWindows.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {day.timeWindows.map((window, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-1 bg-orange-50/50 border border-orange-200/60 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-orange-800"
                                      >
                                        <span>{window.start} – {window.end}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTimeWindow(day.day, index)}
                                          className="text-orange-400 hover:text-orange-700 font-bold ml-1 px-0.5 focus:outline-hidden cursor-pointer"
                                          title="Remove time window"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic block">
                                    No time windows. Click "+ Add Window" below to add some.
                                  </span>
                                )}

                                {/* Inline adding interface */}
                                {addingDay === day.day ? (
                                  <div className="space-y-2 mt-1.5">
                                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl w-full sm:w-max shadow-3xs">
                                      {/* Start Time Input with Custom up/down arrows */}
                                      <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-3xs focus-within:border-orange-500">
                                        <input
                                          type="time"
                                          value={newStart}
                                          onChange={(e) => setNewStart(e.target.value)}
                                          className="text-xs font-mono outline-hidden bg-transparent w-16"
                                        />
                                        <div className="flex flex-col ml-1.5 border-l border-slate-150 pl-1.5 text-slate-400">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTimeError(null);
                                              setNewStart(prev => adjustTime(prev, 'up'));
                                            }}
                                            className="hover:text-orange-600 focus:outline-hidden cursor-pointer p-0.5"
                                            title="Increase start time by 30 mins"
                                          >
                                            <ChevronUp className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTimeError(null);
                                              setNewStart(prev => adjustTime(prev, 'down'));
                                            }}
                                            className="hover:text-orange-600 focus:outline-hidden cursor-pointer p-0.5"
                                            title="Decrease start time by 30 mins"
                                          >
                                            <ChevronDown className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <span className="text-slate-400 text-[10px] font-semibold font-sans">to</span>

                                      {/* End Time Input with Custom up/down arrows */}
                                      <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-3xs focus-within:border-orange-500">
                                        <input
                                          type="time"
                                          value={newEnd}
                                          onChange={(e) => setNewEnd(e.target.value)}
                                          className="text-xs font-mono outline-hidden bg-transparent w-16"
                                        />
                                        <div className="flex flex-col ml-1.5 border-l border-slate-150 pl-1.5 text-slate-400">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTimeError(null);
                                              setNewEnd(prev => adjustTime(prev, 'up'));
                                            }}
                                            className="hover:text-orange-600 focus:outline-hidden cursor-pointer p-0.5"
                                            title="Increase end time by 30 mins"
                                          >
                                            <ChevronUp className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTimeError(null);
                                              setNewEnd(prev => adjustTime(prev, 'down'));
                                            }}
                                            className="hover:text-orange-600 focus:outline-hidden cursor-pointer p-0.5"
                                            title="Decrease end time by 30 mins"
                                          >
                                            <ChevronDown className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 ml-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveTimeWindow(day.day)}
                                          className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-3xs cursor-pointer"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddingDay(null);
                                            setTimeError(null);
                                          }}
                                          className="text-slate-500 hover:text-slate-700 text-[10px] font-semibold px-2 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>

                                    {timeError && timeError.day === day.day && (
                                      <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-3 py-2 rounded-xl w-full sm:w-max max-w-sm flex items-center gap-1.5 animate-pulse shadow-3xs">
                                        <span className="text-xs">⚠️</span>
                                        <span>{timeError.message}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingDay(day.day);
                                      setNewStart("19:00");
                                      setNewEnd("21:00");
                                    }}
                                    className="inline-flex items-center text-[10px] text-orange-600 hover:text-orange-700 font-bold border border-dashed border-orange-200 hover:border-orange-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer bg-orange-50/10 hover:bg-orange-50/40"
                                  >
                                    + Add Time Window
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Not available on this day</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Instant Chat Requests Section */}
                <div className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="relative flex h-3.5 w-3.5 my-1 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 font-display">Instant Chat Requests</h4>
                      <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                        If you're online and free, would you like to receive instant booking requests?
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsInstantChatEnabled(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isInstantChatEnabled
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{isInstantChatEnabled ? '☑' : '☐'}</span> Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInstantChatEnabled(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        !isInstantChatEnabled
                          ? 'bg-slate-600 text-white border-slate-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{!isInstantChatEnabled ? '☑' : '☐'}</span> No
                    </button>
                  </div>
                  
                  {isInstantChatEnabled && (
                    <p className="text-[10px] text-emerald-700 font-medium leading-relaxed pt-1">
                      ✨ Enabled! Users browsing the platform will see: <span className="inline-flex items-center gap-1.5 font-bold bg-white px-2.5 py-1 rounded-full border border-emerald-200/60 text-emerald-800 shadow-3xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Available Now — Chat within 5 minutes
                      </span> on your profile.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Short Introduction Bio */}
          <div>
            <h3 className="font-display font-black text-slate-900 text-base border-b border-slate-100 pb-3 mb-5">
              5. Short Introduction Bio
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
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-3.5 border border-slate-200/60 text-xs">
              <input type="checkbox" required className="mt-1 h-4 w-4 text-blue-600 border-slate-200 rounded-md shrink-0 cursor-pointer" />
              <div className="text-slate-500 text-left">
                <h4 className="font-bold text-slate-800">
                  {stillLivesThere 
                    ? 'I certify that I am an actual resident of this society and I would not share any confidential/misleading details for safety and security of myself and society. ' 
                    : 'I certify that I was an actual resident of this society and I would not share any confidential/misleading details for safety and security of myself and society. '}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Before Regret is built on absolute trust. Providing fake profiles or malicious details will result in permanent ban and withholding of payouts.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 flex items-start gap-3.5 border border-slate-200/60 text-xs">
              <input type="checkbox" required className="mt-1 h-4 w-4 text-blue-600 border-slate-200 rounded-md shrink-0 cursor-pointer" />
              <div className="text-slate-500 text-left">
                <h4 className="font-bold text-slate-800">I certify that I am NOT a landlord, builder, or real estate broker</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  To keep insights authentic, impartial, and peer-to-peer, landlords and brokers are strictly prohibited from creating listings. Only current or former actual residents are allowed.
                </p>
              </div>
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
