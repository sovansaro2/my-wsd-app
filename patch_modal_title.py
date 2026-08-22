import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

title_pattern = r"\{editingRecord \? t\('list_edit_title'\) : t\('list_add_title'\)\}"
title_replacement = "{editingRecord ? `${t('list_edit_title')} - ${selectedCategory?.name}` : `${t('list_add_title')} - ${selectedCategory?.name}`}"

content = re.sub(title_pattern, title_replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
