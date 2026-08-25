/// <reference types="vite/client" />

// ប្រើប្រាស់ VITE_API_BASE_URL នៅពេល Deploy ទៅ Netlify ដាច់ដោយឡែកពី Backend
const API_BASE_URL = ''; 

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Request failed');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  login: (email: string, password: string) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email: string, password: string, full_name: string, phone_number?: string) => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name, phone_number }) }),
  verifyOtp: (email: string, otp: string) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  verifyPassword: (password: string) => apiFetch('/api/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),
  getMe: () => apiFetch('/api/auth/me'),

  getNotifications: () => apiFetch('/api/notifications'),

  // Financial
  getSeilPeriods: () => apiFetch('/api/seil-periods'),
  createSeilPeriod: (data: any) => apiFetch('/api/seil-periods', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialRecords: (seil_id: string) => apiFetch(`/api/financial-records?seil_id=${seil_id}`),
  createFinancialRecord: (data: any) => apiFetch('/api/financial-records', { method: 'POST', body: JSON.stringify(data) }),
  deleteFinancialRecord: (id: string) => apiFetch(`/api/financial-records/${id}`, { method: 'DELETE' }),
  updateFinancialRecord: (id: string, data: any) => apiFetch(`/api/financial-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSeilPeriod: (id: string, data: any) => apiFetch(`/api/seil-periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Name Lists
  get100kDonors: () => apiFetch('/api/name-lists/donors-100k'),
  getNameListCategories: () => apiFetch('/api/name-lists/categories'),
  createNameListCategory: (data: any) => apiFetch('/api/name-lists/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteNameListCategory: (id: string) => apiFetch(`/api/name-lists/categories/${id}`, { method: 'DELETE' }),
  updateNameListCategory: (id: string, data: any) => apiFetch(`/api/name-lists/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getNameListRecords: (category_id: string) => apiFetch(`/api/name-lists/records?category_id=${category_id}`),
  createNameListRecord: (data: any) => apiFetch('/api/name-lists/records', { method: 'POST', body: JSON.stringify(data) }),
  deleteNameListRecord: (id: string) => apiFetch(`/api/name-lists/records/${id}`, { method: 'DELETE' }),
  updateNameListRecord: (id: string, data: any) => apiFetch(`/api/name-lists/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Profile
  getUsers: () => apiFetch('/api/profiles'),
  updateUserRole: (id: string, role: string) => apiFetch(`/api/profiles/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  resetUserPassword: (id: string, password: string) => apiFetch(`/api/profiles/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  updateProfile: (data: any) => apiFetch('/api/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),

  verifyBalancePin: (pin: string) => apiFetch('/api/profiles/me/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  updateBalancePin: (new_pin: string, current_pin?: string) => apiFetch('/api/profiles/me/balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, current_pin }) }),
  resetBalancePin: (new_pin: string, password: string) => apiFetch('/api/profiles/me/reset-balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, password }) }),


  // Uploads
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
  }
};
