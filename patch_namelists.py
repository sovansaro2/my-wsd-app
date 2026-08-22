import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Disable add button
if "const isListClosed =" not in content:
    content = content.replace(
        "const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);",
        "const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);\n  const closedLists = ['បញ្ជីឈ្មោះបុណ្យផ្កា', 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ', 'ទិញកម្រាលព្រំ (វគ្គ១)'];\n  const isListClosed = closedLists.includes(selectedCategory?.name || '');\n"
    )

content = content.replace(
    "{userRole === 'admin' && (",
    "{userRole === 'admin' && !isListClosed && ("
)

# Fix summary for បញ្ជីឈ្មោះបុណ្យផ្កា
if "selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា'" not in content:
    summary_html = """          {selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-blue-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className="font-bold text-blue-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
"""
    content = content.replace("          {selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ'", summary_html + "\n          {selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ'")

# Fix summary for name list total amount check
content = content.replace("selectedCategory?.name === 'លុយចងដៃខ្ចី' || selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ'", "selectedCategory?.name === 'លុយចងដៃខ្ចី' || selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា' || selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ'")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
