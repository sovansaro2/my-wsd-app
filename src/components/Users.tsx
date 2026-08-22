import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCog, Shield, User as UserIcon, Search, Loader2, ArrowLeft } from 'lucide-react';
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

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider font-battambang">
                  ឈ្មោះអ្នកប្រើប្រាស់
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider font-battambang">
                  ព័ត៌មានទំនាក់ទំនង
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider font-battambang">
                  សិទ្ធិ
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider font-battambang">
                  សកម្មភាព
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              <AnimatePresence>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400 font-battambang">
                      មិនមានទិន្នន័យ
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'គ្មានឈ្មោះ'}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              បានចុះឈ្មោះ: {new Date(user.created_at).toLocaleDateString('km-KH')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{user.phone_number || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-battambang ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                          {user.role === 'admin' ? 'អ្នកគ្រប់គ្រង' : 'អ្នកប្រើប្រាស់'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {updatingId === user.id ? (
                          <div className="flex justify-end pr-4">
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                          </div>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2 font-battambang"
                          >
                            <option value="user">អ្នកប្រើប្រាស់</option>
                            <option value="admin">អ្នកគ្រប់គ្រង</option>
                          </select>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
