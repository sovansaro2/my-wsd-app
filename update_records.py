import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# 1. Add state for the toggle
state_pattern = r"  const \[newNotifyPublic, setNewNotifyPublic\] = useState\(false\);"
state_replacement = """  const [newNotifyPublic, setNewNotifyPublic] = useState(false);
  const [addToRoofFund, setAddToRoofFund] = useState(false);"""
content = re.sub(state_pattern, state_replacement, content)

# 2. Update reset modal state
reset_pattern = r"    setNewNotifyPublic\(false\);\n    setIsAddModalOpen\(true\);"
reset_replacement = """    setNewNotifyPublic(false);
    setAddToRoofFund(false);
    setIsAddModalOpen(true);"""
content = re.sub(reset_pattern, reset_replacement, content)

# 3. Update handleSaveRecord
save_pattern = r"      await api\.createFinancialRecord\(recordData\);\n      \n      fetchRecords\(selectedPeriod\.id\);\n      setIsAddModalOpen\(false\);\n      \n      setNewDescription\(''\);\n      setNewAmount\(''\);\n      setNewNote\(''\);\n      setNewNotifyPublic\(false\);"
save_replacement = """      await api.createFinancialRecord(recordData);
      
      // Auto-add to Roof Fund if toggled
      if (newRecordType === 'income' && addToRoofFund) {
        try {
          const categories = await api.getNameListCategories();
          let roofCategory = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
          if (!roofCategory) {
            // Need to create it, but apiClient doesn't export a createCategory helper directly here easily without adding it, 
            // wait, we can just do a fetch directly or assume it exists since it's a huge project priority.
            // Let's call the API to create it if it doesn't exist.
            const createRes = await fetch('/api/name-lists/categories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
              },
              body: JSON.stringify({ name: 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ', description: 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ' })
            });
            if (createRes.ok) {
              roofCategory = await createRes.json();
            }
          }
          
          if (roofCategory) {
            await fetch('/api/name-lists/records', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
              },
              body: JSON.stringify({
                category_id: roofCategory.id,
                name: newDescription.trim(),
                amount: parseFloat(newAmount.replace(/,/g, '')),
                note: newNote || null,
                notify_public: newNotifyPublic
              })
            });
          }
        } catch (e) {
          console.error("Failed to add to roof fund", e);
        }
      }

      fetchRecords(selectedPeriod.id);
      setIsAddModalOpen(false);
      
      setNewDescription('');
      setNewAmount('');
      setNewNote('');
      setNewNotifyPublic(false);
      setAddToRoofFund(false);"""
content = re.sub(save_pattern, save_replacement, content)

# 4. Add the toggle UI in the form
ui_pattern = r"                  \{\/\* Public Notification Toggle \*\/\}"
ui_replacement = """                  {/* Roof Fund Toggle */}
                  {newRecordType === 'income' && (
                    <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 mb-4 transition-colors">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">បន្ថែមទៅបញ្ជីកសាងដំបូលព្រះវិហារ</h4>
                        <p className="text-[12px] text-gray-600 dark:text-gray-400">ទិន្នន័យនេះនឹងបញ្ជូនទៅបញ្ជីកសាងដំបូលដោយស្វ័យប្រវត្តិ</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={addToRoofFund}
                          onChange={(e) => setAddToRoofFund(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  )}

                  {/* Public Notification Toggle */}"""
content = re.sub(ui_pattern, ui_replacement, content)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
