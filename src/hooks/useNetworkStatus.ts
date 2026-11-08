import { useState, useEffect } from 'react';
import { isBrowserOnline, subscribeNetworkStatus } from '../lib/offlineStore';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  reconnected: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(isBrowserOnline());
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [reconnected, setReconnected] = useState<boolean>(false);

  useEffect(() => {
    let reconnectTimeout: any = null;

    const unsubscribe = subscribeNetworkStatus((online) => {
      setIsOnline(online);
      if (!online) {
        setWasOffline(true);
        setReconnected(false);
      } else {
        setReconnected(true);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          setReconnected(false);
        }, 4000);
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return { isOnline, wasOffline, reconnected };
}
