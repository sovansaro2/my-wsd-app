import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# 1. Add activeTab state
if "const [activeTab, setActiveTab]" not in content:
    state_pattern = r"  const \[isDropdownOpen, setIsDropdownOpen\] = useState\(false\);"
    state_replacement = """  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'roof'>('general');"""
    content = re.sub(state_pattern, state_replacement, content)

# 2. Modify fetchCategories logic
if "const roofCat =" not in content:
    fetch_process_pattern = r"        setCategories\(data\);\n        if \(\!selectedCategory\) setSelectedCategory\(data\[0\]\);\n      \}"
    fetch_process_replacement = """        setCategories(data);
        const roofCat = data.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
        const generalCats = data.filter((c: any) => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
        
        if (activeTab === 'roof' && roofCat) {
          setSelectedCategory(roofCat);
        } else if (activeTab === 'general' && generalCats.length > 0 && !selectedCategory) {
          setSelectedCategory(generalCats[0]);
        } else if (!selectedCategory) {
          setSelectedCategory(data[0]);
        }
      }"""
    content = re.sub(fetch_process_pattern, fetch_process_replacement, content)

# 3. Add useEffect to handle tab switching
if "activeTab === 'roof'" not in content:
    effect_pattern = r"  useEffect\(\(\) => \{\n    if \(selectedCategory\) \{\n      fetchRecords\(selectedCategory\.id\);\n    \}\n  \}, \[selectedCategory\]\);"
    effect_replacement = """  useEffect(() => {
    if (selectedCategory) {
      fetchRecords(selectedCategory.id);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (categories.length > 0) {
      const roofCat = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
      const generalCats = categories.filter((c: any) => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
      
      if (activeTab === 'roof') {
        if (roofCat) {
          setSelectedCategory(roofCat);
        } else {
          // If roof category doesn't exist, we might want to auto-create it or just set to null
          setSelectedCategory(null);
          setRecords([]);
        }
      } else {
        if (generalCats.length > 0) {
          // Keep current if it's general, else pick first general
          if (!selectedCategory || selectedCategory.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ') {
            setSelectedCategory(generalCats[0]);
          }
        } else {
          setSelectedCategory(null);
          setRecords([]);
        }
      }
    }
  }, [activeTab]);"""
    content = re.sub(effect_pattern, effect_replacement, content)

# 4. Filter categories for the dropdown
dropdown_pattern = r"                            \{categories\.map\(\(category, index\) => \("
dropdown_replacement = """                            {categories.filter(c => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ').map((category, index) => ("""
if dropdown_replacement not in content:
    content = re.sub(dropdown_pattern, dropdown_replacement, content)

# Also check for `{categories.map(category => (`
dropdown_pattern2 = r"                            \{categories\.map\(category => \("
dropdown_replacement2 = """                            {categories.filter(c => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ').map(category => ("""
if dropdown_replacement2 not in content:
    content = re.sub(dropdown_pattern2, dropdown_replacement2, content)

# 5. Inject the Tab UI before the Title
tab_ui_pattern = r"          <h2 className=\"text-2xl font-bold text-gray-900 dark:text-white tracking-tight\">\{t\('list_title'\)\}<\/h2>"
tab_ui_replacement = """          {/* Main Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-2">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-all ${activeTab === 'general' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}
            >
              បញ្ជីទូទៅ
            </button>
            <button 
              onClick={() => setActiveTab('roof')}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-all ${activeTab === 'roof' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'}`}
            >
              🏗️ កសាងដំបូលព្រះវិហារ
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{activeTab === 'general' ? t('list_title') : 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ'}</h2>"""
content = re.sub(tab_ui_pattern, tab_ui_replacement, content)

# 6. Hide Category selector when in roof tab
category_sel_pattern = r"            \{\/\* Category Selector \*\/\}\n            \{categories\.length > 0 && \(\n              <div className=\"relative flex-1\">"
category_sel_replacement = """            {/* Category Selector */}
            {categories.length > 0 && activeTab === 'general' && (
              <div className="relative flex-1">"""
content = re.sub(category_sel_pattern, category_sel_replacement, content)

# 7. Hide Edit/Delete Category buttons when in roof tab
category_actions_pattern = r"            \{userRole === 'admin' && \(\n              <div className=\"flex items-center gap-2 shrink-0\">"
category_actions_replacement = """            {userRole === 'admin' && activeTab === 'general' && (
              <div className="flex items-center gap-2 shrink-0">"""
content = re.sub(category_actions_pattern, category_actions_replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
