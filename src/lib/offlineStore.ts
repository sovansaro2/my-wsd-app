import localforage from 'localforage';

// Dedicated IndexedDB store for caching read-only data for Offline usage
const cacheStore = localforage.createInstance({
  name: 'wsd_offline_db',
  storeName: 'api_cache',
  description: 'Cache for Wat Snay Douch API responses during offline mode'
});

// Dedicated IndexedDB store for queuing write operations during Offline mode
const outboxStore = localforage.createInstance({
  name: 'wsd_offline_db',
  storeName: 'sync_outbox',
  description: 'Queue for offline mutations waiting to sync to server'
});

interface CacheEnvelope<T = any> {
  data: T;
  timestamp: number;
}

export type OutboxMethod = 'POST' | 'PUT' | 'DELETE';
export type OutboxStatus = 'pending' | 'syncing' | 'failed' | 'completed';
export type OutboxCategory = 'financial_record' | 'seil_period' | 'namelist' | 'event' | 'other';

export interface OutboxItem {
  id: string;
  url: string;
  method: OutboxMethod;
  body?: any;
  description: string;
  category: OutboxCategory;
  status: OutboxStatus;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  tempId?: string;
}

/**
 * Save data to IndexedDB cache
 */
export async function setCache<T = any>(key: string, data: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now()
    };
    await cacheStore.setItem(key, envelope);
  } catch (error) {
    console.warn(`[OfflineStore] Failed to cache key "${key}":`, error);
  }
}

/**
 * Retrieve cached data from IndexedDB
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const envelope = await cacheStore.getItem<CacheEnvelope<T>>(key);
    if (!envelope) return null;
    return envelope.data;
  } catch (error) {
    console.warn(`[OfflineStore] Failed to read cached key "${key}":`, error);
    return null;
  }
}

/**
 * Remove a specific key from cache
 */
export async function removeCache(key: string): Promise<void> {
  try {
    await cacheStore.removeItem(key);
  } catch (error) {
    console.warn(`[OfflineStore] Failed to remove key "${key}":`, error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    await cacheStore.clear();
  } catch (error) {
    console.warn('[OfflineStore] Failed to clear cache:', error);
  }
}

/**
 * Check if the browser currently has network connectivity
 */
export function isBrowserOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Subscribe to online/offline state changes
 */
export function subscribeNetworkStatus(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/* =========================================================================
   STAGE 2: OFFLINE OUTBOX & MUTATION QUEUE
   ========================================================================= */

function notifyOutboxChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wsd-outbox-changed'));
  }
}

/**
 * Add a new mutation item to the outbox queue
 */
export async function addOutboxItem(
  item: Omit<OutboxItem, 'id' | 'createdAt' | 'status' | 'retryCount'>
): Promise<OutboxItem> {
  const fullItem: OutboxItem = {
    ...item,
    id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0
  };

  try {
    await outboxStore.setItem(fullItem.id, fullItem);
    notifyOutboxChanged();
  } catch (err) {
    console.error('[OfflineStore] Failed to store outbox item:', err);
  }

  return fullItem;
}

/**
 * Get all outbox items ordered by creation time
 */
export async function getOutboxItems(): Promise<OutboxItem[]> {
  try {
    const items: OutboxItem[] = [];
    await outboxStore.iterate<OutboxItem, void>((value) => {
      if (value) items.push(value);
    });
    return items.sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    console.error('[OfflineStore] Failed to read outbox items:', err);
    return [];
  }
}

/**
 * Get pending outbox items that need to be synchronized
 */
export async function getPendingOutboxItems(): Promise<OutboxItem[]> {
  const all = await getOutboxItems();
  return all.filter((item) => item.status === 'pending' || item.status === 'failed');
}

/**
 * Count how many outbox items are currently pending sync
 */
export async function getPendingOutboxCount(): Promise<number> {
  const pending = await getPendingOutboxItems();
  return pending.length;
}

/**
 * Update a specific outbox item (status, retryCount, lastError, etc.)
 */
export async function updateOutboxItem(id: string, updates: Partial<OutboxItem>): Promise<void> {
  try {
    const item = await outboxStore.getItem<OutboxItem>(id);
    if (!item) return;
    const merged: OutboxItem = { ...item, ...updates };
    await outboxStore.setItem(id, merged);
    notifyOutboxChanged();
  } catch (err) {
    console.error(`[OfflineStore] Failed to update outbox item "${id}":`, err);
  }
}

/**
 * Remove an item from the outbox
 */
export async function removeOutboxItem(id: string): Promise<void> {
  try {
    await outboxStore.removeItem(id);
    notifyOutboxChanged();
  } catch (err) {
    console.error(`[OfflineStore] Failed to remove outbox item "${id}":`, err);
  }
}

/**
 * Clear all completed items from outbox
 */
export async function clearCompletedOutboxItems(): Promise<void> {
  try {
    const items = await getOutboxItems();
    for (const item of items) {
      if (item.status === 'completed') {
        await outboxStore.removeItem(item.id);
      }
    }
    notifyOutboxChanged();
  } catch (err) {
    console.error('[OfflineStore] Failed to clear completed outbox items:', err);
  }
}

/**
 * Clear all outbox items (for reset/admin purposes)
 */
export async function clearAllOutbox(): Promise<void> {
  try {
    await outboxStore.clear();
    notifyOutboxChanged();
  } catch (err) {
    console.error('[OfflineStore] Failed to clear outbox:', err);
  }
}

/**
 * Subscribe to outbox queue updates
 */
export function subscribeOutbox(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener('wsd-outbox-changed', handler);

  return () => {
    window.removeEventListener('wsd-outbox-changed', handler);
  };
}

/* =========================================================================
   OPTIMISTIC LOCAL CACHE UPDATER FOR OFFLINE MUTATIONS
   ========================================================================= */

/**
 * Queues a mutation into the Outbox and performs optimistic local cache updates
 * so the UI updates instantaneously even with zero network connectivity.
 */
export async function queueOfflineMutation(
  url: string,
  method: OutboxMethod,
  body?: any
): Promise<any> {
  const timestamp = Date.now();
  let description = 'កែសម្រួលទិន្នន័យ (Offline)';
  let category: OutboxCategory = 'other';
  let tempId: string | undefined;
  let synthesizedResponse: any = { success: true, _isOfflineQueued: true };

  // 1. Financial Records
  if (url.startsWith('/api/financial-records')) {
    category = 'financial_record';
    const seilId = body?.seil_id || '';
    const cacheKey = `/api/financial-records?seil_id=${seilId}`;

    if (method === 'POST') {
      tempId = `temp_fin_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
      const donor = body?.donor_name || body?.description || 'បច្ច័យ';
      const amountStr = body?.amount ? `${Number(body.amount).toLocaleString()}៛` : '';
      description = `បញ្ចូលកំណត់ត្រា៖ ${donor} ${amountStr}`.trim();

      const newRecord = {
        id: tempId,
        ...body,
        created_at: body?.record_date || new Date().toISOString(),
        _isOffline: true
      };

      // Optimistically update seil specific cache
      if (seilId) {
        const cached = await getCache<any[]>(cacheKey);
        const list = Array.isArray(cached) ? [...cached] : [];
        list.push(newRecord);
        await setCache(cacheKey, list);
      }

      // Also update generic financial records list if cached
      const allCached = await getCache<any[]>('/api/financial-records?seil_id=');
      if (Array.isArray(allCached)) {
        await setCache('/api/financial-records?seil_id=', [newRecord, ...allCached]);
      }

      synthesizedResponse = newRecord;
    } else if (method === 'PUT') {
      const recordId = url.split('/').pop() || '';
      description = `កែប្រែកំណត់ត្រា៖ ${body?.description || body?.donor_name || recordId}`;

      // Update in cache if found
      if (seilId) {
        const cached = await getCache<any[]>(cacheKey);
        if (Array.isArray(cached)) {
          const updated = cached.map((item) =>
            item.id === recordId ? { ...item, ...body, _isOffline: true } : item
          );
          await setCache(cacheKey, updated);
        }
      }
      synthesizedResponse = { id: recordId, ...body, _isOffline: true };
    } else if (method === 'DELETE') {
      const recordId = url.split('/').pop() || '';
      description = 'លុបកំណត់ត្រាហិរញ្ញវត្ថុ';

      // Iterate over potential cached financial records lists and remove
      if (seilId) {
        const cached = await getCache<any[]>(cacheKey);
        if (Array.isArray(cached)) {
          await setCache(cacheKey, cached.filter((item) => item.id !== recordId));
        }
      }
      synthesizedResponse = { id: recordId, deleted: true, _isOffline: true };
    }
  }

  // 2. Seil Periods
  else if (url.startsWith('/api/seil-periods')) {
    category = 'seil_period';
    const cacheKey = '/api/seil-periods';

    if (method === 'POST') {
      tempId = `temp_seil_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
      description = `បង្កើតកាលបរិច្ឆេទសីល៖ ${body?.name || ''}`;

      const newPeriod = {
        id: tempId,
        ...body,
        created_at: new Date().toISOString(),
        _isOffline: true
      };

      const cached = await getCache<any[]>(cacheKey);
      const list = Array.isArray(cached) ? [newPeriod, ...cached] : [newPeriod];
      await setCache(cacheKey, list);

      synthesizedResponse = newPeriod;
    } else if (method === 'PUT') {
      const periodId = url.split('/').pop() || '';
      description = `កែប្រែកាលបរិច្ឆេទសីល៖ ${body?.name || periodId}`;

      const cached = await getCache<any[]>(cacheKey);
      if (Array.isArray(cached)) {
        const updated = cached.map((p) =>
          p.id === periodId ? { ...p, ...body, _isOffline: true } : p
        );
        await setCache(cacheKey, updated);
      }
      synthesizedResponse = { id: periodId, ...body, _isOffline: true };
    }
  }

  // 3. Name Lists (Donors)
  else if (url.startsWith('/api/name-lists/records')) {
    category = 'namelist';
    const categoryId = body?.category_id || '';
    const cacheKey = `/api/name-lists/records?category_id=${categoryId}`;

    if (method === 'POST') {
      tempId = `temp_nl_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
      const donor = body?.name || '';
      const amountStr = body?.amount ? `${Number(body.amount).toLocaleString()}៛` : '';
      description = `បញ្ចូលឈ្មោះសប្បុរសជន៖ ${donor} ${amountStr}`.trim();

      const newRecord = {
        id: tempId,
        ...body,
        created_at: new Date().toISOString(),
        _isOffline: true
      };

      if (categoryId) {
        const cached = await getCache<any[]>(cacheKey);
        const list = Array.isArray(cached) ? [...cached, newRecord] : [newRecord];
        await setCache(cacheKey, list);
      }
      synthesizedResponse = newRecord;
    } else if (method === 'PUT') {
      const recordId = url.split('/').pop() || '';
      description = `កែប្រែឈ្មោះសប្បុរសជន៖ ${body?.name || recordId}`;

      if (categoryId) {
        const cached = await getCache<any[]>(cacheKey);
        if (Array.isArray(cached)) {
          const updated = cached.map((item) =>
            item.id === recordId ? { ...item, ...body, _isOffline: true } : item
          );
          await setCache(cacheKey, updated);
        }
      }
      synthesizedResponse = { id: recordId, ...body, _isOffline: true };
    } else if (method === 'DELETE') {
      const recordId = url.split('/').pop() || '';
      description = 'លុបឈ្មោះសប្បុរសជន';

      if (categoryId) {
        const cached = await getCache<any[]>(cacheKey);
        if (Array.isArray(cached)) {
          await setCache(cacheKey, cached.filter((item) => item.id !== recordId));
        }
      }
      synthesizedResponse = { id: recordId, deleted: true, _isOffline: true };
    }
  }

  // 4. Buddhist Calendar / Monastery Events
  else if (url.startsWith('/api/events')) {
    category = 'event';
    const cacheKey = '/api/events';

    if (method === 'POST') {
      tempId = `temp_ev_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
      description = `បន្ថែមកម្មវិធីបុណ្យ៖ ${body?.title || ''}`;

      const newEvent = {
        id: tempId,
        ...body,
        created_at: new Date().toISOString(),
        _isOffline: true
      };

      const cached = await getCache<any[]>(cacheKey);
      const list = Array.isArray(cached) ? [...cached, newEvent] : [newEvent];
      await setCache(cacheKey, list);

      synthesizedResponse = newEvent;
    } else if (method === 'PUT') {
      const eventId = url.split('/').pop() || '';
      description = `កែប្រែកម្មវិធីបុណ្យ៖ ${body?.title || eventId}`;

      const cached = await getCache<any[]>(cacheKey);
      if (Array.isArray(cached)) {
        const updated = cached.map((e) =>
          e.id === eventId ? { ...e, ...body, _isOffline: true } : e
        );
        await setCache(cacheKey, updated);
      }
      synthesizedResponse = { id: eventId, ...body, _isOffline: true };
    } else if (method === 'DELETE') {
      const eventId = url.split('/').pop() || '';
      description = 'លុបកម្មវិធីបុណ្យ';

      const cached = await getCache<any[]>(cacheKey);
      if (Array.isArray(cached)) {
        await setCache(cacheKey, cached.filter((e) => e.id !== eventId));
      }
      synthesizedResponse = { id: eventId, deleted: true, _isOffline: true };
    }
  }

  // Add the item to outbox store
  await addOutboxItem({
    url,
    method,
    body,
    description,
    category,
    tempId
  });

  return synthesizedResponse;
}
