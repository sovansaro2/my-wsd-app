import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

carpet_replacement = """          {selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className="font-bold text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-blue-100/50 p-3 flex flex-col gap-1 border-b border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-700 dark:text-slate-300">ចំណាយទិញព្រំ (១ដុំ 2m x 25m = ៤២ម៉ឺន) ២ដុំ អស់</span>
                   <span className="font-bold text-blue-800">840,000៛</span>
                </div>
              </div>
              <div className="bg-green-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">បច្ច័យនៅសល់</span>
                <span className="font-bold text-green-700">{formatCurrency(totalAmount - 840000)}</span>
              </div>
            </div>
          )}"""

# Replace the old carpet summary with the new one
content = re.sub(
    r"\{selectedCategory\?\.name === 'ទិញកម្រាលព្រំ \(វគ្គ១\)'.*?</div>\s*</div>\s*</div>\s*\)\}",
    carpet_replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
