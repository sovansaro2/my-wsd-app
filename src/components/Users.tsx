import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Shield, User as UserIcon, Search, Loader2, ArrowLeft, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/apiClient';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: 'admin' | 'user';
  avatar_url: string | null;
  created_at: string;
}

interface UsersProps {
  onBack?: () => void;
}

export default function Users({ onBack }: UsersProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    if (!window.confirm(`តើអ្នកពិតជាចង់ប្តូរសិទ្ធិអ្នកប្រើប្រាស់នេះទៅជា ${newRole === 'admin' ? 'អ្នកគ្រប់គ្រង' : 'អ្នកប្រើប្រាស់ធម្មតា'} មែនទេ?`)) {
      return;
    }
    
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      alert('មានបញ្ហាក្នុងការប្តូរសិទ្ធិអ្នកប្រើប្រាស់');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || newPassword.length < 6) {
      setResetError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ');
      return;
    }
    
    setIsResetting(true);
    setResetError(null);
    
    try {
      await api.resetUserPassword(resettingUser.id, newPassword);
      setResetSuccess('បានប្ដូរពាក្យសម្ងាត់ដោយជោគជ័យ!');
      setTimeout(() => {
        closeResetModal();
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'មានបញ្ហាក្នុងការប្តូរពាក្យសម្ងាត់');
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

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.phone_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-300">
      {onBack && (
        <button 
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          ត្រឡប់ក្រោយ
        </button>
      )}
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-2xl">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-battambang font-bold text-gray-900 dark:text-white">គ្រប់គ្រងអ្នកប្រើប្រាស់</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">គ្រប់គ្រងសិទ្ធិ និងគណនី</p>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="ស្វែងរកឈ្មោះ អុីមែល ឬលេខទូរស័ព្ទ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-battambang transition-colors text-gray-900 dark:text-white"
        />
      </div>

      {/* Mobile-friendly User List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-gray-500 dark:text-slate-400 font-battambang shadow-sm border border-gray-100 dark:border-slate-700">
              មិនមានទិន្នន័យ
            </div>
          ) : (
            filteredUsers.map((user) => (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4"
              >
                {/* Top: Info */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-xl">
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-gray-900 dark:text-white truncate">
                      {user.full_name || 'គ្មានឈ្មោះ'}
                    </div>
                    <div className="text-[13px] text-gray-500 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                    <div className="text-[12px] text-gray-400 dark:text-slate-500 mt-0.5">
                      បានចុះឈ្មោះ: {new Date(user.created_at).toLocaleDateString('km-KH')}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-battambang ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      <span className="hidden sm:inline">{user.role === 'admin' ? 'អ្នកគ្រប់គ្រង' : 'អ្នកប្រើប្រាស់'}</span>
                      <span className="sm:hidden">{user.role === 'admin' ? 'Admin' : 'User'}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom: Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="flex-1 mr-4">
                    {updatingId === user.id ? (
                      <div className="py-2.5 flex items-center gap-2 text-sm text-orange-500 font-battambang">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        កំពុងរក្សាទុក...
                      </div>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                        disabled={updatingId === user.id}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block w-full max-w-[200px] p-2.5 font-battambang disabled:opacity-50"
                      >
                        <option value="user">អ្នកប្រើប្រាស់</option>
                        <option value="admin">អ្នកគ្រប់គ្រង</option>
                      </select>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setResettingUser(user)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 rounded-xl transition-colors font-battambang whitespace-nowrap"
                  >
                    <KeyRound className="w-4 h-4" />
                    ប្ដូរពាក្យសម្ងាត់
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      {/* Password Reset Modal */}
      <AnimatePresence>
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
                  <h3 className="text-xl font-bold font-battambang text-gray-900 dark:text-white">
                    ប្ដូរពាក្យសម្ងាត់ថ្មី
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
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">
                    {resettingUser.full_name ? resettingUser.full_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {resettingUser.full_name || 'គ្មានឈ្មោះ'}
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
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      ជោគជ័យ!
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
                        ពាក្យសម្ងាត់ថ្មី (យ៉ាងហោច ៦ ខ្ទង់)
                      </label>
                      <input
                        type="text"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow font-battambang"
                        placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeResetModal}
                        disabled={isResetting}
                        className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-battambang disabled:opacity-50"
                      >
                        បោះបង់
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting || newPassword.length < 6}
                        className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors font-battambang disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            កំពុងរក្សាទុក...
                          </>
                        ) : (
                          'រក្សាទុក'
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
