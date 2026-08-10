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

        {/* Shadow */}
        <ellipse cx="50" cy="90" rx="30" ry="5" fill="rgba(0,0,0,0.4)" filter="blur(4px)" className="hammer-shadow" />

        <g className="hammer-group">
          {/* Handle */}
          <rect x="44" y="45" width="12" height="40" rx="2" fill="url(#handle-grad)" stroke="#0f172a" strokeWidth="1" />
          
          {/* Handle Rings */}
          <rect x="42" y="55" width="16" height="3" fill="#64748b" />
          <rect x="42" y="65" width="16" height="3" fill="#64748b" />
          <rect x="42" y="75" width="16" height="3" fill="#64748b" />
          <rect x="42" y="85" width="16" height="3" fill="#64748b" />

          {/* Pommel */}
          <path d="M40 85 L60 85 L62 90 L38 90 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <circle cx="50" cy="90" r="2" fill="#06b6d4" filter="url(#glow)" className="pommel-glow" />

          {/* Hammer Head Base */}
          <path d="M25 15 L75 15 L85 30 L85 45 L15 45 L15 30 Z" fill="url(#metal-grad)" stroke="#64748b" strokeWidth="1" />
          
          {/* Inner Head Details */}
          <path d="M30 20 L70 20 L78 30 L78 40 L22 40 L22 30 Z" fill="#1e293b" />
          
          {/* Energy Cracks */}
          <path d="M30 20 L35 25 L40 22 L45 35 L42 40" fill="none" stroke="url(#energy-glow)" strokeWidth="1.5" filter="url(#glow)" className="energy-crack" />
          <path d="M60 20 L58 28 L65 32 L62 40" fill="none" stroke="url(#energy-glow)" strokeWidth="1" filter="url(#glow)" className="energy-crack" />
          
          {/* Head Side Bevels */}
          <path d="M15 30 L22 30 L22 40 L15 45 Z" fill="#334155" />
          <path d="M85 30 L78 30 L78 40 L85 45 Z" fill="#0f172a" />
          
          {/* Top Plate */}
          <rect x="35" y="13" width="30" height="4" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
          
          {/* Lightning arcs around hammer */}
          <path d="M10 20 Q5 35 20 45" fill="none" stroke="#06b6d4" strokeWidth="1" filter="url(#glow)" className="lightning-arc arc-1" />
          <path d="M90 20 Q95 35 80 45" fill="none" stroke="#6366f1" strokeWidth="1.5" filter="url(#glow)" className="lightning-arc arc-2" />
        </g>
      </svg>
    </div>
  );
};
