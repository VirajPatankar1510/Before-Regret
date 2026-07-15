import React, { useState, useEffect } from 'react';
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
  const { user, signUpWithEmail, signInWithEmail, loginWithMockUser, logout, expertProfile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication & Testing Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<'buyer' | 'expert'>('buyer');

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
    if (notif.clickAction.includes('buyer_dashboard')) {
      setActiveRole('buyer');
      setView('buyer_dashboard');
    } else if (notif.clickAction.includes('expert_dashboard')) {
      setActiveRole('expert');
      setView('expert_dashboard');
    } else if (notif.clickAction.includes('explore')) {
      setView('explore');
    }
    window.scrollTo(0, 0);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signup') {
        if (!authName.trim()) {
          setAuthError('Please enter your full name.');
          return;
        }
        if (authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters.');
          return;
        }
        const loggedInUser = await signUpWithEmail(authEmail, authPassword, authName.trim());
        if (loggedInUser) {
          setAuthModalOpen(false);
          setView('explore');
          setAuthEmail('');
          setAuthPassword('');
          setAuthName('');
        }
      } else {
        const loggedInUser = await signInWithEmail(authEmail, authPassword);
        if (loggedInUser) {
          setAuthModalOpen(false);
          setView('explore');
          setAuthEmail('');
          setAuthPassword('');
        }
      }
    } catch (err: any) {
      console.error('Email Authentication error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already in use.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Incorrect email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('No user found with this email.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const handleMockLogin = async (presetUser: { uid: string; displayName: string; email: string; photoURL?: string }) => {
    try {
      const loggedInUser = await loginWithMockUser(presetUser);
      if (loggedInUser) {
        setAuthModalOpen(false);
        // Set appropriate role immediately
        if (presetUser.uid.startsWith('user_')) {
          setActiveRole('expert');
          setView('expert_dashboard');
        } else {
          setActiveRole('buyer');
          setView('explore');
        }
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Failed mock login:', err);
    }
  };

  const handleCustomMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const formattedName = customName.trim();
    const uniqueUid = `mock_${Date.now()}`;
    const mockUser = {
      uid: customRole === 'expert' ? 'user_rahul' : uniqueUid, // Mapping expert role to pre-seeded Rahul for dashboard preview
      displayName: formattedName,
      email: `${formattedName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${formattedName}`
    };

    try {
      const loggedInUser = await loginWithMockUser(mockUser);
      if (loggedInUser) {
        setAuthModalOpen(false);
        if (customRole === 'expert') {
          setActiveRole('expert');
          setView('expert_dashboard');
        } else {
          setActiveRole('buyer');
          setView('explore');
        }
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Failed custom mock login:', err);
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
          <button
            onClick={() => setView('explore')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Explore
          </button>
          <button
            onClick={() => { setView('regret_files'); window.scrollTo(0, 0); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentView === 'regret_files' ? 'bg-amber-500 text-slate-900' : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>The Regret Files</span>
          </button>
          <button
            onClick={() => setView('become_expert')}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-semibold"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Become a Local Expert</span>
          </button>
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
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-slate-300 transition-all cursor-pointer bg-slate-50 text-slate-800"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    referrerPolicy="no-referrer" 
                    alt={user.displayName || 'User'} 
                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 font-mono">
                    {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold capitalize hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold uppercase tracking-wider scale-90">
                  {activeRole}
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

                    <div className="px-2 py-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                        Select Active View Mode
                      </div>
                      <button
                        onClick={() => {
                          setActiveRole('buyer');
                          setView('buyer_dashboard');
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${activeRole === 'buyer' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>Buyer Mode (Ask & Track)</span>
                        {activeRole === 'buyer' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setActiveRole('expert');
                          setView('expert_dashboard');
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${activeRole === 'expert' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>Local Expert Mode (Answer)</span>
                        {activeRole === 'expert' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="border-t border-slate-50 mt-1 pt-1 px-2">
                      <button
                        onClick={() => {
                          setView('explore');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Explore Societies
                      </button>
                      <button
                        onClick={() => {
                          setView('become_expert');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Become a Local Expert</span>
                      </button>
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
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 shadow-inner">
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
          
          <button
            onClick={() => {
              setView('regret_files');
              window.scrollTo(0, 0);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
              currentView === 'regret_files'
                ? 'bg-amber-500 text-slate-900 shadow-xs'
                : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>The Regret Files</span>
          </button>
          
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
            <span>Become a Local Expert</span>
          </button>

          {user && (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-1">
                Active Dashboards
              </div>
              <button
                onClick={() => {
                  setActiveRole('buyer');
                  setView('buyer_dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeRole === 'buyer' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Buyer Dashboard</span>
                {activeRole === 'buyer' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setActiveRole('expert');
                  setView('expert_dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeRole === 'expert' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Local Expert Dashboard</span>
                {activeRole === 'expert' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Sandbox & Real Authentication Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="fixed inset-0" onClick={() => setAuthModalOpen(false)} />
          
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>BeforeRegret Authentication</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Sign in to query residents or manage audits</p>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[480px] overflow-y-auto">
              {/* Option A: Email & Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold font-mono flex items-center justify-center">A</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                      setAuthError('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                  </button>
                </div>

                {authError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-600 font-medium">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {authMode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@domain.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <span className="relative px-3 bg-white text-[10px] font-bold text-slate-400 font-mono uppercase">OR</span>
              </div>

              {/* Option B: Sandbox Presets */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold font-mono flex items-center justify-center">B</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">1-Click Sandbox Bypass (Recommended)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Preset 1: Buyer */}
                  <button
                    onClick={() => handleMockLogin({
                      uid: 'mock_buyer_amit',
                      displayName: 'Amit Kumar',
                      email: 'amit.buyer@beforeregret.com',
                      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
                    })}
                    className="p-3.5 border border-slate-100 hover:border-blue-200 bg-slate-50/30 hover:bg-blue-50/10 rounded-2xl transition-all text-left space-y-1.5 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded tracking-wider font-mono">Buyer / Seeker</span>
                      <h4 className="font-bold text-xs text-slate-900 mt-1.5 group-hover:text-blue-600">Amit Kumar</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">Looking for transparent reviews on HSR Layout & Prestige complex.</p>
                    </div>
                    <span className="text-[9px] font-bold text-blue-600 self-end mt-2 group-hover:underline">Login as Buyer &rarr;</span>
                  </button>

                  {/* Preset 2: Expert Rahul */}
                  <button
                    onClick={() => handleMockLogin({
                      uid: 'user_rahul',
                      displayName: 'Rahul K.',
                      email: 'rahul.expert@beforeregret.com',
                      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                    })}
                    className="p-3.5 border border-slate-100 hover:border-emerald-200 bg-slate-50/30 hover:bg-emerald-50/10 rounded-2xl transition-all text-left space-y-1.5 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded tracking-wider font-mono">Resident Expert</span>
                      <h4 className="font-bold text-xs text-slate-900 mt-1.5 group-hover:text-emerald-600">Rahul K.</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">Lives in Prestige Shantiniketan, Bengaluru. Has pre-seeded queries!</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 self-end mt-2 group-hover:underline">Login as Expert &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Divider 2 */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100/50" />
                </div>
                <span className="relative px-3 bg-white text-[9px] font-bold text-slate-300 font-mono uppercase">CUSTOM SESSION</span>
              </div>

              {/* Option C: Custom Mock Account */}
              <form onSubmit={handleCustomMockLogin} className="space-y-3.5 p-4 border border-slate-100 bg-slate-50/20 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Custom Profile Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name (e.g. Vikram Malhotra)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Target Role Experience</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomRole('buyer')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        customRole === 'buyer'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Home Buyer / Seeker
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomRole('expert')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        customRole === 'expert'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Resident Expert
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md active:scale-98 cursor-pointer"
                >
                  Launch Custom Test Session &rarr;
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

