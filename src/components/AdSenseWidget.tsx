import React, { useEffect, useRef } from 'react';

interface AdSenseWidgetProps {
  slot: string;
  format?: string;
  responsive?: string;
  style?: React.CSSProperties;
}

export default function AdSenseWidget({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' }
}: AdSenseWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: any;

    const initAd = () => {
      try {
        if (typeof window === 'undefined') return;

        const insElement = containerRef.current?.querySelector('ins');
        if (!insElement) return;

        // 1. Avoid double initialization of this specific tag if it was already processed
        if (insElement.getAttribute('data-adsbygoogle-status') === 'done') {
          return;
        }

        // 2. Avoid pushing if available width is 0 to prevent "No slot size for availableWidth=0" error
        const parentWidth = containerRef.current?.offsetWidth;
        if (parentWidth === 0) {
          // Retry later once container or parent is fully rendered and visible
          timeoutId = setTimeout(initAd, 1000);
          return;
        }

        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];

        // 3. Count un-initialized ins tags currently in the DOM to avoid redundant push calls
        // "All 'ins' elements in the DOM with class=adsbygoogle already have ads in them."
        const uninitializedIns = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status="done"])');
        if (uninitializedIns.length > 0) {
          adsbygoogle.push({});
        }
      } catch (err) {
        console.warn('AdSense push failed:', err);
      }
    };

    // Give a small delay for layouts to settle
    timeoutId = setTimeout(initAd, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [slot]);

  return (
    <div ref={containerRef} className="w-full flex justify-center my-6 overflow-hidden max-w-full" id={`ad-slot-${slot}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-6283707600518454"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
