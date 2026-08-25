const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

content = content.replace(
  `const [pinSetupStep, setPinSetupStep] = useState<'verify_current' | 'enter_new' | 'confirm_new'>('enter_new');`,
  `const [pinSetupStep, setPinSetupStep] = useState<'verify_current' | 'enter_new' | 'confirm_new' | 'forgot_pin_verify'>('enter_new');
  const [authPassword, setAuthPassword] = useState('');`
);

const forgotPinUI = `
              {pinSetupStep === 'forgot_pin_verify' && (
                <div className="w-full max-w-sm mx-auto text-center">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-battambang">បញ្ជាក់អត្តសញ្ញាណ</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-battambang leading-relaxed">
                    សូមបញ្ចូលពាក្យសម្ងាត់គណនី (Login Password) របស់អ្នក ដើម្បីកំណត់ PIN ថ្មី។
                  </p>
                  
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="ពាក្យសម្ងាត់គណនី..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none mb-4 font-mono text-center"
                    autoFocus
                  />
                  
                  {pinSetupError && (
                    <p className="text-red-500 text-sm font-medium mb-4 font-battambang">{pinSetupError}</p>
                  )}
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setPinSetupStep('verify_current')}
                      disabled={isPinSettingLoading}
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-battambang"
                    >
                      ត្រឡប់ក្រោយ
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setIsPinSettingLoading(true);
                          setPinSetupError('');
                          await api.verifyPassword(authPassword);
                          setAuthPassword('');
                          setCurrentPin(''); // Skip current PIN check
                          setPinSetupStep('enter_new');
                        } catch(e: any) {
                          setPinSetupError(e.message || 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវ');
                        } finally {
                          setIsPinSettingLoading(false);
                        }
                      }}
                      disabled={isPinSettingLoading || !authPassword}
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-battambang disabled:opacity-50"
                    >
                      {isPinSettingLoading ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'បញ្ជាក់'}
                    </button>
                  </div>
                </div>
              )}
`;

content = content.replace(
  `{pinSetupStep === 'enter_new' && (`,
  `${forgotPinUI}\n              {pinSetupStep === 'enter_new' && (`
);

content = content.replace(
  `onCancel={() => setShowPinSetup(false)}`,
  `onCancel={() => setShowPinSetup(false)}\n                  onForgotPin={() => { setPinSetupError(''); setAuthPassword(''); setPinSetupStep('forgot_pin_verify'); }}`
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
