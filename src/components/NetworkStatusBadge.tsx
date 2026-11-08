import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLanguage } from '../contexts/LanguageContext';
import { getPendingOutboxCount, subscribeOutbox } from '../lib/offlineStore';

interface NetworkStatusBadgeProps {
  className?: string;
  showWhenOnline?: boolean;
  onClick?: () => void;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  className = '',
  showWhenOnline = false,
  onClick
}) => {
  const { isOnline, reconnected } = useNetworkStatus();
  const { language } = useLanguage();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const updateCount = async () => {
      const count = await getPendingOutboxCount();
      if (isMounted) setPendingCount(count);
    };

    updateCount();
    const unsubscribe = subscribeOutbox(() => {
      updateCount();
    });

    const handleSyncStatus = (e: any) => {
      if (isMounted) {
        setIsSyncing(!!e.detail?.isSyncing);
      }
    };
    window.addEventListener('wsd-sync-status', handleSyncStatus);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('wsd-sync-status', handleSyncStatus);
    };
  }, []);

  // When synchronization is currently running in background
  if (isSyncing) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-xs font-battambang select-none transition-opacity hover:opacity-80 cursor-pointer ${className || 'text-sky-600 dark:text-sky-400'}`}
        title={language === 'en' ? 'Synchronizing data with server...' : 'កំពុងបញ្ជូនទិន្នន័យទៅកាន់ម៉ាស៊ីនមេ...'}
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
        <span className="font-medium text-[11px] sm:text-xs">
          {language === 'en' ? 'Syncing...' : 'កំពុងបញ្ជូន...'}
        </span>
      </button>
    );
  }

  // When there are items waiting in the Outbox queue
  if (pendingCount > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-xs font-battambang select-none transition-opacity hover:opacity-80 cursor-pointer ${className || 'text-amber-600 dark:text-amber-400'}`}
        title={language === 'en' ? `${pendingCount} items waiting to sync (Click to view)` : `ទិន្នន័យ ${pendingCount} រង់ចាំបញ្ជូន (ចុចដើម្បីមើល)`}
      >
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
        <CloudOff className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-medium text-[11px] sm:text-xs">
          {language === 'en' ? 'Outbox' : 'រង់ចាំបញ្ជូន'}
        </span>
        <span className="font-rajdhani font-bold text-xs">
          ({pendingCount})
        </span>
      </button>
    );
  }

  // When connection was just reconnected
  if (reconnected) {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-xs font-battambang select-none animate-fade-in ${onClick ? 'cursor-pointer' : ''} ${className || 'text-emerald-600 dark:text-emerald-400'}`}
        title={language === 'en' ? 'Connection Restored' : 'បានភ្ជាប់អ៊ីនធឺណិតឡើងវិញ'}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi className="w-3.5 h-3.5" />
        <span className="font-medium text-[11px] sm:text-xs">
          {language === 'en' ? 'Online' : 'បានភ្ជាប់ឡើងវិញ'}
        </span>
      </div>
    );
  }

  // When disconnected / offline
  if (!isOnline) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-xs font-battambang select-none animate-pulse ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className || 'text-amber-600 dark:text-amber-400'}`}
        title={language === 'en' ? 'Offline Mode (Local Storage)' : 'ក្រៅបណ្តាញ (ប្រើទិន្នន័យក្នុងម៉ាស៊ីន)'}
      >
        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
        <WifiOff className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <span className="font-medium text-[11px] sm:text-xs">
          {language === 'en' ? 'Offline' : 'ក្រៅបណ្តាញ'}
        </span>
      </button>
    );
  }

  if (!showWhenOnline) return null;

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-battambang select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      title={language === 'en' ? 'Connected Online' : 'ភ្ជាប់អ៊ីនធឺណិត'}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
      <span className="font-medium text-[11px] sm:text-xs opacity-80">
        {language === 'en' ? 'Online' : 'អនឡាញ'}
      </span>
    </div>
  );
};
