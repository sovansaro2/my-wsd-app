import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

export const FONT_SIZE_CONFIGS: Record<FontSize, { zoom: number; rootPx: string }> = {
  sm: { zoom: 0.9, rootPx: '14.5px' },
  md: { zoom: 1.0, rootPx: '16px' },
  lg: { zoom: 1.1, rootPx: '17.6px' },
  xl: { zoom: 1.2, rootPx: '19.2px' },
};

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('app_font_size');
    if (saved === 'sm' || saved === 'md' || saved === 'lg' || saved === 'xl') {
      return saved;
    }
    return 'md';
  });

  useEffect(() => {
    localStorage.setItem('app_font_size', fontSize);
    const config = FONT_SIZE_CONFIGS[fontSize] || FONT_SIZE_CONFIGS.md;
    
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.style.setProperty('--app-font-size', config.rootPx);

    // Apply zoom on html element for clean, proportional scaling across all viewport dimensions
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '1')) {
      (document.documentElement.style as any).zoom = String(config.zoom);
    } else {
      document.documentElement.style.fontSize = config.rootPx;
    }
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
