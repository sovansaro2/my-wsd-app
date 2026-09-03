import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { FontSizeProvider } from './contexts/FontSizeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <FontSizeProvider>
          <ErrorBoundary><App /></ErrorBoundary>
        </FontSizeProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
);
