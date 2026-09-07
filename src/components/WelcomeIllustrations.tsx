import React from 'react';

// Slide 1: Isometric Cloud Storage & Database Architecture
export const CloudDataIllustration: React.FC<{ className?: string }> = ({ className = "w-64 h-56" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 320 280" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cloud and Database Data Architecture"
    >
      <defs>
        <linearGradient id="cloudGrad" x1="60" y1="30" x2="260" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F7FA" />
          <stop offset="1" stopColor="#80DEEA" />
        </linearGradient>
        <linearGradient id="serverTop" x1="110" y1="120" x2="210" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5FF" />
          <stop offset="1" stopColor="#00B4D8" />
        </linearGradient>
        <linearGradient id="serverFrontLeft" x1="110" y1="140" x2="160" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0077B6" />
          <stop offset="1" stopColor="#023E8A" />
        </linearGradient>
        <linearGradient id="serverFrontRight" x1="160" y1="140" x2="210" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0096C7" />
          <stop offset="1" stopColor="#03045E" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background connection grid lines */}
      <g stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 3">
        <path d="M 60 170 L 110 145 M 260 160 L 210 145 M 160 85 L 160 120" />
      </g>

      {/* Floating Cloud */}
      <g filter="url(#glow)">
        <path 
          d="M 210 90 
             C 210 68 192 50 170 50 
             C 152 50 137 62 132 78 
             C 127 75 120 73 113 73 
             C 97 73 83 86 83 102 
             C 83 104 83 106 84 108 
             C 74 113 67 124 67 136 
             C 67 153 81 166 98 166 
             L 215 166 
             C 230 166 242 154 242 139 
             C 242 125 232 114 219 112 
             C 217 99 214 90 210 90 Z" 
          fill="url(#cloudGrad)" 
          fillOpacity="0.95"
        />
        {/* Cloud Inner Shadow / Border */}
        <path 
          d="M 170 52 C 190 52 208 69 208 89 C 213 90 217 98 217 111 C 230 113 240 123 240 137 C 240 151 229 164 215 164 L 98 164 C 83 164 70 152 70 136 C 70 125 76 115 85 110 C 85 88 100 75 115 75 C 122 75 129 78 134 81 C 139 65 153 52 170 52 Z" 
          stroke="#FFFFFF" 
          strokeWidth="2.5" 
          fill="none" 
        />
        {/* Upload Arrow Inside Cloud */}
        <g stroke="#0077B6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 160 140 L 160 100 M 146 114 L 160 100 L 174 114" />
        </g>
      </g>

      {/* Main Database Server (Isometric Tower) */}
      <g transform="translate(0, 30)">
        {/* Layer 1 (Top) */}
        <g>
          {/* Top Face */}
          <polygon points="160,110 210,135 160,160 110,135" fill="url(#serverTop)" />
          {/* Left Face */}
          <polygon points="110,135 160,160 160,180 110,155" fill="url(#serverFrontLeft)" />
          {/* Right Face */}
          <polygon points="160,160 210,135 210,155 160,180" fill="url(#serverFrontRight)" />
          {/* Edge highlights */}
          <line x1="160" y1="160" x2="160" y2="180" stroke="#00E5FF" strokeWidth="1.5" />
          {/* LED lights */}
          <circle cx="125" cy="148" r="2.5" fill="#69F0AE" filter="url(#glow)" />
          <circle cx="135" cy="153" r="2.5" fill="#69F0AE" filter="url(#glow)" />
          <line x1="172" y1="165" x2="198" y2="152" stroke="#48CAE4" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Layer 2 (Middle) */}
        <g transform="translate(0, 26)">
          <polygon points="160,110 210,135 160,160 110,135" fill="#00B4D8" fillOpacity="0.8" />
          <polygon points="110,135 160,160 160,180 110,155" fill="url(#serverFrontLeft)" />
          <polygon points="160,160 210,135 210,155 160,180" fill="url(#serverFrontRight)" />
          <line x1="160" y1="160" x2="160" y2="180" stroke="#00E5FF" strokeWidth="1.5" />
          <circle cx="125" cy="148" r="2.5" fill="#FFD166" filter="url(#glow)" />
          <circle cx="135" cy="153" r="2.5" fill="#69F0AE" filter="url(#glow)" />
          <line x1="172" y1="165" x2="198" y2="152" stroke="#48CAE4" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Layer 3 (Bottom) */}
        <g transform="translate(0, 52)">
          <polygon points="160,110 210,135 160,160 110,135" fill="#0096C7" fillOpacity="0.8" />
          <polygon points="110,135 160,160 160,180 110,155" fill="url(#serverFrontLeft)" />
          <polygon points="160,160 210,135 210,155 160,180" fill="url(#serverFrontRight)" />
          <line x1="160" y1="160" x2="160" y2="180" stroke="#00E5FF" strokeWidth="1.5" />
          <circle cx="125" cy="148" r="2.5" fill="#69F0AE" filter="url(#glow)" />
          <circle cx="135" cy="153" r="2.5" fill="#69F0AE" filter="url(#glow)" />
          <line x1="172" y1="165" x2="198" y2="152" stroke="#48CAE4" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>

      {/* Peripheral Data Nodes */}
      {/* Left Node */}
      <g transform="translate(-40, 60)">
        <polygon points="90,110 115,122 90,135 65,122" fill="#E0F7FA" />
        <polygon points="65,122 90,135 90,147 65,134" fill="#0077B6" />
        <polygon points="90,135 115,122 115,134 90,147" fill="#0096C7" />
        <line x1="115" y1="130" x2="150" y2="148" stroke="#00E5FF" strokeWidth="2" strokeDasharray="3 3" />
      </g>

      {/* Right Node */}
      <g transform="translate(130, 45)">
        <polygon points="90,110 115,122 90,135 65,122" fill="#E0F7FA" />
        <polygon points="65,122 90,135 90,147 65,134" fill="#0077B6" />
        <polygon points="90,135 115,122 115,134 90,147" fill="#0096C7" />
        <line x1="65" y1="130" x2="30" y2="148" stroke="#00E5FF" strokeWidth="2" strokeDasharray="3 3" />
      </g>
    </svg>
  );
};

// Slide 2: Isometric Analytics, Financial Charts & Dashboard
export const AnalyticsIllustration: React.FC<{ className?: string }> = ({ className = "w-64 h-56" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 320 280" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Financial and Statistical Dashboard"
    >
      <defs>
        <linearGradient id="boardGrad" x1="50" y1="40" x2="270" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F0FDFA" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#00B4D8" />
          <stop offset="1" stopColor="#0077B6" />
        </linearGradient>
        <linearGradient id="barAccent" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#00E5FF" />
          <stop offset="1" stopColor="#0096C7" />
        </linearGradient>
        <filter id="dashShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#003540" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Main Isometric Dashboard Window */}
      <g filter="url(#dashShadow)">
        {/* Main Board Base */}
        <polygon 
          points="160,35 285,100 160,170 35,100" 
          fill="url(#boardGrad)" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
        />
        <polygon 
          points="35,100 160,170 160,182 35,112" 
          fill="#005F73" 
        />
        <polygon 
          points="160,170 285,100 285,112 160,182" 
          fill="#0A9396" 
        />

        {/* Dashboard Top Header Bar */}
        <polygon 
          points="160,42 275,102 245,118 160,72" 
          fill="#005F73" 
          fillOpacity="0.1" 
        />
        <circle cx="65" cy="98" r="3" fill="#EF4444" />
        <circle cx="75" cy="93" r="3" fill="#F59E0B" />
        <circle cx="85" cy="88" r="3" fill="#10B981" />

        {/* Bar Chart 3D Columns */}
        {/* Column 1 */}
        <g transform="translate(105, 75)">
          <polygon points="12,18 24,12 24,4 12,10" fill="#00E5FF" />
          <polygon points="0,24 12,18 12,40 0,46" fill="url(#barTeal)" />
          <polygon points="12,18 24,12 24,34 12,40" fill="url(#barAccent)" />
        </g>

        {/* Column 2 (Taller) */}
        <g transform="translate(125, 62)">
          <polygon points="12,18 24,12 24,0 12,6" fill="#00E5FF" />
          <polygon points="0,24 12,18 12,50 0,56" fill="url(#barTeal)" />
          <polygon points="12,18 24,12 24,44 12,50" fill="url(#barAccent)" />
        </g>

        {/* Column 3 (Highest) */}
        <g transform="translate(145, 48)">
          <polygon points="12,18 24,12 24,-6 12,0" fill="#69F0AE" />
          <polygon points="0,24 12,18 12,64 0,70" fill="#00B4D8" />
          <polygon points="12,18 24,12 24,58 12,64" fill="#0077B6" />
        </g>

        {/* Column 4 */}
        <g transform="translate(165, 58)">
          <polygon points="12,18 24,12 24,2 12,8" fill="#00E5FF" />
          <polygon points="0,24 12,18 12,52 0,58" fill="url(#barTeal)" />
          <polygon points="12,18 24,12 24,46 12,52" fill="url(#barAccent)" />
        </g>
      </g>

      {/* Floating Donut Chart Card (Right Foreground) */}
      <g transform="translate(170, 110)" filter="url(#dashShadow)">
        {/* Card Base */}
        <polygon 
          points="55,0 115,32 55,64 -5,32" 
          fill="#FFFFFF" 
          stroke="#E0F2FE" 
          strokeWidth="1.5" 
        />
        <polygon 
          points="-5,32 55,64 55,72 -5,40" 
          fill="#CBD5E1" 
        />
        <polygon 
          points="55,64 115,32 115,40 55,72" 
          fill="#94A3B8" 
        />
        {/* Isometric Donut Segment */}
        <ellipse cx="55" cy="32" rx="28" ry="15" fill="#028090" />
        <ellipse cx="55" cy="32" rx="14" ry="7.5" fill="#FFFFFF" />
        {/* Metric value indicator */}
        <line x1="25" y1="16" x2="55" y2="6" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Floating Summary Card (Left Foreground) */}
      <g transform="translate(45, 125)" filter="url(#dashShadow)">
        <polygon 
          points="55,0 110,28 55,56 0,28" 
          fill="#FFFFFF" 
          stroke="#E0F2FE" 
          strokeWidth="1.5" 
        />
        <polygon 
          points="0,28 55,56 55,62 0,34" 
          fill="#CBD5E1" 
        />
        <polygon 
          points="55,56 110,28 110,34 55,62" 
          fill="#94A3B8" 
        />
        {/* Mock balance lines */}
        <line x1="20" y1="22" x2="60" y2="42" stroke="#028090" strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="30" x2="80" y2="40" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// Slide 3: Official Temple Administration & Certificates
export const DocumentIllustration: React.FC<{ className?: string }> = ({ className = "w-64 h-56" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 320 280" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Official Temple Document and Certificate Management"
    >
      <defs>
        <linearGradient id="docGrad" x1="70" y1="30" x2="250" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F8FAFC" />
        </linearGradient>
        <filter id="docShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#003540" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Secondary Document Underneath */}
      <g transform="translate(25, -15) rotate(5 160 140)" filter="url(#docShadow)" opacity="0.6">
        <polygon points="160,40 260,95 160,150 60,95" fill="#E2E8F0" />
        <polygon points="60,95 160,150 160,158 60,103" fill="#94A3B8" />
        <polygon points="160,150 260,95 260,103 160,158" fill="#64748B" />
      </g>

      {/* Primary Certificate / Official Letter Document */}
      <g filter="url(#docShadow)">
        {/* Main Sheet */}
        <polygon 
          points="160,45 270,105 160,165 50,105" 
          fill="url(#docGrad)" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
        />
        {/* Thickness Edges */}
        <polygon 
          points="50,105 160,165 160,175 50,115" 
          fill="#005F73" 
        />
        <polygon 
          points="160,165 270,105 270,115 160,175" 
          fill="#0A9396" 
        />

        {/* Gold Border Emblem inside certificate */}
        <polygon 
          points="160,58 252,108 160,152 68,108" 
          fill="none" 
          stroke="#D97706" 
          strokeWidth="1.2" 
          strokeDasharray="4 2" 
        />

        {/* Temple Golden Seal / Stamp in center */}
        <g transform="translate(160, 105)">
          <circle cx="0" cy="0" r="18" fill="#F59E0B" fillOpacity="0.15" stroke="#D97706" strokeWidth="2" />
          <circle cx="0" cy="0" r="13" fill="#FBBF24" fillOpacity="0.3" />
          {/* Dharma Wheel / Lotus Star */}
          <path 
            d="M 0 -9 L 2 -3 L 8 -3 L 3 1 L 5 7 L 0 3 L -5 7 L -3 1 L -8 -3 L -2 -3 Z" 
            fill="#B45309" 
          />
        </g>

        {/* Document Header lines */}
        <line x1="120" y1="72" x2="160" y2="92" stroke="#028090" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="165" y1="88" x2="195" y2="72" stroke="#028090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Text lines (simulated Khmer text) */}
        <line x1="85" y1="112" x2="125" y2="132" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="195" y1="132" x2="235" y2="112" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="105" y1="130" x2="155" y2="152" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="165" y1="152" x2="215" y2="130" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating Download as PDF Badge */}
      <g transform="translate(160, 205)" filter="url(#docShadow)">
        <ellipse cx="0" cy="0" rx="42" ry="18" fill="#028090" />
        <ellipse cx="0" cy="-3" rx="42" ry="18" fill="#00A896" />
        {/* Down Arrow & PDF symbol */}
        <path 
          d="M 0 -11 L 0 5 M -5 0 L 0 5 L 5 0 M -9 8 L 9 8" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>
    </svg>
  );
};
