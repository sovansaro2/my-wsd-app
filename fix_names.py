import re
with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Fix the condition for totalAmount header
content = content.replace("selectedCategory?.name === 'ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ'", "selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ'")
content = content.replace("selectedCategory?.name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១'", "selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)'")
content = content.replace("selectedCategory?.name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២'", "selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ២)'")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
