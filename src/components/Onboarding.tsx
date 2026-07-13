import React, { useState } from 'react';
import { TOPICS_OF_EXPERTISE, MOCK_AVATARS } from '../data';
import { ExpertProfile } from '../types';
import { Sparkles, Check, ChevronRight, HelpCircle, Heart, ShieldCheck, RefreshCw } from 'lucide-react';

interface OnboardingProps {
  onAddExpert: (expert: ExpertProfile) => void;
  setView: (view: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onAddExpert,
  setView,
}) => {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('400063');
  const [neighborhood, setNeighborhood] = useState('');
  const [yearsLiving, setYearsLiving] = useState('5');
  const [languages, setLanguages] = useState<string[]>(['English', 'Hindi']);
  const [selectedAvatar, setSelectedAvatar] = useState(MOCK_AVATARS[0]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Schools', 'Safety']);
  const [availability, setAvailability] = useState('Weekends & Evenings');
  const [submitted, setSubmitted] = useState(false);

  const availableLanguages = [
    'English',
    'Hindi',
    'Gujarati',
    'Marathi',
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
    if (!fullName.trim() || !neighborhood.trim() || !bio.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const newExpert: ExpertProfile = {
      id: `exp_${Date.now()}`,
      userId: `user_expert_${Date.now()}`,
      fullName,
      bio,
      localityId: `loc_${neighborhood.toLowerCase().replace(/\s+/g, '_')}`,
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

    onAddExpert(newExpert);
    setSubmitted(true);
    setTimeout(() => {
      setView('home');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans">
      
      {/* Banner introduction */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4 font-mono uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Before Regret Resident Network
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
          Earn by Sharing Honest Facts About Your Society
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed">
          People moving into your apartment building or neighborhood want unvarnished truth before buying or renting. Answer their basic queries and receive payouts held in secure escrow.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto text-xl animate-bounce">
            ✓
          </div>
          <h2 className="font-black text-slate-900 text-lg">Onboarding Form Submitted Successfully!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Congratulations! You are now listed as a verified local expert in {neighborhood}. We are redirecting you to the home catalog...
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
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Your Full Name / Alias (required)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shalini Roy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">City of Residence</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Gurugram">Gurugram</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Pincode / Postal Code (required)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 560102"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Society or Layout Name (required)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bimbisar Nagar or Prestige Shantiniketan"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600"
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
                <input
                  type="number"
                  min={1}
                  required
                  value={yearsLiving}
                  onChange={(e) => setYearsLiving(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Standard Availability</label>
                <input
                  type="text"
                  required
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Evenings & Weekends"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600"
                />
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
                placeholder="Explain what details you can verify for prospective buyers (e.g. water tanker bills frequency, local maid rates, parking space guidelines, basement dampness, late-night safety, etc.). Provide specific unvarnished insights."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 text-xs sm:text-sm border border-slate-200 focus:border-blue-600 rounded-xl outline-hidden leading-relaxed text-slate-800"
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
