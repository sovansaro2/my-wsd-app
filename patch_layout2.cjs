const fs = require('fs');
let code = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

// 1. Remove password field from the edit profile form
const editPasswordBlockRegex = /\s*<div>\s*<label className="mb-1\.5 block text-sm font-medium text-gray-700 dark:text-slate-300">\{t\('profile_password'\)\}<\/label>\s*<input\s*type="password"\s*value=\{password\}\s*placeholder=\{t\('profile_password_ph'\)\}\s*onChange=\{\(e\) => setPassword\(e\.target\.value\)\}\s*className="[^"]+"\s*\/>\s*<\/div>/g;
code = code.replace(editPasswordBlockRegex, '');

// 2. Add Password Modal State and Handlers
const addStateBefore = "const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);";
const passwordStateCode = `  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (password.length < 6) {
      setPasswordError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('ពាក្យសម្ងាត់មិនដូចគ្នា');
      return;
    }
    
    try {
      setIsPasswordLoading(true);
      setPasswordError('');
      await api.updateProfile({ password });
      setShowPasswordModal(false);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'បានផ្លាស់ប្ដូរពាក្យសម្ងាត់ដោយជោគជ័យ' });
    } catch (err: any) {
      setPasswordError(err.message || 'មានបញ្ហាក្នុងការផ្លាស់ប្ដូរពាក្យសម្ងាត់');
    } finally {
      setIsPasswordLoading(false);
    }
  };
`;
if (!code.includes('showPasswordModal')) {
  code = code.replace(addStateBefore, passwordStateCode + '\n  ' + addStateBefore);
}

// 3. Extract the existing sections and reorder them
const pStart = code.indexOf('{/* Profile Section */}');
const sStart = code.indexOf('{/* Security Section */}');
const aStart = code.indexOf("{userRole === 'admin' && (");
const oStart = code.indexOf('{/* Others Section */}');
const oEnd = code.indexOf('</>    </div>'); // roughly before modals begin, actually look for `      {isEditingView && (`
const modalsStart = code.indexOf('{isEditingView && (');

const profileSection = code.substring(pStart, sStart);
const securitySection = code.substring(sStart, aStart);
const adminSection = code.substring(aStart, oStart);
// Find the end of Others section: it ends right before `      {isEditingView && (` or similar. We can just use modalsStart
// Wait, is there a `      {/* Edit Profile Modal */}`? Let's find exactly what comes after othersSection.
// `othersSection` ends at `      </>\n\n      <>\n      {isEditingView && (`.
// Let's just find the first `<>` or `{isEditingView` after `oStart`.
const editViewIndex = code.indexOf('{isEditingView && (');
// Backtrack to find the start of its surrounding `<>`
let endOfOthers = code.lastIndexOf('<>', editViewIndex);
if (endOfOthers === -1) endOfOthers = editViewIndex; // fallback

const othersSection = code.substring(oStart, endOfOthers);

// 4. Add "Change Password" button to Security Section
const changePasswordButton = `
          <button 
            onClick={() => {
              setPassword('');
              setConfirmPassword('');
              setPasswordError('');
              setShowPasswordModal(true);
            }} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none text-left"
          >
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-blue-500"/>
                <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">ពាក្យសម្ងាត់</span>
              </div>
              <span className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5 ml-6">ផ្លាស់ប្ដូរពាក្យសម្ងាត់គណនីរបស់អ្នក</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">ប្ដូរ</span>
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </button>
        </div>
      </div>
`;
let newSecuritySection = securitySection.replace(/<\/div>\n\s*<\/div>\n\s*$/, changePasswordButton);

// Reassemble
const newOrder = profileSection + othersSection + newSecuritySection + adminSection;

code = code.substring(0, pStart) + newOrder + code.substring(endOfOthers);

// 5. Add Password Modal Code
const passwordModalCode = `
      {/* Change Password Modal */}
      <AnimatePresence>
      {showPasswordModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPasswordModal(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end sm:justify-center sm:p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <h3 className="font-bold text-[17px] text-gray-900 dark:text-white">ផ្លាស់ប្ដូរពាក្យសម្ងាត់</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-2 -mr-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {passwordError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">ពាក្យសម្ងាត់ថ្មី</label>
                  <input
                    type="password"
                    value={password}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្ដងទៀត"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              <button
                onClick={handlePasswordChange}
                disabled={isPasswordLoading || !password || !confirmPassword}
                className="w-full mt-6 py-3.5 px-4 bg-indigo-600 text-white rounded-2xl font-bold text-[15px] hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'រក្សាទុកការផ្លាស់ប្ដូរ'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
`;

if (!code.includes('Change Password Modal')) {
  code = code.replace(/    <\/div>\n  \);\n}\n*$/, passwordModalCode + '    </div>\n  );\n}\n');
}

fs.writeFileSync('src/components/AccountProfile.tsx', code);
console.log("Successfully patched AccountProfile.tsx layout and modal");
