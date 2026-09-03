import React from 'react';

export interface IOSFolderProps {
  size?: number | string;
  className?: string;
  variant?: 'blue' | 'amber' | 'orange' | 'emerald' | 'purple' | 'slate';
  hasPaper?: boolean;
}

export const IOSFolder = React.memo(function IOSFolder({
  size,
  className = 'w-6 h-6',
  variant = 'blue',
  hasPaper = true,
}: IOSFolderProps) {
  // Shared prefix per variant so the browser compiles and caches gradients/filters once
  const idPrefix = `ios-fld-${variant}`;

  const colorThemes = {
    blue: {
      backTop: '#70D7FF',
      backBottom: '#2B8CF7',
      innerPocket: '#166ED8',
      frontTop: '#58C3FF',
      frontBottom: '#0076F5',
      frontHighlight: 'rgba(255, 255, 255, 0.65)',
      frontShadow: 'rgba(0, 70, 160, 0.35)',
      paperBg: '#F8FAFC',
      paperLines: '#CBD5E1',
    },
    amber: {
      backTop: '#FDE047',
      backBottom: '#EAB308',
      innerPocket: '#CA8A04',
      frontTop: '#FACC15',
      frontBottom: '#D97706',
      frontHighlight: 'rgba(255, 255, 255, 0.7)',
      frontShadow: 'rgba(160, 90, 0, 0.35)',
      paperBg: '#FEFCE8',
      paperLines: '#FDE047',
    },
    orange: {
      backTop: '#FDBA74',
      backBottom: '#F97316',
      innerPocket: '#EA580C',
      frontTop: '#FB923C',
      frontBottom: '#EA580C',
      frontHighlight: 'rgba(255, 255, 255, 0.65)',
      frontShadow: 'rgba(180, 50, 0, 0.35)',
      paperBg: '#FFF7ED',
      paperLines: '#FED7AA',
    },
    emerald: {
      backTop: '#6EE7B7',
      backBottom: '#10B981',
      innerPocket: '#059669',
      frontTop: '#34D399',
      frontBottom: '#059669',
      frontHighlight: 'rgba(255, 255, 255, 0.65)',
      frontShadow: 'rgba(4, 90, 60, 0.35)',
      paperBg: '#ECFDF5',
      paperLines: '#A7F3D0',
    },
    purple: {
      backTop: '#D8B4FE',
      backBottom: '#A855F7',
      innerPocket: '#7E22CE',
      frontTop: '#C084FC',
      frontBottom: '#7E22CE',
      frontHighlight: 'rgba(255, 255, 255, 0.65)',
      frontShadow: 'rgba(100, 20, 160, 0.35)',
      paperBg: '#FAF5FF',
      paperLines: '#E9D5FF',
    },
    slate: {
      backTop: '#CBD5E1',
      backBottom: '#64748B',
      innerPocket: '#475569',
      frontTop: '#94A3B8',
      frontBottom: '#475569',
      frontHighlight: 'rgba(255, 255, 255, 0.65)',
      frontShadow: 'rgba(30, 40, 60, 0.35)',
      paperBg: '#F8FAFC',
      paperLines: '#E2E8F0',
    },
  };

  const theme = colorThemes[variant] || colorThemes.blue;

  const styleProps: React.CSSProperties = {};
  if (typeof size === 'number') {
    styleProps.width = `${size}px`;
    styleProps.height = `${(size * 0.82)}px`;
  } else if (typeof size === 'string') {
    styleProps.width = size;
  }

  return (
    <svg
      viewBox="0 0 100 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none shrink-0 ${className}`}
      style={styleProps}
      aria-label="folder"
    >
      <defs>
        {/* Back Cover Gradient */}
        <linearGradient id={`${idPrefix}-backGrad`} x1="50" y1="6" x2="50" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.backTop} />
          <stop offset="100%" stopColor={theme.backBottom} />
        </linearGradient>

        {/* Front Cover Gradient */}
        <linearGradient id={`${idPrefix}-frontGrad`} x1="50" y1="24" x2="50" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.frontTop} />
          <stop offset="100%" stopColor={theme.frontBottom} />
        </linearGradient>

        {/* Inner Pocket Gradient */}
        <linearGradient id={`${idPrefix}-innerGrad`} x1="50" y1="20" x2="50" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.innerPocket} stopOpacity="0.4" />
          <stop offset="100%" stopColor={theme.innerPocket} stopOpacity="0" />
        </linearGradient>

        {/* Paper Sheet Gradient */}
        <linearGradient id={`${idPrefix}-paperGrad`} x1="50" y1="12" x2="50" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={theme.paperBg} />
        </linearGradient>

        {/* Soft Drop Shadow for Front Flap */}
        <filter id={`${idPrefix}-frontShadow`} x="-4" y="20" width="108" height="64" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor={theme.frontShadow} />
        </filter>

        {/* Base Folder Bottom Shadow */}
        <filter id={`${idPrefix}-baseShadow`} x="0" y="0" width="100" height="84" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="rgba(0,0,0,0.12)" />
        </filter>
      </defs>

      <g filter={`url(#${idPrefix}-baseShadow)`}>
        {/* 1. BACK FOLDER BASE WITH TAB */}
        <path
          d="M8 15C8 10.5817 11.5817 7 16 7H37.5C40.8 7 43.8 8.8 45.4 11.6L48.2 16.6C49.3 18.5 51.3 19.7 53.5 19.7H84C88.4183 19.7 92 23.2817 92 27.7V69C92 73.4183 88.4183 77 84 77H16C11.5817 77 8 73.4183 8 69V15Z"
          fill={`url(#${idPrefix}-backGrad)`}
        />

        {/* Back Tab Top Bevel / Shine */}
        <path
          d="M16 8.2H37.5C40.4 8.2 43.1 9.8 44.5 12.3L47.3 17.3C48.7 19.8 51.3 21.3 54.2 21.3H84C87.4 21.3 90.2 24 90.5 27.4"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* 2. INNER POCKET SHADOW */}
        <path
          d="M8 22H92V40C92 40 70 34 50 34C30 34 8 40 8 40V22Z"
          fill={`url(#${idPrefix}-innerGrad)`}
        />

        {/* 3. OPTIONAL PAPER SHEET INSIDE */}
        {hasPaper && (
          <g>
            {/* Paper Sheet */}
            <rect
              x="18"
              y="14"
              width="64"
              height="30"
              rx="4"
              fill={`url(#${idPrefix}-paperGrad)`}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="0.8"
            />
            {/* Paper Subtle Header Line */}
            <line x1="24" y1="21" x2="48" y2="21" stroke={theme.paperLines} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="24" y1="26" x2="62" y2="26" stroke={theme.paperLines} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.7" />
          </g>
        )}

        {/* 4. FRONT FOLDER FLAP (iOS CURVED EXPANDED BODY) */}
        <g filter={`url(#${idPrefix}-frontShadow)`}>
          <path
            d="M6 31.5C6 27.3579 9.35786 24 13.5 24H86.5C90.6421 24 94 27.3579 94 31.5V69.5C94 73.6421 90.6421 77 86.5 77H13.5C9.35786 77 6 73.6421 6 69.5V31.5Z"
            fill={`url(#${idPrefix}-frontGrad)`}
          />
        </g>

        {/* Front Flap Highlight Lip at Top Edge */}
        <path
          d="M13.5 24.8H86.5C89.8 24.8 92.5 27.3 92.8 30.6"
          stroke={theme.frontHighlight}
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Subtle Bottom Inner Bevel / Reflection */}
        <path
          d="M12 75.8H88"
          stroke="rgba(0, 0, 0, 0.15)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
});

export default IOSFolder;
