const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

const pinModal = `
      {/* PIN Setup Modal */}
      <AnimatePresence>
        {showPinSetup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPinSetup(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl pt-8 pb-10 px-4"
            >
              {pinSetupStep === 'verify_current' && (
                <PinPad
                  title="បញ្ជាក់ PIN បច្ចុប្បន្ន"
                  subtitle="សូមបញ្ចូល PIN ៤ ខ្ទង់បច្ចុប្បន្នរបស់អ្នក"
                  error={pinSetupError}
                  onComplete={handlePinSetupComplete}
                  onCancel={() => setShowPinSetup(false)}
                  onForgotPin={() => { setPinSetupError(''); setAuthPassword(''); setPinSetupStep('forgot_pin_verify'); }}
                  isLoading={isPinSettingLoading}
                />
              )}
              {pinSetupStep === 'enter_new' && (
                <PinPad
                  title={hasBalancePin ? "បង្កើត PIN ថ្មី" : "កំណត់ PIN"}
                  subtitle="បង្កើត PIN ៤ ខ្ទង់ ដើម្បីការពារការមើលទឹកប្រាក់"
                  error={pinSetupError}
                  onComplete={handlePinSetupComplete}
                  onCancel={() => setShowPinSetup(false)}
                  isLoading={isPinSettingLoading}
                />
              )}
              {pinSetupStep === 'confirm_new' && (
                <PinPad
                  title="បញ្ជាក់ PIN ថ្មី"
                  subtitle="បញ្ចូល PIN ម្តងទៀត ដើម្បីបញ្ជាក់"
                  error={pinSetupError}
                  onComplete={handlePinSetupComplete}
                  onCancel={() => {
                     setPinSetupStep('enter_new');
                     setTempNewPin('');
                  }}
                  isLoading={isPinSettingLoading}
                />
              )}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
`;

content = content.replace(
  `      </AnimatePresence>\n    </div>\n  );\n}`,
  `      </AnimatePresence>\n${pinModal}\n    </div>\n  );\n}`
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
