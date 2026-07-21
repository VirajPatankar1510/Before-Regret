import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Sparkles, 
  User, 
  LogIn, 
  LogOut, 
  Award, 
  BookOpen, 
  ChevronDown, 
  Check, 
  Menu, 
  X, 
  Bell, 
  Trash2, 
  Settings, 
  Info, 
  Volume2 
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { ResidentAvatar } from './ResidentAvatar';
import { 
  isPushSupported, 
  requestAndSavePushToken, 
  listenToForegroundNotifications, 
  triggerTestPushNotification 
} from '../lib/notificationService';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  activeRole: 'guest' | 'buyer' | 'expert';
  setActiveRole: (role: 'guest' | 'buyer' | 'expert') => void;
  onSearchFocus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  activeRole,
  setActiveRole,
  onSearchFocus,
}) => {
  const { 
    user, 
    signInWithGoogle, 
    signUpWithEmail,
    signInWithEmail,
    logout, 
    expertProfile,
    userExperts,
    isClerkActive,
    triggerClerkSignIn,
    triggerClerkSignUp
  } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  // Authentication & Credentials states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.hostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  // Centralized Notifications States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupport, setPushSupport] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  // 1. Check for Push Support on Load
  useEffect(() => {
    isPushSupported().then(supported => {
      setPushSupport(supported);
      if (supported && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          setPushEnabled(true);
        }
      }
    });
  }, []);

  // 2. Poll for pending notifications and listen for foreground messages
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Initial and periodic retrieval of notifications from backend
    const fetchPendingNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications/pending/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.id));
              const news = data.notifications.filter((n: any) => !existingIds.has(n.id));
              return [...news, ...prev];
            });
          }
        }
      } catch (err) {
        console.error('Error fetching pending notifications:', err);
      }
    };

    fetchPendingNotifications();
    const interval = setInterval(fetchPendingNotifications, 5000);

    // Setup foreground FCM listener
    let unsubscribeForeground = () => {};
    listenToForegroundNotifications((payload) => {
      if (payload?.notification) {
        const newNotif = {
          id: payload.messageId || `notif_${Date.now()}`,
          title: payload.notification.title || 'Alert',
          body: payload.notification.body || '',
          clickAction: payload.data?.click_action || '/',
          createdAt: new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [newNotif, ...prev]);

        // Provide a subtle non-blocking notification audio sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
          audio.volume = 0.15;
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }).then(unsub => {
      unsubscribeForeground = unsub;
    });

    return () => {
      clearInterval(interval);
      unsubscribeForeground();
    };
  }, [user]);

  // Request & Enable Push Notifications
  const handleEnablePush = async () => {
    if (!user) return;
    setPushLoading(true);
    setFeedbackMsg({ type: '', text: '' });
    try {
      const token = await requestAndSavePushToken(user.uid);
      if (token) {
        setPushEnabled(true);
        setFeedbackMsg({ type: 'success', text: 'Web Push Notifications enabled successfully! 🎉' });
        // Trigger a test greeting push
        await triggerTestPushNotification(
          user.uid,
          'Notifications Registered! 🔔',
          'BeforeRegret will now keep you instantly updated about reviews, neighborhood questions, and active chat threads!'
        );
      } else {
        setPushEnabled(false);
        setFeedbackMsg({ type: 'error', text: 'Permission denied or browser not supported.' });
      }
    } catch (err) {
      console.error('Failed to enable web push:', err);
      setFeedbackMsg({ type: 'error', text: 'Configuration failed. Try again.' });
    } finally {
      setPushLoading(false);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 5000);
    }
  };

  // Dispatch a test push notification instantly
  const handleTriggerTest = async () => {
    if (!user) return;
    setFeedbackMsg({ type: 'success', text: 'Sending test push notification request...' });
    try {
      await triggerTestPushNotification(
        user.uid,
        'Live Resident Audit Request 📣',
        'Rohan Sharma has requested a live parking and tanker water report for Prestige Shantiniketan!'
      );
    } catch (err) {
      console.error('Failed to trigger test:', err);
    } finally {
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 3000);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Handle individual notification click
  const handleNotificationClick = async (notif: any) => {
    // Mark as read
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notif.id] })
      });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }

    setNotifDropdownOpen(false);

    // Route dynamically based on click action
    if (notif.clickAction.includes('dashboard') || notif.clickAction.includes('buyer_dashboard') || notif.clickAction.includes('expert_dashboard')) {
      setView('dashboard');
    } else if (notif.clickAction.includes('explore')) {
      setView('explore');
    }
    window.scrollTo(0, 0);
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        setAuthModalOpen(false);
        setView('dashboard');
      }
    } catch (err: any) {
      console.error('Google Authentication error:', err);
      setAuthError(err.message || 'Google authentication failed. Please try again.');
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Please fill in all fields.');
      return;
    }

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setAuthError('Please provide a name.');
          return;
        }
        const newUser = await signUpWithEmail(email.trim(), password.trim(), displayName.trim());
        if (newUser) {
          setAuthSuccess('Account created successfully!');
          setTimeout(() => {
            setAuthModalOpen(false);
            setView('dashboard');
          }, 1000);
        }
      } else {
        const loggedInUser = await signInWithEmail(email.trim(), password.trim());
        if (loggedInUser) {
          setAuthSuccess('Signed in successfully!');
          setTimeout(() => {
            setAuthModalOpen(false);
            setView('dashboard');
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setDropdownOpen(false);
      setView('home');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <div className="border-b border-slate-100 bg-white sticky top-0 z-50 shadow-2xs font-sans">

      <header className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setView('home')} 
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <Logo size={36} className="transition-transform group-hover:scale-105" />
          <div>
            <span className="font-logo font-black text-xl tracking-tight text-slate-900">
              Before <span className="text-slate-900">Regret</span>
            </span>
            <span className="block text-[8px] sm:text-[9px] text-slate-400 font-logo font-semibold tracking-wider sm:tracking-widest uppercase mt-0.5">
              Before You Decide, Ask.
            </span>
          </div>
        </div>

        {/* Minimal Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => {
              onSearchFocus();
              setView('home');
            }}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          {expertProfile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setView('dashboard');
                }}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-bold"
              >
                <Award className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Dashboard</span>
              </button>
              {userExperts.length < 2 && (
                <button
                  onClick={() => setView('become_expert')}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold ml-2 pl-2 border-l border-slate-200"
                >
                  <span>List Another Society</span>
                </button>
              )}
            </div>
          ) : (
            userExperts.length < 2 && (
              <button
                onClick={() => setView('become_expert')}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold"
              >
                <Award className="w-4 h-4 text-emerald-500" />
                <span>Become a Resident Guide</span>
              </button>
            )
          )}
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Notification Bell Icon & Centralized Panel */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className={`relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all border border-slate-100 cursor-pointer ${notifDropdownOpen ? 'bg-blue-50/75 border-blue-200 text-blue-600' : ''}`}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse" />
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-20 font-sans max-h-[480px] overflow-y-auto">
                    {/* Panel Header */}
                    <div className="px-4 pb-2 border-b border-slate-50 flex items-center justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider font-mono">Centralized Notifications</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Real-time Web Push Feed</p>
                      </div>
                      {notifications.some(n => !n.read) && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[9px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Quick Config / Setup bar */}
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 inline-flex items-center gap-1 text-[11px]">
                          <Settings className="w-3 h-3 text-slate-400" /> Web Push Status
                        </span>
                        <div className="flex items-center gap-2">
                          {pushSupport ? (
                            <button
                              disabled={pushLoading}
                              onClick={handleEnablePush}
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                pushEnabled 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                              }`}
                            >
                              {pushLoading ? 'Linking...' : pushEnabled ? 'Active (Free)' : 'Enable Push'}
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                              Unsupported Browser
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Feedback messages */}
                      {feedbackMsg.text && (
                        <div className={`text-[9px] px-2 py-1 rounded font-medium flex items-center gap-1 ${
                          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          <Info className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>{feedbackMsg.text}</span>
                        </div>
                      )}

                      {/* Test Push trigger */}
                      {pushEnabled && (
                        <div className="flex items-center justify-between border-t border-slate-100/50 pt-1.5 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-500">Verify push delivery stream:</span>
                          <button
                            onClick={handleTriggerTest}
                            className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 rounded text-[9px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Send Live Test Push</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notifications Feed list */}
                    <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                          <p className="text-xs font-semibold text-slate-600">All caught up!</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto">
                            Enable Web Push above to receive instant transactional alerts even when this tab is closed.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50/80 relative flex gap-2.5 ${
                              !notif.read ? 'bg-blue-50/20' : ''
                            }`}
                          >
                            <div className="mt-0.5 relative flex-shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-1.5 left-0 transition-all ${
                                notif.read ? 'opacity-0' : 'opacity-100'
                              }`} />
                            </div>
                            <div className="pl-2 space-y-0.5">
                              <p className="text-xs font-bold text-slate-900 leading-snug">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 leading-normal">{notif.body}</p>
                              <p className="text-[9px] text-slate-400 font-medium">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isClerkActive) {
                    triggerClerkSignIn();
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-300 transition-all cursor-pointer bg-slate-50 text-slate-800"
              >
                <ResidentAvatar name={user.displayName || user.email || 'Guest'} className="w-6 h-6 border border-slate-200" />
                <span className="text-xs font-semibold capitalize hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20 font-sans">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="px-2 py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setView('dashboard');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 font-bold"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setView('explore');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Search className="w-4 h-4 text-slate-400" />
                        <span>Explore Societies</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-50 mt-1 pt-1 px-2">
                      {expertProfile && (
                        <button
                          onClick={() => {
                            setView('dashboard');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs text-blue-600 font-bold hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          <span>Expert Workspace</span>
                        </button>
                      )}
                      {userExperts.length < 2 && (
                        <button
                          onClick={() => {
                            setView('become_expert');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{expertProfile ? 'List Another Society' : 'Become a Resident Guide'}</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-50 mt-1 pt-1 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            ref={mobileToggleRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 shadow-inner">
          <button
            onClick={() => {
              onSearchFocus();
              setView('home');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all text-left"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search Neighborhoods</span>
          </button>
          
          <button
            onClick={() => {
              setView('explore');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
              currentView === 'explore'
                ? 'bg-blue-50/70 text-blue-600 font-bold'
                : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
            }`}
          >
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Explore Societies</span>
          </button>
          
          {expertProfile && (
            <button
              onClick={() => {
                setView('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                currentView === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Dashboard</span>
            </button>
          )}

          {userExperts.length < 2 && (
            <button
              onClick={() => {
                setView('become_expert');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                currentView === 'become_expert'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-500" />
              <span>{expertProfile ? 'List Another Society' : 'Become a Resident Guide'}</span>
            </button>
          )}

          {user && (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <button
                onClick={() => {
                  setView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>My Dashboard</span>
                <Check className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Secure Authentication Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="fixed inset-0" onClick={() => {
            setAuthModalOpen(false);
            setAuthError('');
            setAuthSuccess('');
          }} />
          
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>BeforeRegret Authentication</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isSignUp ? 'Create your personal account' : 'Sign in to your account'}
                </p>
              </div>
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold leading-relaxed">
                  ⚠️ {authError}
                </div>
              )}
              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold leading-relaxed">
                  ✅ {authSuccess}
                </div>
              )}

              {isClerkActive ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium bg-blue-50/50 border border-blue-100/30 p-3 rounded-2xl">
                    BeforeRegret secures your account using <strong>Clerk</strong>. Sign in or register instantly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      triggerClerkSignIn();
                      setAuthModalOpen(false);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold tracking-tight transition-all hover:shadow-md cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
                  >
                    <span>Continue with Clerk</span>
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        triggerClerkSignUp();
                        setAuthModalOpen(false);
                      }}
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      Don't have an account? Create one with Clerk &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Vikram Malhotra"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-slate-50/50"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-slate-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md active:scale-98 cursor-pointer"
                  >
                    {isSignUp ? 'Create My Account' : 'Sign In Now'} &rarr;
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account yet? Register Here"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

