import re
with open('src/components/ManageFinancialRecords.tsx', 'r') as f:
    content = f.read()

match = re.search(r"const handleSaveRecord = async.*?\n  \};", content, re.DOTALL)
if match:
    print(match.group(0))
