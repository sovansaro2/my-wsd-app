import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Shield, User as UserIcon, Loader2, ArrowLeft, KeyRound, X, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';

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

  // Role Change Confirmation State
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: UserProfile;
    newRole: 'admin' | 'user';
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Password Reset State
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
          ? `បានប្តូរសិទ្ធិ "${user.full_name || user.email}" ទៅជា ${newRole === 'admin' ? 'អ្នកគ្រប់គ្រង (Admin)' : 'អ្នកប្រើប្រាស់ (User)'} ដោយជោគជ័យ!`
          : `Successfully changed role for "${user.full_name || user.email}" to ${newRole === 'admin' ? 'Admin' : 'User'}!`
      });
      setPendingRoleChange(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setToast({
        type: 'error',
        message: err.message || (language === 'km' ? 'មានបញ្ហាក្នុងការប្តូរសិទ្ធិអ្នកប្រើប្រាស់' : 'Error updating user role')
      });
    } finally {
      setIsUpdatingRole(false);
      setUpdatingId(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) {
      setResetError(language === 'en' ? 'Password must be at least 6 characters' : 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ');
      return;
    }
    
    setIsResetting(true);
    setResetError(null);
    
    try {
      await api.resetUserPassword(resettingUser.id, newPassword);
      setResetSuccess(language === 'en' ? 'Password updated successfully!' : 'បានប្ដូរពាក្យសម្ងាត់ដោយជោគជ័យ!');
      setTimeout(() => {
        closeResetModal();
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || (language === 'en' ? 'Failed to reset password' : 'មានបញ្ហាក្នុងការប្តូរពាក្យសម្ងាត់'));
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#028090] dark:text-teal-400" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-3 sm:p-4 animate-in fade-in duration-300 pb-24">
      {!hideHeader && onBack && (
        <button 
          onClick={onBack}
          className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm font-battambang"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {t('common_back')}
        </button>
      )}
      
      {!hideHeader && (
        <div className="flex items-center gap-3.5 mb-6">
          <div className="text-[#028090] dark:text-teal-400 shrink-0">
            <UserCog className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h2 className="text-xl font-title text-gray-900 dark:text-white uppercase">{t('users_title')}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang">{t('users_subtitle')}</p>
          </div>
        </div>
      )}

      {/* Tabs / Sub-Controls */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors font-battambang relative ${
              activeTab === 'list' 
                ? 'text-[#028090] dark:text-teal-400 font-bold' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('users_tab_list')}
            {activeTab === 'list' && (
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#028090] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`pb-2.5 text-xs sm:text-sm font-medium transition-colors font-battambang relative ${
              activeTab === 'advanced' 
                ? 'text-[#028090] dark:text-teal-400 font-bold' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('users_tab_advanced')}
            {activeTab === 'advanced' && (
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#028090] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Count badge */}
        <div className="text-xs text-gray-500 dark:text-slate-400 font-battambang flex items-center gap-1.5">
          <span>{language === 'km' ? 'សរុប' : 'Total'}:</span>
          <span className="font-rajdhani font-bold text-gray-900 dark:text-white text-sm">{users.length}</span>
        </div>
      </div>

      {/* Mobile Card List View (< sm) */}
      <div className="block sm:hidden space-y-3 mb-6">
        {users.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center text-gray-500 font-battambang text-sm">
            {t('common_no_data')}
          </div>
        ) : (
          users.map((user, index) => (
            <div 
              key={user.id} 
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3.5 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-rajdhani font-bold text-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                        </span>
                      )}
                    </div>
                    {/* Status dot */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800"></span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-title text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name || t('users_no_name')}
                    </div>
                    <div className="font-rajdhani text-xs text-gray-500 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Role Badge - clean border without filled box */}
                <div className="shrink-0">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-battambang font-medium border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400">
                      <Shield className="w-3 h-3" />
                      <span>{t('users_role_admin')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-battambang font-medium border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
                      <UserIcon className="w-3 h-3" />
                      <span>{t('users_role_user')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-rajdhani text-gray-400 dark:text-slate-500">
                <span>ID: #{index + 1} ({user.id.substring(0, 8)})</span>
                <span>{new Date(user.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-GB')}</span>
              </div>

              {/* Advanced Controls on Mobile */}
              {activeTab === 'advanced' && (
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-battambang text-gray-500 dark:text-slate-400">{t('users_col_role')}:</span>
                    {updatingId === user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#028090] dark:text-teal-400" />
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleSelect(user, e.target.value as 'admin' | 'user')}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs rounded-md px-2 py-1 font-battambang outline-none cursor-pointer"
                      >
                        <option value="user">{t('users_role_user')}</option>
                        <option value="admin">{t('users_role_admin')}</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setResettingUser(user)}
                      className="flex items-center gap-1 p-1.5 text-gray-600 hover:text-[#028090] dark:text-gray-300 dark:hover:text-teal-400 rounded-md transition-colors"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span className="text-xs font-battambang hidden xs:inline">{language === 'km' ? 'ប្ដូរលេខកូដ' : 'Reset'}</span>
                    </button>
                    <button
                      onClick={() => setToast({
                        type: 'info',
                        message: language === 'km' ? 'មុខងារលុបមិនទាន់ដំណើរការនៅឡើយទេ!' : 'Delete functionality is not enabled yet!'
                      })}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-md transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* User List Table (Tablet & Desktop screens >= sm) */}
      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 font-battambang">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase text-gray-700 dark:text-gray-300 font-title border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-4 sm:px-6 w-20">{t('users_col_id')}</th>
                <th className="px-4 py-4 sm:px-6 min-w-[180px]">{t('users_col_name')}</th>
                <th className="px-4 py-4 sm:px-6 min-w-[200px]">{t('users_col_email')}</th>
                <th className="px-4 py-4 sm:px-6 min-w-[140px]">{t('users_col_role')}</th>
                <th className="px-4 py-4 sm:px-6 min-w-[130px]">{t('users_col_status')}</th>
                {activeTab === 'advanced' && (
                  <th className="px-4 py-4 sm:px-6 min-w-[120px] text-right pr-6">{t('users_col_actions')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'advanced' ? 6 : 5} className="px-6 py-8 text-center text-gray-500 font-battambang">
                    {t('common_no_data')}
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-slate-700/60 hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 dark:text-white">
                      <span className="font-rajdhani font-semibold">#{index + 1}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-[11px] font-rajdhani ml-1 block truncate w-16" title={user.id}>{user.id.substring(0, 8)}</span>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 font-rajdhani font-semibold text-xs">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-xs font-title">
                          {user.full_name || t('users_no_name')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-[13px] font-rajdhani select-all">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      {updatingId === user.id && activeTab === 'advanced' ? (
                        <div className="flex items-center gap-2 text-xs text-[#028090] font-battambang">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'km' ? 'កំពុងរក្សាទុក...' : 'Updating...'}</span>
                        </div>
                      ) : activeTab === 'advanced' ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleSelect(user, e.target.value as 'admin' | 'user')}
                            disabled={updatingId === user.id}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-[13px] rounded-lg focus:ring-[#028090] focus:border-[#028090] block p-1.5 font-battambang font-medium min-w-[105px] outline-none cursor-pointer hover:border-gray-300 dark:hover:border-slate-500 transition-colors"
                          >
                            <option value="user">{t('users_role_user')}</option>
                            <option value="admin">{t('users_role_admin')}</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRoleSelect(user, user.role === 'admin' ? 'user' : 'admin')}
                            title={language === 'km' ? 'ចុចដើម្បីប្ដូរសិទ្ធិ' : 'Toggle role'}
                            className="p-1 rounded text-gray-400 hover:text-[#028090] hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium font-battambang ${
                          user.role === 'admin' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                          <span>{user.role === 'admin' ? t('users_role_admin') : t('users_role_user')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[12px] font-medium font-rajdhani text-gray-700 dark:text-gray-300">Active</span>
                      </div>
                      <div className="text-[10px] font-rajdhani text-gray-400 mt-1">
                        {new Date(user.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-GB')}
                      </div>
                    </td>
                    {activeTab === 'advanced' && (
                      <td className="px-4 py-4 sm:px-6 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setResettingUser(user)}
                            className="p-2 text-gray-400 hover:text-[#028090] hover:bg-teal-50 dark:text-gray-500 dark:hover:text-teal-400 dark:hover:bg-teal-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setToast({
                              type: 'info',
                              message: language === 'km' ? 'មុខងារលុបមិនទាន់ដំណើរការនៅឡើយទេ!' : 'Delete functionality is not enabled yet!'
                            })}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[90] max-w-sm px-4 py-3 rounded-xl border text-sm font-battambang flex items-center gap-2.5 shadow-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            )}
            <span className="flex-1 text-xs sm:text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Change Confirmation Modal */}
      <AnimatePresence>
        {pendingRoleChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden font-battambang"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    pendingRoleChange.newRole === 'admin' 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {pendingRoleChange.newRole === 'admin' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {language === 'km' ? 'ផ្លាស់ប្ដូរសិទ្ធិអ្នកប្រើប្រាស់' : 'Change User Role'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                      {pendingRoleChange.user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isUpdatingRole && setPendingRoleChange(null)}
                  disabled={isUpdatingRole}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 text-sm">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 mb-2">
                    <span className="text-xs text-gray-400">{language === 'km' ? 'អ្នកប្រើប្រាស់:' : 'Target User:'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{pendingRoleChange.user.full_name || pendingRoleChange.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-gray-400">{language === 'km' ? 'ប្ដូរទៅជាតួនាទី:' : 'New Role:'}</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      pendingRoleChange.newRole === 'admin' ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {pendingRoleChange.newRole === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                      {pendingRoleChange.newRole === 'admin' ? (language === 'km' ? 'Admin (អ្នកគ្រប់គ្រង)' : 'Admin') : (language === 'km' ? 'User (អ្នកប្រើប្រាស់)' : 'User')}
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  {language === 'km'
                    ? `តើអ្នកពិតជាចង់ប្តូរសិទ្ធិអ្នកប្រើប្រាស់ "${pendingRoleChange.user.full_name || pendingRoleChange.user.email}" ទៅជា "${pendingRoleChange.newRole === 'admin' ? 'Admin (អ្នកគ្រប់គ្រង)' : 'User (អ្នកប្រើប្រាស់)'}" មែនទេ?`
                    : `Are you sure you want to change the role of "${pendingRoleChange.user.full_name || pendingRoleChange.user.email}" to "${pendingRoleChange.newRole === 'admin' ? 'Admin' : 'User'}"?`}
                </p>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingRoleChange(null)}
                    disabled={isUpdatingRole}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                  >
                    {t('list_cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRoleChange}
                    disabled={isUpdatingRole}
                    className="flex-1 px-4 py-2.5 bg-[#028090] hover:bg-[#005F73] text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-[#028090]/25"
                  >
                    {isUpdatingRole ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('common_saving')}</span>
                      </>
                    ) : (
                      <span>{language === 'km' ? 'យល់ព្រមប្ដូរ' : 'Confirm'}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Password Reset Modal */}
      <>
        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="text-[#028090] dark:text-teal-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-title text-gray-900 dark:text-white">
                    {t('users_reset_pwd_title')}
                  </h3>
                </div>
                <button
                  onClick={closeResetModal}
                  disabled={isResetting}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center  text-gray-700 dark:text-gray-200">
                    {resettingUser.full_name ? resettingUser.full_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {resettingUser.full_name || t('users_no_name')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {resettingUser.email}
                    </div>
                  </div>
                </div>

                {resetSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg  text-gray-900 dark:text-white mb-2">
                      {language === 'en' ? 'Success!' : 'ជោគជ័យ!'}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 font-battambang">
                      {resetSuccess}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-5">
                    {resetError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl font-battambang">
                        {resetError}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-battambang">
                        {t('users_new_pwd_ph')}
                      </label>
                      <input
                        type="text"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#028090] focus:border-transparent transition-shadow font-battambang"
                        placeholder={t('users_new_pwd_ph')}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeResetModal}
                        disabled={isResetting}
                        className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-battambang disabled:opacity-50"
                      >
                        {t('list_cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting || newPassword.length < 6}
                        className="flex-1 px-4 py-3 bg-[#028090] hover:bg-[#005F73] text-white rounded-xl font-medium transition-colors font-battambang disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm shadow-[#028090]/25"
                      >
                        {isResetting ? (
                          <div>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('common_saving')}
                          </div>
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
      </>
    </div>
  );
}
