import React, { useEffect } from 'react';
import {
  ShieldCheck, Lock, User, LogOut, CheckCircle2, ArrowRight, UserCheck, Loader2, Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const {
    user,
    loading,
    logout,
    triggerClerkSignIn,
    triggerClerkSignUp,
    requestClerkLoad
  } = useAuth();

  // Defense-in-depth, not the primary trigger -- Navbar's Sign In button (the only thing that
  // opens this modal today) already calls requestClerkLoad() on hover/focus/click, well before
  // this effect would even run. Kept here too since requestClerkLoad is idempotent and this modal
  // could reasonably be opened from somewhere else in the future without that guarantee.
  useEffect(() => {
    if (isOpen) requestClerkLoad();
  }, [isOpen, requestClerkLoad]);

  if (!isOpen) return null;

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

        {/* Auth status not yet known -- Clerk loads on demand now (see AuthContext.tsx), so this
            window is real rather than near-instant. Without this, an already-signed-in visitor
            who clicks Sign In would see the sign-in form for a moment and Sign In would silently
            do nothing until Clerk finishes (triggerClerkSignIn no-ops with just a console.warn
            while clerkInstanceRef is still null). */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs font-medium">Checking your account…</p>
          </div>
        )}

        {/* If User is Already Logged In */}
        {!loading && (user ? (
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
                <span>Signed In</span>
              </div>
            </div>

            {/* Vendors' only way back to /my-ads once they leave the checkout-success page it
                links from -- without this, a signed-in vendor with no bookmark had no path back
                to their own placements anywhere on the site. */}
            {onNavigate && (
              <button
                onClick={() => {
                  onClose();
                  onNavigate('/my-ads');
                }}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Megaphone className="w-4 h-4 text-slate-500" />
                <span>Manage My Ads</span>
              </button>
            )}

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
                Sign in to generate and save your property reports.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => triggerClerkSignIn()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-blue-200" />
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => triggerClerkSignUp()}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Footer Notice */}
            <p className="text-[10px] text-slate-400 text-center font-mono leading-relaxed">
              Your information is kept private and secure.
            </p>

          </div>
        ))}

      </div>
    </div>
  );
};
