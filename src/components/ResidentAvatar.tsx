import React from 'react';

interface ResidentAvatarProps {
  name: string;
  className?: string;
}

export const ResidentAvatar: React.FC<ResidentAvatarProps> = ({ name, className = "w-12 h-12" }) => {
  const normalized = name.toLowerCase().trim();

  // Color palettes inspired by Slack/Airbnb/Notion (soft, modern, pastel)
  if (normalized.includes('priya')) {
    // Beautiful flat vector of Priya (e.g., hair bun, glasses, warm yellow/peach bg)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-amber-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#fef08a" />
        <circle cx="50" cy="53" r="23" fill="#fed7aa" />
        <circle cx="50" cy="22" r="14" fill="#334155" />
        <path d="M27 45 C 32 30, 68 30, 73 45 C 65 33, 35 33, 27 45 Z" fill="#334155" />
        <circle cx="41" cy="51" r="7" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="59" cy="51" r="7" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="48" y1="51" x2="52" y2="51" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="41" cy="51" r="1.5" fill="#1e293b" />
        <circle cx="59" cy="51" r="1.5" fill="#1e293b" />
        <path d="M45 64 Q 50 69, 55 64" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#3b82f6" />
      </svg>
    );
  }

  if (normalized.includes('rahul')) {
    // Beautiful flat vector of Rahul (short neat hair, glasses, light blue background)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-blue-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#bfdbfe" />
        <circle cx="50" cy="53" r="23" fill="#ffedd5" />
        <path d="M 27 46 C 25 32, 75 32, 73 46 C 70 30, 30 30, 27 46 Z" fill="#1e293b" />
        <path d="M 27 46 L 35 34 L 50 31 L 65 34 L 73 46 L 68 52 C 68 52, 50 42, 27 46" fill="#1e293b" />
        <rect x="33" y="47" width="13" height="10" rx="3" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <rect x="54" y="47" width="13" height="10" rx="3" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="46" y1="52" x2="54" y2="52" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="39.5" cy="52" r="1.5" fill="#1e293b" />
        <circle cx="60.5" cy="52" r="1.5" fill="#1e293b" />
        <path d="M44 65 Q 50 70, 56 65" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#10b981" />
      </svg>
    );
  }

  if (normalized.includes('sneha')) {
    // Beautiful flat vector of Sneha (bob cut hair, pink/lavender background)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-pink-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#fbcfe8" />
        <circle cx="50" cy="53" r="23" fill="#ffedd5" />
        <path d="M24 55 C 22 25, 78 25, 76 55 C 76 60, 71 63, 71 50 C 71 35, 29 35, 29 50 C 29 63, 24 60, 24 55 Z" fill="#475569" />
        <ellipse cx="40" cy="51" rx="2" ry="3" fill="#1e293b" />
        <ellipse cx="60" cy="51" rx="2" ry="3" fill="#1e293b" />
        <path d="M43 64 Q 50 70, 57 64" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#f43f5e" />
      </svg>
    );
  }

  if (normalized.includes('amit')) {
    // Beautiful flat vector of Amit (neat beard silhouette, circular glasses, pale green background)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-emerald-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#a7f3d0" />
        <circle cx="50" cy="53" r="23" fill="#ffedd5" />
        <path d="M27 55 C 27 75, 73 75, 73 55 C 73 55, 68 68, 50 68 C 32 68, 27 55, 27 55 Z" fill="#1e293b" />
        <path d="M38 60 Q 50 56, 62 60" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
        <path d="M27 45 C 25 30, 75 30, 73 45 C 70 28, 30 28, 27 45 Z" fill="#1e293b" />
        <circle cx="40" cy="49" r="6.5" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="60" cy="49" r="6.5" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="46.5" y1="49" x2="53.5" y2="49" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="40" cy="49" r="1.5" fill="#1e293b" />
        <circle cx="60" cy="49" r="1.5" fill="#1e293b" />
        <path d="M46 64 Q 50 67, 54 64" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#8b5cf6" />
      </svg>
    );
  }

  // Generics
  const code = name.length % 3;
  if (code === 0) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-purple-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#ddd6fe" />
        <circle cx="50" cy="53" r="23" fill="#fed7aa" />
        <path d="M27 45 C 32 30, 68 30, 73 45 C 65 33, 35 33, 27 45 Z" fill="#334155" />
        <circle cx="41" cy="50" r="2" fill="#1e293b" />
        <circle cx="59" cy="50" r="2" fill="#1e293b" />
        <path d="M44 63 Q 50 68, 56 63" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#f59e0b" />
      </svg>
    );
  } else if (code === 1) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-orange-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#fed7aa" />
        <circle cx="50" cy="53" r="23" fill="#ffedd5" />
        <path d="M 27 46 C 25 32, 75 32, 73 46" fill="none" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
        <circle cx="40" cy="50" r="6" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="60" cy="50" r="6" fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="46" y1="50" x2="54" y2="50" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="40" cy="50" r="1.5" fill="#1e293b" />
        <circle cx="60" cy="50" r="1.5" fill="#1e293b" />
        <path d="M44 64 Q 50 69, 56 64" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#06b6d4" />
      </svg>
    );
  } else {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-indigo-200/50 shadow-2xs`} aria-hidden="true">
        <rect width="100" height="100" fill="#c7d2fe" />
        <circle cx="50" cy="53" r="23" fill="#ffedd5" />
        <circle cx="50" cy="30" r="12" fill="#1e293b" />
        <path d="M27 45 C 32 30, 68 30, 73 45 C 65 33, 35 33, 27 45 Z" fill="#1e293b" />
        <circle cx="41" cy="51" r="2" fill="#1e293b" />
        <circle cx="59" cy="51" r="2" fill="#1e293b" />
        <path d="M45 64 Q 50 68, 55 64" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 90 C 30 76, 70 76, 75 90 Z" fill="#ec4899" />
      </svg>
    );
  }
};
