
import { 
  getCache, 
  setCache, 
  isBrowserOnline, 
  queueOfflineMutation,
  getOutboxItems,
  getPendingOutboxCount,
  removeOutboxItem,
  clearCompletedOutboxItems,
  type OutboxMethod
} from './offlineStore';

export const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, ''); 

export interface ApiFetchOptions extends RequestInit {
  skipOfflineQueue?: boolean;
}

async function apiFetch(path: string, options: ApiFetchOptions = {}, retries = 1): Promise<any> {
  const token = localStorage.getItem('access_token');
  const rawMethod = (options.method || 'GET').toUpperCase();
  const isGetOrHead = rawMethod === 'GET' || rawMethod === 'HEAD';
  const method = rawMethod as OutboxMethod;
  const isMutationQueueable = 
    path.startsWith('/api/financial-records') ||
    path.startsWith('/api/seil-periods') ||
    path.startsWith('/api/name-lists') ||
    path.startsWith('/api/events');

  // 1. If browser is offline and this is a read request, serve from local IndexedDB cache immediately
  if (isGetOrHead && !isBrowserOnline()) {
    const cached = await getCache(path);
    if (cached !== null && cached !== undefined) {
      console.info(`[apiClient Offline] Serving "${path}" from IndexedDB cache.`);
      return cached;
    }
  }

  // 2. If browser is offline and this is a queueable mutation, store in Outbox and optimistically update local cache
  if (!isGetOrHead && isMutationQueueable && !options.skipOfflineQueue && !isBrowserOnline()) {
    console.info(`[apiClient Offline] Queueing mutation "${method} ${path}" into Outbox.`);
    let parsedBody: any;
    try {
      parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {}
    return await queueOfflineMutation(path, method, parsedBody);
  }

  const controller = new AbortController();
  const timeoutMs = isBrowserOnline() ? 15000 : 3000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.detail || `Request failed with status ${res.status}`;

      if (res.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        const isAuthEndpoint = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/refresh');

        if (refreshToken && !isAuthEndpoint && retries > 0 && isBrowserOnline()) {
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.access_token) {
                localStorage.setItem('access_token', refreshData.access_token);
                if (refreshData.refresh_token) {
                  localStorage.setItem('refresh_token', refreshData.refresh_token);
                }
                clearTimeout(timeoutId);
                return apiFetch(path, options, 0);
              }
            }
          } catch {}
        }

        // Only clear credentials if we are online and server explicitly told us 401
        if (isBrowserOnline()) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('cached_user_profile');
          window.dispatchEvent(new CustomEvent('auth-token-expired'));
        }

        console.warn(`[API 401] ${options.method || 'GET'} ${path}: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.error(`[API ${res.status}] ${options.method || 'GET'} ${path}: ${errorMsg}`, errorData);
      throw new Error(errorMsg);
    }

    const text = await res.text();
    const result = text ? JSON.parse(text) : null;

    // Cache successful GET requests for offline availability
    if (isGetOrHead && result !== null && result !== undefined) {
      setCache(path, result).catch(() => {});
    }

    return result;
  } catch (err: any) {
    // If a GET request fails due to network/timeout, attempt fallback to IndexedDB cache
    if (isGetOrHead) {
      const cached = await getCache(path);
      if (cached !== null && cached !== undefined) {
        console.warn(`[apiClient] Network error for "${path}". Fallback to cached data.`);
        return cached;
      }
    }

    // If a mutation request fails due to sudden network loss, save to offline outbox queue
    if (!isGetOrHead && isMutationQueueable && !options.skipOfflineQueue && (!isBrowserOnline() || err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('network'))) {
      console.warn(`[apiClient] Network dropped during mutation for "${path}". Saving to offline outbox queue.`);
      let parsedBody: any;
      try {
        parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch {}
      return await queueOfflineMutation(path, method, parsedBody);
    }

    if (retries > 0 && isGetOrHead && isBrowserOnline() && (err.name === 'AbortError' || err.message?.includes('fetch') || err.message?.includes('network'))) {
      clearTimeout(timeoutId);
      await new Promise((r) => setTimeout(r, 600));
      return apiFetch(path, options, retries - 1);
    }
    if (err.name === 'AbortError') {
      console.warn(`[API Timeout] ${options.method || 'GET'} ${path}`);
      throw new Error('សំណើមានរយៈពេលយូរពេក (Request timed out)');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T = any>(path: string): Promise<T> => apiFetch(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: any): Promise<T> => apiFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  login: async (email: string, password: string) => {
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res?.user) {
      try {
        localStorage.setItem('cached_user_profile', JSON.stringify(res.user));
      } catch {}
    }
    return res;
  },
  signup: (email: string, password: string, full_name: string, latin_name?: string) => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name, latin_name }) }),
  verifyOtp: (email: string, otp: string) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  verifyPassword: (password: string) => apiFetch('/api/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),
  refresh: (refresh_token: string) => apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  getMe: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    // Check cached profile if offline
    if (!isBrowserOnline()) {
      try {
        const cached = localStorage.getItem('cached_user_profile');
        if (cached) return JSON.parse(cached);
      } catch {}
    }

    try {
      const profile = await apiFetch('/api/auth/me');
      if (profile) {
        try {
          localStorage.setItem('cached_user_profile', JSON.stringify(profile));
        } catch {}
      }
      return profile;
    } catch {
      // Fallback to cached profile if network error occurred
      try {
        const cached = localStorage.getItem('cached_user_profile');
        if (cached) return JSON.parse(cached);
      } catch {}
      return null;
    }
  },

  getNotifications: () => apiFetch('/api/notifications'),
  clearNotifications: () => apiFetch('/api/notifications', { method: 'DELETE' }),

  getSeilPeriods: () => apiFetch('/api/seil-periods'),
  createSeilPeriod: (data: any) => apiFetch('/api/seil-periods', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialRecords: (seil_id: string) => apiFetch(`/api/financial-records?seil_id=${seil_id}`),
  createFinancialRecord: (data: any) => apiFetch('/api/financial-records', { method: 'POST', body: JSON.stringify(data) }),
  deleteFinancialRecord: (id: string) => apiFetch(`/api/financial-records/${id}`, { method: 'DELETE' }),
  updateFinancialRecord: (id: string, data: any) => apiFetch(`/api/financial-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSeilPeriod: (id: string, data: any) => apiFetch(`/api/seil-periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  get100kDonors: () => apiFetch('/api/name-lists/donors-100k'),
  getTopBenefactors: () => apiFetch('/api/name-lists/top-benefactors'),
  getNameListCategories: () => apiFetch('/api/name-lists/categories'),
  createNameListCategory: (data: any) => apiFetch('/api/name-lists/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteNameListCategory: (id: string) => apiFetch(`/api/name-lists/categories/${id}`, { method: 'DELETE' }),
  updateNameListCategory: (id: string, data: any) => apiFetch(`/api/name-lists/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getNameListRecords: (category_id: string) => apiFetch(`/api/name-lists/records?category_id=${category_id}`),
  createNameListRecord: (data: any) => apiFetch('/api/name-lists/records', { method: 'POST', body: JSON.stringify(data) }),
  deleteNameListRecord: (id: string) => apiFetch(`/api/name-lists/records/${id}`, { method: 'DELETE' }),
  updateNameListRecord: (id: string, data: any) => apiFetch(`/api/name-lists/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getUsers: () => apiFetch('/api/profiles'),
  updateUserRole: (id: string, role: string) => apiFetch(`/api/profiles/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  resetUserPassword: (id: string, password: string) => apiFetch(`/api/profiles/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  updateProfile: (data: any) => apiFetch('/api/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),

  verifyBalancePin: (pin: string) => apiFetch('/api/profiles/me/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  updateBalancePin: (new_pin: string, current_pin?: string) => apiFetch('/api/profiles/me/balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, current_pin }) }),
  resetBalancePin: (new_pin: string, password: string) => apiFetch('/api/profiles/me/reset-balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, password }) }),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
    }
    return res.json();
  },

  getEvents: () => apiFetch('/api/events'),
  createEvent: (data: any) => apiFetch('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => apiFetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => apiFetch(`/api/events/${id}`, { method: 'DELETE' }),

  // Outbox & Offline Sync Helpers
  getOutboxItems,
  getPendingOutboxCount,
  removeOutboxItem,
  clearCompletedOutboxItems,
  rawFetch: (path: string, options: RequestInit = {}) => apiFetch(path, { ...options, skipOfflineQueue: true })
};
