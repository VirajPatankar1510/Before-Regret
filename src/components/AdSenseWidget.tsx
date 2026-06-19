import React, { useEffect } from 'react';

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
  useEffect(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined') {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense push failed:', err);
    }
  }, [slot]);

  return (
    <div className="w-full flex justify-center my-6 overflow-hidden max-w-full" id={`ad-slot-${slot}`}>
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
