import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Make sure is_high_level exists in interface
if "is_high_level?: boolean;" not in content:
    content = content.replace(
        "  note: string | null;\n}",
        "  note: string | null;\n  is_high_level?: boolean;\n}"
    )

# Add isHighLevel state
if "const [isHighLevel, setIsHighLevel] = useState(false);" not in content:
    content = content.replace(
        "  const [newNotifyPublic, setNewNotifyPublic] = useState(false);\n  const [addToRoofFund, setAddToRoofFund] = useState(false);",
        "  const [newNotifyPublic, setNewNotifyPublic] = useState(false);\n  const [isHighLevel, setIsHighLevel] = useState(false);\n  const [addToRoofFund, setAddToRoofFund] = useState(false);"
    )

# Reset state when opening Add modal
open_add = """  const openAddModal = (type: 'income' | 'expense') => {
    setNewRecordType(type);
    setNewDescription('');
    setNewAmount('');
    setNewNote('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewNotifyPublic(false);
    setAddToRoofFund(false);
    setIsAddModalOpen(true);
  };"""
new_open_add = """  const openAddModal = (type: 'income' | 'expense') => {
    setNewRecordType(type);
    setNewDescription('');
    setNewAmount('');
    setNewNote('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewNotifyPublic(false);
    setAddToRoofFund(false);
    setIsHighLevel(false);
    setIsAddModalOpen(true);
  };"""
content = content.replace(open_add, new_open_add)

# Send is_high_level in API
save_block = """      const recordData = {
        seil_id: selectedPeriod.id,
        type: newRecordType,
        description: newDescription,
        amount: parseFloat(newAmount.replace(/,/g, '')),
        record_date: newDate || null,
        note: newNote || null,
        ...(newNotifyPublic ? { notify_public: true, seil_name: selectedPeriod.name } : {})
      };"""
new_save_block = """      const recordData = {
        seil_id: selectedPeriod.id,
        type: newRecordType,
        description: newDescription,
        amount: parseFloat(newAmount.replace(/,/g, '')),
        record_date: newDate || null,
        note: newNote || null,
        is_high_level: isHighLevel,
        ...(newNotifyPublic ? { notify_public: true, seil_name: selectedPeriod.name } : {})
      };"""
content = content.replace(save_block, new_save_block)

# Add Star icon import
if "Star" not in content:
    content = content.replace("import { ChevronDown, Pencil,", "import { ChevronDown, Pencil, Star,")

# Add toggleHighLevel function
funcs_hook = "  const handleSaveRecord = async (e: React.FormEvent) => {"
new_funcs = """  const toggleHighLevel = async (record: FinancialRecord) => {
    try {
      const newValue = !record.is_high_level;
      await api.updateFinancialRecord(record.id, { is_high_level: newValue });
      setRecords(records.map(r => r.id === record.id ? { ...r, is_high_level: newValue } : r));
    } catch (err) {
      console.error('Error toggling high level:', err);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {"""
content = content.replace(funcs_hook, new_funcs)

# Update UI to add Star
old_item = """                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                              <div className="flex flex-col justify-center">
                                <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                  {record.description}
                                </span>"""
new_item = """                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                              <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                    {record.description}
                                  </span>
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
                                </div>"""
content = content.replace(old_item, new_item)

# Add the checkbox in the Modal
modal_field_hook = """                  <div className="flex items-center gap-3 p-4 mt-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                    <div className="flex-shrink-0">"""
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

                  <div className="flex items-center gap-3 p-4 mt-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                    <div className="flex-shrink-0">"""
content = content.replace(modal_field_hook, high_level_checkbox)

# Auto-check if amount >= 100000
amount_input_hook = """                        setNewAmount(e.target.value);
                      }}"""
amount_input_new = """                        const val = e.target.value;
                        setNewAmount(val);
                        if (newRecordType === 'income' && Number(val.replace(/,/g, '')) >= 100000) {
                          setIsHighLevel(true);
                        }
                      }}"""
content = content.replace(amount_input_hook, amount_input_new)


with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
