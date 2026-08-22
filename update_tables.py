import re
import os

files = [
    'src/components/NameLists.tsx',
    'src/components/Records.tsx',
    'src/components/ManageFinancialRecords.tsx'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Remove min-w-[500px]
    content = content.replace(' min-w-[500px]', '')
    content = content.replace('min-w-[500px]', '')

    # 2. Adjust th paddings
    content = re.sub(r'th className="([^"]*)px-4 py-3\.5([^"]*)"', r'th className="\1px-2 sm:px-4 py-2 sm:py-3.5\2"', content)
    
    # 3. Adjust td paddings
    content = re.sub(r'td className="([^"]*)px-4 py-3([^"]*)"', r'td className="\1px-2 sm:px-4 py-2 sm:py-3\2"', content)
    
    # 4. Make action icons/buttons a bit more compact for mobile
    # Find action buttons container
    content = content.replace('flex items-center justify-end gap-1', 'flex items-center justify-end gap-0.5 sm:gap-1')
    content = content.replace('p-1.5 text-', 'p-1 sm:p-1.5 text-')
    content = content.replace('w-[18px] h-[18px]', 'w-4 h-4 sm:w-[18px] sm:h-[18px]')
    content = content.replace('w-4 h-4', 'w-4 h-4 sm:w-[18px] sm:h-[18px]') # normalize if it was w-4 h-4
    
    # 5. Text sizes in NameLists and Records for mobile
    # "font-bold text-[14px] sm:text-[15px]" is already there in some places, which is good.
    # In NameLists: text-[14px] sm:text-[15px]
    content = content.replace('text-[14px] font-bold text-gray-900', 'text-[13px] sm:text-[14px] font-bold text-gray-900')
    content = content.replace('text-[14px] font-bold text-amber-600', 'text-[13px] sm:text-[14px] font-bold text-amber-600')
    
    # Text sizes in th
    content = content.replace('text-[13px] font-bold', 'text-[12px] sm:text-[13px] font-bold')

    # w-12 might be tight, change to w-8 sm:w-12 if possible
    content = content.replace('w-12 text-center', 'w-8 sm:w-12 text-center')
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated {filepath}")
