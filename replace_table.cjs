const fs = require('fs');
const content = fs.readFileSync('src/components/Users.tsx', 'utf8');

const target = `      {/* User List */}
      <div className="grid grid-cols-1 gap-4">
        {users.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-gray-500 dark:text-slate-400 font-battambang shadow-sm border border-gray-100 dark:border-slate-700">
            {t('common_no_data')}
          </div>
        ) : (
          users.map((user) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4"
            >
              {/* Top: Info */}
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 font-medium text-xl">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-normal text-gray-900 dark:text-white  font-title ">
                    {user.full_name || t('users_no_name')}
                  </div>
                  <div className="text-[13px] text-gray-500 dark:text-slate-400 ">
                    {user.email}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    {t('users_registered_at')} {new Date(user.created_at).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-GB')}
                  </div>
                </div>
                <div>
                  <span className={\`inline-flex items-center gap-1.5 text-[12px] font-medium font-battambang \${
                    user.role === 'admin' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-green-600 dark:text-green-400'
                  }\`}>
                    {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                    <span>{user.role === 'admin' ? t('users_role_admin') : t('users_role_user')}</span>
                  </span>
                </div>
              </div>

              {/* Bottom: Actions (Only in Advances Tab) */}
              {activeTab === 'advanced' && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700/60 gap-3">
                  <div className="flex-1 max-w-[150px] sm:max-w-[180px]">
                    {updatingId === user.id ? (
                      <div className="py-2 flex items-center gap-2 text-xs text-orange-500 font-battambang">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t('common_saving')}
                      </div>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                        disabled={updatingId === user.id}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-xs sm:text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block w-full p-2 font-battambang disabled:opacity-50 font-medium"
                      >
                        <option value="user">{t('users_role_user')}</option>
                        <option value="admin">{t('users_role_admin')}</option>
                      </select>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setResettingUser(user)}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-battambang whitespace-nowrap"
                  >
                    <KeyRound className="w-4 h-4" />
                    {t('users_btn_reset_pwd')}
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>`;

const replacement = `      {/* User List Table */}
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
                        <span className={\`inline-flex items-center gap-1.5 text-[12px] font-medium font-battambang \${
                          user.role === 'admin' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-green-600 dark:text-green-400'
                        }\`}>
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
      </div>`;

const newContent = content.replace(target, replacement);

if(newContent !== content) {
  fs.writeFileSync('src/components/Users.tsx', newContent);
  console.log("Successfully replaced");
} else {
  console.log("Not replaced");
}
