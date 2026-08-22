import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Replace the Main Tabs and Category Selector with a Back Button and Title
header_pattern = r"          \{\/\* Main Tabs \*\/\}[\s\S]*?\{\/\* Search \*\/\}"
header_replacement = """          {/* Detail View Header */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedCategory(null)} 
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate flex-1 leading-tight">
              {selectedCategory?.name}
            </h2>
            
            {userRole === 'admin' && selectedCategory?.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ' && (
              <button 
                onClick={openAddModal}
                className="flex items-center justify-center bg-orange-500 text-white w-10 h-10 rounded-xl shadow-sm dark:shadow-none hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('list_add_new')}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Search */}"""
content = re.sub(header_pattern, header_replacement, content)

grid_view_code = """
  if (!selectedCategory) {
    const roofCat = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
    const generalCats = categories.filter((c: any) => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');

    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang overflow-y-auto">
        <div className="bg-white dark:bg-slate-950 px-4 py-5 shadow-sm dark:shadow-none border-b border-gray-100 dark:border-slate-800 z-10 sticky top-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">បញ្ជីផ្សេងៗ</h2>
        </div>
        <div className="px-4 py-6 max-w-3xl mx-auto w-full">
          {roofCat && (
            <div className="mb-8">
              <h3 className="text-[14px] font-bold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                គម្រោងពិសេស
              </h3>
              <button 
                onClick={() => setSelectedCategory(roofCat)}
                className="w-full text-left bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg shadow-orange-500/20 relative overflow-hidden transition-transform active:scale-95"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                    <span className="text-2xl">🏗️</span>
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-1">{roofCat.name}</h4>
                    <p className="text-orange-50 text-sm opacity-90 line-clamp-1">{roofCat.description || 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'}</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          <div>
             <h3 className="text-[14px] font-bold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               បញ្ជីទូទៅ
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
               {generalCats.map(cat => (
                 <button 
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat)}
                   className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                 >
                   <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                     <FileText className="w-6 h-6 text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                   </div>
                   <h4 className="font-bold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white text-center text-[13px] sm:text-[14px] leading-snug line-clamp-2">
                     {cat.name}
                   </h4>
                 </button>
               ))}
               {generalCats.length === 0 && (
                 <div className="col-span-full py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                   មិនទាន់មានបញ្ជីនៅឡើយទេ
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
"""

content = content.replace("  return (\n    <div className=\"flex flex-col h-full", grid_view_code + "    <div className=\"flex flex-col h-full")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
