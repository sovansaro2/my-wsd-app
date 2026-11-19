import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCog,
  Shield,
  User as UserIcon,
  Loader2,
  ArrowLeft,
  KeyRound,
  X,
  CheckCircle2,
  Search
} from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { playSuccessSound } from '../lib/sound';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  avatar_url: string | null;
  created_at: string;
}

interface UsersProps {
  onBack?: () => void;
  hideHeader?: boolean;
}

export default function Users({ onBack, hideHeader = false }: UsersProps) {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'advanced'>('list');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: UserProfile;
    newRole: 'admin' | 'user';
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      if (toast.type === 'success') {
        playSuccessSound();
      }
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const adminCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);
  const memberCount = useMemo(() => users.filter(u => u.role !== 'admin').length, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, roleFilter, searchQuery]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getRoleLabel = (role: 'admin' | 'user') => {
    if (language === 'en') {
      return role === 'admin' ? 'Admin' : 'User';
    }
    return role === 'admin' ? 'អ្នកគ្រប់គ្រង' : 'អ្នកប្រើប្រាស់';
  };

  const handleRoleSelect = (user: UserProfile, newRole: 'admin' | 'user') => {
    if (user.role === newRole) return;
    setPendingRoleChange({ user, newRole });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { user, newRole } = pendingRoleChange;

    setIsUpdatingRole(true);
    setUpdatingId(user.id);
    try {
      await api.updateUserRole(user.id, newRole);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      setToast({
        type: 'success',
        message: language === 'km'
          ? `បានប្ដូរសិទ្ធិ "${user.full_name || user.email}" ទៅជា ${getRoleLabel(newRole)}`
          : `Updated role for "${user.full_name || user.email}" to ${getRoleLabel(newRole)}`
      });
      setPendingRoleChange(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setToast({
        type: 'error',
        message: err.message || (language === 'km' ? 'ប្ដូរសិទ្ធិមិនបានសម្រេច' : 'Failed to update role')
      });
    } finally {
      setIsUpdatingRole(false);
      setUpdatingId(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) {
      setResetError(language === 'en' ? 'Minimum 6 characters' : 'យ៉ាងហោចណាស់ ៦ តួអក្សរ');
      return;
    }

    setIsResetting(true);
    setResetError(null);

    try {
      await api.resetUserPassword(resettingUser.id, newPassword);
      setResetSuccess(language === 'en' ? 'Password updated' : 'បានប្ដូរពាក្យសម្ងាត់រួចរាល់');
      setTimeout(() => {
        closeResetModal();
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || (language === 'en' ? 'Failed to reset password' : 'ប្ដូរពាក្យសម្ងាត់មិនបានសម្រេច'));
    } finally {
      setIsResetting(false);
    }
  };

  const closeResetModal = () => {
    if (isResetting) return;
    setResettingUser(null);
    setNewPassword('');
    setResetError(null);
    setResetSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/90 dark:border-slate-800 p-6 space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-11 rounded-lg bg-gray-100 dark:bg-slate-800/70 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pb-20">
      {!hideHeader && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm font-battambang cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {t('common_back')}
        </button>
      )}

      {!hideHeader && (
        <div className="flex items-center gap-3 mb-5">
          <UserCog className="w-6 h-6 text-[#028090] dark:text-teal-400 shrink-0" />
          <div>
            <h2 className="text-xl font-title text-gray-900 dark:text-white">{t('users_title')}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang">{t('users_subtitle')}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/90 dark:border-slate-800 overflow-hidden">
        {/* Compact Summary + Mode Switcher + Search */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-gray-200/80 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Inline Tabular Summary Strip */}
            <div className="flex items-center gap-4 sm:gap-5 text-xs sm:text-sm font-battambang">
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 dark:text-slate-400">{language === 'km' ? 'សរុប' : 'Total'}</span>
                <span className="font-rajdhani font-bold tabular-nums text-base text-gray-900 dark:text-white">{users.length}</span>
              </div>
              <span className="h-3.5 w-px bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 dark:text-slate-400">{language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admins'}</span>
                <span className="font-rajdhani font-bold tabular-nums text-base text-[#028090] dark:text-teal-400">{adminCount}</span>
              </div>
              <span className="h-3.5 w-px bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 dark:text-slate-400">{language === 'km' ? 'អ្នកប្រើប្រាស់' : 'Users'}</span>
                <span className="font-rajdhani font-bold tabular-nums text-base text-gray-700 dark:text-slate-300">{memberCount}</span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-100/90 dark:bg-slate-800/80 border border-gray-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1 text-xs font-battambang rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('users_tab_list')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`px-3 py-1 text-xs font-battambang rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'advanced'
                    ? 'bg-white dark:bg-slate-900 text-[#028090] dark:text-teal-400 font-bold shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('users_tab_advanced')}
              </button>
            </div>
          </div>

          {/* Search & Role Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'km' ? 'ស្វែងរកឈ្មោះ ឬអ៊ីមែល...' : 'Search name or email...'}
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-950/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-battambang focus:outline-none focus:border-[#028090] dark:focus:border-teal-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={language === 'km' ? 'សម្អាត' : 'Clear'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs font-battambang overflow-x-auto">
              {([
                { id: 'all', label: language === 'km' ? 'ទាំងអស់' : 'All' },
                { id: 'admin', label: language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin' },
                { id: 'user', label: language === 'km' ? 'អ្នកប្រើប្រាស់' : 'User' }
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoleFilter(item.id)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    roleFilter === item.id
                      ? 'text-[#028090] dark:text-teal-400 font-bold underline underline-offset-4 decoration-2'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile List */}
        <div className="block sm:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {filteredUsers.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 dark:text-slate-400 font-battambang text-sm">
              {t('common_no_data')}
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <div key={user.id} className="p-3.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-gray-600 dark:text-slate-300 font-rajdhani font-bold text-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-battambang font-bold text-sm text-gray-900 dark:text-white truncate">
                        {user.full_name || t('users_no_name')}
                      </div>
                      <div className="font-rajdhani text-xs text-gray-500 dark:text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-battambang font-medium ${
                      user.role === 'admin'
                        ? 'text-[#028090] dark:text-teal-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                      <span>{getRoleLabel(user.role)}</span>
                    </span>
                    <div className="font-rajdhani tabular-nums text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                      #{index + 1} · {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>

                {activeTab === 'advanced' && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-battambang text-gray-500 dark:text-slate-400">{t('users_col_role')}:</span>
                      {updatingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#028090] dark:text-teal-400" />
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleSelect(user, e.target.value as 'admin' | 'user')}
                          className="bg-transparent border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs rounded-md px-2 py-1 font-battambang outline-none cursor-pointer"
                        >
                          <option value="user" className="dark:bg-slate-900">{t('users_role_user')}</option>
                          <option value="admin" className="dark:bg-slate-900">{t('users_role_admin')}</option>
                        </select>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setResettingUser(user)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-battambang text-gray-700 dark:text-slate-300 hover:text-[#028090] dark:hover:text-teal-400 border border-gray-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{language === 'km' ? 'ប្ដូរកូដ' : 'Reset'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-sm font-battambang">
            <thead className="bg-gray-50/80 dark:bg-slate-950/40 text-xs text-gray-500 dark:text-slate-400 border-b border-gray-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium w-14">{t('users_col_id')}</th>
                <th className="px-4 py-3 font-medium">{t('users_col_name')}</th>
                <th className="px-4 py-3 font-medium">{t('users_col_email')}</th>
                <th className="px-4 py-3 font-medium w-40">{t('users_col_role')}</th>
                <th className="px-4 py-3 font-medium w-32 text-right">{language === 'km' ? 'ថ្ងៃចុះឈ្មោះ' : 'Joined'}</th>
                {activeTab === 'advanced' && (
                  <th className="px-4 py-3 font-medium w-28 text-right">{t('users_col_actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'advanced' ? 6 : 5} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400 font-battambang">
                    {t('common_no_data')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-rajdhani font-semibold tabular-nums text-gray-500 dark:text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-500 dark:text-slate-400 font-rajdhani font-semibold text-xs">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[220px]">
                          {user.full_name || t('users_no_name')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-rajdhani text-gray-600 dark:text-slate-300 select-all">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      {updatingId === user.id && activeTab === 'advanced' ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#028090] dark:text-teal-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'km' ? 'កំពុងប្ដូរ...' : 'Saving...'}</span>
                        </div>
                      ) : activeTab === 'advanced' ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleSelect(user, e.target.value as 'admin' | 'user')}
                          disabled={updatingId === user.id}
                          className="bg-transparent border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs rounded-lg focus:border-[#028090] dark:focus:border-teal-400 px-2.5 py-1.5 font-battambang font-medium outline-none cursor-pointer hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                        >
                          <option value="user" className="dark:bg-slate-900">{t('users_role_user')}</option>
                          <option value="admin" className="dark:bg-slate-900">{t('users_role_admin')}</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'text-[#028090] dark:text-teal-400'
                            : 'text-gray-600 dark:text-slate-400'
                        }`}>
                          {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                          <span>{getRoleLabel(user.role)}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-rajdhani tabular-nums text-xs text-gray-500 dark:text-slate-400">
                      {formatDate(user.created_at)}
                    </td>
                    {activeTab === 'advanced' && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setResettingUser(user)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-battambang text-gray-600 dark:text-slate-300 hover:text-[#028090] dark:hover:text-teal-400 border border-gray-200 dark:border-slate-700 hover:border-[#028090]/50 dark:hover:border-teal-400/50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                          title={language === 'km' ? 'ប្ដូរពាក្យសម្ងាត់' : 'Reset Password'}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'ប្ដូរកូដ' : 'Reset'}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[90] max-w-sm px-4 py-3 rounded-xl border text-xs sm:text-sm font-battambang flex items-center gap-2.5 shadow-md bg-white dark:bg-slate-900 ${
              toast.type === 'success'
                ? 'text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'text-red-700 border-red-200 dark:text-red-400 dark:border-red-800'
                : 'text-gray-700 border-gray-200 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Change Modal */}
      <AnimatePresence>
        {pendingRoleChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden font-battambang"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  {pendingRoleChange.newRole === 'admin' ? (
                    <Shield className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-gray-500 dark:text-slate-400 shrink-0" />
                  )}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {language === 'km' ? 'ប្ដូរតួនាទី' : 'Change Role'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => !isUpdatingRole && setPendingRoleChange(null)}
                  disabled={isUpdatingRole}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 disabled:opacity-50 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2 text-sm border-b border-gray-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{language === 'km' ? 'គណនី' : 'Account'}</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {pendingRoleChange.user.full_name || pendingRoleChange.user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{language === 'km' ? 'តួនាទីថ្មី' : 'New Role'}</span>
                    <span className={`font-semibold ${
                      pendingRoleChange.newRole === 'admin' ? 'text-[#028090] dark:text-teal-400' : 'text-gray-700 dark:text-slate-300'
                    }`}>
                      {getRoleLabel(pendingRoleChange.newRole)}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                  {language === 'km'
                    ? `បញ្ជាក់ប្ដូរតួនាទីទៅជា «${getRoleLabel(pendingRoleChange.newRole)}» មែនទេ?`
                    : `Confirm changing role to "${getRoleLabel(pendingRoleChange.newRole)}"?`}
                </p>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingRoleChange(null)}
                    disabled={isUpdatingRole}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {t('list_cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRoleChange}
                    disabled={isUpdatingRole}
                    className="flex-1 px-4 py-2 bg-[#028090] hover:bg-[#005F73] text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUpdatingRole ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('common_saving')}</span>
                      </>
                    ) : (
                      <span>{language === 'km' ? 'យល់ព្រម' : 'Confirm'}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden font-battambang"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {language === 'km' ? 'ប្ដូរពាក្យសម្ងាត់' : 'Reset Password'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeResetModal}
                  disabled={isResetting}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-4 pb-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-200 font-rajdhani font-bold text-sm shrink-0">
                    {resettingUser.full_name ? resettingUser.full_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {resettingUser.full_name || t('users_no_name')}
                    </div>
                    <div className="text-xs font-rajdhani text-gray-500 dark:text-slate-400 truncate">
                      {resettingUser.email}
                    </div>
                  </div>
                </div>

                {resetSuccess ? (
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2.5" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {resetSuccess}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    {resetError && (
                      <div className="p-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg">
                        {resetError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5">
                        {language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ ខ្ទង់)' : 'New Password (min 6 chars)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-[#028090] dark:focus:border-teal-400 transition-colors font-rajdhani"
                        placeholder="••••••"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={closeResetModal}
                        disabled={isResetting}
                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {t('list_cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting || newPassword.length < 6}
                        className="flex-1 px-4 py-2 bg-[#028090] hover:bg-[#005F73] text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t('common_saving')}</span>
                          </>
                        ) : (
                          t('list_save')
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
