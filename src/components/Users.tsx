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
}

export default function Users({ onBack }: UsersProps) {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'advanced'>('list');

  // Password Reset State
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    const roleName = newRole === 'admin' ? t('users_role_admin') : t('users_role_user');
    if (!window.confirm(t('users_confirm_role_change', { role: roleName }))) {
      return;
    }
    
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      alert(language === 'en' ? 'Error updating user role' : 'មានបញ្ហាក្នុងការប្តូរសិទ្ធិអ្នកប្រើប្រាស់');
    } finally {
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
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-300 pb-20">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {t('common_back')}
        </button>
      )}
      
      <div className="flex items-center gap-3.5 mb-6">
        <div className="text-orange-500 shrink-0">
          <UserCog className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div>
          <h2 className="text-xl  font-title text-gray-900 dark:text-white uppercase ">{t('users_title')}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">{t('users_subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 text-sm font-medium transition-colors font-battambang relative ${
            activeTab === 'list' 
              ? 'text-orange-600 dark:text-orange-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          User List
          {activeTab === 'list' && (
            <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`pb-3 text-sm font-medium transition-colors font-battambang relative ${
            activeTab === 'advanced' 
              ? 'text-orange-600 dark:text-orange-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Advances
          {activeTab === 'advanced' && (
            <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* User List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 font-battambang whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase text-gray-700 dark:text-gray-300 font-title border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-4 py-4 sm:px-6">ID</th>
                <th className="px-4 py-4 sm:px-6">ឈ្មោះ / Name</th>
                <th className="px-4 py-4 sm:px-6">អ៊ីមែល / Email</th>
                <th className="px-4 py-4 sm:px-6">តួនាទី / Roles</th>
                <th className="px-4 py-4 sm:px-6">ស្ថានភាព / Status</th>
                {activeTab === 'advanced' && (
                  <th className="px-4 py-4 sm:px-6 text-right">សកម្មភាព / Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-battambang">
                    {t('common_no_data')}
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 dark:text-white">
                      #{index + 1}
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] ml-1 block truncate w-16" title={user.id}>{user.id.substring(0, 8)}</span>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-xs font-title">
                          {user.full_name || t('users_no_name')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-[13px]">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      {updatingId === user.id && activeTab === 'advanced' ? (
                        <div className="flex items-center gap-2 text-xs text-orange-500 font-battambang">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          កំពុងរក្សាទុក...
                        </div>
                      ) : activeTab === 'advanced' ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                            disabled={updatingId === user.id}
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-[13px] rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-1.5 font-battambang font-medium min-w-[100px] outline-none"
                          >
                            <option value="user">{t('users_role_user')}</option>
                            <option value="admin">{t('users_role_admin')}</option>
                          </select>
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
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
                        <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Active</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(user.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-GB')}
                      </div>
                    </td>
                    {activeTab === 'advanced' && (
                      <td className="px-4 py-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setResettingUser(user)}
                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:text-gray-500 dark:hover:text-orange-400 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert(language === 'km' ? 'មុខងារលុបមិនទាន់ដំណើរការនៅឡើយទេ!' : 'Delete functionality not implemented yet!')}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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
                  <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-xl">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl  font-title text-gray-900 dark:text-white">
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow font-battambang"
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
                        className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors font-battambang disabled:opacity-70 flex items-center justify-center gap-2"
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
