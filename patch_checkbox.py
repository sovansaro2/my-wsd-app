import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

checkbox_ui = """
              {/* Checkbox for 100k Donor */}
              <div className="flex items-center gap-3 p-4 mt-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                <input 
                  type="checkbox" 
                  id="is100kDonor" 
                  checked={is100kDonor}
                  onChange={(e) => setIs100kDonor(e.target.checked)}
                  className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
                <label htmlFor="is100kDonor" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                  ✅ បញ្ជូនទៅបញ្ជីសប្បុរសជនចាប់ពី ១០០,០០០៛ ឡើង
                </label>
              </div>
"""

# Find `{!editingRecord && (` and inject before it
content = content.replace("              {!editingRecord && (", checkbox_ui + "\n              {!editingRecord && (")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
