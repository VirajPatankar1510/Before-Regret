import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, LogOut, CheckCircle2, Sparkles, 
  ArrowRight, Key, Mail, UserCheck, AlertCircle, Laptop, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup' | 'demo';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin'
}) => {
  const { 
    user, 
    logout, 
    isClerkActive, 
    triggerClerkSignIn, 
    triggerClerkSignUp, 
    loginWithMockUser,
    activeRole,
    setActiveRole
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'demo'>(defaultTab);
  const [showEmbeddedClerk, setShowEmbeddedClerk] = useState(false);
  const [isBypassing, setIsBypassing] = useState(false);
  const [demoRole, setDemoRole] = useState<'buyer' | 'expert'>('buyer');

  if (!isOpen) return null;

  const handleDemoBypass = async () => {
    setIsBypassing(true);
    try {
      const mockUid = `demo_user_${Date.now()}`;
      const isExpert = demoRole === 'expert';
      
      await loginWithMockUser({
        uid: mockUid,
        displayName: isExpert ? 'Demo Property Expert' : 'Demo Homebuyer',
        email: isExpert ? 'expert.demo@beforeregret.com' : 'buyer.demo@beforeregret.com',
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${isExpert ? 'ExpertSeed' : 'BuyerSeed'}`
      });

      if (isExpert) {
        setActiveRole('expert');
      } else {
        setActiveRole('buyer');
      }

      setTimeout(() => {
        setIsBypassing(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error("Demo bypass error:", err);
      setIsBypassing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 text-slate-900 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close Modal"
        >
          ✕
        </button>

        {/* If User is Already Logged In */}
        {user ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-500 overflow-hidden mx-auto shadow-md flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-xl font-serif font-black text-slate-900">
                {user.displayName || 'Authenticated User'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{user.email || 'No email associated'}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user.uid.startsWith('demo_') || user.uid.startsWith('mock_') ? 'Demo Bypass Session' : 'Clerk Authenticated'}</span>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Active Session Role
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setActiveRole('buyer')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                    activeRole === 'buyer'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Property Buyer
                </button>
                <button
                  onClick={() => setActiveRole('expert')}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                    activeRole === 'expert'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Resident Contributor
                </button>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : (
          /* When User is Not Logged In */
          <div className="space-y-6">
            
            {/* Modal Header */}
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-mono font-bold border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Secure Authentication</span>
              </div>
              <h3 className="font-serif text-2xl font-black text-slate-900 tracking-tight">
                Welcome to BeforeRegret
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Sign in with Clerk for full account synchronization or use the instant demo bypass for testing.
              </p>
            </div>

            {/* Embedded Clerk Form Option or Trigger Buttons */}
            {showEmbeddedClerk && isClerkActive ? (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 overflow-hidden flex justify-center">
                  <SignIn routing="virtual" />
                </div>
                <button
                  onClick={() => setShowEmbeddedClerk(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
                >
                  ← Back to standard auth options
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Primary Clerk Authentication Action */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    Option 1: Clerk OAuth &amp; Email Login
                  </span>

                  <button
                    onClick={() => {
                      if (isClerkActive) {
                        triggerClerkSignIn();
                      } else {
                        setShowEmbeddedClerk(true);
                      }
                    }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-blue-200" />
                    <span>Sign In with Clerk</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                  <button
                    onClick={() => {
                      if (isClerkActive) {
                        triggerClerkSignUp();
                      } else {
                        setShowEmbeddedClerk(true);
                      }
                    }}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Create New Clerk Account</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase">
                    <span className="bg-white px-3 text-slate-400 font-bold">OR</span>
                  </div>
                </div>

                {/* Option 2: Demo / Testing Bypass */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                      <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Developer / Demo Testing Bypass</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded uppercase">
                      Instant Access
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                    Bypass Clerk credentials to immediately inspect research reports, contributor dashboards, and seller walkthrough checklists.
                  </p>

                  {/* Role Selector for Demo */}
                  <div className="flex items-center gap-2 bg-white/80 p-1 rounded-xl border border-amber-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDemoRole('buyer')}
                      className={`flex-1 py-1.5 font-bold rounded-lg transition-all text-[11px] ${
                        demoRole === 'buyer' 
                          ? 'bg-amber-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Buyer Persona
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoRole('expert')}
                      className={`flex-1 py-1.5 font-bold rounded-lg transition-all text-[11px] ${
                        demoRole === 'expert' 
                          ? 'bg-amber-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Contributor Persona
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoBypass}
                    disabled={isBypassing}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isBypassing ? (
                      <span>Initializing Demo Session...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Sign In as Demo {demoRole === 'buyer' ? 'Homebuyer' : 'Contributor'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* Footer Notice */}
            <p className="text-[10px] text-slate-400 text-center font-mono leading-relaxed">
              Powered by Clerk Authentication Protocol &amp; BeforeRegret Security.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
