import re

with open('src/components/AccountProfile.tsx', 'r') as f:
    content = f.read()

# Remove the two buttons
old_buttons = """          <button 
            onClick={onManageFinancials} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50/80 p-2.5 rounded-xl text-blue-600">
                <Wallet className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">{t('profile_finance_mgmt')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>
          
          <button 
            onClick={onManageNameLists} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-50/80 p-2.5 rounded-xl text-emerald-600">
                <FileText className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">{t('profile_list_mgmt')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>"""

if old_buttons in content:
    content = content.replace(old_buttons, "")
    print("Successfully removed buttons.")
else:
    print("Could not find buttons to remove")

with open('src/components/AccountProfile.tsx', 'w') as f:
    f.write(content)
