import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update onBack handlers
content = content.replace(
    "<ManageFinancialRecords onBack={() => setActiveTab('account')} />",
    "<ManageFinancialRecords onBack={() => setActiveTab('records')} />"
)
content = content.replace(
    "<ManageNameLists onBack={() => setActiveTab('account')} />",
    "<ManageNameLists onBack={() => setActiveTab('categories')} />"
)

# 2. Update AccountProfile props (remove old props since they are no longer on account page)
# Wait, I don't necessarily need to remove them from AccountProfile invocation if they aren't used, but better to be clean.
# I'll just leave AccountProfile invocation as is, it's fine.

# 3. Update bottom nav highlighting logic
# For records
content = content.replace(
    "className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${activeTab === 'records' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}",
    "className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${['records', 'manage_financials'].includes(activeTab) ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}"
)
content = content.replace(
    "{activeTab === 'records' && (",
    "{['records', 'manage_financials'].includes(activeTab) && ("
)

# For categories
content = content.replace(
    "className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${activeTab === 'categories' ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}",
    "className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${['categories', 'manage_name_lists'].includes(activeTab) ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}"
)
content = content.replace(
    "{activeTab === 'categories' && (",
    "{['categories', 'manage_name_lists'].includes(activeTab) && ("
)

# For account
content = content.replace(
    "className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${['account', 'manage_financials', 'manage_name_lists'].includes(activeTab) ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}",
    "className={`relative flex flex-col items-center gap-1 p-2 min-w-[4rem] transition-colors ${['account', 'users', 'certificates'].includes(activeTab) ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}"
)
content = content.replace(
    "{['account', 'manage_financials', 'manage_name_lists'].includes(activeTab) && (",
    "{['account', 'users', 'certificates'].includes(activeTab) && ("
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
