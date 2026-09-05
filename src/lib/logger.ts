export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface DeviceSpecs {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  language: string;
  isOnline: boolean;
  cores?: number;
  memory?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
  device?: DeviceSpecs;
}

const LOG_KEY = 'app_system_logs';
const MAX_LOGS = 250;

type LogListener = (logs: LogEntry[]) => void;
const listeners = new Set<LogListener>();

export function getDeviceSpecs(): DeviceSpecs {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'Server',
      platform: 'Server',
      screenWidth: 0,
      screenHeight: 0,
      pixelRatio: 1,
      language: 'km',
      isOnline: true
    };
  }

  const nav = window.navigator as any;
  return {
    userAgent: nav.userAgent || 'Unknown',
    platform: nav.platform || 'Unknown',
    screenWidth: window.screen?.width || window.innerWidth,
    screenHeight: window.screen?.height || window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    language: nav.language || 'km',
    isOnline: nav.onLine ?? true,
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : undefined
  };
}

export const systemLogger = {
  subscribe: (listener: LogListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  log: (level: LogLevel, message: string, details?: any) => {
    try {
      const logs = systemLogger.getLogs();
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level,
        message,
        details,
        device: getDeviceSpecs()
      };
      
      const newLogs = [newLog, ...logs].slice(0, MAX_LOGS);
      localStorage.setItem(LOG_KEY, JSON.stringify(newLogs));
      listeners.forEach(fn => fn(newLogs));
    } catch (err) {
      console.error('Failed to write to system log:', err);
    }
  },
  
  info: (message: string, details?: any) => systemLogger.log('INFO', message, details),
  warn: (message: string, details?: any) => systemLogger.log('WARN', message, details),
  error: (message: string, details?: any) => systemLogger.log('ERROR', message, details),
  
  getLogs: (): LogEntry[] => {
    try {
      const logsStr = localStorage.getItem(LOG_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch {
      return [];
    }
  },
  
  clearLogs: () => {
    try {
      localStorage.removeItem(LOG_KEY);
      listeners.forEach(fn => fn([]));
    } catch (e) {
      console.error(e);
    }
  },

  getStorageUsage: () => {
    try {
      const str = localStorage.getItem(LOG_KEY) || '';
      const bytes = new Blob([str]).size;
      const logs = str ? JSON.parse(str) : [];
      return {
        bytes,
        formatted: bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
        logCount: Array.isArray(logs) ? logs.length : 0
      };
    } catch {
      return { bytes: 0, formatted: '0 KB', logCount: 0 };
    }
  }
};

// Automatic Console Interception to ensure all console.error and console.warn calls
// appear in the in-app System Logs / Console Log viewer
let isConsoleIntercepted = false;

export function initConsoleCapture() {
  if (isConsoleIntercepted || typeof window === 'undefined') return;
  isConsoleIntercepted = true;

  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function (...args: any[]) {
    originalConsoleError.apply(console, args);
    try {
      const message = args.map(arg => {
        if (arg instanceof Error) return arg.message + (arg.stack ? `\n${arg.stack}` : '');
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      // Ignore noise
      if (
        message.includes('WebSocket') || 
        message.includes('vite') || 
        message.includes('ResizeObserver') ||
        message.includes('failed to connect to websocket')
      ) {
        return;
      }

      systemLogger.log('ERROR', message);
    } catch {
      // Avoid recursive loops
    }
  };

  console.warn = function (...args: any[]) {
    originalConsoleWarn.apply(console, args);
    try {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      if (
        message.includes('WebSocket') || 
        message.includes('vite') || 
        message.includes('ResizeObserver') ||
        message.includes('failed to connect to websocket')
      ) {
        return;
      }

      systemLogger.log('WARN', message);
    } catch {
      // Avoid recursive loops
    }
  };
}

// Auto-run on module import in browser
if (typeof window !== 'undefined') {
  initConsoleCapture();
}

