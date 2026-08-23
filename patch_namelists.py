import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# 1. Fix the save function to include is_100k_donor
save_block = """      const recordData = {
        category_id: selectedCategory.id,
        name: name.trim(),
        amount: parseFloat(amount),
        note: note.trim() || null,
        referrer: referrer.trim() || null,
        ...(notifyPublic && !editingRecord ? { notify_public: true, category_name: selectedCategory.name } : {})
      };"""
new_save_block = """      const recordData = {
        category_id: selectedCategory.id,
        name: name.trim(),
        amount: parseFloat(amount),
        note: note.trim() || null,
        referrer: referrer.trim() || null,
        is_100k_donor: is100kDonor,
        ...(notifyPublic && !editingRecord ? { notify_public: true, category_name: selectedCategory.name } : {})
      };"""
content = content.replace(save_block, new_save_block)

# 2. Change label
old_label = "✅ បញ្ជូនទៅបញ្ជីសប្បុរសជនចាប់ពី ១០០,០០០៛ ឡើង"
new_label = "✅ ថវិកាកម្រិតខ្ពស់"
content = content.replace(old_label, new_label)

# 3. Add Star icon to list
# Look for the map function in NameLists.tsx
old_item = """                        <div>
                          <span className="font-bold text-gray-900 dark:text-white text-[15px] sm:text-[16px] leading-tight block">{record.name}</span>
                          {record.referrer && (
                            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              អ្នកទទួល៖ {record.referrer}
                            </span>
                          )}
                        </div>"""
# Let's add Star import
if "Star" not in content:
    content = content.replace("import { Search, Plus, Pencil,", "import { Search, Plus, Pencil, Star,")

new_item = """                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white text-[15px] sm:text-[16px] leading-tight block">{record.name}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHighLevel(record);
                                }}
                                className={`p-1 rounded-full transition-colors ${record.is_100k_donor ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-gray-300 dark:text-slate-600 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                                title="ថវិកាកម្រិតខ្ពស់"
                              >
                                <Star className="w-4 h-4" fill={record.is_100k_donor ? "currentColor" : "none"} />
                              </button>
                            </div>
                            {record.referrer && (
                              <span className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                អ្នកទទួល៖ {record.referrer}
                              </span>
                            )}
                          </div>
                        </div>"""
content = content.replace(old_item, new_item)

# 4. Add toggleHighLevel function
funcs_hook = "  const openEditModal = (record: NameRecord) => {"
new_funcs = """  const toggleHighLevel = async (record: NameRecord) => {
    try {
      const newValue = !record.is_100k_donor;
      await api.updateNameListRecord(record.id, { is_100k_donor: newValue });
      setRecords(records.map(r => r.id === record.id ? { ...r, is_100k_donor: newValue } : r));
    } catch (err) {
      console.error('Error toggling high level:', err);
    }
  };

  const openEditModal = (record: NameRecord) => {"""
content = content.replace(funcs_hook, new_funcs)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

