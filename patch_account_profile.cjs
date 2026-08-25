const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

// 1. Import Lock and PinPad
content = content.replace(
  `import { UserCircle2, Check, Camera, LogOut, ChevronRight, FileText, Users, Building2, Upload } from 'lucide-react';`,
  `import { UserCircle2, Check, Camera, LogOut, ChevronRight, FileText, Users, Building2, Upload, Lock, ShieldCheck } from 'lucide-react';\nimport PinPad from './PinPad';`
);

// 2. Add states for PIN
content = content.replace(
  `const [avatarUrl, setAvatarUrl] = useState('');`,
  `const [avatarUrl, setAvatarUrl] = useState('');
  
  // PIN states
  const [hasBalancePin, setHasBalancePin] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState<'verify_current' | 'enter_new' | 'confirm_new'>('enter_new');
  const [tempNewPin, setTempNewPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinSetupError, setPinSetupError] = useState('');
  const [isPinSettingLoading, setIsPinSettingLoading] = useState(false);`
);

// 3. Set hasBalancePin in fetchProfile
content = content.replace(
  `setPhone(profile.phone_number || '');`,
  `setPhone(profile.phone_number || '');\n      setHasBalancePin(!!profile.has_balance_pin);`
);

// 4. Add the Settings -> Security section
const securitySection = `
      {/* Security Section */}
      <div className="mb-4 mt-8">
        <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2 pl-1">សុវត្ថិភាព</h4>
        <div className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/50 dark:border-slate-800/50 dark:shadow-none overflow-hidden flex flex-col divide-y divide-gray-50 dark:divide-slate-800/50">
          <button 
            onClick={() => {
              if (hasBalancePin) {
                setPinSetupStep('verify_current');
              } else {
                setPinSetupStep('enter_new');
              }
              setTempNewPin('');
              setCurrentPin('');
              setPinSetupError('');
              setShowPinSetup(true);
            }} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none text-left"
          >
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-orange-500"/>
                <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">PIN មើលទឹកប្រាក់</span>
              </div>
              <span className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5 ml-6">ការពារការបង្ហាញទឹកប្រាក់របស់អ្នក</span>
            </div>
            <div className="flex items-center space-x-2">
              {hasBalancePin ? (
                <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">បានកំណត់</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">មិនទាន់បានកំណត់</span>
              )}
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </button>
        </div>
      </div>
`;

// Insert it before "{/* Settings Section */}"
content = content.replace(
  `{/* Settings Section */}`,
  `${securitySection}\n      {/* Settings Section */}`
);

// 5. Add PinSetup Methods
const pinMethods = `
  const handlePinSetupComplete = async (pin: string) => {
    if (pinSetupStep === 'verify_current') {
      try {
        setIsPinSettingLoading(true);
        setPinSetupError('');
        await api.verifyBalancePin(pin);
        setCurrentPin(pin);
        setPinSetupStep('enter_new');
      } catch (err: any) {
        setPinSetupError(err.message || 'PIN បច្ចុប្បន្នមិនត្រឹមត្រូវ');
      } finally {
        setIsPinSettingLoading(false);
      }
    } else if (pinSetupStep === 'enter_new') {
      setTempNewPin(pin);
      setPinSetupStep('confirm_new');
    } else if (pinSetupStep === 'confirm_new') {
      if (pin !== tempNewPin) {
        setPinSetupError('PIN មិនដូចគ្នា');
        setPinSetupStep('enter_new');
        setTempNewPin('');
        return;
      }
      
      try {
        setIsPinSettingLoading(true);
        setPinSetupError('');
        await api.updateBalancePin(pin, currentPin || undefined);
        setHasBalancePin(true);
        setShowPinSetup(false);
        setMessage({ type: 'success', text: 'បានកំណត់ PIN ដោយជោគជ័យ' });
      } catch (err: any) {
        setPinSetupError(err.message || 'មានបញ្ហាក្នុងការកំណត់ PIN');
      } finally {
        setIsPinSettingLoading(false);
      }
    }
  };
`;

content = content.replace(
  `const handleLogoutClick = () => {`,
  `${pinMethods}\n\n  const handleLogoutClick = () => {`
);

// 6. Add the PinSetup UI to the render tree
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
`;

// Insert it right after `<AnimatePresence>` for Message or before the end of return.
content = content.replace(
  `{/* Message Toast */}`,
  `${pinModal}\n\n      {/* Message Toast */}`
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
console.log('Patched AccountProfile.tsx');
