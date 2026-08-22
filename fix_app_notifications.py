import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add state
pattern_state = r"  const \[showNotifications, setShowNotifications\] = useState\(false\);\n  const \[unreadCount, setUnreadCount\] = useState\(0\);"
replacement_state = """  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);"""
content = re.sub(pattern_state, replacement_state, content)

# Change handleNotificationClick
pattern_handler = r"  const handleNotificationClick = \(target_tab: string\) => \{\n    setActiveTab\(target_tab as any\);\n    setShowNotifications\(false\);\n  \};"
replacement_handler = """  const handleNotificationClick = (notif: any) => {
    setSelectedNotification(notif);
  };"""
content = re.sub(pattern_handler, replacement_handler, content)

# Change the click in the map
pattern_click = r"onClick=\{\(\) => handleNotificationClick\(notif\.target_tab\)\}"
replacement_click = "onClick={() => handleNotificationClick(notif)}"
content = re.sub(pattern_click, replacement_click, content)

# Add the Detail Modal UI right before main content area
pattern_ui = r"      \{\/\* Main Content Area \*\/\}"
replacement_ui = """      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
              onClick={() => setSelectedNotification(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-slate-900 z-[90] shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            >
              <div className={`p-6 pb-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between ${
                selectedNotification.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 
                selectedNotification.type === 'expense' ? 'bg-rose-50 dark:bg-rose-900/20' : 
                'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedNotification.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                    selectedNotification.type === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 
                    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="font-battambang font-bold text-gray-900 dark:text-white text-lg">
                    {selectedNotification.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-[15px] text-gray-700 dark:text-slate-300 font-battambang leading-relaxed mb-6">
                  {selectedNotification.message}
                </p>
                
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2">
                    ពេលវេលា៖ {new Date(selectedNotification.created_at).toLocaleDateString('km-KH')} {new Date(selectedNotification.created_at).toLocaleTimeString('km-KH', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    បិទ
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab(selectedNotification.target_tab as any);
                      setShowNotifications(false);
                      setSelectedNotification(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30"
                  >
                    ទៅកាន់ទំព័រ
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}"""
content = re.sub(pattern_ui, replacement_ui, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

