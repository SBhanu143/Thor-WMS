import React from 'react';
import './ThunderHammer.css';

export const ThunderHammer: React.FC<{ size?: number; className?: string }> = ({ size = 200, className = '' }) => {
  return (
    <div className={`thunder-hammer-container ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="thunder-hammer-svg"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          
          <linearGradient id="handle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="energy-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 3D Group with perspective */}
        <g className="hammer-3d-group">
          {/* Shadow */}
          <ellipse cx="50" cy="95" rx="28" ry="6" fill="rgba(0,0,0,0.6)" filter="blur(3px)" className="hammer-shadow" />

          {/* Core Handle */}
          <rect x="43" y="40" width="14" height="45" rx="3" fill="url(#handle-grad)" stroke="#0f172a" strokeWidth="1" />
          
          {/* Handle Rings (Textured) */}
          <rect x="41" y="48" width="18" height="4" fill="#64748b" rx="1" />
          <rect x="41" y="58" width="18" height="4" fill="#64748b" rx="1" />
          <rect x="41" y="68" width="18" height="4" fill="#64748b" rx="1" />
          <rect x="41" y="78" width="18" height="4" fill="#64748b" rx="1" />

          {/* Pommel */}
          <path d="M38 85 L62 85 L65 92 L35 92 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <path d="M40 92 L60 92 L58 95 L42 95 Z" fill="#020617" />
          <circle cx="50" cy="93.5" r="2.5" fill="#06b6d4" filter="url(#glow)" className="pommel-glow" />

          {/* Hammer Head Base (Depth) */}
          <path d="M22 18 L78 18 L88 35 L88 50 L12 50 L12 35 Z" fill="url(#metal-grad)" stroke="#94a3b8" strokeWidth="1" />
          
          {/* Inner Head Details */}
          <path d="M28 24 L72 24 L78 35 L78 45 L22 45 L22 35 Z" fill="#1e293b" />
          
          {/* Core Energy Center */}
          <ellipse cx="50" cy="34" rx="15" ry="5" fill="url(#energy-glow)" filter="url(#glow)" className="core-pulse" />
          
          {/* Energy Cracks */}
          <path d="M28 24 L35 30 L42 28 L45 40 L42 45" fill="none" stroke="url(#energy-glow)" strokeWidth="2" filter="url(#glow)" className="energy-crack" />
          <path d="M72 24 L65 32 L68 38 L62 45" fill="none" stroke="url(#energy-glow)" strokeWidth="1.5" filter="url(#glow)" className="energy-crack" />
          
          {/* Head Side Bevels */}
          <path d="M12 35 L22 35 L22 45 L12 50 Z" fill="#334155" />
          <path d="M88 35 L78 35 L78 45 L88 50 Z" fill="#0f172a" />
          
          {/* Top Plate */}
          <rect x="32" y="15" width="36" height="5" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          
          {/* Floating Energy Particles */}
          <circle cx="20" cy="20" r="1.5" fill="#06b6d4" filter="url(#glow)" className="particle p1" />
          <circle cx="80" cy="60" r="1" fill="#3b82f6" filter="url(#glow)" className="particle p2" />
          <circle cx="25" cy="70" r="2" fill="#8b5cf6" filter="url(#glow)" className="particle p3" />
          
          {/* Lightning arcs around hammer */}
          <path d="M5 25 Q15 40 25 55" fill="none" stroke="#06b6d4" strokeWidth="1.5" filter="url(#glow)" className="lightning-arc arc-1" />
          <path d="M95 25 Q85 40 75 55" fill="none" stroke="#6366f1" strokeWidth="2" filter="url(#glow)" className="lightning-arc arc-2" />
        </g>
      </svg>
    </div>
  );
};
