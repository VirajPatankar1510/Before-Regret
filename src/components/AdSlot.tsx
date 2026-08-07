import React, { useEffect, useRef } from 'react';
import { getEnv } from '../context/AuthContext';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  // Name of the VITE_ env var holding this specific ad unit's slot ID (e.g.
  // 'VITE_ADSENSE_SLOT_IN_ARTICLE_TOP'). Passed as a lookup key rather than a raw value so every
  // call site stays self-documenting about which placement it is.
  slotEnvVar: string;
}

const ADSENSE_SCRIPT_ID = 'adsbygoogle-script';

// Renders nothing at all -- not a placeholder box, not a "coming soon" message -- until both the
// account-level client ID and this specific ad unit's slot ID are configured. Same fail-closed
// convention as every other optional integration in this codebase (ADMIN_PASSWORD, GEMINI_API_KEY):
// a missing credential means the feature doesn't exist yet for the visitor, never a broken or
// fabricated stand-in. The client ID and slot IDs are meant to be public (they're embedded in
// plain HTML on every AdSense site), so exposing them via VITE_-prefixed client env vars is
// correct here, unlike server-only secrets such as DATABASE_URL.
export const AdSlot: React.FC<AdSlotProps> = ({ slotEnvVar }) => {
  const clientId = getEnv('VITE_ADSENSE_CLIENT_ID');
  const slotId = getEnv(slotEnvVar);
  const pushedRef = useRef(false);
  const configured = Boolean(clientId && slotId);

  useEffect(() => {
    if (!configured) return;

    // Load Google's AdSense loader once per page, regardless of how many AdSlot instances mount.
    if (!document.getElementById(ADSENSE_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Ask AdSense to fill this specific unit. Guarded so a re-render never pushes the same <ins>
    // twice, which AdSense logs as an error.
    if (!pushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        // Script may not have loaded yet on a fast re-render; safe to ignore -- it fills once
        // the script arrives.
      }
    }
  }, [configured, clientId]);

  if (!configured) return null;

  return (
    <div className="space-y-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
        Advertisement
      </span>
      <ins
        className="adsbygoogle block min-h-[100px]"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
