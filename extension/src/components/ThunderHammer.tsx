import React from 'react';

interface ThunderHammerProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const ThunderHammer: React.FC<ThunderHammerProps> = ({ size = 32, className = '', animate = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={animate ? { animation: 'hammerFloat 3s ease-in-out infinite' } : undefined}
      role="img"
      aria-label="Thor WMS Thunder Hammer"
    >
      <defs>
        <linearGradient id="hammerHead" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="40%" stopColor="#64748b" />
          <stop offset="70%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="hammerHandle" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="100%" stopColor="#44403c" />
        </linearGradient>
        <linearGradient id="energyGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Hammer head */}
      <rect x="12" y="12" width="40" height="18" rx="3" fill="url(#hammerHead)" stroke="#94a3b8" strokeWidth="0.5" />
      {/* Head bevel */}
      <rect x="14" y="14" width="36" height="14" rx="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      {/* Center rune */}
      <rect x="28" y="14" width="8" height="14" rx="1" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.5" />

      {/* Handle */}
      <rect x="29" y="30" width="6" height="24" rx="2" fill="url(#hammerHandle)" />
      {/* Handle wrap */}
      <line x1="29.5" y1="36" x2="34.5" y2="36" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="29.5" y1="40" x2="34.5" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1="29.5" y1="44" x2="34.5" y2="44" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

      {/* Handle cap */}
      <rect x="27" y="53" width="10" height="3" rx="1.5" fill="#64748b" />

      {/* Energy cracks */}
      <g filter="url(#glow)">
        <path d="M10 16 L6 20 L12 18 L8 24" stroke="url(#energyGlow)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M54 16 L58 20 L52 18 L56 24" stroke="url(#energyGlow)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="21" r="2" fill="rgba(59,130,246,0.6)" />
      </g>
    </svg>
  );
};
