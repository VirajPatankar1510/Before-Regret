import React, { useState } from 'react';
import { ExpertProfile, Review, Neighborhood } from '../types';
import { 
  ChevronLeft, 
  Heart, 
  Lock,
  Check, 
  X
} from 'lucide-react';
import { ResidentAvatar } from './ResidentAvatar';
import { useAuth } from '../context/AuthContext';

interface ResidentProfileProps {
  expert: ExpertProfile;
  locality: Neighborhood;
  reviews: Review[];
  onBack: () => void;
  onSelectPackage: (packageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT') => void;
  onStartInquiry: () => void;
  savedExperts: string[];
  onToggleSaveExpert: (expertId: string) => void;
  currentUserUid?: string;
  allExperts?: ExpertProfile[];
  onSelectExpert?: (expert: ExpertProfile) => void;
  onSubmitQuestion?: (queryText: string, packageId: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT', bookedSlot?: string) => void;
  queries?: any[];
}

export const ResidentProfile: React.FC<ResidentProfileProps> = ({
  expert,
  locality,
  reviews,
  onBack,
  onSelectPackage,
  onStartInquiry,
  savedExperts,
  onToggleSaveExpert,
  currentUserUid,
  allExperts = [],
  onSelectExpert,
  onSubmitQuestion,
  queries = [],
}) => {
  const isSaved = savedExperts.includes(expert.id);
  const isOwnListing = currentUserUid && currentUserUid === expert.userId;

  // Filter reviews matching current expert
  const expertReviews = reviews.filter((rev) => rev.expertId === expert.id);

  // Auth context for seamless 1-click test sign-in
  const { user, loginWithMockUser, isClerkActive, triggerClerkSignIn } = useAuth();

  // Booking Flow Steps States
  const [bookingStep, setBookingStep] = useState<'datetime' | 'review' | 'payment' | 'confirmed'>('datetime');
  const [selectedDateKey, setSelectedDateKey] = useState<'Today' | 'Tomorrow' | 'Day After'>('Today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [queryText, setQueryText] = useState<string>('');
  
  // Payment States
  const [cardNumber, setCardNumber] = useState('4532 7150 2000 8952');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSubStep, setPaymentSubStep] = useState<'details' | 'otp'>('details');

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Weekday name calculation
  const getWeekdayName = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const dates = [
    { key: 'Today' as const, label: 'Today' },
    { key: 'Tomorrow' as const, label: 'Tomorrow' },
    { key: 'Day After' as const, label: getWeekdayName(2) }
  ];

  // Slot helper
  const getSlotsForDate = (dateKey: 'Today' | 'Tomorrow' | 'Day After') => {
    if (expert.availableSlots && expert.availableSlots.length > 0) {
      return expert.availableSlots
        .filter(s => {
          if (dateKey === 'Today') return s.startsWith('Today');
          if (dateKey === 'Tomorrow') return s.startsWith('Tomorrow');
          return !s.startsWith('Today') && !s.startsWith('Tomorrow');
        })
        .map(s => s.replace(/^(Today|Tomorrow),\s*/, '').trim());
    }
    
    if (dateKey === 'Today') {
      return ['04:30 PM - 05:00 PM', '06:00 PM - 06:30 PM', '07:30 PM - 08:00 PM'];
    } else if (dateKey === 'Tomorrow') {
      return ['11:00 AM - 11:30 AM', '03:00 PM - 03:30 PM', '05:30 PM - 06:00 PM'];
    } else {
      return ['10:00 AM - 10:30 AM', '02:00 PM - 02:30 PM', '04:00 PM - 04:30 PM'];
    }
  };

  const getFullSlotString = (dateKey: 'Today' | 'Tomorrow' | 'Day After', time: string) => {
    if (dateKey === 'Today') return `Today, ${time}`;
    if (dateKey === 'Tomorrow') return `Tomorrow, ${time}`;
    return `${getWeekdayName(2)}, ${time}`;
  };

  const isSlotBooked = (fullSlotString: string) => {
    return queries.some(q => q.expertId === expert.id && q.packageOption === 'LIVE_CHAT' && q.bookedSlot === fullSlotString);
  };

  const currentFullSlotString = selectedTimeSlot ? getFullSlotString(selectedDateKey, selectedTimeSlot) : '';

  // Auth helper
  const handleFrictionlessSignIn = async () => {
    setIsProcessing(true);
    try {
      if (isClerkActive) {
        triggerClerkSignIn();
      } else {
        await loginWithMockUser({
          uid: 'user_mock_buyer',
          displayName: 'Amit Kumar',
          email: 'amit@example.com'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment triggers
  const handleInitiatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSubStep('otp');
    }, 1200);
  };

  const handleVerifyOtp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setBookingStep('confirmed');
    }, 1200);
  };

  const handleFinalizeBooking = () => {
    if (onSubmitQuestion && selectedTimeSlot) {
      onSubmitQuestion(queryText, 'LIVE_CHAT', currentFullSlotString);
      setIsMobileDrawerOpen(false);
    }
  };

  const handleScrollToBooking = () => {
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen(true);
    } else {
      const el = document.getElementById('booking-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };


  const renderBookingWizard = () => {
    return (
      <div className="bg-slate-950 border border-slate-900 shadow-2xl rounded-xl p-6 space-y-6 relative overflow-hidden ring-1 ring-white/10 transition-all duration-300 hover:shadow-3xl hover:scale-[1.01] text-white">
        {/* Elegant top highlight indicator */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
        {/* Header step progress */}
        <div className="space-y-1.5 pb-2 border-b border-slate-900">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              {bookingStep === 'datetime' && 'Step 1: Date & Time'}
              {bookingStep === 'review' && 'Step 2: Review Booking'}
              {bookingStep === 'payment' && 'Step 3: Secure Payment'}
              {bookingStep === 'confirmed' && 'Step 4: Booking Confirmed'}
            </span>
            <div className="flex gap-1">
              <span className={`h-1 w-3 rounded-full ${bookingStep === 'datetime' ? 'bg-white' : 'bg-slate-800'}`} />
              <span className={`h-1 w-3 rounded-full ${bookingStep === 'review' ? 'bg-white' : 'bg-slate-800'}`} />
              <span className={`h-1 w-3 rounded-full ${bookingStep === 'payment' ? 'bg-white' : 'bg-slate-800'}`} />
              <span className={`h-1 w-3 rounded-full ${bookingStep === 'confirmed' ? 'bg-white' : 'bg-slate-800'}`} />
            </div>
          </div>
        </div>

        {/* STEP 1: DATE & TIME */}
        {bookingStep === 'datetime' && (
          <div className="space-y-5">
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 font-mono">
                Select Date
              </span>
              <div className="grid grid-cols-3 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => {
                      setSelectedDateKey(d.key);
                      setSelectedTimeSlot('');
                    }}
                    className={`py-2 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                      selectedDateKey === d.key
                        ? 'border-white bg-white text-slate-950 font-semibold'
                        : 'border-slate-850 text-slate-300 hover:border-amber-500 hover:ring-1 hover:ring-amber-500 hover:text-white bg-slate-900/60'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 font-mono">
                Select Time Slot (20 Mins)
              </span>
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {getSlotsForDate(selectedDateKey).map((time) => {
                  const fullStr = getFullSlotString(selectedDateKey, time);
                  const booked = isSlotBooked(fullStr);
                  return (
                    <button
                      key={time}
                      disabled={booked}
                      onClick={() => setSelectedTimeSlot(time)}
                      className={`w-full py-2 px-3 rounded-md border text-left text-xs transition-all flex items-center justify-between ${
                        booked
                          ? 'border-slate-950 bg-slate-950/40 text-slate-600 cursor-not-allowed'
                          : selectedTimeSlot === time
                          ? 'border-white bg-white text-slate-950 font-semibold'
                          : 'border-slate-850 text-slate-300 hover:border-amber-500 hover:ring-1 hover:ring-amber-500 hover:text-white bg-slate-900/60 cursor-pointer'
                      }`}
                    >
                      <span className="font-mono">{time}</span>
                      <span className="text-[10px] font-medium uppercase font-mono">
                        {booked ? 'Booked' : selectedTimeSlot === time ? 'Selected' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setBookingStep('review')}
              disabled={!selectedTimeSlot || isOwnListing}
              className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-900 disabled:text-slate-500 disabled:border disabled:border-slate-850 text-slate-950 font-semibold text-xs uppercase tracking-wider py-3 rounded-md transition-colors cursor-pointer"
            >
              {isOwnListing ? 'Your active listing' : 'Review Booking'}
            </button>
          </div>
        )}

        {/* STEP 2: REVIEW */}
        {bookingStep === 'review' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium">Scheduled Time</span>
                <span className="font-mono font-semibold text-amber-400">{currentFullSlotString}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium">Duration</span>
                <span className="font-semibold text-slate-200">20-minute Private Chat</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="font-semibold text-slate-300">Rate</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-base text-white">₹299</span>
                  <span className="text-[9px] text-slate-500 block">All-inclusive fee</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                What do you want to verify or ask?
              </span>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="E.g., What are the typical water schedules? Are there hidden parking or move-in charges?"
                className="w-full text-xs p-3 border border-slate-850 rounded-md focus:outline-none focus:border-slate-500 bg-slate-900 text-white placeholder-slate-500 resize-none overflow-hidden"
                rows={3}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Please share specific details</span>
                <span>
                  {queryText.trim().length}/20 chars min
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBookingStep('datetime')}
                className="w-1/3 border border-slate-800 hover:bg-slate-900 text-slate-300 font-medium text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer text-center"
              >
                Back
              </button>
              
              {!user ? (
                <button
                  onClick={handleFrictionlessSignIn}
                  disabled={isProcessing}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  {isProcessing ? 'Signing in...' : 'Sign In'}
                </button>
              ) : (
                <button
                  onClick={() => setBookingStep('payment')}
                  disabled={queryText.trim().length < 20}
                  className="flex-1 bg-white hover:bg-slate-100 disabled:bg-slate-900 disabled:text-slate-500 disabled:border disabled:border-slate-850 text-slate-950 font-semibold text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  Proceed to Payment
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SECURE PAYMENT */}
        {bookingStep === 'payment' && (
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-medium pb-2 border-b border-slate-900">
              <span className="text-slate-400">Amount Due</span>
              <span className="font-mono text-white">₹299</span>
            </div>

            {paymentSubStep === 'details' ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Card Number
                  </span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-850 rounded-md bg-slate-900 text-white font-mono focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      Expiry Date
                    </span>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full text-xs p-2.5 border border-slate-850 rounded-md bg-slate-900 text-white font-mono focus:outline-none focus:border-slate-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      CVV
                    </span>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={3}
                      className="w-full text-xs p-2.5 border border-slate-850 rounded-md bg-slate-900 text-white font-mono focus:outline-none focus:border-slate-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setBookingStep('review')}
                    className="w-1/3 border border-slate-800 hover:bg-slate-900 text-slate-300 font-medium text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer text-center"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Processing...' : 'Pay ₹299'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-md text-[11px] text-slate-300 leading-normal">
                  Secure SMS OTP has been sent. Enter code <strong className="font-semibold text-white">123456</strong> below to complete verification.
                </div>

                <div className="space-y-1">
                  <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Enter OTP
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-sm text-center tracking-widest p-2.5 border border-slate-850 rounded-md bg-slate-900 text-white font-mono font-semibold focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentSubStep('details')}
                    className="w-1/3 border border-slate-800 hover:bg-slate-900 text-slate-300 font-medium text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer text-center"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isProcessing || otp.trim().length < 4}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Verifying...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}

            <div className="text-[9px] text-slate-500 text-center flex items-center justify-center gap-1 font-mono">
              <Lock className="w-3 h-3 text-slate-650" />
              <span>SSL Secure Encrypted Platform Connection</span>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMED */}
        {bookingStep === 'confirmed' && (
          <div className="text-center py-4 space-y-4">
            <div className="h-8 w-8 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-4 h-4 font-bold" />
            </div>
            
            <div className="space-y-1">
              <span className="block text-sm font-semibold text-white">Booking Confirmed</span>
              <p className="text-xs text-slate-450 leading-normal max-w-xs mx-auto">
                Consultation scheduled with {expert.fullName} for <span className="font-semibold text-slate-200 font-mono">{currentFullSlotString}</span>.
              </p>
            </div>

            <button
              onClick={handleFinalizeBooking}
              className="w-full bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs uppercase tracking-wider py-2.5 rounded-md transition-colors cursor-pointer text-center"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 sm:py-12 font-sans text-slate-800 bg-white">
      
      {/* Mini top bar */}
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Locality</span>
        </button>

        <button
          onClick={() => onToggleSaveExpert(expert.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            isSaved
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Main content split panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
        
        {/* Left column content */}
        <div className="md:col-span-2 space-y-12">
          
          {/* ABOVE THE FOLD SECTION (Strict boundary limit) */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <ResidentAvatar name={expert.fullName} className="w-16 h-16 rounded-full border border-slate-100 shrink-0" />
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{expert.fullName}</h1>
                <p className="text-sm font-semibold text-slate-500">
                  Resident of {locality.name}, {expert.city}
                </p>
              </div>
            </div>

            {/* Hook Headline */}
            <h2 className="text-lg font-medium text-slate-600 leading-relaxed italic max-w-xl">
              "{expert.listingHeadline || 'Learn what daily life is actually like before you move.'}"
            </h2>

            {/* Quick clean info row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
              {expert.yearsLivingThere > 0 && (
                <>
                  <span>{expert.yearsLivingThere} {expert.yearsLivingThere === 1 ? 'year' : 'years'} resident</span>
                  <span className="text-slate-200 select-none">•</span>
                </>
              )}
              <span>Speaks {expert.languages.join(', ')}</span>
            </div>

            {/* Primary above-the-fold CTA trigger */}
            <div className="pt-2">
              <button
                onClick={handleScrollToBooking}
                disabled={isOwnListing}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium text-xs uppercase tracking-wider py-3 px-6 rounded-md transition-colors cursor-pointer"
              >
                {isOwnListing ? 'Your Active Listing' : 'Book Resident Chat • ₹299'}
              </button>
            </div>
          </div>

          {/* ABOUT SECTION */}
          <div className="space-y-3 pt-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              A Little About Me
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-sans">
              {expert.bio}
            </p>
          </div>

          {/* TOPICS SECTION */}
          {expert.expertiseTags && expert.expertiseTags.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Ask Me About
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {expert.expertiseTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-1 bg-slate-50 border border-slate-150 text-[11px] text-slate-600 rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HOW BOOKING WORKS SECTION */}
          <div className="space-y-4 p-6 bg-slate-50/50 border border-slate-100 rounded-xl transition-all duration-300 hover:bg-slate-50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              How the Consultation Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-1">
              {[
                { num: '1', title: 'Select Slot', desc: 'Pick a date and 20-minute time slot.' },
                { num: '2', title: 'Describe', desc: 'Share your specific verification questions.' },
                { num: '3', title: 'Payment', desc: 'Complete Payment' },
                { num: '4', title: 'Live Chat', desc: 'Speak directly with the resident.' }
              ].map((step) => (
                <div key={step.num} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono text-slate-450">[{step.num}]</span>
                    <span className="font-semibold text-slate-800">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WHAT I CAN'T HELP WITH SECTION */}
          <div className="space-y-3 pt-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              What I Can't Help With
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-500 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 select-none">•</span>
                <span>Property valuation</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 select-none">•</span>
                <span>Legal advice</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 select-none">•</span>
                <span>Loans</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 select-none">•</span>
                <span>Taxes</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 select-none">•</span>
                <span>Investment advice</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 select-none">•</span>
                <span>Builder disputes</span>
              </li>
            </ul>
            <p className="text-[11px] font-semibold text-slate-400 font-sans pt-1">
              "I only share my personal experience of living here."
            </p>
          </div>

          {/* AUTHENTIC RESIDENT FEEDBACK */}
          {expertReviews.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Resident Feedback
              </h3>
              <div className="space-y-4">
                {expertReviews.map((rev) => (
                  <div key={rev.id} className="text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{rev.buyerName}</span>
                      <span className="text-slate-400 font-mono">⭐ {rev.rating}</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right sticky sidebar column */}
        <div id="booking-panel" className="hidden md:block md:col-span-1 sticky top-24 z-30">
          <div className="space-y-4">
            <div className="flex justify-between items-baseline px-1 text-xs text-slate-400">
              <span>Chat with a Resident:</span>
              <span className="text-sm font-bold text-slate-900 font-mono">₹299</span>
            </div>
            {renderBookingWizard()}
          </div>
        </div>

      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 z-40 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-mono block">Consultation Rate</span>
          <span className="text-sm font-bold text-slate-900 font-mono">₹299</span>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          disabled={isOwnListing}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium text-xs uppercase tracking-wider px-5 py-2.5 rounded-md transition-colors"
        >
          {isOwnListing ? 'Your listing' : 'Book Chat'}
        </button>
      </div>

      {/* Mobile booking drawer modal */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/30 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border-t border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Book Consultation</span>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-md hover:bg-slate-50 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderBookingWizard()}
          </div>
        </div>
      )}

    </div>
  );
};
