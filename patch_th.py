import re
import os

files = [
    'src/components/NameLists.tsx',
    'src/components/Records.tsx',
    'src/components/ManageFinancialRecords.tsx'
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace('w-28 text-right', 'w-20 sm:w-28 text-right')
    content = content.replace('w-24 text-right', 'w-16 sm:w-24 text-right')

    with open(filepath, 'w') as f:
        f.write(content)
        
