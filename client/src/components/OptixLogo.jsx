import React from 'react';

export default function OptixLogo({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="92" stroke="#00E5FF" strokeWidth="4" strokeDasharray="8 6" opacity="0.6" />
      <circle cx="100" cy="100" r="82" stroke="#14B8A6" strokeWidth="2" opacity="0.4" />
      
      {/* Gear teeth ring */}
      <g stroke="#00E5FF" strokeWidth="3" opacity="0.8">
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 68 * Math.cos(angle);
          const y1 = 100 + 68 * Math.sin(angle);
          const x2 = 100 + 78 * Math.cos(angle);
          const y2 = 100 + 78 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />;
        })}
      </g>

      <circle cx="100" cy="100" r="62" fill="url(#optixGrad)" stroke="#00E5FF" strokeWidth="3" />

      {/* Head profile / AI icon outline */}
      <path d="M85 130 C 85 130, 80 110, 85 95 C 90 80, 105 70, 120 75 C 135 80, 140 95, 135 110 C 130 125, 115 135, 100 135 Z" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      
      {/* Brain node dots */}
      <circle cx="100" cy="90" r="4" fill="#00E5FF" />
      <circle cx="115" cy="98" r="4" fill="#9333EA" />
      <circle cx="105" cy="112" r="4" fill="#00E5FF" />
      <line x1="100" y1="90" x2="115" y2="98" stroke="#00E5FF" strokeWidth="2" />
      <line x1="115" y1="98" x2="105" y2="112" stroke="#9333EA" strokeWidth="2" />

      <defs>
        <radialGradient id="optixGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(62)">
          <stop stopColor="#0B132B" />
          <stop offset="0.7" stopColor="#1C2541" />
          <stop offset="1" stopColor="#00E5FF" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  );
}
