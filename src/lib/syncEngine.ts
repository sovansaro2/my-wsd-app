import { 
  getPendingOutboxItems, 
  updateOutboxItem, 
  removeOutboxItem, 
  getCache, 
  setCache, 
  isBrowserOnline,
  type OutboxItem 
} from './offlineStore';
import { api } from './apiClient';

export interface SyncResult {
  total: number;
  success: number;
  failed: number;
}

class SyncEngine {
  private isRunning: boolean = false;
  private syncTimeout: any = null;

  /**
   * Check if synchronization is currently in progress
   */
  public isSyncing(): boolean {
    return this.isRunning;
  }

  /**
   * Trigger synchronization of all pending outbox items
   */
  public async syncNow(): Promise<SyncResult> {
    if (this.isRunning) {
      console.info('[SyncEngine] Sync is already running, skipping duplicate call.');
      return { total: 0, success: 0, failed: 0 };
    }

    if (!isBrowserOnline()) {
      console.warn('[SyncEngine] Cannot sync: browser is offline.');
      return { total: 0, success: 0, failed: 0 };
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[SyncEngine] Cannot sync: user is not authenticated.');
      return { total: 0, success: 0, failed: 0 };
    }

    this.isRunning = true;
    this.dispatchStatus(true);

    const pendingItems = await getPendingOutboxItems();
    const result: SyncResult = {
      total: pendingItems.length,
      success: 0,
      failed: 0
    };

    if (pendingItems.length === 0) {
      this.isRunning = false;
      this.dispatchStatus(false);
      return result;
    }

    console.info(`[SyncEngine] Starting sync of ${pendingItems.length} items...`);

    // Map to track temporary IDs generated offline to permanent server IDs
    const idMap = new Map<string, string>();

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      // Check if browser went offline mid-sync
      if (!isBrowserOnline()) {
        console.warn('[SyncEngine] Network connection lost during sync. Pausing queue.');
        await updateOutboxItem(item.id, { status: 'pending' });
        break;
      }

      await updateOutboxItem(item.id, { status: 'syncing' });
      this.dispatchProgress(i + 1, pendingItems.length);

      try {
        const synced = await this.processItem(item, idMap);
        if (synced) {
          result.success++;
          // Remove successfully synced item from outbox
          await removeOutboxItem(item.id);
        } else {
          result.failed++;
        }
      } catch (err: any) {
        console.error(`[SyncEngine] Failed syncing item "${item.id}":`, err);
        result.failed++;
        const nextRetry = (item.retryCount || 0) + 1;
        const isPermanentlyFailed = nextRetry >= 3;
        
        await updateOutboxItem(item.id, {
          status: isPermanentlyFailed ? 'failed' : 'pending',
          retryCount: nextRetry,
          lastError: err.message || 'បញ្ជូនមិនបានសម្រេច (Sync Error)'
        });
      }
    }

    this.isRunning = false;
    this.dispatchStatus(false);

    // Notify the rest of the application that sync completed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wsd-sync-completed', { detail: result }));
      // Notify components to re-fetch live data from the server
      window.dispatchEvent(new CustomEvent('wsd-data-refreshed'));
    }

    console.info(`[SyncEngine] Sync completed. Success: ${result.success}, Failed: ${result.failed}`);
    return result;
  }

  /**
   * Process an individual outbox item with cascading ID and conflict resolution
   */
  private async processItem(item: OutboxItem, idMap: Map<string, string>): Promise<boolean> {
    let resolvedUrl = item.url;
    let resolvedBody = item.body ? { ...item.body } : undefined;

    // 1. Resolve cascading temporary IDs in URL
    idMap.forEach((realId, tempId) => {
      if (resolvedUrl.includes(tempId)) {
        resolvedUrl = resolvedUrl.replace(tempId, realId);
      }
    });

    // 2. Resolve cascading temporary IDs in Body
    if (resolvedBody) {
      delete resolvedBody._isOffline;

      // If body has a temporary ID for creation, remove it so the DB generates a UUID
      if (resolvedBody.id && String(resolvedBody.id).startsWith('temp_')) {
        delete resolvedBody.id;
      }

      // Resolve parent foreign keys (seil_id, category_id)
      if (resolvedBody.seil_id && idMap.has(resolvedBody.seil_id)) {
        resolvedBody.seil_id = idMap.get(resolvedBody.seil_id);
      }
      if (resolvedBody.category_id && idMap.has(resolvedBody.category_id)) {
        resolvedBody.category_id = idMap.get(resolvedBody.category_id);
      }
    }

    // 3. For DELETE or PUT operations on temporary items that never made it to server:
    if (item.method === 'DELETE' && item.tempId && !idMap.has(item.tempId)) {
      // The item was created offline and deleted offline; no need to hit the server
      return true;
    }

    // 4. Send HTTP request using api.rawFetch (bypasses offline re-queue)
    try {
      const response = await api.rawFetch(resolvedUrl, {
        method: item.method,
        body: resolvedBody ? JSON.stringify(resolvedBody) : undefined
      });

      // 5. If a new entity was created and returned with a server ID, map it
      if (item.method === 'POST' && response && response.id && item.tempId) {
        idMap.set(item.tempId, response.id);
        await this.updateLocalCachePostSync(item, response);
      }

      return true;
    } catch (err: any) {
      // Conflict Resolution:
      // If resource was already deleted or not found (404) for PUT/DELETE, consider it resolved
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        if (item.method === 'DELETE' || item.method === 'PUT') {
          console.warn(`[SyncEngine Conflict] Target in "${resolvedUrl}" already deleted on server.`);
          return true;
        }
      }

      // If 409 Conflict occurred (concurrent modifications)
      if (err.message?.includes('409') || err.message?.includes('conflict')) {
        console.warn(`[SyncEngine Conflict] Concurrent conflict for "${resolvedUrl}". Server state preserved.`);
        return true;
      }

      throw err;
    }
  }

  /**
   * Replace optimistic temporary records in IndexedDB cache with permanent server responses
   */
  private async updateLocalCachePostSync(item: OutboxItem, serverRecord: any): Promise<void> {
    if (!item.tempId) return;

    try {
      if (item.category === 'financial_record') {
        const seilId = serverRecord.seil_id || item.body?.seil_id;
        if (seilId) {
          const cacheKey = `/api/financial-records?seil_id=${seilId}`;
          const cached = await getCache<any[]>(cacheKey);
          if (Array.isArray(cached)) {
            const updated = cached.map((r) => (r.id === item.tempId ? serverRecord : r));
            await setCache(cacheKey, updated);
          }
        }
      } else if (item.category === 'seil_period') {
        const cacheKey = '/api/seil-periods';
        const cached = await getCache<any[]>(cacheKey);
        if (Array.isArray(cached)) {
          const updated = cached.map((p) => (p.id === item.tempId ? serverRecord : p));
          await setCache(cacheKey, updated);
        }
      } else if (item.category === 'namelist') {
        const catId = serverRecord.category_id || item.body?.category_id;
        if (catId) {
          const cacheKey = `/api/name-lists/records?category_id=${catId}`;
          const cached = await getCache<any[]>(cacheKey);
          if (Array.isArray(cached)) {
            const updated = cached.map((r) => (r.id === item.tempId ? serverRecord : r));
            await setCache(cacheKey, updated);
          }
        }
      } else if (item.category === 'event') {
        const cacheKey = '/api/events';
        const cached = await getCache<any[]>(cacheKey);
        if (Array.isArray(cached)) {
          const updated = cached.map((e) => (e.id === item.tempId ? serverRecord : e));
          await setCache(cacheKey, updated);
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Failed updating local cache post-sync:', e);
    }
  }

  private dispatchStatus(isSyncing: boolean): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wsd-sync-status', { detail: { isSyncing } }));
    }
  }

  private dispatchProgress(current: number, total: number): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wsd-sync-status', { detail: { isSyncing: true, progress: { current, total } } })
      );
    }
  }

  /**
   * Listen to online events and auto-sync in background
   */
  public startBackgroundSyncListener(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      console.info('[SyncEngine] Online detected. Scheduling background sync...');
      if (this.syncTimeout) clearTimeout(this.syncTimeout);
      // Wait 1.5 seconds for connection to stabilize
      this.syncTimeout = setTimeout(() => {
        this.syncNow().catch((e) => console.error('[SyncEngine] Auto sync error:', e));
      }, 1500);
    };

    window.addEventListener('online', handleOnline);

    // Initial check on startup if already online
    if (isBrowserOnline()) {
      handleOnline();
    }

    // Periodic heartbeat sync every 60s
    const interval = setInterval(() => {
      if (isBrowserOnline() && !this.isRunning) {
        this.syncNow().catch(() => {});
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      if (this.syncTimeout) clearTimeout(this.syncTimeout);
      clearInterval(interval);
    };
  }
}

export const syncEngine = new SyncEngine();
