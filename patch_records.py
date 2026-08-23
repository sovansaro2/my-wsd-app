import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Add is_high_level to FinancialRecord interface
if "is_high_level?: boolean;" not in content:
    content = content.replace(
        "  note: string | null;\n}",
        "  note: string | null;\n  is_high_level?: boolean;\n}"
    )

# Add isHighLevel state
if "const [isHighLevel, setIsHighLevel] = useState(false);" not in content:
    content = content.replace(
        "  const [notifyPublic, setNotifyPublic] = useState(false);\n  const [isSaving, setIsSaving] = useState(false);",
        "  const [notifyPublic, setNotifyPublic] = useState(false);\n  const [isHighLevel, setIsHighLevel] = useState(false);\n  const [isSaving, setIsSaving] = useState(false);"
    )

# Reset state when opening Add modal
content = content.replace(
        "    setNotifyPublic(false);\n    setIsAddModalOpen(true);",
        "    setNotifyPublic(false);\n    setIsHighLevel(false);\n    setIsAddModalOpen(true);"
    )

# Reset state when opening Edit modal
content = content.replace(
        "    setNotifyPublic(false);\n    setIsEditModalOpen(true);",
        "    setNotifyPublic(false);\n    setIsHighLevel(record.is_high_level || false);\n    setIsEditModalOpen(true);"
    )

# Send is_high_level in API
save_block = """      const recordData = {
        seil_id: selectedPeriod.id,
        type: newRecordType,
        description: newDescription.trim(),
        amount: parseFloat(newAmount),
        note: newNote.trim() || null,
        record_date: customDate ? new Date(customDate).toISOString().split('T')[0] : null,
        ...(notifyPublic && !editingRecord ? { notify_public: true, seil_name: selectedPeriod.name } : {})
      };"""
new_save_block = """      const recordData = {
        seil_id: selectedPeriod.id,
        type: newRecordType,
        description: newDescription.trim(),
        amount: parseFloat(newAmount),
        note: newNote.trim() || null,
        record_date: customDate ? new Date(customDate).toISOString().split('T')[0] : null,
        is_high_level: isHighLevel,
        ...(notifyPublic && !editingRecord ? { notify_public: true, seil_name: selectedPeriod.name } : {})
      };"""
content = content.replace(save_block, new_save_block)

# Add Star icon import
if "Star" not in content:
    content = content.replace("import { Search, Plus, Pencil, Edit2,", "import { Search, Plus, Pencil, Edit2, Star,")

# Add toggleHighLevel function
funcs_hook = "  const handleEdit = (record: FinancialRecord) => {"
new_funcs = """  const toggleHighLevel = async (record: FinancialRecord) => {
    try {
      const newValue = !record.is_high_level;
      await api.updateFinancialRecord(record.id, { is_high_level: newValue });
      setRecords(records.map(r => r.id === record.id ? { ...r, is_high_level: newValue } : r));
    } catch (err) {
      console.error('Error toggling high level:', err);
    }
  };

  const handleEdit = (record: FinancialRecord) => {"""
content = content.replace(funcs_hook, new_funcs)

# Update UI to add Star
old_item = """                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-white truncate">
                        {record.description}
                      </p>
                      {record.note && (
                        <p className="text-[12px] sm:text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{record.note}</p>
                      )}
                    </div>"""
new_item = """                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-white truncate">
                          {record.description}
                        </p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHighLevel(record);
                          }}
                          className={`p-1 rounded-full transition-colors ${record.is_high_level ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-gray-300 dark:text-slate-600 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                          title="ថវិកាកម្រិតខ្ពស់"
                        >
                          <Star className="w-4 h-4" fill={record.is_high_level ? "currentColor" : "none"} />
                        </button>
                      </div>
                      {record.note && (
                        <p className="text-[12px] sm:text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{record.note}</p>
                      )}
                    </div>"""
content = content.replace(old_item, new_item)

# Add the checkbox in the Modal
modal_field_hook = """                  {/* Public Notification */}"""
high_level_checkbox = """                  {/* High Level Budget */}
                  {newRecordType === 'income' && (
                    <div className="flex items-center gap-3 p-4 mt-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                      <input 
                        type="checkbox" 
                        id="isHighLevel" 
                        checked={isHighLevel}
                        onChange={(e) => setIsHighLevel(e.target.checked)}
                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                      <label htmlFor="isHighLevel" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                        ✅ ថវិកាកម្រិតខ្ពស់
                      </label>
                    </div>
                  )}

                  {/* Public Notification */}"""
content = content.replace(modal_field_hook, high_level_checkbox)

# Auto-check if amount >= 100000
amount_input_hook = """                        setNewAmount(e.target.value);
                      }}"""
amount_input_new = """                        const val = e.target.value;
                        setNewAmount(val);
                        if (newRecordType === 'income' && Number(val) >= 100000) {
                          setIsHighLevel(true);
                        }
                      }}"""
content = content.replace(amount_input_hook, amount_input_new)


with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
