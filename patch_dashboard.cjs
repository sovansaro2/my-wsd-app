const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  `import { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Award } from 'lucide-react';`,
  `import { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Award, Lock, Settings } from 'lucide-react';\nimport PinPad from './PinPad';`
);

content = content.replace(
  `const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');`,
  `const [showPinPad, setShowPinPad] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);`
);

content = content.replace(
  `const handleToggleVisibility = () => {
    if (isAmountVisible) {
      setIsAmountVisible(false);
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === "wsd-app-v") {
      setIsAmountVisible(true);
      setShowPasswordModal(false);
    } else {
      setPasswordError('ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!');
    }
  };`,
  `// Auto hide balance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isAmountVisible) {
      timeoutId = setTimeout(() => setIsAmountVisible(false), 30000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isAmountVisible]);

  // Hide on background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsAmountVisible(false);
        setShowPinPad(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleToggleVisibility = async () => {
    if (isAmountVisible) {
      setIsAmountVisible(false);
      return;
    }
    
    // Check if locked out
    if (isLockedOut) {
      setPinError('សូមរង់ចាំបន្តិច ហើយព្យាយាមម្ដងទៀត។');
      setShowPinPad(true);
      return;
    }

    try {
      setIsPinLoading(true);
      const profile = await api.getMe();
      if (!profile?.has_balance_pin) {
        setShowSetupPrompt(true);
      } else {
        setShowPinPad(true);
        setPinError('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (isLockedOut) return;
    try {
      setIsPinLoading(true);
      setPinError('');
      await api.verifyBalancePin(pin);
      
      // Success
      setIsAmountVisible(true);
      setShowPinPad(false);
      setFailedAttempts(0);
    } catch (err: any) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLockedOut(true);
        setPinError('ព្យាយាមច្រើនដងពេក សូមរង់ចាំបន្តិច ហើយព្យាយាមម្ដងទៀត។');
        setTimeout(() => {
          setIsLockedOut(false);
          setFailedAttempts(0);
          setPinError('');
        }, 60000); // 1 minute lockout
      } else {
        setPinError('PIN មិនត្រឹមត្រូវ');
      }
    } finally {
      setIsPinLoading(false);
    }
  };`
);

content = content.replace(
  `{/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  សូមបញ្ចូលពាក្យសម្ងាត់ដើម្បីមើលទឹកប្រាក់៖
                </p>
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none mb-2 font-mono"
                  placeholder="********"
                />
                {passwordError && (
                  <p className="text-red-500 text-xs font-medium mb-4">{passwordError}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-battambang"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-battambang"
                  >
                    បញ្ជាក់
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>`,
  `{/* PIN Modal */}
      <AnimatePresence>
        {showPinPad && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPinPad(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl pt-8 pb-10 px-4"
            >
              <PinPad
                title="បញ្ចូល PIN"
                subtitle="បញ្ចូល PIN ៤ ខ្ទង់ ដើម្បីមើលទឹកប្រាក់"
                error={pinError}
                onComplete={handlePinSubmit}
                onCancel={() => setShowPinPad(false)}
                isLoading={isPinLoading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Setup Prompt Modal */}
      <AnimatePresence>
        {showSetupPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSetupPrompt(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-battambang">សូមកំណត់ PIN ជាមុន</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-battambang leading-relaxed">
                ចូលទៅ <span className="font-semibold">គណនី → ការកំណត់ → សុវត្ថិភាព</span> ដើម្បីកំណត់ PIN ៤ ខ្ទង់។
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSetupPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-battambang"
                >
                  បិទ
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>`
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Patched Dashboard.tsx');
