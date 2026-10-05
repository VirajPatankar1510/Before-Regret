import React from 'react';

// The click-to-generate assent notice. It must sit directly under whichever button actually starts
// a report, because assent is only as good as the notice a reasonable person would have seen next
// to the thing they clicked. Shared so the address step (AddressSearchBox, the normal path since
// 2026-10-06) and ReportGatingModal (kept for the daily-limit notice and older sessions) can never
// drift apart. Generating a report is agreeing to the Terms and confirming the declared inputs
// (Terms 3.5-3.6).
export const ReportAssentNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={`text-[11px] text-slate-500 text-center font-normal leading-relaxed ${className}`}>
    By getting this report you agree to our{' '}
    <a href="/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Terms of Service</a>{' '}
    and{' '}
    <a href="/disclaimer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Disclaimer</a>,
    and confirm the property type, year built, and unit number you entered are accurate --
    we use them exactly as given and cannot verify them independently (Terms 3.5-3.6).
    Reports are research material, not a home inspection or professional advice. The Terms
    include a binding arbitration agreement and class action waiver you may opt out of
    within 30 days.
  </p>
);
