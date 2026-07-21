import React from 'react';

interface ResidentAvatarProps {
  name: string;
  className?: string;
}

export const ResidentAvatar: React.FC<ResidentAvatarProps> = ({ name, className = "w-12 h-12" }) => {
  const normalized = name.toLowerCase().trim();

  // Priya: Beautiful wavy hair, fine elegant round glasses, soft peach-tan skin, warm background
  if (normalized.includes('priya')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#FCEEE3" />
        
        {/* Back Hair (flowing wave) */}
        <path d="M26 48 C16 38, 22 18, 50 16 C78 18, 84 38, 74 48 C70 54, 76 66, 68 72 C58 78, 42 78, 32 72 C24 66, 30 54, 26 48 Z" fill="#9E5345" />

        {/* Ears */}
        <path d="M31 46 C29 46, 29 52, 33 53 Z" fill="#E5967E" />
        <path d="M69 46 C71 46, 71 52, 67 53 Z" fill="#E5967E" />

        {/* Neck */}
        <path d="M43 60 L57 60 L55 78 L45 78 Z" fill="#E5967E" />
        <path d="M43 60 C43 60, 50 67, 57 60 Z" fill="#CE836D" /> {/* Neck shadow */}

        {/* Face */}
        <path d="M33 44 C33 31, 67 31, 67 44 C67 56, 57 63, 50 63 C43 63, 33 56, 33 44 Z" fill="#E5967E" />

        {/* Hair Front/Bangs (soft elegant swoops) */}
        <path d="M31 38 C36 26, 64 26, 69 38 C60 30, 40 30, 31 38 Z" fill="#9E5345" />
        <path d="M31 38 C31 38, 44 32, 50 40 C50 40, 39 28, 31 38 Z" fill="#8C4639" /> {/* Front layer highlight */}

        {/* Glasses */}
        <circle cx="41" cy="45" r="7.5" fill="none" stroke="#3D3231" strokeWidth="1.6" />
        <circle cx="59" cy="45" r="7.5" fill="none" stroke="#3D3231" strokeWidth="1.6" />
        <line x1="48.5" y1="45" x2="51.5" y2="45" stroke="#3D3231" strokeWidth="1.6" />

        {/* Eyebrows */}
        <path d="M35 36 C38 34, 43 34, 46 37" fill="none" stroke="#7A3B30" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M54 37 C57 34, 62 34, 65 36" fill="none" stroke="#7A3B30" strokeWidth="2.5" strokeLinecap="round" />

        {/* Eyes (serene flicked eyeliner style) */}
        <path d="M37 45 C38 43, 43 43, 44 45" fill="none" stroke="#3D3231" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 45 C57 43, 62 43, 63 45" fill="none" stroke="#3D3231" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40.5" cy="45.5" r="1" fill="#3D3231" />
        <circle cx="59.5" cy="45.5" r="1" fill="#3D3231" />

        {/* Nose shadow */}
        <path d="M48 49 Q50 51, 51 50" fill="none" stroke="#CE836D" strokeWidth="2" strokeLinecap="round" />

        {/* Lips */}
        <path d="M44 54 Q50 58, 56 54" fill="none" stroke="#BD7161" strokeWidth="2.5" strokeLinecap="round" />

        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#FDBE8B" />
        <path d="M40 70 C44 76, 56 76, 60 70 Z" fill="#E5967E" />
      </svg>
    );
  }

  // Rahul: Short neat modern hair, square dark acetate glasses, ice-blue style
  if (normalized.includes('rahul')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#E4ECEF" />
        
        {/* Back Hair */}
        <path d="M30 42 C28 30, 36 20, 50 20 C64 20, 72 30, 70 42 Z" fill="#3C3432" />

        {/* Neck */}
        <path d="M43 60 L57 60 L55 78 L45 78 Z" fill="#E29D84" />
        <path d="M43 60 C43 60, 50 67, 57 60 Z" fill="#C9846A" />

        {/* Face */}
        <path d="M33 44 C33 31, 67 31, 67 44 C67 56, 57 63, 50 63 C43 63, 33 56, 33 44 Z" fill="#E29D84" />

        {/* Hair Front */}
        <path d="M30 38 C32 26, 68 26, 70 38 C64 30, 36 30, 30 38 Z" fill="#3C3432" />

        {/* Glasses (square frame style) */}
        <rect x="33" y="41" width="13" height="9" rx="2" fill="none" stroke="#251F1E" strokeWidth="1.8" />
        <rect x="54" y="41" width="13" height="9" rx="2" fill="none" stroke="#251F1E" strokeWidth="1.8" />
        <line x1="46" y1="45" x2="54" y2="45" stroke="#251F1E" strokeWidth="1.8" />

        {/* Eyebrows */}
        <path d="M34 35 Q40 33, 45 35" fill="none" stroke="#3C3432" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M55 35 Q60 33, 66 35" fill="none" stroke="#3C3432" strokeWidth="2.2" strokeLinecap="round" />

        {/* Eyes (calm almond look) */}
        <path d="M36 44 Q40 42, 43 44" fill="none" stroke="#251F1E" strokeWidth="2" strokeLinecap="round" />
        <path d="M57 44 Q60 42, 64 44" fill="none" stroke="#251F1E" strokeWidth="2" strokeLinecap="round" />
        <circle cx="39.5" cy="45" r="1" fill="#251F1E" />
        <circle cx="60.5" cy="45" r="1" fill="#251F1E" />

        {/* Nose shadow */}
        <path d="M48 49 Q50 51, 51 50" fill="none" stroke="#C9846A" strokeWidth="2" strokeLinecap="round" />

        {/* Smile */}
        <path d="M45 54 Q50 57, 55 54" fill="none" stroke="#B05E4E" strokeWidth="2.2" strokeLinecap="round" />

        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#7D8D9C" />
        <path d="M41 70 C44 76, 56 76, 59 70 Z" fill="#E29D84" />
      </svg>
    );
  }

  // Sneha: Sleek bob-cut hair, elegant soft pink style, dangling drop earrings
  if (normalized.includes('sneha')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#EADCDA" />
        
        {/* Back Hair */}
        <path d="M24 48 C20 30, 80 30, 76 48 L74 65 L26 65 Z" fill="#4B2B24" />

        {/* Neck */}
        <path d="M44 60 L56 60 L54 78 L46 78 Z" fill="#E29881" />
        <path d="M44 60 C44 60, 50 67, 56 60 Z" fill="#C57E67" />

        {/* Face */}
        <path d="M33 44 C33 31, 67 31, 67 44 C67 56, 57 63, 50 63 C43 63, 33 56, 33 44 Z" fill="#E29881" />

        {/* Hair Front (chic bob shape) */}
        <path d="M25 44 C25 24, 75 24, 75 44 C75 52, 70 55, 70 47 C70 33, 30 33, 30 47 C30 55, 25 52, 25 44 Z" fill="#4B2B24" />

        {/* Eyebrows */}
        <path d="M35 36 C38 34, 43 34, 46 37" fill="none" stroke="#331A14" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M54 37 C57 34, 62 34, 65 36" fill="none" stroke="#331A14" strokeWidth="2.2" strokeLinecap="round" />

        {/* Eyes (calm vector lines) */}
        <path d="M37 44 Q41 42, 45 44" fill="none" stroke="#331A14" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 44 Q59 42, 63 44" fill="none" stroke="#331A14" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="45" r="1" fill="#331A14" />
        <circle cx="59" cy="45" r="1" fill="#331A14" />

        {/* Nose shadow */}
        <path d="M48 49 Q50 51, 51 50" fill="none" stroke="#C57E67" strokeWidth="2" strokeLinecap="round" />

        {/* Smile */}
        <path d="M44 54 Q50 57, 56 54" fill="none" stroke="#BA6052" strokeWidth="2.2" strokeLinecap="round" />

        {/* Earrings */}
        <circle cx="28" cy="51" r="2" fill="#E9C46A" />
        <circle cx="72" cy="51" r="2" fill="#E9C46A" />

        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#8C9C86" />
        <path d="M40 70 C44 76, 56 76, 60 70 Z" fill="#E29881" />
      </svg>
    );
  }

  // Amit: Gentle beard silhouette, round gold glasses, warm sand background
  if (normalized.includes('amit')) {
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#E9DEC9" />
        
        {/* Back Hair */}
        <path d="M31 40 C30 28, 38 18, 50 18 C62 18, 70 28, 69 40 Z" fill="#543932" />

        {/* Neck */}
        <path d="M43 60 L57 60 L55 78 L45 78 Z" fill="#DF9A83" />

        {/* Face */}
        <path d="M33 44 C33 31, 67 31, 67 44 C67 56, 57 63, 50 63 C43 63, 33 56, 33 44 Z" fill="#DF9A83" />

        {/* Beard (soft vector silhouette) */}
        <path d="M33 44 C33 57, 67 57, 67 44 C67 46, 65 61, 50 61 C35 61, 33 46, 33 44 Z" fill="#543932" />
        <path d="M41 56 Q50 52, 59 56" fill="none" stroke="#543932" strokeWidth="2.8" strokeLinecap="round" />

        {/* Hair Front */}
        <path d="M31 38 C34 28, 66 28, 69 38 C63 30, 37 30, 31 38 Z" fill="#543932" />

        {/* Glasses (thin round frames) */}
        <circle cx="41" cy="43" r="6.5" fill="none" stroke="#85644E" strokeWidth="1.5" />
        <circle cx="59" cy="43" r="6.5" fill="none" stroke="#85644E" strokeWidth="1.5" />
        <line x1="47.5" y1="43" x2="52.5" y2="43" stroke="#85644E" strokeWidth="1.5" />

        {/* Eyebrows */}
        <path d="M35 34 Q40 32, 45 34" fill="none" stroke="#543932" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 34 Q60 32, 65 34" fill="none" stroke="#543932" strokeWidth="2" strokeLinecap="round" />

        {/* Eyes (soft almond vector) */}
        <path d="M37 43 Q41 41, 45 43" fill="none" stroke="#2D1D18" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 43 Q59 41, 63 43" fill="none" stroke="#2D1D18" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="43.5" r="1" fill="#2D1D18" />
        <circle cx="59" cy="43.5" r="1" fill="#2D1D18" />

        {/* Nose shadow */}
        <path d="M48 48 Q50 50, 51 49" fill="none" stroke="#C57D65" strokeWidth="2" strokeLinecap="round" />

        {/* Smile (under mustache line) */}
        <path d="M46 51 Q50 53, 54 51" fill="none" stroke="#DF9A83" strokeWidth="1.5" strokeLinecap="round" />

        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#A68572" />
        <path d="M43 70 L57 70 L50 78 Z" fill="#DF9A83" />
      </svg>
    );
  }

  // Generics (for any other names)
  const code = name.length % 3;
  if (code === 0) {
    // Beautiful generic female updo (curly/textured hair, lilac background)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#DFDBE5" />
        
        {/* Curly High Bun */}
        <circle cx="50" cy="20" r="13" fill="#2E231C" />
        <circle cx="43" cy="23" r="11" fill="#2E231C" />
        <circle cx="57" cy="23" r="11" fill="#2E231C" />
        
        {/* Neck */}
        <path d="M44 60 L56 60 L54 78 L46 78 Z" fill="#C59F7E" />
        <path d="M44 57 L56 57 L50 63 Z" fill="#B48D6C" />
        
        {/* Face */}
        <path d="M33 45 C33 33, 67 33, 67 45 C67 57, 58 63, 50 63 C42 63, 33 57, 33 45 Z" fill="#E4C1A2" />
        
        {/* Hair Fringe */}
        <path d="M30 40 C35 32, 65 32, 70 40 C65 33, 35 33, 30 40 Z" fill="#2E231C" />
        <circle cx="34" cy="36" r="5" fill="#2E231C" />
        <circle cx="42" cy="34" r="5" fill="#2E231C" />
        <circle cx="50" cy="33" r="5" fill="#2E231C" />
        <circle cx="58" cy="34" r="5" fill="#2E231C" />
        <circle cx="66" cy="36" r="5" fill="#2E231C" />
        
        {/* Eyebrows */}
        <path d="M35 37 C38 35, 43 35, 46 38" fill="none" stroke="#2E231C" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 38 C57 35, 62 35, 65 37" fill="none" stroke="#2E231C" strokeWidth="2" strokeLinecap="round" />

        {/* Eyes (calm serene) */}
        <path d="M37 45 Q41 43, 45 45" fill="none" stroke="#2E231C" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 45 Q59 43, 63 45" fill="none" stroke="#2E231C" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="45.5" r="1" fill="#2E231C" />
        <circle cx="59" cy="45.5" r="1" fill="#2E231C" />
        
        {/* Smile */}
        <path d="M45 54 Q50 58, 55 54" fill="none" stroke="#995D53" strokeWidth="2" strokeLinecap="round" />
        
        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#B5836B" />
        <path d="M39 70 C43 76, 57 76, 61 70 Z" fill="#E4C1A2" />
      </svg>
    );
  } else if (code === 1) {
    // Beautiful generic male swept wavy hair (soft aloe sage background)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#D4DFD5" />
        
        {/* Neck */}
        <path d="M43 60 L57 60 L55 78 L45 78 Z" fill="#CC9F7E" />
        
        {/* Face */}
        <path d="M33 45 C33 33, 67 33, 67 45 C67 57, 58 63, 50 63 C42 63, 33 57, 33 45 Z" fill="#E4BA9B" />
        
        {/* Sweep hair */}
        <path d="M30 42 C29 32, 42 22, 54 22 C64 22, 70 29, 69 38 C63 29, 36 29, 30 42 Z" fill="#3D3531" />
        <path d="M45 22 C52 22, 65 24, 72 34 C64 26, 52 25, 45 22 Z" fill="#4D433E" />
        
        {/* Thin wire spectacles */}
        <circle cx="41" cy="44" r="6" fill="none" stroke="#3D3531" strokeWidth="1.5" />
        <circle cx="59" cy="44" r="6" fill="none" stroke="#3D3531" strokeWidth="1.5" />
        <line x1="47" y1="44" x2="53" y2="44" stroke="#3D3531" strokeWidth="1.5" />

        {/* Eyebrows */}
        <path d="M35 34 Q40 32, 45 34" fill="none" stroke="#3D3531" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 34 Q60 32, 65 34" fill="none" stroke="#3D3531" strokeWidth="2" strokeLinecap="round" />
        
        {/* Eyes (soft almond) */}
        <path d="M37 44 Q41 42, 45 44" fill="none" stroke="#3D3531" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 44 Q59 42, 63 44" fill="none" stroke="#3D3531" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="44.5" r="1" fill="#3D3531" />
        <circle cx="59" cy="44.5" r="1" fill="#3D3531" />
        
        {/* Smile */}
        <path d="M45 53 Q50 56, 55 53" fill="none" stroke="#A86A5E" strokeWidth="1.8" strokeLinecap="round" />
        
        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#9C6B61" />
        <path d="M43 70 L57 70 L50 76 Z" fill="#E4BA9B" />
      </svg>
    );
  } else {
    // Beautiful generic female cropped hair (warm cream background, olive tan)
    return (
      <svg viewBox="0 0 100 100" className={`${className} rounded-full overflow-hidden shrink-0 border border-slate-200/30 shadow-xs`} aria-hidden="true">
        {/* Background circle */}
        <rect width="100" height="100" fill="#EBE4D5" />
        
        {/* Neck */}
        <path d="M44 60 L56 60 L54 78 L46 78 Z" fill="#BD8967" />
        <path d="M44 57 L56 57 L50 63 Z" fill="#AC7856" />
        
        {/* Face */}
        <path d="M33 44 C33 32, 67 32, 67 44 C67 56, 58 62, 50 62 C42 62, 33 56, 33 44 Z" fill="#D39F7D" />
        
        {/* Short cropped hair */}
        <path d="M30 42 C27 28, 73 28, 70 42 C67 30, 33 30, 30 42 Z" fill="#201D1E" />
        <path d="M29 38 L32 30 L40 26 L50 25 L60 26 L68 30 L71 38 C71 38, 50 33, 29 38 Z" fill="#201D1E" />
        
        {/* Eyebrows */}
        <path d="M35 34 Q40 32, 45 34" fill="none" stroke="#201D1E" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 34 Q60 32, 65 34" fill="none" stroke="#201D1E" strokeWidth="2" strokeLinecap="round" />

        {/* Eyes */}
        <path d="M37 43 Q41 41, 45 43" fill="none" stroke="#201D1E" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 43 Q59 41, 63 43" fill="none" stroke="#201D1E" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="43.5" r="1" fill="#201D1E" />
        <circle cx="59" cy="43.5" r="1" fill="#201D1E" />
        
        {/* Smile */}
        <path d="M45 52 Q50 56, 55 52" fill="none" stroke="#924B43" strokeWidth="2" strokeLinecap="round" />
        
        {/* Clothing */}
        <path d="M22 92 C22 76, 32 70, 50 70 C68 70, 78 76, 78 92 Z" fill="#586776" />
        <path d="M38 70 C42 76, 58 76, 62 70 Z" fill="#D39F7D" />
      </svg>
    );
  }
};


