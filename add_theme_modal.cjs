const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

const modalCode = `
      {/* Theme Modal */}
      <AnimatePresence>
      {isThemeModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsThemeModalOpen(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[24px] max-w-sm w-full p-6 shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={() => setIsThemeModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-battambang">{t('profile_change_theme')}</h3>

            <div className="space-y-4 font-battambang">
              <button 
                onClick={() => { setCurrentTheme('light'); setIsThemeModalOpen(false); }}
                className={\`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all \${currentTheme === 'light' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}\`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Light Mode (ភ្លឺ)</span>
                </div>
                {currentTheme === 'light' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
              </button>
              
              <button 
                onClick={() => { setCurrentTheme('dark'); setIsThemeModalOpen(false); }}
                className={\`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all \${currentTheme === 'dark' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}\`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Dark Mode (ងងឹត)</span>
                  </div>
                </div>
                {currentTheme === 'dark' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
`;

// Try to replace the last occurrence of <AnimatePresence> which is for the about modal
content = content.replace(
  '      <AnimatePresence>\n      {isAboutModalOpen && (',
  modalCode + '\n      <AnimatePresence>\n      {isAboutModalOpen && ('
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
