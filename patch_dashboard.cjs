const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const modalContent = `
      {/* PIN Setup Prompt Modal */}
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">សុវត្ថិភាពទឹកប្រាក់</h3>
                </div>
                <button onClick={() => setShowSetupPrompt(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-battambang leading-relaxed">
                <p className="mb-2">ដើម្បីមើលទឹកប្រាក់បាន លោកអ្នកត្រូវកំណត់ PIN សុវត្ថិភាព ៤ ខ្ទង់ជាមុនសិន។</p>
                <p>សូមចូលទៅកាន់៖ <br/><span className="font-bold text-gray-700 dark:text-gray-300">គណនី {'>'} ការកំណត់ {'>'} សុវត្ថិភាព PIN</span></p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSetupPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  បិទ
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PinPad Verification */}
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
                title="បញ្ជាក់ PIN"
                subtitle="សូមបញ្ចូល PIN ៤ ខ្ទង់របស់អ្នកដើម្បីមើលទឹកប្រាក់"
                error={pinError}
                onComplete={handlePinSubmit}
                onCancel={() => setShowPinPad(false)}
                isLoading={isPinLoading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
`;

const startIndex = content.indexOf('{/* Password Modal */}');
const endIndex = content.indexOf('</AnimatePresence>', startIndex) + '</AnimatePresence>'.length;

if (startIndex !== -1) {
  content = content.substring(0, startIndex) + modalContent + content.substring(endIndex);
  fs.writeFileSync('src/components/Dashboard.tsx', content);
  console.log("Successfully replaced password modal with PIN modals");
} else {
  console.log("Could not find Password Modal section");
}
