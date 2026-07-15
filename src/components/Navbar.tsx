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
  const { user, loginWithGoogle, logout, expertProfile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleGoogleLogin = async () => {
    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        setView('explore');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Failed to log in', err);
      }
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
              onClick={handleGoogleLogin}
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
    </div>
  );
};

